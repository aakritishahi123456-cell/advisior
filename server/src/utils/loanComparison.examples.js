/**
 * FinSathi AI - Loan Comparison Engine Examples
 * Real-world examples and use cases for loan comparison
 */

import { 
  compareLoans, 
  quickCompare, 
  compareByCriteria, 
  calculateComparisonMatrix, 
  generateComparisonSummary,
  exportComparisonToCSV 
} from './loanComparison';

/**
 * Example 1: Basic Home Loan Comparison
 */
export function basicHomeLoanComparison() {
  console.log('🏠 Basic Home Loan Comparison');
  console.log('=============================');
  
  const homeLoans = [
    {
      loanAmount: 5000000,
      interestRate: 10.5,
      tenureYears: 20,
      bank: 'Nabil Bank',
      loanType: 'HOME',
      description: 'Home loan for apartment purchase',
      processingFee: 5000,
    },
    {
      loanAmount: 5000000,
      interestRate: 9.8,
      tenureYears: 20,
      bank: 'Global IME Bank',
      loanType: 'HOME',
      description: 'Home loan with competitive rate',
      processingFee: 7500,
    },
    {
      loanAmount: 5000000,
      interestRate: 11.2,
      tenureYears: 20,
      bank: 'NIC Asia Bank',
      loanType: 'HOME',
      description: 'Home loan with higher rate',
      processingFee: 3000,
    },
  ];

  const comparison = compareLoans(homeLoans);
  
  console.log(`Comparing ${comparison.comparison.totalLoans} home loans:`);
  console.log('');
  
  comparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.bank} - ${loan.description}`);
    console.log(`   Amount: NPR ${loan.loanAmount.toLocaleString()}`);
    console.log(`   Rate: ${loan.interestRate}% per annum`);
    console.log(`   Tenure: ${loan.tenureYears} years`);
    console.log(`   EMI: NPR ${loan.emi.toLocaleString()}`);
    console.log(`   Total Interest: NPR ${loan.totalInterest.toLocaleString()}`);
    console.log(`   Total Payment: NPR ${loan.totalPayment.toLocaleString()}`);
    console.log('');
  });

  console.log('📊 Analysis Results:');
  console.log(`Best for Monthly Budget: ${comparison.analysis.bestEMI.loan.bank} (EMI: NPR ${comparison.analysis.bestEMI.value.toLocaleString()})`);
  console.log(`Best for Long-term Savings: ${comparison.analysis.lowestInterestBurden.loan.bank} (Interest: NPR ${comparison.analysis.lowestInterestBurden.value.toLocaleString()})`);
  console.log(`Best Overall Value: ${comparison.analysis.lowestTotalPayment.loan.bank} (Total: NPR ${comparison.analysis.lowestTotalPayment.value.toLocaleString()})`);
  
  if (comparison.savings.paymentVsWorst > 0) {
    console.log(`💰 Potential Savings: NPR ${comparison.savings.paymentVsWorst.toLocaleString()} by choosing the best option`);
  }
  
  console.log('');
  
  return comparison;
}

/**
 * Example 2: Personal Loan Comparison with Different Tenures
 */
export function personalLoanTenureComparison() {
  console.log('💼 Personal Loan Comparison - Different Tenures');
  console.log('===============================================');
  
  const personalLoans = [
    {
      loanAmount: 1000000,
      interestRate: 15,
      tenureYears: 3,
      bank: 'Nabil Bank',
      loanType: 'PERSONAL',
      description: '3-year personal loan',
    },
    {
      loanAmount: 1000000,
      interestRate: 15,
      tenureYears: 5,
      bank: 'Nabil Bank',
      loanType: 'PERSONAL',
      description: '5-year personal loan',
    },
    {
      loanAmount: 1000000,
      interestRate: 15,
      tenureYears: 7,
      bank: 'Nabil Bank',
      loanType: 'PERSONAL',
      description: '7-year personal loan',
    },
  ];

  const comparison = compareLoans(personalLoans);
  
  console.log(`Comparing personal loans with different tenures:`);
  console.log('');
  
  comparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.description}`);
    console.log(`   EMI: NPR ${loan.emi.toLocaleString()}`);
    console.log(`   Total Interest: NPR ${loan.totalInterest.toLocaleString()}`);
    console.log(`   Total Payment: NPR ${loan.totalPayment.toLocaleString()}`);
    console.log(`   Interest-to-Principal Ratio: ${loan.totalInterestRate}%`);
    console.log('');
  });

  console.log('📈 Tenure Impact Analysis:');
  console.log(`Shortest tenure (3 years): Highest EMI, lowest total interest`);
  console.log(`Longest tenure (7 years): Lowest EMI, highest total interest`);
  
  const shortestLoan = comparison.loans.find(loan => loan.tenureYears === 3);
  const longestLoan = comparison.loans.find(loan => loan.tenureYears === 7);
  
  if (shortestLoan && longestLoan) {
    const emiDifference = longestLoan.emi - shortestLoan.emi;
    const interestDifference = longestLoan.totalInterest - shortestLoan.totalInterest;
    
    console.log(`EMI Difference: NPR ${emiDifference.toLocaleString()} (longer tenure saves monthly)`);
    console.log(`Interest Difference: NPR ${interestDifference.toLocaleString()} (shorter tenure saves overall)`);
  }
  
  console.log('');
  
  return comparison;
}

