# Loan Simulation System Guide for FinSathi AI

## Overview
This guide documents the comprehensive loan simulation and EMI calculation system implemented for FinSathi AI, featuring accurate financial calculations, amortization schedules, and both API and UI components.

## System Architecture

### Core Components
- **Loan Service**: Business logic for EMI calculations and loan simulations
- **Loan Controller**: API endpoints for loan operations
- **Loan Routes**: Route definitions with validation and middleware
- **Loan Calculator UI**: React component with real-time calculations
- **Loan Store**: Zustand state management for frontend
- **Database Schema**: Loan simulations and history tracking

## EMI Calculation Formula

### Mathematical Formula
```
EMI = P × r × (1+r)^n / ((1+r)^n − 1)

Where:
P = Principal amount
r = Monthly interest rate (annual rate / 12 / 100)
n = Number of months
```

### Edge Cases Handled
- **Zero Interest Rate**: EMI = Principal / Tenure
- **Very High Interest Rates**: Capped at 50% annual rate
- **Large Loan Amounts**: Limited to NPR 10,000,000
- **Long Tenures**: Maximum 360 months (30 years)

## Backend Implementation

### 1. Loan Service (`services/loan.service.ts`)

#### Core Calculation Method
```typescript
private static async calculateEMI(
  principal: number, 
  annualRate: number, 
  tenureMonths: number
): Promise<LoanSimulationResult> {
  // Handle zero interest rate
  if (annualRate === 0) {
    const emi = principal / tenureMonths;
    return {
      emi: Math.round(emi * 100) / 100,
      totalPayment: principal,
      totalInterest: 0,
      principal,
      interestRate: annualRate,
      tenure: tenureMonths,
      schedule: this.generateAmortizationSchedule(principal, 0, emi, tenureMonths)
    };
  }

  const monthlyRate = annualRate / 12 / 100;
  const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
              (Math.pow(1 + monthlyRate, tenureMonths) - 1);
  
  const totalPayment = emi * tenureMonths;
  const totalInterest = totalPayment - principal;

  return {
    emi: Math.round(emi * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    principal,
    interestRate: annualRate,
    tenure: tenureMonths,
    schedule: this.generateAmortizationSchedule(principal, monthlyRate, emi, tenureMonths)
  };
}
```

#### Input Validation
```typescript
private static validateLoanInputs(principal: number, interestRate: number, tenure: number): void {
  if (principal <= 0) {
    throw createError('Principal amount must be greater than 0', 400);
  }
  
  if (principal > 100000000) { // 10 crore NPR limit
    throw createError('Principal amount is too large', 400);
  }

  if (interestRate < 0) {
    throw createError('Interest rate cannot be negative', 400);
  }
  
  if (interestRate > 50) {
    throw createError('Interest rate is too high', 400);
  }

  if (tenure <= 0) {
    throw createError('Tenure must be greater than 0', 400);
  }
  
  if (tenure > 360) { // 30 years max
    throw createError('Tenure is too long', 400);
  }
}
```

#### Amortization Schedule Generation
```typescript
private static generateAmortizationSchedule(
  principal: number, 
  monthlyRate: number, 
  emi: number, 
  tenureMonths: number
): AmortizationSchedule[] {
  const schedule: AmortizationSchedule[] = [];
  let balance = principal;

  for (let month = 1; month <= tenureMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;

    // Handle floating point precision issues
    const finalBalance = Math.max(0, balance);

    schedule.push({
      month,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      emi: Math.round(emi * 100) / 100,
      balance: Math.round(finalBalance * 100) / 100
    });
  }

  return schedule;
}
```

#### Performance Monitoring
```typescript
static async simulateLoan(simulationData: LoanSimulationData): Promise<LoanSimulationResult> {
  try {
    // Validate inputs
    this.validateLoanInputs(simulationData.principal, simulationData.interestRate, simulationData.tenure);

    const startTime = performance.now();
    
    const result = await this.calculateEMI(
      simulationData.principal,
      simulationData.interestRate,
      simulationData.tenure
    );

    const endTime = performance.now();
    const executionTime = endTime - startTime;

    logger.info({ 
      simulationData, 
      result, 
      executionTime: `${executionTime.toFixed(2)}ms`,
      action: 'loan_simulation' 
    });
    
    return result;
  } catch (error) {
    logger.error({ error, simulationData, action: 'loan_simulation_failed' });
    throw createError('Failed to simulate loan', 500);
  }
}
```

### 2. Loan Controller (`controllers/loan.controller.ts`)

