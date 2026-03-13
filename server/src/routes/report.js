import { Router } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticate, optionalAuth, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const reportController = new BaseController(); // You'll create ReportService later

// Validation schemas
const generateReportSchema = z.object({
  companyId: z.string(),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  reportType: z.enum(['ANNUAL', 'QUARTERLY', 'CUSTOM']).default('ANNUAL'),
  template: z.enum(['RETAIL_INVESTOR', 'RISK_FOCUSED', 'GROWTH_ANALYSIS']).default('RETAIL_INVESTOR'),
});

const updateReportSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  summary: z.string().max(1000).optional(),
  content: z.string().optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
});

const searchSchema = z.object({
  q: z.string().min(1),
  year: z.coerce.number().int().optional(),
  reportType: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Public routes (no authentication required for basic report info)
router.get('/', 
  optionalAuth,
  reportController.getAll
);

router.get('/search', 
  optionalAuth,
  validate({ query: searchSchema }),
  reportController.search
);

router.get('/stats', 
  reportController.getStats
);

// Get specific report
router.get('/:id', 
  optionalAuth,
  reportController.getById
);

// Protected routes (require authentication)
router.use(authenticate);

// Generate AI report
router.post('/generate', 
  authorize('BASIC', 'PRO', 'ENTERPRISE'),
  validate({ body: generateReportSchema }),
  reportController.generate // You'll implement this in ReportController
);

// Create manual report
router.post('/', 
  authorize('PRO', 'ENTERPRISE'),
  reportController.create
);

// Update report
router.put('/:id', 
  authorize('PRO', 'ENTERPRISE'),
  validate({ body: updateReportSchema }),
  reportController.update
);

// Delete report
router.delete('/:id', 
  authorize('PRO', 'ENTERPRISE'),
  reportController.delete
);

// Get user's reports
router.get('/user/my-reports', 
  authorize('FREE', 'BASIC', 'PRO', 'ENTERPRISE'),
  reportController.getUserReports // You'll implement this in ReportController
);

// Get company reports
router.get('/company/:companyId', 
  authorize('FREE', 'BASIC', 'PRO', 'ENTERPRISE'),
  reportController.getCompanyReports // You'll implement this in ReportController
);

// Export report
router.get('/:id/export', 
  authorize('BASIC', 'PRO', 'ENTERPRISE'),
  reportController.export // You'll implement this in ReportController
);

// Batch generate reports
router.post('/batch-generate', 
  authorize('PRO', 'ENTERPRISE'),
  reportController.batchGenerate // You'll implement this in ReportController
);

// Get report templates
router.get('/templates', 
  authorize('FREE', 'BASIC', 'PRO', 'ENTERPRISE'),
  reportController.getTemplates // You'll implement this in ReportController
);

export { router as reportRouter };
