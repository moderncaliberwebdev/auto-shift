// Imports
import asyncHandler from 'express-async-handler'
import puppeteer from 'puppeteer'

export const getShifts = asyncHandler(async (req, res) => {
  const shifts = []

  const browser = await puppeteer.launch({ devtools: true }) //Chromium Bug Testing >>> { devtools: true }
  const page = await browser.newPage()
  const url = `https://shiftagent.org/sa/#/login`
  await page.goto(url)
})