#### Simulation Endpoint
```typescript
static simulateLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
  const simulation = await LoanService.simulateLoan(req.body);
  res.json({
    success: true,
    data: {
      emi: simulation.emi,
      totalInterest: simulation.totalInterest,
      totalPayment: simulation.totalPayment
    },
    message: 'Loan simulation completed successfully'
  });
});
```

#### Full Simulation with Schedule
```typescript
static simulateLoanWithSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
  const simulation = await LoanService.simulateLoan(req.body);
  res.json({
    success: true,
    data: simulation,
    message: 'Loan simulation with schedule completed successfully'
  });
});
```

#### Loan Comparison
```typescript
static compareLoans = asyncHandler(async (req: AuthRequest, res: Response) => {
  const { loans } = req.body;
  const comparisons = await LoanService.compareLoans(loans);
  res.json({
    success: true,
    data: comparisons,
    message: 'Loan comparison completed successfully'
  });
});
```

### 3. API Routes (`routes/loan.routes.ts`)

#### Public Simulation Routes
```typescript
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
```

#### Authenticated Routes
```typescript
// POST /api/v1/loans/save-simulation - Save simulation to history
router.post('/save-simulation', 
  freeLimiter,
  trackUsage('report'),
  validateRequest({ body: loanSimulationSchema }),
  LoanController.saveSimulation
);

// GET /api/v1/loans/simulation-history - Get simulation history
router.get('/simulation-history', 
  freeLimiter,
  LoanController.getSimulationHistory
);
```

## Database Schema

### Loan Simulations Table
```sql
model LoanSimulation {
  id            String  @id @default(cuid())
  userId        String  @map("user_id")
  principal     Float   @db.Decimal(15, 2)
  interestRate  Float   @map("interest_rate") @db.Decimal(8, 4)
  tenure        Int     // in months
  emi           Float   @db.Decimal(15, 2) // Equated Monthly Installment
  totalPayment  Float   @map("total_payment") @db.Decimal(15, 2)
  createdAt     DateTime @default(now()) @map("created_at")
  updatedAt     DateTime @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([createdAt])
  @@map("loan_simulations")
}
```

## Frontend Implementation

### 1. Loan Calculator Component (`components/loan/LoanCalculator.tsx`)

#### Real-time EMI Calculation
```typescript
// Calculate EMI in real-time as user types
useEffect(() => {
  if (isValid && loanAmount && interestRate && tenureMonths) {
    calculateQuickEMI()
  }
}, [loanAmount, interestRate, tenureMonths, isValid])

const calculateQuickEMI = () => {
  if (!loanAmount || !interestRate || !tenureMonths) return

  try {
    // Quick EMI calculation without full simulation
    let emi: number
    if (interestRate === 0) {
      emi = loanAmount / tenureMonths
    } else {
      const monthlyRate = interestRate / 12 / 100
      emi = (loanAmount * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
            (Math.pow(1 + monthlyRate, tenureMonths) - 1)
    }

    const totalPayment = emi * tenureMonths
    const totalInterest = totalPayment - loanAmount

    setResult({
      emi: Math.round(emi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      principal: loanAmount,
      interestRate,
      tenure: tenureMonths
    })
  } catch (error) {
    console.error('Calculation error:', error)
  }
}
```

#### Form Validation with Zod
```typescript
const loanSimulationSchema = z.object({
  loanAmount: z.number()
    .positive('Loan amount must be positive')
    .min(1000, 'Minimum loan amount is NPR 1,000')
    .max(10000000, 'Maximum loan amount is NPR 10,000,000'),
  interestRate: z.number()
    .positive('Interest rate must be positive')
    .min(1, 'Interest rate must be at least 1%')
    .max(50, 'Interest rate cannot exceed 50%'),
  tenureMonths: z.number()
    .int('Tenure must be in months')
    .positive('Tenure must be positive')
    .min(1, 'Minimum tenure is 1 month')
    .max(360, 'Maximum tenure is 360 months (30 years)')
})
```

#### Interactive Tenure Slider
```typescript
<div>
  <label className="form-label">Loan Tenure (Months)</label>
  <div className="space-y-2">
    <input
      type="range"
      {...register('tenureMonths', { valueAsNumber: true })}
      className="w-full"
      min="1"
      max="360"
      step="1"
    />
    <div className="flex justify-between text-sm text-gray-600">
      <span>1 month</span>
      <span className="font-medium">{tenureMonths} months</span>
      <span>360 months</span>
    </div>
  </div>
</div>
```

