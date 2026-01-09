import profile from '../../img/profile.svg'
import skip from '../../img/skip.svg'
import skipRed from '../../img/skipRed.svg'
import home from '../../img/home.svg'
import location from '../../img/location.svg'
import finance from '../../img/finance.svg'
import qr from '../../img/qr.svg'
import profile2 from '../../img/profile2.svg'
import logOut from '../../img/LogOut.svg'
import '../../css/profile.css'
import { useNavigate } from 'react-router-dom'

function Profile () {
  const toHome = useNavigate()
  const goToMain = () => {
    toHome('/main')
  }

  const toDescription = useNavigate()
  const goToDescription = () => {
    toDescription('/profile/description')
  }

  const toEntrance = useNavigate()
  const logOutLogic = () =>{
    localStorage.clear()
    toEntrance('/entrance')
  }

  return (
    <div className='parrentsProfileBlock'>
      <div className='headerOfBlockProfile'>
        <p>Профиль</p>
      </div>
      {/* <div>
        <p>Имя</p>
      </div> */}
      <div className='godBlocksofMain'>
        <div onClick={goToDescription} className='paugesOfPayments'>
          <div className='loadingOfProfile'>
            <div className='leftBlocksFirstPages'>
              <img src={profile} alt='Профиль' />
              <p>Персональные данные</p>
            </div>
            <img src={skip} alt='Перход' />
          </div>
        </div>
        <div onClick={logOutLogic} className='SecPaugesOfPayments'>
          <div className='LogOutButton'>
            <div className='leftBlocksSecondPage'>
              <img src={logOut} alt='Выйти' />
              <p>Выйти</p>
            </div>
            <img src={skipRed} alt='Перход' />
          </div>
        </div>
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

export default Profile
