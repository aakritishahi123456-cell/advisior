import dotenv from 'dotenv'
import logger from './utils/logger'
import { connectRedis } from './config/redis'
import { queueManager } from './queues/queueManager'
import { ingestionPipeline } from './queues/ingestionPipeline'
import { financialExtractionQueue } from './queues/financialExtractionQueue'
import { workerManager } from './workers/workerManager'
import { ensureNepseCollectorScheduled } from './jobs/nepse/scheduler'
import { nepseQueue } from './queues/nepseQueue'
import { ensureLoanProductsScraperScheduled } from './jobs/loanProducts/scheduler'

dotenv.config()

async function startWorkerRuntime() {
  try {
    await connectRedis()
    await queueManager.initialize()
    await ingestionPipeline.initialize()
    await financialExtractionQueue.schedule()
    await workerManager.initialize()
    await ensureNepseCollectorScheduled()
    await nepseQueue.scheduleRecurringFetch()
    await ensureLoanProductsScraperScheduled()

    logger.info('FinSathi worker runtime started')
  } catch (error) {
    logger.error(error as Error, { event: 'worker_runtime_start_failed' })
    process.exit(1)
  }
}

async function shutdownWorkerRuntime(signal: string) {
  logger.warn(`${signal} received. Shutting down worker runtime...`)
  await nepseQueue.shutdown()
  await financialExtractionQueue.shutdown()
  await ingestionPipeline.shutdown()
  await queueManager.shutdown()
  await workerManager.shutdown()
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdownWorkerRuntime('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdownWorkerRuntime('SIGTERM')
})

void startWorkerRuntime()

