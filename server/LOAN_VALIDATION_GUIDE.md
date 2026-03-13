# Loan Validation Guide

## Overview
Comprehensive input validation system for FinSathi AI loan simulation APIs using Zod schemas with business logic validation and Nepali market-specific rules.

## 📋 Validation Rules

### Core Requirements
- **loanAmount**: > 0 (min: NPR 10,000, max: NPR 10 crore)
- **interestRate**: 0-40% (Nepali market: 8-25% typical)
- **tenureYears**: 1-30 years (common: 1,3,5,7,10,15,20,25)

### Business Logic Rules
- Affordability checks based on income
- EMI reasonableness validation
- Nepali market-specific constraints
- DTI ratio limits (max 50% recommended)

## 🚀 Quick Start

### Basic Usage
```javascript
import { loanSimulationSchema } from '../validation';

// Validate loan simulation input
const result = loanSimulationSchema.safeParse({
  loanAmount: 1000000,
  interestRate: 12,
  tenureYears: 5,
});

if (result.success) {
  // Proceed with loan calculation
  const data = result.data;
} else {
  // Handle validation errors
  console.log(result.error.errors);
}
```

### Middleware Usage
```javascript
import { validationMiddleware } from '../validation';

// Apply validation middleware
router.post('/simulate', 
  validationMiddleware.loanSimulation,
  loanController.simulate
);
```

## 📁 Available Schemas

### 1. Core Schemas

#### loanSimulationSchema
```javascript
export const loanSimulationSchema = z.object({
  loanAmount: positiveNumber('Loan amount', 0, 100000000)
    .min(10000, 'Loan amount must be at least NPR 10,000')
    .max(100000000, 'Loan amount cannot exceed NPR 10 crore'),
  
  interestRate: positiveNumber('Interest rate', 0, 40)
    .min(0, 'Interest rate cannot be negative')
    .max(40, 'Interest rate cannot exceed 40% per annum'),
  
  tenureYears: positiveInteger('Tenure', 1, 30)
    .min(1, 'Tenure must be at least 1 year')
    .max(30, 'Tenure cannot exceed 30 years'),
});
```

#### enhancedLoanSimulationSchema
```javascript
export const enhancedLoanSimulationSchema = loanSimulationSchema.extend({
  loanType: z.enum(['HOME', 'PERSONAL', 'BUSINESS', 'EDUCATION', 'VEHICLE']),
  purpose: z.string().min(10).max(500),
  income: positiveNumber('Monthly income', 10000, 10000000),
  existingEMIs: positiveNumber('Existing EMIs', 0, 1000000).default(0),
  downPayment: positiveNumber('Down payment', 0, 50000000),
  processingFee: positiveNumber('Processing fee', 0, 100000),
  userId: z.string().uuid().optional(),
  source: z.enum(['WEB', 'MOBILE', 'API']).default('WEB'),
});
```

### 2. Specialized Schemas

#### quickEMISchema
For fast calculations without database storage:
```javascript
export const quickEMISchema = z.object({
  loanAmount: z.number().positive().min(1000).max(100000000),
  interestRate: z.number().nonnegative().max(50),
  tenureYears: z.number().positive().int().min(1).max(30),
});
```

#### affordabilityValidation
```javascript
export const affordabilityValidation = z.object({
  monthlyIncome: positiveNumber('Monthly income', 10000, 10000000),
  existingEMIs: positiveNumber('Existing EMIs', 0, 1000000).default(0),
  maxDTIRatio: z.number().min(0.1).max(0.8).default(0.5),
})
.refine((data) => data.existingEMIs < data.monthlyIncome * 0.7, {
  message: 'Existing EMIs are too high relative to income',
  path: ['existingEMIs'],
});
```

