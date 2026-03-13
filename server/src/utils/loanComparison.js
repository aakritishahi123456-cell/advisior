/**
 * FinSathi AI - Loan Comparison Engine
 * Comprehensive loan comparison and analysis utilities
 */

/**
 * Compare multiple loan options and identify the best choices
 * @param {Array} loanOptions - Array of loan objects to compare
 * @param {Object} options - Comparison options
 * @returns {Object} Comparison results with analysis
 */
export function compareLoans(loanOptions, options = {}) {
  try {
    // Validate input
    if (!Array.isArray(loanOptions)) {
      throw new Error('Loan options must be an array');
    }

    if (loanOptions.length === 0) {
      throw new Error('At least one loan option is required for comparison');
    }

    if (loanOptions.length > 10) {
      throw new Error('Maximum 10 loan options can be compared at once');
    }

    // Set default options
    const comparisonOptions = {
      sortBy: 'TOTAL_PAYMENT', // 'EMI', 'TOTAL_INTEREST', 'TOTAL_PAYMENT'
      includeAnalysis: true,
      includeRecommendations: true,
      currency: 'NPR',
      locale: 'ne-NP',
      ...options
    };

    // Validate and process each loan option
    const processedLoans = loanOptions.map((loan, index) => {
      const validatedLoan = validateLoanOption(loan, index);
      const calculatedLoan = calculateLoanMetrics(validatedLoan);
      return {
        ...validatedLoan,
        ...calculatedLoan,
        originalIndex: index,
      };
    });

    // Sort loans based on the primary criteria
    const sortedLoans = sortLoans(processedLoans, comparisonOptions.sortBy);

    // Calculate rankings and analysis
    const analysis = calculateAnalysis(sortedLoans, comparisonOptions);

    // Generate recommendations
    const recommendations = generateRecommendations(sortedLoans, analysis);

    return {
      loans: sortedLoans,
      analysis,
      recommendations,
      comparison: {
        totalLoans: loanOptions.length,
        sortBy: comparisonOptions.sortBy,
        currency: comparisonOptions.currency,
        locale: comparisonOptions.locale,
        generatedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    throw new Error(`Loan comparison failed: ${error.message}`);
  }
}

/**
 * Validate a single loan option
 * @param {Object} loan - Loan object to validate
 * @param {number} index - Index of the loan in the array
 * @returns {Object} Validated loan object
 */
function validateLoanOption(loan, index) {
  const errors = [];

  // Required fields validation
  if (!loan.loanAmount || typeof loan.loanAmount !== 'number') {
    errors.push(`Loan ${index + 1}: Loan amount is required and must be a number`);
  }

  if (!loan.interestRate || typeof loan.interestRate !== 'number') {
    errors.push(`Loan ${index + 1}: Interest rate is required and must be a number`);
  }

  if (!loan.tenureYears || typeof loan.tenureYears !== 'number') {
    errors.push(`Loan ${index + 1}: Tenure is required and must be a number`);
  }

  // Value validation
  if (loan.loanAmount <= 0) {
    errors.push(`Loan ${index + 1}: Loan amount must be greater than 0`);
  }

  if (loan.loanAmount > 100000000) {
    errors.push(`Loan ${index + 1}: Loan amount cannot exceed NPR 10 crore`);
  }

  if (loan.interestRate < 0) {
    errors.push(`Loan ${index + 1}: Interest rate cannot be negative`);
  }

  if (loan.interestRate > 50) {
    errors.push(`Loan ${index + 1}: Interest rate seems unusually high`);
  }

  if (loan.tenureYears <= 0) {
    errors.push(`Loan ${index + 1}: Tenure must be greater than 0`);
  }

  if (loan.tenureYears > 30) {
    errors.push(`Loan ${index + 1}: Tenure cannot exceed 30 years`);
  }

  if (errors.length > 0) {
    throw new Error(`Validation failed:\n${errors.join('\n')}`);
  }

  // Set defaults for optional fields
  return {
    loanAmount: loan.loanAmount,
    interestRate: loan.interestRate,
    tenureYears: loan.tenureYears,
    loanType: loan.loanType || 'PERSONAL',
    bank: loan.bank || 'Unknown',
    processingFee: loan.processingFee || 0,
    downPayment: loan.downPayment || 0,
    description: loan.description || `Loan ${index + 1}`,
  };
}

/**
 * Calculate comprehensive loan metrics
 * @param {Object} loan - Validated loan object
 * @returns {Object} Calculated loan metrics
 */
function calculateLoanMetrics(loan) {
  const { loanAmount, interestRate, tenureYears, processingFee, downPayment } = loan;

  // Calculate effective loan amount (after down payment)
  const effectiveAmount = Math.max(0, loanAmount - downPayment);

  // Calculate EMI using standard formula
  const monthlyRate = interestRate / 12 / 100;
  const totalMonths = tenureYears * 12;

  let emi;
  if (monthlyRate === 0) {
    // Zero interest loan
    emi = effectiveAmount / totalMonths;
  } else {
    // Standard EMI formula: EMI = P × r × (1+r)^n / ((1+r)^n – 1)
    const ratePower = Math.pow(1 + monthlyRate, totalMonths);
    emi = effectiveAmount * monthlyRate * ratePower / (ratePower - 1);
  }

  // Calculate total payment and interest
  const totalPayment = emi * totalMonths + processingFee;
  const totalInterest = totalPayment - effectiveAmount;

  // Calculate additional metrics
  const effectiveRate = calculateEffectiveRate(effectiveAmount, totalPayment, tenureYears);
  const monthlyRatePercent = (interestRate / 12).toFixed(4);
  const totalInterestRate = ((totalInterest / effectiveAmount) * 100).toFixed(2);
  const emiToIncomeRatio = calculateEMIToIncomeRatio(emi);
  const loanToValueRatio = calculateLoanToValueRatio(loanAmount, downPayment);

  return {
    emi: Math.round(emi * 100) / 100, // Round to 2 decimal places
    totalInterest: Math.round(totalInterest * 100) / 100,
    totalPayment: Math.round(totalPayment * 100) / 100,
    effectiveAmount: Math.round(effectiveAmount * 100) / 100,
    effectiveRate: Math.round(effectiveRate * 100) / 100,
    monthlyRate: parseFloat(monthlyRatePercent),
    totalInterestRate: parseFloat(totalInterestRate),
    emiToIncomeRatio,
    loanToValueRatio,
    monthlyRatePercent,
    totalMonths,
    tenureYears,
  };
}

/**
 * Calculate effective annual rate
 * @param {number} principal - Loan principal
 * @param {number} totalPayment - Total payment including fees
 * @param {number} years - Loan tenure in years
 * @returns {number} Effective annual rate percentage
 */
function calculateEffectiveRate(principal, totalPayment, years) {
  if (years === 0) return 0;
  
  const totalInterest = totalPayment - principal;
  const simpleRate = (totalInterest / principal) * 100;
  
  // Approximate effective rate (more complex calculation would require iterative methods)
  const effectiveRate = simpleRate / years;
  
  return effectiveRate;
}

/**
 * Calculate EMI to income ratio (assumes 30% of EMI as monthly income)
 * @param {number} emi - Monthly EMI
 * @returns {number} EMI to income ratio
 */
function calculateEMIToIncomeRatio(emi) {
  // Assume monthly income is 30% of EMI (typical Nepali market assumption)
  const estimatedMonthlyIncome = emi / 0.3;
  return (emi / estimatedMonthlyIncome) * 100;
}

/**
 * Calculate loan to value ratio
 * @param {number} loanAmount - Total loan amount
 * @param {number} downPayment - Down payment amount
 * @returns {number} Loan to value ratio
 */
function calculateLoanToValueRatio(loanAmount, downPayment) {
  const propertyValue = loanAmount + downPayment;
  return (loanAmount / propertyValue) * 100;
}

/**
 * Sort loans based on specified criteria
 * @param {Array} loans - Array of loan objects with metrics
 * @param {string} sortBy - Sort criteria
 * @returns {Array} Sorted array of loans
 */
function sortLoans(loans, sortBy) {
  const sortedLoans = [...loans];

  switch (sortBy) {
    case 'EMI':
      return sortedLoans.sort((a, b) => a.emi - b.emi);
    
    case 'TOTAL_INTEREST':
      return sortedLoans.sort((a, b) => a.totalInterest - b.totalInterest);
    
    case 'TOTAL_PAYMENT':
      return sortedLoans.sort((a, b) => a.totalPayment - b.totalPayment);
    
    case 'EFFECTIVE_RATE':
      return sortedLoans.sort((a, b) => a.effectiveRate - b.effectiveRate);
    
    case 'LOAN_AMOUNT':
      return sortedLoans.sort((a, b) => a.loanAmount - b.loanAmount);
    
    default:
      return sortedLoans.sort((a, b) => a.totalPayment - b.totalPayment);
  }
}

/**
 * Calculate comprehensive analysis of loan comparison
 * @param {Array} sortedLoans - Sorted array of loans
 * @param {Object} options - Comparison options
 * @returns {Object} Analysis results
 */
function calculateAnalysis(sortedLoans, options) {
  const totalLoans = sortedLoans.length;
  
  if (totalLoans === 0) {
    return {
      bestEMI: null,
      lowestInterestBurden: null,
      lowestTotalPayment: null,
      savings: {},
      averages: {},
      ranges: {},
    };
  }

  // Identify best options
  const bestEMI = sortedLoans[0];
  const lowestInterestBurden = sortedLoans.reduce((best, current) => 
    current.totalInterest < best.totalInterest ? current : best
  );
  const lowestTotalPayment = sortedLoans[0];

  // Calculate savings compared to other options
  const savings = {};
  if (totalLoans > 1) {
    const worstEMI = sortedLoans[sortedLoans.length - 1];
    const worstInterestBurden = sortedLoans.reduce((worst, current) => 
      current.totalInterest > worst.totalInterest ? current : worst
    );
    const worstTotalPayment = sortedLoans[sortedLoans.length - 1];

    savings.emiVsWorst = Math.round((worstEMI.emi - bestEMI.emi) * 100) / 100;
    savings.interestVsWorst = Math.round((worstInterestBurden.totalInterest - lowestInterestBurden.totalInterest) * 100) / 100;
    savings.paymentVsWorst = Math.round((worstTotalPayment.totalPayment - lowestTotalPayment.totalPayment) * 100) / 100;
  }

  // Calculate averages
  const averages = {
    emi: Math.round(sortedLoans.reduce((sum, loan) => sum + loan.emi, 0) / totalLoans),
    totalInterest: Math.round(sortedLoans.reduce((sum, loan) => sum + loan.totalInterest, 0) / totalLoans),
    totalPayment: Math.round(sortedLoans.reduce((sum, loan) => sum + loan.totalPayment, 0) / totalLoans),
    loanAmount: Math.round(sortedLoans.reduce((sum, loan) => sum + loan.loanAmount, 0) / totalLoans),
    interestRate: Math.round(sortedLoans.reduce((sum, loan) => sum + loan.interestRate, 0) / totalLoans),
    tenureYears: Math.round(sortedLoans.reduce((sum, loan) => sum + loan.tenureYears, 0) / totalLoans),
    effectiveRate: Math.round(sortedLoans.reduce((sum, loan) => sum + loan.effectiveRate, 0) / totalLoans),
  };

  // Calculate ranges
  const ranges = {
    emi: {
      min: Math.min(...sortedLoans.map(loan => loan.emi)),
      max: Math.max(...sortedLoans.map(loan => loan.emi)),
      range: Math.max(...sortedLoans.map(loan => loan.emi)) - Math.min(...sortedLoans.map(loan => loan.emi)),
    },
    totalInterest: {
      min: Math.min(...sortedLoans.map(loan => loan.totalInterest)),
      max: Math.max(...sortedLoans.map(loan => loan.totalInterest)),
      range: Math.max(...sortedLoans.map(loan => loan.totalInterest)) - Math.min(...sortedLoans.map(loan => loan.totalInterest)),
    },
    totalPayment: {
      min: Math.min(...sortedLoans.map(loan => loan.totalPayment)),
      max: Math.max(...sortedLoans.map(loan => loan.totalPayment)),
      range: Math.max(...sortedLoans.map(loan => loan.totalPayment)) - Math.min(...sortedLoans.map(loan => loan.totalPayment)),
    },
  };

  return {
    bestEMI: {
      loan: bestEMI,
      value: bestEMI.emi,
      description: `Lowest monthly payment: ${formatCurrency(bestEMI.emi)}`,
    },
    lowestInterestBurden: {
      loan: lowestInterestBurden,
      value: lowestInterestBurden.totalInterest,
      description: `Lowest total interest: ${formatCurrency(lowestInterestBurden.totalInterest)}`,
    },
    lowestTotalPayment: {
      loan: lowestTotalPayment,
      value: lowestTotalPayment.totalPayment,
      description: `Lowest total payment: ${formatCurrency(lowestTotalPayment.totalPayment)}`,
    },
    savings,
    averages,
    ranges,
  };
}

/**
 * Generate recommendations based on comparison analysis
 * @param {Array} sortedLoans - Sorted array of loans
 * @param {Object} analysis - Analysis results
 * @returns {Array} Array of recommendations
 */
function generateRecommendations(sortedLoans, analysis) {
  const recommendations = [];

  // Recommendation for lowest EMI
  if (analysis.bestEMI) {
    recommendations.push({
      type: 'LOWEST_EMI',
      title: 'Best for Monthly Budget',
      description: `This loan has the lowest monthly payment of ${formatCurrency(analysis.bestEMI.value)}, making it ideal for tight monthly budgets.`,
      loanIndex: analysis.bestEMI.loan.originalIndex,
      impact: 'monthly',
    });
  }

  // Recommendation for lowest interest burden
  if (analysis.lowestInterestBurden) {
    recommendations.push({
      type: 'LOWEST_INTEREST',
      title: 'Best for Long-term Savings',
      description: `This loan has the lowest total interest cost of ${formatCurrency(analysis.lowestInterestBurden.value)}, saving you money over the loan tenure.`,
      loanIndex: analysis.lowestInterestBurden.loan.originalIndex,
      impact: 'long-term',
    });
  }

  // Recommendation for lowest total payment
  if (analysis.lowestTotalPayment) {
    recommendations.push({
      type: 'LOWEST_TOTAL',
      title: 'Best Overall Value',
      description: `This loan has the lowest total cost of ${formatCurrency(analysis.lowestTotalPayment.value)}, offering the best overall value.`,
      loanIndex: analysis.lowestTotalPayment.loan.originalIndex,
      impact: 'overall',
    });
  }

  // Recommendation based on savings
  if (analysis.savings.paymentVsWorst && analysis.savings.paymentVsWorst > 10) {
    recommendations.push({
      type: 'SIGNIFICANT_SAVINGS',
      title: 'Significant Cost Savings',
      description: `Choosing this loan over the most expensive option saves you ${formatCurrency(analysis.savings.paymentVsWorst)} (${analysis.savings.paymentVsWorst}% of total cost).`,
      loanIndex: analysis.lowestTotalPayment.loan.originalIndex,
      impact: 'cost',
    });
  }

  // Recommendation based on Nepali market context
  if (analysis.averages.interestRate > 15) {
    const lowRateLoan = sortedLoans.find(loan => loan.interestRate < 12);
    if (lowRateLoan) {
      recommendations.push({
        type: 'MARKET_RATE',
        title: 'Below Market Rate',
        description: `This loan's interest rate of ${lowRateLoan.interestRate}% is below the Nepali market average of ${analysis.averages.interestRate}%.`,
        loanIndex: lowRateLoan.originalIndex,
        impact: 'market',
      });
    }
  }

  // Recommendation based on affordability
  const affordableLoans = sortedLoans.filter(loan => loan.emiToIncomeRatio < 40);
  if (affordableLoans.length > 0 && affordableLoans.length < sortedLoans.length) {
    recommendations.push({
      type: 'AFFORDABILITY',
      title: 'Most Affordable',
      description: `This loan has the most favorable EMI-to-income ratio, making it the most affordable option.`,
      loanIndex: affordableLoans[0].originalIndex,
      impact: 'affordability',
    });
  }

  return recommendations;
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code
 * @param {string} locale - Locale for formatting
 * @returns {string} Formatted currency string
 */
function formatCurrency(amount, currency = 'NPR', locale = 'ne-NP') {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Quick comparison for 2-3 loans (optimized performance)
 * @param {Array} loanOptions - Array of loan options
 * @returns {Object} Quick comparison results
 */
export function quickCompare(loanOptions) {
  try {
    if (!Array.isArray(loanOptions) || loanOptions.length === 0) {
      throw new Error('At least one loan option is required');
    }

    if (loanOptions.length > 3) {
      throw new Error('Quick comparison supports maximum 3 loan options');
    }

    // Use the main comparison function with optimized options
    return compareLoans(loanOptions, {
      sortBy: 'TOTAL_PAYMENT',
      includeAnalysis: true,
      includeRecommendations: false,
    });
  } catch (error) {
    throw new Error(`Quick comparison failed: ${error.message}`);
  }
}

/**
 * Compare loans by specific criteria
 * @param {Array} loanOptions - Array of loan options
 * @param {string} criteria - Comparison criteria
 * @returns {Object} Comparison results
 */
export function compareByCriteria(loanOptions, criteria) {
  return compareLoans(loanOptions, {
    sortBy: criteria.toUpperCase(),
    includeAnalysis: true,
    includeRecommendations: true,
  });
}

/**
 * Calculate loan comparison matrix
 * @param {Array} loanOptions - Array of loan options
 * @returns {Object} Comparison matrix
 */
export function calculateComparisonMatrix(loanOptions) {
  const comparison = compareLoans(loanOptions);
  const loans = comparison.loans;
  const matrix = [];

  loans.forEach((loan1, index1) => {
    const row = { loan: loan1, comparisons: {} };
    
    loans.forEach((loan2, index2) => {
      if (index1 === index2) {
        row.comparisons[index2] = {
          emiDifference: 0,
          interestDifference: 0,
          paymentDifference: 0,
          emiDifferencePercent: 0,
          interestDifferencePercent: 0,
          paymentDifferencePercent: 0,
          better: 'equal',
        };
      } else {
        const emiDifference = loan1.emi - loan2.emi;
        const interestDifference = loan1.totalInterest - loan2.totalInterest;
        const paymentDifference = loan1.totalPayment - loan2.totalPayment;
        
        row.comparisons[index2] = {
          emiDifference: Math.round(emiDifference * 100) / 100,
          interestDifference: Math.round(interestDifference * 100) / 100,
          paymentDifference: Math.round(paymentDifference * 100) / 100,
          emiDifferencePercent: Math.round((emiDifference / loan2.emi) * 100),
          interestDifferencePercent: Math.round((interestDifference / loan2.totalInterest) * 100),
          paymentDifferencePercent: Math.round((paymentDifference / loan2.totalPayment) * 100),
          better: emiDifference < 0 ? 'loan1' : loan1 === loan2 ? 'equal' : 'loan2',
        };
      }
    });
    
    matrix.push(row);
  });

  return {
    matrix,
    comparison,
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Generate loan comparison summary
 * @param {Array} loanOptions - Array of loan options
 * @returns {Object} Summary statistics
 */
export function generateComparisonSummary(loanOptions) {
  const comparison = compareLoans(loanOptions);
  const loans = comparison.loans;

  if (loans.length === 0) {
    return {
      totalLoans: 0,
      summary: {},
      insights: [],
    };
  }

  const summary = {
    totalLoans: loans.length,
    bestEMI: comparison.analysis.bestEMI.value,
    lowestInterest: comparison.analysis.lowestInterestBurden.value,
    lowestPayment: comparison.analysis.lowestTotalPayment.value,
    averageEMI: comparison.averages.emi,
    averageInterest: comparison.averages.interestRate,
    averagePayment: comparison.averages.totalPayment,
    totalSavings: comparison.savings.paymentVsWorst || 0,
  };

  // Generate insights
  const insights = [];

  // Insight about EMI range
  if (summary.averageEMI > 0) {
    const emiRange = comparison.ranges.emi;
    insights.push({
      type: 'EMI_RANGE',
      title: 'Monthly Payment Range',
      description: `Monthly payments range from ${formatCurrency(emiRange.min)} to ${formatCurrency(emiRange.max)}, with an average of ${formatCurrency(summary.averageEMI)}.`,
    });
  }

  // Insight about interest burden
  if (summary.averageInterest > 0) {
    const interestRange = comparison.ranges.totalInterest;
    insights.push({
      type: 'INTEREST_RANGE',
      title: 'Interest Cost Range',
      description: `Total interest costs range from ${formatCurrency(interestRange.min)} to ${formatCurrency(interestRange.max)}, with an average of ${formatCurrency(summary.averageInterest)}.`,
    });
  }

  // Insight about total payment
  if (summary.averagePayment > 0) {
    const paymentRange = comparison.ranges.totalPayment;
    insights.push({
      type: 'PAYMENT_RANGE',
      title: 'Total Cost Range',
      description: `Total payments range from ${formatCurrency(paymentRange.min)} to ${formatCurrency(paymentRange.max)}, with an average of ${formatCurrency(summary.averagePayment)}.`,
    });
  }

  // Insight about savings
  if (summary.totalSavings > 0) {
    insights.push({
      type: 'SAVINGS_POTENTIAL',
      title: 'Potential Savings',
      description: `By choosing the best option over the most expensive, you could save ${formatCurrency(summary.totalSavings)} over the loan tenure.`,
    });
  }

  return {
    ...summary,
    insights,
  };
}

/**
 * Export comparison data to CSV format
 * @param {Array} loanOptions - Array of loan options
 * @returns {string} CSV formatted comparison data
 */
export function exportComparisonToCSV(loanOptions) {
  const comparison = compareLoans(loanOptions);
  const loans = comparison.loans;

  const headers = [
    'Rank',
    'Bank',
    'Loan Type',
    'Amount',
    'Interest Rate',
    'Tenure',
    'EMI',
    'Total Interest',
    'Total Payment',
    'Effective Rate',
    'Down Payment',
    'Processing Fee',
    'Description',
  ];

  const csvRows = loans.map((loan, index) => [
    index + 1,
    loan.bank || 'Unknown',
    loan.loanType || 'Personal',
    loan.loanAmount,
    loan.interestRate,
    loan.tenureYears,
    loan.emi,
    loan.totalInterest,
    loan.totalPayment,
    loan.effectiveRate,
    loan.downPayment || 0,
    loan.processingFee || 0,
    loan.description || `Loan ${index + 1}`,
  ]);

  return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
}

export default compareLoans;
