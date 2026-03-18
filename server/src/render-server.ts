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

function resolveAllowedOrigins(): string[] {
  const configured = [
    process.env.CORS_ORIGIN,
    process.env.FRONTEND_URL,
  ]
    .filter(Boolean)
    .flatMap((value) => value!.split(','))
    .map((value) => value.trim())
    .filter(Boolean)

  return configured.length > 0 ? configured : ['http://localhost:3000']
}

const allowedOrigins = resolveAllowedOrigins()

app.use(helmet())
app.use(cors({
  origin(origin, callback) {
    const isAllowedVercelPreview =
      !!origin &&
      (origin.endsWith('.vercel.app') || origin.endsWith('.vercel.app/'))

    if (!origin || allowedOrigins.includes(origin) || isAllowedVercelPreview) {
      callback(null, true)
      return
    }

    callback(new Error(`Origin ${origin} is not allowed by CORS`))
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
