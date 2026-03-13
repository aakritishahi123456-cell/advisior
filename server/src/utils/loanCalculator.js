/**
 * FinSathi AI - EMI Loan Calculator
 * Production-ready loan calculation engine for Nepali users
 */

/**
 * Calculate EMI (Equated Monthly Installment) with comprehensive error handling
 * 
 * @param {Object} params - Loan calculation parameters
 * @param {number} params.loanAmount - Principal loan amount (NPR)
 * @param {number} params.interestRate - Annual interest rate (percentage)
 * @param {number} params.tenureYears - Loan tenure in years
 * 
 * @returns {Object} Calculation results
 * @returns {number} returns.emi - Monthly EMI amount
 * @returns {number} returns.totalInterest - Total interest payable
 * @returns {number} returns.totalPayment - Total payment amount
 * @returns {number} returns.monthlyRate - Monthly interest rate
 * @returns {number} returns.totalMonths - Total number of months
 * 
 * @throws {Error} When inputs are invalid
 */
function calculateLoanEMI({ loanAmount, interestRate, tenureYears }) {
  // Input validation with performance optimization
  if (typeof loanAmount !== 'number' || typeof interestRate !== 'number' || typeof tenureYears !== 'number') {
    throw new Error('All inputs must be numbers');
  }

  // Validate ranges
  if (loanAmount <= 0) {
    throw new Error('Loan amount must be greater than 0');
  }

  if (interestRate < 0) {
    throw new Error('Interest rate cannot be negative');
  }

  if (tenureYears <= 0) {
    throw new Error('Tenure must be greater than 0');
  }

  // Business logic validation for Nepali context
  if (loanAmount > 100000000) { // 10 crore NPR limit
    throw new Error('Loan amount exceeds maximum limit of NPR 10 crore');
  }

  if (interestRate > 50) { // 50% annual rate limit
    throw new Error('Interest rate exceeds maximum limit of 50% per annum');
  }

  if (tenureYears > 30) { // 30 years maximum tenure
    throw new Error('Tenure exceeds maximum limit of 30 years');
  }

  // Calculate loan parameters
  const principal = Number(loanAmount);
  const annualRate = Number(interestRate);
  const years = Number(tenureYears);
  
  const monthlyRate = annualRate / 12 / 100; // Convert to decimal monthly rate
  const totalMonths = years * 12;

  let emi;
  let totalPayment;
  let totalInterest;

  // Handle zero interest rate edge case
  if (monthlyRate === 0) {
    // Simple division for zero interest loans
    emi = principal / totalMonths;
    totalPayment = principal;
    totalInterest = 0;
  } else {
    // Standard EMI formula: EMI = P × r × (1+r)^n / ((1+r)^n – 1)
    const ratePower = Math.pow(1 + monthlyRate, totalMonths);
    
    // Optimized calculation to avoid precision issues
    emi = principal * monthlyRate * ratePower / (ratePower - 1);
    
    // Ensure EMI doesn't exceed principal (edge case for very high rates)
    if (emi > principal) {
      emi = principal;
    }
    
    totalPayment = emi * totalMonths;
    totalInterest = totalPayment - principal;
  }

  // Round to 2 decimal places for currency
  const roundedEMI = Math.round(emi * 100) / 100;
  const roundedTotalPayment = Math.round(totalPayment * 100) / 100;
  const roundedTotalInterest = Math.round(totalInterest * 100) / 100;

  // Validate calculation results
  if (isNaN(roundedEMI) || !isFinite(roundedEMI)) {
    throw new Error('Calculation resulted in invalid value');
  }

  if (roundedEMI <= 0) {
    throw new Error('Calculated EMI must be greater than 0');
  }

  return {
    emi: roundedEMI,
    totalInterest: roundedTotalInterest,
    totalPayment: roundedTotalPayment,
    monthlyRate: Math.round(monthlyRate * 10000) / 10000, // 4 decimal places
    totalMonths,
    principal,
    annualRate,
    tenureYears: years,
  };
}

