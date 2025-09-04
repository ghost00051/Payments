import passwordImg from '../../img/password.svg'
import '../../css/reset.css'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useState } from 'react'

function ResetPassword () {
  const [searchParams] = useSearchParams()
  const [password, setPassword] = useState('')
  const token = searchParams.get('token')
  const toMain = useNavigate()

  const resetPas = async event => {
    event.preventDefault()
    try {
      const response = await fetch('http://localhost:3000/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          token: token,
          newPassword: password
        })
      })
      const responseData = await response.json()
      console.log('Response Status:', response.status)
      console.log('Response Data:', responseData)
      if (response.ok) {
        toMain('/entrance')
      } else {
        console.log('Ошибка смены пароля')
      }
    } catch (error) {
      console.log('error')
    }
  }

  return (
    <div>
      <p className='header-of-reset'>Сброс пароля</p>
      <form onSubmit={resetPas} className='forms-of-reset'>
        <p className='header-of-forms-reset'>Введите пароль</p>
        <label>
          <img src={passwordImg} alt='Пароль' />
          <input
            type='password'
            onChange={e => setPassword(e.target.value)}
            required
          />
        </label>
        <p className='header-of-forms-reset'>Подтвердите пароль</p>
        <label>
          <img src={passwordImg} alt='Пароль' />
          <input type='password' required />
        </label>
        <button className='button-reset-go-to-server'>Отправить запрос</button>
      </form>
    </div>
  )
}

export default ResetPassword
