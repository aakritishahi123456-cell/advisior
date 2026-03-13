import { z } from 'zod';

export const loanTypeSchema = z.enum(['HOME', 'PERSONAL', 'EDUCATION', 'BUSINESS', 'AUTO']);

export const loanProductsCompareQuerySchema = z.object({
  loan_type: loanTypeSchema.or(z.string().min(1)),
  loan_amount: z.coerce.number().positive().optional(),
  duration: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(200).optional(),
});

export type LoanProductsCompareQuery = z.infer<typeof loanProductsCompareQuerySchema>;

