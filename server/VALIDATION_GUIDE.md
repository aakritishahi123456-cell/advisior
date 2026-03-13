# Request Validation Guide for FinSathi AI

## Overview
This guide documents the comprehensive request validation system implemented for FinSathi AI using Zod, ensuring data integrity and preventing invalid financial inputs.

## Validation Architecture

### Core Components
- **Zod Schemas**: Type-safe validation schemas
- **Validation Middleware**: Reusable middleware for request validation
- **Error Handling**: Consistent error responses
- **Input Sanitization**: Data cleaning and normalization

### Validation Layers
1. **Request Body**: JSON payload validation
2. **Query Parameters**: URL query string validation
3. **Route Parameters**: Path parameter validation
4. **Headers**: HTTP header validation

## Available Validators

### 1. Loan Validation
**File**: `src/validators/loan.validator.ts`

#### Loan Simulation Schema
```typescript
export const loanSimulationSchema = z.object({
  principal: z.number()
    .positive('Principal amount must be positive')
    .min(1000, 'Minimum loan amount is NPR 1,000')
    .max(10000000, 'Maximum loan amount is NPR 10,000,000'),
  interestRate: z.number()
    .positive('Interest rate must be positive')
    .min(1, 'Interest rate must be at least 1%')
    .max(50, 'Interest rate cannot exceed 50%'),
  tenure: z.number()
    .int('Tenure must be in months')
    .positive('Tenure must be positive')
    .min(1, 'Minimum tenure is 1 month')
    .max(360, 'Maximum tenure is 360 months (30 years)')
});
```

#### Validation Rules
- **Loan Amount**: NPR 1,000 - 10,000,000
- **Interest Rate**: 1% - 50%
- **Tenure**: 1 - 360 months
- **Type**: Must be valid loan type enum

### 2. Company Validation
**File**: `src/validators/company.validator.ts`

#### Company Symbol Validation
```typescript
symbol: z.string()
  .min(1, 'Company symbol is required')
  .max(10, 'Company symbol cannot exceed 10 characters')
  .toUpperCase('Company symbol must be uppercase')
  .regex(/^[A-Z0-9]+$/, 'Company symbol can only contain uppercase letters and numbers')
```

#### Validation Rules
- **Symbol**: Uppercase, max 10 chars, alphanumeric
- **Name**: 1-255 characters, trimmed
- **Sector**: 1-100 characters, trimmed

### 3. Financial Validation
**File**: `src/validators/financial.validator.ts`

#### Financial Metrics Validation
```typescript
export const financialMetricsSchema = z.object({
  revenue: z.number()
    .min(0, 'Revenue cannot be negative')
    .max(999999999999, 'Revenue is too large')
    .optional(),
  netProfit: z.number()
    .min(-999999999999, 'Net profit loss is too large')
    .max(999999999999, 'Net profit is too large')
    .optional(),
  // ... more financial metrics
});
```

#### Validation Rules
- **Revenue**: Non-negative, max 999 billion
- **Profit/Loss**: ±999 billion range
- **Ratios**: Appropriate ranges for each metric
- **Currency**: 3-letter uppercase codes

### 4. User Validation
**File**: `src/validators/user.validator.ts`

#### Password Strength Validation
```typescript
password: z.string()
  .min(8, 'Password must be at least 8 characters long')
  .max(128, 'Password cannot exceed 128 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character')
```

#### Validation Rules
- **Email**: Valid email format, lowercase
- **Password**: 8-128 chars, mixed case, numbers, special chars
- **Age**: 18-120 years old
- **Phone**: Valid phone number format

## Middleware Usage

### Basic Validation
```typescript
import { validateRequest } from '../middleware/validation.middleware';
import { loanSimulationSchema } from '../validators/loan.validator';

router.post('/simulate', 
  validateRequest({ body: loanSimulationSchema }),
  loanController.simulateLoan
);
```

### Multi-Part Validation
```typescript
import { validateRequest } from '../middleware/validation.middleware';
import { createLoanSchema, loanQuerySchema } from '../validators/loan.validator';

router.post('/', 
  validateRequest({ 
    body: createLoanSchema,
    query: loanQuerySchema 
  }),
  loanController.createLoan
);
```

### Header Validation
```typescript
import { validateRequest } from '../middleware/validation.middleware';
import { authHeadersSchema } from '../validators/auth.validator';

router.get('/protected', 
  validateRequest({ 
    headers: authHeadersSchema 
  }),
  authController.getProfile
);
```

### Conditional Validation
```typescript
import { validateIf } from '../middleware/validation.middleware';
import { proUserSchema } from '../validators/user.validator';

router.get('/pro-feature', 
  validateIf((req) => req.user?.role === 'PRO', { body: proUserSchema }),
  proController.getProData
);
```

## Error Response Format

### Validation Error Response
```json
{
  "success": false,
  "error": "Validation failed",
  "details": [
    {
      "field": "principal",
      "message": "Principal amount must be positive",
      "code": "too_small",
      "received": -1000
    },
    {
      "field": "interestRate",
      "message": "Interest rate cannot exceed 50%",
      "code": "too_big",
      "received": 75
    }
  ]
}
```

### Success Response
```json
{
  "success": true,
  "data": {
    "principal": 5000000,
    "interestRate": 12.5,
    "tenure": 36
  }
}
```

## Advanced Validation Features

