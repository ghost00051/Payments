const express = require('express')
const multer = require('multer')
const { Pool } = require('pg')
const path = require('path')
const cors = require('cors')
const fs = require('fs')

require('dotenv').config()
console.log(
  'ENV:',
  process.env.PGDATABASE,
  process.env.PGUSER,
  process.env.PGPASSWORD
)

const app = express()
const PORT = process.env.PORT || 30001;
app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Server is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  })
})


app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.url}`);
  console.log('Protocol:', req.protocol);
  console.log('Secure:', req.secure);
  console.log('X-Forwarded-Proto:', req.headers['x-forwarded-proto']);
  console.log('Origin:', req.headers.origin);
  next();
});

app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://split-fiction.ru',
    'https://split-fiction.ru',
    'http://www.split-fiction.ru',
    'https://www.split-fiction.ru',
    'https://splitfiction.ru'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))


app.use(express.json())
app.use(express.urlencoded({ extended: true }))


const pool = new Pool({
  user: process.env.PGUSER,
  host: process.env.PGHOST,
  database: process.env.PGDATABASE,
  password: process.env.PGPASSWORD,
  port: process.env.PGPORT
})

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.UPLOAD_DIR)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({ storage })
const nodemailer = require('nodemailer')

async function createTables () {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        phone VARCHAR(20) NOT NULL,
        password_hash VARCHAR(255) NOT NULL, -- Хеш пароля
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await pool.query(`
      CREATE TABLE IF NOT EXISTS installments (
        id SERIAL PRIMARY KEY,
        user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        total_amount NUMERIC(10,2) NOT NULL,
        paid_amount NUMERIC(10,2) NOT NULL DEFAULT 0, -- Новый столбец
        payments_count SMALLINT NOT NULL CHECK (payments_count >= 1),
        start_date DATE NOT NULL,
        end_date DATE NOT NULL,
        status VARCHAR(10) NOT NULL DEFAULT 'active' 
          CHECK (status IN ('active', 'completed', 'late')),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `)

    await pool.query(`
     CREATE TABLE IF NOT EXISTS payments (
    id SERIAL PRIMARY KEY,
    installment_id INTEGER NOT NULL REFERENCES installments(id) ON DELETE CASCADE,
    amount NUMERIC(10,2) NOT NULL,
    due_date DATE NOT NULL,
    paid_date DATE DEFAULT NULL,
    status VARCHAR(10) NOT NULL DEFAULT 'pending' 
      CHECK (status IN ('pending', 'paid', 'late')),
    sequence SMALLINT NOT NULL DEFAULT 1 CHECK (sequence >= 0),
    photo_path VARCHAR(255),
    is_fixed BOOLEAN NOT NULL DEFAULT TRUE,
    linked_payment INTEGER DEFAULT NULL REFERENCES payments(id),
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Добавьте эту строку
  );
    `)

    await pool.query(`
  CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    used BOOLEAN DEFAULT false
  );
