/**
 * FinSathi AI - Risk Scoring System Tests
 * Comprehensive testing for loan risk assessment
 */

import { 
  calculateLoanRisk, 
  quickRiskAssessment, 
  batchRiskAssessment, 
  analyzeRiskTrend 
} from './riskScoring';

/**
 * Test runner for risk scoring system
 */
class RiskScoringTestRunner {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run all risk scoring tests
   */
  async runAllTests() {
    console.log('🔍 Running Risk Scoring System Tests...\n');
    
    await this.testBasicRiskAssessment();
    await this.testRiskLevels();
    await this.testEdgeCases();
    await this.testRiskFactors();
    await this.testRecommendations();
    await this.testQuickAssessment();
    await this.testBatchAssessment();
    await this.testTrendAnalysis();
    await this.testNepaliMarketContext();
    
    this.printResults();
    return this.testResults;
  }

  /**
   * Test basic risk assessment functionality
   */
  async testBasicRiskAssessment() {
    const testName = 'Basic Risk Assessment';
    
    try {
      // Test low risk scenario
      const lowRiskResult = calculateLoanRisk({
        emi: 15000,
        monthlyIncome: 100000,
      });
      
      this.assert(lowRiskResult.riskLevel === 'LOW', 'Low risk scenario should return LOW risk level');
      this.assert(lowRiskResult.debtBurdenRatio === 15, 'Should calculate correct debt burden ratio');
      this.assert(lowRiskResult.riskScore < 30, 'Low risk should have low risk score');
      
      // Test moderate risk scenario
      const moderateRiskResult = calculateLoanRisk({
        emi: 30000,
        monthlyIncome: 100000,
      });
      
      this.assert(moderateRiskResult.riskLevel === 'MODERATE', 'Moderate risk scenario should return MODERATE risk level');
      this.assert(moderateRiskResult.debtBurdenRatio === 30, 'Should calculate correct debt burden ratio');
      this.assert(moderateRiskResult.riskScore >= 30 && moderateRiskResult.riskScore < 60, 'Moderate risk should have medium risk score');
      
      // Test high risk scenario
      const highRiskResult = calculateLoanRisk({
        emi: 40000,
        monthlyIncome: 100000,
      });
      
      this.assert(highRiskResult.riskLevel === 'HIGH', 'High risk scenario should return HIGH risk level');
      this.assert(highRiskResult.debtBurdenRatio === 40, 'Should calculate correct debt burden ratio');
      this.assert(highRiskResult.riskScore >= 60, 'High risk should have high risk score');

      this.addTestResult(testName, true, 'All basic risk assessment tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test risk level determination
   */
  async testRiskLevels() {
    const testName = 'Risk Level Determination';
    
    try {
      // Test boundary values
      const boundaryTests = [
        { emi: 19999, monthlyIncome: 100000, expected: 'LOW' },      // 19.99%
        { emi: 20000, monthlyIncome: 100000, expected: 'LOW' },      // 20%
        { emi: 20001, monthlyIncome: 100000, expected: 'MODERATE' },  // 20.01%
        { emi: 34999, monthlyIncome: 100000, expected: 'MODERATE' },  // 34.99%
        { emi: 35000, monthlyIncome: 100000, expected: 'MODERATE' },  // 35%
        { emi: 35001, monthlyIncome: 100000, expected: 'HIGH' },      // 35.01%
      ];

      boundaryTests.forEach((test, index) => {
        const result = calculateLoanRisk({
          emi: test.emi,
          monthlyIncome: test.monthlyIncome,
        });
        
        this.assert(
          result.riskLevel === test.expected,
          `Boundary test ${index + 1}: Expected ${test.expected}, got ${result.riskLevel}`
        );
      });

      this.addTestResult(testName, true, 'All risk level tests passed');
      
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
      // Test invalid inputs
      const invalidInputs = [
        { emi: -1000, monthlyIncome: 50000 },    // Negative EMI
        { emi: 1000, monthlyIncome: -50000 },     // Negative income
        { emi: 0, monthlyIncome: 50000 },          // Zero EMI
        { emi: 1000, monthlyIncome: 0 },           // Zero income
        { emi: 60000, monthlyIncome: 50000 },       // EMI > income
      ];

      invalidInputs.forEach((input, index) => {
        try {
          calculateLoanRisk(input);
          this.assert(false, `Invalid input ${index + 1} should throw error`);
        } catch (error) {
          this.assert(error.message.includes('must be positive') || 
                     error.message.includes('cannot exceed'), 
                     `Invalid input ${index + 1} should throw specific error`);
        }
      });

      // Test boundary conditions
      const boundaryTests = [
        { emi: 1, monthlyIncome: 100000 },         // Very small EMI
        { emi: 49999, monthlyIncome: 50000 },       // Very high EMI (just under income)
        { emi: 10000, monthlyIncome: 10001 },      // Very small income
      ];

      boundaryTests.forEach((input, index) => {
        const result = calculateLoanRisk(input);
        this.assert(result.riskLevel, `Boundary test ${index + 1} should return risk level`);
        this.assert(result.debtBurdenRatio >= 0, `Boundary test ${index + 1} should have valid ratio`);
      });

      this.addTestResult(testName, true, 'All edge case tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test risk factors calculation
   */
  async testRiskFactors() {
    const testName = 'Risk Factors Calculation';
    
    try {
      // Test with additional risk factors
      const result = calculateLoanRisk({
        emi: 25000,
        monthlyIncome: 100000,
        existingEMIs: 5000,
        loanAmount: 1000000,
        interestRate: 12,
        tenureYears: 5,
        creditScore: 650,
        employmentStability: 'STABLE',
        age: 30,
        dependents: 2,
        otherMonthlyExpenses: 15000,
      });

      this.assert(result.riskFactors, 'Should include risk factors');
      this.assert(result.riskFactors.debtBurdenRatio === 30, 'Should calculate debt burden ratio');
      this.assert(result.riskFactors.existingDebtRatio === 5, 'Should calculate existing debt ratio');
      this.assert(result.riskFactors.creditRisk === 'FAIR', 'Should assess credit risk');
      this.assert(result.riskFactors.employmentRisk === 'LOW', 'Should assess employment risk');
      this.assert(result.riskFactors.ageRisk === 'LOW', 'Should assess age risk');
      this.assert(result.riskFactors.dependencyRisk === 'MEDIUM', 'Should assess dependency risk');
      
      // Test risk factor scoring
      this.assert(typeof result.riskFactors.overallRiskScore === 'number', 
                   'Should calculate overall risk score');
      this.assert(result.riskFactors.overallRiskScore >= 0 && result.riskFactors.overallRiskScore <= 100,
                   'Risk score should be between 0 and 100');

      this.addTestResult(testName, true, 'All risk factor tests passed');
      
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
      // Test low risk recommendations
      const lowRiskResult = calculateLoanRisk({
        emi: 15000,
        monthlyIncome: 100000,
      }, { includeRecommendations: true });
      
      this.assert(Array.isArray(lowRiskResult.recommendations), 'Should return array of recommendations');
      this.assert(lowRiskResult.recommendations.length > 0, 'Should generate recommendations for low risk');
      
      const hasApprovalRecommendation = lowRiskResult.recommendations.some(
        rec => rec.type === 'APPROVAL'
      );
      this.assert(hasApprovalRecommendation, 'Low risk should include approval recommendation');

      // Test high risk recommendations
      const highRiskResult = calculateLoanRisk({
        emi: 40000,
        monthlyIncome: 100000,
      }, { includeRecommendations: true });
      
      const hasRejectionRecommendation = highRiskResult.recommendations.some(
        rec => rec.type === 'REJECTION'
      );
      this.assert(hasRejectionRecommendation, 'High risk should include rejection recommendation');

      // Test moderate risk recommendations
      const moderateRiskResult = calculateLoanRisk({
        emi: 30000,
        monthlyIncome: 100000,
      }, { includeRecommendations: true });
      
      const hasCautionRecommendation = moderateRiskResult.recommendations.some(
        rec => rec.type === 'CAUTION'
      );
      this.assert(hasCautionRecommendation, 'Moderate risk should include caution recommendation');

      this.addTestResult(testName, true, 'All recommendation tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test quick assessment functionality
   */
  async testQuickAssessment() {
    const testName = 'Quick Assessment';
    
    try {
      // Test quick assessment
      const quickResult = quickRiskAssessment(25000, 100000);
      
      this.assert(quickResult.riskLevel, 'Should return risk level');
      this.assert(quickResult.debtBurdenRatio === 25, 'Should calculate correct debt burden ratio');
      this.assert(quickResult.explanation, 'Should provide explanation');
      this.assert(quickResult.recommendation, 'Should provide recommendation');
      
      // Test quick assessment with different scenarios
      const scenarios = [
        { emi: 15000, income: 100000, expected: 'LOW' },
        { emi: 30000, income: 100000, expected: 'MODERATE' },
        { emi: 40000, income: 100000, expected: 'HIGH' },
      ];

      scenarios.forEach((scenario, index) => {
        const result = quickRiskAssessment(scenario.emi, scenario.income);
        this.assert(
          result.riskLevel === scenario.expected,
          `Quick assessment scenario ${index + 1}: Expected ${scenario.expected}, got ${result.riskLevel}`
        );
      });

      this.addTestResult(testName, true, 'All quick assessment tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test batch assessment functionality
   */
  async testBatchAssessment() {
    const testName = 'Batch Assessment';
    
    try {
      // Test batch assessment
      const applications = [
        { emi: 15000, monthlyIncome: 100000 },
        { emi: 30000, monthlyIncome: 100000 },
        { emi: 40000, monthlyIncome: 100000 },
      ];

      const batchResult = batchRiskAssessment(applications);
      
      this.assert(Array.isArray(batchResult), 'Should return array of results');
      this.assert(batchResult.length === 3, 'Should return result for each application');
      
      batchResult.forEach((result, index) => {
        this.assert(result.riskLevel, `Application ${index + 1} should have risk level`);
        this.assert(result.applicationIndex === index, `Application ${index + 1} should have correct index`);
      });

      // Test batch assessment with invalid application
      const mixedApplications = [
        { emi: 15000, monthlyIncome: 100000 },
        { emi: -1000, monthlyIncome: 100000 }, // Invalid
        { emi: 30000, monthlyIncome: 100000 },
      ];

      const mixedResult = batchRiskAssessment(mixedApplications);
      
      this.assert(mixedResult.length === 3, 'Should return result for each application');
      this.assert(mixedResult[1].error, 'Invalid application should return error');
      this.assert(mixedResult[1].riskLevel === 'ERROR', 'Invalid application should have ERROR risk level');

      this.addTestResult(testName, true, 'All batch assessment tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test trend analysis functionality
   */
  async testTrendAnalysis() {
    const testName = 'Trend Analysis';
    
    try {
      // Create historical data
      const historicalData = [
        {
          riskLevel: { level: 'LOW' },
          debtBurdenRatio: 15,
          riskScore: 20,
          assessment: { timestamp: '2024-01-01T00:00:00Z' },
        },
        {
          riskLevel: { level: 'MODERATE' },
          debtBurdenRatio: 25,
          riskScore: 40,
          assessment: { timestamp: '2024-02-01T00:00:00Z' },
        },
        {
          riskLevel: { level: 'MODERATE' },
          debtBurdenRatio: 30,
          riskScore: 50,
          assessment: { timestamp: '2024-03-01T00:00:00Z' },
        },
      ];

      const trendResult = analyzeRiskTrend(historicalData);
      
      this.assert(trendResult.trends, 'Should include trend analysis');
      this.assert(trendResult.summary, 'Should include trend summary');
      this.assert(trendResult.recommendation, 'Should include trend recommendation');
      
      // Test trend calculation
      this.assert(typeof trendResult.trends.debtBurdenTrend === 'string', 
                   'Should calculate debt burden trend');
      this.assert(typeof trendResult.trends.riskScoreTrend === 'string', 
                   'Should calculate risk score trend');
      this.assert(typeof trendResult.trends.riskLevelTrend === 'string', 
                   'Should calculate risk level trend');

      this.addTestResult(testName, true, 'All trend analysis tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test Nepali market context
   */
  async testNepaliMarketContext() {
    const testName = 'Nepali Market Context';
    
    try {
      // Test with typical Nepali market scenarios
      const nepaliScenarios = [
        {
          emi: 20000,
          monthlyIncome: 50000,    // Average Nepali income
          loanType: 'HOME',
          description: 'Home loan for average income',
        },
        {
          emi: 15000,
          monthlyIncome: 50000,    // Personal loan
          loanType: 'PERSONAL',
          description: 'Personal loan for average income',
        },
        {
          emi: 10000,
          monthlyIncome: 50000,    // Education loan
          loanType: 'EDUCATION',
          description: 'Education loan for average income',
        },
      ];

      nepaliScenarios.forEach((scenario, index) => {
        const result = calculateLoanRisk(scenario);
        
        this.assert(result.riskLevel, `Nepali scenario ${index + 1} should have risk level`);
        this.assert(result.analysis?.marketContext, `Nepali scenario ${index + 1} should include market context`);
        
        if (result.analysis?.marketContext) {
          this.assert(result.analysis.marketContext.nepaliMarketAverage === 25, 
                       'Should include Nepali market average');
          this.assert(['BELOW_AVERAGE', 'ABOVE_AVERAGE'].includes(result.analysis.marketContext.marketPosition),
                       'Should include market position');
        }
      });

      this.addTestResult(testName, true, 'All Nepali market context tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test comprehensive risk scenarios
   */
  async testComprehensiveScenarios() {
    const testName = 'Comprehensive Risk Scenarios';
    
    try {
      // Test comprehensive scenario with all factors
      const comprehensiveResult = calculateLoanRisk({
        emi: 35000,
        monthlyIncome: 100000,
        existingEMIs: 10000,
        loanAmount: 2000000,
        interestRate: 14,
        tenureYears: 7,
        loanType: 'PERSONAL',
        creditScore: 600,
        employmentStability: 'SEMI_STABLE',
        age: 25,
        dependents: 3,
        otherMonthlyExpenses: 20000,
      }, {
        includeRecommendations: true,
        includeDetailedAnalysis: true,
      });

      this.assert(comprehensiveResult.riskLevel, 'Should determine risk level');
      this.assert(comprehensiveResult.riskScore, 'Should calculate risk score');
      this.assert(comprehensiveResult.riskFactors, 'Should include risk factors');
      this.assert(comprehensiveResult.analysis, 'Should include detailed analysis');
      this.assert(comprehensiveResult.recommendations, 'Should include recommendations');
      
      // Check detailed analysis components
      const analysis = comprehensiveResult.analysis;
      this.assert(analysis.debtBurdenAnalysis, 'Should include debt burden analysis');
      this.assert(analysis.cashFlowAnalysis, 'Should include cash flow analysis');
      this.assert(analysis.riskFactorAnalysis, 'Should include risk factor analysis');
      this.assert(analysis.scoreAnalysis, 'Should include score analysis');
      this.assert(analysis.marketContext, 'Should include market context');

      this.addTestResult(testName, true, 'All comprehensive scenario tests passed');
      
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
    console.log('\n📊 Risk Scoring Test Results Summary:');
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
      console.log('\n🎉 All risk scoring tests passed! System is ready for production.');
    } else {
      console.log('\n⚠️  Some risk scoring tests failed. Please review the results above.');
    }
  }
}

// Export test runner
export { RiskScoringTestRunner };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv) {
  const testRunner = new RiskScoringTestRunner();
  testRunner.runAllTests().catch(console.error);
}
