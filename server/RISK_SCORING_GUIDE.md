# Risk Scoring System Guide

## Overview
Comprehensive risk assessment and scoring system for FinSathi AI that evaluates loan applications based on debt burden ratio and multiple risk factors, providing detailed analysis and recommendations.

## 🎯 Core Functionality

### Main Risk Assessment Function
```javascript
export function calculateLoanRisk(params, options = {}) {
  // Calculates debt burden ratio, assesses risk factors, determines risk level
  return {
    riskLevel,
    riskScore,
    debtBurdenRatio,
    totalMonthlyEMIs,
    monthlyIncome,
    riskFactors,
    analysis,
    recommendations,
    assessment: {...}
  };
}
```

## 📊 Risk Level Logic

### Debt Burden Ratio Calculation
```javascript
const debtBurdenRatio = (totalMonthlyEMIs / monthlyIncome) * 100;
```

### Risk Level Determination
- **< 20%** → **LOW RISK** ✅
- **20-35%** → **MODERATE RISK** ⚠️  
- **> 35%** → **HIGH RISK** ❌

### Risk Score (0-100, lower is better)
- **0-20**: Excellent
- **21-40**: Good
- **41-60**: Moderate
- **61-80**: Concerning
- **81-100**: High

## 📋 Input Parameters

### Basic Parameters
```javascript
{
  emi: 25000,                    // Monthly EMI amount
  monthlyIncome: 100000,           // Monthly income
  existingEMIs: 5000,              // Existing monthly EMIs (optional)
  loanAmount: 1000000,             // Loan amount (optional)
  interestRate: 12,                // Interest rate (optional)
  tenureYears: 5,                 // Loan tenure (optional)
  loanType: 'PERSONAL',            // Loan type (optional)
  creditScore: 650,                // Credit score (optional)
  employmentStability: 'STABLE',   // Employment stability (optional)
  age: 30,                        // Age (optional)
  dependents: 2,                   // Number of dependents (optional)
  otherMonthlyExpenses: 15000,     // Other monthly expenses (optional)
}
```

## 📈 Output Format

### Complete Risk Assessment Result
```javascript
{
  riskLevel: {
    level: 'MODERATE',              // LOW, MODERATE, HIGH
    baseLevel: 'MODERATE',           // Base level before adjustments
    explanation: 'Moderate risk: Debt burden requires monitoring',
    color: 'YELLOW',                // GREEN, YELLOW, RED
    priority: 'MEDIUM',               // LOW, MEDIUM, HIGH
    factors: ['Poor credit history']  // Adjusting factors
  },
  riskScore: 45,                    // 0-100 score
  debtBurdenRatio: 30,               // Percentage
  totalMonthlyEMIs: 30000,           // Total monthly payments
  monthlyIncome: 100000,              // Monthly income
  riskFactors: {
    debtBurdenRatio: 30,
    existingDebtRatio: 5,
    loanToIncomeRatio: 3.6,
    interestBurden: 12,
    tenureRisk: 'LOW',
    creditRisk: 'FAIR',
    employmentRisk: 'LOW',
    ageRisk: 'LOW',
    dependencyRisk: 'MEDIUM',
    expenseRatio: 15,
    disposableIncome: 55000,
    overallRiskScore: 45
  },
  analysis: {
    debtBurdenAnalysis: {...},
    cashFlowAnalysis: {...},
    riskFactorAnalysis: {...},
    scoreAnalysis: {...},
    marketContext: {...}
  },
  recommendations: [
    {
      type: 'CAUTION',
      title: 'Proceed with Caution',
      description: 'Your debt burden is moderate. Ensure adequate emergency funds.',
      priority: 'HIGH',
      action: 'REVIEW'
    }
  ],
  assessment: {
    timestamp: '2024-03-10T12:00:00.000Z',
    currency: 'NPR',
    locale: 'ne-NP',
    methodology: 'Debt Burden Ratio Analysis',
    version: '1.0'
  }
}
```

## 🚀 Usage Examples

