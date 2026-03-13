import { Router } from 'express';
import { LoanController } from '../controllers/loan.controller';
import { LoanProductsController } from '../controllers/loanProducts.controller';
import { requireAuth, requirePro, AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { 
  createLoanSchema, 
  updateLoanSchema, 
  loanSimulationSchema, 
  loanQuerySchema, 
  loanIdSchema 
} from '../validators/loan.validator';
import { loanProductsCompareQuerySchema } from '../validators/loanProducts.validator';
import { freeLimiter, proLimiter } from '../middleware/rateLimiter.middleware';
import { trackUsage, apiRateLimit } from '../middleware/freemium.middleware';

const router = Router();

// Apply authentication to all loan routes except simulation
router.use((req, res, next) => {
  if (
    req.path === '/simulate' ||
    req.path === '/simulate/schedule' ||
    (req.method === 'GET' && req.path === '/compare')
  ) {
    return next(); // Skip authentication for simulation endpoints
  }
  return requireAuth(req, res, next);
});

// Apply API rate limiting
router.use(apiRateLimit());

// POST /api/v1/loans/simulate - Simulate loan calculation (no authentication required)
router.post('/simulate', 
  freeLimiter,
  validateRequest({ body: loanSimulationSchema }),
  LoanController.simulateLoan
);

// POST /api/v1/loans/simulate/schedule - Simulate loan with amortization schedule
router.post('/simulate/schedule', 
  freeLimiter,
  validateRequest({ body: loanSimulationSchema }),
  LoanController.simulateLoanWithSchedule
);

// GET /api/v1/loans/compare - Compare bank loan products (scraped DB)
router.get('/compare',
  freeLimiter,
  validateRequest({ query: loanProductsCompareQuerySchema }),
  LoanProductsController.compare
);

// POST /api/v1/loans/compare - Compare multiple loan options
router.post('/compare', 
  freeLimiter,
  validateRequest({ 
    body: {
      loans: {
        type: 'array',
        items: loanSimulationSchema
      }
    }
  }),
  LoanController.compareLoans
);

// POST /api/v1/loans/calculate/emi - Quick EMI calculation
router.post('/calculate/emi', 
  freeLimiter,
  validateRequest({ body: loanSimulationSchema }),
  LoanController.quickEMICalculation
);

// POST /api/v1/loans/affordability - Calculate loan affordability
router.post('/affordability', 
  freeLimiter,
  validateRequest({ 
    body: {
      monthlyIncome: { type: 'number', positive: true },
      existingEMIs: { type: 'number', minimum: 0, default: 0 }
    }
  }),
  LoanController.calculateAffordability
);

// Authenticated routes below
router.use(requireAuth);

// POST /api/v1/loans - Create new loan application
router.post('/', 
  freeLimiter, 
  trackUsage('report'),
  validateRequest({ body: createLoanSchema }),
  LoanController.createLoan
);

// POST /api/v1/loans/save-simulation - Save simulation to history
router.post('/save-simulation', 
  freeLimiter,
  trackUsage('report'),
  validateRequest({ body: loanSimulationSchema }),
  LoanController.saveSimulation
);

// GET /api/v1/loans - Get user's loans with pagination and filtering
router.get('/', 
  freeLimiter,
  validateRequest({ query: loanQuerySchema }),
  LoanController.getUserLoans
);

// GET /api/v1/loans/simulation-history - Get simulation history
router.get('/simulation-history', 
  freeLimiter,
  LoanController.getSimulationHistory
);

// GET /api/v1/loans/statistics - Get user's loan statistics
router.get('/statistics', 
  freeLimiter,
  LoanController.getLoanStatistics
);

// GET /api/v1/loans/:id - Get specific loan by ID
router.get('/:id', 
  freeLimiter,
  validateRequest({ params: loanIdSchema }),
  LoanController.getLoanById
);

// PUT /api/v1/loans/:id - Update loan (only if pending)
router.put('/:id', 
  freeLimiter,
  validateRequest({ 
    params: loanIdSchema,
    body: updateLoanSchema 
  }),
  LoanController.updateLoan
);

// DELETE /api/v1/loans/:id - Delete loan (only if pending)
router.delete('/:id', 
  freeLimiter,
  validateRequest({ params: loanIdSchema }),
  LoanController.deleteLoan
);

// Advanced loan analysis routes (PRO only)
router.get('/analytics/trends', 
  requirePro,
  proLimiter,
  LoanController.getLoanStatistics // This would be implemented for advanced analytics
);

router.get('/analytics/performance', 
  requirePro,
  proLimiter,
  LoanController.getLoanStatistics // This would be implemented for performance metrics
);

export default router;
