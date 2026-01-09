import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import './index.css'
import App from './App'
import reportWebVitals from './reportWebVitals'
import LoanParameters from './component/LoanParameters/LoanParameters'
import Entrance from './component/entrance/entrance'
import Main from './component/home/home'
import Forgot from './component/forgotPassword/forgotPassword'
import Reset from './component/resetPassword/resetpassword'
import Profile from './component/profile/profile'
import ProfileDecription from './component/profileDescription/profileDescription'

const root = ReactDOM.createRoot(document.getElementById('root'))
root.render(
  <React.StrictMode>
    <Router>
      <Routes>
        <Route path='/' element={<App />} />
        <Route path='/loanParameters' element={<LoanParameters />} />
        <Route path='/entrance' element={<Entrance />} />
        <Route path='/main' element={<Main />} />
        <Route path='/forgot' element={<Forgot />} />
        <Route path='/reset-password' element={<Reset />} />
        <Route path='/profile' element={<Profile />} />
        <Route path='/profile/description' element={<ProfileDecription />}/>
      </Routes>
    </Router>
  </React.StrictMode>
)

reportWebVitals()
