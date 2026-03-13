import { Router } from 'express';
import { BaseController } from '../controllers/BaseController';
import { authenticate, optionalAuth, authorize } from '../middleware/auth';
import { validate } from '../middleware/validation';
import { z } from 'zod';

const router = Router();
const companyController = new BaseController(); // You'll create CompanyService later

// Validation schemas
const createCompanySchema = z.object({
  name: z.string().min(2).max(100),
  symbol: z.string().min(1).max(10).toUpperCase(),
  industry: z.string().min(2).max(50),
  sector: z.string().min(2).max(50).optional(),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
  marketCap: z.number().positive().optional(),
  sharePrice: z.number().positive().optional(),
});

const updateCompanySchema = z.object({
  name: z.string().min(2).max(100).optional(),
  industry: z.string().min(2).max(50).optional(),
  sector: z.string().min(2).max(50).optional(),
  description: z.string().max(1000).optional(),
  website: z.string().url().optional(),
  marketCap: z.number().positive().optional(),
  sharePrice: z.number().positive().optional(),
});

const searchSchema = z.object({
  q: z.string().min(1),
  industry: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

// Public routes (no authentication required for basic company info)
router.get('/', 
  optionalAuth,
  companyController.getAll
);

router.get('/search', 
  optionalAuth,
  validate({ query: searchSchema }),
  companyController.search
);

router.get('/trending', 
  optionalAuth,
  companyController.trending // You'll implement this in CompanyController
);

router.get('/stats', 
  companyController.getStats
);

// Get specific company
router.get('/:id', 
  optionalAuth,
  companyController.getById
);

router.get('/symbol/:symbol', 
  optionalAuth,
  companyController.getBySymbol // You'll implement this in CompanyController
);

// Protected routes (require authentication)
router.use(authenticate);

// Create company (admin only)
router.post('/', 
  authorize('PRO', 'ENTERPRISE'),
  validate({ body: createCompanySchema }),
  companyController.create
);

// Update company (admin only)
router.put('/:id', 
  authorize('PRO', 'ENTERPRISE'),
  validate({ body: updateCompanySchema }),
  companyController.update
);

// Delete company (admin only)
router.delete('/:id', 
  authorize('ENTERPRISE'),
  companyController.delete
);

// Get companies by industry
router.get('/industry/:industry', 
  authorize('FREE', 'BASIC', 'PRO', 'ENTERPRISE'),
  companyController.getByIndustry // You'll implement this in CompanyController
);

// Get top companies by market cap
router.get('/top/market-cap', 
  authorize('FREE', 'BASIC', 'PRO', 'ENTERPRISE'),
  companyController.getTopByMarketCap // You'll implement this in CompanyController
);

// Get companies with financial data
router.get('/with-financial-data/:year', 
  authorize('BASIC', 'PRO', 'ENTERPRISE'),
  companyController.getWithFinancialData // You'll implement this in CompanyController
);

// Get companies with AI reports
router.get('/with-ai-reports/:year', 
  authorize('BASIC', 'PRO', 'ENTERPRISE'),
  companyController.getWithAIReports // You'll implement this in CompanyController
);

export { router as companyRouter };
