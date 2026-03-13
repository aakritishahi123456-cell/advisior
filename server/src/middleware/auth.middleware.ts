import { Request, Response, NextFunction } from 'express';
import { JWTService, JWTPayload } from '../utils/jwt';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: string;
  };
}

export const verifyToken = (token: string): JWTPayload => {
  try {
    return JWTService.verifyToken(token);
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        throw new Error('Access token expired');
      } else if (error.message === 'Invalid token') {
        throw new Error('Invalid access token');
      }
    }
    throw new Error('Token verification failed');
  }
};

export const requireAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      res.status(401).json({ 
        error: 'Access denied. No token provided.',
        code: 'NO_TOKEN'
      });
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ 
        error: 'Access denied. Token format invalid.',
        code: 'INVALID_TOKEN_FORMAT'
      });
      return;
    }

    // Verify it's an access token
    if (!JWTService.isAccessToken(token)) {
      res.status(401).json({ 
        error: 'Access denied. Refresh token cannot be used for access.',
        code: 'WRONG_TOKEN_TYPE'
      });
      return;
    }

    const decoded = verifyToken(token);
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        role: true
      }
    });

    if (!user) {
      res.status(401).json({ 
        error: 'Access denied. User not found.',
        code: 'USER_NOT_FOUND'
      });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role || 'FREE'
    };

    next();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Access token expired') {
        res.status(401).json({ 
          error: 'Access token expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED'
        });
        return;
      } else if (error.message === 'Invalid access token') {
        res.status(401).json({ 
          error: 'Invalid access token.',
          code: 'INVALID_TOKEN'
        });
        return;
      }
    }

    res.status(401).json({ 
      error: 'Access denied. Token verification failed.',
      code: 'VERIFICATION_FAILED'
    });
  }
};

export const requirePro = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  // First ensure user is authenticated
  await requireAuth(req, res, async () => {
    try {
      if (!req.user) {
        res.status(401).json({ 
          error: 'Access denied. Authentication required.',
          code: 'AUTH_REQUIRED'
        });
        return;
      }

      // Check if user has PRO subscription
      const subscription = await prisma.subscription.findFirst({
        where: {
          userId: req.user.id,
          plan: 'PRO',
          status: 'ACTIVE',
          OR: [
            { endDate: null },
            { endDate: { gte: new Date() } }
          ]
        }
      });

      if (!subscription) {
        res.status(403).json({ 
          error: 'Access denied. PRO subscription required.',
          code: 'PRO_REQUIRED'
        });
        return;
      }

      next();
    } catch (error) {
      res.status(500).json({ 
        error: 'Internal server error during subscription check.',
        code: 'INTERNAL_ERROR'
      });
    }
  });
};

export const optionalAuth = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader) {
      // No token provided, continue without user
      next();
      return;
    }

    const token = authHeader.replace('Bearer ', '');
    
    if (!token || !JWTService.isAccessToken(token)) {
      // Invalid token format, continue without user
      next();
      return;
    }

    try {
      const decoded = verifyToken(token);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          role: true
        }
      });

      if (user) {
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role || 'FREE'
        };
      }
    } catch {
      // Token verification failed, continue without user
    }

    next();
  } catch (error) {
    // Any error, continue without user
    next();
  }
};
