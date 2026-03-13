/**
 * FinSathi AI - Loan Calculator Examples
 * Real-world examples and use cases for Nepali users
 */

import { 
  calculateLoanEMI, 
  calculateLoanWithSchedule, 
  quickEMI, 
  calculateAffordability,
  compareLoans,
  validateLoanParameters,
  LOAN_CONSTANTS 
} from './loanCalculator.js';

/**
 * Example 1: Home Loan Calculation
 */
export function homeLoanExample() {
  console.log('🏠 Home Loan Example');
  console.log('==================');
  
  const params = {
    loanAmount: 5000000,    // NPR 50 lakh
    interestRate: 10.5,     // 10.5% annual rate
    tenureYears: 20,        // 20 years
  };
  
  const result = calculateLoanEMI(params);
  
  console.log(`Loan Amount: NPR ${result.principal.toLocaleString()}`);
  console.log(`Interest Rate: ${result.annualRate}% per annum`);
  console.log(`Tenure: ${result.tenureYears} years (${result.totalMonths} months)`);
  console.log(`Monthly EMI: NPR ${result.emi.toLocaleString()}`);
  console.log(`Total Interest: NPR ${result.totalInterest.toLocaleString()}`);
  console.log(`Total Payment: NPR ${result.totalPayment.toLocaleString()}`);
  console.log(`Interest-to-Principal Ratio: ${(result.totalInterest / result.principal * 100).toFixed(1)}%`);
  console.log('');
  
  return result;
}

/**
 * Example 2: Personal Loan Comparison
 */
export function personalLoanComparisonExample() {
  console.log('💼 Personal Loan Comparison');
  console.log('============================');
  
  const loanOptions = [
    {
      name: 'Nabil Bank',
      amount: 1000000,
      rate: 13.5,
      tenure: 5,
    },
    {
      name: 'Global IME Bank',
      amount: 1000000,
      rate: 12.8,
      tenure: 5,
    },
    {
      name: 'NIC Asia Bank',
      amount: 1000000,
      rate: 14.2,
      tenure: 5,
    },
  ];
  
  const comparison = compareLoans(loanOptions);
  
  comparison.forEach((option, index) => {
    const rank = index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉';
    console.log(`${rank} ${option.name}`);
    console.log(`   EMI: NPR ${option.emi.toLocaleString()}`);
    console.log(`   Total Interest: NPR ${option.totalInterest.toLocaleString()}`);
    console.log(`   Total Payment: NPR ${option.totalPayment.toLocaleString()}`);
    console.log('');
  });
  
  return comparison;
}

/**
 * Example 3: Vehicle Loan with Zero Down Payment
 */
export function vehicleLoanExample() {
  console.log('🚗 Vehicle Loan Example');
  console.log('=======================');
  
  const params = {
    loanAmount: 2500000,    // NPR 25 lakh for a car
    interestRate: 15,       // 15% typical vehicle loan rate
    tenureYears: 7,         // 7 years
  };
  
  const result = calculateLoanEMI(params);
  
  console.log(`Vehicle Price: NPR ${result.principal.toLocaleString()}`);
  console.log(`Interest Rate: ${result.annualRate}% per annum`);
  console.log(`Loan Tenure: ${result.tenureYears} years`);
  console.log(`Monthly EMI: NPR ${result.emi.toLocaleString()}`);
  console.log(`Total Interest: NPR ${result.totalInterest.toLocaleString()}`);
  console.log(`Total Cost: NPR ${result.totalPayment.toLocaleString()}`);
  console.log('');
  
  // Show affordability check
  const affordability = calculateAffordability(80000, 0, 0.4); // NPR 80k monthly income
  console.log(`Affordability Check (Monthly Income: NPR 80,000):`);
  console.log(`   Available for EMI: NPR ${affordability.availableEMI.toLocaleString()}`);
  console.log(`   Can afford this loan: ${affordability.canAffordLoan ? 'Yes ✅' : 'No ❌'}`);
  console.log('');
  
  return { result, affordability };
}

/**
 * Example 4: Education Loan (Zero Interest)
 */
export function educationLoanExample() {
  console.log('🎓 Education Loan Example (Zero Interest)');
  console.log('====================================');
  
  const params = {
    loanAmount: 800000,     // NPR 8 lakh
    interestRate: 0,        // Zero interest (subsidized education loan)
    tenureYears: 10,        // 10 years repayment period
  };
  
  const result = calculateLoanEMI(params);
  
  console.log(`Education Loan Amount: NPR ${result.principal.toLocaleString()}`);
  console.log(`Interest Rate: ${result.annualRate}% (Zero Interest Subsidy)`);
  console.log(`Repayment Period: ${result.tenureYears} years`);
  console.log(`Monthly EMI: NPR ${result.emi.toLocaleString()}`);
  console.log(`Total Interest: NPR ${result.totalInterest.toLocaleString()}`);
  console.log(`Total Payment: NPR ${result.totalPayment.toLocaleString()}`);
  console.log('');
  
  return result;
}

