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
import { queueManager } from './queues/queueManager'
import { ingestionPipeline } from './queues/ingestionPipeline'
import { financialExtractionQueue } from './queues/financialExtractionQueue'
import { workerManager } from './workers/workerManager'
import { ensureNepseCollectorScheduled } from './jobs/nepse/scheduler'
import { nepseQueue } from './queues/nepseQueue'
import { ensureLoanProductsScraperScheduled } from './jobs/loanProducts/scheduler'

import authRoutes from './routes/auth.routes'
import loanRoutes from './routes/loan.routes'
import financialReportRoutes from './routes/financialReport.routes'
import usageRoutes from './routes/usage.routes'
import reportParserRoutes from './routes/reportParser.routes'
import portfolioRecommendRoutes from './routes/portfolio.recommend.routes'
import portfolioRoutes from './routes/portfolio.routes'
import marketLiveRoutes from './routes/market.live.routes'
import interestRatesRoutes from './routes/interest-rates.routes'
import advisorRoutes from './routes/advisor.routes'
import officialFinancialsRoutes from './routes/officialFinancials.routes'
import paymentRoutes from './routes/payment.routes'
import financialIntelligenceRoutes from './routes/financial-intelligence.routes'
import financialDataRoutes from './routes/financial-data.routes'
import corporateActionsRoutes from './routes/corporate-actions.routes'
import filingsRoutes from './routes/filings.routes'
import stocksRoutes from './routes/stocks.routes'
import subscriptionRoutes from './routes/subscription.routes'
import referralRoutes from './routes/referral.routes'
import analyticsRoutes from './routes/analytics.routes'
import aiRoutes from './routes/ai.routes'

dotenv.config()
validateEnvironment()

const app = express()
const PORT = getEnvNumber('PORT', 3001)
const START_HTTP_SERVER = getEnvBoolean('START_HTTP_SERVER', true)
const START_BACKGROUND_WORKERS = getEnvBoolean('START_BACKGROUND_WORKERS', true)

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
    const stats = await queueManager.getAllQueueStats()
    const ingestionStats = await ingestionPipeline.getStats()
    const workerStatus = workerManager.getWorkerStatus()

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

app.use('/api/v1/auth', authRoutes)
app.use('/api/v1/loans', loanRoutes)
app.use('/api/v1/loan', loanRoutes)
app.use('/api/v1/reports', financialReportRoutes)
app.use('/api/v1/usage', usageRoutes)
app.use('/api/v1/reports', reportParserRoutes)
app.use('/api/v1/portfolio', portfolioRecommendRoutes)
app.use('/api/v1/portfolio', portfolioRoutes)
app.use('/api/portfolio', portfolioRoutes)
app.use('/api/v1/market', marketLiveRoutes)
app.use('/api/market', marketLiveRoutes)
app.use('/api/v1/interest-rates', interestRatesRoutes)
app.use('/api/v1/advisor', advisorRoutes)
app.use('/api/v1/official-financials', officialFinancialsRoutes)
app.use('/api/v1/payments', paymentRoutes)
app.use('/api/v1/payment', paymentRoutes)
app.use('/payment', paymentRoutes)
app.use('/api/v1/financial-intelligence', financialIntelligenceRoutes)
app.use('/api/v1/financial-data', financialDataRoutes)
app.use('/api/v1/corporate-actions', corporateActionsRoutes)
app.use('/corporate-actions', corporateActionsRoutes)
app.use('/api/v1/filings', filingsRoutes)
app.use('/api/v1/stocks', stocksRoutes)
app.use('/stocks', stocksRoutes)
app.use('/api/v1/subscription', subscriptionRoutes)
app.use('/subscription', subscriptionRoutes)
app.use('/api/v1/referral', referralRoutes)
app.use('/referral', referralRoutes)
app.use('/api/v1/analytics', analyticsRoutes)
app.use('/analytics', analyticsRoutes)
app.use('/api/v1/ai', aiRoutes)

app.use('/loans', loanRoutes)
app.use('/loan', loanRoutes)

app.use(errorHandler)

app.use('*', (_req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found',
  })
})

async function startServer() {
  try {
    await connectRedis()
    if (START_BACKGROUND_WORKERS) {
      await queueManager.initialize()
      await ingestionPipeline.initialize()
      await financialExtractionQueue.schedule()
      await workerManager.initialize()
      await ensureNepseCollectorScheduled()
      await nepseQueue.scheduleRecurringFetch()
      await ensureLoanProductsScraperScheduled()
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
    await nepseQueue.shutdown()
    await financialExtractionQueue.shutdown()
    await ingestionPipeline.shutdown()
    await queueManager.shutdown()
    await workerManager.shutdown()
  }
  process.exit(0)
})

process.on('SIGTERM', async () => {
  logger.warn('SIGTERM received. Shutting down server...')
  if (START_BACKGROUND_WORKERS) {
    await nepseQueue.shutdown()
    await financialExtractionQueue.shutdown()
    await ingestionPipeline.shutdown()
    await queueManager.shutdown()
    await workerManager.shutdown()
  }
  process.exit(0)
})

startServer()

export default app
