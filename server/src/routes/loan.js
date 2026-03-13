import { Router } from 'express';
import { LoanController } from '../controllers/LoanController';
import { LoanControllerMiddleware } from '../controllers/LoanController';
import { authenticate, optionalAuth, authorize } from '../middleware/auth';
import { generalLimiter, strictLimiter } from '../middleware/rateLimit';

const router = Router();
const loanController = new LoanController();

// Public routes (no authentication required for basic simulation)
router.post('/simulate', 
  generalLimiter,
  LoanControllerMiddleware.validateSimulate,
  loanController.simulate
);

// Quick EMI calculation (no database storage)
router.post('/emi', 
  strictLimiter,
  LoanControllerMiddleware.validateQuickEMI,
  loanController.quickEMI
);

// Health check for loan service
router.get('/health', 
  loanController.health
);

// Protected routes (require authentication)
router.use(authenticate);

// Get user's loan history
router.get('/history', 
  loanController.getLoanHistory
);

// Get user's simulations (legacy endpoint)
router.get('/simulations', 
  loanController.getUserSimulations
);

// Get specific simulation
router.get('/simulations/:id', 
  loanController.getSimulation
);

// Delete simulation
router.delete('/simulations/:id', 
  loanController.deleteSimulation
);

// Get simulation statistics
router.get('/simulations/stats', 
  loanController.getSimulationStats
);

// Compare simulations
router.post('/simulations/compare', 
  LoanControllerMiddleware.validateCompare,
  loanController.compareSimulations
);

// Batch simulate multiple loans
router.post('/simulations/batch', 
  LoanControllerMiddleware.validateBatchSimulate,
  loanController.batchSimulate
);

// Export simulations
router.get('/simulations/export', 
  loanController.exportSimulations
);

// Get simulation analytics
router.get('/simulations/analytics', 
  loanController.getSimulationAnalytics
);

// Get popular simulations
router.get('/simulations/popular', 
  loanController.getPopularSimulations
);

// Get simulation trends
router.get('/simulations/trends', 
  loanController.getSimulationTrends
);

// Search simulations
router.get('/simulations/search', 
  LoanControllerMiddleware.validateSearch,
  loanController.searchSimulations
);

// Admin routes (require admin permissions)
router.use((req, res, next) => {
  // Check if user is admin (you might want to implement proper role-based access control)
  if (req.user.subscription?.plan !== 'ENTERPRISE') {
    return res.status(403).json({
      success: false,
      error: {
        message: 'Admin access required',
      },
    });
  }
  next();
});

// Get all simulations (admin)
router.get('/admin/all', 
  loanController.getAll
);

// Get all simulation statistics (admin)
router.get('/admin/stats', 
  loanController.getStats
);

export { router as loanRouter };
