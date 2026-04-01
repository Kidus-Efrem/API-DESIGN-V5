import express from 'express'
import authRoutes from './routes/authRoutes.ts'
import habitRoutes from './routes/habitRoutes.ts'
import userRoutes from './routes/userRoutes.ts'
// import tagRoutes from './routes/tagRoutes.ts'

const app = express()
app.use(express.json())
// Health check endpoint (direct on app)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    service: 'Habit Tracker API',
  })
})

// Mount routers with base paths
app.use('/api/auth', authRoutes)    // All auth routes prefixed with /api/auth
app.use('/api/users', userRoutes)   // All user routes prefixed with /api/users
app.use('/api/habits', habitRoutes) // All habit routes prefixed with /api/habits
// app.use('/api/tags', tagRoutes)     // All tag routes prefixed with /api/tags

export { app }
// export default app