`)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_installments_user_id 
      ON installments(user_id);
    `)

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_payments_installment_id 
      ON payments(installment_id);
    `)

    console.log('Tables created successfully with password field')
  } catch (error) {
    console.error('Error creating tables:', error)
  }
}

createTables()

async function updatePaymentStatuses (installmentId) {
  try {
    console.log(`Updating payment statuses for installment: ${installmentId}`)
    await pool.query(
      `UPDATE payments 
       SET status = 'late'
       WHERE installment_id = $1 
         AND status = 'pending'
         AND due_date < CURRENT_DATE`,
      [installmentId]
    )

    const payments = await pool.query(
      `SELECT p.id, p.amount, 
              COALESCE(SUM(e.amount), 0) as paid_total
       FROM payments p
       LEFT JOIN payments e ON e.linked_payment = p.id
       WHERE p.installment_id = $1 AND p.is_fixed = TRUE
       GROUP BY p.id, p.amount`,
      [installmentId]
    )

    for (const payment of payments.rows) {
      if (parseFloat(payment.paid_total) >= parseFloat(payment.amount)) {
        await pool.query(
          `UPDATE payments 
           SET status = 'paid', paid_date = CURRENT_DATE
           WHERE id = $1 AND status != 'paid'`,
          [payment.id]
        )
      }
    }
    console.log(
      `Finished updating payment statuses for installment: ${installmentId}`
    )
  } catch (error) {
    console.error('Error updating payment statuses:', error)
  }
}

app.get('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    const result = await pool.query(
      'SELECT id, full_name, email, phone FROM users WHERE id = $1',
      [userId]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      })
    }

    res.status(200).json({
      success: true,
      user: result.rows[0]
    })
  } catch (error) {
    console.error('Ошибка получения профиля:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    })
  }
})

app.post(
  '/payments',
  authenticateToken,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { installment_id, amount } = req.body
      const photo = req.file

      if (!installment_id || !amount || !photo) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const userId = req.user.userId

      const installmentCheck = await pool.query(
        'SELECT id FROM installments WHERE id = $1 AND user_id = $2',
        [installment_id, userId]
      )

      if (installmentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Installment not found' })
      }

      const pendingPayment = await pool.query(
        `SELECT id FROM payments 
         WHERE installment_id = $1 
         AND status IN ('pending', 'late')
         ORDER BY due_date ASC 
         LIMIT 1`,
        [installment_id]
      )

      if (pendingPayment.rows.length === 0) {
        return res
          .status(404)
          .json({ error: 'No pending payments found for this installment' })
      }

      const paymentId = pendingPayment.rows[0].id

      const result = await pool.query(
        `UPDATE payments 
         SET status = 'paid', 
             paid_date = CURRENT_DATE,
             photo_path = $1,
             updated_at = CURRENT_TIMESTAMP
         WHERE id = $2 
         RETURNING *`,
        [photo.path, paymentId]
      )

      await updateInstallmentPaidAmount(installment_id)

      res.status(200).json({
        success: true,
        payment: result.rows[0],
        message: 'Платеж успешно обработан'
      })
    } catch (error) {
      console.error('Error processing payment:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

app.get('/payments', async (req, res) => {
  try {
    const result = await pool.query('SELECT amount, status FROM payments')
    res.status(200).json(result.rows)
  } catch (error) {
    console.error('Error fetching payments:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.get(
  '/payments/installment/:installment_id',
  authenticateToken,
  async (req, res) => {
    try {
      const { installment_id } = req.params
      const userId = req.user.userId

      const installmentCheck = await pool.query(
        'SELECT id FROM installments WHERE id = $1 AND user_id = $2',
        [installment_id, userId]
      )

      if (installmentCheck.rows.length === 0) {
        return res.status(404).json({
          success: false,
          error: 'Рассрочка не найдена'
        })
      }

      const paymentsQuery = `
      SELECT p.* 
      FROM payments p 
      WHERE p.installment_id = $1 
      ORDER BY p.due_date ASC
    `

      const paymentsResult = await pool.query(paymentsQuery, [installment_id])
      let payments = paymentsResult.rows

      const currentDate = new Date()

      for (let payment of payments) {
        const dueDate = new Date(payment.due_date)

        if (payment.status === 'pending' && dueDate < currentDate) {
          const updateQuery = `
          UPDATE payments 
          SET status = 'late'  -- ИЗМЕНИТЕ 'overdue' НА 'late'
          WHERE id = $1 
          RETURNING *
        `

          const updatedPayment = await pool.query(updateQuery, [payment.id])
          payment.status = 'late'
        }
      }

      res.json({
        success: true,
        payments: payments
      })
    } catch (error) {
      console.error('Error fetching payments:', error)
      res.status(500).json({
        success: false,
        message: 'Ошибка при получении платежей'
      })
    }
  }
)

app.post('/installments', authenticateToken, async (req, res) => {
  try {
    const {
      user_id,
      total_amount,
      payments_count,
      start_date,
      end_date,
      round_payments_to
    } = req.body

    if (!user_id || !total_amount || !payments_count || !start_date) {
      return res
        .status(400)
        .json({ error: 'Все обязательные поля должны быть заполнены' })
    }

    if (payments_count <= 0) {
      return res
        .status(400)
        .json({ error: 'Количество платежей должно быть больше 0' })
    }

    const startDate = new Date(start_date)
    let endDate = end_date ? new Date(end_date) : new Date(startDate)

    if (!end_date) {
      endDate.setMonth(startDate.getMonth() + payments_count - 1)
    }

    if (startDate > endDate) {
      return res.status(400).json({
        error: 'Дата начала должна быть раньше или равна дате окончания'
      })
    }

    const installmentResult = await pool.query(
      `INSERT INTO installments 
       (user_id, total_amount, payments_count, start_date, end_date) 
       VALUES ($1, $2, $3, $4, $5) 
       RETURNING *`,
      [user_id, total_amount, payments_count, startDate, endDate]
    )

    const installment = installmentResult.rows[0]
    const installmentId = installment.id

    const paymentPromises = []
    const paymentDay = startDate.getDate()

    const basePaymentAmount = parseFloat(
      (total_amount / payments_count).toFixed(2)
    )

    let roundedBasePayment = basePaymentAmount
    if (round_payments_to && round_payments_to > 0) {
      roundedBasePayment =
        Math.floor(basePaymentAmount / round_payments_to) * round_payments_to
    }

    const payments = []
    let totalCalculated = 0

    for (let i = 0; i < payments_count; i++) {
      const paymentDate = new Date(startDate)
      paymentDate.setMonth(startDate.getMonth() + i)

      const lastDayOfMonth = new Date(
        paymentDate.getFullYear(),
        paymentDate.getMonth() + 1,
        0
      ).getDate()

      const adjustedDay = Math.min(paymentDay, lastDayOfMonth)
      paymentDate.setDate(adjustedDay)

      let amount

      if (round_payments_to && round_payments_to > 0) {
        if (i === payments_count - 1) {
          amount = parseFloat((total_amount - totalCalculated).toFixed(2))
        } else {
          amount = roundedBasePayment
          totalCalculated += amount
        }
      } else {
        amount =
          i === payments_count - 1
            ? parseFloat(
                (
                  total_amount -
                  basePaymentAmount * (payments_count - 1)
                ).toFixed(2)
              )
            : basePaymentAmount
      }

      amount = Math.max(0, parseFloat(amount.toFixed(2)))

      payments.push({
        installmentId,
        amount,
        paymentDate,
        sequence: i + 1
      })
    }

    for (const payment of payments) {
      paymentPromises.push(
        pool.query(
          `INSERT INTO payments 
           (installment_id, amount, due_date, status, sequence, is_fixed) 
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            payment.installmentId,
            payment.amount,
            payment.paymentDate,
            'pending',
            payment.sequence,
            true
          ]
        )
      )
    }

    await Promise.all(paymentPromises)

    const paymentsResult = await pool.query(
      'SELECT * FROM payments WHERE installment_id = $1 ORDER BY due_date ASC',
      [installmentId]
    )

    console.log('Payments with dates:')
    paymentsResult.rows.forEach(payment => {
      console.log(
        `Sequence: ${payment.sequence}, Date: ${payment.due_date}, Amount: ${payment.amount}`
      )
    })

    const totalPayments = paymentsResult.rows.reduce((sum, payment) => {
      return sum + parseFloat(payment.amount)
    }, 0)

    console.log('Total amount:', total_amount)
    console.log('Total payments:', totalPayments)
    console.log('Difference:', parseFloat(total_amount) - totalPayments)
    console.log(
      'Payments sequence:',
      paymentsResult.rows.map(p => p.sequence)
    )

    res.status(201).json({
      ...installment,
      payments: paymentsResult.rows,
      rounding_applied: !!round_payments_to,
      round_step: round_payments_to || null,
      total_payments_sum: totalPayments
    })
  } catch (error) {
    console.error('Ошибка создания рассрочки:', error)
    res.status(500).json({
      error: 'Ошибка сервера',
      details: error.message
    })
  }
})

