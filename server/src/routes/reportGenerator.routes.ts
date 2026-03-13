import { Router } from 'express';
import { ReportGeneratorController } from '../controllers/reportGenerator.controller';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { generalLimiter, proLimiter } from '../middleware/rateLimiter.middleware';
import { z } from 'zod';

const router = Router();

// Apply authentication to all report generator routes
router.use(requireAuth);

// Apply rate limiting
router.use(generalLimiter);

// Validation schemas
const generateReportSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  templateId: z.string().optional().default('retail_investor'),
});

const batchReportSchema = z.object({
  companies: z.array(z.object({
    companyId: z.string(),
    symbol: z.string(),
    year: z.number().int().min(2000).max(new Date().getFullYear()),
    templateId: z.string().optional().default('retail_investor'),
  })),
});

const getReportsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const comparisonSchema = z.object({
  years: z.coerce.number().int().min(1).max(10).default(3),
});

const exportSchema = z.object({
  format: z.enum(['csv', 'json']).default('json'),
});

// POST /api/v1/companies/:symbol/reports/generate - Generate AI report
router.post('/generate',
  validateRequest({ body: generateReportSchema }),
  ReportGeneratorController.validateReportData,
  ReportGeneratorController.checkReportLimits,
  ReportGeneratorController.generateReport
);

// GET /api/v1/companies/:symbol/reports/:year - Get AI report
router.get('/:year',
  ReportGeneratorController.getReport
);

// GET /api/v1/companies/:symbol/reports - Get all AI reports
router.get('/',
  validateRequest({ query: getReportsSchema }),
  ReportGeneratorController.getCompanyReports
);

// POST /api/v1/reports/batch - Generate batch AI reports
router.post('/batch',
  proLimiter,
  validateRequest({ body: batchReportSchema }),
  ReportGeneratorController.generateBatchReports
);

// GET /api/v1/reports/templates - Get available templates
router.get('/templates',
  ReportGeneratorController.getTemplates
);

// DELETE /api/v1/reports/:reportId - Delete AI report
router.delete('/:reportId',
  ReportGeneratorController.deleteReport
);

// GET /api/v1/reports/statistics - Get report statistics
router.get('/statistics',
  ReportGeneratorController.getReportStatistics
);

// GET /api/v1/companies/:symbol/reports/:year/pdf - Generate PDF
router.get('/:year/pdf',
  ReportGeneratorController.generatePDF
);

// GET /api/v1/companies/:symbol/reports/comparison - Compare reports
router.get('/comparison',
  validateRequest({ query: comparisonSchema }),
  ReportGeneratorController.compareReports
);

// GET /api/v1/companies/:symbol/reports/export - Export reports
router.get('/export',
  validateRequest({ query: exportSchema }),
  ReportGeneratorController.exportReports
);

export default router;
