import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import compression from 'compression'
import dotenv from 'dotenv'

import logger, { requestLogStream } from './utils/logger'
import { errorHandler } from './middleware/errorHandler'
import { checkTokenBlacklist } from './middleware/tokenBlacklist.middleware'
import { generalLimiter } from './middleware/rateLimiter.middleware'
import { requestLogger } from './middleware/requestLogger'
import { connectRedis } from './config/redis'
import { getEnvBoolean, getEnvNumber, validateEnvironment } from './config/env'
import { initializeMonitoring, metricsMiddleware } from './config/monitoring'
import authRoutes from './routes/auth.routes'

dotenv.config()
validateEnvironment()

const app = express()
const PORT = getEnvNumber('PORT', 3001)
const START_HTTP_SERVER = getEnvBoolean('START_HTTP_SERVER', true)
const START_BACKGROUND_WORKERS = getEnvBoolean('START_BACKGROUND_WORKERS', true)

type BackgroundRuntimeModules = {
  financialExtractionQueue: Awaited<typeof import('./queues/financialExtractionQueue')>['financialExtractionQueue'] | null
  ingestionPipeline: Awaited<typeof import('./queues/ingestionPipeline')>['ingestionPipeline'] | null
  nepseQueue: Awaited<typeof import('./queues/nepseQueue')>['nepseQueue'] | null
  queueManager: Awaited<typeof import('./queues/queueManager')>['queueManager'] | null
  workerManager: Awaited<typeof import('./workers/workerManager')>['workerManager'] | null
}

const backgroundRuntimeModules: BackgroundRuntimeModules = {
  financialExtractionQueue: null,
  ingestionPipeline: null,
  nepseQueue: null,
  queueManager: null,
  workerManager: null,
}

app.set('trust proxy', getEnvNumber('TRUST_PROXY', 1))
initializeMonitoring(app)

app.use(helmet())
app.use(
  cors({
    origin: process.env.CORS_ORIGIN?.split(',') || process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  })
)
app.use(compression())
app.use(morgan('combined', { stream: requestLogStream }))
app.use(metricsMiddleware)
app.use(requestLogger)
app.use(generalLimiter)
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

app.use('/api/v1', checkTokenBlacklist)

app.get('/health', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0',
  })
})

app.get('/api/v1/queues/status', async (_req, res) => {
  try {
    if (!START_BACKGROUND_WORKERS) {
      res.json({
        success: true,
        data: {
          queues: {},
          ingestionQueues: {},
          workers: {},
          enabled: false,
          timestamp: new Date().toISOString(),
        },
      })
      return
    }

    if (!backgroundRuntimeModules.queueManager || !backgroundRuntimeModules.ingestionPipeline || !backgroundRuntimeModules.workerManager) {
      res.status(503).json({
        success: false,
        error: 'Background workers are not initialized',
      })
      return
    }

    const stats = await backgroundRuntimeModules.queueManager.getAllQueueStats()
    const ingestionStats = await backgroundRuntimeModules.ingestionPipeline.getStats()
    const workerStatus = backgroundRuntimeModules.workerManager.getWorkerStatus()

    res.json({
      success: true,
      data: {
        queues: stats,
        ingestionQueues: ingestionStats,
        workers: workerStatus,
        timestamp: new Date().toISOString(),
      },
    })
  } catch (error) {
    logger.error(error as Error, { event: 'queue_status_failed' })
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status',
    })
  }
})

