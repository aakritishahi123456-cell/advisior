import { Job } from 'bull'
import logger from '@/utils/logger'
import { runNepseCollector } from '@/jobs/nepse/nepseCollector'

export default async function nepseCollectorProcessor(job: Job): Promise<any> {
  const businessDateISO = typeof job.data?.businessDateISO === 'string' ? job.data.businessDateISO : undefined
  logger.info({ jobId: job.id, businessDateISO }, 'Running NEPSE collector job')
  return runNepseCollector({ businessDateISO })
}

