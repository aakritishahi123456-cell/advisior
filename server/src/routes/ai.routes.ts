import { Router } from 'express';
import { z } from 'zod';
import aiChatController from '../controllers/aiChat.controller';
import { asyncHandler } from '../middleware/errorHandler';
import { FinancialReportRagService } from '../services/financialReportRag.service';
import { MultiAgentFinancialSystemService } from '../services/multiAgentFinancialSystem.service';
import { StructuredFinancialAnalysisService } from '../services/structuredFinancialAnalysis.service';
import { FinancialEvaluationBenchmarkService } from '../services/financialEvaluationBenchmark.service';

const router = Router();

const ingestRagSchema = z
  .object({
    companyId: z.string().trim().min(1).optional(),
    symbol: z.string().trim().min(1).max(20).optional(),
    fileUrl: z.string().url().optional(),
    reportText: z.string().trim().min(20).max(500000).optional(),
    type: z.string().trim().min(1).max(100).optional(),
    uploadedAt: z.string().datetime().optional(),
    includeRatios: z.boolean().optional(),
    ratioYears: z.number().int().min(1).max(20).optional(),
  })
  .refine((payload) => Boolean(payload.companyId || payload.symbol), {
    message: 'companyId or symbol is required',
  })

const queryRagSchema = z.object({
  company: z.string().trim().min(1).max(200),
  query: z.string().trim().min(3).max(2000),
  topK: z.number().int().min(1).max(20).optional(),
  minSimilarity: z.number().min(0).max(1).optional(),
})

const multiAgentQuerySchema = z.object({
  query: z.string().trim().min(3).max(2000),
  company: z.string().trim().min(1).max(200).optional(),
})

const structuredAnalysisSchema = z.object({
  roe: z.number().min(-1000).max(1000),
  eps: z.number().min(-1000000).max(1000000),
  debt_ratio: z.number().min(0).max(10),
  revenue_trend: z.enum(['increasing', 'stable', 'declining']),
})

// POST /api/ai/chat - Chat with AI financial advisor
router.post('/chat', aiChatController.handleChat);

router.post(
  '/rag/ingest',
  asyncHandler(async (req, res) => {
    const payload = ingestRagSchema.parse(req.body)
    const result = await FinancialReportRagService.ingestFinancialKnowledge(payload)

    res.status(201).json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/rag/query',
  asyncHandler(async (req, res) => {
    const payload = queryRagSchema.parse(req.body)
    const result = await FinancialReportRagService.queryFinancialKnowledge(payload)

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/agents/query',
  asyncHandler(async (req, res) => {
    const payload = multiAgentQuerySchema.parse(req.body)
    const result = await MultiAgentFinancialSystemService.run(payload)

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

router.post(
  '/analysis/structured',
  asyncHandler(async (req, res) => {
    const payload = structuredAnalysisSchema.parse(req.body)
    const result = StructuredFinancialAnalysisService.analyze(payload)

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

router.get(
  '/evaluation/benchmark',
  asyncHandler(async (_req, res) => {
    const result = FinancialEvaluationBenchmarkService.runBenchmark()

    res.status(200).json({
      success: true,
      data: result,
    })
  })
)

export default router;
