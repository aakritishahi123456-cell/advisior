import { JobsOptions, Processor, Queue, QueueEvents, Worker } from 'bullmq'
import logger from '../utils/logger'
import { runNepseLivePriceCollector } from '../jobs/nepse/livePriceCollector'
import { OfficialFinancialDataService } from '../services/officialFinancialData.service'

export const INGESTION_QUEUE_NAMES = {
  NEPSE_DATA: 'nepse-data',
  FINANCIAL_SCRAPER: 'financial-scraper',
  NEWS_ANALYSIS: 'news-analysis',
} as const

type IngestionQueueName =
  (typeof INGESTION_QUEUE_NAMES)[keyof typeof INGESTION_QUEUE_NAMES]

export type NepseDataJob = {
  task: 'collect-live'
  requestedAt?: string
}

export type FinancialScraperJob = {
  task: 'ingest-official-pdf'
  symbol: string
  year: number
  pdfUrl: string
  title?: string
  documentType?: string
  publishedAt?: string
}

export type NewsAnalysisJob = {
  task: 'analyze-news'
  articleId?: string
  title: string
  content: string
  sourceName?: string
}

type QueueDefinition = {
  concurrency: number
  defaultJobOptions: JobsOptions
  processor: Processor<any, any, string>
}

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

async function processNepseData(job: { data: NepseDataJob; id?: string }) {
  if (job.data.task !== 'collect-live') {
    throw new Error(`Unsupported nepse-data task: ${job.data.task}`)
  }

  logger.info({ jobId: job.id, task: job.data.task }, 'Processing nepse-data job')
  return runNepseLivePriceCollector()
}

async function processFinancialScraper(job: { data: FinancialScraperJob; id?: string }) {
  if (job.data.task !== 'ingest-official-pdf') {
    throw new Error(`Unsupported financial-scraper task: ${job.data.task}`)
  }

  logger.info(
    { jobId: job.id, symbol: job.data.symbol, year: job.data.year },
    'Processing financial-scraper job'
  )

  return OfficialFinancialDataService.ingestOfficialPdf({
    symbol: job.data.symbol,
    year: job.data.year,
    pdfUrl: job.data.pdfUrl,
    title: job.data.title,
    documentType: job.data.documentType,
    publishedAt: job.data.publishedAt,
  })
}

function scoreSentiment(text: string): 'positive' | 'negative' | 'neutral' {
  const lower = text.toLowerCase()
  const positiveHits = ['growth', 'profit', 'gain', 'strong', 'surge', 'improved'].filter((token) =>
    lower.includes(token)
  ).length
  const negativeHits = ['loss', 'decline', 'weak', 'drop', 'fall', 'risk'].filter((token) =>
    lower.includes(token)
  ).length

  if (positiveHits > negativeHits) {
    return 'positive'
  }
  if (negativeHits > positiveHits) {
    return 'negative'
  }
  return 'neutral'
}

async function processNewsAnalysis(job: { data: NewsAnalysisJob; id?: string }) {
  if (job.data.task !== 'analyze-news') {
    throw new Error(`Unsupported news-analysis task: ${job.data.task}`)
  }

  const sentiment = scoreSentiment(`${job.data.title}\n${job.data.content}`)
  const wordCount = job.data.content.trim().split(/\s+/).filter(Boolean).length

  logger.info(
    { jobId: job.id, articleId: job.data.articleId, sentiment, wordCount },
    'Processing news-analysis job'
  )

  return {
    articleId: job.data.articleId ?? null,
    sentiment,
    wordCount,
    sourceName: job.data.sourceName ?? null,
  }
}

