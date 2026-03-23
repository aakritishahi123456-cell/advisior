import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { checkSubscription } from '../middleware/subscription.middleware'
import { FinancialIntelligenceOrchestrator } from '../services/financialIntelligenceOrchestrator'

const router = Router()

const querySchema = z.object({
  question: z.string().trim().min(5).max(2000),
  symbol: z.string().trim().min(1).max(20).optional(),
})

router.post(
  '/query',
  requireAuth,
  checkSubscription({ featureKey: 'advanced_analysis', premiumOnly: true, trackUsage: false }),
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { question, symbol } = querySchema.parse(req.body)

    const result = await FinancialIntelligenceOrchestrator.runFinancialQuery({
      userId: req.user!.id,
      question,
      symbol,
    })

    res.status(201).json({
      success: true,
      data: result,
    })
  })
)

export default router
