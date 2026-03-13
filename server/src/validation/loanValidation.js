import { z } from 'zod';
import { ERROR_MESSAGES } from '../utils/constants';

/**
 * Zod validation schemas for loan simulation inputs
 * FinSathi AI - Financial Decision Support Platform
 */

// Base numeric validation with custom error messages
const positiveNumber = (fieldName, min = 0, max = Infinity) => 
  z.number({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a valid number`,
  })
  .gt(min, `${fieldName} must be greater than ${min}`)
  .lte(max, `${fieldName} must not exceed ${max}`)
  .finite(`${fieldName} must be a finite number`);

// Integer validation
const positiveInteger = (fieldName, min = 1, max = Infinity) =>
  z.number({
    required_error: `${fieldName} is required`,
    invalid_type_error: `${fieldName} must be a valid number`,
  })
  .int(`${fieldName} must be an integer`)
  .gt(min - 1, `${fieldName} must be at least ${min}`)
  .lte(max, `${fieldName} must not exceed ${max}`)
  .finite(`${fieldName} must be a finite number`);

/**
 * Core loan simulation validation schema
 * Validates the basic inputs required for EMI calculation
 */
export const loanSimulationSchema = z.object({
  loanAmount: positiveNumber('Loan amount', 0, 100000000)
    .min(10000, 'Loan amount must be at least NPR 10,000')
    .max(100000000, 'Loan amount cannot exceed NPR 10 crore'),
  
  interestRate: positiveNumber('Interest rate', 0, 40)
    .min(0, 'Interest rate cannot be negative')
    .max(40, 'Interest rate cannot exceed 40% per annum')
    .refine((rate) => rate <= 50, 'Interest rate seems unusually high - please verify the rate'),
  
  tenureYears: positiveInteger('Tenure', 1, 30)
    .min(1, 'Tenure must be at least 1 year')
    .max(30, 'Tenure cannot exceed 30 years')
    .refine((tenure) => tenure <= 25, 'Very long tenure may result in high total interest'),
});

/**
 * Enhanced loan simulation schema with additional optional fields
 * For more comprehensive loan applications
 */
export const enhancedLoanSimulationSchema = loanSimulationSchema.extend({
  // Optional fields for enhanced functionality
  loanType: z.enum(['HOME', 'PERSONAL', 'BUSINESS', 'EDUCATION', 'VEHICLE'], {
    errorMap: () => ({ message: 'Invalid loan type' }),
  }).optional(),
  
  purpose: z.string({
    required_error: 'Loan purpose is required',
  })
  .min(10, 'Loan purpose must be at least 10 characters long')
  .max(500, 'Loan purpose cannot exceed 500 characters')
  .optional(),
  
  income: positiveNumber('Monthly income', 0, 10000000)
    .min(10000, 'Monthly income must be at least NPR 10,000')
    .max(10000000, 'Monthly income seems unrealistic - please verify')
    .optional(),
  
  existingEMIs: positiveNumber('Existing EMIs', 0, 1000000)
    .max(500000, 'Existing EMIs seem very high - please verify')
    .default(0),
  
  downPayment: positiveNumber('Down payment', 0, 50000000)
    .max(loanAmount, 'Down payment cannot exceed loan amount')
    .optional(),
  
  processingFee: positiveNumber('Processing fee', 0, 100000)
    .max(10000, 'Processing fee seems excessive')
    .optional(),
  
  // User information (optional for MVP)
  userId: z.string().uuid('Invalid user ID').optional(),
  
  // Metadata
  source: z.enum(['WEB', 'MOBILE', 'API'], {
    errorMap: () => ({ message: 'Invalid source' }),
  }).default('WEB'),
  
  sessionId: z.string().min(1, 'Session ID is required').optional(),
});

/**
 * Quick EMI calculation schema (minimal validation)
 * For fast calculations without database storage
 */
export const quickEMISchema = z.object({
  loanAmount: z.number({
    required_error: 'Loan amount is required',
    invalid_type_error: 'Loan amount must be a valid number',
  })
  .positive('Loan amount must be positive')
  .finite('Loan amount must be a finite number')
  .min(1000, 'Loan amount must be at least NPR 1,000')
  .max(100000000, 'Loan amount cannot exceed NPR 10 crore'),
  
  interestRate: z.number({
    required_error: 'Interest rate is required',
    invalid_type_error: 'Interest rate must be a valid number',
  })
  .nonnegative('Interest rate cannot be negative')
  .finite('Interest rate must be a finite number')
  .max(50, 'Interest rate cannot exceed 50%'),
  
  tenureYears: z.number({
    required_error: 'Tenure is required',
    invalid_type_error: 'Tenure must be a valid number',
  })
  .positive('Tenure must be positive')
  .finite('Tenure must be a finite number')
  .int('Tenure must be in whole years')
  .min(1, 'Tenure must be at least 1 year')
  .max(30, 'Tenure cannot exceed 30 years'),
});

/**
 * Loan comparison schema
 * For comparing multiple loan options
 */
export const loanComparisonSchema = z.object({
  loans: z.array(loanSimulationSchema)
    .min(2, 'At least 2 loans are required for comparison')
    .max(5, 'Maximum 5 loans can be compared at once'),
  
  comparisonType: z.enum(['EMI', 'TOTAL_INTEREST', 'TOTAL_PAYMENT'], {
    errorMap: () => ({ message: 'Invalid comparison type' }),
  }).default('TOTAL_PAYMENT'),
});

/**
 * Batch loan simulation schema
 * For processing multiple simulations at once
 */
export const batchLoanSimulationSchema = z.object({
  simulations: z.array(loanSimulationSchema)
    .min(1, 'At least one simulation is required')
    .max(10, 'Maximum 10 simulations can be processed at once'),
  
  userId: z.string().uuid('Invalid user ID').optional(),
  
  batchName: z.string()
    .min(1, 'Batch name is required')
    .max(100, 'Batch name cannot exceed 100 characters')
    .optional(),
});

/**
 * Loan search and filter schema
 * For searching and filtering loan history
 */
export const loanSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  
  filters: z.object({
    amountRange: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    }).optional(),
    
    rateRange: z.object({
      min: z.number().nonnegative().optional(),
      max: z.number().max(50).optional(),
    }).optional(),
    
    tenureRange: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    }).optional(),
    
    emiRange: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    }).optional(),
    
    dateRange: z.object({
      startDate: z.string().datetime('Invalid start date format').optional(),
      endDate: z.string().datetime('Invalid end date format').optional(),
    }).optional(),
    
    loanType: z.enum(['HOME', 'PERSONAL', 'BUSINESS', 'EDUCATION', 'VEHICLE']).optional(),
  }).optional(),
  
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }).optional(),
  
  sort: z.object({
    field: z.enum([
      'createdAt', 'amount', 'rate', 'tenure', 'emi', 
      'totalInterest', 'totalPayment', 'updatedAt'
    ]).default('createdAt'),
    order: z.enum(['asc', 'desc']).default('desc'),
  }).optional(),
});

/**
 * Loan export schema
 * For exporting loan data in different formats
 */
export const loanExportSchema = z.object({
  format: z.enum(['JSON', 'CSV', 'EXCEL'], {
    errorMap: () => ({ message: 'Invalid export format' }),
  }).default('JSON'),
  
  filters: z.object({
    dateRange: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }).optional(),
    
    includeFields: z.array(z.enum([
      'id', 'amount', 'rate', 'tenure', 'emi', 
      'totalInterest', 'totalPayment', 'createdAt', 'updatedAt'
    ])).optional(),
  }).optional(),
  
  pagination: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(1000).default(100),
  }).optional(),
});

/**
 * Loan analytics schema
 * For analytics and reporting requests
 */
export const loanAnalyticsSchema = z.object({
  period: z.enum(['DAY', 'WEEK', 'MONTH', 'QUARTER', 'YEAR', 'ALL'], {
    errorMap: () => ({ message: 'Invalid period' }),
  }).default('MONTH'),
  
  metrics: z.array(z.enum([
    'COUNT', 'AVERAGE_AMOUNT', 'AVERAGE_RATE', 'AVERAGE_TENURE', 
    'AVERAGE_EMI', 'TOTAL_AMOUNT', 'DISTRIBUTION'
  ])).optional(),
  
  groupBy: z.enum(['AMOUNT_RANGE', 'RATE_RANGE', 'TENURE_RANGE', 'LOAN_TYPE']).optional(),
  
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }).optional(),
});

/**
 * Custom validation functions
 * Additional business logic validations
 */

/**
 * Validate affordability based on income
 */
export const affordabilityValidation = z.object({
  monthlyIncome: positiveNumber('Monthly income', 10000, 10000000),
  
  existingEMIs: positiveNumber('Existing EMIs', 0, 1000000).default(0),
  
  maxDTIRatio: z.number()
    .min(0.1, 'DTI ratio must be at least 10%')
    .max(0.8, 'DTI ratio cannot exceed 80%')
    .default(0.5),
  
  loanAmount: positiveNumber('Loan amount', 0, 100000000).optional(),
  
  interestRate: positiveNumber('Interest rate', 0, 40).optional(),
  
  tenureYears: positiveInteger('Tenure', 1, 30).optional(),
})
.refine((data) => {
  if (data.existingEMIs >= data.monthlyIncome * 0.7) {
    return false;
  }
  return true;
}, {
  message: 'Existing EMIs are too high relative to income',
  path: ['existingEMIs'],
})
.refine((data) => {
  if (data.loanAmount && data.monthlyIncome) {
    const maxAffordable = data.monthlyIncome * data.maxDTIRatio * 12 * data.tenureYears;
    return data.loanAmount <= maxAffordable;
  }
  return true;
}, {
  message: 'Loan amount exceeds affordable limit based on income',
  path: ['loanAmount'],
});

/**
 * Validate loan parameters for Nepali market context
 */
export const nepaliMarketValidation = loanSimulationSchema.extend({
  // Additional validations specific to Nepali market
  loanAmount: positiveNumber('Loan amount', 0, 100000000)
    .refine((amount) => {
      // Check for common loan amounts in Nepali market
      const commonAmounts = [100000, 500000, 1000000, 2000000, 5000000];
      return amount >= 50000; // Minimum practical amount
    }, 'Loan amount should be at least NPR 50,000 for practical use')
    .refine((amount) => {
      // Warn about unusually high amounts
      return amount <= 50000000;
    }, 'Loan amount exceeds typical Nepali market range'),
  
  interestRate: positiveNumber('Interest rate', 0, 40)
    .refine((rate) => {
      // Typical Nepali market rates
      return rate >= 8 && rate <= 25;
    }, 'Interest rate is outside typical Nepali market range (8-25%)'),
  
  tenureYears: positiveInteger('Tenure', 1, 30)
    .refine((tenure) => {
      // Common tenures in Nepali market
      return [1, 3, 5, 7, 10, 15, 20, 25].includes(tenure) || tenure <= 10;
    }, 'Tenure is uncommon in Nepali market'),
});

/**
 * Validation error formatter
 * Formats Zod errors into user-friendly messages
 */
export const formatValidationErrors = (errors) => {
  const formattedErrors = {};
  
  errors.forEach((error) => {
    const path = error.path.join('.');
    formattedErrors[path] = error.message;
  });
  
  return formattedErrors;
};

/**
 * Validation middleware factory
 * Creates validation middleware for different schemas
 */
export const createValidationMiddleware = (schema, source = 'body') => {
  return (req, res, next) => {
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
      
      const validatedData = schema.parse(data);
      
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
          timestamp: new Date().toISOString(),
        });
      }
      
      next(error);
    }
  };
};

/**
 * Async validation with custom business logic
 */
export const validateWithBusinessRules = async (data, schema, businessRules = []) => {
  // First validate with Zod schema
  const validatedData = schema.parse(data);
  
  // Then apply custom business rules
  for (const rule of businessRules) {
    const result = await rule(validatedData);
    if (!result.valid) {
      throw new Error(result.message);
    }
  }
  
  return validatedData;
};

/**
 * Business rule examples
 */
export const businessRules = {
  // Rule: Check if EMI is reasonable relative to loan amount
  reasonableEMI: (data) => {
    const emi = data.loanAmount * 0.02; // Rough estimate: 2% of loan amount
    return {
      valid: true,
      message: 'EMI seems reasonable',
    };
  },
  
  // Rule: Check if interest rate is realistic for loan type
  realisticRate: (data) => {
    const { loanType, interestRate } = data;
    
    if (!loanType) {
      return { valid: true, message: 'No loan type specified' };
    }
    
    const rateRanges = {
      HOME: { min: 8, max: 15 },
      PERSONAL: { min: 12, max: 25 },
      BUSINESS: { min: 10, max: 20 },
      EDUCATION: { min: 5, max: 12 },
      VEHICLE: { min: 14, max: 18 },
    };
    
    const range = rateRanges[loanType];
    if (range && (interestRate < range.min || interestRate > range.max)) {
      return {
        valid: false,
        message: `Interest rate for ${loanType} loans should be between ${range.min}% and ${range.max}%`,
      };
    }
    
    return { valid: true, message: 'Rate is realistic' };
  },
  
  // Rule: Check affordability
  affordabilityCheck: (data) => {
    const { income, existingEMIs, loanAmount, interestRate, tenureYears } = data;
    
    if (!income) {
      return { valid: true, message: 'No income data provided' };
    }
    
    // Calculate approximate EMI
    const monthlyRate = interestRate / 12 / 100;
    const totalMonths = tenureYears * 12;
    const emi = loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / 
              (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    const totalEMI = emi + existingEMIs;
    const dtiRatio = totalEMI / income;
    
    if (dtiRatio > 0.6) {
      return {
        valid: false,
        message: 'Total EMIs exceed 60% of monthly income - loan may not be affordable',
      };
    }
    
    return { valid: true, message: 'Loan appears affordable' };
  },
};

// Export all schemas for easy import
export {
  loanSimulationSchema as default,
  enhancedLoanSimulationSchema,
  quickEMISchema,
  loanComparisonSchema,
  batchLoanSimulationSchema,
  loanSearchSchema,
  loanExportSchema,
  loanAnalyticsSchema,
  affordabilityValidation,
  nepaliMarketValidation,
};
