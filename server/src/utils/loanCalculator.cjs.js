/**
 * FinSathi AI - EMI Loan Calculator (CommonJS Version)
 * Production-ready loan calculation engine for Nepali users
 */

/**
 * Calculate EMI - returns null for invalid inputs instead of throwing
 */
function calculateEMI(loanAmount, interestRate, tenureYears) {
  // Handle object format
  if (typeof loanAmount === 'object' && loanAmount !== null) {
    const p = loanAmount;
    loanAmount = p.loanAmount ?? p.amount;
    interestRate = p.interestRate ?? p.rate;
    tenureYears = p.tenureYears ?? p.tenure;
  }

  // Return null for invalid/edge-case inputs
  if (
    typeof loanAmount !== 'number' || typeof interestRate !== 'number' || typeof tenureYears !== 'number' ||
    isNaN(loanAmount) || isNaN(interestRate) || isNaN(tenureYears) ||
    !isFinite(loanAmount) || !isFinite(interestRate) || !isFinite(tenureYears) ||
    loanAmount <= 0 || interestRate < 0 || tenureYears <= 0
  ) {
    return null;
  }

  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  let emi;
  if (monthlyRate === 0) {
    emi = loanAmount / totalMonths;
  } else {
    const ratePower = Math.pow(1 + monthlyRate, totalMonths);
    emi = (loanAmount * monthlyRate * ratePower) / (ratePower - 1);
  }

  const totalPayment = emi * totalMonths;
  const totalInterest = totalPayment - loanAmount;

  return {
    emi: Math.round(emi * 100) / 100,
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    monthlyRate: monthlyRate * 100,
    totalMonths,
    interestToPrincipalRatio: Math.round((totalInterest / loanAmount) * 10000) / 100,
  };
}

/**
 * Calculate loan affordability
 * Signature: (monthlyIncome, existingEMIs, interestRate, tenureYears)
 * Returns gracefully for invalid inputs instead of throwing
 */
function calculateAffordability(monthlyIncome, existingEMIs = 0, interestRate = 12, tenureYears = 5) {
  // Graceful handling of invalid inputs
  if (!monthlyIncome || monthlyIncome <= 0) {
    return { affordable: false, maxEMI: 0, maxLoanAmount: 0, dtiRatio: 0 };
  }
  if (existingEMIs < 0) {
    existingEMIs = 0;
  }

  const MAX_DTI = 0.5;
  const maxEMI = monthlyIncome * MAX_DTI - existingEMIs;
  const affordable = maxEMI > 0;

  let maxLoanAmount = 0;
  if (affordable) {
    // Back-calculate max loan from maxEMI
    if (!interestRate || interestRate <= 0) {
      // Zero interest: simple division
      maxLoanAmount = maxEMI * (tenureYears * 12);
    } else {
      const monthlyRate = interestRate / 12 / 100;
      const totalMonths = tenureYears * 12;
      const ratePower = Math.pow(1 + monthlyRate, totalMonths);
      maxLoanAmount = (maxEMI * (ratePower - 1)) / (monthlyRate * ratePower);
    }
  }

  const dtiRatio = (existingEMIs + (affordable ? maxEMI : 0)) / monthlyIncome * 100;

  return {
    affordable,
    maxEMI: affordable ? Math.round(maxEMI * 100) / 100 : 0,
    maxLoanAmount: affordable ? Math.round(maxLoanAmount * 100) / 100 : 0,
    dtiRatio: Math.round(dtiRatio * 100) / 100,
  };
}

/**
 * Generate amortization schedule - returns empty array for invalid inputs
 */
