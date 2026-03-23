import { JobsOptions, Queue, QueueEvents, Worker } from 'bullmq'
import logger from '../utils/logger'
import { fetchNepseData } from '../services/nepse.service'

export const NEPSE_QUEUE_NAME = 'nepseQueue'
const FETCH_JOB_NAME = 'fetch-nepse-live-data'
const REPEAT_JOB_ID = 'nepse-fetch-repeat'

export type NepseFetchJobData = {
  type: 'fetch-nepse-data'
  requestedAt: string
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

class NepseQueueManager {
  private queue?: Queue<NepseFetchJobData>
  private worker?: Worker<NepseFetchJobData>
  private events?: QueueEvents

  async initialize(): Promise<void> {
    if (this.queue && this.worker && this.events) {
      return
    }

    const connection = getBullConnection()

    this.queue = new Queue<NepseFetchJobData>(NEPSE_QUEUE_NAME, { connection })
    this.worker = new Worker<NepseFetchJobData>(
      NEPSE_QUEUE_NAME,
      async (job) => {
        if (job.data.type !== 'fetch-nepse-data') {
          throw new Error(`Unsupported NEPSE job type: ${job.data.type}`)
        }

        logger.info(
          { jobId: job.id, requestedAt: job.data.requestedAt },
          'Processing NEPSE fetch job'
        )

        return fetchNepseData()
      },
      { connection, concurrency: 2 }
    )
    this.events = new QueueEvents(NEPSE_QUEUE_NAME, { connection })

    this.worker.on('completed', (job, result) => {
      logger.info(
        {
          queue: NEPSE_QUEUE_NAME,
          jobId: job.id,
          fetched: result?.fetched,
          inserted: result?.inserted,
          skipped: result?.skipped,
        },
        'NEPSE queue job completed'
      )
    })

    this.worker.on('failed', (job, error) => {
      logger.error(
        {
          queue: NEPSE_QUEUE_NAME,
          jobId: job?.id,
          attemptsMade: job?.attemptsMade,
          error: error.message,
        },
        'NEPSE queue job failed'
      )
    })

    this.events.on('failed', ({ jobId, failedReason }) => {
      logger.error(
        { queue: NEPSE_QUEUE_NAME, jobId, failedReason },
        'NEPSE queue event reported failure'
      )
    })

    this.events.on('completed', ({ jobId }) => {
      logger.info({ queue: NEPSE_QUEUE_NAME, jobId }, 'NEPSE queue event completed')
    })
  }

  async addFetchJob(options: JobsOptions = {}) {
    await this.initialize()

    return (this.queue as Queue<NepseFetchJobData>).add(
      FETCH_JOB_NAME,
      {
        type: 'fetch-nepse-data',
        requestedAt: new Date().toISOString(),
      },
      {
        attempts: 3,
        backoff: { type: 'exponential', delay: 5_000 },
        removeOnComplete: 50,
        removeOnFail: 100,
        ...options,
      }
    )
  }

  async scheduleRecurringFetch(): Promise<void> {
    if (process.env.NEPSE_QUEUE_ENABLED === 'false') {
      logger.info('NEPSE queue disabled via NEPSE_QUEUE_ENABLED=false')
      return
    }

    await this.initialize()

    await this.addFetchJob({
      jobId: REPEAT_JOB_ID,
      repeat: {
        every: 60_000,
      },
    })

    logger.info({ intervalMs: 60_000 }, 'Scheduled recurring NEPSE fetch queue job')
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

export const nepseQueue = new NepseQueueManager()
