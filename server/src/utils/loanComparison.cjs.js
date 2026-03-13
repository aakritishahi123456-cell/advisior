/**
 * FinSathi AI - Loan Comparison Engine (CommonJS Version)
 * Comprehensive loan comparison and analysis system
 */

/**
 * Compare multiple loan options
 */
function compareLoans(loanOptions, options = {}) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }

  if (loanOptions.length === 0) {
    return {
      loans: [],
      analysis: {
        bestEMI: null,
        lowestInterestBurden: null,
        lowestTotalPayment: null,
        averages: {},
        ranges: {},
        savings: {},
      },
      recommendations: [],
      comparison: {
        sortBy: options.sortBy || 'TOTAL_PAYMENT',
        sortOrder: 'ASC',
        totalLoans: 0,
      },
    };
  }

  if (loanOptions.length > 10) {
    throw new Error('Maximum 10 loan options can be compared at once');
  }

  // Calculate metrics for each loan
  const calculatedLoans = loanOptions.map((loan, index) => {
    if (!loan.loanAmount || !loan.interestRate || !loan.tenureYears) {
      throw new Error(`Loan option ${index + 1} is missing required fields`);
    }

    if (loan.loanAmount <= 0) {
      throw new Error('Loan amount must be greater than 0');
    }

    if (loan.interestRate < 0) {
      throw new Error('Interest rate cannot be negative');
    }

    if (loan.tenureYears <= 0) {
      throw new Error('Tenure must be greater than 0');
    }

    // Calculate EMI and other metrics
    const monthlyRate = loan.interestRate / 12 / 100;
    const totalMonths = loan.tenureYears * 12;
    
    let emi;
    if (monthlyRate === 0) {
      emi = loan.loanAmount / totalMonths;
    } else {
      emi = loan.loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / 
            (Math.pow(1 + monthlyRate, totalMonths) - 1);
    }

    const totalPayment = emi * totalMonths;
    const totalInterest = totalPayment - loan.loanAmount;
    const effectiveAmount = loan.loanAmount - (loan.downPayment || 0);
    const effectiveRate = (totalInterest / effectiveAmount / loan.tenureYears) * 100;

    return {
      ...loan,
      emi: Math.round(emi * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      monthlyRate: Math.round(monthlyRate * 10000) / 100,
      totalMonths,
      totalInterestRate: Math.round((totalInterest / loan.loanAmount) * 10000) / 100,
      interestToPrincipalRatio: Math.round((totalInterest / loan.loanAmount) * 10000) / 100,
      effectiveRate: Math.round(effectiveRate * 100) / 100,
      effectiveAmount,
      emiToIncomeRatio: loan.monthlyIncome ? Math.round((emi / loan.monthlyIncome) * 10000) / 100 : null,
      loanToValueRatio: loan.propertyValue ? Math.round((loan.loanAmount / loan.propertyValue) * 10000) / 100 : null,
    };
  });

  // Sort loans based on criteria
  const sortBy = options.sortBy || 'TOTAL_PAYMENT';
  calculatedLoans.sort((a, b) => {
    switch (sortBy) {
      case 'EMI':
        return a.emi - b.emi;
      case 'TOTAL_INTEREST':
        return a.totalInterest - b.totalInterest;
      case 'TOTAL_PAYMENT':
      default:
        return a.totalPayment - b.totalPayment;
      case 'EFFECTIVE_RATE':
        return a.effectiveRate - b.effectiveRate;
      case 'LOAN_AMOUNT':
        return a.loanAmount - b.loanAmount;
    }
  });

  // Add rank
  calculatedLoans.forEach((loan, index) => {
    loan.rank = index + 1;
  });

  // Generate analysis
  const analysis = generateAnalysis(calculatedLoans);
  
  // Generate recommendations
  const recommendations = generateRecommendations(calculatedLoans, analysis);

  return {
    loans: calculatedLoans,
    analysis,
    recommendations,
    comparison: {
      sortBy: sortBy.toUpperCase(),
      sortOrder: 'ASC',
      totalLoans: calculatedLoans.length,
    },
  };
}

/**
 * Quick comparison for 2-3 loans
 */
function quickCompare(loanOptions) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }

  if (loanOptions.length === 0) {
    throw new Error('At least one loan option is required');
  }

  if (loanOptions.length > 3) {
    throw new Error('Maximum 3 loan options can be compared at once');
  }

  return compareLoans(loanOptions, { sortBy: 'TOTAL_PAYMENT' });
}

/**
 * Compare loans by specific criteria
 */
function compareByCriteria(loanOptions, criteria) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }

  const validCriteria = ['EMI', 'TOTAL_INTEREST', 'TOTAL_PAYMENT', 'EFFECTIVE_RATE', 'LOAN_AMOUNT'];
  const sortBy = validCriteria.includes(criteria?.toUpperCase()) ? criteria.toUpperCase() : 'TOTAL_PAYMENT';

  return compareLoans(loanOptions, { sortBy });
}

/**
 * Calculate comparison matrix
 */