/**
 * Example 5: Business Loan Analysis
 */
export function businessLoanExample() {
  console.log('🏢 Business Loan Analysis');
  console.log('========================');
  
  const params = {
    loanAmount: 20000000,   // NPR 2 crore
    interestRate: 18,       // 18% business loan rate
    tenureYears: 5,         // 5 years
  };
  
  const result = calculateEMIWithSchedule(params);
  
  console.log(`Business Loan Amount: NPR ${result.principal.toLocaleString()}`);
  console.log(`Interest Rate: ${result.annualRate}% per annum`);
  console.log(`Loan Tenure: ${result.tenureYears} years`);
  console.log(`Monthly EMI: NPR ${result.emi.toLocaleString()}`);
  console.log(`Total Interest: NPR ${result.totalInterest.toLocaleString()}`);
  console.log(`Total Payment: NPR ${result.totalPayment.toLocaleString()}`);
  console.log('');
  
  // Show first 6 months of amortization
  console.log('Amortization Schedule (First 6 months):');
  console.log('Month | Opening Balance | EMI | Interest | Principal | Closing Balance');
  console.log('------|----------------|-----|---------|-----------|----------------');
  
  result.schedule.slice(0, 6).forEach(month => {
    console.log(
      `${month.month.toString().padStart(5)} | ${month.openingBalance.toLocaleString().padStart(15)} | ${month.emi.toLocaleString().padStart(4)} | ${month.interestPayment.toLocaleString().padStart(8)} | ${month.principalPayment.toLocaleString().padStart(10)} | ${month.closingBalance.toLocaleString().padStart(15)}`
    );
  });
  
  console.log('... (showing first 6 months of 60 months total)');
  console.log('');
  
  return result;
}

/**
 * Example 6: Loan Affordability Calculator
 */
export function affordabilityCalculatorExample() {
  console.log('💰 Loan Affordability Calculator');
  console.log('===============================');
  
  const scenarios = [
    {
      name: 'Fresh Graduate',
      monthlyIncome: 25000,
      existingEMIs: 0,
      maxDTI: 0.3, // Conservative DTI
    },
    {
      name: 'Mid-level Professional',
      monthlyIncome: 80000,
      existingEMIs: 5000,
      maxDTI: 0.4, // Moderate DTI
    },
    {
      name: 'Senior Manager',
      monthlyIncome: 200000,
      existingEMIs: 20000,
      maxDTI: 0.5, // Aggressive DTI
    },
  ];
  
  scenarios.forEach(scenario => {
    const analysis = calculateAffordability(scenario.monthlyIncome, scenario.existingEMIs, scenario.maxDTI);
    
    console.log(`${scenario.name}:`);
    console.log(`   Monthly Income: NPR ${scenario.monthlyIncome.toLocaleString()}`);
    console.log(`   Existing EMIs: NPR ${scenario.existingEMIs.toLocaleString()}`);
    console.log(`   Available for EMI: NPR ${analysis.availableEMI.toLocaleString()}`);
    console.log(`   Max Loan Amount: NPR ${analysis.maxLoanAmount.toLocaleString()}`);
    console.log(`   Current DTI: ${(analysis.currentDTI * 100).toFixed(1)}%`);
    console.log('');
  });
  
  return scenarios;
}

/**
 * Example 7: Quick EMI Calculator for Mobile App
 */
export function quickEMICalculatorExample() {
  console.log('📱 Quick EMI Calculator (Mobile App Style)');
  console.log('=======================================');
  
  const commonAmounts = [100000, 500000, 1000000, 2000000, 5000000];
  const commonRates = [8, 10, 12, 15, 18];
  const commonTenures = [1, 3, 5, 7, 10];
  
  console.log('Quick Reference Table:');
  console.log('Amount | Rate | 1yr | 3yr | 5yr | 7yr | 10yr');
  console.log('-------|------|------|------|------|------|-------');
  
  commonAmounts.forEach(amount => {
    const row = [amount.toLocaleString()];
    
    commonTenures.forEach(tenure => {
      const emi = quickEMI(amount, 12, tenure);
      row.push(emi.toLocaleString());
    });
    
    console.log(row.join(' | '));
  });
  
  console.log('');
  console.log('Note: Based on 12% interest rate for reference');
  console.log('');
}

/**
 * Example 8: Parameter Validation
 */
