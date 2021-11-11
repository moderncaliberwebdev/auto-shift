import express from 'express'
const router = express.Router()

// Controllers
import { postShifts } from '../controllers/routeController.js'

router.post('/shifts', postShifts)

export default router