/**
 * Calculate EMI with amortization schedule
 * 
 * @param {Object} params - Loan calculation parameters
 * @param {number} params.loanAmount - Principal loan amount
 * @param {number} params.interestRate - Annual interest rate
 * @param {number} params.tenureYears - Loan tenure in years
 * 
 * @returns {Object} Calculation results with amortization schedule
 */
export function calculateLoanWithSchedule({ loanAmount, interestRate, tenureYears }) {
  const baseCalculation = calculateLoanEMI({ loanAmount, interestRate, tenureYears });
  
  const { emi, monthlyRate, totalMonths } = baseCalculation;
  
  let balance = loanAmount;
  const schedule = [];
  
  for (let month = 1; month <= totalMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    
    // Prevent negative balance due to rounding
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
 * Quick EMI calculation for comparison (optimized for performance)
 * 
 * @param {number} loanAmount - Principal loan amount
 * @param {number} interestRate - Annual interest rate
 * @param {number} tenureYears - Loan tenure in years
 * 
 * @returns {number} Monthly EMI amount
 */
export function quickEMI(loanAmount, interestRate, tenureYears) {
  try {
    const result = calculateLoanEMI({ loanAmount, interestRate, tenureYears });
    return result.emi;
  } catch (error) {
    return 0; // Return 0 for invalid inputs in comparison scenarios
  }
}

/**
 * Calculate affordability based on monthly income
 * 
 * @param {number} monthlyIncome - Monthly income in NPR
 * @param {number} existingEMIs - Existing EMI commitments
 * @param {number} maxDTIRatio - Maximum debt-to-income ratio (default 0.5 = 50%)
 * 
 * @returns {Object} Affordability analysis
 */
export function calculateAffordability(monthlyIncome, existingEMIs = 0, maxDTIRatio = 0.5) {
  if (monthlyIncome <= 0) {
    throw new Error('Monthly income must be greater than 0');
  }
  
  if (existingEMIs < 0) {
    throw new Error('Existing EMIs cannot be negative');
  }
  
  if (maxDTIRatio <= 0 || maxDTIRatio > 1) {
    throw new Error('DTI ratio must be between 0 and 1');
  }
  
  const maxEMI = monthlyIncome * maxDTIRatio - existingEMIs;
  const availableEMI = Math.max(0, maxEMI);
  
  // Estimate maximum loan amount (assuming 12% rate, 10 years tenure)
  const estimatedRate = 12;
  const estimatedTenure = 10;
  
  let maxLoanAmount = 0;
  
  if (availableEMI > 0) {
    const monthlyRate = estimatedRate / 12 / 100;
    const totalMonths = estimatedTenure * 12;
    
    if (monthlyRate > 0) {
      const ratePower = Math.pow(1 + monthlyRate, totalMonths);
      maxLoanAmount = availableEMI * (ratePower - 1) / (monthlyRate * ratePower);
    } else {
      maxLoanAmount = availableEMI * totalMonths;
    }
  }
  
  return {
    monthlyIncome,
    existingEMIs,
    maxDTIRatio,
    availableEMI: Math.round(availableEMI * 100) / 100,
    maxLoanAmount: Math.round(maxLoanAmount * 100) / 100,
    currentDTI: existingEMIs / monthlyIncome,
    canAffordLoan: availableEMI > 1000, // Minimum EMI threshold
  };
}

/**
 * Compare multiple loan options
 * 
 * @param {Array} loanOptions - Array of loan options to compare
 * @param {Object} loanOptions[].amount - Loan amount
 * @param {Object} loanOptions[].rate - Interest rate
 * @param {Object} loanOptions[].tenure - Tenure in years
 * @param {string} loanOptions[].name - Option name for identification
 * 
 * @returns {Array} Comparison results with rankings
 */
export function compareLoans(loanOptions) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }
  
  if (loanOptions.length === 0) {
    throw new Error('At least one loan option is required');
  }
  
  const results = loanOptions.map((option, index) => {
    if (!option.amount || !option.rate || !option.tenure) {
      throw new Error(`Invalid loan option at index ${index}: missing required fields`);
    }
    
    try {
      const calculation = calculateLoanEMI({
        loanAmount: option.amount,
        interestRate: option.rate,
        tenureYears: option.tenure,
      });
      
      return {
        ...option,
        ...calculation,
        totalCostRatio: calculation.totalPayment / option.amount,
        efficiency: option.amount / calculation.emi, // Amount per EMI ratio
      };
    } catch (error) {
      throw new Error(`Invalid loan option at index ${index}: ${error.message}`);
    }
  });
  
  // Sort by total interest (lowest first)
  results.sort((a, b) => a.totalInterest - b.totalInterest);
  
  // Add rankings
  return results.map((result, index) => ({
    ...result,
    rank: index + 1,
    isBestOption: index === 0,
  }));
}