const QUEUE_DEFINITIONS: Record<IngestionQueueName, QueueDefinition> = {
  [INGESTION_QUEUE_NAMES.NEPSE_DATA]: {
    concurrency: 1,
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: 'exponential', delay: 5_000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
    processor: processNepseData,
  },
  [INGESTION_QUEUE_NAMES.FINANCIAL_SCRAPER]: {
    concurrency: 2,
    defaultJobOptions: {
      attempts: 4,
      backoff: { type: 'exponential', delay: 10_000 },
      removeOnComplete: 50,
      removeOnFail: 100,
    },
    processor: processFinancialScraper,
  },
  [INGESTION_QUEUE_NAMES.NEWS_ANALYSIS]: {
    concurrency: 5,
    defaultJobOptions: {
      attempts: 5,
      backoff: { type: 'exponential', delay: 2_000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
    processor: processNewsAnalysis,
  },
}

class IngestionPipeline {
  private queues = new Map<IngestionQueueName, Queue>()
  private workers = new Map<IngestionQueueName, Worker>()
  private events = new Map<IngestionQueueName, QueueEvents>()

  async initialize(): Promise<void> {
    if (this.queues.size > 0) {
      return
    }

    const connection = getBullConnection()

    for (const queueName of Object.values(INGESTION_QUEUE_NAMES)) {
      const definition = QUEUE_DEFINITIONS[queueName]
      const queue = new Queue(queueName, {
        connection,
        defaultJobOptions: definition.defaultJobOptions,
      })
      const worker = new Worker(queueName, definition.processor, {
        connection,
        concurrency: definition.concurrency,
      })
      const events = new QueueEvents(queueName, { connection })

      worker.on('failed', (job, error) => {
        logger.error(
          {
            queue: queueName,
            jobId: job?.id,
            attemptsMade: job?.attemptsMade,
            error: error.message,
          },
          'BullMQ ingestion worker failed'
        )
      })

      worker.on('error', (error) => {
        logger.error({ queue: queueName, error: error.message }, 'BullMQ ingestion worker error')
      })

      events.on('completed', ({ jobId }) => {
        logger.info({ queue: queueName, jobId }, 'BullMQ ingestion job completed')
      })

      events.on('failed', ({ jobId, failedReason }) => {
        logger.error({ queue: queueName, jobId, failedReason }, 'BullMQ ingestion job failed')
      })

      this.queues.set(queueName, queue)
      this.workers.set(queueName, worker)
      this.events.set(queueName, events)
    }

    logger.info(
      { queues: Object.values(INGESTION_QUEUE_NAMES) },
      'BullMQ ingestion pipeline initialized'
    )
  }

  async addNepseDataJob(data: NepseDataJob, options?: JobsOptions) {
    return this.addJob(INGESTION_QUEUE_NAMES.NEPSE_DATA, data, options)
  }

  async addFinancialScraperJob(data: FinancialScraperJob, options?: JobsOptions) {
    return this.addJob(INGESTION_QUEUE_NAMES.FINANCIAL_SCRAPER, data, options)
  }

  async addNewsAnalysisJob(data: NewsAnalysisJob, options?: JobsOptions) {
    return this.addJob(INGESTION_QUEUE_NAMES.NEWS_ANALYSIS, data, options)
  }

  async addJob(queueName: IngestionQueueName, data: unknown, options?: JobsOptions) {
    const queue = this.queues.get(queueName)
    if (!queue) {
      throw new Error(`Ingestion queue ${queueName} is not initialized`)
    }

    return queue.add(queueName, data, options)
  }

  async getStats(): Promise<Record<string, any>> {
    const result: Record<string, any> = {}

    for (const [queueName, queue] of this.queues.entries()) {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queue.getWaitingCount(),
        queue.getActiveCount(),
        queue.getCompletedCount(),
        queue.getFailedCount(),
        queue.getDelayedCount(),
      ])

      result[queueName] = { waiting, active, completed, failed, delayed }
    }

    return result
  }

  async shutdown(): Promise<void> {
    await Promise.all([
      ...Array.from(this.events.values()).map((events) => events.close()),
      ...Array.from(this.workers.values()).map((worker) => worker.close()),
      ...Array.from(this.queues.values()).map((queue) => queue.close()),
    ])

    this.events.clear()
    this.workers.clear()
    this.queues.clear()

    logger.info('BullMQ ingestion pipeline shutdown complete')
  }
}

export const ingestionPipeline = new IngestionPipeline()
