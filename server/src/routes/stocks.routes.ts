import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { StockFilterService } from '../services/stockFilter.service'

const router = Router()

const querySchema = z.object({
  query: z.string().trim().min(1).max(200).optional(),
  sector: z.string().trim().min(1).max(100).optional(),
  minGrowth: z.coerce.number().optional(),
  minProfit: z.coerce.number().optional(),
  minDividendYield: z.coerce.number().optional(),
  sortBy: z.enum(['growth', 'profit', 'dividendYield', 'price']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
})

router.get(
  '/filter',
  asyncHandler(async (req: any, res: any) => {
    const parsed = querySchema.parse(req.query)
    const result = await StockFilterService.filterStocks(parsed)

    res.status(200).json({
      success: true,
      ...result,
    })
  })
)

export default router