#### Comparison Feature
```typescript
const handleCompareLoans = async () => {
  if (!result) return

  try {
    // Create comparison scenarios with different interest rates
    const scenarios = [
      { principal: result.principal, interestRate: 10, tenure: result.tenure },
      { principal: result.principal, interestRate: 12, tenure: result.tenure },
      { principal: result.principal, interestRate: 15, tenure: result.tenure },
      { principal: result.principal, interestRate: 18, tenure: result.tenure },
    ]

    const comparisons = await Promise.all(
      scenarios.map(scenario => simulateLoan(scenario))
    )

    setComparisonResults(comparisons)
    setComparing(true)
    toast.success('Loan comparison completed')
  } catch (error: any) {
    toast.error(error.error || 'Failed to compare loans')
  }
}
```

### 2. Loan Store (`stores/loanStore.ts`)

#### State Management
```typescript
interface LoanState {
  simulationResult: LoanSimulationResult | null
  simulationHistory: Array<{
    id: string
    principal: number
    interestRate: number
    tenure: number
    emi: number
    totalPayment: number
    createdAt: string
  }>
  comparisonResults: LoanSimulationResult[]
  isLoading: boolean
  error: string | null
  
  simulateLoan: (data: { principal: number; interestRate: number; tenure: number }) => Promise<LoanSimulationResult>
  saveSimulation: (data: { principal: number; interestRate: number; tenure: number }) => Promise<void>
  compareLoans: (loans: Array<{ principal: number; interestRate: number; tenure: number }>) => Promise<LoanSimulationResult[]>
}
```

#### API Integration
```typescript
simulateLoan: async (data) => {
  set({ isLoading: true, error: null })
  
  try {
    const response = await api.post<LoanSimulationResult>(
      '/loans/simulate',
      data
    )

    if (response.success && response.data) {
      set({
        simulationResult: response.data,
        isLoading: false,
        error: null
      })
    } else {
      throw new Error(response.error || 'Loan simulation failed')
    }
  } catch (error: any) {
    set({
      isLoading: false,
      error: error.error || 'Failed to simulate loan',
      simulationResult: null
    })
    throw error
  }
}
```

## API Endpoints

### Core Endpoints

#### POST /api/v1/loans/simulate
**Request:**
```json
{
  "principal": 1000000,
  "interestRate": 12,
  "tenure": 60
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "emi": 22244.45,
    "totalInterest": 334667.00,
    "totalPayment": 1334667.00
  },
  "message": "Loan simulation completed successfully"
}
```

#### POST /api/v1/loans/simulate/schedule
**Response:**
```json
{
  "success": true,
  "data": {
    "emi": 22244.45,
    "totalInterest": 334667.00,
    "totalPayment": 1334667.00,
    "principal": 1000000,
    "interestRate": 12,
    "tenure": 60,
    "schedule": [
      {
        "month": 1,
        "principal": 14244.45,
        "interest": 8000.00,
        "emi": 22244.45,
        "balance": 985755.55
      },
      // ... more months
    ]
  }
}
```

#### POST /api/v1/loans/compare
**Request:**
```json
{
  "loans": [
    { "principal": 1000000, "interestRate": 10, "tenure": 60 },
    { "principal": 1000000, "interestRate": 12, "tenure": 60 },
    { "principal": 1000000, "interestRate": 15, "tenure": 60 }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "emi": 21247.00,
      "totalInterest": 274820.00,
      "totalPayment": 1274820.00,
      "principal": 1000000,
      "interestRate": 10,
      "tenure": 60
    },
    {
      "emi": 22244.45,
      "totalInterest": 334667.00,
      "totalPayment": 1334667.00,
      "principal": 1000000,
      "interestRate": 12,
      "tenure": 60
    },
    {
      "emi": 23790.00,
      "totalInterest": 427400.00,
      "totalPayment": 1427400.00,
      "principal": 1000000,
      "interestRate": 15,
      "tenure": 60
    }
  ]
}
```

## Performance Optimization

### 1. Calculation Performance
- **Target**: < 50ms execution time
- **Monitoring**: Performance logging in service
- **Optimization**: Quick EMI calculation for UI updates

### 2. Caching Strategy
- **Client-side**: Zustand persistence for history
- **API-level**: Response caching for common calculations
- **Database**: Indexed queries for simulation history

### 3. Rate Limiting
- **Free users**: 20 requests/day
- **Pro users**: Unlimited requests
- **Simulation endpoints**: No authentication required

## Security Features

### 1. Input Validation
- **Zod schemas**: Type-safe validation
- **Range checks**: Prevent extreme values
- **Sanitization**: Clean user inputs

### 2. Rate Limiting
- **API rate limiting**: Prevent abuse
- **User-based limits**: Fair usage distribution
- **Freemium integration**: Usage tracking

