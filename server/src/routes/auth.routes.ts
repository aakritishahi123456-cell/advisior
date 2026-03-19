import { Router } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { PasswordService } from '../utils/password';
import { JWTService } from '../utils/jwt';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { requireAuth, AuthRequest } from '../middleware/auth.middleware';
import { loginLimiter, registerLimiter, refreshLimiter } from '../middleware/rateLimiter.middleware';
import { supabaseAdmin, supabaseAuthClient } from '../lib/supabase';

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

const sanitizeUser = <T extends {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  phone: string | null
  role: string
  createdAt: Date
  updatedAt: Date
}>(user: T) => ({
  id: user.id,
  email: user.email,
  firstName: user.firstName || undefined,
  lastName: user.lastName || undefined,
  phone: user.phone || undefined,
  role: user.role,
  createdAt: user.createdAt,
  updatedAt: user.updatedAt,
})

const syncLocalUser = async (input: {
  email: string
  firstName?: string
  lastName?: string
  phone?: string
}) => {
  const user = await prisma.user.upsert({
    where: { email: input.email },
    update: {
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
    },
    create: {
      email: input.email,
      firstName: input.firstName,
      lastName: input.lastName,
      phone: input.phone,
      passwordHash: '__supabase_managed__',
      role: 'FREE',
    },
  })

  const existingSubscription = await prisma.subscription.findFirst({
    where: { userId: user.id },
  })

  if (!existingSubscription) {
    await prisma.subscription.create({
      data: {
        userId: user.id,
        plan: 'FREE',
        status: 'ACTIVE',
      },
    })
  }

  return user
}

// Register endpoint
router.post('/register', registerLimiter, asyncHandler(async (req: any, res: any) => {
  const validatedData = registerSchema.parse(req.body);

  // Additional password strength validation
  const passwordValidation = PasswordService.validatePasswordStrength(validatedData.password);
  if (!passwordValidation.isValid) {
    throw createError(passwordValidation.errors.join(', '), 400);
  }

  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (existingUser) {
    throw createError('User with this email already exists', 409);
  }

  const { data: createdAuthUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: validatedData.email,
    password: validatedData.password,
    email_confirm: true,
    user_metadata: {
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
    },
  })

  if (authError) {
    if (authError.message.toLowerCase().includes('already')) {
      throw createError('User with this email already exists', 409)
    }

    throw createError(authError.message, 400)
  }

  try {
    const user = await syncLocalUser({
      email: validatedData.email,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
    })
    const tokens = JWTService.generateTokenPair(user)

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: sanitizeUser(user),
        token: tokens.accessToken,
        refreshToken: tokens.refreshToken
      }
    });
  } catch (error) {
    if (createdAuthUser.user?.id) {
      await supabaseAdmin.auth.admin.deleteUser(createdAuthUser.user.id)
    }

    throw error
  }
}));

// Login endpoint
router.post('/login', loginLimiter, asyncHandler(async (req: any, res: any) => {
  const validatedData = loginSchema.parse(req.body);

  const { data: authSession, error: authError } = await supabaseAuthClient.auth.signInWithPassword({
    email: validatedData.email,
    password: validatedData.password,
  })

  if (authError || !authSession.user) {
    throw createError('Invalid email or password', 401);
  }

  const metadata = authSession.user.user_metadata || {}
  const user = await syncLocalUser({
    email: validatedData.email,
    firstName: metadata.firstName,
    lastName: metadata.lastName,
    phone: metadata.phone,
  })

  // Generate tokens
  const tokens = JWTService.generateTokenPair(user);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: sanitizeUser(user),
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