function generateAmortizationSchedule(loanAmount, interestRate, tenureYears) {
  if (!loanAmount || loanAmount <= 0 || interestRate < 0 || !tenureYears || tenureYears <= 0) {
    return [];
  }

  const emiResult = calculateEMI(loanAmount, interestRate, tenureYears);
  if (!emiResult) return [];

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
 * Accepts loans with { amount, rate, tenure } OR { loanAmount, interestRate, tenureYears }
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
      summary: null,
    };
  }

  const calculatedLoans = loanOptions.map((loan) => {
    if (typeof loan !== 'object' || loan === null) return null;

    // Support both field naming conventions
    const loanAmount = loan.loanAmount ?? loan.amount;
    const interestRate = loan.interestRate ?? loan.rate;
    const tenureYears = loan.tenureYears ?? loan.tenure;

    if (!loanAmount || loanAmount <= 0 || interestRate < 0 || !tenureYears || tenureYears <= 0) {
      return null;
    }

    try {
      const result = calculateEMI(loanAmount, interestRate, tenureYears);
      if (!result) return null;
      return { ...loan, loanAmount, interestRate, tenureYears, ...result };
    } catch {
      return null;
    }
  }).filter(Boolean);

  if (calculatedLoans.length === 0) {
    return {
      loans: [],
      bestEMI: null,
      lowestInterest: null,
      lowestTotal: null,
      summary: null,
    };
  }

  // Sort by total payment ascending
  calculatedLoans.sort((a, b) => a.totalPayment - b.totalPayment);

  const bestEMI = calculatedLoans.reduce((best, cur) => cur.emi < best.emi ? cur : best, calculatedLoans[0]);
  const lowestInterest = calculatedLoans.reduce((best, cur) => cur.totalInterest < best.totalInterest ? cur : best, calculatedLoans[0]);
  const lowestTotal = calculatedLoans[0];

  const avgEMI = Math.round((calculatedLoans.reduce((s, l) => s + l.emi, 0) / calculatedLoans.length) * 100) / 100;
  const avgInterest = Math.round((calculatedLoans.reduce((s, l) => s + l.totalInterest, 0) / calculatedLoans.length) * 100) / 100;

  return {
    loans: calculatedLoans,
    bestEMI,
    lowestInterest,
    lowestTotal,
    summary: {
      totalLoans: calculatedLoans.length,
      averageEMI: avgEMI,
      averageInterest: avgInterest,
    },
  };
}

/**
 * Calculate prepayment savings - returns null for invalid inputs instead of throwing
 */
function calculatePrepaymentSavings(loanAmount, interestRate, tenureYears, prepaymentAmount, prepaymentMonth) {
  // Graceful handling of invalid loan params
  const originalLoan = calculateEMI(loanAmount, interestRate, tenureYears);
  if (!originalLoan) return null;

  if (!prepaymentAmount || prepaymentAmount <= 0) return null;
  if (!prepaymentMonth || prepaymentMonth < 1 || prepaymentMonth > originalLoan.totalMonths) return null;

  const schedule = generateAmortizationSchedule(loanAmount, interestRate, tenureYears);
  const remainingBalance = schedule[prepaymentMonth - 1].balance;
  const newPrincipal = remainingBalance - prepaymentAmount;

  if (newPrincipal <= 0) {
    // Prepayment clears the loan
    const remainingMonths = originalLoan.totalMonths - prepaymentMonth;
    const savings = originalLoan.emi * remainingMonths;
    return {
      originalTenure: originalLoan.totalMonths,
      newTenure: prepaymentMonth,
      savings: Math.round(savings * 100) / 100,
      prepaymentMonth,
      prepaymentAmount,
    };
  }

  const remainingMonths = originalLoan.totalMonths - prepaymentMonth;
  const newLoan = calculateEMI(newPrincipal, interestRate, remainingMonths / 12);
  if (!newLoan) return null;

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
 * Validate loan parameters with exact error messages tests expect
 */
function validateLoanParams(loanAmount, interestRate, tenureYears) {
  const errors = [];

  // Amount validation
  if (typeof loanAmount !== 'number' || loanAmount <= 0) {
    errors.push('Loan amount must be positive');
  } else if (loanAmount < 10000) {
    errors.push('Loan amount must be at least NPR 10,000');
  } else if (loanAmount > 100000000) {
    errors.push('Loan amount cannot exceed NPR 10 crore');
  }

  // Rate validation
  if (typeof interestRate !== 'number' || interestRate < 0) {
    errors.push('Interest rate cannot be negative');
  } else if (interestRate > 50) {
    errors.push('Interest rate seems unusually high');
  }

  // Tenure validation
  if (typeof tenureYears !== 'number' || tenureYears < 0) {
    errors.push('Tenure must be positive');
  } else if (tenureYears === 0) {
    errors.push('Tenure must be at least 1 year');
  } else if (tenureYears > 30) {
    errors.push('Tenure cannot exceed 30 years');
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

  if (monthlyIncome < 30000) {
    recommendations.push('Consider increasing income before applying for large loans');
  }

  if (monthlyIncome > 100000) {
    recommendations.push('You may be eligible for preferential rates with higher income');
  }

  if (monthlyIncome >= 50000 && monthlyIncome <= 100000) {
    recommendations.push('Moderate income level - maintain good credit history');
  }

  if (existingEMIs > monthlyIncome * 0.3) {
    recommendations.push('High existing debt burden - consider debt consolidation');
  }

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

  if (recommendations.length === 0) {
    recommendations.push('Review all loan terms carefully before proceeding');
  }

  return recommendations;
}

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
};

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
