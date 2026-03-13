import { Request, Response, NextFunction } from 'express';
import { getRedis } from '../config/redis';
import { JWTService } from '../utils/jwt';
import { AuthRequest } from './auth.middleware';

export class TokenBlacklistService {
  private static readonly BLACKLIST_PREFIX = 'blacklist:';
  private static readonly BLACKLIST_TTL = 7 * 24 * 60 * 60; // 7 days in seconds

  static async addToBlacklist(token: string): Promise<void> {
    try {
      const decoded = JWTService.verifyToken(token);
      const redis = getRedis();
      
      // Blacklist by jti (JWT ID) if available, otherwise by full token
      const key = this.BLACKLIST_PREFIX + (decoded.jti || token);
      await redis.setex(key, this.BLACKLIST_TTL, '1');
    } catch (error) {
      // If token is invalid/expired, no need to blacklist
      console.log('Token already invalid, no need to blacklist:', error);
    }
  }

  static async isBlacklisted(token: string): Promise<boolean> {
    try {
      const decoded = JWTService.verifyToken(token);
      const redis = getRedis();
      
      const key = this.BLACKLIST_PREFIX + (decoded.jti || token);
      const result = await redis.get(key);
      
      return result === '1';
    } catch (error) {
      // If token is invalid/expired, consider it blacklisted
      return true;
    }
  }

  static async removeFromBlacklist(token: string): Promise<void> {
    try {
      const decoded = JWTService.verifyToken(token);
      const redis = getRedis();
      
      const key = this.BLACKLIST_PREFIX + (decoded.jti || token);
      await redis.del(key);
    } catch (error) {
      // Token is already invalid, no need to remove from blacklist
      console.log('Token already invalid, no need to remove from blacklist:', error);
    }
  }
}

export const checkTokenBlacklist = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      return next();
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      return next();
    }

    const isBlacklisted = await TokenBlacklistService.isBlacklisted(token);
    
    if (isBlacklisted) {
      res.status(401).json({ 
        error: 'Token has been invalidated. Please login again.',
        code: 'TOKEN_BLACKLISTED'
      });
      return;
    }

    next();
  } catch (error) {
    res.status(500).json({ 
      error: 'Internal server error during token blacklist check.',
      code: 'INTERNAL_ERROR'
    });
  }
};