/**
 * Example 3: Multiple Banks Comparison
 */
export function multipleBanksComparison() {
  console.log('🏦 Multiple Banks Comparison');
  console.log('=============================');
  
  const bankLoans = [
    {
      loanAmount: 2000000,
      interestRate: 12.5,
      tenureYears: 5,
      bank: 'Nabil Bank',
      loanType: 'PERSONAL',
      description: 'Premium personal loan',
      processingFee: 10000,
    },
    {
      loanAmount: 2000000,
      interestRate: 11.8,
      tenureYears: 5,
      bank: 'Global IME Bank',
      loanType: 'PERSONAL',
      description: 'Standard personal loan',
      processingFee: 8000,
    },
    {
      loanAmount: 2000000,
      interestRate: 13.2,
      tenureYears: 5,
      bank: 'NIC Asia Bank',
      loanType: 'PERSONAL',
      description: 'Flexi personal loan',
      processingFee: 12000,
    },
    {
      loanAmount: 2000000,
      interestRate: 14.5,
      tenureYears: 5,
      bank: 'Prabhu Bank',
      loanType: 'PERSONAL',
      description: 'Quick personal loan',
      processingFee: 15000,
    },
  ];

  const comparison = compareLoans(bankLoans);
  
  console.log(`Comparing ${comparison.comparison.totalLoans} banks for NPR 20 lakh personal loan:`);
  console.log('');
  
  // Create a comparison table
  console.log('Rank | Bank           | Rate   | EMI          | Total Interest | Total Payment');
  console.log('-----|----------------|--------|--------------|----------------|---------------');
  
  comparison.loans.forEach((loan, index) => {
    const rank = index + 1;
    const bank = loan.bank.padEnd(15);
    const rate = `${loan.interestRate}%`.padEnd(7);
    const emi = `NPR ${loan.emi.toLocaleString()}`.padEnd(13);
    const interest = `NPR ${loan.totalInterest.toLocaleString()}`.padEnd(15);
    const payment = `NPR ${loan.totalPayment.toLocaleString()}`;
    
    console.log(`${rank.toString().padStart(4)} | ${bank} | ${rate} | ${emi} | ${interest} | ${payment}`);
  });
  
  console.log('');
  console.log('🏆 Winners by Category:');
  console.log(`Lowest EMI: ${comparison.analysis.bestEMI.loan.bank}`);
  console.log(`Lowest Interest: ${comparison.analysis.lowestInterestBurden.loan.bank}`);
  console.log(`Lowest Total Payment: ${comparison.analysis.lowestTotalPayment.loan.bank}`);
  
  console.log('');
  
  return comparison;
}

/**
 * Example 4: Vehicle Loan Comparison with Down Payment
 */
