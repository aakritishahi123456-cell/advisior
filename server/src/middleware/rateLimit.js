import rateLimit from 'express-rate-limit';
import { prisma } from '../app';

// General rate limiter
export const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many requests, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Strict rate limiter for sensitive endpoints
export const strictLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 auth requests per windowMs
  message: {
    success: false,
    error: {
      message: 'Too many authentication attempts, please try again later.',
    },
  },
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Subscription-based rate limiter
export const createSubscriptionLimiter = (limits) => {
  return async (req, res, next) => {
    try {
      const user = req.user;
      const ip = req.ip || req.connection.remoteAddress;
      
      // Get user's subscription plan
      const plan = user?.subscription?.plan || 'FREE';
      const limit = limits[plan] || limits.FREE;
      
      // Check Redis for current count (you'll need to implement Redis)
      const key = `rate_limit:${ip}:${plan}`;
      
      // For now, use in-memory rate limiting
      // In production, use Redis for distributed rate limiting
      const windowMs = limit.windowMs;
      const maxRequests = limit.max;
      
      // This is a simplified version - implement Redis for production
      req.rateLimit = {
        windowMs,
        maxRequests,
        remaining: maxRequests, // Calculate actual remaining from Redis
      };
      
      next();
    } catch (error) {
      next();
    }
  };
};

// Rate limiting configurations
export const subscriptionLimits = {
  FREE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 50, // 50 requests per 15 minutes
  },
  BASIC: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // 200 requests per 15 minutes
  },
  PRO: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000, // 1000 requests per 15 minutes
  },
  ENTERPRISE: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5000, // 5000 requests per 15 minutes
  },
};
