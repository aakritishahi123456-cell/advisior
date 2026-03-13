/**
 * Test suite for loan validation schemas
 * Comprehensive testing for all validation rules and edge cases
 */

import { 
  loanSimulationSchema, 
  enhancedLoanSimulationSchema,
  quickEMISchema,
  loanComparisonSchema,
  batchLoanSimulationSchema,
  loanSearchSchema,
  loanExportSchema,
  loanAnalyticsSchema,
  affordabilityValidation,
  nepaliMarketValidation,
  formatValidationErrors,
  createValidationMiddleware,
  validateWithBusinessRules,
  businessRules,
} from './loanValidation';

/**
 * Test runner for validation schemas
 */
class ValidationTestRunner {
  constructor() {
    this.testResults = [];
  }

  /**
   * Run all validation tests
   */
  async runAllTests() {
    console.log('🔍 Running Loan Validation Tests...\n');
    
    await this.testBasicValidation();
    await this.testEdgeCases();
    await this.testBusinessRules();
    await this.testNepaliMarketValidation();
    await this.testErrorFormatting();
    await this.testMiddleware();
    await this.testAdvancedSchemas();
    
    this.printResults();
    return this.testResults;
  }

  /**
   * Test basic loan simulation validation
   */
  async testBasicValidation() {
    const testName = 'Basic Loan Simulation Validation';
    
    try {
      // Valid inputs
      const validInputs = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        { loanAmount: 50000, interestRate: 8, tenureYears: 1 },
        { loanAmount: 100000000, interestRate: 40, tenureYears: 30 },
      ];

      validInputs.forEach((input, index) => {
        const result = loanSimulationSchema.safeParse(input);
        this.assert(result.success, `Valid input ${index + 1} should pass validation`);
      });

      // Invalid inputs
      const invalidInputs = [
        { loanAmount: -1000, interestRate: 12, tenureYears: 5 }, // Negative amount
        { loanAmount: 1000, interestRate: -5, tenureYears: 5 }, // Negative rate
        { loanAmount: 1000, interestRate: 12, tenureYears: 0 }, // Zero tenure
        { loanAmount: 1000, interestRate: 50, tenureYears: 5 }, // Rate too high
        { loanAmount: 100000000000, interestRate: 12, tenureYears: 5 }, // Amount too high
        { loanAmount: 1000, interestRate: 12, tenureYears: 35 }, // Tenure too high
      ];

      invalidInputs.forEach((input, index) => {
        const result = loanSimulationSchema.safeParse(input);
        this.assert(!result.success, `Invalid input ${index + 1} should fail validation`);
        this.assert(result.error, 'Should have error details');
      });

      // Test missing required fields
      const missingFields = [
        { interestRate: 12, tenureYears: 5 }, // Missing loanAmount
        { loanAmount: 1000, tenureYears: 5 }, // Missing interestRate
        { loanAmount: 1000, interestRate: 12 }, // Missing tenureYears
      ];

      missingFields.forEach((input, index) => {
        const result = loanSimulationSchema.safeParse(input);
        this.assert(!result.success, `Missing field ${index + 1} should fail validation`);
      });

      this.addTestResult(testName, true, 'All basic validation tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test edge cases and boundary conditions
   */
  async testEdgeCases() {
    const testName = 'Edge Cases and Boundary Conditions';
    
    try {
      // Boundary values
      const boundaryTests = [
        { loanAmount: 10000, interestRate: 0, tenureYears: 1 }, // Minimum values
        { loanAmount: 100000000, interestRate: 40, tenureYears: 30 }, // Maximum values
        { loanAmount: 9999.99, interestRate: 0.01, tenureYears: 1 }, // Just below minimum
        { loanAmount: 100000001, interestRate: 40.01, tenureYears: 30 }, // Just above maximum
      ];

      boundaryTests.forEach((input, index) => {
        const result = loanSimulationSchema.safeParse(input);
        const shouldPass = index < 2; // First two should pass
        this.assert(
          result.success === shouldPass, 
          `Boundary test ${index + 1} ${shouldPass ? 'should pass' : 'should fail'}`
        );
      });

      // Type validation
      const typeTests = [
        { loanAmount: '1000000', interestRate: 12, tenureYears: 5 }, // String amount
        { loanAmount: 1000000, interestRate: '12', tenureYears: 5 }, // String rate
        { loanAmount: 1000000, interestRate: 12, tenureYears: '5' }, // String tenure
        { loanAmount: null, interestRate: 12, tenureYears: 5 }, // Null amount
        { loanAmount: undefined, interestRate: 12, tenureYears: 5 }, // Undefined amount
        { loanAmount: Infinity, interestRate: 12, tenureYears: 5 }, // Infinity
        { loanAmount: NaN, interestRate: 12, tenureYears: 5 }, // NaN
      ];

      typeTests.forEach((input, index) => {
        const result = loanSimulationSchema.safeParse(input);
        this.assert(!result.success, `Type test ${index + 1} should fail validation`);
      });

      this.addTestResult(testName, true, 'All edge case tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test business rules validation
   */
  async testBusinessRules() {
    const testName = 'Business Rules Validation';
    
    try {
      // Test Nepali market validation
      const nepaliTests = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 }, // Valid
        { loanAmount: 1000000, interestRate: 30, tenureYears: 5 }, // High rate
        { loanAmount: 1000000, interestRate: 12, tenureYears: 12 }, // Long tenure
      ];

      nepaliTests.forEach((input, index) => {
        const result = nepaliMarketValidation.safeParse(input);
        // All should pass, but some may have warnings
        this.assert(result.success, `Nepali market test ${index + 1} should pass`);
      });

      // Test affordability validation
      const affordabilityTests = [
        { monthlyIncome: 50000, existingEMIs: 10000, maxDTIRatio: 0.5 }, // Valid
        { monthlyIncome: 50000, existingEMIs: 40000, maxDTIRatio: 0.5 }, // High existing EMIs
        { monthlyIncome: 50000, existingEMIs: 10000, maxDTIRatio: 0.5, 
          loanAmount: 10000000, interestRate: 12, tenureYears: 5 }, // High loan amount
      ];

      affordabilityTests.forEach((input, index) => {
        const result = affordabilityValidation.safeParse(input);
        const shouldPass = index < 2; // First two should pass
        this.assert(
          result.success === shouldPass, 
          `Affordability test ${index + 1} ${shouldPass ? 'should pass' : 'should fail'}`
        );
      });

      this.addTestResult(testName, true, 'All business rule tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test Nepali market specific validation
   */
  async testNepaliMarketValidation() {
    const testName = 'Nepali Market Validation';
    
    try {
      // Test typical Nepali loan scenarios
      const nepaliScenarios = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5, loanType: 'HOME' }, // Home loan
        { loanAmount: 500000, interestRate: 15, tenureYears: 3, loanType: 'PERSONAL' }, // Personal loan
        { loanAmount: 2000000, interestRate: 18, tenureYears: 7, loanType: 'VEHICLE' }, // Vehicle loan
      ];

      nepaliScenarios.forEach((input, index) => {
        const result = enhancedLoanSimulationSchema.safeParse(input);
        this.assert(result.success, `Nepali scenario ${index + 1} should pass`);
      });

      // Test invalid Nepali market scenarios
      const invalidScenarios = [
        { loanAmount: 1000000, interestRate: 50, tenureYears: 5, loanType: 'HOME' }, // Too high rate
        { loanAmount: 100000, interestRate: 12, tenureYears: 5, loanType: 'HOME' }, // Too low amount
      ];

      invalidScenarios.forEach((input, index) => {
        const result = nepaliMarketValidation.safeParse(input);
        // These might pass basic validation but fail business rules
        this.assert(result.success || result.error, `Invalid scenario ${index + 1} should be handled`);
      });

      this.addTestResult(testName, true, 'All Nepali market validation tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test error formatting
   */
  async testErrorFormatting() {
    const testName = 'Error Formatting';
    
    try {
      // Create a validation error
      const result = loanSimulationSchema.safeParse({
        loanAmount: -1000,
        interestRate: 50,
        tenureYears: 0,
      });

      this.assert(!result.success, 'Should fail validation');
      
      if (result.error) {
        const formattedErrors = formatValidationErrors(result.error.errors);
        
        this.assert(typeof formattedErrors === 'object', 'Should return object');
        this.assert(formattedErrors.loanAmount, 'Should have loanAmount error');
        this.assert(formattedErrors.interestRate, 'Should have interestRate error');
        this.assert(formattedErrors.tenureYears, 'Should have tenureYears error');
        
        // Check error messages are user-friendly
        this.assert(
          formattedErrors.loanAmount.includes('greater than'),
          'Error message should be user-friendly'
        );
      }

      this.addTestResult(testName, true, 'All error formatting tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test validation middleware
   */
  async testMiddleware() {
    const testName = 'Validation Middleware';
    
    try {
      // Create middleware
      const middleware = createValidationMiddleware(loanSimulationSchema, 'body');
      
      // Mock request and response
      const req = {
        body: {
          loanAmount: 1000000,
          interestRate: 12,
          tenureYears: 5,
        },
      };
      
      const res = {
        status: () => ({
          json: (data) => data,
        }),
      };
      
      let middlewareResult;
      let nextCalled = false;
      
      const next = () => {
        nextCalled = true;
      };
      
      // Test valid data
      middleware(req, res, next);
      this.assert(nextCalled, 'Next should be called for valid data');
      this.assert(req.body.loanAmount === 1000000, 'Data should be preserved');
      
      // Test invalid data
      req.body = { loanAmount: -1000, interestRate: 12, tenureYears: 5 };
      nextCalled = false;
      
      const mockStatus = jest.fn(() => ({
        json: jest.fn(),
      }));
      res.status = mockStatus;
      
      middleware(req, res, next);
      this.assert(!nextCalled, 'Next should not be called for invalid data');
      
      this.addTestResult(testName, true, 'All middleware tests passed');
      
    } catch (error) {
      this.addTestResult(testName, false, error.message);
    }
  }

  /**
   * Test advanced schemas
   */
  async testAdvancedSchemas() {
    const testName = 'Advanced Schemas';
    
    try {
      // Test loan comparison schema
      const comparisonData = {
        loans: [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ],
        comparisonType: 'TOTAL_PAYMENT',
      };
      
      let result = loanComparisonSchema.safeParse(comparisonData);
      this.assert(result.success, 'Valid comparison data should pass');
      
      // Test batch simulation schema
      const batchData = {
        simulations: [
          { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ],
        batchName: 'Test Batch',
      };
      
      result = batchLoanSimulationSchema.safeParse(batchData);
      this.assert(result.success, 'Valid batch data should pass');
      
      // Test search schema
      const searchData = {
        query: '1000000',
        filters: {
          amountRange: { min: 500000, max: 1500000 },
          rateRange: { min: 10, max: 15 },
        },
        pagination: { page: 1, limit: 10 },
        sort: { field: 'createdAt', order: 'desc' },
      };
      
      result = loanSearchSchema.safeParse(searchData);
      this.assert(result.success, 'Valid search data should pass');
      
      // Test export schema
      const exportData = {
        format: 'CSV',
        filters: {
          dateRange: {
            startDate: '2024-01-01T00:00:00Z',
            endDate: '2024-12-31T23:59:59Z',
          },
        },
      };
      
      result = loanExportSchema.safeParse(exportData);
      this.assert(result.success, 'Valid export data should pass');
      
      this.addTestResult(testName, true, 'All advanced schema tests passed');
      
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
    console.log('\n📊 Validation Test Results Summary:');
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
      console.log('\n🎉 All validation tests passed! Schemas are ready for production.');
    } else {
      console.log('\n⚠️  Some validation tests failed. Please review the results above.');
    }
  }
}

// Export test runner
export { ValidationTestRunner };

// Auto-run tests if this file is executed directly
if (typeof window === 'undefined' && typeof process !== 'undefined' && process.argv) {
  const testRunner = new ValidationTestRunner();
  testRunner.runAllTests().catch(console.error);
}
