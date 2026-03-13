import { z } from 'zod';

// User registration validation
export const registerUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email cannot exceed 255 characters')
    .toLowerCase('Email must be lowercase'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters long')
    .max(128, 'Password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'Password must contain at least one special character'),
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters')
    .trim('First name cannot be empty or whitespace')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim('Last name cannot be empty or whitespace')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  phone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional(),
  dateOfBirth: z.string()
    .datetime('Invalid date of birth format')
    .refine((date) => {
      const dob = new Date(date);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      return dob <= maxAge && dob >= minAge;
    }, 'Must be between 18 and 120 years old')
    .optional()
});

// User login validation
export const loginUserSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email cannot exceed 255 characters')
    .toLowerCase('Email must be lowercase'),
  password: z.string()
    .min(1, 'Password is required')
    .max(128, 'Password cannot exceed 128 characters')
});

// User profile update validation
export const updateUserProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'First name is required')
    .max(50, 'First name cannot exceed 50 characters')
    .trim('First name cannot be empty or whitespace')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  lastName: z.string()
    .min(1, 'Last name is required')
    .max(50, 'Last name cannot exceed 50 characters')
    .trim('Last name cannot be empty or whitespace')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .optional(),
  phone: z.string()
    .regex(/^[+]?[\d\s-()]+$/, 'Invalid phone number format')
    .min(10, 'Phone number must be at least 10 digits')
    .max(20, 'Phone number cannot exceed 20 characters')
    .optional(),
  dateOfBirth: z.string()
    .datetime('Invalid date of birth format')
    .refine((date) => {
      const dob = new Date(date);
      const now = new Date();
      const minAge = new Date(now.getFullYear() - 120, now.getMonth(), now.getDate());
      const maxAge = new Date(now.getFullYear() - 18, now.getMonth(), now.getDate());
      return dob <= maxAge && dob >= minAge;
    }, 'Must be between 18 and 120 years old')
    .optional(),
  bio: z.string()
    .max(500, 'Bio cannot exceed 500 characters')
    .optional(),
  avatar: z.string()
    .url('Invalid avatar URL format')
    .optional(),
  preferences: z.object({
    language: z.enum(['en', 'ne']).default('en'),
    timezone: z.string()
      .regex(/^[A-Za-z_\/]+$/, 'Invalid timezone format')
      .default('Asia/Kathmandu'),
    currency: z.string()
      .min(3, 'Currency code must be exactly 3 characters')
      .max(3, 'Currency code must be exactly 3 characters')
      .toUpperCase('Currency code must be uppercase')
      .regex(/^[A-Z]{3}$/, 'Currency code must be a valid 3-letter code')
      .default('NPR'),
    dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD']).default('DD/MM/YYYY'),
    notifications: z.object({
      email: z.boolean().default(true),
      push: z.boolean().default(true),
      sms: z.boolean().default(false),
      marketing: z.boolean().default(false)
    }).optional()
  }).optional()
});

// Password change validation
export const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Current password is required')
    .max(128, 'Current password cannot exceed 128 characters'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'New password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// Password reset validation
export const resetPasswordSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email cannot exceed 255 characters')
    .toLowerCase('Email must be lowercase')
});

// Password reset confirmation validation
export const confirmResetPasswordSchema = z.object({
  token: z.string()
    .min(1, 'Reset token is required')
    .max(255, 'Reset token cannot exceed 255 characters'),
  newPassword: z.string()
    .min(8, 'New password must be at least 8 characters long')
    .max(128, 'New password cannot exceed 128 characters')
    .regex(/[A-Z]/, 'New password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'New password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'New password must contain at least one number')
    .regex(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/, 'New password must contain at least one special character'),
  confirmPassword: z.string()
    .min(1, 'Password confirmation is required')
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword']
});