app.get('/installments/:user_id', async (req, res) => {
  try {
    const { user_id } = req.params

    const result = await pool.query(
      'SELECT id, user_id, total_amount, paid_amount, payments_count, start_date, end_date, status FROM installments WHERE user_id = $1',
      [user_id]
    )

    res.status(200).json(result.rows)
  } catch (error) {
    console.error('Ошибка получения рассрочек:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

app.get('/installments/:id', async (req, res) => {
  try {
    const { id } = req.params

    const result = await pool.query(
      'SELECT * FROM installments WHERE id = $1',
      [id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Рассрочка не найдена' })
    }

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error('Ошибка получения рассрочки:', error)
    res.status(500).json({ error: 'Ошибка сервера' })
  }
})

app.use(express.static(path.join(__dirname, 'client/build')))
const bcrypt = require('bcrypt')
const saltRounds = 10

app.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password } = req.body

    if (!full_name || !email || !phone || !password) {
      return res.status(400).json({
        success: false,
        error: 'Все поля обязательны для заполнения'
      })
    }

    const emailCheck = await pool.query(
      'SELECT id FROM users WHERE email = $1',
      [email]
    )

    if (emailCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Этот email уже зарегистрирован'
      })
    }

    const phoneCheck = await pool.query(
      'SELECT id FROM users WHERE phone = $1',
      [phone]
    )

    if (phoneCheck.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Этот телефон уже зарегистрирован'
      })
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds)

    const result = await pool.query(
      'INSERT INTO users (full_name, email, phone, password_hash) VALUES ($1, $2, $3, $4) RETURNING id, full_name, email, phone',
      [full_name, email, phone, hashedPassword]
    )

    const newUser = result.rows[0]

    const token = jwt.sign(
      {
        userId: newUser.id,
        email: newUser.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    res.status(201).json({
      success: true,
      message: 'Регистрация прошла успешно!',
      user: newUser,
      token
    })
  } catch (error) {
    console.error('Ошибка регистрации:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    })
  }
})

