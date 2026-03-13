import { Router } from 'express';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { asyncHandler, createError } from '../middleware/errorHandler';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

// Register
router.post('/register', asyncHandler(async (req: any, res: any) => {
  const validatedData = registerSchema.parse(req.body);

  const existingUser = await prisma.user.findUnique({
    where: { email: validatedData.email }
  });

  if (existingUser) {
    throw createError('User already exists', 409);
  }

  const hashedPassword = await bcrypt.hash(validatedData.password, 12);

  const user = await prisma.user.create({
    data: {
      ...validatedData,
      password: hashedPassword
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      phone: true,
      createdAt: true
    }
  });

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  res.status(201).json({
    message: 'User created successfully',
    user,
    token
  });
}));

// Login
router.post('/login', asyncHandler(async (req: any, res: any) => {
  const validatedData = loginSchema.parse(req.body);

  const user = await prisma.user.findUnique({
    where: { email: validatedData.email },
    include: {
      subscription: {
        select: { plan: true }
      }
    }
  });

  if (!user) {
    throw createError('Invalid credentials', 401);
  }

  const isPasswordValid = await bcrypt.compare(validatedData.password, user.password);

  if (!isPasswordValid) {
    throw createError('Invalid credentials', 401);
  }

  const token = jwt.sign(
    { userId: user.id },
    process.env.JWT_SECRET!,
    { expiresIn: '7d' }
  );

  const { password, ...userWithoutPassword } = user;

  res.json({
    message: 'Login successful',
    user: userWithoutPassword,
    token
  });
}));

export default router;