export function vehicleLoanComparison() {
  console.log('🚗 Vehicle Loan Comparison with Down Payment');
  console.log('===========================================');
  
  const vehicleLoans = [
    {
      loanAmount: 3000000,
      interestRate: 16,
      tenureYears: 7,
      bank: 'Nabil Bank',
      loanType: 'VEHICLE',
      description: 'Car loan - 20% down payment',
      downPayment: 600000,
      processingFee: 5000,
    },
    {
      loanAmount: 3000000,
      interestRate: 15.5,
      tenureYears: 7,
      bank: 'Global IME Bank',
      loanType: 'VEHICLE',
      description: 'Car loan - 25% down payment',
      downPayment: 750000,
      processingFee: 7500,
    },
    {
      loanAmount: 3000000,
      interestRate: 17,
      tenureYears: 7,
      bank: 'NIC Asia Bank',
      loanType: 'VEHICLE',
      description: 'Car loan - 15% down payment',
      downPayment: 450000,
      processingFee: 3000,
    },
  ];

  const comparison = compareLoans(vehicleLoans);
  
  console.log(`Comparing vehicle loans with different down payments:`);
  console.log('');
  
  comparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.description}`);
    console.log(`   Bank: ${loan.bank}`);
    console.log(`   Down Payment: NPR ${loan.downPayment.toLocaleString()}`);
    console.log(`   Effective Amount: NPR ${loan.effectiveAmount.toLocaleString()}`);
    console.log(`   EMI: NPR ${loan.emi.toLocaleString()}`);
    console.log(`   Total Payment: NPR ${loan.totalPayment.toLocaleString()}`);
    console.log(`   Loan-to-Value Ratio: ${loan.loanToValueRatio.toFixed(1)}%`);
    console.log('');
  });

  console.log('💡 Down Payment Impact:');
  console.log(`Higher down payment reduces EMI and total interest burden`);
  console.log(`Lower down payment increases EMI but requires less upfront cash`);
  
  console.log('');
  
  return comparison;
}

/**
 * Example 5: Quick Comparison for Mobile App
 */
export function quickComparisonExample() {
  console.log('📱 Quick Comparison (Mobile App Style)');
  console.log('=====================================');
  
  const quickLoans = [
    {
      loanAmount: 500000,
      interestRate: 14,
      tenureYears: 3,
      bank: 'Bank A',
      description: 'Quick personal loan',
    },
    {
      loanAmount: 500000,
      interestRate: 13,
      tenureYears: 3,
      bank: 'Bank B',
      description: 'Competitive personal loan',
    },
  ];

  const comparison = quickCompare(quickLoans);
  
  console.log('Quick Comparison Results:');
  console.log('');
  
  comparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.bank}`);
    console.log(`   EMI: NPR ${loan.emi.toLocaleString()}/month`);
    console.log(`   Total: NPR ${loan.totalPayment.toLocaleString()}`);
    console.log(`   Interest: NPR ${loan.totalInterest.toLocaleString()}`);
    console.log('');
  });

  console.log('🎯 Recommendation:');
  console.log(`Choose ${comparison.analysis.lowestTotalPayment.loan.bank} for savings of NPR ${comparison.savings.paymentVsWorst.toLocaleString()}`);
  
  console.log('');
  
  return comparison;
}

/**
 * Example 6: Comparison by Different Criteria
 */
