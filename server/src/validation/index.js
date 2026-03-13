/**
 * Validation module index
 * Central export point for all validation schemas and utilities
 */

import { z } from 'zod';

// Import all validation schemas
import {
  loanSimulationSchema,
  enhancedLoanSimulationSchema,
  quickEMISchema,
  loanComparisonSchema,
  batchLoanSimulationSchema,
  loanSearchSchema,
  loanExportSchema,
  loanAnalyticsSchema,
  affordabilityValidation,
  nepaliMarketValidation,
  formatValidationErrors,
  createValidationMiddleware,
  validateWithBusinessRules,
  businessRules,
} from './loanValidation';

// Re-export for easy access
export {
  // Core schemas
  loanSimulationSchema,
  enhancedLoanSimulationSchema,
  quickEMISchema,
  
  // Advanced schemas
  loanComparisonSchema,
  batchLoanSimulationSchema,
  loanSearchSchema,
  loanExportSchema,
  loanAnalyticsSchema,
  
  // Specialized validations
  affordabilityValidation,
  nepaliMarketValidation,
  
  // Utilities
  formatValidationErrors,
  createValidationMiddleware,
  validateWithBusinessRules,
  businessRules,
};

// Default export
export default loanSimulationSchema;

/**
 * Validation constants
 */
export const VALIDATION_CONSTANTS = {
  // Loan amount limits (NPR)
  LOAN_AMOUNT: {
    MIN: 10000,
    MAX: 100000000,
    PRACTICAL_MIN: 50000,
  },
  
  // Interest rate limits (percentage)
  INTEREST_RATE: {
    MIN: 0,
    MAX: 40,
    NEPALESE_MIN: 8,
    NEPALESE_MAX: 25,
  },
  
  // Tenure limits (years)
  TENURE: {
    MIN: 1,
    MAX: 30,
    COMMON: [1, 3, 5, 7, 10, 15, 20, 25],
  },
  
  // Income limits (NPR)
  INCOME: {
    MIN: 10000,
    MAX: 10000000,
  },
  
  // DTI ratio limits
  DTI_RATIO: {
    MIN: 0.1,
    MAX: 0.8,
    RECOMMENDED: 0.5,
  },
  
  // Pagination limits
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 20,
    MAX_LIMIT: 100,
    MAX_EXPORT_LIMIT: 1000,
  },
};

/**
 * Error message templates
 */
export const ERROR_TEMPLATES = {
  REQUIRED: (field) => `${field} is required`,
  INVALID_TYPE: (field, type) => `${field} must be a valid ${type}`,
  POSITIVE: (field) => `${field} must be positive`,
  MIN_VALUE: (field, min) => `${field} must be at least ${min}`,
  MAX_VALUE: (field, max) => `${field} must not exceed ${max}`,
  INTEGER: (field) => `${field} must be an integer`,
  FINITE: (field) => `${field} must be a finite number`,
  
  // Business-specific messages
  LOAN_AMOUNT_TOO_LOW: 'Loan amount is too small for practical use',
  LOAN_AMOUNT_TOO_HIGH: 'Loan amount exceeds typical market range',
  INTEREST_RATE_UNREALISTIC: 'Interest rate is outside typical market range',
  TENURE_UNCOMMON: 'Tenure is uncommon in Nepali market',
  EMI_TOO_HIGH: 'EMI seems unusually high for the loan amount',
  DTI_TOO_HIGH: 'Total EMIs exceed recommended debt-to-income ratio',
  
  // Nepali market specific
  NEPALESE_RATE_RANGE: 'Interest rate for Nepali loans should be between 8% and 25%',
  NEPALESE_AMOUNT_RANGE: 'Loan amount should be at least NPR 50,000 for practical use',
  NEPALESE_TENURE_RANGE: 'Consider typical Nepali loan tenures: 1, 3, 5, 7, 10, 15, 20, or 25 years',
};

/**
 * Custom validation helpers
 */