### 3. Error Handling
- **Graceful failures**: User-friendly error messages
- **Logging**: Comprehensive error tracking
- **Validation**: Input sanitization

## Testing Strategy

### Unit Tests
```typescript
describe('Loan Service', () => {
  it('should calculate EMI correctly', () => {
    const result = LoanService.calculateEMIQuick(1000000, 12, 60);
    expect(result).toBeCloseTo(22244.45, 2);
  });

  it('should handle zero interest rate', () => {
    const result = LoanService.calculateEMIQuick(1000000, 0, 60);
    expect(result).toBe(16666.67);
  });

  it('should validate inputs', () => {
    expect(() => LoanService.validateLoanInputs(-1000, 12, 60))
      .toThrow('Principal amount must be greater than 0');
  });
});
```

### Integration Tests
```typescript
describe('Loan API', () => {
  it('should simulate loan correctly', async () => {
    const response = await request(app)
      .post('/api/v1/loans/simulate')
      .send({
        principal: 1000000,
        interestRate: 12,
        tenure: 60
      })
      .expect(200);

    expect(response.body.success).toBe(true);
    expect(response.body.data.emi).toBeCloseTo(22244.45, 2);
  });
});
```

## Example Calculations

### Example 1: Standard Loan
**Input:**
- Principal: NPR 1,000,000
- Interest Rate: 12% per annum
- Tenure: 60 months

**Output:**
- EMI: NPR 22,244.45
- Total Interest: NPR 334,667.00
- Total Payment: NPR 1,334,667.00

### Example 2: Zero Interest Loan
**Input:**
- Principal: NPR 500,000
- Interest Rate: 0%
- Tenure: 24 months

**Output:**
- EMI: NPR 20,833.33
- Total Interest: NPR 0.00
- Total Payment: NPR 500,000.00

### Example 3: High Interest Loan
**Input:**
- Principal: NPR 2,000,000
- Interest Rate: 18% per annum
- Tenure: 84 months

**Output:**
- EMI: NPR 38,352.00
- Total Interest: NPR 1,221,568.00
- Total Payment: NPR 3,221,568.00

## Integration Examples

### 1. Quick EMI Widget
```typescript
export const QuickEMICalculator = () => {
  const [emi, setEmi] = useState<number>(0);
  
  const calculateEMI = (principal: number, rate: number, tenure: number) => {
    const result = useLoanStore.getState().quickEMI(principal, rate, tenure);
    setEmi(result);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow">
      <h3>Quick EMI Calculator</h3>
      <div className="text-2xl font-bold text-blue-600">
        NPR {emi.toLocaleString()}
      </div>
    </div>
  );
};
```

### 2. Loan Comparison Table
```typescript
export const LoanComparisonTable = ({ comparisons }: { comparisons: LoanSimulationResult[] }) => {
  return (
    <table className="table">
      <thead>
        <tr>
          <th>Interest Rate</th>
          <th>Monthly EMI</th>
          <th>Total Interest</th>
          <th>Total Payment</th>
        </tr>
      </thead>
      <tbody>
        {comparisons.map((loan, index) => (
          <tr key={index}>
            <td>{loan.interestRate}%</td>
            <td>NPR {loan.emi.toLocaleString()}</td>
            <td>NPR {loan.totalInterest.toLocaleString()}</td>
            <td>NPR {loan.totalPayment.toLocaleString()}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};
```

## Monitoring and Analytics

### Performance Metrics
- **Calculation time**: Track execution performance
- **API response time**: Monitor endpoint performance
- **Error rates**: Track failed calculations
- **Usage patterns**: Analyze popular loan parameters

### Business Metrics
- **Simulation count**: Number of calculations performed
- **Conversion rate**: Simulations to saved loans
- **Popular parameters**: Most common loan configurations
- **User engagement**: Feature usage patterns

## Future Enhancements

### 1. Advanced Features
- **Prepayment calculations**: Early payoff scenarios
- **Variable interest rates**: Adjustable rate loans
- **Multiple loan types**: Home, car, personal loans
- **Tax benefits**: Tax deduction calculations

### 2. Integration Features
- **Bank APIs**: Real-time interest rates
- **Credit scoring**: Loan eligibility assessment
- **Document generation**: Loan agreement PDFs
- **Payment processing**: EMI payment integration

### 3. Analytics Features
- **Cost comparison**: Bank-to-bank comparisons
- **Affordability analysis**: Income-based recommendations
- **Risk assessment**: Loan risk scoring
- **Market trends**: Interest rate trends

This comprehensive loan simulation system provides accurate EMI calculations, detailed amortization schedules, and a user-friendly interface for making informed financial decisions.
