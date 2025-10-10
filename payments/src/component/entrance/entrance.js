import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import '../../css/entrance.css'
import emailsvg from '../../img/email.svg'
import closeEyes from '../../img/close-eyes.svg'
import openEyes from '../../img/open-eyes.svg'
import passwordsvg from '../../img/password.svg'

function Entrance () {
  const resPass = useNavigate()
  const reg = useNavigate()
  const [passwordType, setPasswordType] = useState('password')
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const toHome = useNavigate()
  const toLoan = useNavigate()

  const togglepassword = () => {
    setPasswordType(passwordType === 'password' ? 'text' : 'password')
  }

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const userId = await getProfile()
  //     if (userId) {
  //       await getinstallments(userId)
  //     }
  //   }
  //   fetchData()
  // }, [])

  const entrance = async event => {
    event.preventDefault()
    try {
      const serv = await fetch('http://91.223.89.222:30001/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          email,
          password
        })
      })
      const servData = await serv.json()
      console.log('Response Status:', serv.status)
      console.log('Response Data:', servData)
      if (serv.ok) {
        localStorage.setItem('token', servData.token)
        const userId = await getProfile()

        if (userId) {
          const installmentsData = await getinstallments(userId)
          const numberOfInstallmens = installmentsData
            ? installmentsData.length
            : 0
          localStorage.setItem('installmentsCount', numberOfInstallmens)
          console.log(`Количество кредитов: ${numberOfInstallmens}`)
          if (numberOfInstallmens >= 1) {
            toHome('/main')
          } else {
            toLoan('/loanParamenrs')
          }
        }
      } else {
        console.log('Ошибка входа:', servData.message)
      }
    } catch (error) {
      console.log('error')
    }
  }

  const registration = () => {
    reg('/')
  }

  const resetPassword = () => {
    resPass('/forgot')
  }

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

  const getinstallments = async userId => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(
        `http://91.223.89.222:30001/installments/${userId}`,
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
      console.log('Данные о кредитах:', data)
      return data
    } catch (error) {
      console.error('Error fetching credit:', error)
      return null
    }
  }

  return (
    <div className='perents-for-entrance'>
      <p className='header-of-entrance'>Вход</p>
      <form onSubmit={entrance}>
        <label className='email-entrance'>
          <img src={emailsvg} alt='Email' />
          <input
            type='email'
            name='email'
            onChange={e => setEmail(e.target.value)}
          />
        </label>
        <label className='password-entrance'>
          <img
            className='img-for-entarnce'
            src={passwordsvg}
            alt='Фото пароля'
          />
          <input
            type={passwordType}
            id='first-input-of-switch'
            name='password'
            autoComplete='current-password'
            required
            onChange={e => setPassword(e.target.value)}
          />
          <img
            className={`closeEyesEntr ${
              passwordType === 'password' ? 'active' : ''
            }`}
            src={closeEyes}
            alt='Лицо'
            id='closeEyes'
            onClick={togglepassword}
          />
          <img
            className={`openEyesEntr ${
              passwordType === 'text' ? 'active' : ''
            }`}
            src={openEyes}
            alt='Лицо'
            onClick={togglepassword}
          />
        </label>
        <div className='link-another'>
          <p onClick={resetPassword}>Забыли пароль?</p>
          <p onClick={registration}>Регистрация</p>
        </div>
        <button type='submit' className='go-to-server-entrance'>
          Войти
        </button>
      </form>
    </div>
  )
}

export default Entrance
