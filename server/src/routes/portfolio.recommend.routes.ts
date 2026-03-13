import { Router } from 'express'
import { z } from 'zod'
import { Prisma, PrismaClient } from '@prisma/client'
import { spawn } from 'child_process'
import path from 'path'

const router = Router()

const RecommendSchema = z.object({
  investmentAmount: z.number().positive(),
  riskTolerance: z.enum(['low', 'medium', 'high']).default('medium'),
  duration: z.enum(['short', 'medium', 'long']).default('medium'),
  symbols: z.array(z.string().min(1)).optional(),
  maxPerStock: z.number().min(0.05).max(0.5).default(0.3),
  maxPerSector: z.number().min(0.1).max(1).optional(),
  ml: z.boolean().optional().default(false),
})

function lookbackDays(duration: 'short' | 'medium' | 'long'): number {
  if (duration === 'short') return 120
  if (duration === 'long') return 520
  return 260
}

function defaultMaxPerSector(riskTolerance: 'low' | 'medium' | 'high'): number {
  if (riskTolerance === 'low') return 0.35
  if (riskTolerance === 'high') return 0.7
  return 0.55
}

async function queryPriceHistory({
  prisma,
  symbols,
  fromDate,
}: {
  prisma: PrismaClient
  symbols?: string[]
  fromDate: Date
}): Promise<Array<{ symbol: string; date: Date; close: number; sector: string; marketCap: string | null }>> {
  const symbolsClause = symbols?.length ? Prisma.sql`AND p.symbol IN (${Prisma.join(symbols)})` : Prisma.empty

  const rows = await prisma.$queryRaw<
    Array<{ symbol: string; date: Date; close: number; sector: string; marketCap: string | null }>
  >(Prisma.sql`
    SELECT
      p.symbol as "symbol",
      p.date as "date",
      (p.close)::float8 as "close",
      c.sector as "sector",
      lf.market_cap::text as "marketCap"
    FROM prices p
    JOIN companies c ON c.symbol = p.symbol
    LEFT JOIN LATERAL (
      SELECT f.market_cap
      FROM financials f
      WHERE f.symbol = p.symbol
      ORDER BY f.as_of_date DESC
      LIMIT 1
    ) lf ON true
    WHERE p.date >= ${fromDate}
      AND p.close IS NOT NULL
      ${symbolsClause}
    ORDER BY p.date ASC;
  `)

  return rows
}

function runPythonEngine(payload: any): Promise<any> {
  const pythonBin = process.env.PYTHON_BIN || 'python'
  const enginePath =
    process.env.PYTHON_PORTFOLIO_ENGINE_PATH ||
    path.join(process.cwd(), 'python', 'portfolio_engine', 'main.py')

  return new Promise((resolve, reject) => {
    const child = spawn(pythonBin, [enginePath], {
      stdio: ['pipe', 'pipe', 'pipe'],
      env: process.env,
    })

    const timeoutMs = Number(process.env.PORTFOLIO_ENGINE_TIMEOUT_MS || 15_000)
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new Error('Portfolio engine timed out'))
    }, timeoutMs)

    let stdout = ''
    let stderr = ''
    child.stdout.on('data', (d) => (stdout += d.toString('utf8')))
    child.stderr.on('data', (d) => (stderr += d.toString('utf8')))

    child.on('error', (err) => {
      clearTimeout(timer)
      reject(err)
    })

    child.on('close', (code) => {
      clearTimeout(timer)
      if (!stdout.trim()) {
        reject(new Error(`Portfolio engine produced no output. stderr=${stderr}`))
        return
      }
      try {
        const parsed = JSON.parse(stdout)
        if (!parsed?.success) {
          reject(new Error(parsed?.error || `Portfolio engine failed (code=${code})`))
          return
        }
        resolve(parsed.data)
      } catch (err) {
        reject(new Error(`Failed to parse portfolio engine output. code=${code} stderr=${stderr}`))
      }
    })

    child.stdin.write(JSON.stringify(payload))
    child.stdin.end()
  })
}

router.post('/recommend', async (req, res) => {
  const parsed = RecommendSchema.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ success: false, error: 'Invalid input', details: parsed.error.flatten() })
    return
  }

  const { investmentAmount, riskTolerance, duration, symbols, maxPerStock, maxPerSector, ml } = parsed.data
  const prisma = new PrismaClient()

  try {
    const fromDate = new Date(Date.now() - lookbackDays(duration) * 24 * 60 * 60 * 1000)
    const rows = await queryPriceHistory({ prisma, symbols: symbols?.map((s) => s.toUpperCase()), fromDate })

    if (rows.length === 0) {
      res.status(404).json({ success: false, error: 'No market data found in DB for the requested universe' })
      return
    }

    const enginePayload = {
      investmentAmount,
      riskTolerance,
      duration,
      maxPerStock,
      maxPerSector: maxPerSector ?? defaultMaxPerSector(riskTolerance),
      ml,
      prices: rows.map((r) => ({
        symbol: r.symbol,
        date: r.date.toISOString(),
        close: r.close,
        sector: r.sector,
        marketCap: r.marketCap,
      })),
    }

    const result = await runPythonEngine(enginePayload)
    res.json({ success: true, data: result })
  } catch (error: any) {
    res.status(500).json({ success: false, error: error?.message || 'Failed to generate portfolio recommendation' })
  } finally {
    await prisma.$disconnect()
  }
})

export default router

