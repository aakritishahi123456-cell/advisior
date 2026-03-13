/**
 * FinSathi AI - Loan Comparison Engine Tests
 * Comprehensive testing for loan comparison functionality
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
 * Test runner for loan comparison engine
 */
class LoanComparisonTestRunner {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run all comparison tests
   */
  async runAllTests() {
    console.log('🔍 Running Loan Comparison Engine Tests...\n');
    
    await this.testBasicComparison();
    await this.testEdgeCases();
    await this.testSortingCriteria();
    await this.testAnalysis();
    await this.testRecommendations();
    await this.testQuickComparison();
    await this.testComparisonMatrix();
    await this.testCSVExport();
    await this.testSummaryGeneration();
    
    this.printResults();
    return this.testResults;
  }

  /**
   * Test basic loan comparison functionality
   */
  async testBasicComparison() {
    const testName = 'Basic Loan Comparison';
    
    try {
      // Test with valid loan options
      const validLoans = [
        {
          loanAmount: 1000000,
          interestRate: 12,
          tenureYears: 5,
          bank: 'Nabil Bank',
          loanType: 'HOME',
          description: 'Home loan for apartment',
        },
        {
          loanAmount: 1000000,
          interestRate: 10,
          tenureYears: 5,
          bank: 'Global IME',
          loanType: 'HOME',
          description: 'Home loan with lower rate',
        },
        {
          loanAmount: 1000000,
          interestRate: 15,
          tenureYears: 5,
          bank: 'NIC Asia',
          loanType: 'HOME',
          description: 'Home loan with higher rate',
        },
      ];

      const result = compareLoans(validLoans);
      
      this.assert(result.loans.length === 3, 'Should return all 3 loans');
      this.assert(result.analysis.bestEMI, 'Should identify best EMI option');
      this.assert(result.analysis.lowestInterestBurden, 'Should identify lowest interest');
      this.assert(result.lowestTotalPayment, 'Should identify lowest total payment');
      
      // Check sorting (should be by total payment by default)
      this.assert(result.loans[0].totalPayment <= result.loans[1].totalPayment, 'Should be sorted by total payment');
      this.assert(result.loans[1].totalPayment <= result.loans[2].totalPayment, 'Should be sorted by total payment');

      this.addTestResult(testName, true, 'All basic comparison tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test edge cases and error handling
   */
  async testEdgeCases() {
    const testName = 'Edge Cases and Error Handling';
    
    try {
      // Test empty array
      try {
        compareLoans([]);
        this.assert(false, 'Should throw error for empty array');
      } catch (error) {
        this.assert(error.message.includes('At least one loan option'), 'Should throw specific error');
      }

      // Test non-array input
      try {
        compareLoans('invalid');
        this.assert(false, 'Should throw error for non-array input');
      } catch (error) {
        this.assert(error.message.includes('must be an array'), 'Should throw specific error');
      }

      // Test too many loans
      try {
        compareLoans(new Array(11).fill({ loanAmount: 1000000, interestRate: 12, tenureYears: 5 }));
        this.assert(false, 'Should throw error for too many loans');
      } catch (error) {
        this.assert(error.message.includes('Maximum 10 loan options'), 'Should throw specific error');
      }

      // Test invalid loan data
      try {
        compareLoans([
          { loanAmount: -1000, interestRate: 12, tenureYears: 5 }, // Negative amount
        ]);
        this.assert(false, 'Should throw error for negative amount');
      } catch (error) {
        this.assert(error.message.includes('must be greater than 0'), 'Should throw specific error');
      }

      // Test zero interest rate
      const zeroInterestLoans = [
        { loanAmount: 1000000, interestRate: 0, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
      ];
      
      const zeroInterestResult = compareLoans(zeroInterestLoans);
      this.assert(zeroInterestResult.loans[0].emi === 16666.67, 'Should handle zero interest correctly');
      this.assert(zeroInterestResult.loans[0].totalInterest === 0, 'Zero interest should have zero total interest');

      this.addTestResult(testName, true, 'All edge case tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test different sorting criteria
   */
  async testSortingCriteria() {
    const testName = 'Sorting Criteria';
    
    try {
      const testLoans = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
      ];

      // Test EMI sorting
      const emiResult = compareByCriteria(testLoans, 'EMI');
      this.assert(emiResult.loans[0].interestRate === 10, 'Should sort by EMI (lowest rate first)');
      
      // Test interest sorting
      const interestResult = compareByCriteria(testLoans, 'TOTAL_INTEREST');
      this.assert(interestResult.loans[0].interestRate === 10, 'Should sort by total interest');
      
      // Test payment sorting (default)
      const paymentResult = compareByCriteria(testLoans, 'TOTAL_PAYMENT');
      this.assert(paymentResult.loans[0].interestRate === 10, 'Should sort by total payment by default');

      // Test effective rate sorting
      const effectiveRateResult = compareByCriteria(testLoans, 'EFFECTIVE_RATE');
      this.assert(effectiveRateResult.loans[0].interestRate === 10, 'Should sort by effective rate');

      this.addTestResult(testName, true, 'All sorting criteria tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test analysis calculation
   */
  async testAnalysis() {
    const testName = 'Analysis Calculation';
    
    try {
      const testLoans = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
      ];

      const result = compareLoans(testLoans);
      
      // Check analysis structure
      this.assert(result.analysis, 'Should include analysis object');
      this.assert(result.analysis.bestEMI, 'Should identify best EMI option');
      this.assert(result.analysis.lowestInterestBurden, 'Should identify lowest interest');
      this.assert(result.analysis.lowestTotalPayment, 'Should identify lowest total payment');
      
      // Check averages calculation
      this.assert(result.analysis.averages.emi > 0, 'Should calculate average EMI');
      this.assert(result.analysis.averages.totalInterest > 0, 'Should calculate average interest');
      this.assert(result.analysis.averages.totalPayment > 0, 'Should calculate average payment');
      
      // Check ranges calculation
      this.assert(result.analysis.ranges.emi, 'Should calculate EMI range');
      this.assert(result.analysis.ranges.totalInterest, 'Should calculate interest range');
      this.assert(result.analysis.ranges.totalPayment, 'Should calculate payment range');

      this.addTestResult(testName, true, 'All analysis tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test recommendation generation
   */
  async testRecommendations() {
    const testName = 'Recommendation Generation';
    
    try {
      const testLoans = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
      ];

      const result = compareLoans(testLoans, {
        includeRecommendations: true,
      });
      
      // Check recommendations structure
      this.assert(Array.isArray(result.recommendations), 'Should return array of recommendations');
      
      // Check for required recommendation types
      const hasLowestEMI = result.recommendations.some(rec => rec.type === 'LOWEST_EMI');
      const hasLowestInterest = result.recommendations.some(rec => rec.type === 'LOWEST_INTEREST');
      const hasLowestTotal = result.recommendations.some(rec => rec.type === 'LOWEST_TOTAL');
      
      this.assert(hasLowestEMI, 'Should include lowest EMI recommendation');
      this.assert(hasLowestInterest, 'Should include lowest interest recommendation');
      this.assert(hasLowestTotal, 'Should include lowest total payment recommendation');

      this.addTestResult(testName, true, 'All recommendation tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test quick comparison functionality
   */
  async testQuickComparison() {
    const testName = 'Quick Comparison';
    
    try {
      // Test with 2 loans
      const twoLoans = [
        { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
        { loanAmount: 500000, interestRate: 10, tenureYears: 3 },
      ];
      
      const twoResult = quickCompare(twoLoans);
      this.assert(twoResult.loans.length === 2, 'Should handle 2 loans');
      
      // Test with 3 loans
      const threeLoans = [
        { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
        { loanAmount: 500000, interestRate: 10, tenureYears: 3 },
        { loanAmount: 500000, interestRate: 15, tenureYears: 3 },
      ];
      
      const threeResult = quickCompare(threeLoans);
      this.assert(threeResult.loans.length === 3, 'Should handle 3 loans');
      
      // Test with too many loans
      try {
        quickCompare(new Array(4).fill({ loanAmount: 500000, interestRate: 12, tenureYears: 3 }));
        this.assert(false, 'Should throw error for too many loans');
      } catch (error) {
        this.assert(error.message.includes('Maximum 3 loan options'), 'Should throw specific error');
      }

      this.addTestResult(testName, true, 'All quick comparison tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test comparison matrix generation
   */
  async testComparisonMatrix() {
    const testName = 'Comparison Matrix';
    
    try {
      const testLoans = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
      ];

      const matrixResult = calculateComparisonMatrix(testLoans);
      
      // Check matrix structure
      this.assert(matrixResult.matrix, 'Should return comparison matrix');
      this.assert(matrixResult.matrix.length === 3, 'Should have 3 rows');
      this.assert(matrixResult.matrix[0].comparisons.length === 3, 'Each row should have 3 comparisons');
      
      // Check comparison data
      const comparison_0_1 = matrixResult.matrix[0].comparisons[1];
      const comparison_0_2 = matrixResult.matrix[0].comparisons[2];
      
      this.assert(typeof comparison_0_1.emiDifference === 'number', 'Should calculate EMI difference');
      this.assert(typeof comparison_0_1.interestDifference === 'number', 'Should calculate interest difference');
      this.assert(typeof comparison_0_1.paymentDifference === 'number', 'Should calculate payment difference');
      
      // Check better/worse indicators
      this.assert(['loan1', 'loan2', 'equal'].includes(comparison_0_1.better), 'Should indicate which loan is better');

      this.addTestResult(testName, true, 'All comparison matrix tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test CSV export functionality
   */
  async testCSVExport() {
    const testName = 'CSV Export';
    
    try {
      const testLoans = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5, bank: 'Nabil Bank' },
        { loanAmount: 1000000, interestRate: 10, tenureYears: 5, bank: 'Global IME' },
        { loanAmount: 1000000, interestRate: 15, tenureYears: 5, bank: 'NIC Asia' },
      ];

      const csvResult = exportComparisonToCSV(testLoans);
      
      // Check CSV format
      const lines = csvResult.split('\n');
      this.assert(lines.length >= 2, 'CSV should have at least header and one data row');
      
      // Check headers
      const headers = lines[0].split(',');
      this.assert(headers.includes('EMI'), 'CSV should include EMI header');
      this.assert(headers.includes('Total Interest'), 'CSV should include Total Interest header');
      this.assert(headers.includes('Total Payment'), 'CSV should include Total Payment header');
      
      // Check data rows
      const dataRow = lines[1].split(',');
      this.assert(dataRow.length === headers.length, 'Data row should match header count');

      this.addTestResult(testName, true, 'All CSV export tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test summary generation
   */
  async testSummaryGeneration() {
    const testName = 'Summary Generation';
    
    try {
      const testLoans = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
      ];

      const summaryResult = generateComparisonSummary(testLoans);
      
      // Check summary structure
      this.assert(summaryResult.summary, 'Should return summary object');
      this.assert(summaryResult.summary.totalLoans === 3, 'Should count total loans');
      
      // Check key metrics
      this.assert(summaryResult.summary.bestEMI > 0, 'Should identify best EMI');
      this.assert(summaryResult.summary.lowestInterest > 0, 'Should identify lowest interest');
      this.assert(summaryResult.summary.lowestPayment > 0, 'Should identify lowest payment');
      
      // Check averages
      this.assert(summaryResult.summary.averageEMI > 0, 'Should calculate average EMI');
      this.assert(summaryResult.summary.averageInterest > 0, 'Should calculate average interest');
      this.assert(summaryResult.summary.averagePayment > 0, 'Should calculate average payment');
      
      // Check insights
      this.assert(Array.isArray(summaryResult.insights), 'Should return array of insights');
      
      this.addTestResult(testName, true, 'All summary generation tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Helper assertion method
   */
  assert(condition, message) {
    if (!condition) {
      throw new Error(`Assertion failed: ${message}`);
    }
  }

  /**
   * Add test result
   */
  addTestResult(testName, passed, details) {
    this.testResults.push({
      test: testName,
      passed,
      details,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Print test results
   */
  printResults() {
    console.log('\n📊 Loan Comparison Test Results Summary:');
    console.log('====================================');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.details}`);
    });
    
    console.log('\n====================================');
    console.log(`Total: ${total} tests`);
    console.log(`Passed: ${passed} tests`);
    console.log(`Failed: ${total - passed} tests`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('\n🎉 All loan comparison tests passed! Engine is ready for production.');
    } else {
      console.log('\n⚠️  Some comparison tests failed. Please review the results above.');
    }
  }
}

// Export test runner
export { LoanComparisonTestRunner };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv) {
  const testRunner = new LoanComparisonTestRunner();
  testRunner.runAllTests().catch(console.error);
}
