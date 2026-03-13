/**
 * Jest Configuration for FinSathi Loan Engine Tests
 * Coverage target: 80%
 */

module.exports = {
  // Test environment
  testEnvironment: 'node',
  
  // Test file patterns
  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.spec.ts',
  ],
  
  // Coverage configuration
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: [
    'text',
    'lcov',
    'html',
    'json',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },
  
  // Coverage collection
  collectCoverageFrom: [
    'src/utils/**/*.js',
    '!src/utils/__tests__/**',
    '!src/utils/loanCalculator.examples.js',
    '!src/utils/loanComparison.examples.js',
    '!src/utils/riskScoring.examples.js',
  ],
  
  // Test setup
  setupFilesAfterEnv: ['<rootDir>/src/utils/__tests__/setup.js'],
  
  // Transform patterns
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },
  
  // Module file extensions
  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],
  
  // Module name mapping
  moduleNameMapping: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },
  
  // Test timeout
  testTimeout: 10000,
  
  // Verbose output
  verbose: true,
  
  // Error handling
  errorOnDeprecated: true,
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Restore mocks after each test
  restoreMocks: true,
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],
  
  // Performance monitoring
  logHeapUsage: true,
  
  // Force exit after tests
  forceExit: false,
  
  // Detect open handles
  detectOpenHandles: true,
  
  // Detect leaks
  detectLeaks: false, // Set to false for now to avoid issues
  
  // Randomize test order
  randomizeTestOrder: true,
  
  // Seed for randomization
  seed: 12345,
  
  // Maximum workers
  maxWorkers: 4,
  
  // Cache configuration
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',
  
  // Transform ignore patterns
  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],
  
  // Global variables
  globals: {
    'ts-jest': {
      tsconfig: {
        target: 'es2018',
        module: 'commonjs',
        esModuleInterop: true,
        allowSyntheticDefaultImports: true,
        strict: true,
      },
    },
  },
};
