import { queueManager, QUEUE_NAMES } from '@/queues/queueManager'
import logger from '@/utils/logger'

const DEFAULT_CRON = '15 3 * * 0' // 03:15 AM, Sunday (weekly)

export async function ensureLoanProductsScraperScheduled(): Promise<void> {
  if (process.env.LOAN_PRODUCTS_SCRAPER_ENABLED === 'false') {
    logger.info('Loan products scraper disabled via LOAN_PRODUCTS_SCRAPER_ENABLED=false')
    return
  }

  const queue = queueManager.getQueue(QUEUE_NAMES.LOAN_PRODUCTS_SCRAPER)
  if (!queue) {
    logger.warn('Loan products scraper queue not initialized; skipping scheduling')
    return
  }

  const cron = process.env.LOAN_PRODUCTS_SCRAPER_CRON || DEFAULT_CRON
  const tz = process.env.LOAN_PRODUCTS_SCRAPER_TZ || 'Asia/Kathmandu'

  await queue.add(
    {
      type: 'loan-products-scraper',
      banks: process.env.LOAN_PRODUCTS_SCRAPER_BANKS || undefined,
    },
    {
      jobId: 'loan-products-scraper-weekly',
      repeat: { cron, tz },
      removeOnComplete: 20,
      removeOnFail: 50,
    }
  )

  logger.info({ cron, tz }, 'Scheduled loan products scraper repeat job')
}