// User query validation
export const userQuerySchema = z.object({
  page: z.coerce.number()
    .int('Page must be an integer')
    .positive('Page must be positive')
    .min(1, 'Page must be at least 1')
    .default(1),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(100, 'Limit cannot exceed 100')
    .default(10),
  search: z.string()
    .max(100, 'Search term cannot exceed 100 characters')
    .trim('Search term cannot be empty or whitespace')
    .optional(),
  role: z.enum(['FREE', 'PRO']).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  sortBy: z.enum(['createdAt', 'email', 'firstName', 'lastName']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
});

// User ID validation
export const userIdSchema = z.object({
  id: z.string()
    .min(1, 'User ID is required')
    .uuid('Invalid user ID format')
});

// Email verification validation
export const verifyEmailSchema = z.object({
  token: z.string()
    .min(1, 'Verification token is required')
    .max(255, 'Verification token cannot exceed 255 characters')
});

// Notification preferences validation
export const notificationPreferencesSchema = z.object({
  email: z.boolean(),
  push: z.boolean(),
  sms: z.boolean(),
  marketing: z.boolean(),
  loanUpdates: z.boolean(),
  financialReports: z.boolean(),
  aiAnalysis: z.boolean(),
  systemUpdates: z.boolean()
});

// Subscription validation
export const createSubscriptionSchema = z.object({
  plan: z.enum(['FREE', 'PRO']),
  paymentMethod: z.enum(['credit-card', 'bank-transfer', 'digital-wallet']).optional(),
  paymentDetails: z.object({
    cardNumber: z.string()
      .regex(/^\d{16}$/, 'Card number must be 16 digits')
      .optional(),
    expiryDate: z.string()
      .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, 'Expiry date must be in MM/YY format')
      .optional(),
    cvv: z.string()
      .regex(/^\d{3,4}$/, 'CVV must be 3 or 4 digits')
      .optional(),
    bankAccount: z.string()
      .regex(/^\d{10,20}$/, 'Bank account must be 10-20 digits')
      .optional()
  }).optional(),
  billingAddress: z.object({
    street: z.string()
      .min(1, 'Street address is required')
      .max(255, 'Street address cannot exceed 255 characters'),
    city: z.string()
      .min(1, 'City is required')
      .max(100, 'City cannot exceed 100 characters'),
    state: z.string()
      .min(1, 'State is required')
      .max(100, 'State cannot exceed 100 characters'),
    postalCode: z.string()
      .min(1, 'Postal code is required')
      .max(20, 'Postal code cannot exceed 20 characters'),
    country: z.string()
      .min(1, 'Country is required')
      .max(100, 'Country cannot exceed 100 characters')
  }).optional()
});

// User settings validation
export const userSettingsSchema = z.object({
  notifications: notificationPreferencesSchema.optional(),
  privacy: z.object({
    profileVisibility: z.enum(['public', 'private', 'friends']).default('private'),
    showEmail: z.boolean().default(false),
    showPhone: z.boolean().default(false),
    showDateOfBirth: z.boolean().default(false)
  }).optional(),
  security: z.object({
    twoFactorEnabled: z.boolean().default(false),
    loginNotifications: z.boolean().default(true),
    sessionTimeout: z.number()
      .int('Session timeout must be an integer')
      .min(5, 'Session timeout must be at least 5 minutes')
      .max(1440, 'Session timeout cannot exceed 1440 minutes (24 hours)')
      .default(30)
  }).optional(),
  api: z.object({
    rateLimitPerHour: z.number()
      .int('Rate limit must be an integer')
      .min(10, 'Rate limit must be at least 10 requests per hour')
      .max(10000, 'Rate limit cannot exceed 10000 requests per hour')
      .default(1000),
    webhookUrl: z.string()
      .url('Invalid webhook URL format')
      .optional(),
    apiKey: z.string()
      .min(1, 'API key is required')
      .max(255, 'API key cannot exceed 255 characters')
      .optional()
  }).optional()
});

export type RegisterUserInput = z.infer<typeof registerUserSchema>;
export type LoginUserInput = z.infer<typeof loginUserSchema>;
export type UpdateUserProfileInput = z.infer<typeof updateUserProfileSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ConfirmResetPasswordInput = z.infer<typeof confirmResetPasswordSchema>;
export type UserQueryInput = z.infer<typeof userQuerySchema>;
export type VerifyEmailInput = z.infer<typeof verifyEmailSchema>;
export type CreateSubscriptionInput = z.infer<typeof createSubscriptionSchema>;
export type UserSettingsInput = z.infer<typeof userSettingsSchema>;
