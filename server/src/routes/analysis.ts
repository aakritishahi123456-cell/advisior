import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient, AnalysisType } from '@prisma/client';
import { AuthRequest, asyncHandler, createError } from '../middleware/auth';
import { analyzeFinancialData } from '../services/aiAnalysis';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const createAnalysisSchema = z.object({
  analysisType: z.nativeEnum(AnalysisType),
  input: z.object({}) // JSON object for analysis input
});

// Create AI analysis
router.post('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const validatedData = createAnalysisSchema.parse(req.body);

  // Check subscription limits
  const analysisCount = await prisma.aIAnalysis.count({
    where: {
      userId: req.user!.id,
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)) // Last 30 days
      }
    }
  });

  if (req.user!.subscriptionPlan === 'FREE' && analysisCount >= 5) {
    throw createError('Free plan limit reached. Upgrade to continue.', 429);
  }

  // Perform AI analysis
  const result = await analyzeFinancialData(validatedData.input, validatedData.analysisType);

  const analysis = await prisma.aIAnalysis.create({
    data: {
      ...validatedData,
      userId: req.user!.id,
      result: result as any,
      confidence: result.confidence
    }
  });

  res.status(201).json({
    message: 'Analysis completed successfully',
    analysis
  });
}));

// Get user's analyses
router.get('/', asyncHandler(async (req: AuthRequest, res: any) => {
  const analyses = await prisma.aIAnalysis.findMany({
    where: { userId: req.user!.id },
    orderBy: { createdAt: 'desc' }
  });

  res.json(analyses);
}));

// Get specific analysis
router.get('/:id', asyncHandler(async (req: AuthRequest, res: any) => {
  const analysis = await prisma.aIAnalysis.findFirst({
    where: {
      id: req.params.id,
      userId: req.user!.id
    }
  });

  if (!analysis) {
    throw createError('Analysis not found', 404);
  }

  res.json(analysis);
}));

export default router;
