/**
 * FinSathi AI - Security Middleware
 * Comprehensive security implementations
 */

const helmet = require('helmet');
const csrf = require('csurf');
const validator = require('validator');
const crypto = require('crypto');

// Security headers with Helmet
const securityHeaders = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  xssFilter: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
});

// Input sanitization
const sanitizeInput = (req, res, next) => {
  const sanitize = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = validator.escape(validator.trim(obj[key]));
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        sanitize(obj[key]);
      }
    }
  };

  if (req.body) sanitize(req.body);
  if (req.query) sanitize(req.query);
  if (req.params) sanitize(req.params);

  next();
};

// SQL injection prevention (additional to Prisma)
const preventSQLInjection = (req, res, next) => {
  const dangerousPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|TRUNCATE)\b)/i,
    /(union|union all)/i,
    /(--|\/\*|\*\/|;)/,
    /(\bor\b|\band\b).*=.*/i,
  ];

  const checkValue = (value) => {
    if (typeof value === 'string') {
      for (const pattern of dangerousPatterns) {
        if (pattern.test(value)) {
          return true;
        }
      }
    }
    return false;
  };

  const checkObject = (obj) => {
    for (const key in obj) {
      if (checkValue(obj[key])) return true;
      if (typeof obj[key] === 'object') {
        if (checkObject(obj[key])) return true;
      }
    }
    return false;
  };

  if (checkObject(req.body) || checkObject(req.query)) {
    return res.status(400).json({
      success: false,
      error: 'Invalid input detected'
    });
  }

  next();
};

// Request size limiting
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.headers['content-length'] || 0);
    const maxBytes = maxSize === '10mb' ? 10 * 1024 * 1024 : parseInt(maxSize);

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        error: 'Payload too large'
      });
    }

    next();
  };
};

// IP whitelisting
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip || req.connection.remoteAddress;

    if (allowedIPs.length > 0 && !allowedIPs.includes(clientIP)) {
      return res.status(403).json({
        success: false,
        error: 'Access denied from this IP'
      });
    }

    next();
  };
};

// API key authentication for server-to-server
const apiKeyAuth = (req, res, next) => {
  const apiKey = req.headers['x-api-key'];

  if (!apiKey) {
    return res.status(401).json({
      success: false,
      error: 'API key required'
    });
  }

  // Validate API key (implement with your database)
  const validKeys = process.env.API_KEYS?.split(',') || [];
  
  if (!validKeys.includes(apiKey)) {
    return res.status(403).json({
      success: false,
      error: 'Invalid API key'
    });
  }

  next();
};

// CORS configuration
const corsOptions = {
  origin: function (origin, callback) {
    const allowedOrigins = process.env.ALLOWED_ORIGINS?.split(',') || [];
    
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-API-Key', 'X-Requested-With'],
  exposedHeaders: ['X-RateLimit-Limit', 'X-RateLimit-Remaining', 'X-RateLimit-Reset'],
  credentials: true,
  maxAge: 86400,
};

// DDOS protection (basic)
const ddosProtection = {
  requestCounts: new Map(),
  cleanupInterval: null,

  init() {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [ip, data] of this.requestCounts) {
        if (now - data.windowStart > 60000) {
          this.requestCounts.delete(ip);
        }
      }
    }, 60000);
  },

  check(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    if (!this.requestCounts.has(ip)) {
      this.requestCounts.set(ip, { count: 1, windowStart: now });
    } else {
      const data = this.requestCounts.get(ip);
      
      if (now - data.windowStart > 60000) {
        data.count = 1;
        data.windowStart = now;
      } else {
        data.count++;
        
        if (data.count > 500) {
          return res.status(429).json({
            success: false,
            error: 'Too many requests'
          });
        }
      }
    }

    next();
  }
};

// Initialize DDOS protection
ddosProtection.init();

// Password hashing utilities
const hashPassword = async (password) => {
  const salt = await crypto.randomBytes(16).toString('hex');
  const hash = await crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
};

const verifyPassword = async (password, storedHash) => {
  const [salt, hash] = storedHash.split(':');
  const verifyHash = await crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
  return hash === verifyHash;
};

// Generate secure random token
const generateSecureToken = (length = 32) => {
  return crypto.randomBytes(length).toString('hex');
};

// Input validation schemas
const validationSchemas = {
  email: (value) => validator.isEmail(value),
  phone: (value) => validator.isMobilePhone(value, ['np']),
  url: (value) => validator.isURL(value),
  numeric: (value) => validator.isNumeric(value),
  alphanumeric: (value) => validator.isAlphanumeric(value),
  creditCard: (value) => validator.isCreditCard(value),
  JWT: (value) => validator.isJWT(value),
  MongoId: (value) => validator.isMongoId(value),
};

// Sanitize HTML to prevent XSS
const sanitizeHTML = (dirty) => {
  return validator.escape(dirty);
};

// Validate and sanitize user input
const validateInput = (schema) => {
  return (req, res, next) => {
    const errors = [];

    for (const [field, validatorFn] of Object.entries(schema)) {
      const value = req.body[field];

      if (value && !validatorFn(value)) {
        errors.push(`Invalid value for ${field}`);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors
      });
    }

    next();
  };
};

// Audit logging
const auditLog = (action) => {
  return async (req, res, next) => {
    const auditData = {
      timestamp: new Date(),
      action,
      userId: req.user?.id,
      ip: req.ip,
      userAgent: req.get('user-agent'),
      method: req.method,
      path: req.path,
      body: req.body,
    };

    // Log to console in development
    console.log('[AUDIT]', JSON.stringify(auditData));

    // In production, save to database or logging service
    next();
  };
};

// Graceful shutdown
const gracefulShutdown = (server) => {
  const shutdown = async () => {
    console.log('Shutting down gracefully...');
    
    server.close(() => {
      console.log('HTTP server closed');
      process.exit(0);
    });

    // Close database connections
    try {
      const { PrismaClient } = require('@prisma/client');
      await new PrismaClient().$disconnect();
      console.log('Database connections closed');
    } catch (error) {
      console.error('Error closing database:', error);
    }

    // Force exit after 10 seconds
    setTimeout(() => {
      console.error('Forced shutdown after timeout');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
};

module.exports = {
  securityHeaders,
  sanitizeInput,
  preventSQLInjection,
  requestSizeLimit,
  ipWhitelist,
  apiKeyAuth,
  corsOptions,
  ddosProtection,
  hashPassword,
  verifyPassword,
  generateSecureToken,
  validationSchemas,
  sanitizeHTML,
  validateInput,
  auditLog,
  gracefulShutdown,
};
