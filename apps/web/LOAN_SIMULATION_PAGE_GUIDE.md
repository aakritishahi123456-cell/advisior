# Loan Simulation Page Guide

## Overview
Comprehensive loan simulation page for FinSathi AI dashboard built with Next.js, Tailwind CSS, React Hook Form, and Axios. Features real-time EMI calculation, risk assessment, and loan history management.

## 🎯 Key Features

### Core Functionality
- **Loan Input Form**: Comprehensive form with validation for loan parameters
- **Real-time EMI Calculation**: Instant EMI calculation as user types
- **Risk Assessment**: Automatic risk evaluation based on debt burden ratio
- **EMI Result Card**: Detailed breakdown of loan calculations
- **Loan History**: View and manage previous simulations
- **Responsive Design**: Optimized for all screen sizes

### Advanced Features
- **Quick Actions**: Pre-filled templates for common loan types
- **Comparison Tools**: Select and compare multiple loan options
- **Risk Indicators**: Visual risk level indicators with recommendations
- **Data Persistence**: Save and retrieve loan simulations
- **Export Options**: Export calculations for reference

## 📁 File Structure

```
src/
├── pages/
│   └── loan-simulation.tsx           # Main page component
├── components/
│   ├── LoanForm.tsx                 # Loan input form component
│   ├── EMIResultCard.tsx            # EMI results display component
│   ├── RiskIndicator.tsx            # Risk assessment component
│   └── LoanHistory.tsx              # Loan history component
├── utils/
│   ├── format.ts                    # Formatting utilities
│   └── loanCalculator.ts            # Loan calculation utilities
└── hooks/
    └── useLoanSimulation.ts          # Custom hook for loan simulation
```

## 🚀 Usage Examples

### Basic Implementation
```typescript
import LoanSimulation from '../pages/loan-simulation';

export default function App() {
  return <LoanSimulation />;
}
```

### With Custom Configuration
```typescript
import LoanSimulation from '../pages/loan-simulation';

export default function App() {
  return (
    <div>
      <LoanSimulation />
    </div>
  );
}
```

### Using Individual Components
```typescript
import LoanForm from '../components/LoanForm';
import EMIResultCard from '../components/EMIResultCard';
import RiskIndicator from '../components/RiskIndicator';
import LoanHistory from '../components/LoanHistory';

export default function CustomLoanPage() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2">
        <LoanForm onSubmit={handleSubmit} />
      </div>
      <div className="space-y-6">
        <EMIResultCard data={simulationResult} />
        <RiskIndicator riskData={riskData} />
        <LoanHistory loans={loanHistory} />
      </div>
    </div>
  );
}
```

## 📊 Component Breakdown

### LoanForm Component
```typescript
interface LoanFormProps {
  onSubmit: (data: LoanFormData) => void;
  isLoading?: boolean;
  defaultValues?: Partial<LoanFormData>;
}

<LoanForm 
  onSubmit={handleSubmit}
  isLoading={isLoading}
  defaultValues={{
    loanAmount: 1000000,
    interestRate: 12,
    tenureYears: 5,
    loanType: 'PERSONAL',
  }}
/>
```

### EMIResultCard Component
```typescript
interface EMIResultCardProps {
  data: EMIData;
  isPreview?: boolean;
  onSave?: () => void;
  onCompare?: () => void;
}

<EMIResultCard 
  data={simulationResult}
  isPreview={false}
  onSave={handleSave}
  onCompare={handleCompare}
/>
```

### RiskIndicator Component
```typescript
interface RiskIndicatorProps {
  riskData: RiskAssessment;
  compact?: boolean;
}

<RiskIndicator 
  riskData={riskAssessment}
  compact={false}
/>
```

