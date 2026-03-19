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

// Trust the first proxy (Render's load balancer).
// Required for express-rate-limit to read X-Forwarded-For correctly.
app.set('trust proxy', 1)
const port = Number(process.env.PORT || 3001)
const requiredEnv = ['DATABASE_URL', 'JWT_SECRET']
const isProduction = process.env.NODE_ENV === 'production'

for (const key of requiredEnv) {
  if (!process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
}

if (isProduction) {
  const databaseUrl = process.env.DATABASE_URL || ''
  const localDatabasePatterns = ['localhost', '127.0.0.1', 'file:']

  if (localDatabasePatterns.some((pattern) => databaseUrl.includes(pattern))) {
    throw new Error(
      'Invalid production DATABASE_URL. It points to a local database host. Set DATABASE_URL to your managed Postgres connection string.'
    )
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

const healthHandler = (_req: any, res: any) => {
  res.status(200).json({
    success: true,
    status: 'ok',
    service: 'finsathi-render-auth',
  })
}

// Support both /health and /api/v1/health (Render health checker uses the latter)
app.get('/health', healthHandler)
app.get('/api/v1/health', healthHandler)

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