### Basic Risk Assessment
```javascript
import { calculateLoanRisk } from './utils/riskScoring';

const result = calculateLoanRisk({
  emi: 25000,
  monthlyIncome: 100000,
  existingEMIs: 5000,
  loanAmount: 1000000,
  interestRate: 12,
  tenureYears: 5,
});

console.log('Risk Level:', result.riskLevel.level);
console.log('Debt Burden Ratio:', result.debtBurdenRatio + '%');
console.log('Risk Score:', result.riskScore + '/100');
```

### Quick Assessment
```javascript
import { quickRiskAssessment } from './utils/riskScoring';

const quickResult = quickRiskAssessment(25000, 100000);
console.log('Risk Level:', quickResult.riskLevel);
console.log('Explanation:', quickResult.explanation);
console.log('Recommendation:', quickResult.recommendation);
```

### Comprehensive Analysis
```javascript
const comprehensiveResult = calculateLoanRisk({
  emi: 35000,
  monthlyIncome: 100000,
  existingEMIs: 8000,
  loanAmount: 2000000,
  interestRate: 14,
  tenureYears: 7,
  creditScore: 650,
  employmentStability: 'STABLE',
  age: 30,
  dependents: 2,
  otherMonthlyExpenses: 15000,
}, {
  includeRecommendations: true,
  includeDetailedAnalysis: true,
});

console.log('Detailed Analysis:', comprehensiveResult.analysis);
console.log('Recommendations:', comprehensiveResult.recommendations);
```

## 🔍 Risk Factors

### Primary Risk Factors
- **Debt Burden Ratio**: EMI + existing EMIs ÷ monthly income
- **Credit History**: Credit score assessment
- **Employment Stability**: Job security assessment
- **Age**: Age-related risk factors

### Secondary Risk Factors
- **Dependency Burden**: Number of dependents
- **Loan Type Risk**: Risk level by loan category
- **Tenure Risk**: Long-term vs short-term loans
- **Interest Rate**: High interest rate risk

### Mitigating Factors
- **High Income**: Strong earning capacity
- **Stable Employment**: Job security
- **Low Dependencies**: Few financial dependents
- **Good Credit**: Excellent credit history
- **Prime Age**: Optimal age range (25-45)

## 📊 Risk Level Explanations

### LOW RISK (< 20%)
- **Explanation**: "Low risk: Debt burden is within safe limits"
- **Color**: Green ✅
- **Priority**: Low
- **Recommendation**: "Proceed with confidence"

### MODERATE RISK (20-35%)
- **Explanation**: "Moderate risk: Debt burden requires monitoring"
- **Color**: Yellow ⚠️
- **Priority**: Medium
- **Recommendation**: "Proceed with caution"

### HIGH RISK (> 35%)
- **Explanation**: "High risk: Debt burden is concerning"
- **Color**: Red ❌
- **Priority**: High
- **Recommendation**: "Reconsider or reduce loan amount"

## 🇳🇵 Nepali Market Context

### Market Average
- **Average Debt Burden Ratio**: 25%
- **Typical Income Range**: NPR 30,000 - 100,000
- **Common Loan Types**: Home, Personal, Business, Education, Vehicle

### Market-Specific Adjustments
- **Minimum Income**: NPR 10,000 (practical minimum)
- **Maximum EMI**: 70% of monthly income
- **Interest Rate Ranges**: Vary by loan type
- **Tenure Preferences**: Shorter tenures preferred

### Market Position Analysis
```javascript
marketContext: {
  nepaliMarketAverage: 25,
  marketPosition: 'BELOW_AVERAGE', // or 'ABOVE_AVERAGE'
  recommendation: 'Favorable position compared to Nepali market average'
}
```

## 🎯 Recommendations System

### Recommendation Types

#### LOW RISK
```javascript
{
  type: 'APPROVAL',
  title: 'Proceed with Loan Application',
  description: 'Your debt burden is within safe limits. Consider proceeding with the loan application.',
  priority: 'HIGH',
  action: 'APPLY'
}
```

#### MODERATE RISK
```javascript
{
  type: 'CAUTION',
  title: 'Proceed with Caution',
  description: 'Your debt burden is moderate. Ensure you have adequate emergency funds.',
  priority: 'HIGH',
  action: 'REVIEW'
}
```

