import { Router } from 'express'
import { z } from 'zod'
import { requireAuth, type AuthRequest } from '../middleware/auth.middleware'
import { asyncHandler } from '../middleware/errorHandler'
import { OfficialFinancialDataService } from '../services/officialFinancialData.service'

const router = Router()

const ingestSchema = z.object({
  symbol: z.string().trim().min(1).max(10),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  pdfUrl: z.string().url(),
  title: z.string().trim().min(1).optional(),
  documentType: z.string().trim().min(1).optional(),
  publishedAt: z.string().datetime().optional(),
})

router.post(
  '/ingest',
  requireAuth,
  asyncHandler(async (req: AuthRequest, res: any) => {
    const parsed = ingestSchema.parse(req.body)
    const result = await OfficialFinancialDataService.ingestOfficialPdf({
      symbol: parsed.symbol,
      year: parsed.year,
      pdfUrl: parsed.pdfUrl,
      title: parsed.title,
      documentType: parsed.documentType,
      publishedAt: parsed.publishedAt,
    })

    res.status(201).json({
      success: true,
      data: result,
    })
  })
)

export default router
