import { BaseController } from './BaseController';
import { LoanService } from '../services/LoanService';
import { validateBody } from '../middleware/validation';
import { z } from 'zod';
import { HTTP_STATUS } from '../utils/response';
import { loanLogger } from '../utils/logger';

export class LoanController extends BaseController {
  constructor() {
    super(new LoanService());
    this.loanService = new LoanService();
  }

  /**
   * Simulate loan EMI
   * POST /v1/loan/simulate
   */
  simulate = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Extract user ID if authenticated
      const userId = req.user?.id;
      
      // Call service to simulate loan
      const result = await this.loanService.simulateLoan({
        ...req.body,
        userId,
      });

      const processingTime = Date.now() - startTime;

      loanLogger.info('Loan simulation successful', {
        simulationId: result.id,
        userId,
        processingTime,
        ip: req.ip,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          id: result.id,
          emi: result.emi,
          totalInterest: result.totalInterest,
          totalPayment: result.totalPayment,
          processingTime: result.processingTime,
          warnings: result.warnings,
          calculatedAt: result.calculatedAt,
        },
        message: 'Loan simulation completed successfully',
        meta: {
          processingTime: `${processingTime}ms`,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get simulation by ID
   * GET /v1/loan/simulations/:id
   */
  getSimulation = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const result = await this.loanService.getSimulation(id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Simulation retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's loan history
   * GET /v1/loan/history
   */
  getLoanHistory = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {},
      } = req.query;

      const result = await this.loanService.getLoanHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
        filters: filters ? JSON.parse(filters) : {},
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        message: 'Loan history retrieved successfully',
        meta: {
          pagination: result.pagination,
          summary: result.summary,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get user's simulations (legacy endpoint)
   * GET /v1/loan/simulations
   */
  getUserSimulations = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = req.query;

      const result = await this.loanService.getLoanHistory(userId, {
        page: parseInt(page),
        limit: parseInt(limit),
        sortBy,
        sortOrder,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        message: 'Simulations retrieved successfully',
        meta: {
          pagination: result.pagination,
          summary: result.summary,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Delete simulation
   * DELETE /v1/loan/simulations/:id
   */
  deleteSimulation = async (req, res, next) => {
    try {
      const { id } = req.params;
      const userId = req.user?.id;
      
      const result = await this.loanService.deleteSimulation(id, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Simulation deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get simulation statistics
   * GET /v1/loan/simulations/stats
   */
  getSimulationStats = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      const result = await this.loanService.getSimulationStats(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Simulation statistics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Compare simulations
   * POST /v1/loan/simulations/compare
   */
  compareSimulations = async (req, res, next) => {
    try {
      const { simulationIds } = req.body;
      const userId = req.user?.id;
      
      const result = await this.loanService.compareSimulations(simulationIds, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Simulations compared successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Batch simulate multiple loans
   * POST /v1/loan/simulations/batch
   */
  batchSimulate = async (req, res, next) => {
    try {
      const { simulations } = req.body;
      const userId = req.user?.id;
      
      const result = await this.loanService.batchSimulate(simulations, userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Batch simulation completed',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Export simulations
   * GET /v1/loan/simulations/export
   */
  exportSimulations = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { format = 'json' } = req.query;
      
      const result = await this.loanService.exportSimulations(userId, format);

      if (format === 'csv') {
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="loan_simulations.csv"');
        res.send(result);
      } else {
        res.status(HTTP_STATUS.OK).json({
          success: true,
          data: result,
          message: 'Simulations exported successfully',
        });
      }
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get simulation analytics
   * GET /v1/loan/simulations/analytics
   */
  getSimulationAnalytics = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      
      const result = await this.loanService.getSimulationAnalytics(userId);

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Simulation analytics retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get popular simulations
   * GET /v1/loan/simulations/popular
   */
  getPopularSimulations = async (req, res, next) => {
    try {
      const { limit = 10 } = req.query;
      
      const result = await this.loanService.getPopularSimulations(parseInt(limit));

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Popular simulations retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get simulation trends
   * GET /v1/loan/simulations/trends
   */
  getSimulationTrends = async (req, res, next) => {
    try {
      const userId = req.user?.id;
      const { days = 30 } = req.query;
      
      const result = await this.loanService.getSimulationTrends(userId, parseInt(days));

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result,
        message: 'Simulation trends retrieved successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Search simulations
   * GET /v1/loan/simulations/search
   */
  searchSimulations = async (req, res, next) => {
    try {
      const { q: query } = req.query;
      const userId = req.user?.id;
      const {
        page = 1,
        limit = 20,
      } = req.query;

      if (!query) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'Search query is required',
          },
        });
      }

      const result = await this.loanService.searchSimulations(query, {
        page: parseInt(page),
        limit: parseInt(limit),
        userId,
      });

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: result.data,
        message: 'Search completed successfully',
        meta: {
          pagination: result.pagination,
          query,
        },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Quick EMI calculation (no database storage)
   * POST /v1/loan/emi
   */
  quickEMI = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Validate inputs inline for speed
      const { loanAmount, interestRate, tenureYears } = req.body;
      
      // Basic validation
      if (!loanAmount || !interestRate || !tenureYears) {
        return res.status(HTTP_STATUS.BAD_REQUEST).json({
          success: false,
          error: {
            message: 'All fields are required: loanAmount, interestRate, tenureYears',
          },
        });
      }

      // Import and use the calculator directly
      const { calculateLoanEMI } = await import('../utils/loanCalculator');
      
      const result = calculateLoanEMI({
        loanAmount: parseFloat(loanAmount),
        interestRate: parseFloat(interestRate),
        tenureYears: parseFloat(tenureYears),
      });

      const processingTime = Date.now() - startTime;

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          emi: result.emi,
          totalInterest: result.totalInterest,
          totalPayment: result.totalPayment,
          processingTime: `${processingTime}ms`,
          calculatedAt: new Date().toISOString(),
        },
        message: 'EMI calculated successfully',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Health check for loan service
   * GET /v1/loan/health
   */
  health = async (req, res, next) => {
    try {
      const startTime = Date.now();
      
      // Test EMI calculation
      const { calculateLoanEMI } = await import('../utils/loanCalculator');
      const testResult = calculateLoanEMI({
        loanAmount: 100000,
        interestRate: 12,
        tenureYears: 5,
      });

      const processingTime = Date.now() - startTime;

      res.status(HTTP_STATUS.OK).json({
        success: true,
        data: {
          status: 'healthy',
          service: 'loan-calculator',
          testCalculation: {
            emi: testResult.emi,
            totalInterest: testResult.totalInterest,
            totalPayment: testResult.totalPayment,
          },
          performance: {
            processingTime: `${processingTime}ms`,
            targetTime: '200ms',
            isUnderTarget: processingTime < 200,
          },
          timestamp: new Date().toISOString(),
        },
        message: 'Loan service is healthy',
      });
    } catch (error) {
      next(error);
    }
  };
}

// Validation schemas
const simulateLoanSchema = z.object({
  loanAmount: z.number()
    .positive('Loan amount must be positive')
    .min(10000, 'Loan amount must be at least NPR 10,000')
    .max(100000000, 'Loan amount cannot exceed NPR 10 crore'),
  interestRate: z.number()
    .nonnegative('Interest rate cannot be negative')
    .max(50, 'Interest rate cannot exceed 50%'),
  tenureYears: z.number()
    .positive('Tenure must be positive')
    .min(1, 'Tenure must be at least 1 year')
    .max(30, 'Tenure cannot exceed 30 years'),
});

const compareSimulationsSchema = z.object({
  simulationIds: z.array(z.string().uuid())
    .min(1, 'At least one simulation ID is required')
    .max(5, 'Maximum 5 simulations can be compared'),
});

const batchSimulateSchema = z.object({
  simulations: z.array(simulateLoanSchema)
    .min(1, 'At least one simulation is required')
    .max(10, 'Maximum 10 simulations can be processed at once'),
});

const searchSchema = z.object({
  q: z.string().min(1, 'Search query is required'),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
});

const quickEMISchema = z.object({
  loanAmount: z.number().positive('Loan amount must be positive'),
  interestRate: z.number().nonnegative('Interest rate cannot be negative'),
  tenureYears: z.number().positive('Tenure must be positive'),
});

// Middleware wrappers
export const LoanControllerMiddleware = {
  validateSimulate: validateBody(simulateLoanSchema),
  validateCompare: validateBody(compareSimulationsSchema),
  validateBatchSimulate: validateBody(batchSimulateSchema),
  validateSearch: validateBody(searchSchema),
  validateQuickEMI: validateBody(quickEMISchema),
};
