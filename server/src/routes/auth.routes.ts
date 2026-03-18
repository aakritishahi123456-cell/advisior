import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../utils/password';
import { JWTService } from '../utils/jwt';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { loginLimiter, registerLimiter, refreshLimiter } from '../middleware/rateLimiter.middleware';

const router = Router();
const prisma = new PrismaClient();
const optionalTrimmedString = z
  .string()
  .trim()
  .transform((value) => (value === '' ? undefined : value))
  .optional()

// Validation schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  firstName: optionalTrimmedString,
  lastName: optionalTrimmedString,
  phone: optionalTrimmedString,
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password must be less than 128 characters')
});

const loginSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(1, 'Password is required')
});

const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required')
});

// Register endpoint
router.post('/register', registerLimiter, asyncHandler(async (req: any, res: any) => {
  const validatedData = registerSchema.parse(req.body);

  // Additional password strength validation
  const passwordValidation = PasswordService.validatePasswordStrength(validatedData.password);
  if (!passwordValidation.isValid) {
    throw createError(passwordValidation.errors.join(', '), 400);
  }

  // Check if user already exists
  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  // Hash password
  const hashedPassword = await PasswordService.hashPassword(validatedData.password);

  // Create user
  const user = await prisma.user.create({
    data: {
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      passwordHash: hashedPassword,
      role: 'FREE'
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      role: true,
      createdAt: true,
      updatedAt: true
    }
  });

  // Create default subscription
  await prisma.subscription.create({
    data: {
      userId: user.id,
      plan: 'FREE',
      status: 'ACTIVE'
    }
  });

  // Generate tokens
  const tokens = JWTService.generateTokenPair(user);

  res.status(201).json({
    success: true,
    message: 'User registered successfully',
    data: {
      user,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
}));

// Login endpoint
router.post('/login', loginLimiter, asyncHandler(async (req: any, res: any) => {
  const validatedData = loginSchema.parse(req.body);

  // Find user
  const user = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (!user) {
    throw createError('Invalid email or password', 401);
  }

  // Verify password
  const isPasswordValid = await PasswordService.verifyPassword(
    validatedData.password, 
    user.passwordHash
  );

  if (!isPasswordValid) {
    throw createError('Invalid email or password', 401);
  }

  // Generate tokens
  const tokens = JWTService.generateTokenPair(user);

  const { passwordHash, ...userWithoutPassword } = user;

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: userWithoutPassword,
      token: tokens.accessToken,
      refreshToken: tokens.refreshToken
    }
  });
}));

// Refresh token endpoint
router.post('/refresh', refreshLimiter, asyncHandler(async (req: any, res: any) => {
  const validatedData = refreshTokenSchema.parse(req.body);

  try {
    // Verify refresh token
    const decoded = JWTService.verifyToken(validatedData.refreshToken);

    // Ensure it's a refresh token
    if (!JWTService.isRefreshToken(validatedData.refreshToken)) {
      throw createError('Invalid refresh token', 401);
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      throw createError('User not found', 401);
    }

    // Generate new access token
    const newAccessToken = JWTService.generateAccessToken(user);

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newAccessToken,
        refreshToken: validatedData.refreshToken
      }
    });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message === 'Token expired') {
        throw createError('Refresh token expired. Please login again.', 401);
      } else if (error.message === 'Invalid token') {
        throw createError('Invalid refresh token', 401);
      }
    }
    throw createError('Token refresh failed', 401);
  }
}));

// Get current user profile
router.get('/me', requireAuth, asyncHandler(async (req: AuthRequest, res: any) => {
  const user = await prisma.user.findUnique({
    where: { id: req.user!.id },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      updatedAt: true,
      subscriptions: {
        select: {
          plan: true,
          status: true,
          startDate: true,
          endDate: true
        },
        orderBy: { createdAt: 'desc' },
        take: 1
      }
    }
  });

  if (!user) {
    throw createError('User not found', 404);
  }

  res.json({
    success: true,
    message: 'Profile retrieved successfully',
    data: user
  });
}));

// Logout endpoint (client-side token invalidation)
router.post('/logout', requireAuth, asyncHandler(async (req: AuthRequest, res: any) => {
  // In a stateless JWT system, we don't need to do anything server-side
  // The client should discard the tokens
  // In a production system, you might want to implement token blacklisting
  
  res.json({
    success: true,
    message: 'Logout successful'
  });
}));

export default router;
