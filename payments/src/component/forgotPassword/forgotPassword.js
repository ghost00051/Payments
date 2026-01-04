import emailSvg from '../../img/email.svg'
import { useState } from 'react'
import '../../css/forgot.css'

function Forgot () {
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const API_URL = 'https://split-fiction.ru';

  const forgot = async event => {
    event.preventDefault()
    setIsLoading(true)
    setMessage('')

    try {
      const response = await fetch(`${API_URL}/forgot-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email })
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Ошибка сервера')
      }
      setMessage(data.message || 'Письмо отправлено на вашу почту')
    } catch (error) {
      console.error('Error:', error)
      setMessage(error.message || 'Произошла ошибка при отправке запроса')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div>
      <p className='header-of-forgot'>Сброс пароля</p>
      <div>
        <form className='forms-forgot' onSubmit={forgot}>
          <label className='input-for-email-forgot'>
            <img src={emailSvg} alt='почта' />
            <input
              onChange={e => setEmail(e.target.value)}
              type='email'
              name='email'
              required
              disabled={isLoading}
              value={email}
            />
          </label>
          <button
            className='forgot-go-to-server'
            type='submit'
            disabled={isLoading}
          >
            {isLoading ? 'Отправка...' : 'Отправить письмо на почту'}
          </button>
        </form>
        {message && <div className='message'>{message}</div>}
      </div>
    </div>
  )
}

export default Forgot
