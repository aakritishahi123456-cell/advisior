import { Router } from 'express'
import { asyncHandler } from '../middleware/errorHandler'
import { getLiveMarketData } from '../services/marketLive.service'

const router = Router()

router.get(
  '/live',
  asyncHandler(async (req: any, res: any) => {
    const symbols =
      typeof req.query.symbols === 'string' && req.query.symbols.trim().length > 0
        ? req.query.symbols
            .split(',')
            .map((symbol: string) => symbol.trim().toUpperCase())
            .filter(Boolean)
        : undefined

    const data = await getLiveMarketData(symbols)

    res.json({
      success: true,
      count: data.length,
      data: data.map((row) => ({
        symbol: row.symbol,
        price: row.price,
        change: row.change,
        volume: row.volume ? row.volume.toString() : null,
      })),
    })
  })
)

export default router
