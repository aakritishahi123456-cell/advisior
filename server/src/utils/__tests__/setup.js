/**
 * Jest Setup File for FinSathi Loan Engine Tests
 * Global setup and configuration for all test suites
 */

// Set up global test environment
process.env.NODE_ENV = 'test';

// Mock console methods to avoid noise in test output
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
};

// Mock Date.now for consistent testing
Date.now = jest.fn(() => new Date('2024-03-10T12:00:00.000Z'));

// Mock Math.random for consistent testing
Math.random = jest.fn(() => 0.5);

// Set up any global test utilities or mocks
global.testUtils = {
  // Helper function to create mock loan data
  createMockLoan: (overrides = {}) => ({
    loanAmount: 1000000,
    interestRate: 12,
    tenureYears: 5,
    ...overrides,
  }),
  
  // Helper function to create mock risk assessment data
  createMockRiskAssessment: (overrides = {}) => ({
    riskLevel: 'MODERATE',
    riskScore: 45,
    debtBurdenRatio: 30,
    explanation: 'Moderate risk: Debt burden requires monitoring',
    recommendations: [
      {
        type: 'CAUTION',
        title: 'Proceed with Caution',
        description: 'Your debt burden is moderate. Ensure adequate emergency funds.',
        action: 'REVIEW',
      },
    ],
    ...overrides,
  }),
  
  // Helper function to create mock historical data
  createMockHistoricalData: (count = 3) => {
    return Array.from({ length: count }, (_, i) => ({
      riskLevel: { level: i % 3 === 0 ? 'LOW' : i % 3 === 1 ? 'MODERATE' : 'HIGH' },
      debtBurdenRatio: 15 + i * 10,
      riskScore: 20 + i * 15,
      assessment: { timestamp: new Date(Date.now() - i * 86400000).toISOString() },
    }));
  },
  
  // Helper function to generate random loan data
  generateRandomLoanData: (count = 1) => {
    return Array.from({ length: count }, (_, i) => ({
      loanAmount: 1000000 + Math.floor(Math.random() * 9000000),
      interestRate: 5 + Math.random() * 15,
      tenureYears: 1 + Math.floor(Math.random() * 29),
      bank: `Bank ${i + 1}`,
      loanType: ['HOME', 'PERSONAL', 'BUSINESS', 'EDUCATION', 'VEHICLE'][Math.floor(Math.random() * 5)],
      description: `Test loan ${i + 1}`,
    }));
  },
  
  // Helper function to validate EMI calculation
  validateEMICalculation: (loanAmount, interestRate, tenureYears, expectedEMI) => {
    const result = require('../loanCalculator').calculateEMI(loanAmount, interestRate, tenureYears);
    expect(result).not.toBeNull();
    expect(result.emi).toBeCloseTo(expectedEMI, 2);
    expect(result.totalInterest).toBeGreaterThan(0);
    expect(result.totalPayment).toBeGreaterThan(loanAmount);
    return result;
  },
  
  // Helper function to validate risk assessment
  validateRiskAssessment: (emi, monthlyIncome, expectedLevel) => {
    const result = require('../riskScoring').calculateLoanRisk({ emi, monthlyIncome });
    expect(result.riskLevel.level).toBe(expectedLevel);
    expect(result.debtBurdenRatio).toBe((emi / monthlyIncome) * 100);
    return result;
  },
  
  // Helper function to validate comparison result
  validateComparison: (loans, expectedBestLoanIndex) => {
    const result = require('../loanComparison').compareLoans(loans);
    expect(result.loans).toHaveLength(loans.length);
    expect(result.analysis.lowestTotalPayment).toBeDefined();
    expect(result.loans[expectedBestLoanIndex]).toBe(result.analysis.lowestTotalPayment);
    return result;
  },
};

// Global test timeout
jest.setTimeout(10000);

// Global error handlers
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, reason);
});

// Clean up after all tests
afterAll(() => {
  // Restore console methods
  global.console = require('console');
  
  // Restore Date.now
  if (typeof global.Date.now.restore === 'function') {
    global.Date.now.restore();
  }
  
  // Restore Math.random
  if (typeof global.Math.random.restore === 'function') {
    global.Math.random.restore();
  }
});
