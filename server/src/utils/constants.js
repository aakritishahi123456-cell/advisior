// Application constants
export const APP_CONFIG = {
  NAME: 'FinSathi AI',
  VERSION: '1.0.0',
  DESCRIPTION: 'Financial decision support platform for Nepal retail investors',
  API_VERSION: 'v1',
  BASE_URL: process.env.BASE_URL || 'http://localhost:3001',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
};

// Database configuration
export const DB_CONFIG = {
  MAX_CONNECTIONS: parseInt(process.env.DB_MAX_CONNECTIONS) || 20,
  CONNECTION_TIMEOUT: parseInt(process.env.DB_CONNECTION_TIMEOUT) || 10000,
  QUERY_TIMEOUT: parseInt(process.env.DB_QUERY_TIMEOUT) || 30000,
};

// JWT configuration
export const JWT_CONFIG = {
  SECRET: process.env.JWT_SECRET || 'your-secret-key',
  EXPIRES_IN: process.env.JWT_EXPIRES_IN || '7d',
  REFRESH_EXPIRES_IN: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
};

// Rate limiting configuration
export const RATE_LIMIT_CONFIG = {
  WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  MAX_REQUESTS: 100,
  AUTH_MAX_REQUESTS: 10,
  STRICT_MAX_REQUESTS: 5,
};

// Pagination configuration
export const PAGINATION_CONFIG = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
};

// File upload configuration
export const FILE_UPLOAD_CONFIG = {
  MAX_SIZE: 10 * 1024 * 1024, // 10MB
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'application/pdf'],
  DESTINATION: 'uploads/',
};

// Email configuration
export const EMAIL_CONFIG = {
  FROM: process.env.EMAIL_FROM || 'noreply@finsathi.ai',
  SMTP_HOST: process.env.SMTP_HOST,
  SMTP_PORT: process.env.SMTP_PORT || 587,
  SMTP_USER: process.env.SMTP_USER,
  SMTP_PASS: process.env.SMTP_PASS,
};

// Redis configuration
export const REDIS_CONFIG = {
  HOST: process.env.REDIS_HOST || 'localhost',
  PORT: process.env.REDIS_PORT || 6379,
  PASSWORD: process.env.REDIS_PASSWORD,
  DB: process.env.REDIS_DB || 0,
  TTL: 3600, // 1 hour
};

// Subscription plans
export const SUBSCRIPTION_PLANS = {
  FREE: {
    name: 'Free',
    price: 0,
    features: [
      'Basic company analysis',
      '5 reports per month',
      'Standard support',
    ],
    limits: {
      reports: 5,
      apiCalls: 1000,
      storage: 100, // MB
    },
  },
  BASIC: {
    name: 'Basic',
    price: 999, // NPR per month
    features: [
      'Advanced company analysis',
      '50 reports per month',
      'AI-powered insights',
      'Email support',
    ],
    limits: {
      reports: 50,
      apiCalls: 10000,
      storage: 500, // MB
    },
  },
  PRO: {
    name: 'Pro',
    price: 1999, // NPR per month
    features: [
      'All Basic features',
      'Unlimited reports',
      'Real-time data',
      'Priority support',
      'API access',
    ],
    limits: {
      reports: -1, // Unlimited
      apiCalls: 100000,
      storage: 2000, // MB
    },
  },
  ENTERPRISE: {
    name: 'Enterprise',
    price: 9999, // NPR per month
    features: [
      'All Pro features',
      'Custom integrations',
      'Dedicated support',
      'White-label options',
      'Advanced analytics',
    ],
    limits: {
      reports: -1, // Unlimited
      apiCalls: -1, // Unlimited
      storage: -1, // Unlimited
    },
  },
};

// Loan configuration
export const LOAN_CONFIG = {
  MIN_AMOUNT: 10000, // NPR
  MAX_AMOUNT: 10000000, // NPR
  MIN_TENURE: 1, // month
  MAX_TENURE: 360, // months (30 years)
  MIN_INTEREST_RATE: 1, // %
  MAX_INTEREST_RATE: 25, // %
};

// Company analysis configuration
export const ANALYSIS_CONFIG = {
  CACHE_TTL: 3600, // 1 hour
  BATCH_SIZE: 50,
  MAX_COMPANIES_PER_REQUEST: 100,
  SUPPORTED_YEARS: Array.from({ length: 10 }, (_, i) => new Date().getFullYear() - i),
};

// Error messages
export const ERROR_MESSAGES = {
  AUTH: {
    INVALID_CREDENTIALS: 'Invalid email or password',
    TOKEN_EXPIRED: 'Token has expired',
    TOKEN_INVALID: 'Invalid token',
    ACCESS_DENIED: 'Access denied',
    ACCOUNT_LOCKED: 'Account is locked',
    EMAIL_NOT_VERIFIED: 'Email not verified',
  },
  VALIDATION: {
    REQUIRED_FIELD: 'This field is required',
    INVALID_EMAIL: 'Invalid email format',
    INVALID_PASSWORD: 'Password must be at least 8 characters',
    PASSWORDS_MISMATCH: 'Passwords do not match',
    INVALID_PHONE: 'Invalid phone number',
  },
  BUSINESS: {
    USER_NOT_FOUND: 'User not found',
    COMPANY_NOT_FOUND: 'Company not found',
    LOAN_NOT_FOUND: 'Loan not found',
    REPORT_NOT_FOUND: 'Report not found',
    SUBSCRIPTION_EXPIRED: 'Subscription has expired',
    INSUFFICIENT_BALANCE: 'Insufficient balance',
    DUPLICATE_EMAIL: 'Email already exists',
  },
  SYSTEM: {
    INTERNAL_ERROR: 'Internal server error',
    DATABASE_ERROR: 'Database error',
    EMAIL_SEND_FAILED: 'Failed to send email',
    FILE_UPLOAD_FAILED: 'File upload failed',
    RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',
  },
};

// Success messages
export const SUCCESS_MESSAGES = {
  AUTH: {
    LOGIN_SUCCESS: 'Login successful',
    LOGOUT_SUCCESS: 'Logout successful',
    REGISTER_SUCCESS: 'Registration successful',
    PASSWORD_RESET_SENT: 'Password reset email sent',
    EMAIL_VERIFIED: 'Email verified successfully',
  },
  BUSINESS: {
    PROFILE_UPDATED: 'Profile updated successfully',
    LOAN_CREATED: 'Loan created successfully',
    REPORT_GENERATED: 'Report generated successfully',
    SUBSCRIPTION_UPDATED: 'Subscription updated successfully',
    FILE_UPLOADED: 'File uploaded successfully',
  },
};

// Environment validation
export const REQUIRED_ENV_VARS = [
  'DATABASE_URL',
  'JWT_SECRET',
  'NODE_ENV',
];

export const OPTIONAL_ENV_VARS = [
  'REDIS_HOST',
  'REDIS_PORT',
  'SMTP_HOST',
  'SMTP_PORT',
  'SMTP_USER',
  'SMTP_PASS',
  'FRONTEND_URL',
  'BASE_URL',
];
