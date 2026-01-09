import { AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'
import download from '../../img/download.svg'
import '../../css/history.css'

function History () {
  const [historyVis, setHistoryVis] = useState([])
  const API_URL = 'https://split-fiction.ru';

  const getInstallmens = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `${API_URL}/payments/history`,
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
        throw new Error(`HTTP error! status:${response.status}`)
      }
      const data = await response.json()
      const histories = data.payments || []
      const historyData = histories
      setHistoryVis(historyData)
      console.log(data)
    } catch (error) {
      console.error('Error fetching profile:', error)
      return null
    }
  }

  const downloadReceipt = async photoPath => {
    try {
      const token = localStorage.getItem('token')

      const filename = photoPath.split('\\').pop()
      const downloadUrl = `${API_URL}/download/${filename}`

      const response = await fetch(downloadUrl, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`
        }
      })

      if (!response.ok) {
        throw new Error('Ошибка загрузки файла')
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `чек_${filename}`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Ошибка скачивания чека:', error)
      alert('Не удалось скачать чек')
    }
  }

  useEffect(() => {
    getInstallmens()
  }, [])

  return (
    <div>
      <p className='headersOfPages'>Внесенные платежи</p>
      <div className='godOfHistory'>
        <div className='colName'>
          <p>Номер</p>
          <p>Дата</p>
          <p>Сумма</p>
          <p>Чек</p>
        </div>
        <div className='historyOfPayments'>
          <AnimatePresence>
            {historyVis.map((histories, index) => (
              <div
                className={`history-item item-${histories.sequence}`}
                key={histories.id}
              >
                <p className='number-of-history'>{index + 1}</p>
                <p className='date-of-history'>
                  {new Date(histories.due_date).toLocaleDateString('ru-RU')}
                </p>
                <p className='amount-of-history'>{histories.amount}₽</p>
                {histories.photo_path && (
                  <button onClick={() => downloadReceipt(histories.photo_path)}>
                    <img src={download} alt='Скачать' />
                  </button>
                )}
              </div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}
export default History