#### nepaliMarketValidation
```javascript
export const nepaliMarketValidation = loanSimulationSchema.extend({
  loanAmount: positiveNumber('Loan amount', 0, 100000000)
    .refine((amount) => amount >= 50000, 'Loan amount should be at least NPR 50,000'),
    .refine((amount) => amount <= 50000000, 'Loan amount exceeds typical Nepali market range'),
  
  interestRate: positiveNumber('Interest rate', 0, 40)
    .refine((rate) => rate >= 8 && rate <= 25, 'Interest rate is outside typical Nepali market range (8-25%)'),
});
```

### 3. Advanced Schemas

#### loanComparisonSchema
```javascript
export const loanComparisonSchema = z.object({
  loans: z.array(loanSimulationSchema)
    .min(2, 'At least 2 loans are required for comparison')
    .max(5, 'Maximum 5 loans can be compared at once'),
  comparisonType: z.enum(['EMI', 'TOTAL_INTEREST', 'TOTAL_PAYMENT']).default('TOTAL_PAYMENT'),
});
```

#### batchLoanSimulationSchema
```javascript
export const batchLoanSimulationSchema = z.object({
  simulations: z.array(loanSimulationSchema)
    .min(1, 'At least one simulation is required')
    .max(10, 'Maximum 10 simulations can be processed at once'),
  batchName: z.string().min(1).max(100).optional(),
});
```

#### loanSearchSchema
```javascript
export const loanSearchSchema = z.object({
  query: z.string().min(1, 'Search query is required'),
  filters: z.object({
    amountRange: z.object({
      min: z.number().positive().optional(),
      max: z.number().positive().optional(),
    }),
    rateRange: z.object({
      min: z.number().nonnegative().optional(),
      max: z.number().max(50).optional(),
    }),
    dateRange: z.object({
      startDate: z.string().datetime().optional(),
      endDate: z.string().datetime().optional(),
    }),
  }).optional(),
});
```

## 🔧 Validation Middleware

### Basic Middleware
```javascript
import { validationMiddleware } from '../validation';

// Apply to routes
router.post('/simulate', 
  validationMiddleware.loanSimulation,
  loanController.simulate
);

router.get('/history', 
  validationMiddleware.pagination,
  loanController.getHistory
);
```

### Custom Middleware
```javascript
import { createValidation } from '../validation';

// Custom validation with business rules
const customValidation = createValidation({
  schema: enhancedLoanSimulationSchema,
  source: 'body',
  businessRules: [
    businessRules.reasonableEMI,
    businessRules.realisticRate,
    businessRules.affordabilityCheck,
  ],
});

router.post('/enhanced-simulate', customValidation, loanController.enhancedSimulate);
```

## 📊 Error Handling

### Error Response Format
```javascript
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "loanAmount": "Loan amount must be at least NPR 10,000",
      "interestRate": "Interest rate cannot exceed 40% per annum",
      "tenureYears": "Tenure must be at least 1 year"
    },
    "timestamp": "2024-03-10T12:00:00.000Z"
  }
}
```

### Error Formatting
```javascript
import { formatValidationErrors } from '../validation';

const result = loanSimulationSchema.safeParse(invalidData);
if (!result.success) {
  const formattedErrors = formatValidationErrors(result.error.errors);
  console.log(formattedErrors);
  // Output: { loanAmount: "Loan amount must be at least NPR 10,000", ... }
}
```

## 🇳🇵 Nepali Market Specific Validation

### Typical Nepali Loan Parameters
```javascript
const nepaliLoanTypes = {
  HOME: { rate: { min: 8, max: 15 }, tenure: { min: 5, max: 25 } },
  PERSONAL: { rate: { min: 12, max: 25 }, tenure: { min: 1, max: 7 } },
  BUSINESS: { rate: { min: 10, max: 20 }, tenure: { min: 3, max: 15 } },
  EDUCATION: { rate: { min: 5, max: 12 }, tenure: { min: 1, max: 10 } },
  VEHICLE: { rate: { min: 14, max: 18 }, tenure: { min: 1, max: 7 } },
};
```

