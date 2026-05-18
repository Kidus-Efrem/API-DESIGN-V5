import express from 'express'

import authRoutes from './routes/authRoutes.ts'
import habitRoutes from './routes/habitRoutes.ts'
import userRoutes from './routes/userRoutes.ts'
import tagRoutes from './routes/tagRoutes.ts'
import entryRoutes from './routes/entryRoutes.ts'
import reminderRoutes from './routes/reminderRoutes.ts'

const app = express()

app.use(express.json())

app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Habit Tracker API',
  })
})

app.use('/api/auth', authRoutes)

app.use('/api/users', userRoutes)

app.use('/api/habits', habitRoutes)

app.use('/api/tags', tagRoutes)

app.use('/api/entries', entryRoutes)

app.use('/api/reminders', reminderRoutes)

export { app }