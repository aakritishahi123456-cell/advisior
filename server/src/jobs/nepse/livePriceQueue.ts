import { Queue, Worker, QueueEvents, JobsOptions } from 'bullmq'
import logger from '../../utils/logger'
import { runNepseLivePriceCollector } from './livePriceCollector'

const QUEUE_NAME = 'nepse-live-price'
const REPEAT_JOB_NAME = 'nepse-live-price-repeat'

function getBullConnection() {
  if (!process.env.REDIS_URL) {
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: Number(process.env.REDIS_PORT || 6379),
      username: process.env.REDIS_USERNAME || undefined,
      password: process.env.REDIS_PASSWORD || undefined,
      db: Number(process.env.REDIS_DB || 0),
    }
  }

  const parsed = new URL(process.env.REDIS_URL)

  return {
    host: parsed.hostname,
    port: Number(parsed.port || 6379),
    username: parsed.username || undefined,
    password: parsed.password || undefined,
    db: parsed.pathname && parsed.pathname !== '/' ? Number(parsed.pathname.slice(1)) : 0,
  }
}

class NepseLivePriceQueue {
  private queue?: Queue
  private worker?: Worker
  private events?: QueueEvents

  async initialize(): Promise<void> {
    if (this.queue && this.worker && this.events) {
      return
    }

    const connection = getBullConnection()
    this.queue = new Queue(QUEUE_NAME, { connection })
    this.worker = new Worker(
      QUEUE_NAME,
      async () => runNepseLivePriceCollector(),
      { connection, concurrency: 1 }
    )
    this.events = new QueueEvents(QUEUE_NAME, { connection })

    this.worker.on('failed', (job, error) => {
      logger.error({ jobId: job?.id, error: error.message }, 'NEPSE live price worker failed')
    })

    this.events.on('completed', ({ jobId }) => {
      logger.info({ jobId }, 'NEPSE live price job completed')
    })
  }

  async schedule(): Promise<void> {
    if (process.env.NEPSE_LIVE_ENABLED === 'false') {
      logger.info('NEPSE live price queue disabled via NEPSE_LIVE_ENABLED=false')
      return
    }

    await this.initialize()

    const queue = this.queue as Queue
    const everyMs = Number(process.env.NEPSE_LIVE_INTERVAL_MS || 60_000)
    const jobOptions: JobsOptions = {
      jobId: REPEAT_JOB_NAME,
      repeat: {
        every: Math.max(60_000, Math.min(everyMs, 300_000)),
      },
      removeOnComplete: 20,
      removeOnFail: 50,
    }

    await queue.add(REPEAT_JOB_NAME, {}, jobOptions)

    logger.info({ intervalMs: jobOptions.repeat?.every }, 'Scheduled NEPSE live price collector')
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

export const nepseLivePriceQueue = new NepseLivePriceQueue()