export function comparisonByCriteriaExample() {
  console.log('🔍 Comparison by Different Criteria');
  console.log('===================================');
  
  const testLoans = [
    {
      loanAmount: 1000000,
      interestRate: 12,
      tenureYears: 5,
      bank: 'Bank A',
      description: 'Standard loan',
    },
    {
      loanAmount: 1000000,
      interestRate: 10,
      tenureYears: 5,
      bank: 'Bank B',
      description: 'Low rate loan',
    },
    {
      loanAmount: 1000000,
      interestRate: 15,
      tenureYears: 3,
      bank: 'Bank C',
      description: 'Short tenure loan',
    },
  ];

  console.log('Comparing by EMI (lowest first):');
  const emiComparison = compareByCriteria(testLoans, 'EMI');
  emiComparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.bank}: NPR ${loan.emi.toLocaleString()}/month`);
  });
  console.log('');

  console.log('Comparing by Total Interest (lowest first):');
  const interestComparison = compareByCriteria(testLoans, 'TOTAL_INTEREST');
  interestComparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.bank}: NPR ${loan.totalInterest.toLocaleString()}`);
  });
  console.log('');

  console.log('Comparing by Total Payment (lowest first):');
  const paymentComparison = compareByCriteria(testLoans, 'TOTAL_PAYMENT');
  paymentComparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.bank}: NPR ${loan.totalPayment.toLocaleString()}`);
  });
  console.log('');

  return {
    emiComparison,
    interestComparison,
    paymentComparison,
  };
}

/**
 * Example 7: Comparison Matrix Generation
 */
export function comparisonMatrixExample() {
  console.log('📊 Comparison Matrix Generation');
  console.log('===============================');
  
  const matrixLoans = [
    {
      loanAmount: 1000000,
      interestRate: 12,
      tenureYears: 5,
      bank: 'Bank A',
    },
    {
      loanAmount: 1000000,
      interestRate: 10,
      tenureYears: 5,
      bank: 'Bank B',
    },
    {
      loanAmount: 1000000,
      interestRate: 15,
      tenureYears: 3,
      bank: 'Bank C',
    },
  ];

  const matrixResult = calculateComparisonMatrix(matrixLoans);
  
  console.log('Comparison Matrix:');
  console.log('');
  
  matrixResult.matrix.forEach((row, index) => {
    console.log(`${row.loan.bank} compared to:`);
    row.comparisons.forEach((comparison, compIndex) => {
      if (index !== compIndex) {
        const otherBank = matrixResult.matrix[compIndex].loan.bank;
        const emiDiff = comparison.emiDifference;
        const interestDiff = comparison.interestDifference;
        const better = comparison.better === 'loan1' ? row.loan.bank : otherBank;
        
        console.log(`  vs ${otherBank}: EMI ${emiDiff > 0 ? '+' : ''}${emiDiff}, Interest ${interestDiff > 0 ? '+' : ''}${interestDiff}, Better: ${better}`);
      }
    });
    console.log('');
  });

  console.log('📈 Summary:');
  console.log(`Best overall: ${matrixResult.comparison.analysis.lowestTotalPayment.loan.bank}`);
  
  console.log('');
  
  return matrixResult;
}

/**
 * Example 8: Summary Generation for Dashboard
 */
export function summaryGenerationExample() {
  console.log('📈 Summary Generation for Dashboard');
  console.log('===================================');
  
  const summaryLoans = [
    {
      loanAmount: 1000000,
      interestRate: 12,
      tenureYears: 5,
      bank: 'Bank A',
    },
    {
      loanAmount: 1000000,
      interestRate: 10,
      tenureYears: 5,
      bank: 'Bank B',
    },
    {
      loanAmount: 1000000,
      interestRate: 15,
      tenureYears: 3,
      bank: 'Bank C',
    },
  ];

  const summary = generateComparisonSummary(summaryLoans);
  
  console.log('Dashboard Summary:');
  console.log('');
  console.log(`📊 Key Metrics:`);
  console.log(`   Total Loans Compared: ${summary.summary.totalLoans}`);
  console.log(`   Best EMI: NPR ${summary.summary.bestEMI.toLocaleString()}`);
  console.log(`   Lowest Interest: NPR ${summary.summary.lowestInterest.toLocaleString()}`);
  console.log(`   Lowest Total Payment: NPR ${summary.summary.lowestPayment.toLocaleString()}`);
  console.log('');
  
  console.log(`📈 Averages:`);
  console.log(`   Average EMI: NPR ${summary.summary.averageEMI.toLocaleString()}`);
  console.log(`   Average Interest Rate: ${summary.summary.averageInterest}%`);
  console.log(`   Average Total Payment: NPR ${summary.summary.averagePayment.toLocaleString()}`);
  console.log('');
  
  console.log(`💰 Potential Savings: NPR ${summary.summary.totalSavings.toLocaleString()}`);
  console.log('');
  
  console.log('🔍 Insights:');
  summary.insights.forEach(insight => {
    console.log(`   ${insight.title}: ${insight.description}`);
  });
  
  console.log('');
  
  return summary;
}

/**
 * Example 9: CSV Export for Analysis
 */
export function csvExportExample() {
  console.log('📄 CSV Export for Analysis');
  console.log('===========================');
  
  const exportLoans = [
    {
      loanAmount: 1000000,
      interestRate: 12,
      tenureYears: 5,
      bank: 'Nabil Bank',
      loanType: 'HOME',
      description: 'Home loan option 1',
      processingFee: 5000,
    },
    {
      loanAmount: 1000000,
      interestRate: 10,
      tenureYears: 5,
      bank: 'Global IME Bank',
      loanType: 'HOME',
      description: 'Home loan option 2',
      processingFee: 7500,
    },
    {
      loanAmount: 1000000,
      interestRate: 15,
      tenureYears: 3,
      bank: 'NIC Asia Bank',
      loanType: 'PERSONAL',
      description: 'Personal loan option',
      processingFee: 3000,
    },
  ];

  const csvData = exportComparisonToCSV(exportLoans);
  
  console.log('CSV Data (first 5 lines):');
  console.log('');
  
  const lines = csvData.split('\n');
  lines.slice(0, 5).forEach((line, index) => {
    console.log(`${index + 1}: ${line}`);
  });
  
  if (lines.length > 5) {
    console.log(`... (${lines.length - 5} more lines)`);
  }
  
  console.log('');
  console.log('📊 Export Statistics:');
  console.log(`   Total rows: ${lines.length}`);
  console.log(`   Headers: ${lines[0].split(',').length} columns`);
  console.log(`   Data rows: ${lines.length - 1}`);
  
  console.log('');
  
  return csvData;
}

/**
 * Example 10: Complex Scenario with Mixed Parameters
 */
export function complexScenarioExample() {
  console.log('🎯 Complex Scenario with Mixed Parameters');
  console.log('==========================================');
  
  const complexLoans = [
    {
      loanAmount: 5000000,
      interestRate: 9.5,
      tenureYears: 25,
      bank: 'Nabil Bank',
      loanType: 'HOME',
      description: 'Long-term home loan',
      downPayment: 1000000,
      processingFee: 15000,
    },
    {
      loanAmount: 3000000,
      interestRate: 11,
      tenureYears: 7,
      bank: 'Global IME Bank',
      loanType: 'VEHICLE',
      description: 'Car loan',
      downPayment: 600000,
      processingFee: 8000,
    },
    {
      loanAmount: 1000000,
      interestRate: 14,
      tenureYears: 3,
      bank: 'NIC Asia Bank',
      loanType: 'PERSONAL',
      description: 'Short-term personal loan',
      processingFee: 5000,
    },
    {
      loanAmount: 2000000,
      interestRate: 8,
      tenureYears: 10,
      bank: 'Prabhu Bank',
      loanType: 'EDUCATION',
      description: 'Education loan',
      processingFee: 2000,
    },
  ];

  const comparison = compareLoans(complexLoans, {
    sortBy: 'TOTAL_PAYMENT',
    includeAnalysis: true,
    includeRecommendations: true,
  });
  
  console.log('Complex Comparison Results:');
  console.log('');
  
  comparison.loans.forEach((loan, index) => {
    console.log(`${index + 1}. ${loan.loanType} - ${loan.description}`);
    console.log(`   Bank: ${loan.bank}`);
    console.log(`   Amount: NPR ${loan.loanAmount.toLocaleString()}`);
    console.log(`   Rate: ${loan.interestRate}%`);
    console.log(`   Tenure: ${loan.tenureYears} years`);
    console.log(`   EMI: NPR ${loan.emi.toLocaleString()}`);
    console.log(`   Total Payment: NPR ${loan.totalPayment.toLocaleString()}`);
    console.log(`   Effective Rate: ${loan.effectiveRate.toFixed(2)}%`);
    console.log('');
  });

  console.log('🎯 Recommendations:');
  comparison.recommendations.forEach((rec, index) => {
    console.log(`${index + 1}. ${rec.title}: ${rec.description}`);
  });
  
  console.log('');
  
  return comparison;
}

/**
 * Run all examples
 */
export function runAllExamples() {
  console.log('🏦 FinSathi AI - Loan Comparison Examples');
  console.log('========================================');
  console.log('Real-world examples for loan comparison engine');
  console.log('');
  
  basicHomeLoanComparison();
  personalLoanTenureComparison();
  multipleBanksComparison();
  vehicleLoanComparison();
  quickComparisonExample();
  comparisonByCriteriaExample();
  comparisonMatrixExample();
  summaryGenerationExample();
  csvExportExample();
  complexScenarioExample();
  
  console.log('📊 Examples completed! Use these as reference for loan comparison.');
}

// Export all example functions
export {
  basicHomeLoanComparison,
  personalLoanTenureComparison,
  multipleBanksComparison,
  vehicleLoanComparison,
  quickComparisonExample,
  comparisonByCriteriaExample,
  comparisonMatrixExample,
  summaryGenerationExample,
  csvExportExample,
  complexScenarioExample,
};

// Auto-run examples if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv) {
  runAllExamples();
}