const jwt = require('jsonwebtoken')

app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email и пароль обязательны'
      })
    }

    const userResult = await pool.query(
      'SELECT id, full_name, email, phone, password_hash FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      })
    }

    const user = userResult.rows[0]

    const isPasswordValid = await bcrypt.compare(password, user.password_hash)

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Неверный email или пароль'
      })
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    )

    const userData = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      phone: user.phone
    }

    res.status(200).json({
      success: true,
      message: 'Вход выполнен успешно',
      token,
      user: userData
    })
  } catch (error) {
    console.error('Ошибка входа:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера',
      details: error.message
    })
  }
})
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization']
  
  if (!authHeader) {
    return res.status(401).json({
      success: false,
      error: 'Требуется аутентификация'
    })
  }
  
  const token = authHeader.split(' ')[1]
  
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Неверный формат токена'
    })
  }
  
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({
        success: false,
        error: 'Недействительный токен'
      })
    }
    
    req.user = user
    next()
  })
}

app.put('/payments/:id/status', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params
    const { status } = req.body

    if (!status || !['pending', 'paid', 'late'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }

    const paymentResult = await pool.query(
      'SELECT installment_id, amount FROM payments WHERE id = $1',
      [id]
    )

    if (paymentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found' })
    }

    const installmentId = paymentResult.rows[0].installment_id
    const paymentAmount = paymentResult.rows[0].amount

    const result = await pool.query(
      `UPDATE payments 
       SET status = $1, 
           paid_date = CASE WHEN $1 = 'paid' THEN CURRENT_DATE ELSE NULL END,
           updated_at = CURRENT_TIMESTAMP 
       WHERE id = $2 
       RETURNING *`,
      [status, id]
    )

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Payment not found after update' })
    }

    await updateInstallmentPaidAmount(installmentId)

    res.status(200).json(result.rows[0])
  } catch (error) {
    console.error('Error updating payment status:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
})

