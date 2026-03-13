import { Router } from 'express';
import { FinancialReportController } from '../controllers/financialReport.controller';
import { requireAuth, requirePro, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  createReportSchema, 
  updateReportSchema, 
  reportQuerySchema, 
  reportIdSchema 
} from '../validators/financialReport.validator';
import { freeLimiter, proLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();

// Apply authentication to all financial report routes
router.use(requireAuth);

// POST /api/v1/reports - Create new financial report
router.post('/', 
  freeLimiter, 
  validateRequest({ body: createReportSchema }),
  FinancialReportController.createReport
);

// GET /api/v1/reports - Get user's financial reports with pagination and filtering
router.get('/', 
  validateRequest({ query: reportQuerySchema }),
  FinancialReportController.getUserReports
);

// GET /api/v1/reports/analytics - Get report analytics
router.get('/analytics', 
  freeLimiter,
  FinancialReportController.getReportAnalytics
);

// GET /api/v1/reports/:id - Get specific report by ID
router.get('/:id', 
  validateRequest({ params: reportIdSchema }),
  FinancialReportController.getReportById
);

// PUT /api/v1/reports/:id - Update report
router.put('/:id', 
  freeLimiter,
  validateRequest({ 
    params: reportIdSchema,
    body: updateReportSchema 
  }),
  FinancialReportController.updateReport
);

// DELETE /api/v1/reports/:id - Delete report
router.delete('/:id', 
  freeLimiter,
  validateRequest({ params: reportIdSchema }),
  FinancialReportController.deleteReport
);

// POST /api/v1/reports/:id/parse - Parse report content
router.post('/:id/parse', 
  freeLimiter,
  validateRequest({ params: reportIdSchema }),
  FinancialReportController.parseReport
);

// POST /api/v1/reports/upload - Upload report file (with multer middleware)
router.post('/upload', 
  freeLimiter,
  FinancialReportController.uploadReportFile
);

// Advanced analytics routes (PRO only)
router.get('/analytics/trends', 
  requirePro,
  proLimiter,
  FinancialReportController.getReportAnalytics // This would be implemented for advanced trends
);

router.get('/analytics/performance', 
  requirePro,
  proLimiter,
  FinancialReportController.getReportAnalytics // This would be implemented for performance metrics
);

export default router;
