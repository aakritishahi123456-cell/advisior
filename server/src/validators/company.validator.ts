import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string()
    .min(1, 'Company name is required')
    .max(255, 'Company name cannot exceed 255 characters')
    .trim('Company name cannot be empty or whitespace'),
  symbol: z.string()
    .min(1, 'Company symbol is required')
    .max(10, 'Company symbol cannot exceed 10 characters')
    .toUpperCase('Company symbol must be uppercase')
    .regex(/^[A-Z0-9]+$/, 'Company symbol can only contain uppercase letters and numbers'),
  sector: z.string()
    .min(1, 'Sector is required')
    .max(100, 'Sector cannot exceed 100 characters')
    .trim('Sector cannot be empty or whitespace')
});

export const updateCompanySchema = z.object({
  name: z.string()
    .min(1, 'Company name is required')
    .max(255, 'Company name cannot exceed 255 characters')
    .trim('Company name cannot be empty or whitespace')
    .optional(),
  symbol: z.string()
    .min(1, 'Company symbol is required')
    .max(10, 'Company symbol cannot exceed 10 characters')
    .toUpperCase('Company symbol must be uppercase')
    .regex(/^[A-Z0-9]+$/, 'Company symbol can only contain uppercase letters and numbers')
    .optional(),
  sector: z.string()
    .min(1, 'Sector is required')
    .max(100, 'Sector cannot exceed 100 characters')
    .trim('Sector cannot be empty or whitespace')
    .optional()
});

export const companyQuerySchema = z.object({
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
  sector: z.string()
    .max(100, 'Sector filter cannot exceed 100 characters')
    .optional(),
  symbol: z.string()
    .max(10, 'Symbol filter cannot exceed 10 characters')
    .toUpperCase('Symbol filter must be uppercase')
    .regex(/^[A-Z0-9]*$/, 'Symbol filter can only contain uppercase letters and numbers')
    .optional(),
  search: z.string()
    .max(255, 'Search term cannot exceed 255 characters')
    .trim('Search term cannot be empty or whitespace')
    .optional()
});

export const companyIdSchema = z.object({
  id: z.string()
    .min(1, 'Company ID is required')
    .uuid('Invalid company ID format')
});

export const companySymbolSchema = z.object({
  symbol: z.string()
    .min(1, 'Company symbol is required')
    .max(10, 'Company symbol cannot exceed 10 characters')
    .toUpperCase('Company symbol must be uppercase')
    .regex(/^[A-Z0-9]+$/, 'Company symbol can only contain uppercase letters and numbers')
});

export const bulkCompanyCreateSchema = z.array(createCompanySchema)
  .min(1, 'At least one company must be provided')
  .max(100, 'Cannot create more than 100 companies at once');

export const companySearchSchema = z.object({
  query: z.string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query cannot exceed 100 characters')
    .trim('Search query cannot be empty or whitespace'),
  type: z.enum(['name', 'symbol', 'sector']).default('name'),
  limit: z.coerce.number()
    .int('Limit must be an integer')
    .positive('Limit must be positive')
    .max(20, 'Search limit cannot exceed 20')
    .default(10)
});

export type CreateCompanyInput = z.infer<typeof createCompanySchema>;
export type UpdateCompanyInput = z.infer<typeof updateCompanySchema>;
export type CompanyQueryInput = z.infer<typeof companyQuerySchema>;
export type CompanySearchInput = z.infer<typeof companySearchSchema>;
export type BulkCompanyCreateInput = z.infer<typeof bulkCompanyCreateSchema>;
