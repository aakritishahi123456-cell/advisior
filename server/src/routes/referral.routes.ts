import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { referralService } from '../services/referral.service'

const router = Router()

const useReferralSchema = z.object({
  code: z.string().trim().min(1),
})

router.use(requireAuth)

router.get(
  '/status',
  asyncHandler(async (req: AuthRequest, res) => {
    const status = await referralService.getStatus(req.user!.id)

    res.json({
      success: true,
      data: status,
    })
  })
)

router.post(
  '/use',
  asyncHandler(async (req: AuthRequest, res) => {
    const payload = useReferralSchema.parse(req.body)
    const result = await referralService.useReferralCode(req.user!.id, payload.code)

    res.status(201).json({
      success: true,
      data: result,
    })
  })
)

export default router
