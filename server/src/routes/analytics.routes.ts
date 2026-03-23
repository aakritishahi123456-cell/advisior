import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { optionalAuth, requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { productAnalyticsService } from '../services/productAnalytics.service'

const router = Router()

const eventSchema = z.object({
  eventName: z.string().trim().min(1).max(100),
  category: z.enum(['acquisition', 'activation', 'revenue', 'engagement']),
  properties: z.record(z.any()).optional(),
})

router.post(
  '/event',
  optionalAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = eventSchema.parse(req.body)
    const event = await productAnalyticsService.trackEvent({
      userId: req.user?.id ?? null,
      eventName: payload.eventName,
      category: payload.category,
      properties: payload.properties,
      ipAddress: req.ip,
      userAgent: req.get('user-agent'),
    })

    res.status(201).json({
      success: true,
      data: {
        id: event.id,
        eventName: event.eventName,
        createdAt: event.createdAt,
      },
    })
  })
)

router.get(
  '/dashboard',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res) => {
    const days = Number(req.query.days ?? 30)
    const dashboard = await productAnalyticsService.getDashboard(Number.isFinite(days) ? days : 30)

    res.json({
      success: true,
      data: dashboard,
    })
  })
)

export default router
