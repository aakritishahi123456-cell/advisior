/**
 * Test suite for FinSathi AI Loan Calculator
 * Comprehensive testing for EMI calculation functions
 */

import { 
  calculateLoanEMI, 
  calculateLoanWithSchedule, 
  quickEMI, 
  calculateAffordability,
  compareLoans,
  validateLoanParameters,
  benchmarkCalculation,
  LOAN_CONSTANTS 
} from './loanCalculator.js';

/**
 * Test runner for loan calculator functions
 */
class LoanCalculatorTests {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run all tests and return results
   */
  async runAllTests() {
    console.log('🧮 Running FinSathi AI Loan Calculator Tests...\n');
    
    await this.testBasicEMICalculation();
    await this.testEdgeCases();
    await this.testZeroInterestRate();
    await this.testInvalidInputs();
    await this.testAmortizationSchedule();
    await this.testAffordabilityCalculation();
    await this.testLoanComparison();
    await this.testParameterValidation();
    await this.testPerformance();
    
    this.printResults();
    return this.testResults;
  }

  /**
   * Test basic EMI calculation
   */
  async testBasicEMICalculation() {
    const testName = 'Basic EMI Calculation';
    
    try {
      // Test case 1: Standard loan
      const result1 = calculateLoanEMI({
        loanAmount: 1000000,
        interestRate: 12,
        tenureYears: 5,
      });
      
      this.assert(result1.emi > 0, 'EMI should be positive');
      this.assert(result1.totalInterest > 0, 'Total interest should be positive');
      this.assert(result1.totalPayment > result1.loanAmount, 'Total payment should exceed principal');
      
      // Test case 2: Different parameters
      const result2 = calculateLoanEMI({
        loanAmount: 500000,
        interestRate: 10,
        tenureYears: 3,
      });
      
      this.assert(result2.emi < result1.emi, 'Lower loan amount should result in lower EMI');
      
      this.addTestResult(testName, true, 'All basic EMI calculations passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test edge cases
   */
  async testEdgeCases() {
    const testName = 'Edge Cases';
    
    try {
      // Test very high interest rate
      const result1 = calculateLoanEMI({
        loanAmount: 100000,
        interestRate: 48,
        tenureYears: 1,
      });
      
      this.assert(result1.emi > 0, 'High interest rate should still produce valid EMI');
      
      // Test maximum tenure
      const result2 = calculateLoanEMI({
        loanAmount: 1000000,
        interestRate: 12,
        tenureYears: 30,
      });
      
      this.assert(result2.emi > 0, 'Maximum tenure should produce valid EMI');
      
      // Test minimum amount
      const result3 = calculateLoanEMI({
        loanAmount: 10000,
        interestRate: 8,
        tenureYears: 1,
      });
      
      this.assert(result3.emi > 0, 'Minimum amount should produce valid EMI');
      
      this.addTestResult(testName, true, 'All edge cases handled correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test zero interest rate
   */
  async testZeroInterestRate() {
    const testName = 'Zero Interest Rate';
    
    try {
      const result = calculateLoanEMI({
        loanAmount: 120000,
        interestRate: 0,
        tenureYears: 1,
      });
      
      // For zero interest, EMI should be principal / months
      const expectedEMI = 120000 / 12;
      this.assert(Math.abs(result.emi - expectedEMI) < 0.01, 'Zero interest EMI should be principal/months');
      this.assert(result.totalInterest === 0, 'Total interest should be zero for zero interest rate');
      this.assert(result.totalPayment === result.loanAmount, 'Total payment should equal principal for zero interest');
      
      this.addTestResult(testName, true, 'Zero interest rate handled correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test invalid inputs
   */
  async testInvalidInputs() {
    const testName = 'Invalid Inputs';
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test negative loan amount
    totalTests++;
    try {
      calculateLoanEMI({ loanAmount: -1000, interestRate: 12, tenureYears: 5 });
    } catch (error) {
      if (error.message.includes('greater than 0')) passedTests++;
    }
    
    // Test negative interest rate
    totalTests++;
    try {
      calculateLoanEMI({ loanAmount: 100000, interestRate: -5, tenureYears: 5 });
    } catch (error) {
      if (error.message.includes('negative')) passedTests++;
    }
    
    // Test zero tenure
    totalTests++;
    try {
      calculateLoanEMI({ loanAmount: 100000, interestRate: 12, tenureYears: 0 });
    } catch (error) {
      if (error.message.includes('greater than 0')) passedTests++;
    }
    
    // Test non-number inputs
    totalTests++;
    try {
      calculateLoanEMI({ loanAmount: 'invalid', interestRate: 12, tenureYears: 5 });
    } catch (error) {
      if (error.message.includes('numbers')) passedTests++;
    }
    
    // Test excessive amounts
    totalTests++;
    try {
      calculateLoanEMI({ loanAmount: 200000000, interestRate: 12, tenureYears: 5 });
    } catch (error) {
      if (error.message.includes('maximum limit')) passedTests++;
    }
    
    const success = passedTests === totalTests;
    this.addTestResult(testName, success, `${passedTests}/${totalTests} invalid input tests passed`);
  }

  /**
   * Test amortization schedule
   */
  async testAmortizationSchedule() {
    const testName = 'Amortization Schedule';
    
    try {
      const result = calculateLoanWithSchedule({
        loanAmount: 120000,
        interestRate: 12,
        tenureYears: 1,
      });
      
      this.assert(result.schedule.length === 12, 'Schedule should have 12 months for 1-year loan');
      this.assert(result.schedule[0].openingBalance === 120000, 'First month opening balance should be principal');
      this.assert(result.schedule[11].closingBalance === 0, 'Last month closing balance should be zero');
      
      // Verify that principal + interest = EMI for each month
      let allMonthsValid = true;
      for (const month of result.schedule) {
        const sum = month.principalPayment + month.interestPayment;
        if (Math.abs(sum - month.emi) > 0.01) {
          allMonthsValid = false;
          break;
        }
      }
      
      this.assert(allMonthsValid, 'Principal + interest should equal EMI for each month');
      
      this.addTestResult(testName, true, 'Amortization schedule generated correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test affordability calculation
   */
  async testAffordabilityCalculation() {
    const testName = 'Affordability Calculation';
    
    try {
      const result = calculateAffordability(50000, 5000, 0.4);
      
      this.assert(result.availableEMI > 0, 'Available EMI should be positive');
      this.assert(result.maxLoanAmount > 0, 'Max loan amount should be positive');
      this.assert(result.currentDTI === 0.1, 'Current DTI should be 0.1 (5000/50000)');
      
      // Test with high existing EMIs
      const result2 = calculateAffordability(30000, 20000, 0.5);
      this.assert(result2.availableEMI < result.availableEMI, 'Higher existing EMIs should reduce available EMI');
      
      this.addTestResult(testName, true, 'Affordability calculation working correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test loan comparison
   */
  async testLoanComparison() {
    const testName = 'Loan Comparison';
    
    try {
      const loans = [
        { amount: 1000000, rate: 12, tenure: 5, name: 'Bank A' },
        { amount: 1000000, rate: 10, tenure: 5, name: 'Bank B' },
        { amount: 1000000, rate: 14, tenure: 5, name: 'Bank C' },
      ];
      
      const results = compareLoans(loans);
      
      this.assert(results.length === 3, 'Should return results for all loans');
      this.assert(results[0].rank === 1, 'First result should be rank 1');
      this.assert(results[0].isBestOption, 'First result should be marked as best option');
      this.assert(results[0].name === 'Bank B', 'Bank B should be best (lowest rate)');
      
      this.addTestResult(testName, true, 'Loan comparison working correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test parameter validation
   */
  async testParameterValidation() {
    const testName = 'Parameter Validation';
    
    try {
      const result1 = validateLoanParameters({
        loanAmount: 5000,
        interestRate: 12,
        tenureYears: 5,
      });
      
      this.assert(result1.warnings.length > 0, 'Low amount should generate warning');
      
      const result2 = validateLoanParameters({
        loanAmount: 1000000,
        interestRate: 25,
        tenureYears: 5,
      });
      
      this.assert(result2.warnings.length > 0, 'High rate should generate warning');
      
      this.addTestResult(testName, true, 'Parameter validation working correctly');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test performance
   */
  async testPerformance() {
    const testName = 'Performance Test';
    
    try {
      const benchmark = benchmarkCalculation();
      
      this.assert(benchmark.iterations === 10000, 'Should run 10000 iterations');
      this.assert(benchmark.isUnder1ms, 'Average time should be under 1ms');
      
      console.log(`   ⚡ Performance: ${benchmark.averageTime.toFixed(4)}ms per calculation`);
      
      this.addTestResult(testName, true, `Performance: ${benchmark.averageTime.toFixed(4)}ms per calculation`);
      
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
    console.log('\n📊 Test Results Summary:');
    console.log('========================');
    
    const passed = this.testResults.filter(r => r.passed).length;
    const total = this.testResults.length;
    
    this.testResults.forEach(result => {
      const status = result.passed ? '✅' : '❌';
      console.log(`${status} ${result.test}: ${result.details}`);
    });
    
    console.log('\n========================');
    console.log(`Total: ${total} tests`);
    console.log(`Passed: ${passed} tests`);
    console.log(`Failed: ${total - passed} tests`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (passed === total) {
      console.log('\n🎉 All tests passed! Loan calculator is ready for production.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the results above.');
    }
  }
}

// Export test runner
export { LoanCalculatorTests };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv) {
  const testRunner = new LoanCalculatorTests();
  testRunner.runAllTests().catch(console.error);
}
