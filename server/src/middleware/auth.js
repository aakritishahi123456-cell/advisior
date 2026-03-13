import jwt from 'jsonwebtoken';
import { prisma } from '../app';

export const authenticate = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. No token provided.',
        },
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        subscription: {
          select: {
            plan: true,
            status: true,
            expiresAt: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token. User not found.',
        },
      });
    }

    // Check subscription status
    if (user.subscription && user.subscription.expiresAt < new Date()) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Subscription expired. Please renew your subscription.',
        },
      });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Invalid token.',
        },
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Token expired.',
        },
      });
    }

    res.status(500).json({
      success: false,
      error: {
        message: 'Internal server error during authentication.',
      },
    });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: {
          message: 'Access denied. Authentication required.',
        },
      });
    }

    const userRole = req.user.subscription?.plan || 'FREE';
    
    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        error: {
          message: 'Access denied. Insufficient permissions.',
        },
      });
    }

    next();
  };
};

export const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          subscription: {
            select: {
              plan: true,
              status: true,
              expiresAt: true,
            },
          },
        },
      });

      if (user && (!user.subscription || user.subscription.expiresAt >= new Date())) {
        req.user = user;
      }
    }
  } catch (error) {
    // Ignore authentication errors for optional auth
  }

  next();
};