function loadOptionalRoute(modulePath: string, routePath: string, options?: { useBlacklist?: boolean }) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const routeModule = require(modulePath)
    const router = routeModule.default ?? routeModule

    if (options?.useBlacklist) {
      app.use(routePath, checkTokenBlacklist, router)
    } else {
      app.use(routePath, router)
    }
  } catch (error) {
    logger.warn('Optional route disabled during startup', {
      routePath,
      modulePath,
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

app.use('/api/v1/auth', authRoutes)
loadOptionalRoute('./routes/loan.routes', '/api/v1/loans')
loadOptionalRoute('./routes/loan.routes', '/api/v1/loan')
loadOptionalRoute('./routes/financialReport.routes', '/api/v1/reports')
loadOptionalRoute('./routes/usage.routes', '/api/v1/usage')
loadOptionalRoute('./routes/portfolio.recommend.routes', '/api/v1/portfolio')
loadOptionalRoute('./routes/portfolio.routes', '/api/v1/portfolio')
loadOptionalRoute('./routes/portfolio.routes', '/api/portfolio', { useBlacklist: true })
loadOptionalRoute('./routes/market.live.routes', '/api/v1/market')
loadOptionalRoute('./routes/interest-rates.routes', '/api/v1/interest-rates')
loadOptionalRoute('./routes/advisor.routes', '/api/v1/advisor')
loadOptionalRoute('./routes/officialFinancials.routes', '/api/v1/official-financials')
loadOptionalRoute('./routes/payment.routes', '/api/v1/payments')
loadOptionalRoute('./routes/payment.routes', '/api/v1/payment')
loadOptionalRoute('./routes/financial-intelligence.routes', '/api/v1/financial-intelligence')
loadOptionalRoute('./routes/financial-data.routes', '/api/v1/financial-data')
loadOptionalRoute('./routes/corporate-actions.routes', '/api/v1/corporate-actions')
loadOptionalRoute('./routes/filings.routes', '/api/v1/filings')
loadOptionalRoute('./routes/stocks.routes', '/api/v1/stocks')
loadOptionalRoute('./routes/subscription.routes', '/api/v1/subscription')
loadOptionalRoute('./routes/referral.routes', '/api/v1/referral')
loadOptionalRoute('./routes/analytics.routes', '/api/v1/analytics')
loadOptionalRoute('./routes/ai.routes', '/api/v1/ai')
loadOptionalRoute('./routes/reportParser.routes', '/api/v1/report-parser')

app.use(errorHandler)

app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

async function startServer() {
  try {
    if (START_BACKGROUND_WORKERS) {
      await connectRedis()
      const [queueManagerModule, ingestionPipelineModule, financialExtractionQueueModule, workerManagerModule, nepseQueueModule, nepseSchedulerModule, loanProductsSchedulerModule] = await Promise.all([
        import('./queues/queueManager'),
        import('./queues/ingestionPipeline'),
        import('./queues/financialExtractionQueue'),
        import('./workers/workerManager'),
        import('./queues/nepseQueue'),
        import('./jobs/nepse/scheduler'),
        import('./jobs/loanProducts/scheduler'),
      ])

      backgroundRuntimeModules.queueManager = queueManagerModule.queueManager
      backgroundRuntimeModules.ingestionPipeline = ingestionPipelineModule.ingestionPipeline
      backgroundRuntimeModules.financialExtractionQueue = financialExtractionQueueModule.financialExtractionQueue
      backgroundRuntimeModules.workerManager = workerManagerModule.workerManager
      backgroundRuntimeModules.nepseQueue = nepseQueueModule.nepseQueue

      await backgroundRuntimeModules.queueManager.initialize()
      await backgroundRuntimeModules.ingestionPipeline.initialize()
      await backgroundRuntimeModules.financialExtractionQueue.schedule()
      await backgroundRuntimeModules.workerManager.initialize()
      await nepseSchedulerModule.ensureNepseCollectorScheduled()
      await backgroundRuntimeModules.nepseQueue.scheduleRecurringFetch()
      await loanProductsSchedulerModule.ensureLoanProductsScraperScheduled()
    } else {
      logger.info('Starting API without Redis-backed background workers', {
        workersEnabled: false,
      })
    }

    if (START_HTTP_SERVER) {
      app.listen(PORT, () => {
        logger.info('FinSathi AI API Server started', {
          port: PORT,
          environment: process.env.NODE_ENV,
          apiUrl: `http://localhost:${PORT}/api/v1`,
          workersEnabled: START_BACKGROUND_WORKERS,
        })
      })
    } else {
      logger.info('FinSathi AI background runtime started without HTTP server', {
        workersEnabled: START_BACKGROUND_WORKERS,
      })
    }
  } catch (error) {
    logger.error(error as Error, { event: 'server_start_failed' })
    process.exit(1)
  }
}

process.on('SIGINT', async () => {
  logger.warn('SIGINT received. Shutting down server...')
  if (START_BACKGROUND_WORKERS) {
    if (backgroundRuntimeModules.nepseQueue) {
      await backgroundRuntimeModules.nepseQueue.shutdown()
    }
    if (backgroundRuntimeModules.financialExtractionQueue) {
      await backgroundRuntimeModules.financialExtractionQueue.shutdown()
    }
    if (backgroundRuntimeModules.ingestionPipeline) {
      await backgroundRuntimeModules.ingestionPipeline.shutdown()
    }
    if (backgroundRuntimeModules.queueManager) {
      await backgroundRuntimeModules.queueManager.shutdown()
    }
    if (backgroundRuntimeModules.workerManager) {
      await backgroundRuntimeModules.workerManager.shutdown()
    }
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received. Shutting down server...')
  if (START_BACKGROUND_WORKERS) {
    if (backgroundRuntimeModules.nepseQueue) {
      await backgroundRuntimeModules.nepseQueue.shutdown()
    }
    if (backgroundRuntimeModules.financialExtractionQueue) {
      await backgroundRuntimeModules.financialExtractionQueue.shutdown()
    }
    if (backgroundRuntimeModules.ingestionPipeline) {
      await backgroundRuntimeModules.ingestionPipeline.shutdown()
    }
    if (backgroundRuntimeModules.queueManager) {
      await backgroundRuntimeModules.queueManager.shutdown()
    }
    if (backgroundRuntimeModules.workerManager) {
      await backgroundRuntimeModules.workerManager.shutdown()
    }
  }
  process.exit(0)
})

startServer()

export default app