function calculateComparisonMatrix(loanOptions) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }

  if (loanOptions.length === 0) {
    return {
      matrix: [],
      comparison: {
        totalLoans: 0,
        totalComparisons: 0,
      },
    };
  }

  const comparison = compareLoans(loanOptions);
  const matrix = [];

  comparison.loans.forEach((loan, i) => {
    const comparisons = [];
    
    comparison.loans.forEach((otherLoan, j) => {
      const emiDiff = loan.emi - otherLoan.emi;
      const interestDiff = loan.totalInterest - otherLoan.totalInterest;
      const paymentDiff = loan.totalPayment - otherLoan.totalPayment;
      
      let better;
      if (i === j) {
        better = 'equal';
      } else if (loan.totalPayment < otherLoan.totalPayment) {
        better = 'loan1';
      } else {
        better = 'loan2';
      }

      comparisons.push({
        loanIndex: j,
        loanName: otherLoan.bank || `Loan ${j + 1}`,
        emiDifference: Math.abs(emiDiff),
        interestDifference: Math.abs(interestDiff),
        paymentDifference: Math.abs(paymentDiff),
        emiDifferencePercent: Math.round((emiDiff / otherLoan.emi) * 10000) / 100,
        interestDifferencePercent: Math.round((interestDiff / otherLoan.totalInterest) * 10000) / 100,
        paymentDifferencePercent: Math.round((paymentDiff / otherLoan.totalPayment) * 10000) / 100,
        better,
      });
    });

    matrix.push({
      loanIndex: i,
      loanName: loan.bank || `Loan ${i + 1}`,
      loan,
      comparisons,
    });
  });

  return {
    matrix,
    comparison: {
      totalLoans: loanOptions.length,
      totalComparisons: loanOptions.length * loanOptions.length,
    },
  };
}

/**
 * Generate comparison summary
 */
function generateComparisonSummary(loanOptions) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }

  if (loanOptions.length === 0) {
    return {
      summary: {
        totalLoans: 0,
        bestEMI: 0,
        lowestInterest: 0,
        lowestPayment: 0,
        averageEMI: 0,
        averageInterest: 0,
        averagePayment: 0,
        totalSavings: 0,
      },
      insights: [],
      recommendation: 'No loans to compare',
    };
  }

  const comparison = compareLoans(loanOptions);
  
  const summary = {
    totalLoans: loanOptions.length,
    bestEMI: comparison.analysis.bestEMI?.emi || 0,
    lowestInterest: comparison.analysis.lowestInterestBurden?.totalInterest || 0,
    lowestPayment: comparison.analysis.lowestTotalPayment?.totalPayment || 0,
    averageEMI: comparison.analysis.averages?.emi || 0,
    averageInterest: comparison.analysis.averages?.totalInterest || 0,
    averagePayment: comparison.analysis.averages?.totalPayment || 0,
    totalSavings: comparison.analysis.savings?.paymentVsWorst || 0,
  };

  const insights = generateInsights(comparison.loans, summary);
  const recommendation = generateSummaryRecommendation(summary, insights);

  return {
    summary,
    insights,
    recommendation,
  };
}

/**
 * Export comparison to CSV
 */
function exportComparisonToCSV(loanOptions) {
  if (!Array.isArray(loanOptions)) {
    throw new Error('Loan options must be an array');
  }

  if (loanOptions.length === 0) {
    return 'Rank,Bank,Loan Type,Amount,Rate,Tenure,EMI,Total Interest,Total Payment,Effective Rate\n';
  }

  const comparison = compareLoans(loanOptions);
  
  const headers = [
    'Rank',
    'Bank',
    'Loan Type',
    'Amount',
    'Rate',
    'Tenure',
    'EMI',
    'Total Interest',
    'Total Payment',
    'Effective Rate',
    'Interest Ratio',
    'Monthly Rate',
    'Total Months',
  ];

  const csvRows = [headers.join(',')];

  comparison.loans.forEach(loan => {
    const row = [
      loan.rank || '',
      `"${loan.bank || 'Unknown'}"`,
      `"${loan.loanType || 'Personal'}"`,
      loan.loanAmount || 0,
      loan.interestRate || 0,
      loan.tenureYears || 0,
      loan.emi || 0,
      loan.totalInterest || 0,
      loan.totalPayment || 0,
      loan.effectiveRate || 0,
      loan.interestToPrincipalRatio || 0,
      loan.monthlyRate || 0,
      loan.totalMonths || 0,
    ];

    csvRows.push(row.join(','));
  });

  return csvRows.join('\n');
}

