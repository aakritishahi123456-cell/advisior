/**
 * FinSathi AI - EMI Loan Calculator (CommonJS Version)
 * Production-ready loan calculation engine for Nepali users
 */

/**
 * Calculate EMI (Equated Monthly Installment) with comprehensive error handling
 */
function calculateEMI(loanAmount, interestRate, tenureYears) {
  // Handle both object and individual parameter formats
  if (typeof loanAmount === 'object' && loanAmount !== null) {
    const params = loanAmount;
    loanAmount = params.loanAmount;
    interestRate = params.interestRate;
    tenureYears = params.tenureYears;
  }

  // Input validation
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

  // Convert to monthly values
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  // Calculate EMI using standard formula
  let emi;
  if (monthlyRate === 0) {
    emi = loanAmount / totalMonths;
  } else {
    // Standard EMI formula: EMI = P × r × (1+r)^n / ((1+r)^n – 1)
    const ratePower = Math.pow(1 + monthlyRate, totalMonths);
    
    // Optimized calculation to avoid precision issues
    emi = loanAmount * monthlyRate * ratePower / (ratePower - 1);
    
    // Ensure EMI doesn't exceed principal (edge case for very high rates)
    if (emi > loanAmount) {
      emi = loanAmount;
    }
  }

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  return {
    emi: Math.round(emi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    monthlyRate: monthlyRate * 100,
    totalMonths,
    interestToPrincipalRatio: (totalInterest / loanAmount) * 100,
  };
}

/**
 * Calculate loan affordability
 */
function calculateAffordability(monthlyIncome, existingEMIs = 0, maxDTIRatio = 0.5) {
  if (monthlyIncome <= 0) {
    throw new Error('Monthly income must be greater than 0');
  }

  if (existingEMIs < 0) {
    throw new Error('Existing EMIs cannot be negative');
  }

  const maxEMI = monthlyIncome * maxDTIRatio - existingEMIs;
  const affordable = maxEMI > 0;
  
  return {
    affordable,
    maxEMI: affordable ? Math.round(maxEMI * 100) / 100 : 0,
    dtiRatio: ((existingEMIs + maxEMI) / monthlyIncome) * 100,
  };
}

/**
 * Generate amortization schedule
 */
function generateAmortizationSchedule(loanAmount, interestRate, tenureYears) {
  const emiResult = calculateEMI(loanAmount, interestRate, tenureYears);
  const { emi } = emiResult;
  
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;
  let balance = loanAmount;
  const schedule = [];

  for (let month = 1; month <= totalMonths; month++) {
    const interestPayment = balance * monthlyRate;
    const principalPayment = emi - interestPayment;
    balance -= principalPayment;

    schedule.push({
      month,
      emi: Math.round(emi * 100) / 100,
      principal: Math.round(principalPayment * 100) / 100,
      interest: Math.round(interestPayment * 100) / 100,
      balance: Math.round(Math.max(0, balance) * 100) / 100,
    });
  }

  return schedule;
}

/**
 * Compare multiple loan options
 */
function compareLoans(loanOptions) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }

  if (loanOptions.length === 0) {
    return {
      loans: [],
      bestEMI: null,
      lowestInterest: null,
      lowestTotal: null,
    };
  }

  // Calculate metrics for each loan
  const calculatedLoans = loanOptions.map((loan, index) => {
    // Handle both object and individual parameter formats
    let loanAmount, interestRate, tenureYears;
    
    if (typeof loan === 'object' && loan !== null) {
      loanAmount = loan.loanAmount;
      interestRate = loan.interestRate;
      tenureYears = loan.tenureYears;
    } else {
      // If it's not an object, skip this invalid entry
      return null;
    }

    if (!loanAmount || !interestRate || !tenureYears) {
      return null;
    }

    try {
      const result = calculateEMI(loanAmount, interestRate, tenureYears);
      return {
        ...loan,
        ...result,
      };
    } catch (error) {
      return null;
    }
  }).filter(loan => loan !== null);

  if (calculatedLoans.length === 0) {
    return {
      loans: [],
      bestEMI: null,
      lowestInterest: null,
      lowestTotal: null,
    };
  }

  // Sort by total payment (ascending)
  calculatedLoans.sort((a, b) => a.totalPayment - b.totalPayment);

  return {
    loans: calculatedLoans,
    bestEMI: calculatedLoans.reduce((best, current) => 
      current.emi < best.emi ? current : best, calculatedLoans[0]),
    lowestInterest: calculatedLoans.reduce((best, current) => 
      current.totalInterest < best.totalInterest ? current : best, calculatedLoans[0]),
    lowestTotal: calculatedLoans[0],
  };
}

