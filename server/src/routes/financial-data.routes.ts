import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { checkSubscription } from '../middleware/subscription.middleware'
import { FinancialDataRetrievalService } from '../services/financialDataRetrieval.service'
import { FinancialDataAnalysisService } from '../services/financialDataAnalysis.service'
import { FinalFinancialAnswerService } from '../services/finalFinancialAnswer.service'
import { INSUFFICIENT_DATA_MESSAGE } from '../services/aiSafety.service'
import { productAnalyticsService, PRODUCT_EVENTS } from '../services/productAnalytics.service'

const router = Router()

const querySchema = z.object({
  query: z.string().trim().min(3).max(1000),
  symbol: z.string().trim().min(1).max(20).optional(),
})

const analysisSchema = z.object({
  company: z.string().trim().min(1).max(20),
  data: z.object({
    revenue: z.number().nullable(),
    profit: z.number().nullable(),
    growth: z.number().nullable(),
    latest_price: z.number().nullable(),
    PE_ratio: z.number().nullable(),
  }),
})

router.post(
  '/query',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { query, symbol } = querySchema.parse(req.body)

    const result = await FinancialDataRetrievalService.fetchRelevantFinancialData({
      query,
      symbol,
    })

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/analyze',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const payload = analysisSchema.parse(req.body)
    const result = FinancialDataAnalysisService.analyze(payload)

    if (result === 'INSUFFICIENT DATA') {
      res.status(200).json({
        success: true,
        data: INSUFFICIENT_DATA_MESSAGE,
      })
      return
    }

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/answer',
  requireAuth,
  checkSubscription({ featureKey: 'company_reports', trackUsage: true }),
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { query, symbol } = querySchema.parse(req.body)
    const result = await FinalFinancialAnswerService.generate({ query, symbol })

    if (result !== INSUFFICIENT_DATA_MESSAGE) {
      await productAnalyticsService.trackEvent({
        userId: req.user!.id,
        eventName: PRODUCT_EVENTS.REPORT_GENERATED,
        category: 'activation',
        properties: {
          query,
          symbol: symbol ?? null,
          sources: result.sources,
        },
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      })
    }

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

export default router