export const validationHelpers = {
  /**
   * Validate Nepali currency amount
   */
  validateNepaliAmount: (amount) => {
    const numAmount = Number(amount);
    return numAmount >= VALIDATION_CONSTANTS.LOAN_AMOUNT.MIN && 
           numAmount <= VALIDATION_CONSTANTS.LOAN_AMOUNT.MAX &&
           Number.isFinite(numAmount);
  },
  
  /**
   * Validate Nepali phone number
   */
  validateNepaliPhone: (phone) => {
    const phoneRegex = /^(?:\+977)?[9][6-9]\d{8}$/;
    return phoneRegex.test(phone.replace(/\s/g, ''));
  },
  
  /**
   * Validate Nepali citizenship number
   */
  validateCitizenshipNumber: (number) => {
    const citizenshipRegex = /^\d{6}-\d{5}-\d{7}$/;
    return citizenshipRegex.test(number);
  },
  
  /**
   * Calculate DTI ratio
   */
  calculateDTIRatio: (monthlyIncome, totalEMIs) => {
    if (!monthlyIncome || monthlyIncome <= 0) {
      return null;
    }
    return totalEMIs / monthlyIncome;
  },
  
  /**
   * Check if EMI is reasonable
   */
  isEMIReasonable: (loanAmount, emi, tenureMonths) => {
    const estimatedEMI = loanAmount * 0.02; // Rough estimate
    const variance = Math.abs(emi - estimatedEMI) / estimatedEMI;
    return variance <= 0.5; // Allow 50% variance
  },
  
  /**
   * Check if loan is affordable
   */
  isLoanAffordable: (monthlyIncome, existingEMIs, newEMI, maxDTI = 0.5) => {
    const totalEMI = existingEMIs + newEMI;
    const dtiRatio = totalEMI / monthlyIncome;
    return dtiRatio <= maxDTI;
  },
};

/**
 * Validation middleware presets
 */
export const validationMiddleware = {
  // Basic loan simulation validation
  loanSimulation: createValidationMiddleware(loanSimulationSchema, 'body'),
  
  // Enhanced loan simulation validation
  enhancedLoanSimulation: createValidationMiddleware(enhancedLoanSimulationSchema, 'body'),
  
  // Quick EMI validation
  quickEMI: createValidationMiddleware(quickEMISchema, 'body'),
  
  // Query parameter validation
  pagination: createValidationMiddleware(z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }), 'query'),
  
  // Route parameter validation
  idParam: createValidationMiddleware(z.object({
    id: z.string().uuid('Invalid ID format'),
  }), 'params'),
  
  // Search validation
  search: createValidationMiddleware(z.object({
    q: z.string().min(1, 'Search query is required'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }), 'query'),
};

/**
 * Validation error handler
 */
export const handleValidationError = (error, req, res, next) => {
  if (error instanceof z.ZodError) {
    return res.status(400).json({
      success: false,
      error: {
        message: 'Validation failed',
        code: 'VALIDATION_ERROR',
        details: formatValidationErrors(error.errors),
        timestamp: new Date().toISOString(),
        request: {
          method: req.method,
          url: req.originalUrl,
          body: req.body,
          query: req.query,
          params: req.params,
        },
      },
    });
  }
  
  next(error);
};

/**
 * Async validation wrapper
 */
export const validateAsync = (schema, source = 'body') => {
  return async (req, res, next) => {
    try {
      let data;
      
      switch (source) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }
      
      const validatedData = await schema.parseAsync(data);
      
      // Replace the original data with validated data
      switch (source) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
        default:
          req.body = validatedData;
      }
      
      next();
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: {
            message: 'Validation failed',
            code: 'VALIDATION_ERROR',
            details: formatValidationErrors(error.errors),
          },
        });
      }
      
      next(error);
    }
  };
};

/**
 * Validation factory for different contexts
 */
export const createValidation = (config) => {
  const {
    schema,
    source = 'body',
    businessRules = [],
    errorHandler = handleValidationError,
  } = config;
  
  return async (req, res, next) => {
    try {
      let data;
      
      switch (source) {
        case 'body':
          data = req.body;
          break;
        case 'query':
          data = req.query;
          break;
        case 'params':
          data = req.params;
          break;
        default:
          data = req.body;
      }
      
      // First validate with Zod schema
      const validatedData = await schema.parseAsync(data);
      
      // Then apply business rules
      for (const rule of businessRules) {
        const result = await rule(validatedData, req);
        if (!result.valid) {
          return res.status(400).json({
            success: false,
            error: {
              message: result.message,
              code: 'BUSINESS_RULE_VIOLATION',
            },
          });
        }
      }
      
      // Replace the original data with validated data
      switch (source) {
        case 'body':
          req.body = validatedData;
          break;
        case 'query':
          req.query = validatedData;
          break;
        case 'params':
          req.params = validatedData;
          break;
        default:
          req.body = validatedData;
      }
      
      next();
    } catch (error) {
      errorHandler(error, req, res, next);
    }
  };
};

/**
 * Export validation utilities for use in other modules
 */
export const validationUtils = {
  formatValidationErrors,
  createValidationMiddleware,
  validateWithBusinessRules,
  handleValidationError,
  validateAsync,
  createValidation,
  validationHelpers,
  validationMiddleware,
  VALIDATION_CONSTANTS,
  ERROR_TEMPLATES,
};
