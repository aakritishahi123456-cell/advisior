import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { TrustedAdvisorService } from '../services/trustedAdvisor.service'

const router = Router()

const chatSchema = z.object({
  message: z.string().trim().min(3, 'Please enter a more detailed question.').max(2000),
})

router.post(
  '/chat',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const { message } = chatSchema.parse(req.body)
    const result = await TrustedAdvisorService.answerQuestion(message)

    res.json({
      success: true,
      data: {
        answer: result.answer,
        reasoning: result.reasoning,
        sources: result.sources,
        userId: req.user!.id,
      },
    })
  })
)

export default router
