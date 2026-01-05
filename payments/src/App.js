import { useState, useEffect, useCallback } from 'react'
import './App.css'
import face from './img/Shape.jpeg'
import closeEyes from './img/close-eyes.svg'
import openEyes from './img/open-eyes.svg'
import emailSvg from './img/email.svg'
import telefon from './img/telefon.svg'
import { useNavigate } from 'react-router-dom'
import Version from './component/version/version'

function App () {
  const navigate = useNavigate()
  const [passwordType, setPasswordType] = useState('password')
  const [secpasswordType, setSecpasswordType] = useState('password')
  const [text1, setText1] = useState('')
  const [text2, setText2] = useState('')
  const normalizedText1 = text1.trim().toLowerCase()
  const normalizedText2 = text2.trim().toLowerCase()
  const [noColor, setColor] = useState('password-img')
  const [phoneNum, setPhoneNum] = useState('+7 ')
  const [showPasswordError, setShowPasswordError] = useState(false)
  const [showMatchError, setShowMatchError] = useState(false)
  const [showEmailError, setShowEmailError] = useState(false)
  const [showTelefonError, setShowTelefonError] = useState(false)
  const API_URL = process.env.REACT_APP_API_URL || 'http://91.223.89.222:30001'

  useEffect(() => {
    if (normalizedText1 === normalizedText2 && normalizedText1 !== '') {
      setColor('password-img swi')
    } else {
      setColor('password-img')
    }
  }, [normalizedText1, normalizedText2])


  const togglepassword = useCallback(() => {
    setPasswordType(prev => (prev === 'password' ? 'text' : 'password'))
  }, [])

  const secTogglepassword = useCallback(() => {
    setSecpasswordType(prev => (prev === 'password' ? 'text' : 'password'))
  }, [])

  const reload = () => {
    navigate('/entrance')
  }

  const goForgot = () => {
    navigate('/forgot')
  }

  const formatPhoneNumber = useCallback(value => {
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
  }, [])

  const handleChange = useCallback(
    e => {
      const input = e.target.value
      if (input.length < 3) {
        setPhoneNum('+7 ')
        return
      }
      setPhoneNum(formatPhoneNumber(input))
    },
    [formatPhoneNumber]
  )

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
    const passwordMatch = normalizedText1 === normalizedText2
    const isPasswordStrong = password.length >= 6

    if (!isPasswordStrong) {
      setShowMatchError(true)
      setShowPasswordError(false)

      setTimeout(() => {
        setShowMatchError(false)
      }, 5000)
      return
    }

    if (!passwordMatch) {
      setShowPasswordError(true)
      setShowMatchError(false)

      setTimeout(() => {
        setShowPasswordError(false)
      }, 5000)
      return
    }
    setShowPasswordError(false)
    setShowMatchError(false)
    setShowEmailError(false)
    setShowTelefonError(false)

    try {
      const response = await fetch(`${API_URL}/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name,
          email,
          phone,
          password
        }),
        signal: AbortSignal.timeout(10000)
      })
      const responseData = await response.json()
      console.log('Response Status:', response.status)
      console.log('Response Data:', responseData)
      if (response.ok) {
        localStorage.setItem('token', responseData.token)
        navigate('/loanParamenrs')
      } else {
        console.log('Ошибка регистрации')
        if (responseData.error === 'Этот email уже зарегистрирован') {
          setShowEmailError(true)
          setTimeout(() => {
            setShowEmailError(false)
          }, 5000)
        }
        if (responseData.error === 'Этот телефон уже зарегистрирован') {
          setShowTelefonError(true)
          setTimeout(() => {
            setShowTelefonError(false)
          }, 5000)
        }
      }
    } catch (error) {
      console.error('Ошибка регистрации:', error)
      alert('Произошла ошибка при регистрации. Попробуйте позже.')
    }
  }

  const checkTokenValidity = useCallback(
    async token => {
      try {
        const response = await fetch(`${API_URL}/profile`, {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.ok) {
          navigate('/main')
        } else {
          localStorage.removeItem('token')
          navigate('')
        }
      } catch (error) {
        console.error('Ошибка проверки токена:', error)
        localStorage.removeItem('token')
        navigate('')
      }
    },
    [API_URL, navigate]
  )

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      checkTokenValidity(token)
    }
  }, [navigate, checkTokenValidity])

  return (
    <div className='App'>
      <Version />
      <div id='Weikup' className='Weikup'>
        <p className='header-of-form'>Регистрация</p>
        <form onSubmit={registration}>
          {/* <p className='descriptionOfLabel'>Введите имя</p> */}
          <label className='name' data-label='Введите имя'>
            <img src={face} alt='Лицо' loading='lazy' />
            <input
              type='text'
              name='name'
              value={full_name}
              onChange={e => setFull_name(e.target.value)}
              autoComplete='name'
              placeholder='Введите имя'
              required
            />
          </label>
          {showEmailError && (
            <div className='emailNoActual active'>
              <p>Такой email уже существует</p>
            </div>
          )}
          {/* <p className='descriptionOfLabel'>Введите email</p> */}
          <label className='email' data-label='Введите email'>
            <img src={emailSvg} alt='почта' loading='lazy' />
            <input
              type='email'
              name='email'
              onChange={e => setEmail(e.target.value)}
              placeholder='Введите email'
              required
            />
          </label>
          {showPasswordError && (
            <div className='passwordNoLength active'>
              <p>Пароли не совпадают</p>
            </div>
          )}
          {showMatchError && (
            <div className='passwordNoMatch active'>
              <p>Пароль должен содержать минимум 6 символов</p>
            </div>
          )}
          {/* <p className='descriptionOfLabel'>Введите пароль</p> */}
          <label className='password' data-label='Введите пароль'>
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
              placeholder='Введите пароль'
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
              loading='lazy'
            />
            <img
              onClick={togglepassword}
              className={`openEyes ${passwordType === 'text' ? 'active' : ''}`}
              src={openEyes}
              alt='Лицо'
              loading='lazy'
            />
          </label>
          {/* <p className='descriptionOfLabel'>Введите повторно пароль</p> */}
          <label className='check-password' data-label='Введите повторно пароль'>
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
              placeholder='Введите повторно пароль'
              required
            />
            <img
              onClick={secTogglepassword}
              id='closeEyes2'
              src={closeEyes}
              alt='Лицо'
              className={`closeEyes2 ${
                secpasswordType === 'password' ? 'active' : ''
              }`}
              loading='lazy'
            />
            <img
              className={`openEyes2 ${
                secpasswordType === 'text' ? 'active' : ''
              }`}
              onClick={secTogglepassword}
              src={openEyes}
              alt='Лицо'
              loading='lazy'
            />
          </label>
          {showTelefonError && (
            <div className='telefonNoActuality active'>
              <p>Такой телефон уже существует</p>
            </div>
          )}
          {/* <p className='descriptionOfLabel'>Введите номер телефона</p> */}
          <label className='telefon'>
            <img src={telefon} alt='телефон' loading='lazy' />
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
            <button type='button' onClick={goForgot} className='linkButton'>
              Забыли пароль?
            </button>
            <button type='button' onClick={reload} className='linkButton'>
              Войти
            </button>
          </div>
          <button type='submit' className='data-go-to-server'>
            Зарегистрироваться
          </button>
        </form>
      </div>
    </div>
  )
}

export default App
