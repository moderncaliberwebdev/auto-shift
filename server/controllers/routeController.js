// Imports
import asyncHandler from 'express-async-handler'
import puppeteer from 'puppeteer'
import { google } from 'googleapis'
import dotenv from 'dotenv'
dotenv.config()

export const postShifts = asyncHandler(async (req, res) => {
  const { month: reqMonth, day: reqDay, year: reqYear } = req.query
  //array with all shifts
  const shiftArray = []

  //open shiftaget
  const browser = await puppeteer.launch({
    args: ['--no-sandbox'],
  }) //{ headless: false }
  const page = await browser.newPage()
  await page.goto('https://shiftagent.org/sa/#/login')

  //fill in form and login
  await page.$eval('#inputEmail', (el) => (el.value = 'caleb637@icloud.com'))
  await page.$eval('#inputPassword', (el) => (el.value = 'modernCaliber04'))
  await page.click('input.sa_button')

  //wait for new page to open
  await page.waitForTimeout(3 * 1000) // wait for new page to open

  //get dates I work
  const dateArray = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll('.sched_profile_img_date'),
      (element) => element.textContent
    )
  )
  //get start times
  const timesArray = await page.evaluate(() =>
    Array.from(
      document.querySelectorAll('.sched_times > .ng-binding'),
      (element) => element.textContent
    )
  )

  //make array of times and dates
  dateArray.forEach((date, index) => {
    shiftArray.push({
      date,
      start: timesArray[(index + 1) * 2 - 2],
      end: timesArray[(index + 1) * 2 - 1],
    })
  })

  //combine close shifts
  shiftArray.forEach((shift, index) => {
    const topEndHour = index > 0 && shiftArray[index - 1].end.split(':')[0]
    const bottomStartHour = shift.start.split(':')[0]
    if (index > 0 && topEndHour == bottomStartHour) {
      shiftArray[index - 1].end = shift.end
      shiftArray.splice(index, 1)
    }
  })

  //posting to calendar
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
  const dateTimeForCalander = (shiftDate, starttime, endtime, startDay) => {
    let currentYear = new Date().getFullYear()
    //split month and date
    const splitMonth = shiftDate.split(' ')[0]
    const splitDay = shiftDate.split(' ')[1]
    const shiftMonth =
      new Date(Date.parse(splitMonth + ` 1, ${currentYear}`)).getMonth() + 1
    //if its a new year, increase the year
    const currentMonth = new Date().getMonth() + 1
    if (shiftMonth < currentMonth) {
      currentYear += 1
    }
    const dayOfYear = (date) =>
      Math.floor(
        (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
      )
    //find what day it is so if I set a start day, it knows what date to start at
    const dayOfShift =
      dayOfYear(
        new Date(Date.parse(`${splitMonth}/${splitDay}/${currentYear}`))
      ) * currentYear

    if (dayOfShift >= startDay) {
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
      const endMinute = Number(endtime.split(':')[1].substring(0, 2))

      const shiftStart = new Date(
        currentYear,
        shiftMonth,
        splitDay,
        startHour,
        startMinute
      )

      const shiftEnd = new Date(
        currentYear,
        shiftMonth,
        splitDay,
        endHour,
        endMinute
      )

      const startDate = getCalendarDate(shiftStart)
      const endDate = getCalendarDate(shiftEnd)

      return {
        start: startDate,
        end: endDate,
      }
    } else return { start: 0, end: 0 }
  }

  const getCalendarDate = (dateOfShift) => {
    let year = dateOfShift.getFullYear()
    let month = dateOfShift.getMonth()
    if (month < 10) {
      month = `0${month}`
    }
    let day = dateOfShift.getDate()
    if (day < 10) {
      day = `0${day}`
    }
    let hour = dateOfShift.getHours()
    if (hour < 10) {
      hour = `0${hour}`
    }
    let minute = dateOfShift.getMinutes()
    if (minute < 10) {
      minute = `0${minute}`
    }

    const newDateTime = `${year}-${month}-${day}T${hour}:${minute}:00.000${TIMEOFFSET}`

    const event = new Date(Date.parse(newDateTime))
    return event
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
        return event.summary
      } else {
        return 0
      }
    } catch (error) {
      console.log(`Error at insertEvent --> ${error}`)
      return 0
    }
  }
  const postShifts = (startDayMonth, startDayDay, startDayYear) => {
    //variables for finding the day
    const dayOfYear = (date) =>
      Math.floor(
        (date - new Date(date.getFullYear(), 0, 0)) / (1000 * 60 * 60 * 24)
      )
    let currentYear = new Date().getFullYear()

    shiftArray.forEach((shift) => {
      let dateTime = dateTimeForCalander(
        shift.date,
        shift.start,
        shift.end,
        dayOfYear(
          new Date(
            Date.parse(`${startDayMonth}/${startDayDay}/${startDayYear}`)
          )
        ) * currentYear
      )
      if (dateTime['start'] != 0 && dateTime['end'] != 0) {
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
      }
    })
  }
  postShifts(reqMonth, reqDay, reqYear)
  res.json({
    month: reqMonth,
    day: reqDay,
    year: reqYear,
  })

  await browser.close()
})
