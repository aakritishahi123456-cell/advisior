import { Router } from 'express'
import { z } from 'zod'
import { asyncHandler } from '../middleware/errorHandler'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { DocumentIntelligenceService } from '../services/documentIntelligence.service'

const router = Router()

const ingestSchema = z.object({
  companyId: z.string().trim().min(1).optional(),
  symbol: z.string().trim().min(1).max(20).optional(),
  fileUrl: z.string().url(),
  type: z.string().trim().min(1).max(100),
  uploadedAt: z.string().datetime().optional(),
})

const querySchema = z.object({
  company: z.string().trim().min(1).max(200),
  question: z.string().trim().min(3).max(2000),
  limit: z.number().int().min(1).max(50).optional(),
})

router.post(
  '/ingest',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const payload = ingestSchema.parse(req.body)
    const result = await DocumentIntelligenceService.ingestFiling(payload)

    res.status(201).json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/query',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const payload = querySchema.parse(req.body)
    const result = await DocumentIntelligenceService.answerFromFilings(payload)

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

export default router