### LoanHistory Component
```typescript
interface LoanHistoryProps {
  loans: LoanSimulationResult[];
  onViewAll?: () => void;
  onViewDetails?: (loan: LoanSimulationResult) => void;
  onCompare?: (loans: LoanSimulationResult[]) => void;
  onDelete?: (loanId: string) => void;
  maxItems?: number;
}

<LoanHistory 
  loans={loanHistory}
  onViewAll={handleViewAll}
  onViewDetails={handleViewDetails}
  onCompare={handleCompare}
  onDelete={handleDelete}
  maxItems={5}
/>
```

## 🎨 Styling with Tailwind CSS

### Color Scheme
- **Primary**: Blue (blue-600, blue-700)
- **Success**: Green (green-600, green-700)
- **Warning**: Yellow (yellow-600, yellow-700)
- **Error**: Red (red-600, red-700)
- **Neutral**: Gray shades (gray-50 to gray-900)

### Responsive Design
```css
/* Mobile First Approach */
.grid { @apply grid grid-cols-1; }
@media (min-width: 1024px) {
  .grid { @apply lg:grid-cols-3; }
}

/* Component Spacing */
.space-y-6 > * + * { @apply mt-6; }
.space-x-4 > * + * { @apply ml-4; }
```

### Custom Components
```css
/* Risk Level Indicators */
.risk-low { @apply bg-green-50 border-green-200 text-green-600; }
.risk-moderate { @apply bg-yellow-50 border-yellow-200 text-yellow-600; }
.risk-high { @apply bg-red-50 border-red-200 text-red-600; }

/* Form Elements */
.form-input { @apply w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500; }
.form-label { @apply block text-sm font-medium text-gray-700 mb-2; }
```

## 📱 Responsive Design

### Breakpoints
- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

### Layout Adaptation
```typescript
// Main page layout
<div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
  {/* Form takes 2 columns on desktop */}
  <div className="lg:col-span-2">
    <LoanForm />
  </div>
  
  {/* Results sidebar */}
  <div className="space-y-6">
    <EMIResultCard />
    <RiskIndicator />
  </div>
</div>
```

### Mobile Optimizations
- **Touch-friendly buttons**: Minimum 44px tap targets
- **Readable text**: Minimum 16px font size
- **Scrollable tables**: Horizontal scroll on small screens
- **Collapsible sections**: Accordion-style on mobile

## 🔧 Form Validation

### React Hook Form Integration
```typescript
const {
  control,
  handleSubmit,
  formState: { errors, isValid },
  reset,
} = useForm<LoanFormData>({
  defaultValues: {
    loanAmount: 1000000,
    interestRate: 12,
    tenureYears: 5,
    loanType: 'PERSONAL',
  },
  mode: 'onChange',
});
```

### Validation Rules
```typescript
rules={{
  required: 'Loan amount is required',
  min: {
    value: 10000,
    message: 'Loan amount must be at least NPR 10,000',
  },
  max: {
    value: 100000000,
    message: 'Loan amount cannot exceed NPR 10 crore',
  },
}}
```

### Error Handling
```typescript
{errors.loanAmount && (
  <p className="mt-1 text-sm text-red-600">
    {errors.loanAmount.message}
  </p>
)}
```

## 📊 Data Flow

### API Integration
```typescript
// Simulate loan
const simulateLoan = async (data: LoanFormData) => {
  const response = await axios.post('/api/v1/loan/simulate', data, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};

// Get loan history
const fetchHistory = async () => {
  const response = await axios.get('/api/v1/loan/history', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
};
```

### State Management
```typescript
const useLoanSimulation = () => {
  const [currentSimulation, setCurrentSimulation] = useState(null);
  const [riskAssessment, setRiskAssessment] = useState(null);
  const [loanHistory, setLoanHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  // ... methods
};
```

## 🎯 User Experience Features

### Real-time Updates
- **Live EMI Calculation**: Updates as user types
- **Instant Risk Assessment**: Automatic risk evaluation
- **Form Validation**: Real-time validation feedback
- **Progress Indicators**: Loading states during API calls