export function parameterValidationExample() {
  console.log('⚠️  Parameter Validation Examples');
  console.log('==================================');
  
  const testCases = [
    {
      name: 'Very Low Amount',
      params: { loanAmount: 5000, interestRate: 12, tenureYears: 5 },
    },
    {
      name: 'Very High Interest Rate',
      params: { loanAmount: 1000000, interestRate: 45, tenureYears: 5 },
    },
    {
      name: 'Very Long Tenure',
      params: { loanAmount: 1000000, interestRate: 12, tenureYears: 30 },
    },
    {
      name: 'Good Parameters',
      params: { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
    },
  ];
  
  testCases.forEach(testCase => {
    console.log(`${testCase.name}:`);
    console.log(`   Amount: NPR ${testCase.params.loanAmount.toLocaleString()}`);
    console.log(`   Rate: ${testCase.params.interestRate}%`);
    console.log(`   Tenure: ${testCase.params.tenureYears} years`);
    
    const validation = validateLoanParameters(testCase.params);
    
    if (validation.warnings.length > 0) {
      console.log(`   ⚠️  Warnings: ${validation.warnings.join(', ')}`);
    }
    
    if (validation.errors.length > 0) {
      console.log(`   ❌ Errors: ${validation.errors.join(', ')}`);
    }
    
    if (validation.warnings.length === 0 && validation.errors.length === 0) {
      console.log(`   ✅ Parameters look good!`);
    }
    
    console.log('');
  });
}

/**
 * Example 9: Real Nepalese Market Scenario
 */
export function nepaleseMarketScenario() {
  console.log('🇳🇵 Real Nepalese Market Scenario');
  console.log('================================');
  
  console.log('Current Market Rates (Approximate):');
  console.log('- Home Loans: 8.5% - 12%');
  console.log('- Personal Loans: 13% - 18%');
  console.log('- Vehicle Loans: 14% - 16%');
  console.log('- Business Loans: 16% - 20%');
  console.log('');
  
  const realisticScenarios = [
    {
      type: 'Home Loan (First-time Buyer)',
      amount: 8000000,
      rate: 10.5,
      tenure: 20,
    },
    {
      type: 'Personal Loan (Salaried Employee)',
      amount: 500000,
      rate: 15,
      tenure: 3,
    },
    {
      type: 'Vehicle Loan (New Car)',
      amount: 3500000,
      rate: 15.5,
      tenure: 7,
    },
    {
      type: 'Business Loan (SME)',
      amount: 5000000,
      rate: 18,
      tenure: 5,
    },
  ];
  
  realisticScenarios.forEach(scenario => {
    const result = calculateLoanEMI(scenario);
    
    console.log(`${scenario.type}:`);
    console.log(`   Amount: NPR ${result.principal.toLocaleString()}`);
    console.log(`   Rate: ${result.annualRate}%`);
    console.log(`   Tenure: ${result.tenureYears} years`);
    console.log(`   EMI: NPR ${result.emi.toLocaleString()}`);
    console.log(`   Total Interest: NPR ${result.totalInterest.toLocaleString()}`);
    console.log('');
  });
}

/**
 * Helper function to generate amortization schedule
 */
function calculateEMIWithSchedule(params) {
  const baseCalculation = calculateLoanEMI(params);
  const { emi, monthlyRate, totalMonths } = baseCalculation;
  
  let balance = params.loanAmount;
  const schedule = [];
  
  for (let month = 1; month <= totalMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    const finalBalance = Math.max(0, balance - principalPayment);
    
    schedule.push({
      month,
      openingBalance: Math.round(balance * 100) / 100,
      emi,
      interestPayment: Math.round(interestPayment * 100) / 100,
      principalPayment: Math.round(principalPayment * 100) / 100,
      closingBalance: Math.round(finalBalance * 100) / 100,
    });
    
    balance = finalBalance;
  }
  
  return {
    ...baseCalculation,
    schedule,
  };
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🏦 FinSathi AI - Loan Calculator Examples');
  console.log('======================================');
  console.log('Real-world examples for Nepali users');
  console.log('');
  
  homeLoanExample();
  personalLoanComparisonExample();
  vehicleLoanExample();
  educationLoanExample();
  businessLoanExample();
  affordabilityCalculatorExample();
  quickEMICalculatorExample();
  parameterValidationExample();
  nepaleseMarketScenario();
  
  console.log('📊 Examples completed! Use these as reference for your loan calculations.');
}

// Export all example functions
export {
  homeLoanExample,
  personalLoanComparisonExample,
  vehicleLoanExample,
  educationLoanExample,
  businessLoanExample,
  affordabilityCalculatorExample,
  quickEMICalculatorExample,
  parameterValidationExample,
  nepaleseMarketScenario,
};

// Auto-run examples if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv) {
  runAllExamples();
}