### Custom Validation Logic
```typescript
// Custom refinement for business logic
.refine((data) => {
  // EMI calculation validation
  const emi = calculateEMI(data.principal, data.interestRate, data.tenure);
  const maxEMI = data.principal * 0.5; // Max 50% of principal
  
  if (emi > maxEMI) {
    return false;
  }
  return true;
}, {
  message: 'EMI cannot exceed 50% of principal amount'
})
```

### Async Validation
```typescript
import { validateRequestAsync } from '../middleware/validation.middleware';

router.post('/complex-validation', 
  validateRequestAsync({ body: complexSchema }),
  complexController.processData
);
```

### Cross-Field Validation
```typescript
.refine((data) => {
  // Start date must be before end date
  if (data.startDate && data.endDate) {
    return new Date(data.startDate) <= new Date(data.endDate);
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date'
})
```

## Validation Best Practices

### 1. Be Specific with Error Messages
- ✅ "Principal amount must be positive"
- ❌ "Invalid principal"

### 2. Provide Reasonable Ranges
- ✅ Min: 1000, Max: 10000000
- ❌ Min: 0, Max: 999999999999

### 3. Use Appropriate Data Types
- ✅ `z.number()` for numeric values
- ✅ `z.string()` for text values
- ✅ `z.boolean()` for flags

### 4. Sanitize Input Data
- ✅ `.trim()` for strings
- ✅ `.toLowerCase()` for emails
- ✅ `.toUpperCase()` for symbols

### 5. Validate Business Logic
- ✅ Cross-field dependencies
- ✅ Date range validation
- ✅ Financial ratio constraints

## Implementation Examples

### Loan Simulation Endpoint
```typescript
// POST /api/v1/loans/simulate
router.post('/simulate', 
  validateRequest({ body: loanSimulationSchema }),
  async (req, res) => {
    const { principal, interestRate, tenure } = req.body;
    
    // Calculate EMI
    const monthlyPayment = calculateEMI(principal, interestRate, tenure);
    const totalPayment = monthlyPayment * tenure;
    
    res.json({
      success: true,
      data: {
        principal,
        interestRate,
        tenure,
        monthlyPayment,
        totalPayment,
        totalInterest: totalPayment - principal
      }
    });
  }
);
```

### Company Registration Endpoint
```typescript
// POST /api/v1/companies
router.post('/', 
  validateRequest({ body: createCompanySchema }),
  async (req, res) => {
    const { name, symbol, sector } = req.body;
    
    // Check for duplicate symbol
    const existingCompany = await prisma.company.findUnique({
      where: { symbol }
    });
    
    if (existingCompany) {
      return res.status(409).json({
        success: false,
        error: 'Company with this symbol already exists'
      });
    }
    
    const company = await prisma.company.create({
      data: { name, symbol, sector }
    });
    
    res.status(201).json({
      success: true,
      data: company
    });
  }
);
```

### Financial Report Upload
```typescript
// POST /api/v1/reports
router.post('/', 
  validateRequest({ 
    body: createFinancialReportSchema,
    headers: uploadHeadersSchema
  }),
  async (req, res) => {
    const { companyId, year, revenue, netProfit } = req.body;
    const contentType = req.headers['content-type'];
    
    // Validate file type
    if (!contentType?.startsWith('multipart/form-data')) {
      return res.status(400).json({
        success: false,
        error: 'File upload required'
      });
    }
    
    // Process file and create report
    const report = await processFinancialReport(req.file, {
      companyId,
      year,
      revenue,
      netProfit
    });
    
    res.status(201).json({
      success: true,
      data: report
    });
  }
);
```

## Testing Validation

### Unit Testing Schemas
```typescript
import { z } from 'zod';
import { loanSimulationSchema } from '../validators/loan.validator';

describe('Loan Validation', () => {
  it('should validate correct loan simulation data', () => {
    const validData = {
      principal: 5000000,
      interestRate: 12.5,
      tenure: 36
    };
    
    expect(() => loanSimulationSchema.parse(validData)).not.toThrow();
  });

  it('should reject negative principal', () => {
    const invalidData = {
      principal: -1000,
      interestRate: 12.5,
      tenure: 36
    };
    
    expect(() => loanSimulationSchema.parse(invalidData)).toThrow();
  });
});
```

### Integration Testing
```typescript
import request from 'supertest';
import app from '../src/app';

describe('Loan API Validation', () => {
  it('should return 400 for invalid loan data', async () => {
      const response = await request(app)
        .post('/api/v1/loans/simulate')
        .send({
          principal: -1000,
          interestRate: 12.5,
          tenure: 36
        })
        .expect(400)
        .expect((res) => {
          expect(res.body.success).toBe(false);
          expect(res.body.details).toBeDefined();
        });
    });
});
```

## Performance Considerations

### 1. Schema Compilation
- Zod schemas are compiled for performance
- Use `.optional()` for optional fields
- Avoid complex regex patterns in hot paths

### 2. Error Handling
- Fast validation failures
- Minimal error response overhead
- Structured logging for debugging

### 3. Memory Usage
- Avoid storing large objects in schemas
- Use streaming for large file uploads
- Implement request size limits

## Security Considerations

### 1. Input Sanitization
- Always trim string inputs
- Normalize case for consistency
- Remove potentially harmful characters

### 2. Type Safety
- Use TypeScript for compile-time checking
- Leverage Zod's runtime validation
- Implement strict null checks

### 3. Data Limits
- Set reasonable maximum values
- Implement request size limits
- Use appropriate data types

### 4. Business Logic Validation
- Validate financial constraints
- Check for business rule violations
- Implement cross-field dependencies

This validation system ensures data integrity, prevents invalid financial inputs, and provides clear error messages for debugging and user feedback.
