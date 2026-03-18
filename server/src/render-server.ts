import compression from 'compression'
import cors from 'cors'
import dotenv from 'dotenv'
import express from 'express'
import helmet from 'helmet'
import morgan from 'morgan'

import authRoutes from './routes/auth.routes'
import { errorHandler } from './middleware/errorHandler'

dotenv.config()

const app = express()
const port = Number(process.env.PORT || 3001)
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET']

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    if (!origin) {
      callback(null, true)
      return
    }

    // Reflect any browser origin for the auth-only Render service so
    // Vercel production and preview deployments both work without
    // constantly updating explicit allowlists.
    callback(null, true)
  },
  credentials: true,
}))
app.use(compression())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'finsathi-render-auth',
  })
})

app.use('/api/v1/auth', authRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: `Route ${req.method} ${req.originalUrl} not found`,
  })
})

app.use(errorHandler)

app.listen(port, () => {
  console.log(`Render auth server listening on port ${port}`)
})