app.put(
  '/payments/:id/photo',
  authenticateToken,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { id } = req.params
      const photo = req.file

      if (!photo) {
        return res.status(400).json({ error: 'Photo is required' })
      }

      const result = await pool.query(
        `UPDATE payments 
         SET photo_path = $1, updated_at = CURRENT_TIMESTAMP 
         WHERE id = $2 
         RETURNING *`,
        [photo.path, id]
      )

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Payment not found' })
      }

      res.status(200).json(result.rows[0])
    } catch (error) {
      console.error('Error updating payment photo:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

async function updateInstallmentPaidAmount (installmentId) {
  try {
    await updatePaymentStatuses(installmentId)

    const sumResult = await pool.query(
      `SELECT COALESCE(SUM(amount), 0) as total_paid 
       FROM payments 
       WHERE installment_id = $1 AND status = 'paid'`,
      [installmentId]
    )

    const totalPaid = parseFloat(sumResult.rows[0].total_paid)

    await pool.query(
      `UPDATE installments 
       SET paid_amount = $1 
       WHERE id = $2`,
      [totalPaid, installmentId]
    )

    const installmentResult = await pool.query(
      `SELECT total_amount FROM installments WHERE id = $1`,
      [installmentId]
    )

    if (installmentResult.rows.length > 0) {
      const totalAmount = parseFloat(installmentResult.rows[0].total_amount)
      if (totalPaid >= totalAmount) {
        await pool.query(
          `UPDATE installments 
           SET status = 'completed' 
           WHERE id = $1`,
          [installmentId]
        )

        await pool.query(
          `UPDATE payments 
           SET status = 'paid', paid_date = CURRENT_DATE
           WHERE installment_id = $1 AND status != 'paid'`,
          [installmentId]
        )
      }
    }

    return totalPaid
  } catch (error) {
    console.error('Error updating installment paid amount:', error)
    throw error
  }
}

app.put(
  '/installments/:id/paid-amount',
  authenticateToken,
  async (req, res) => {
    try {
      const { id } = req.params
      const { paid_amount } = req.body

      if (paid_amount === undefined || paid_amount === null) {
        return res.status(400).json({ error: 'paid_amount is required' })
      }

      const amount = parseFloat(paid_amount)

      const installmentResult = await pool.query(
        'SELECT total_amount FROM installments WHERE id = $1',
        [id]
      )

      if (installmentResult.rows.length === 0) {
        return res.status(404).json({ error: 'Installment not found' })
      }

      const totalAmount = parseFloat(installmentResult.rows[0].total_amount)

      if (amount > totalAmount) {
        return res.status(400).json({
          error: 'Paid amount cannot be greater than total amount'
        })
      }

      const result = await pool.query(
        `UPDATE installments 
       SET paid_amount = $1,
           status = CASE 
             WHEN $1 >= total_amount THEN 'completed' 
             ELSE status 
           END
       WHERE id = $2 
       RETURNING *`,
        [amount, id]
      )

      res.status(200).json(result.rows[0])
    } catch (error) {
      console.error('Error updating paid amount:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)

const transporter = nodemailer.createTransport({
  host: 'smtp.mail.ru',
  port: 465,
  secure: true,
  auth: {
    user: 'yvan03@bk.ru',
    pass: 'mcVsZXCtqGAmkRySm3Qs'
  },
  tls: {
    rejectUnauthorized: false
  },
  logger: true,
  debug: true
})

transporter.verify((error, success) => {
  if (error) {
    console.error('Ошибка подключения к SMTP:', error)
  } else {
    console.log('SMTP сервер готов к отправке')
  }
})

app.post('/forgot-password', async (req, res) => {
  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email обязателен'
      })
    }

    const userResult = await pool.query(
      'SELECT id, full_name, password_hash FROM users WHERE email = $1',
      [email]
    )

    if (userResult.rows.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'Если email существует, письмо отправлено'
      })
    }

    const user = userResult.rows[0]
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET + user.password_hash,
      { expiresIn: '1h' }
    )

    await pool.query(
      `INSERT INTO password_reset_tokens 
       (user_id, token, expires_at) 
       VALUES ($1, $2, $3)`,
      [user.id, token, new Date(Date.now() + 3600000)]
    )

    const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${token}`

    await transporter.sendMail({
      from: '"Сервис рассрочек" <yvan03@bk.ru>',
      to: email,
      subject: 'Сброс пароля',
      html: `
        <p>Здравствуйте, ${user.full_name},</p>
        <p>Вы запросили сброс пароля. Нажмите на ссылку ниже, чтобы продолжить:</p>
        <p><a href="${resetLink}">Сбросить пароль</a></p>
        <p>Ссылка действительна в течение 1 часа.</p>
        <p>Если вы не запрашивали сброс пароля, проигнорируйте это письмо.</p>
      `
    })

    res.status(200).json({
      success: true,
      message: 'Если email существует, письмо отправлено'
    })
  } catch (error) {
    console.error('Ошибка при запросе сброса пароля:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    })
  }
})

app.post('/validate-reset-token', async (req, res) => {
  try {
    const { token } = req.body

    const tokenResult = await pool.query(
      `SELECT user_id, expires_at, used 
       FROM password_reset_tokens 
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    )

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Недействительная или просроченная ссылка'
      })
    }

    res.status(200).json({
      success: true,
      message: 'Токен действителен'
    })
  } catch (error) {
    console.error('Ошибка при проверке токена:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    })
  }
})