/**
 * Validate loan parameters for Nepali context
 * 
 * @param {Object} params - Loan parameters to validate
 * @returns {Object} Validation results
 */
export function validateLoanParameters(params) {
  const { loanAmount, interestRate, tenureYears } = params;
  
  const validation = {
    isValid: true,
    warnings: [],
    errors: [],
  };
  
  // Amount validation
  if (loanAmount < 10000) {
    validation.warnings.push('Loan amount is very low (minimum NPR 10,000 recommended)');
  }
  
  if (loanAmount > 50000000) {
    validation.warnings.push('Loan amount is very high (consider smaller loan for better terms)');
  }
  
  // Interest rate validation
  if (interestRate < 8) {
    validation.warnings.push('Interest rate seems unusually low for Nepali market');
  }
  
  if (interestRate > 20) {
    validation.warnings.push('Interest rate is very high (consider negotiating better terms)');
  }
  
  // Tenure validation
  if (tenureYears < 1) {
    validation.errors.push('Tenure must be at least 1 year');
    validation.isValid = false;
  }
  
  if (tenureYears > 25) {
    validation.warnings.push('Very long tenure may result in high total interest');
  }
  
  // EMI to income ratio check (assuming average monthly income)
  const estimatedEMI = quickEMI(loanAmount, interestRate, tenureYears);
  const estimatedMonthlyIncome = 50000; // Average monthly income in NPR
  
  if (estimatedEMI > estimatedMonthlyIncome * 0.6) {
    validation.warnings.push('EMI may be high relative to typical monthly income');
  }
  
  return validation;
}

// Performance benchmark function
export function benchmarkCalculation() {
  const iterations = 10000;
  const testParams = {
    loanAmount: 1000000,
    interestRate: 12,
    tenureYears: 5,
  };
  
  const startTime = performance.now();
  
  for (let i = 0; i < iterations; i++) {
    calculateLoanEMI(testParams);
  }
  
  const endTime = performance.now();
  const avgTime = (endTime - startTime) / iterations;
  
  return {
    iterations,
    totalTime: endTime - startTime,
    averageTime: avgTime,
    isUnder1ms: avgTime < 1,
  };
}

// Export constants for loan calculation
const LOAN_CONSTANTS = {
  MIN_AMOUNT: 10000,
  MAX_AMOUNT: 100000000,
  MIN_RATE: 0,
  MAX_RATE: 50,
  MIN_TENURE: 1,
  MAX_TENURE: 30,
  DEFAULT_RATE: 12,
  DEFAULT_TENURE: 5,
  MAX_DTI_RATIO: 0.5,
  MIN_MONTHLY_INCOME: 10000,
};

// Export all functions for CommonJS
module.exports = {
  calculateEMI,
  calculateAffordability,
  generateAmortizationSchedule,
  compareLoans,
  calculatePrepaymentSavings,
  validateLoanParams,
  getLoanRecommendations,
  LOAN_CONSTANTS,
};
