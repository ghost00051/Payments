import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence, press } from 'framer-motion'
import '../../css/home.css'
import calendari from '../../img/calendari.svg'
import maxim from '../../img/maximaze.svg'
import minimize from '../../img/minimaze.svg'
import goToPayments from '../../img/goToPayments.svg'
import crossForm from '../../img/cross.svg'

function Home () {
  const [item, setItem] = useState(null)
  const [debest, setDebest] = useState(null)
  const [minusamount, setMinusAmount] = useState(0)
  const [totalamount, setTotalamount] = useState(0)
  const [datevision, setDatevision] = useState('Нет данных')
  const [sumarpayments, setSumarpeyments] = useState(0)
  const [allsumarpayments, setAllsumatpayments] = useState(0)
  const [installmens, setInstallmens] = useState([])
  const [visibleCount, setVisibleCount] = useState(4)
  const [isExpanded, setIsExpanded] = useState(false)
  const [amount, setAmount] = useState('')
  const [due_date, setDue_date] = useState('')
  const [photo, setPhoto] = useState(null)
  const fileInputRef = useRef(null)
  const [paymentProgress, setPaymentProgress] = useState(0)
  const [showModal, setShowModal] = useState(false)

  const handleBlur = () => {
    setShowModal(false)
  }

  const getProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://91.223.89.222/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()
      return data.user.id
    } catch (error) {
      console.error('Error fetching profile:', error)
      alert('Ошибка при загрузке профиля')
      return null
    }
  }

  const getCredit = async userId => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://91.223.89.222/installments/${userId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const dataArray = await response.json()

      const activeInstallmens = dataArray.find(item => item.status === 'active')
      if (activeInstallmens) {
        setTotalamount(activeInstallmens.total_amount)
        setDebest(activeInstallmens.id)
        setItem(activeInstallmens)
        console.log(activeInstallmens)
        await getPayments(activeInstallmens.id)
        return activeInstallmens.id
      } else {
        console.log('No active installmens found')
        return null
      }
    } catch (error) {
      console.error('Error fetching credit:', error)
      return null
    }
  }

  const getPayments = async datainstel => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://91.223.89.222/payments/installment/${datainstel}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include',
          mode: 'cors'
        }
      )

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      const data = await response.json()

      const payments = data.payments || []

      const installmensData = payments.filter(payment => {
        return payment.status === 'pending' || payment.status === 'late'
      })

      setInstallmens(installmensData)

      const firstUnpaid = payments.find(payment => {
        return payment.status === 'pending' || payment.status === 'late'
      })

      const finalFirstdate = firstUnpaid?.due_date
        ? new Date(firstUnpaid.due_date).toLocaleDateString('ru-RU')
        : 'Нет данных'

      setAllsumatpayments(payments.length)
      setSumarpeyments(installmensData.length)
      setDatevision(finalFirstdate)

      const paidAmount = payments.reduce((sum, payment) => {
        return payment.status === 'paid'
          ? sum + parseFloat(payment.amount)
          : sum
      }, 0)
      console.log(data)
      setMinusAmount(paidAmount)
    } catch (error) {
      console.error('Error fetching payments:', error)
      return null
    }
  }

  const getToPayments = async event => {
    event.preventDefault()
    try {
      const token = localStorage.getItem('token')
      const formData = new FormData()
      formData.append('installment_id', debest)
      formData.append('amount', amount)
      formData.append('due_date', due_date)
      formData.append('photo', photo)

      const response = await fetch('http://91.223.89.222/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`
        },
        credentials: 'include',
        mode: 'cors',
        body: formData
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setItem(prev => ({
        ...prev,
        total_amount: prev.total_amount - parseFloat(amount)
      }))
      await getPayments(debest)
    } catch (error) {
      console.error('Error submitting payment:', error)
    }
  }

  const toggleExpand = () => {
    if (visibleCount >= installmens.length) {
      setVisibleCount(4)
    } else {
      setVisibleCount(prev => Math.min(prev + 4, installmens.length))
    }
  }

  useEffect(() => {
    const fetchData = async () => {
      const userId = await getProfile()
      if (userId) {
        await getCredit(userId)
      }
    }
    fetchData()
  }, [])

  useEffect(() => {
    if (totalamount > 0 && minusamount >= 0) {
      const percentage = Math.min((minusamount / totalamount) * 100, 100)
      setPaymentProgress(percentage)
    } else {
      setPaymentProgress(0)
    }
  }, [totalamount, minusamount])

  return (
    <div className='home-container'>
      <div className='perents-of-home'>
        <p>Рассрочка</p>
      </div>

      <div className='flex-perents'>
        <p className='perents-of-sum-payments'>Оставшиеся сумма</p>
        <p className='sum-payments'>
          {item ? (item.total_amount - minusamount).toFixed(2) : 'Нет данных'}₽
        </p>
        <div className='progress-bar'>
          <div
            className='progress-fill'
            style={{ width: `${paymentProgress}%` }}
          ></div>
          <div className='progress-percentage'>
            {paymentProgress.toFixed(0)}%
          </div>
        </div>
      </div>

      <div className='calendari-of-next-payments'>
        <div>
          <p>Следующий платеж</p>
          <img src={calendari} alt='календарь' />
        </div>
        <p className='date-vision'>{datevision}</p>
      </div>

      <div>
        <div>
          <p className='payment-schedule'>График платежей</p>
          <div className='god-of-counter'>
            <p className='header-of-god-of-counter'>Осталось платежей</p>
            <div className='counter-payments'>
              <p>{sumarpayments}</p>
              <p>/{allsumarpayments}</p>
            </div>
          </div>

          <div className='installmens-container'>
            <AnimatePresence>
              {installmens.slice(0, visibleCount).map((installment, index) => (
                <motion.div
                  key={installment.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                  className={`installment-item item-${installment.id}`}
                >
                  <div>
                    <p className='number-of-payment'>{index + 1}-й платеж</p>
                    <p className='amount-of-payment'>{installment.amount} ₽</p>
                  </div>
                  <p className='date-of-payment'>
                    {new Date(installment.due_date).toLocaleDateString()}
                  </p>
                </motion.div>
              ))}
            </AnimatePresence>

            {installmens.length > 4 && (
              <motion.button
                onClick={toggleExpand}
                className='toggle-button'
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isExpanded ? (
                  <>
                    <p className='minimize'>Скрыть</p>
                    <motion.img
                      src={minimize}
                      alt='Скрыть'
                      animate={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    />
                  </>
                ) : (
                  <>
                    <p className='maximaze'>Показать еще</p>
                    <motion.img
                      src={maxim}
                      alt='Показать еще'
                      animate={{ rotate: 180 }}
                      transition={{ duration: 0.3 }}
                    />
                  </>
                )}
              </motion.button>
            )}
          </div>
        </div>
      </div>
      <div>
        <button
          className='button-vision-go-to-payments'
          onClick={() => setShowModal(true)}
        >
          <p>Внести платеж</p>
          <img src={goToPayments} alt='Go-to-Paymentd' />
        </button>
      </div>

      <AnimatePresence>
        {showModal && (
          <motion.div
            className='last-form-for-home'
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <motion.form
              className='go-to-server-payments-main'
              onSubmit={getToPayments}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.3 }}
            >
              <div className='close-for-go-to-server-payments-main'>
                <img onClick={handleBlur} src={crossForm} alt='закрыть' />
              </div>
              <div className='labels-form-go-to-server-payments-main'>
                <label>
                  <p className='header-of-form-get-to-payments header-of-form-get-to-payments-1'>
                    Введите сумму
                  </p>
                  <input
                    className='number-of-form-get-to-payments'
                    type='number'
                    onChange={e => setAmount(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p className='header-of-form-get-to-payments date-header-of-form-get-to-payments'>
                    Выберите дату
                  </p>
                  <input
                    className='date-of-form-get-to-payments'
                    type='date'
                    onChange={e => setDue_date(e.target.value)}
                    required
                  />
                </label>
                <label>
                  <p className='header-of-form-get-to-payments'>
                    Загрузите чек
                  </p>
                  <input
                    className='file-of-form-get-to-payments'
                    type='file'
                    onChange={e => setPhoto(e.target.files[0])}
                    setPhoto
                    ref={fileInputRef}
                    required
                  />
                </label>
              </div>
              <div className='button-form-go-to-server-payments'>
                <button type='submit'>Отправить</button>
              </div>
            </motion.form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default Home