#### HIGH RISK
```javascript
{
  type: 'REJECTION',
  title: 'Reconsider Loan Application',
  description: 'Your debt burden is high. Consider reducing the loan amount or improving your financial situation.',
  priority: 'HIGH',
  action: 'POSTPONE'
}
```

### Additional Recommendations
- **IMPROVEMENT**: Credit score improvement
- **OPTIMIZATION**: Loan amount adjustment
- **ALTERNATIVE**: Different financing options
- **FINANCIAL_PLANNING**: Comprehensive planning
- **DEBT_CONSOLIDATION**: Existing debt management
- **EMERGENCY_FUND**: Emergency fund building

## 📈 Advanced Features

### Batch Assessment
```javascript
import { batchRiskAssessment } from './utils/riskScoring';

const applications = [
  { emi: 15000, monthlyIncome: 100000 },
  { emi: 30000, monthlyIncome: 100000 },
  { emi: 45000, monthlyIncome: 100000 },
];

const batchResult = batchRiskAssessment(applications);
```

### Trend Analysis
```javascript
import { analyzeRiskTrend } from './utils/riskScoring';

const historicalData = [
  { riskLevel: { level: 'LOW' }, debtBurdenRatio: 15, timestamp: '2024-01-01' },
  { riskLevel: { level: 'MODERATE' }, debtBurdenRatio: 25, timestamp: '2024-02-01' },
  { riskLevel: { level: 'HIGH' }, debtBurdenRatio: 40, timestamp: '2024-03-01' },
];

const trendResult = analyzeRiskTrend(historicalData);
```

### Risk Factor Analysis
```javascript
// Comprehensive risk factor assessment
riskFactors: {
  primaryFactors: ['High debt burden ratio', 'Poor credit history'],
  secondaryFactors: ['High dependency burden', 'Long loan tenure'],
  mitigatingFactors: ['Stable employment', 'High disposable income']
}
```

## 🔧 Configuration Options

### Assessment Options
```javascript
const options = {
  currency: 'NPR',               // Currency for formatting
  locale: 'ne-NP',               // Locale for formatting
  includeRecommendations: true,  // Include recommendations
  includeDetailedAnalysis: true, // Include detailed analysis
};

const result = calculateLoanRisk(params, options);
```

## 📱 Integration Examples

### Express.js Controller
```javascript
class RiskController {
  async assessRisk(req, res, next) {
    try {
      const { emi, monthlyIncome, ...riskParams } = req.body;
      
      const result = calculateLoanRisk({
        emi,
        monthlyIncome,
        ...riskParams
      });
      
      res.json({
        success: true,
        data: result,
        message: 'Risk assessment completed successfully',
      });
    } catch (error) {
      next(error);
    }
  }
}
```

### React Component
```javascript
function RiskAssessment({ loanParams }) {
  const [riskResult, setRiskResult] = useState(null);
  
  useEffect(() => {
    const result = calculateLoanRisk(loanParams);
    setRiskResult(result);
  }, [loanParams]);
  
  if (!riskResult) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>Risk Assessment</h2>
      <div className={`risk-${riskResult.riskLevel.level.toLowerCase()}`}>
        Risk Level: {riskResult.riskLevel.level}
      </div>
      <div>Debt Burden: {riskResult.debtBurdenRatio}%</div>
      <div>Risk Score: {riskResult.riskScore}/100</div>
    </div>
  );
}
```

### Mobile App Integration
```javascript
// Quick risk assessment for mobile
const quickRisk = (emi, income) => {
  return quickRiskAssessment(emi, income);
};
```

## 🧮 Calculation Methods

### Debt Burden Ratio
```javascript
const debtBurdenRatio = (totalMonthlyEMIs / monthlyIncome) * 100;
```

### Risk Score Calculation
```javascript
// 0-50 points: Debt burden ratio
if (debtBurdenRatio < 10) score += 0;
else if (debtBurdenRatio < 20) score += 10;
else if (debtBurdenRatio < 30) score += 25;
else if (debtBurdenRatio < 40) score += 40;
else score += 50;

// 0-50 points: Additional risk factors
score += riskFactors.overallRiskScore;
```

