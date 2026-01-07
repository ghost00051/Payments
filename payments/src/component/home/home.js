import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import '../../css/home.css'
import calendari from '../../img/calendari.svg'
import maxim from '../../img/maximaze.svg'
import minimize from '../../img/minimaze.svg'
import goToPayments from '../../img/goToPayments.svg'
import crossForm from '../../img/cross.svg'
import History from '../history/history'
import { useNavigate } from 'react-router-dom'
import Version from '../version/version'

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
  const [activeTab, setActiveTab] = useState('upcoming')
  const [indicatorStyle, setIndicatorStyle] = useState({})
  const [useName, setUseName] = useState('')
  const [useShortName, setUseShortName] = useState('')
  const upcomingRef = useRef(null)
  const historyRef = useRef(null)
  const toProfile = useNavigate()
  const API_URL = 'https://split-fiction.ru'

  const handleBlur = () => {
    setShowModal(false)
  }

  const getProfile = async () => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/profile`, {
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
      const shortName = data.user.full_name.slice(0, 1)
      setUseName(data.user.full_name)
      setUseShortName(shortName)
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
      const response = await fetch(`${API_URL}/installments/${userId}`, {
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
        `${API_URL}/payments/installment/${datainstel}`,
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

      const response = await fetch(`${API_URL}/payments`, {
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

  useEffect(() => {
    updateIndicator()
  }, [activeTab])

  const updateIndicator = () => {
    const activeElement =
      activeTab === 'upcoming' ? upcomingRef.current : historyRef.current

    if (activeElement) {
      const { offsetLeft, offsetWidth } = activeElement
      setIndicatorStyle({
        left: `${offsetLeft}px`,
        width: `${offsetWidth}px`
      })
    }
  }
  const formatDate = dateString => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    })
  }
  const tabVariants = {
    hidden: {
      opacity: 0,
      x: 50,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    },
    visible: {
      opacity: 1,
      x: 0,
      transition: {
        duration: 0.4,
        ease: 'easeOut'
      }
    },
    exit: {
      opacity: 0,
      x: -50,
      transition: {
        duration: 0.3,
        ease: 'easeInOut'
      }
    }
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  }

  const handleTabChange = tab => {
    setActiveTab(tab)
  }

  const GoToProfile = () => {
    toProfile('/profile')
  }

  return (
    <div className='home-container'>
      <Version />
      <div className='nameContainer'>
        <div className='nameOfPerson'>
          <p>С возвращением, {useName}</p>
        </div>
        <button onClick={GoToProfile}>
          <div className='ShortName'>
            <p>{useShortName}</p>
          </div>
        </button>
      </div>
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

      <div className='switchOfInformation'>
        <div className='childOfSwitchOfInformation'>
          <div className='active-indicator' style={indicatorStyle} />

          <button
            ref={upcomingRef}
            className={`Upcoming ${activeTab === 'upcoming' ? 'active' : ''}`}
            onClick={() => handleTabChange('upcoming')}
          >
            Предстоящие
          </button>
          <button
            ref={historyRef}
            className={`History ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => handleTabChange('history')}
          >
            История
          </button>
        </div>
      </div>

      <AnimatePresence mode='wait'>
        {activeTab === 'upcoming' && (
          <motion.div
            key='upcoming'
            className='UpcomingVision'
            variants={tabVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <div className='calendari-of-next-payments'>
              <div>
                <p>Следующий платеж</p>
                <img src={calendari} alt='календарь' />
              </div>
              <p className='date-vision'>{datevision}</p>
            </div>

            <motion.div variants={containerVariants}>
              <p className='payment-schedule'>График платежей</p>
              <motion.div
                className='god-of-counter'
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
              >
                <p className='header-of-god-of-counter'>Осталось платежей</p>
                <div className='counter-payments'>
                  <p>{sumarpayments}</p>
                  <p>/{allsumarpayments}</p>
                </div>
              </motion.div>

              <div className='installmens-container'>
                <AnimatePresence>
                  {installmens
                    .slice(0, visibleCount)
                    .map((installment, index) => (
                      <motion.div
                        key={installment.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={`installment-item item-${installment.id}`}
                      >
                        <div>
                          <p className='number-of-payment'>
                            {index + 1}-й платеж
                          </p>
                          <p className='amount-of-payment'>
                            {installment.amount} ₽
                          </p>
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
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
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
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <button
                className='button-vision-go-to-payments'
                onClick={() => setShowModal(true)}
              >
                <p>Внести платеж</p>
                <img src={goToPayments} alt='Go-to-Paymentd' />
              </button>
            </motion.div>
          </motion.div>
        )}

        {activeTab === 'history' && (
          <motion.div
            key='history'
            className='HistoryVision'
            variants={tabVariants}
            initial='hidden'
            animate='visible'
            exit='exit'
          >
            <History />
          </motion.div>
        )}
      </AnimatePresence>

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
                <label className='summaOfPay' data-label='Введите сумму'>
                  {/* <p className='header-of-form-get-to-payments header-of-form-get-to-payments-1'>
                    Введите сумму
                  </p> */}
                  <input
                    className='number-of-form-get-to-payments'
                    type='number'
                    onChange={e => setAmount(e.target.value)}
                    placeholder='Введите сумму'
                    required
                  />
                </label>
                <label className='dateOfFormGetToPayments mobile-date-input'>
                  <div className='date-input-wrapper'>
                    <span className='date-label'>Дата оплаты</span>
                    <input
                      type='date'
                      onChange={e => setDue_date(e.target.value)}
                      value={due_date}
                      required
                      aria-label='Дата оплаты'
                    />
                    <div className='date-display'>
                      {due_date ? formatDate(due_date) : 'Выберите дату'}
                    </div>
                    <div className='date-icon'>
                      <svg
                        width='24'
                        height='24'
                        viewBox='0 0 24 24'
                        fill='none'
                      >
                        <rect
                          x='3'
                          y='6'
                          width='18'
                          height='15'
                          rx='2'
                          stroke='currentColor'
                          strokeWidth='1.5'
                        />
                        <path
                          d='M3 10H21'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                        />
                        <path
                          d='M8 3V6'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                        />
                        <path
                          d='M16 3V6'
                          stroke='currentColor'
                          strokeWidth='1.5'
                          strokeLinecap='round'
                        />
                      </svg>
                    </div>
                  </div>
                </label>
                <label className='mobile-file-upload'>
                  {/* <p className='upload-header'>Загрузите чек</p> */}
                  <div className='file-upload-wrapper'>
                    <input
                      type='file'
                      onChange={e => setPhoto(e.target.files[0])}
                      ref={fileInputRef}
                      accept='image/*'
                      required
                      aria-label='Загрузить чек'
                    />
                    <div className='upload-area'>
                      <div className='upload-icon'>
                        <svg
                          width='32'
                          height='32'
                          viewBox='0 0 24 24'
                          fill='none'
                        >
                          <path
                            d='M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15M17 8L12 3M12 3L7 8M12 3V15'
                            stroke='#6B7280'
                            strokeWidth='2'
                            strokeLinecap='round'
                            strokeLinejoin='round'
                          />
                        </svg>
                      </div>
                      <div className='upload-text'>
                        <div className='upload-title'>Нажмите для загрузки</div>
                        <div className='upload-subtitle'>
                          Поддерживаемые форматы: JPG, PNG
                        </div>
                      </div>
                    </div>
                    {photo && (
                      <div className='file-preview'>
                        <div className='file-info'>
                          <div className='file-name'>{photo.name}</div>
                          <div className='file-size'>
                            {(photo.size / 1024).toFixed(0)} KB
                          </div>
                        </div>
                        <button
                          type='button'
                          className='remove-file'
                          onClick={e => {
                            e.stopPropagation()
                            setPhoto(null)
                            if (fileInputRef.current)
                              fileInputRef.current.value = ''
                          }}
                          aria-label='Удалить файл'
                        >
                          ×
                        </button>
                      </div>
                    )}
                  </div>
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
