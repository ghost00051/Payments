import { useState, useEffect } from 'react'
import home from '../../img/home.svg'
import location from '../../img/location.svg'
import finance from '../../img/finance.svg'
import qr from '../../img/qr.svg'
import profile2 from '../../img/profile2.svg'
import edit from '../../img/redacting.svg'
import save from '../../img/save.svg'
import leftSlide from '../../img/leftSlide.svg'
import { useNavigate } from 'react-router-dom'
import '../../css/decriptionProfile.css'

function ProfileDecription () {
  const [editingField, setEditingField] = useState(null)
  const [userData, setUserData] = useState({
    name: '',
    email: '',
    phone: ''
  })
  const [tempData, setTempData] = useState({ ...userData })
  const API_URL = 'https://split-fiction.ru';

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
      console.log(data)
      const userInfo = {
        name: data.user.full_name || '',
        email: data.user.email || '',
        phone: data.user.phone || ''
      }
      setUserData(userInfo)
      setTempData(userInfo)
    } catch (error) {
      console.error('Error fetching profile:', error)
      alert('Ошибка при загрузке профиля')
      return null
    }
  }

  const editProfile = async field => {
    try {
      const token = localStorage.getItem('token')
      const response = await fetch(`${API_URL}/profile`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          full_name: field === 'name' ? tempData.name : userData.name,
          email: field === 'email' ? tempData.email : userData.email,
          phone: field === 'phone' ? tempData.phone : userData.phone
        })
      })
      if (response.ok) {
        setUserData({
          ...userData,
          [field]: tempData[field]
        })
        setEditingField(null)
        alert('Данные успешно обновлены!')
      } else {
        throw new Error('Ошибка при обновлении профиля')
      }
    } catch (error) {
      console.error('Ошибка сохранения:', error)
      alert('Ошибка при сохранении данных')
    }
  }

  const handleEditToggle = field => {
    if (editingField === field) {
      editProfile(field)
    } else {
      setEditingField(field)
    }
  }
  const handleCancel = field => {
    setTempData(prev => ({
      ...prev,
      [field]: userData[field]
    }))
    setEditingField(null)
  }
  const handleChange = (field, value) => {
    setTempData(prev => ({
      ...prev,
      [field]: value
    }))
  }

  useEffect(() => {
    getProfile()
  }, [])

  const toHome = useNavigate()
  const goToMain = () => {
    toHome('/main')
  }
  const toProfile = useNavigate()
  const goToProfile = () => {
    toProfile('/profile')
  }

  return (
    <div className='parentsOfBlocksDecription'>
      <div onClick={goToProfile} className='headerOfBlockDescription'>
        <img src={leftSlide} alt='Влево' />
        <p>Профиль</p>
      </div>
      <div className='renderInformationOfProfile'>
        <div>
          <div className='redactingPages'>
            <div className='renderOfName'>
              <span>Имя</span>
              <div className='redactingOfPages'>
                {editingField === 'name' ? (
                  <input
                    type='text'
                    value={tempData.name}
                    onChange={e => handleChange('name', e.target.value)}
                    className='edit-input'
                  />
                ) : (
                  <p>{userData.name}</p>
                )}
                <img
                  src={editingField === 'name' ? save : edit}
                  alt='редактирование'
                  onClick={() => handleEditToggle('name')}
                  className='edit-icon'
                />
              </div>
            </div>
          </div>
          <div className='redactingPages'>
            <div className='renderOfEmail'>
              <span>Почта</span>
              <div className='redactingOfPages'>
                {editingField === 'email' ? (
                  <input
                    type='email'
                    value={tempData.email}
                    onChange={e => handleChange('email', e.target.value)}
                    className='edit-input'
                  />
                ) : (
                  <p>{userData.email}</p>
                )}
                <img
                  src={editingField === 'email' ? save : edit}
                  alt='редактирование'
                  onClick={() => handleEditToggle('email')}
                  className='edit-icon'
                />
              </div>
            </div>
          </div>
          <div className='redactingPages'>
            <div className='renderOfTelefon'>
              <span>Телефон</span>
              <div className='redactingOfPages'>
                {editingField === 'phone' ? (
                  <input
                    type='tel'
                    value={tempData.phone}
                    onChange={e => handleChange('phone', e.target.value)}
                    className='edit-input'
                  />
                ) : (
                  <p>{userData.phone}</p>
                )}
                <img
                  src={editingField === 'phone' ? save : edit}
                  alt='редактирование'
                  onClick={() => handleEditToggle('phone')}
                  className='edit-icon'
                />
              </div>
            </div>
          </div>
        </div>

        {editingField && (
          <button onClick={handleCancel} className='cancel-button'>
            Отменить
          </button>
        )}
      </div>
      <div className='footerOfProfile'>
        <div onClick={goToMain}>
          <img src={home} alt='главная' loading='lazy' />
          <p>Главная</p>
        </div>
        <div>
          <img src={location} alt='Локации' loading='lazy' />
          <p>Локации</p>
        </div>
        <div>
          <img src={finance} alt='Финансы' loading='lazy' />
          <p>Финансы</p>
        </div>
        <div>
          <img src={qr} alt='QR' loading='lazy' />
          <p>QR</p>
        </div>
        <div>
          <img src={profile2} alt='Профиль' loading='lazy' />
          <p>Профиль</p>
        </div>
      </div>
    </div>
  )
}

export default ProfileDecription
