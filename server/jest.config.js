/**
 * Jest Configuration for FinSathi Loan Engine Tests
 * Coverage target: 80%
 */

module.exports = {
  testEnvironment: 'node',

  testMatch: [
    '**/__tests__/**/*.test.js',
    '**/__tests__/**/*.test.ts',
    '**/__tests__/**/*.spec.js',
    '**/__tests__/**/*.spec.ts',
  ],

  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html', 'json'],

  coverageThreshold: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80,
    },
  },

  collectCoverageFrom: [
    'src/utils/**/*.js',
    '!src/utils/__tests__/**',
    '!src/utils/loanCalculator.examples.js',
    '!src/utils/loanComparison.examples.js',
    '!src/utils/riskScoring.examples.js',
  ],

  setupFilesAfterEnv: ['<rootDir>/src/utils/__tests__/setup.js'],

  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': 'babel-jest',
  },

  moduleFileExtensions: ['js', 'jsx', 'ts', 'tsx', 'json'],

  // Resolve relative imports inside __tests__ to the parent utils folder
  moduleNameMapper: {
    '^\\./financialRatios$': '<rootDir>/src/utils/financialRatios.js',
    '^\\./financialHealthScore$': '<rootDir>/src/utils/financialHealthScore.js',
    '^\\./financialNormalization$': '<rootDir>/src/utils/financialNormalization.js',
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
  },

  testTimeout: 10000,
  verbose: true,
  errorOnDeprecated: true,
  clearMocks: true,
  restoreMocks: true,

  testPathIgnorePatterns: [
    '/node_modules/',
    '/dist/',
    '/build/',
    '/coverage/',
  ],

  logHeapUsage: true,
  forceExit: false,
  detectOpenHandles: true,
  detectLeaks: false,
  maxWorkers: 4,
  cache: true,
  cacheDirectory: '<rootDir>/.jest-cache',

  transformIgnorePatterns: [
    '/node_modules/(?!(.*\\.mjs$))',
  ],

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