/**
 * Calculate prepayment savings
 */
function calculatePrepaymentSavings(loanAmount, interestRate, tenureYears, prepaymentAmount, prepaymentMonth) {
  const originalLoan = calculateEMI(loanAmount, interestRate, tenureYears);
  
  if (prepaymentAmount <= 0 || prepaymentMonth < 1 || prepaymentMonth > originalLoan.totalMonths) {
    return null;
  }

  // Calculate remaining balance at prepayment month
  const schedule = generateAmortizationSchedule(loanAmount, interestRate, tenureYears);
  const remainingBalance = schedule[prepaymentMonth - 1].balance;
  
  // New loan with reduced principal
  const remainingMonths = originalLoan.totalMonths - prepaymentMonth + 1;
  const newLoan = calculateEMI(remainingBalance - prepaymentAmount, interestRate, remainingMonths / 12);
  
  const savings = (originalLoan.emi * remainingMonths) - (newLoan.totalPayment + prepaymentAmount);

  return {
    originalTenure: originalLoan.totalMonths,
    newTenure: newLoan.totalMonths,
    savings: Math.round(savings * 100) / 100,
    prepaymentMonth,
    prepaymentAmount,
  };
}

/**
 * Validate loan parameters
 */
function validateLoanParams(loanAmount, interestRate, tenureYears) {
  const errors = [];
  
  if (typeof loanAmount !== 'number' || loanAmount <= 0) {
    errors.push('Loan amount must be a positive number');
  }
  
  if (typeof interestRate !== 'number' || interestRate < 0) {
    errors.push('Interest rate must be a non-negative number');
  }
  
  if (typeof tenureYears !== 'number' || tenureYears <= 0) {
    errors.push('Tenure must be a positive number');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Get loan recommendations
 */
function getLoanRecommendations(monthlyIncome, existingEMIs = 0, loanType = 'PERSONAL') {
  const recommendations = [];
  
  // Income-based recommendations
  if (monthlyIncome < 25000) {
    recommendations.push('Consider increasing income before applying for large loans');
  }
  
  if (monthlyIncome > 100000) {
    recommendations.push('You may be eligible for preferential rates with higher income');
  }
  
  if (monthlyIncome >= 50000 && monthlyIncome <= 100000) {
    recommendations.push('Moderate income level - maintain good credit history');
  }
  
  // Existing debt recommendations
  if (existingEMIs > monthlyIncome * 0.3) {
    recommendations.push('High existing debt burden - consider debt consolidation');
  }
  
  // Loan type specific recommendations
  if (loanType === 'HOME') {
    recommendations.push('Consider making a larger down payment to reduce EMI');
    recommendations.push('Home loans typically have lower interest rates');
  }
  
  if (loanType === 'PERSONAL') {
    recommendations.push('Personal loans have higher rates - keep tenure short');
    recommendations.push('Consider collateral for better rates');
  }

  if (loanType === 'EDUCATION') {
    recommendations.push('Education loans often have tax benefits');
    recommendations.push('Look for scholarships to reduce loan amount');
  }

  if (loanType === 'VEHICLE') {
    recommendations.push('Vehicle loans may require down payment');
    recommendations.push('Consider total cost of ownership beyond EMI');
  }

  if (loanType === 'BUSINESS') {
    recommendations.push('Business loans require strong business plan');
    recommendations.push('Consider government schemes for MSME loans');
  }

  // Always provide at least one recommendation
  if (recommendations.length === 0) {
    recommendations.push('Review all loan terms carefully before proceeding');
  }

  return recommendations;
}

// Export constants
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

// Export all functions
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
