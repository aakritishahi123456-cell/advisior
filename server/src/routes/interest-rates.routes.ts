import { Router } from 'express'
import { asyncHandler, createError } from '../middleware/errorHandler'
import { InterestRatesService } from '../services/interestRates.service'

const router = Router()

router.get(
  '/',
  asyncHandler(async (req: any, res: any) => {
    let productType
    try {
      productType = InterestRatesService.normalizeProductType(
        typeof req.query.product_type === 'string' ? req.query.product_type : undefined
      )
    } catch (error: any) {
      throw createError(error?.message || 'Invalid product_type', 400)
    }

    const rates = await InterestRatesService.getLatestRates(productType)

    res.json({
      success: true,
      count: rates.length,
      data: rates.map((rate) => ({
        id: rate.id,
        bank_name: rate.bankName,
        product_type: rate.productType,
        rate: rate.rate,
        last_updated: rate.lastUpdated.toISOString(),
      })),
    })
  })
)

export default router