### Nepali Market Validation Rules
```javascript
// Amount validation
.refine((amount) => amount >= 50000, 'Loan amount should be at least NPR 50,000 for practical use')
.refine((amount) => amount <= 50000000, 'Loan amount exceeds typical Nepali market range'),

// Rate validation
.refine((rate) => rate >= 8 && rate <= 25, 'Interest rate is outside typical Nepali market range (8-25%)'),

// Tenure validation
.refine((tenure) => [1, 3, 5, 7, 10, 15, 20, 25].includes(tenure) || tenure <= 10, 
  'Tenure is uncommon in Nepali market'),
```

## 🔍 Advanced Features

### Business Rules Engine
```javascript
import { businessRules } from '../validation';

// Apply custom business rules
const result = await validateWithBusinessRules(loanData, enhancedLoanSimulationSchema, [
  businessRules.reasonableEMI,
  businessRules.realisticRate,
  businessRules.affordabilityCheck,
]);
```

### Custom Business Rules
```javascript
const customRule = (data) => {
  const { loanAmount, interestRate, tenureYears } = data;
  
  // Calculate EMI
  const emi = calculateEMI(loanAmount, interestRate, tenureYears);
  
  // Check if EMI is reasonable
  if (emi > loanAmount * 0.05) {
    return {
      valid: false,
      message: 'EMI seems unusually high for the loan amount',
    };
  }
  
  return { valid: true, message: 'EMI is reasonable' };
};
```

### Async Validation
```javascript
import { validateAsync } from '../validation';

router.post('/async-validate', 
  validateAsync(enhancedLoanSimulationSchema, 'body'),
  async (req, res, next) => {
    // Additional async validation logic
    const result = await validateWithBusinessRules(req.body);
    next();
  }
);
```

## 📈 Performance Considerations

### Validation Performance
- **Zod**: Fast validation with minimal overhead
- **Early Returns**: Fail fast on basic validation errors
- **Lazy Evaluation**: Business rules only run after schema validation
- **Caching**: Cache validation results for repeated requests

### Best Practices
```javascript
// ✅ Good: Use safeParse for optional validation
const result = schema.safeParse(data);
if (!result.success) {
  return res.status(400).json({ error: formatValidationErrors(result.error.errors) });
}

// ❌ Avoid: Use parse for required validation (throws exceptions)
try {
  const data = schema.parse(data);
} catch (error) {
  // Handle error
}

// ✅ Good: Use specific error messages
.min(10000, 'Loan amount must be at least NPR 10,000')

// ❌ Avoid: Generic error messages
.min(10000, 'Minimum value is 10000')
```

## 🧪 Testing

### Test Suite Structure
```javascript
// Run validation tests
import { ValidationTestRunner } from './loanValidation.test';

const testRunner = new ValidationTestRunner();
await testRunner.runAllTests();
```

### Test Cases
```javascript
// Valid inputs
const validInputs = [
  { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
  { loanAmount: 50000, interestRate: 8, tenureYears: 1 },
  { loanAmount: 100000000, interestRate: 40, tenureYears: 30 },
];

// Invalid inputs
const invalidInputs = [
  { loanAmount: -1000, interestRate: 12, tenureYears: 5 }, // Negative amount
  { loanAmount: 1000, interestRate: -5, tenureYears: 5 }, // Negative rate
  { loanAmount: 1000, interestRate: 50, tenureYears: 5 }, // Rate too high
  { loanAmount: 100000000000, interestRate: 12, tenureYears: 5 }, // Amount too high
];
```

## 📚 Integration Examples

### Express.js Integration
```javascript
import express from 'express';
import { validationMiddleware, handleValidationError } from '../validation';

const app = express();

// Global error handler
app.use(handleValidationError);

// Routes with validation
app.post('/api/v1/loan/simulate', 
  validationMiddleware.loanSimulation,
  loanController.simulate
);

app.get('/api/v1/loan/history', 
  validationMiddleware.pagination,
  loanController.getHistory
);
```

