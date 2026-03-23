import { JobsOptions, Queue, QueueEvents, Worker } from 'bullmq'
import logger from '../utils/logger'
import { FinancialExtractionService } from '../services/financialExtraction.service'

const QUEUE_NAME = 'financial-extraction'
const REPEAT_JOB_ID = 'financial-extraction-repeat'

type FinancialExtractionJobData = {
  type: 'extract-company-reports'
}

function getBullConnection() {
  if (process.env.REDIS_URL) {
    const parsed = new URL(process.env.REDIS_URL)
    return {
      host: parsed.hostname,
      port: Number(parsed.port || 6379),
      username: parsed.username || undefined,
      password: parsed.password || undefined,
      db: parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0,
      maxRetriesPerRequest: null,
    }
  }

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    username: process.env.REDIS_USERNAME || undefined,
    password: process.env.REDIS_PASSWORD || undefined,
    db: Number(process.env.REDIS_DB || 0),
    maxRetriesPerRequest: null,
  }
}

class FinancialExtractionQueue {
  private queue?: Queue<FinancialExtractionJobData>
  private worker?: Worker<FinancialExtractionJobData>
  private events?: QueueEvents

  async initialize(): Promise<void> {
    if (this.queue && this.worker && this.events) {
      return
    }

    const connection = getBullConnection()
    this.queue = new Queue<FinancialExtractionJobData>(QUEUE_NAME, { connection })
    this.worker = new Worker<FinancialExtractionJobData>(
      QUEUE_NAME,
      async (job) => {
        if (job.data.type !== 'extract-company-reports') {
          throw new Error(`Unsupported financial extraction job: ${job.data.type}`)
        }

        return FinancialExtractionService.processPendingCompanyReports(
          Number(process.env.FINANCIAL_EXTRACTION_BATCH_SIZE || 10)
        )
      },
      { connection, concurrency: 1 }
    )
    this.events = new QueueEvents(QUEUE_NAME, { connection })

    this.worker.on('failed', (job, error) => {
      logger.error({ jobId: job?.id, error: error.message }, 'Financial extraction worker failed')
    })

    this.events.on('completed', ({ jobId }) => {
      logger.info({ jobId }, 'Financial extraction job completed')
    })
  }

  async schedule(): Promise<void> {
    if (process.env.FINANCIAL_EXTRACTION_ENABLED === 'false') {
      logger.info('Financial extraction queue disabled via FINANCIAL_EXTRACTION_ENABLED=false')
      return
    }

    await this.initialize()

    const intervalMs = Math.max(60_000, Number(process.env.FINANCIAL_EXTRACTION_INTERVAL_MS || 21_600_000))
    const options: JobsOptions = {
      jobId: REPEAT_JOB_ID,
      repeat: { every: intervalMs },
      attempts: 3,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 20,
      removeOnFail: 50,
    }

    await (this.queue as Queue<FinancialExtractionJobData>).add(
      'extract-company-reports',
      { type: 'extract-company-reports' },
      options
    )

    logger.info({ intervalMs }, 'Scheduled financial extraction repeat job')
  }

  async shutdown(): Promise<void> {
    await Promise.all([
      this.events?.close(),
      this.worker?.close(),
      this.queue?.close(),
    ])
    this.events = undefined
    this.worker = undefined
    this.queue = undefined
  }
}

export const financialExtractionQueue = new FinancialExtractionQueue()
