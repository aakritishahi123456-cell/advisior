import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { getEnvNumber } from '../config/env'
import logger from '../utils/logger'

function rateLimitHandler(message: string, code: string) {
  return (req: Request, res: Response) => {
    logger.warn('rate_limit_exceeded', {
      code,
      method: req.method,
      path: req.originalUrl,
      ip: req.ip,
    })

    res.status(429).json({
      error: message,
      code,
    })
  }
}

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: getEnvNumber('RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('RATE_LIMIT_MAX_REQUESTS', 100),
  handler: rateLimitHandler('Too many requests from this IP, please try again later.', 'RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth endpoints rate limiter (more restrictive)
export const authLimiter = rateLimit({
  windowMs: getEnvNumber('AUTH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('AUTH_RATE_LIMIT_MAX_REQUESTS', 5),
  handler: rateLimitHandler('Too many authentication attempts, please try again later.', 'AUTH_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // Don't count successful requests
});

// Login-specific rate limiter (very restrictive)
export const loginLimiter = rateLimit({
  windowMs: getEnvNumber('LOGIN_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('LOGIN_RATE_LIMIT_MAX_REQUESTS', 3),
  handler: rateLimitHandler('Too many login attempts, please try again later.', 'LOGIN_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true,
});

// Registration rate limiter
export const registerLimiter = rateLimit({
  windowMs: getEnvNumber('REGISTER_RATE_LIMIT_WINDOW_MS', 60 * 60 * 1000),
  max: getEnvNumber('REGISTER_RATE_LIMIT_MAX_REQUESTS', 3),
  handler: rateLimitHandler('Too many registration attempts, please try again later.', 'REGISTER_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Token refresh rate limiter
export const refreshLimiter = rateLimit({
  windowMs: getEnvNumber('REFRESH_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('REFRESH_RATE_LIMIT_MAX_REQUESTS', 10),
  handler: rateLimitHandler('Too many token refresh attempts, please try again later.', 'REFRESH_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
});

// PRO features rate limiter (more generous for PRO users)
export const proLimiter = rateLimit({
  windowMs: getEnvNumber('PRO_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('PRO_RATE_LIMIT_MAX_REQUESTS', 1000),
  handler: rateLimitHandler('Too many requests, please try again later.', 'PRO_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
});

// Free tier rate limiter (more restrictive)
export const freeLimiter = rateLimit({
  windowMs: getEnvNumber('FREE_RATE_LIMIT_WINDOW_MS', 15 * 60 * 1000),
  max: getEnvNumber('FREE_RATE_LIMIT_MAX_REQUESTS', 50),
  handler: rateLimitHandler('Free tier rate limit exceeded. Upgrade to PRO for higher limits.', 'FREE_RATE_LIMIT_EXCEEDED'),
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req: Request) => {
    // Use user ID if authenticated, otherwise IP
    const user = (req as any).user;
    return user ? `user:${user.id}` : req.ip;
  },
});
