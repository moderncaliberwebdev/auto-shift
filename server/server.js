// Imports
import express from 'express'
import dotenv from 'dotenv'
import path from 'path'

// Routes
import routes from './routes/router.js'

// server setup
const app = express()
const PORT = process.env.PORT || 3000
app.use(express.json())
dotenv.config()

app.use('/api', routes)

const __dirname = path.resolve()

if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '/client/dist')))

  app.get('*', (req, res) =>
    res.sendFile(path.resolve(__dirname, 'client', 'dist', 'index.html'))
  )
}

app.listen(PORT, () => console.log('Server is running on port ', PORT))
