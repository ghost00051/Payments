import { useState, useEffect } from 'react'
import './App.css'
import face from './img/Shape.jpeg'
import closeEyes from './img/close-eyes.svg'
import openEyes from './img/open-eyes.svg'
import emailSvg from './img/email.svg'
import telefon from './img/telefon.svg'
import { useNavigate } from 'react-router-dom'

function App () {
  const navigation = useNavigate()
  const entrance = useNavigate()
  const forgot = useNavigate()
  const [helloClass, setHelloClass] = useState('Hello')
  const [introClass, setIntroClass] = useState('lets-g')
  const [Weikup, setWeikup] = useState('Weikup')
  const [passwordType, setPasswordType] = useState('password')
  const [secpasswordType, setSecpasswordType] = useState('password')
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const normalizedText1 = text1.trim().toLowerCase()
  const normalizedText2 = text2.trim().toLowerCase()
  const [noColor, setColor] = useState('password-img')
  const [phoneNum, setPhoneNum] = useState('+7 ')

  useEffect(() => {
    if (normalizedText1 === normalizedText2 && normalizedText1 !== '') {
      setColor('password-img swi')
    } else {
      setColor('password-img')
    }
  }, [normalizedText1, normalizedText2])

  useEffect(() => {
    const helloTimeout = setTimeout(() => {
      setHelloClass('Hello remove')
    }, 1000)

    const introTimeout = setTimeout(() => {
      setIntroClass('lets-g add')
    }, 3000)

    const Weikup = setTimeout(() => {
      setWeikup('Weikup explation')
    }, 8000)

    return () => {
      clearTimeout(helloTimeout)
      clearTimeout(introTimeout)
      clearTimeout(Weikup)
    }
  }, [])

  const togglepassword = () => {
    setPasswordType(passwordType === 'password' ? 'text' : 'password')
  }

  const secTogglepassword = () => {
    setSecpasswordType(secpasswordType === 'password' ? 'text' : 'password')
  }

  const reload = () => {
    entrance('/entrance')
  }

  const goForgot = () => {
    forgot('/forgot')
  }

  const formatPhoneNumber = value => {
    const cleaned = value.replace(/\D/g, '')
    const limited = cleaned.slice(0, 11)
    let formattedValue = '+7 '
    if (limited.length > 1) {
      const areaCode = limited.slice(1, 4)
      const firstPart = limited.slice(4, 7)
      const secondPart = limited.slice(7, 9)
      const theirdPart = limited.slice(9, 11)
      if (areaCode) {
        formattedValue += `(${areaCode})`
        if (firstPart) {
          formattedValue += ` ${firstPart}`
          if (secondPart) {
            formattedValue += ` ${secondPart}`
            if (theirdPart) {
              formattedValue += ` ${theirdPart}`
            }
          }
        }
      }
    }
    return formattedValue
  }

  const handleChange = e => {
    const input = e.target.value
    if (input.length < 3) {
      setPhoneNum('+7 ')
      return
    }
    setPhoneNum(formatPhoneNumber(input))
  }

  const handleKeyDown = e => {
    if (e.key === 'Backspace' && phoneNum.length <= 3) {
      e.preventDefault()
    }
  }

  const [full_name, setFull_name] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')

  const registration = async event => {
    event.preventDefault()
    try {
      const response = await fetch('http://91.223.89.222/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name,
          email,
          phone,
          password
        })
      })
      const responseData = await response.json()
      console.log('Response Status:', response.status)
      console.log('Response Data:', responseData)
      if (response.ok) {
        localStorage.setItem('token', responseData.token)
        navigation('/loanParamenrs')
      } else {
        console.log('Ошибка регистрации')
      }
    } catch (error) {
      console.log('error')
    }
  }

  return (
    <div className='App'>
      <p id='Hello' className={helloClass}>
        Привет!
      </p>
      <p id='lets-get' className={introClass}>
        Давай познакомимся!
      </p>
      <div id='Weikup' className={Weikup}>
        <p className='header-of-form'>Регистрация</p>
        <form onSubmit={registration}>
          <label className='name'>
            <img src={face} alt='Лицо' />
            <input
              type='text'
              name='name'
              value={full_name}
              onChange={e => setFull_name(e.target.value)}
              autoComplete='name'
              required
            />
          </label>
          <label className='email'>
            <img src={emailSvg} alt='почта' />
            <input
              type='email'
              name='email'
              onChange={e => setEmail(e.target.value)}
              required
            />
          </label>
          <label className='password'>
            <svg
              className={noColor}
              width='16.000000'
              height='16.000000'
              viewBox='0 0 16 16'
              fill='none'
            >
              <defs />
              <path
                id='Shape'
                d='M12 7L13.96 7C14.51 7 15 7.35 15 7.9L15 14.81C15 15.35 14.51 16 13.96 16L1.95996 16C1.41003 16 1 15.35 1 14.81L1 7.9C1 7.35 1.41003 7 1.95996 7L4 7L4 3.95C4 1.77 5.79004 0 8 0C10.21 0 12 1.77 12 3.95L12 7ZM6 3.95L6 7L10 7L10 3.95C10 2.86 9.09998 1.98 8 1.98C6.90002 1.98 6 2.86 6 3.95Z'
                clipRule='evenodd'
                fillOpacity='1.000000'
                fillRule='evenodd'
              />
            </svg>
            <input
              id='first-input-of-switch'
              type={passwordType}
              name='password'
              autoComplete='current-password'
              onChange={e => {
                setText1(e.target.value)
                setPassword(e.target.value)
              }}
              required
            />
            <img
              onClick={togglepassword}
              className={`closeEyes ${
                passwordType === 'password' ? 'active' : ''
              }`}
              src={closeEyes}
              alt='Лицо'
              id='closeEyes'
            />
            <img
              onClick={togglepassword}
              className={`openEyes ${passwordType === 'text' ? 'active' : ''}`}
              src={openEyes}
              alt='Лицо'
            />
          </label>
          <label className='check-password'>
            <svg
              className={noColor}
              width='16.000000'
              height='16.000000'
              viewBox='0 0 16 16'
              fill='none'
            >
              <defs />
              <path
                id='Shape'
                d='M12 7L13.96 7C14.51 7 15 7.35 15 7.9L15 14.81C15 15.35 14.51 16 13.96 16L1.95996 16C1.41003 16 1 15.35 1 14.81L1 7.9C1 7.35 1.41003 7 1.95996 7L4 7L4 3.95C4 1.77 5.79004 0 8 0C10.21 0 12 1.77 12 3.95L12 7ZM6 3.95L6 7L10 7L10 3.95C10 2.86 9.09998 1.98 8 1.98C6.90002 1.98 6 2.86 6 3.95Z'
                clipRule='evenodd'
                fillOpacity='1.000000'
                fillRule='evenodd'
              />
            </svg>
            <input
              type={secpasswordType}
              name='password'
              onChange={e => setText2(e.target.value)}
              required
            />
            <img
              onClick={secTogglepassword}
              id='closeEyes2'
              src={closeEyes}
              alt='Лицо'
              className={`closeEyes2 ${
                passwordType === 'password' ? 'active' : ''
              }`}
            />
            <img
              className={`openEyes2 ${passwordType === 'text' ? 'active' : ''}`}
              onClick={secTogglepassword}
              src={openEyes}
              alt='Лицо'
            />
          </label>
          <label className='telefon'>
            <img src={telefon} alt='телефон' />
            <input
              value={phoneNum}
              onChange={e => {
                handleChange(e)
                setPhone(e.target.value)
              }}
              onKeyDown={handleKeyDown}
              type='tel'
              name='telefon'
              required
              placeholder='+7 (___) ___ __ __'
              maxLength={18}
            />
          </label>
          <div className='link-another'>
            <p onClick={goForgot}>Забыли пароль?</p>
            <p onClick={reload}>Войти</p>
          </div>
          <button
            type='submit'
            className='data-go-to-server'
            //  onClick={handleRegistrationClick}
          >
            Зарегестрироваться
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