app.post('/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body

    const tokenResult = await pool.query(
      `SELECT user_id, expires_at, used 
       FROM password_reset_tokens 
       WHERE token = $1 AND used = false AND expires_at > NOW()`,
      [token]
    )

    if (tokenResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Недействительная или просроченная ссылка'
      })
    }

    const tokenData = tokenResult.rows[0]

    const userResult = await pool.query(
      'SELECT id, password_hash FROM users WHERE id = $1',
      [tokenData.user_id]
    )

    if (userResult.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Пользователь не найден'
      })
    }

    try {
      jwt.verify(
        token,
        process.env.JWT_SECRET + userResult.rows[0].password_hash
      )
    } catch (err) {
      return res.status(400).json({
        success: false,
        error: 'Недействительный токен'
      })
    }

    const hashedPassword = await bcrypt.hash(newPassword, saltRounds)

    await pool.query('UPDATE users SET password_hash = $1 WHERE id = $2', [
      hashedPassword,
      tokenData.user_id
    ])

    await pool.query(
      'UPDATE password_reset_tokens SET used = true WHERE token = $1',
      [token]
    )

    res.status(200).json({
      success: true,
      message: 'Пароль успешно изменен'
    })
  } catch (error) {
    console.error('Ошибка при сбросе пароля:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    })
  }
})

