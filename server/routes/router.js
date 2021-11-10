import express from 'express'
const router = express.Router()

// Controllers
import { getShifts } from '../controllers/routeController.js'

router.get('/', (req, res) => res.json({ title: 'Welcome to MERN!!' }))
router.get('/shifts', getShifts)

export default router