### Interactive Elements
- **Quick Actions**: Pre-filled loan templates
- **Compare Mode**: Select multiple loans for comparison
- **Sort Options**: Sort history by date, amount, EMI, or rate
- **Delete Confirmation**: Safe deletion with undo option

### Accessibility
- **Semantic HTML**: Proper heading hierarchy
- **ARIA Labels**: Screen reader support
- **Keyboard Navigation**: Full keyboard accessibility
- **Color Contrast**: WCAG compliant color schemes

## 🔍 Advanced Features

### Loan Comparison
```typescript
const handleCompare = async (selectedLoans) => {
  const comparison = await compareLoans(selectedLoans);
  // Navigate to comparison page or show modal
};
```

### Risk Assessment
```typescript
const calculateRisk = async (emi: number, income: number) => {
  const riskData = await calculateRiskAssessment(emi, income);
  setRiskAssessment(riskData);
};
```

### Export Functionality
```typescript
const exportSimulation = (simulation: LoanSimulationResult) => {
  const csv = generateCSV(simulation);
  downloadFile(csv, 'loan-simulation.csv');
};
```

## 📈 Performance Optimization

### Code Splitting
```typescript
// Dynamic imports for large components
const LoanComparison = dynamic(() => import('./LoanComparison'), {
  loading: () => <div>Loading...</div>,
});
```

### Memoization
```typescript
// Memoize expensive calculations
const calculateEMI = useCallback((amount, rate, tenure) => {
  // EMI calculation logic
}, []);
```

### Image Optimization
```typescript
// Next.js Image component for icons
import Image from 'next/image';
<Image src="/icons/calculator.svg" alt="Calculator" width={24} height={24} />
```

## 🧪 Testing

### Component Testing
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import LoanForm from '../components/LoanForm';

test('should validate loan amount', async () => {
  const onSubmit = jest.fn();
  render(<LoanForm onSubmit={onSubmit} />);
  
  const amountInput = screen.getByLabelText('Loan Amount');
  fireEvent.change(amountInput, { target: { value: '1000' } });
  
  expect(screen.getByText('Loan amount must be at least NPR 10,000')).toBeInTheDocument();
});
```

### Integration Testing
```typescript
import { renderHook, act } from '@testing-library/react-hooks';
import useLoanSimulation from '../hooks/useLoanSimulation';

test('should simulate loan successfully', async () => {
  const { result } = renderHook(() => useLoanSimulation());
  
  await act(async () => {
    await result.current.simulateLoan({
      loanAmount: 1000000,
      interestRate: 12,
      tenureYears: 5,
      loanType: 'PERSONAL',
    });
  });
  
  expect(result.current.currentSimulation).toBeTruthy();
});
```

## 🚀 Deployment

### Environment Variables
```bash
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_APP_NAME=FinSathi AI
NEXT_PUBLIC_VERSION=1.0.0
```

### Build Configuration
```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint",
    "test": "jest",
    "test:watch": "jest --watch"
  }
}
```

### Production Optimizations
- **Code Minification**: Automatic in production builds
- **Tree Shaking**: Remove unused code
- **Image Optimization**: WebP format support
- **Bundle Analysis**: Analyze bundle size

## 📚 Best Practices

### Code Organization
- **Component Composition**: Build complex UIs from simple components
- **Custom Hooks**: Extract reusable logic
- **Type Safety**: Full TypeScript coverage
- **Error Boundaries**: Handle component errors gracefully

### Performance
- **Lazy Loading**: Load components on demand
- **Debouncing**: Prevent excessive API calls
- **Caching**: Store frequently accessed data
- **Optimistic Updates**: Update UI before API confirmation

### Security
- **Input Sanitization**: Prevent XSS attacks
- **CSRF Protection**: Include CSRF tokens
- **Authentication**: Secure API endpoints
- **Data Validation**: Server-side validation

---

This comprehensive loan simulation page provides a complete solution for financial planning with modern web technologies and best practices.