app.post(
  '/extra-payments',
  authenticateToken,
  upload.single('photo'),
  async (req, res) => {
    try {
      const { installment_id, amount } = req.body
      const photo = req.file
      const userId = req.user.userId

      if (!installment_id || !amount || !photo) {
        return res.status(400).json({ error: 'Missing required fields' })
      }

      const installmentCheck = await pool.query(
        'SELECT id FROM installments WHERE id = $1 AND user_id = $2',
        [installment_id, userId]
      )

      if (installmentCheck.rows.length === 0) {
        return res.status(404).json({ error: 'Installment not found' })
      }

      const paymentAmount = parseFloat(amount)
    } catch (error) {
      console.error('Error processing extra payment:', error)
      res.status(500).json({ error: 'Internal server error' })
    }
  }
)
app.get('/payments/history', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId

    const historyQuery = `
      SELECT 
        p.id,
        p.amount,
        p.due_date,
        p.paid_date,
        p.status,
        p.photo_path,
        p.sequence,
        i.id as installment_id,
        i.total_amount as installment_total
      FROM payments p
      INNER JOIN installments i ON p.installment_id = i.id
      WHERE i.user_id = $1 
        AND p.status = 'paid'
        AND p.paid_date IS NOT NULL
      ORDER BY p.paid_date DESC
    `

    const result = await pool.query(historyQuery, [userId])

    const paymentsWithCorrectDates = result.rows.map(payment => {
      const dueDate = new Date(payment.due_date)
      const paidDate = new Date(payment.paid_date)

      const localDueDate = new Date(dueDate.getTime() + 3 * 60 * 60 * 1000)
      const localPaidDate = new Date(paidDate.getTime() + 3 * 60 * 60 * 1000)

      return {
        ...payment,
        due_date: localDueDate.toISOString().split('T')[0],
        paid_date: localPaidDate.toISOString().split('T')[0]
      }
    })

    res.status(200).json({
      success: true,
      payments: paymentsWithCorrectDates,
      total_count: result.rows.length
    })
  } catch (error) {
    console.error('Error fetching payment history:', error)
    res.status(500).json({
      success: false,
      error: 'Ошибка при получении истории платежей'
    })
  }
})

app.get('/download/:filename', authenticateToken, (req, res) => {
  try {
    const { filename } = req.params
    const filePath = path.join(process.env.UPLOAD_DIR, filename)

    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'Файл не найден' })
    }

    res.download(filePath, `чек_${filename}`)
  } catch (error) {
    console.error('Error downloading file:', error)
    res.status(500).json({ error: 'Ошибка загрузки файла' })
  }
})


app.put('/profile', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { full_name, email, phone } = req.body;

    const userResult = await pool.query(
      'SELECT id, full_name, email, phone FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Пользователь не найден'
      });
    }

    const currentUser = userResult.rows[0];
    const updates = [];
    const values = [];
    let paramCount = 1;

    if (full_name !== undefined && full_name !== currentUser.full_name) {
      updates.push(`full_name = $${paramCount}`);
      values.push(full_name);
      paramCount++;
    }

    if (email !== undefined && email !== currentUser.email) {
      const emailCheck = await pool.query(
        'SELECT id FROM users WHERE email = $1 AND id != $2',
        [email, userId]
      );

      if (emailCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Этот email уже используется другим пользователем'
        });
      }

      updates.push(`email = $${paramCount}`);
      values.push(email);
      paramCount++;
    }

    if (phone !== undefined && phone !== currentUser.phone) {
      const phoneCheck = await pool.query(
        'SELECT id FROM users WHERE phone = $1 AND id != $2',
        [phone, userId]
      );

      if (phoneCheck.rows.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Этот телефон уже используется другим пользователем'
        });
      }

      updates.push(`phone = $${paramCount}`);
      values.push(phone);
      paramCount++;
    }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Нет данных для обновления'
      });
    }

    values.push(userId);
    
    const updateQuery = `
      UPDATE users 
      SET ${updates.join(', ')}
      WHERE id = $${paramCount}
      RETURNING id, full_name, email, phone
    `;

    const result = await pool.query(updateQuery, values);

    res.status(200).json({
      success: true,
      message: 'Данные успешно обновлены',
      user: result.rows[0]
    });

  } catch (error) {
    console.error('Ошибка обновления профиля:', error);
    res.status(500).json({
      success: false,
      error: 'Ошибка сервера'
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running on port ${PORT}`)
  console.log(`🌐 Local: http://localhost:${PORT}`)
  console.log(`🌐 Network: http://${getLocalIp()}:${PORT}`)
  console.log(`🌐 External: http://91.223.88.222:${PORT}`)
})

function getLocalIp() {
  const interfaces = require('os').networkInterfaces()
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address
      }
    }
  }
  return '127.0.0.1'
}