import React, { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import axios from 'axios'
import 'regenerator-runtime/runtime.js'

import '../sass/pages/_home.scss'

import { actions } from '../store'

function App() {
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  // const [reqData, setReqData] = useState({})
  const [waiting, setWaiting] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()

    setWaiting(true)
    await axios.post(`/api/shifts?month=${month}&day=${day}&year=${year}`)
    setWaiting(false)
  }

  return (
    <div>
      <form>
        <div className='head-images'>
          <img src='/public/images/shiftagent.png' alt='Shift Agent Logo' />
          <img
            src='/public/images/googlecalendar.png'
            alt='Google Calendar Logo'
          />
        </div>
        <h1>Autofill Shifts</h1>
        <h2>Choose Start Date</h2>
        <div className='inputs'>
          <input
            type='text'
            placeholder='6'
            onChange={(e) => setMonth(e.target.value)}
            value={month}
          />
          <span>/</span>
          <input
            type='text'
            placeholder='3'
            onChange={(e) => setDay(e.target.value)}
            value={day}
          />
          <span>/</span>
          <input
            type='text'
            placeholder='2004'
            onChange={(e) => setYear(e.target.value)}
            value={year}
          />
        </div>
        {waiting && <div className='app__spinner'></div>}
        <button onClick={handleSubmit}>Fill Shifts</button>
      </form>
    </div>
  )
}

export default App
