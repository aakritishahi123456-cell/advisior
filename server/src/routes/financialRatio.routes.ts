import { Router } from 'express';
import { FinancialRatioController } from '../controllers/financialRatio.controller';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { generalLimiter, proLimiter } from '../middleware/rateLimiter.middleware';
import { z } from 'zod';

const router = Router();

// Apply authentication to all ratio routes
router.use(requireAuth);

// Apply rate limiting
router.use(generalLimiter);

// Validation schemas
const calculateRatiosSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  previousYear: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
});

const getRatiosSchema = z.object({
  startYear: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
  endYear: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const ratioAnalysisSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear()),
});

const batchRatiosSchema = z.object({
  companies: z.array(z.object({
    symbol: z.string().min(1).max(10),
    year: z.number().int().min(2000).max(new Date().getFullYear()),
    previousYear: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
  })),
});

const comparisonSchema = z.object({
  symbols: z.array(z.string().min(1).max(10)),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
});

const industryBenchmarksSchema = z.object({
  industry: z.string().min(1).max(50),
  ratios: z.object({
    roe: z.number().optional(),
    debtRatio: z.number().optional(),
    profitMargin: z.number().optional(),
    currentRatio: z.number().optional(),
  }),
});

const compareIndustrySchema = z.object({
  symbol: z.string().min(1).max(10),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  industry: z.string().min(1).max(50),
});

const trendsSchema = z.object({
  years: z.coerce.number().int().min(1).max(20).default(5),
});

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('json'),
});

const formatRatiosSchema = z.object({
  ratios: z.record(z.number().optional()),
});

const colorsSchema = z.object({
  ratios: z.record(z.string().optional()),
});

// POST /api/v1/companies/:symbol/ratios/calculate - Calculate ratios
router.post('/calculate',
  validateRequest({ body: calculateRatiosSchema }),
  FinancialRatioController.calculateRatios
);

// GET /api/v1/companies/:symbol/ratios - Get ratios
router.get('/',
  validateRequest({ query: getRatiosSchema }),
  FinancialRatioController.getRatios
);

// POST /api/v1/companies/:symbol/ratios/analysis - Get ratio analysis
router.post('/analysis',
  validateRequest({ body: ratioAnalysisSchema }),
  FinancialRatioController.getRatioAnalysis
);

// POST /api/v1/companies/ratios/batch - Calculate batch ratios
router.post('/batch',
  validateRequest({ body: batchRatiosSchema }),
  FinancialRatioController.calculateBatchRatios
);

// POST /api/v1/companies/ratios/comparison - Get ratio comparison
router.post('/comparison',
  validateRequest({ body: comparisonSchema }),
  FinancialRatioController.getRatioComparison
);

// POST /api/v1/ratios/industry/benchmarks - Get industry benchmarks
router.post('/industry/benchmarks',
  validateRequest({ body: industryBenchmarksSchema }),
  FinancialRatioController.getIndustryBenchmarks
);

// POST /api/v1/companies/:symbol/ratios/compare - Compare to industry
router.post('/compare',
  validateRequest({ body: compareIndustrySchema }),
  FinancialRatioController.compareToIndustry
);

// GET /api/v1/companies/:symbol/ratios/trends - Get ratio trends
router.get('/trends',
  validateRequest({ query: trendsSchema }),
  FinancialRatioController.getRatioTrends
);

// GET /api/v1/companies/:symbol/ratios/statistics - Get ratio statistics
router.get('/statistics',
  FinancialRatioController.getRatioStatistics
);

// POST /api/v1/ratios/format - Format ratios
router.post('/format',
  validateRequest({ body: formatRatiosSchema }),
  FinancialRatioController.formatRatios
);

// POST /api/v1/ratios/colors - Get ratio colors
router.post('/colors',
  validateRequest({ body: colorsSchema }),
  FinancialRatioController.getRatioColors
);

// GET /api/v1/companies/:symbol/ratios/export - Export ratios
router.get('/export',
  validateRequest({ query: exportSchema }),
  FinancialRatioController.exportRatios
);

// Apply validation middleware to routes that need it
router.post('/calculate', FinancialRatioController.validateRatios);
router.post('/format', FinancialRatioController.validateRatios);
router.post('/colors', FinancialRatioController.validateRatios);

export default router;