### Controller Integration
```javascript
class LoanController {
  async simulate(req, res, next) {
    try {
      // Data is already validated by middleware
      const { loanAmount, interestRate, tenureYears } = req.body;
      
      // Proceed with calculation
      const result = calculateEMI(loanAmount, interestRate, tenureYears);
      
      res.json({ success: true, data: result });
    } catch (error) {
      next(error);
    }
  }
}
```

### Service Layer Integration
```javascript
class LoanService {
  async simulateLoan(loanData) {
    // Additional business logic validation
    const validatedData = await validateWithBusinessRules(
      loanData, 
      enhancedLoanSimulationSchema,
      [businessRules.affordabilityCheck, businessRules.reasonableEMI]
    );
    
    // Process validated data
    return this.calculateEMI(validatedData);
  }
}
```

## 🔧 Configuration

### Validation Constants
```javascript
import { VALIDATION_CONSTANTS } from '../validation';

console.log(VALIDATION_CONSTANTS.LOAN_AMOUNT.MIN); // 10000
console.log(VALIDATION_CONSTANTS.INTEREST_RATE.MAX); // 40
console.log(VALIDATION_CONSTANTS.TENURE.COMMON); // [1, 3, 5, 7, 10, 15, 20, 25]
```

### Error Templates
```javascript
import { ERROR_TEMPLATES } from '../validation';

const customError = ERROR_TEMPLATES.MIN_VALUE('Loan Amount', 50000);
// Output: "Loan Amount must be at least 50000"
```

## 🚨 Common Issues & Solutions

### Issue 1: Validation Not Working
```javascript
// ❌ Wrong: Missing middleware
router.post('/simulate', loanController.simulate);

// ✅ Correct: Add validation middleware
router.post('/simulate', 
  validationMiddleware.loanSimulation,
  loanController.simulate
);
```

### Issue 2: Generic Error Messages
```javascript
// ❌ Wrong: Generic messages
.min(10000, 'Minimum value is 10000')

// ✅ Correct: Specific, user-friendly messages
.min(10000, 'Loan amount must be at least NPR 10,000')
```

### Issue 3: Missing Business Rules
```javascript
// ❌ Wrong: Only schema validation
const result = schema.parse(data);

// ✅ Correct: Include business rules
const result = await validateWithBusinessRules(data, schema, businessRules);
```

## 📖 API Documentation

### Validation Error Response
```json
{
  "success": false,
  "error": {
    "message": "Validation failed",
    "code": "VALIDATION_ERROR",
    "details": {
      "loanAmount": "Loan amount must be at least NPR 10,000",
      "interestRate": "Interest rate cannot exceed 40% per annum"
    },
    "timestamp": "2024-03-10T12:00:00.000Z"
  }
}
```

### Request Examples
```bash
# Valid request
curl -X POST http://localhost:3001/api/v1/loan/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": 1000000,
    "interestRate": 12,
    "tenureYears": 5
  }'

# Invalid request
curl -X POST http://localhost:3001/api/v1/loan/simulate \
  -H "Content-Type: application/json" \
  -d '{
    "loanAmount": -1000,
    "interestRate": 12,
    "tenureYears": 5
  }'
```

## 🎯 Best Practices

1. **Use Specific Error Messages**: Always provide clear, actionable error messages
2. **Validate Early**: Fail fast on basic validation errors
3. **Use SafeParse**: Use `safeParse()` for optional validation
4. **Add Business Rules**: Include domain-specific validation logic
5. **Test Thoroughly**: Test all edge cases and boundary conditions
6. **Document Clearly**: Document validation rules and error messages
7. **Use Middleware**: Apply validation at the middleware level
8. **Handle Errors Gracefully**: Provide consistent error response format

## 🔮 Future Enhancements

### Planned Features
- **Dynamic Validation**: Validation rules based on user subscription
- **Machine Learning**: AI-powered validation recommendations
- **Real-time Validation**: Client-side validation feedback
- **Multi-currency Support**: Validation for different currencies
- **Advanced Analytics**: Validation analytics and reporting

---

This comprehensive validation system ensures data integrity and provides excellent user experience for the FinSathi AI loan simulation platform.
