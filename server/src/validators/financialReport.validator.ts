import { z } from 'zod';
import { ReportType } from '@prisma/client';

export const createReportSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title cannot exceed 255 characters'),
  reportType: z.nativeEnum(ReportType, {
    errorMap: (issue, ctx) => {
      if (issue.code === z.ZodIssueCode.invalid_enum_value) {
        return { message: `Invalid report type. Must be one of: ${Object.values(ReportType).join(', ')}` };
      }
      return { message: ctx.defaultError };
    }
  }),
  content: z.string()
    .max(10000, 'Content cannot exceed 10,000 characters')
    .optional(),
  fileUrl: z.string()
    .url('Invalid file URL format')
    .optional(),
  companyId: z.string()
    .uuid('Invalid company ID format')
    .optional(),
  year: z.number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the distant future')
    .optional()
});

export const updateReportSchema = z.object({
  title: z.string()
    .min(1, 'Title is required')
    .max(255, 'Title cannot exceed 255 characters')
    .optional(),
  content: z.string()
    .max(10000, 'Content cannot exceed 10,000 characters')
    .optional(),
  fileUrl: z.string()
    .url('Invalid file URL format')
    .optional()
});

export const reportQuerySchema = z.object({
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
  reportType: z.enum(['BANK_STATEMENT', 'TAX_RETURN', 'FINANCIAL_STATEMENT', 'CREDIT_REPORT', 'INCOME_STATEMENT']).optional(),
  year: z.coerce.number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(new Date().getFullYear() + 1, 'Year cannot be in the distant future')
    .optional()
});

export const reportIdSchema = z.object({
  id: z.string()
    .min(1, 'Report ID is required')
    .uuid('Invalid report ID format')
});

export const reportAnalyticsQuerySchema = z.object({
  period: z.enum(['1month', '3months', '6months', '1year', '2years']).default('1year')
});

export type CreateReportInput = z.infer<typeof createReportSchema>;
export type UpdateReportInput = z.infer<typeof updateReportSchema>;
export type ReportQueryInput = z.infer<typeof reportQuerySchema>;
export type ReportAnalyticsQueryInput = z.infer<typeof reportAnalyticsQuerySchema>;
