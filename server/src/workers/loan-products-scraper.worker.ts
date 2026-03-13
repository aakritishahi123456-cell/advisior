import { Job } from 'bull'
import { PrismaClient } from '@prisma/client'
import { spawn } from 'child_process'
import path from 'path'
import logger from '@/utils/logger'

type LoanProductsScraperJob = {
  type: 'loan-products-scraper'
  banks?: string
}

const prisma = new PrismaClient()

function getPythonBin(): string {
  if (process.env.PYTHON_BIN) return process.env.PYTHON_BIN
  return process.platform === 'win32' ? 'python' : 'python3'
}

function truncate(text: string, max: number): string {
  if (text.length <= max) return text
  return text.slice(0, max) + `\n...[truncated ${text.length - max} chars]`
}

async function runLoanProductsScraper(banks?: string): Promise<{
  exitCode: number
  stdout: string
  stderr: string
}> {
  const python = getPythonBin()
  const scriptPath = path.resolve(process.cwd(), 'scripts', 'scrape-loan-products.py')

  const args = [scriptPath]
  if (banks && banks.trim().length > 0) {
    args.push('--banks', banks.trim())
  }

  return new Promise((resolve, reject) => {
    const child = spawn(python, args, {
      cwd: process.cwd(),
      env: process.env,
      shell: false,
    })

    let stdout = ''
    let stderr = ''

    child.stdout.on('data', (chunk) => {
      stdout += chunk.toString()
    })
    child.stderr.on('data', (chunk) => {
      stderr += chunk.toString()
    })

    child.on('error', reject)
    child.on('close', (code) => {
      resolve({ exitCode: typeof code === 'number' ? code : 1, stdout, stderr })
    })
  })
}

function parseUpsertCount(output: string): number | null {
  const match = output.match(/Upserted\s+(\d+)\s+loan product rows/i)
  if (!match) return null
  const count = Number(match[1])
  return Number.isFinite(count) ? count : null
}

export default async function loanProductsScraperProcessor(job: Job): Promise<any> {
  const data = job.data as LoanProductsScraperJob
  const banks = typeof data?.banks === 'string' ? data.banks : process.env.LOAN_PRODUCTS_SCRAPER_BANKS

  const startedAt = new Date()
  const pipelineLog = await prisma.pipelineLog.create({
    data: {
      pipelineType: 'LOAN_PRODUCTS_SCRAPER',
      status: 'RUNNING',
      startedAt,
      details: { jobId: job.id, banks: banks || null },
    },
  })

  try {
    logger.info({ jobId: job.id, banks }, 'Running loan products scraper job')

    const result = await runLoanProductsScraper(banks)
    const upserted = parseUpsertCount(result.stdout)

    const completedAt = new Date()
    await prisma.pipelineLog.update({
      where: { id: pipelineLog.id },
      data: {
        status: result.exitCode === 0 ? 'COMPLETED' : 'FAILED',
        completedAt,
        metrics: { exitCode: result.exitCode, upserted },
        details: {
          ...(pipelineLog.details as any),
          stdout: truncate(result.stdout, 20_000),
          stderr: truncate(result.stderr, 20_000),
        },
      },
    })

    if (result.exitCode !== 0) {
      throw new Error(`Loan products scraper exited with code ${result.exitCode}`)
    }

    return { exitCode: result.exitCode, upserted }
  } catch (error: any) {
    const completedAt = new Date()
    await prisma.pipelineLog.update({
      where: { id: pipelineLog.id },
      data: {
        status: 'FAILED',
        completedAt,
        details: {
          ...(pipelineLog.details as any),
          error: error?.message || String(error),
        },
      },
    })
    logger.error({ jobId: job.id, error: error?.message }, 'Loan products scraper job failed')
    throw error
  }
}