// Helper functions
function generateAnalysis(loans) {
  if (loans.length === 0) {
    return {
      bestEMI: null,
      lowestInterestBurden: null,
      lowestTotalPayment: null,
      averages: {},
      ranges: {},
      savings: {},
    };
  }

  const bestEMI = loans.reduce((best, current) => 
    current.emi < best.emi ? current : best, loans[0]);
  
  const lowestInterestBurden = loans.reduce((best, current) => 
    current.totalInterest < best.totalInterest ? current : best, loans[0]);
  
  const lowestTotalPayment = loans.reduce((best, current) => 
    current.totalPayment < best.totalPayment ? current : best, loans[0]);

  const averages = {
    emi: Math.round((loans.reduce((sum, loan) => sum + loan.emi, 0) / loans.length) * 100) / 100,
    totalInterest: Math.round((loans.reduce((sum, loan) => sum + loan.totalInterest, 0) / loans.length) * 100) / 100,
    totalPayment: Math.round((loans.reduce((sum, loan) => sum + loan.totalPayment, 0) / loans.length) * 100) / 100,
    loanAmount: Math.round((loans.reduce((sum, loan) => sum + loan.loanAmount, 0) / loans.length) * 100) / 100,
    interestRate: Math.round((loans.reduce((sum, loan) => sum + loan.interestRate, 0) / loans.length) * 100) / 100,
  };

  const ranges = {
    emi: {
      min: Math.min(...loans.map(loan => loan.emi)),
      max: Math.max(...loans.map(loan => loan.emi)),
      range: Math.max(...loans.map(loan => loan.emi)) - Math.min(...loans.map(loan => loan.emi)),
    },
    totalInterest: {
      min: Math.min(...loans.map(loan => loan.totalInterest)),
      max: Math.max(...loans.map(loan => loan.totalInterest)),
      range: Math.max(...loans.map(loan => loan.totalInterest)) - Math.min(...loans.map(loan => loan.totalInterest)),
    },
    totalPayment: {
      min: Math.min(...loans.map(loan => loan.totalPayment)),
      max: Math.max(...loans.map(loan => loan.totalPayment)),
      range: Math.max(...loans.map(loan => loan.totalPayment)) - Math.min(...loans.map(loan => loan.totalPayment)),
    },
  };

  const worstTotalPayment = Math.max(...loans.map(loan => loan.totalPayment));
  const savings = {
    emiVsWorst: Math.round((worstTotalPayment - lowestTotalPayment.totalPayment) * 100) / 100,
    interestVsWorst: Math.round((Math.max(...loans.map(loan => loan.totalInterest)) - lowestInterestBurden.totalInterest) * 100) / 100,
    paymentVsWorst: Math.round((worstTotalPayment - lowestTotalPayment.totalPayment) * 100) / 100,
  };

  return {
    bestEMI,
    lowestInterestBurden,
    lowestTotalPayment,
    averages,
    ranges,
    savings,
  };
}

function generateRecommendations(loans, analysis) {
  const recommendations = [];

  if (analysis.bestEMI) {
    recommendations.push({
      type: 'LOWEST_EMI',
      title: 'Lowest EMI Option',
      description: `${analysis.bestEMI.bank || 'Loan 1'} offers the lowest EMI of ${analysis.bestEMI.emi}`,
      action: 'CONSIDER',
      priority: 'HIGH',
    });
  }

  if (analysis.lowestInterestBurden) {
    recommendations.push({
      type: 'LOWEST_INTEREST',
      title: 'Lowest Interest Burden',
      description: `${analysis.lowestInterestBurden.bank || 'Loan 1'} has the lowest total interest of ${analysis.lowestInterestBurden.totalInterest}`,
      action: 'CONSIDER',
      priority: 'HIGH',
    });
  }

  if (analysis.lowestTotalPayment) {
    recommendations.push({
      type: 'LOWEST_TOTAL',
      title: 'Lowest Total Payment',
      description: `${analysis.lowestTotalPayment.bank || 'Loan 1'} offers the lowest total payment of ${analysis.lowestTotalPayment.totalPayment}`,
      action: 'CONSIDER',
      priority: 'HIGH',
    });
  }

  if (analysis.savings.paymentVsWorst > 10000) {
    recommendations.push({
      type: 'SIGNIFICANT_SAVINGS',
      title: 'Significant Savings Available',
      description: `You can save ${analysis.savings.paymentVsWorst} by choosing the best option`,
      action: 'COMPARE',
      priority: 'MEDIUM',
    });
  }

  return recommendations;
}

function generateInsights(loans, summary) {
  const insights = [];

  if (summary.totalSavings > 50000) {
    insights.push('Significant savings potential exists between loan options');
  }

  if (loans.length > 3) {
    insights.push('Multiple loan options available - consider negotiating rates');
  }

  const avgRate = summary.averageInterest;
  if (avgRate > 15) {
    insights.push('Average interest rates are high - consider improving credit score');
  }

  return insights;
}

function generateSummaryRecommendation(summary, insights) {
  if (summary.totalLoans === 0) {
    return 'No loans available for comparison';
  }

  if (summary.totalSavings > 50000) {
    return 'Significant savings available - choose the lowest total payment option';
  }

  if (summary.totalSavings > 10000) {
    return 'Moderate savings available - compare all options carefully';
  }

  return 'All loan options are similar - consider other factors like customer service';
}

// Export all functions
module.exports = {
  compareLoans,
  quickCompare,
  compareByCriteria,
  calculateComparisonMatrix,
  generateComparisonSummary,
  exportComparisonToCSV,
};
