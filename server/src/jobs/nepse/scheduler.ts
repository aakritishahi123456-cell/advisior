import { queueManager, QUEUE_NAMES } from '@/queues/queueManager'
import logger from '@/utils/logger'

const DEFAULT_CRON = '20 15 * * 0-4' // 3:20 PM, Sun-Thu (Nepal trading days)

export async function ensureNepseCollectorScheduled(): Promise<void> {
  if (process.env.NEPSE_COLLECTOR_ENABLED === 'false') {
    logger.info('NEPSE collector disabled via NEPSE_COLLECTOR_ENABLED=false')
    return
  }

  const queue = queueManager.getQueue(QUEUE_NAMES.NEPSE_COLLECTOR)
  if (!queue) {
    logger.warn('NEPSE collector queue not initialized; skipping scheduling')
    return
  }

  const cron = process.env.NEPSE_COLLECTOR_CRON || DEFAULT_CRON
  const tz = process.env.NEPSE_COLLECTOR_TZ || 'Asia/Kathmandu'

  await queue.add(
    { type: 'nepse-collector' },
    {
      jobId: 'nepse-collector-daily',
      repeat: { cron, tz },
      removeOnComplete: 20,
      removeOnFail: 50,
    }
  )

  logger.info({ cron, tz }, 'Scheduled NEPSE collector repeat job')
}

