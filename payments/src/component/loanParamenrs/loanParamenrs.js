import { useState, useEffect } from 'react'
import '../../css/loan.css'
import { useNavigate } from 'react-router-dom'

function LoanParameters () {
  const [totalAmount, setTotalAmount] = useState('')
  const [paymentsCount, setPaymentsCount] = useState('')
  const [startDate, setStartDate] = useState('')
  const [roundPaymentsTo, setRoundPaymentsTo] = useState('0')
  const [userId, setUserId] = useState(null)

  useEffect(() => {
    const fetchProfile = async () => {
      const user = await getProfile()
      if (user) setUserId(user)
    }
    fetchProfile()
  }, [])

  const getProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch('http://91.223.89.222:30001/profile', {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        mode: 'cors'
      })

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`)
      const data = await response.json()
      return data.user.id
    } catch (error) {
      console.error('Ошибка загрузки профиля:', error)
      return null
    }
  }

  const calculateEndDate = (startDate, monthsToAdd) => {
    const date = new Date(startDate)
    date.setMonth(date.getMonth() + monthsToAdd)
    return date.toISOString().split('T')[0] // Возвращает "YYYY-MM-DD"
  }
  const toMain = useNavigate()

  const handleSubmit = async event => {
    event.preventDefault()
    try {
      if (!userId) throw new Error('Пользователь не авторизован')
      const token = localStorage.getItem('token')
      if (!token) throw new Error('Токен не найден')

      const totalAmountNum = Number(totalAmount)
      const paymentsCountNum = Number(paymentsCount)
      const roundPaymentsToNum = roundPaymentsTo ? Number(roundPaymentsTo) : 0

      if (isNaN(totalAmountNum)) throw new Error('Сумма должна быть числом')
      if (isNaN(paymentsCountNum))
        throw new Error('Количество месяцев должно быть числом')

      const endDate = calculateEndDate(startDate, paymentsCountNum)

      const response = await fetch('http://91.223.89.222:30001/installments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          user_id: userId,
          total_amount: totalAmountNum,
          payments_count: paymentsCountNum,
          start_date: startDate,
          round_payments_to: roundPaymentsToNum, 
          end_date: endDate
        })
      })

      const data = await response.json()
      console.log('Ответ сервера:', data)
      alert('Рассрочка успешно создана!')
      if (response.ok) {
        toMain('/main')
      }
    } catch (error) {
      console.error('Ошибка:', error.message || error)
      alert(error.message || 'Ошибка при создании рассрочки')
    }
  }

  return (
    <div className='perents-of-loan'>
      <p className='header-of-loan'>Введите данные о кредите</p>
      <form className='god-of-form-loan' onSubmit={handleSubmit}>
        <div>
          <label className='description-of-loan'>Сумма кредита: </label>
          <input
            type='number'
            value={totalAmount}
            onChange={e => setTotalAmount(e.target.value)}
            required
          />
        </div>
        <div>
          <label className='description-of-loan'>Количество месяцев: </label>
          <select
            value={paymentsCount}
            onChange={e => setPaymentsCount(e.target.value)}
            required
          >
            {Array.from({ length: 60 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {i + 1}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label>Выберите шаг округления</label>
          <select
          value={roundPaymentsTo}
          onChange={e => setRoundPaymentsTo(e.target.value)}
          required
          >
            <option value={0}>Без округления</option>
            {Array.from({ length: 10 }, (_, i) => {
              const value = 100 + i * 100
              return (
                <option key={value} value={value}>
                  {value}
                </option>
              )
            })}
          </select>
        </div>
        <div>
          <label className='description-of-loan'>Дата начала: </label>
          <input
            type='date'
            value={startDate}
            onChange={e => setStartDate(e.target.value)}
            required
          />
        </div>
        <button type='submit' className='loan-go-to-server'>
          Отправить
        </button>
      </form>
    </div>
  )
}

export default LoanParameters
