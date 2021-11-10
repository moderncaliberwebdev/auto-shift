import puppeteer from 'puppeteer'
import { google } from 'googleapis'
import dotenv from 'dotenv'
dotenv.config()

// ;(async () => {
//   //array with all shifts
//   const shiftArray = []

//   //open shiftaget
//   const browser = await puppeteer.launch({ headless: false })
//   const page = await browser.newPage()
//   await page.goto('https://shiftagent.org/sa/#/login')

//   //fill in form and login
//   await page.$eval('#inputEmail', (el) => (el.value = 'caleb637@icloud.com'))
//   await page.$eval('#inputPassword', (el) => (el.value = 'modernCaliber04'))
//   await page.click('input.sa_button')

//   //wait for new page to open
//   await page.waitForTimeout(3 * 1000) // wait for new page to open

//   //get dates I work
//   const dateArray = await page.evaluate(() =>
//     Array.from(
//       document.querySelectorAll('.sched_profile_img_date'),
//       (element) => element.textContent
//     )
//   )
//   //get start times
//   const timesArray = await page.evaluate(() =>
//     Array.from(
//       document.querySelectorAll('.sched_times > .ng-binding'),
//       (element) => element.textContent
//     )
//   )

//   //make array of times and dates
//   dateArray.forEach((date, index) => {
//     shiftArray.push({
//       date,
//       start: timesArray[(index + 1) * 2 - 2],
//       end: timesArray[(index + 1) * 2 - 1],
//     })
//   })
//   console.log(shiftArray)

//   await browser.close()
// })()

// Provide the required configuration
// const CREDENTIALS = JSON.parse(process.env.CREDENTIALS)

const calendarId = process.env.CALENDAR_ID

// Google calendar API settings
const SCOPES = 'https://www.googleapis.com/auth/calendar'
const calendar = google.calendar({ version: 'v3' })

const auth = new google.auth.JWT(
  process.env.CLIENT_EMAIL,
  null,
  process.env.CLIENT_PRIVATE_KEY,
  SCOPES
)

// Your TIMEOFFSET Offset
const TIMEOFFSET = '-05:00'

// Get date-time string for calender
const dateTimeForCalander = (shiftDate, starttime, endtime) => {
  const currentYear = new Date().getFullYear()
  //split month and date
  const splitMonth = shiftDate.split(' ')[0]
  const splitDay = shiftDate.split(' ')[1]
  const shiftMonth =
    new Date(Date.parse(splitMonth + ` 1, ${currentYear}`)).getMonth() + 1
  //convert start and end time to military time
  const startHour =
    starttime.substring(starttime.length - 1) == 'p'
      ? Number(starttime.split(':')[0]) + 12
      : Number(starttime.split(':')[0])
  const startMinute = Number(starttime.split(':')[1].substring(0, 2))

  const endHour =
    endtime.substring(endtime.length - 1) == 'p'
      ? Number(endtime.split(':')[0]) + 12
      : Number(endtime.split(':')[0])
  const endMinute = Number(endtime.split(':')[1].substring(2, 3))

  const date = new Date(
    currentYear,
    shiftMonth,
    splitDay,
    startHour,
    startMinute
  )

  let year = date.getFullYear()
  let month = date.getMonth()
  if (month < 10) {
    month = `0${month}`
  }
  let day = date.getDate()
  if (day < 10) {
    day = `0${day}`
  }
  let hour = date.getHours()
  if (hour < 10) {
    hour = `0${hour}`
  }
  let minute = date.getMinutes()
  if (minute < 10) {
    minute = `0${minute}`
  }

  let newDateTime = `${year}-${month}-${day}T${hour}:${minute}:00.000${TIMEOFFSET}`

  let event = new Date(Date.parse(newDateTime))

  let startDate = event
  // Delay in end time is 1
  let endDate = new Date(new Date(startDate).setHours(startDate.getHours() + 1))

  return {
    start: startDate,
    end: endDate,
  }
}

// Insert new event to Google Calendar
const insertEvent = async (event) => {
  try {
    let response = await calendar.events.insert({
      auth: auth,
      calendarId: calendarId,
      resource: event,
    })

    if (response['status'] == 200 && response['statusText'] === 'OK') {
      return 1
    } else {
      return 0
    }
  } catch (error) {
    console.log(`Error at insertEvent --> ${error}`)
    return 0
  }
}

let dateTime = dateTimeForCalander('Nov 13', '7:30a', '10:00a')

// Event for Google Calendar
let event = {
  summary: `Work`,
  start: {
    dateTime: dateTime['start'],
    timeZone: 'America/New_York',
  },
  end: {
    dateTime: dateTime['end'],
    timeZone: 'America/New_York',
  },
}

insertEvent(event)
  .then((res) => {
    console.log(res)
  })
  .catch((err) => {
    console.log(err)
  })
