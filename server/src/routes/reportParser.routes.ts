import { Router } from 'express';
import { ReportParserController } from '../controllers/reportParser.controller';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { generalLimiter, proLimiter } from '../middleware/rateLimiter.middleware';
import { upload } from '../controllers/reportParser.controller';
import { z } from 'zod';

const router = Router();

// Apply authentication to all report parser routes
router.use(requireAuth);

// Apply rate limiting
router.use(generalLimiter);

// Validation schemas
const parseReportSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Invalid symbol format'),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  pdfUrl: z.string().url().optional(),
});

const uploadReportSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Invalid symbol format'),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
});

// POST /api/v1/reports/parse - Parse report from URL
router.post('/parse',
  validateRequest({ body: parseReportSchema }),
  ReportParserController.parseReportFromURL
);

// POST /api/v1/reports/upload - Upload and parse report from file
router.post('/upload',
  upload.single('pdf'),
  validateRequest({ body: uploadReportSchema }),
  ReportParserController.uploadAndParseReport
);

// GET /api/v1/reports/job/:jobId - Get parsing job status
router.get('/job/:jobId',
  ReportParserController.getJobStatus
);

// GET /api/v1/reports/:symbol/history - Get parsing history for a company
router.get('/:symbol/history',
  validateRequest({ 
    query: { limit: z.coerce.number().min(1).max(100).default(10) }
  }),
  ReportParserController.getParsingHistory
);

// GET /api/v1/reports/:symbol - Get financial reports for a company
router.get('/:symbol',
  validateRequest({ 
    query: { 
      year: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
      limit: z.coerce.number().min(1).max(100).default(10)
    }
  }),
  ReportParserController.getFinancialReports
);

// GET /api/v1/reports/:symbol/summary - Get financial metrics summary
router.get('/:symbol/summary',
  validateRequest({ 
    query: { years: z.coerce.number().min(1).max(20).default(5) }
  }),
  ReportParserController.getFinancialSummary
);

// DELETE /api/v1/reports/:symbol/:year - Delete financial report
router.delete('/:symbol/:year',
  proLimiter,
  ReportParserController.deleteFinancialReport
);

// PUT /api/v1/reports/:symbol/:year - Update financial report
router.put('/:symbol/:year',
  proLimiter,
  ReportParserController.updateFinancialReport
);

// GET /api/v1/reports/statistics - Get parsing statistics (admin only)
router.get('/statistics',
  proLimiter,
  ReportParserController.getParsingStatistics
);

export default router;
