import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    subscriptionPlan?: string;
  };
}

export const authMiddleware = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      res.status(401).json({ error: 'Access denied. No token provided.' });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      include: {
        subscription: {
          select: { plan: true }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid token.' });
      return;
    }

    req.user = {
      id: user.id,
      email: user.email,
      subscriptionPlan: user.subscription?.plan
    };

    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};