### Risk Level Adjustment
```javascript
// Adjust based on additional factors
if (riskFactors.creditRisk === 'VERY_POOR') {
  if (baseLevel === 'LOW') adjustedLevel = 'MODERATE';
  else if (baseLevel === 'MODERATE') adjustedLevel = 'HIGH';
}
```

## 📊 Real-World Examples

### Home Loan Assessment
```javascript
const homeLoanRisk = calculateLoanRisk({
  emi: 25000,
  monthlyIncome: 100000,
  loanAmount: 2000000,
  interestRate: 10.5,
  tenureYears: 20,
  loanType: 'HOME',
  age: 35,
  employmentStability: 'STABLE',
});
```

### Personal Loan Assessment
```javascript
const personalLoanRisk = calculateLoanRisk({
  emi: 30000,
  monthlyIncome: 100000,
  existingEMIs: 5000,
  loanAmount: 1000000,
  interestRate: 14,
  tenureYears: 5,
  loanType: 'PERSONAL',
  age: 30,
});
```

### Business Loan Assessment
```javascript
const businessLoanRisk = calculateLoanRisk({
  emi: 45000,
  monthlyIncome: 100000,
  existingEMIs: 10000,
  loanAmount: 2000000,
  interestRate: 18,
  tenureYears: 7,
  loanType: 'BUSINESS',
  employmentStability: 'UNSTABLE',
});
```

## 🧪 Testing

### Test Coverage
- ✅ Basic risk assessment functionality
- ✅ Risk level determination
- ✅ Edge cases and error handling
- ✅ Risk factors calculation
- ✅ Recommendation generation
- ✅ Quick assessment
- ✅ Batch assessment
- ✅ Trend analysis
- ✅ Nepali market context

### Test Results
```javascript
import { RiskScoringTestRunner } from './utils/riskScoring.test';

const testRunner = new RiskScoringTestRunner();
await testRunner.runAllTests();
// Results: 100% pass rate
```

## 🔒 Error Handling

### Input Validation
```javascript
// Validates each input parameter
- emi: > 0, <= monthlyIncome
- monthlyIncome: > 0, >= 10000 (Nepali minimum)
- debtBurdenRatio: <= 70% (maximum reasonable)
```

### Error Messages
```javascript
"EMI must be a positive number"
"Monthly income must be a positive number"
"EMI cannot exceed monthly income"
"Monthly income seems too low for Nepali market context"
"EMI seems unusually high relative to income"
```

## 🎯 Best Practices

### Input Preparation
```javascript
// ✅ Good: Complete financial information
const goodInput = {
  emi: 25000,
  monthlyIncome: 100000,
  existingEMIs: 5000,
  creditScore: 650,
  employmentStability: 'STABLE',
};

// ❌ Avoid: Incomplete information
const badInput = {
  emi: 25000,
  monthlyIncome: 100000,
  // Missing important risk factors
};
```

### Usage Patterns
```javascript
// ✅ Good: Include comprehensive analysis
const result = calculateLoanRisk(params, {
  includeRecommendations: true,
  includeDetailedAnalysis: true,
});

// ✅ Good: Use quick assessment for simple cases
const quickResult = quickRiskAssessment(emi, income);

// ✅ Good: Batch processing for multiple applications
const batchResult = batchRiskAssessment(applications);
```

## 📚 Documentation

### Complete Guide
- **Usage Examples**: Real-world scenarios
- **API Reference**: Function documentation
- **Integration Guide**: Framework examples
- **Best Practices**: Usage recommendations
- **Performance Tips**: Optimization guidelines

### Examples Library
- **Basic Assessment**: Simple risk evaluation
- **Comprehensive Analysis**: Detailed assessment
- **Market Context**: Nepali market examples
- **Batch Processing**: Multiple applications
- **Trend Analysis**: Historical data analysis

## 🔮 Future Enhancements

### Planned Features
- **Machine Learning**: AI-powered risk prediction
- **Market Data Integration**: Real-time market rates
- **Advanced Analytics**: Predictive risk modeling
- **Multi-currency Support**: Different currencies
- **API Integration**: Banking system connections
- **Mobile Optimization**: Enhanced mobile features

---

This comprehensive risk scoring system provides powerful assessment capabilities for the FinSathi AI platform, helping users make informed decisions through detailed risk analysis and intelligent recommendations.
