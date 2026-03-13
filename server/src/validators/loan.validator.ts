import { z } from 'zod';
import { LoanType } from '@prisma/client';

export const createLoanSchema = z.object({
  principal: z.number()
    .positive('Principal amount must be positive')
    .min(1000, 'Minimum loan amount is NPR 1,000')
    .max(10000000, 'Maximum loan amount is NPR 10,000,000'),
  interestRate: z.number()
    .positive('Interest rate must be positive')
    .min(1, 'Interest rate must be at least 1%')
    .max(50, 'Interest rate cannot exceed 50%'),
  tenure: z.number()
    .int('Tenure must be in months')
    .positive('Tenure must be positive')
    .min(1, 'Minimum tenure is 1 month')
    .max(360, 'Maximum tenure is 360 months (30 years)'),
  type: z.nativeEnum(LoanType, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: `Invalid loan type. Must be one of: ${Object.values(LoanType).join(', ')}` };
      }
      return { message: ctx.defaultError };
    }
  })
});

export const updateLoanSchema = z.object({
  principal: z.number()
    .positive('Principal amount must be positive')
    .min(1000, 'Minimum loan amount is NPR 1,000')
    .max(10000000, 'Maximum loan amount is NPR 10,000,000')
    .optional(),
  interestRate: z.number()
    .positive('Interest rate must be positive')
    .min(1, 'Interest rate must be at least 1%')
    .max(50, 'Interest rate cannot exceed 50%')
    .optional(),
  tenure: z.number()
    .int('Tenure must be in months')
    .positive('Tenure must be positive')
    .min(1, 'Minimum tenure is 1 month')
    .max(360, 'Maximum tenure is 360 months (30 years)')
    .optional(),
  type: z.nativeEnum(LoanType).optional()
});

export const loanSimulationSchema = z.object({
  principal: z.number()
    .positive('Principal amount must be positive')
    .min(1000, 'Minimum loan amount is NPR 1,000')
    .max(10000000, 'Maximum loan amount is NPR 10,000,000'),
  interestRate: z.number()
    .positive('Interest rate must be positive')
    .min(1, 'Interest rate must be at least 1%')
    .max(50, 'Interest rate cannot exceed 50%'),
  tenure: z.number()
    .int('Tenure must be in months')
    .positive('Tenure must be positive')
    .min(1, 'Minimum tenure is 1 month')
    .max(360, 'Maximum tenure is 360 months (30 years)')
});

export const loanQuerySchema = z.object({
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
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'ACTIVE', 'COMPLETED', 'DEFAULTED']).optional()
});

export const loanIdSchema = z.object({
  id: z.string()
    .min(1, 'Loan ID is required')
    .uuid('Invalid loan ID format')
});

export type CreateLoanInput = z.infer<typeof createLoanSchema>;
export type UpdateLoanInput = z.infer<typeof updateLoanSchema>;
export type LoanSimulationInput = z.infer<typeof loanSimulationSchema>;
export type LoanQueryInput = z.infer<typeof loanQuerySchema>;
