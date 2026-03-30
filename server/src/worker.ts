import dotenv from 'dotenv'
import logger from './utils/logger'

dotenv.config()

type WorkerRuntimeModules = {
  financialExtractionQueue: Awaited<typeof import('./queues/financialExtractionQueue')>['financialExtractionQueue'] | null
  ingestionPipeline: Awaited<typeof import('./queues/ingestionPipeline')>['ingestionPipeline'] | null
  nepseQueue: Awaited<typeof import('./queues/nepseQueue')>['nepseQueue'] | null
  queueManager: Awaited<typeof import('./queues/queueManager')>['queueManager'] | null
  workerManager: Awaited<typeof import('./workers/workerManager')>['workerManager'] | null
}

const workerRuntimeModules: WorkerRuntimeModules = {
  financialExtractionQueue: null,
  ingestionPipeline: null,
  nepseQueue: null,
  queueManager: null,
  workerManager: null,
}

async function startWorkerRuntime() {
  try {
    const [{ connectRedis }, queueManagerModule, ingestionPipelineModule, financialExtractionQueueModule, workerManagerModule, nepseQueueModule, nepseSchedulerModule, loanProductsSchedulerModule] = await Promise.all([
      import('./config/redis'),
      import('./queues/queueManager'),
      import('./queues/ingestionPipeline'),
      import('./queues/financialExtractionQueue'),
      import('./workers/workerManager'),
      import('./queues/nepseQueue'),
      import('./jobs/nepse/scheduler'),
      import('./jobs/loanProducts/scheduler'),
    ])

    workerRuntimeModules.queueManager = queueManagerModule.queueManager
    workerRuntimeModules.ingestionPipeline = ingestionPipelineModule.ingestionPipeline
    workerRuntimeModules.financialExtractionQueue = financialExtractionQueueModule.financialExtractionQueue
    workerRuntimeModules.workerManager = workerManagerModule.workerManager
    workerRuntimeModules.nepseQueue = nepseQueueModule.nepseQueue

    await connectRedis()
    await workerRuntimeModules.queueManager.initialize()
    await workerRuntimeModules.ingestionPipeline.initialize()
    await workerRuntimeModules.financialExtractionQueue.schedule()
    await workerRuntimeModules.workerManager.initialize()
    await nepseSchedulerModule.ensureNepseCollectorScheduled()
    await workerRuntimeModules.nepseQueue.scheduleRecurringFetch()
    await loanProductsSchedulerModule.ensureLoanProductsScraperScheduled()

    logger.info('FinSathi worker runtime started')
  } catch (error) {
    logger.error(error as Error, { event: 'worker_runtime_start_failed' })
    process.exit(1)
  }
}

async function shutdownWorkerRuntime(signal: string) {
  logger.warn(`${signal} received. Shutting down worker runtime...`)
  if (workerRuntimeModules.nepseQueue) {
    await workerRuntimeModules.nepseQueue.shutdown()
  }
  if (workerRuntimeModules.financialExtractionQueue) {
    await workerRuntimeModules.financialExtractionQueue.shutdown()
  }
  if (workerRuntimeModules.ingestionPipeline) {
    await workerRuntimeModules.ingestionPipeline.shutdown()
  }
  if (workerRuntimeModules.queueManager) {
    await workerRuntimeModules.queueManager.shutdown()
  }
  if (workerRuntimeModules.workerManager) {
    await workerRuntimeModules.workerManager.shutdown()
  }
  process.exit(0)
}

process.on('SIGINT', () => {
  void shutdownWorkerRuntime('SIGINT')
})

process.on('SIGTERM', () => {
  void shutdownWorkerRuntime('SIGTERM')
})

void startWorkerRuntime()
