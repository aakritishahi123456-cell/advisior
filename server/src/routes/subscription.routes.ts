import { Router } from 'express'
import { SubscriptionPlan } from '@prisma/client'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { PaymentService } from '../services/payment.service'
import { subscriptionService } from '../services/subscription.service'
import { productAnalyticsService, PRODUCT_EVENTS } from '../services/productAnalytics.service'

const router = Router()

const upgradeSchema = z.object({
  provider: z.enum(['KHALTI', 'ESEWA']),
  plan: z.literal(SubscriptionPlan.PRO).default(SubscriptionPlan.PRO),
})

router.get(
  '/status',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const status = await subscriptionService.getStatus(req.user!.id)

    res.status(200).json({
      success: true,
      data: status,
    })
  })
)

router.post(
  '/upgrade',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = upgradeSchema.parse(req.body)
    await productAnalyticsService.trackEvent({
      userId: req.user!.id,
      eventName: PRODUCT_EVENTS.UPGRADE_CLICKED,
      category: 'revenue',
      properties: {
        provider: payload.provider,
        plan: payload.plan,
      },
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })
    const session = await PaymentService.initiateSubscriptionPayment({
      userId: req.user!.id,
      provider: payload.provider,
      plan: payload.plan,
    })

    res.status(201).json({
      success: true,
      data: {
        redirectUrl: session.paymentUrl,
        ...session,
      },
    })
  })
)

export default router
