import { z } from 'zod';

// Financial metrics validation
export const financialMetricsSchema = z.object({
  revenue: z.number()
    .min(0, 'Revenue cannot be negative')
    .max(999999999999, 'Revenue is too large')
    .optional(),
  netProfit: z.number()
    .min(-999999999999, 'Net profit loss is too large')
    .max(999999999999, 'Net profit is too large')
    .optional(),
  totalAssets: z.number()
    .min(0, 'Total assets cannot be negative')
    .max(999999999999, 'Total assets are too large')
    .optional(),
  totalLiabilities: z.number()
    .min(0, 'Total liabilities cannot be negative')
    .max(999999999999, 'Total liabilities are too large')
    .optional(),
  equity: z.number()
    .min(-999999999999, 'Equity cannot be less than -999 billion')
    .max(999999999999, 'Equity is too large')
    .optional(),
  eps: z.number()
    .min(-9999, 'EPS cannot be less than -9999')
    .max(9999, 'EPS cannot exceed 9999')
    .optional(),
  roe: z.number()
    .min(-100, 'ROE cannot be less than -100%')
    .max(100, 'ROE cannot exceed 100%')
    .optional(),
  debtRatio: z.number()
    .min(0, 'Debt ratio cannot be negative')
    .max(10, 'Debt ratio cannot exceed 1000%')
    .optional(),
  profitMargin: z.number()
    .min(-100, 'Profit margin cannot be less than -100%')
    .max(100, 'Profit margin cannot exceed 100%')
    .optional(),
  epsGrowth: z.number()
    .min(-100, 'EPS growth cannot be less than -100%')
    .max(1000, 'EPS growth cannot exceed 1000%')
    .optional(),
  currentRatio: z.number()
    .min(0, 'Current ratio cannot be negative')
    .max(100, 'Current ratio cannot exceed 100')
    .optional(),
  quickRatio: z.number()
    .min(0, 'Quick ratio cannot be negative')
    .max(100, 'Quick ratio cannot exceed 100')
    .optional(),
  grossMargin: z.number()
    .min(-100, 'Gross margin cannot be less than -100%')
    .max(100, 'Gross margin cannot exceed 100%')
    .optional(),
  operatingMargin: z.number()
    .min(-100, 'Operating margin cannot be less than -100%')
    .max(100, 'Operating margin cannot exceed 100%')
    .optional(),
  netMargin: z.number()
    .min(-100, 'Net margin cannot be less than -100%')
    .max(100, 'Net margin cannot exceed 100%')
    .optional(),
  returnOnAssets: z.number()
    .min(-100, 'Return on assets cannot be less than -100%')
    .max(100, 'Return on assets cannot exceed 100%')
    .optional(),
  returnOnEquity: z.number()
    .min(-100, 'Return on equity cannot be less than -100%')
    .max(100, 'Return on equity cannot exceed 100%')
    .optional(),
  priceToEarnings: z.number()
    .min(0, 'P/E ratio cannot be negative')
    .max(1000, 'P/E ratio cannot exceed 1000')
    .optional(),
  priceToBook: z.number()
    .min(0, 'P/B ratio cannot be negative')
    .max(100, 'P/B ratio cannot exceed 100')
    .optional(),
  dividendYield: z.number()
    .min(0, 'Dividend yield cannot be negative')
    .max(100, 'Dividend yield cannot exceed 100%')
    .optional()
});

// Financial report validation
export const createFinancialReportSchema = z.object({
  companyId: z.string()
    .uuid('Invalid company ID format')
    .optional(),
  year: z.number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(new Date().getFullYear() + 2, 'Year cannot be more than 2 years in the future')
    .optional(),
  quarter: z.number()
    .int('Quarter must be an integer')
    .min(1, 'Quarter must be between 1 and 4')
    .max(4, 'Quarter must be between 1 and 4')
    .optional(),
  revenue: z.number()
    .min(0, 'Revenue cannot be negative')
    .max(999999999999, 'Revenue is too large'),
  netProfit: z.number()
    .min(-999999999999, 'Net profit loss is too large')
    .max(999999999999, 'Net profit is too large'),
  totalAssets: z.number()
    .min(0, 'Total assets cannot be negative')
    .max(999999999999, 'Total assets are too large'),
  totalLiabilities: z.number()
    .min(0, 'Total liabilities cannot be negative')
    .max(999999999999, 'Total liabilities are too large'),
  currency: z.string()
    .min(3, 'Currency code must be at least 3 characters')
    .max(3, 'Currency code must be exactly 3 characters')
    .toUpperCase('Currency code must be uppercase')
    .regex(/^[A-Z]{3}$/, 'Currency code must be a valid 3-letter code')
    .default('NPR'),
  unit: z.string()
    .min(1, 'Unit is required')
    .max(20, 'Unit cannot exceed 20 characters')
    .default('thousands'),
  isAudited: z.boolean()
    .default(false),
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
});

// Financial analysis validation
export const financialAnalysisSchema = z.object({
  companyId: z.string()
    .uuid('Invalid company ID format')
    .optional(),
  analysisType: z.enum([
    'financial-health',
    'risk-assessment',
    'investment-opportunity',
    'performance-analysis',
    'valuation',
    'credit-analysis'
  ]),
  period: z.enum(['monthly', 'quarterly', 'yearly']).default('yearly'),
  startDate: z.string()
    .datetime('Invalid start date format')
    .optional(),
  endDate: z.string()
    .datetime('Invalid end date format')
    .optional(),
  compareWith: z.array(z.string().uuid('Invalid company ID format'))
    .max(10, 'Cannot compare with more than 10 companies')
    .optional(),
  includeRatios: z.boolean()
    .default(true),
  includeTrends: z.boolean()
    .default(true),
  includeRecommendations: z.boolean()
    .default(true)
});

// Budget validation
export const createBudgetSchema = z.object({
  name: z.string()
    .min(1, 'Budget name is required')
    .max(255, 'Budget name cannot exceed 255 characters')
    .trim('Budget name cannot be empty or whitespace'),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  year: z.number()
    .int('Year must be an integer')
    .min(2000, 'Year must be 2000 or later')
    .max(new Date().getFullYear() + 5, 'Year cannot be more than 5 years in the future'),
  currency: z.string()
    .min(3, 'Currency code must be at least 3 characters')
    .max(3, 'Currency code must be exactly 3 characters')
    .toUpperCase('Currency code must be uppercase')
    .regex(/^[A-Z]{3}$/, 'Currency code must be a valid 3-letter code')
    .default('NPR'),
  categories: z.array(z.object({
    name: z.string()
      .min(1, 'Category name is required')
      .max(100, 'Category name cannot exceed 100 characters')
      .trim('Category name cannot be empty or whitespace'),
    allocatedAmount: z.number()
      .min(0, 'Allocated amount cannot be negative')
      .max(999999999999, 'Allocated amount is too large'),
    description: z.string()
      .max(500, 'Description cannot exceed 500 characters')
      .optional()
  }))
    .min(1, 'At least one budget category is required')
    .max(50, 'Cannot have more than 50 budget categories'),
  totalBudget: z.number()
    .min(0, 'Total budget cannot be negative')
    .max(999999999999, 'Total budget is too large'),
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
});

// Expense validation
export const createExpenseSchema = z.object({
  amount: z.number()
    .min(0.01, 'Expense amount must be at least 0.01')
    .max(999999999, 'Expense amount is too large'),
  category: z.string()
    .min(1, 'Expense category is required')
    .max(100, 'Expense category cannot exceed 100 characters')
    .trim('Expense category cannot be empty or whitespace'),
  description: z.string()
    .min(1, 'Expense description is required')
    .max(500, 'Expense description cannot exceed 500 characters')
    .trim('Expense description cannot be empty or whitespace'),
  date: z.string()
    .datetime('Invalid date format'),
  currency: z.string()
    .min(3, 'Currency code must be at least 3 characters')
    .max(3, 'Currency code must be exactly 3 characters')
    .toUpperCase('Currency code must be uppercase')
    .regex(/^[A-Z]{3}$/, 'Currency code must be a valid 3-letter code')
    .default('NPR'),
  tags: z.array(z.string()
    .min(1, 'Tag cannot be empty')
    .max(50, 'Tag cannot exceed 50 characters')
    .trim('Tag cannot be empty or whitespace'))
    .max(10, 'Cannot have more than 10 tags')
    .optional(),
  receiptUrl: z.string()
    .url('Invalid receipt URL format')
    .optional(),
  isRecurring: z.boolean()
    .default(false),
  recurringFrequency: z.enum(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'])
    .optional(),
  recurringEndDate: z.string()
    .datetime('Invalid recurring end date format')
    .optional()
}).refine((data) => {
  // If isRecurring is true, recurringFrequency is required
  if (data.isRecurring && !data.recurringFrequency) {
    return false;
  }
  return true;
}, {
  message: 'Recurring frequency is required when expense is recurring'
});

// Financial query validation
export const financialQuerySchema = z.object({
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
  startDate: z.string()
    .datetime('Invalid start date format')
    .optional(),
  endDate: z.string()
    .datetime('Invalid end date format')
    .optional(),
  minAmount: z.number()
    .min(0, 'Minimum amount cannot be negative')
    .optional(),
  maxAmount: z.number()
    .min(0, 'Maximum amount cannot be negative')
    .optional(),
  category: z.string()
    .max(100, 'Category filter cannot exceed 100 characters')
    .optional(),
  currency: z.string()
    .min(3, 'Currency code must be at least 3 characters')
    .max(3, 'Currency code must be exactly 3 characters')
    .toUpperCase('Currency code must be uppercase')
    .regex(/^[A-Z]{3}$/, 'Currency code must be a valid 3-letter code')
    .optional(),
  sortBy: z.enum(['date', 'amount', 'category', 'createdAt']).default('date'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).refine((data) => {
  // If both dates are provided, start date must be before end date
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return start <= end;
  }
  return true;
}, {
  message: 'Start date must be before or equal to end date'
}).refine((data) => {
  // If both amounts are provided, min amount must be less than max amount
  if (data.minAmount !== undefined && data.maxAmount !== undefined) {
    return data.minAmount <= data.maxAmount;
  }
  return true;
}, {
  message: 'Minimum amount must be less than or equal to maximum amount'
});

// Investment validation
export const createInvestmentSchema = z.object({
  symbol: z.string()
    .min(1, 'Investment symbol is required')
    .max(10, 'Investment symbol cannot exceed 10 characters')
    .toUpperCase('Investment symbol must be uppercase')
    .regex(/^[A-Z0-9]+$/, 'Investment symbol can only contain uppercase letters and numbers'),
  type: z.enum(['stock', 'bond', 'mutual-fund', 'etf', 'commodity', 'crypto', 'real-estate']),
  quantity: z.number()
    .positive('Quantity must be positive')
    .max(999999999, 'Quantity is too large'),
  purchasePrice: z.number()
    .positive('Purchase price must be positive')
    .max(999999999, 'Purchase price is too large'),
  purchaseDate: z.string()
    .datetime('Invalid purchase date format'),
  currency: z.string()
    .min(3, 'Currency code must be at least 3 characters')
    .max(3, 'Currency code must be exactly 3 characters')
    .toUpperCase('Currency code must be uppercase')
    .regex(/^[A-Z]{3}$/, 'Currency code must be a valid 3-letter code')
    .default('NPR'),
  notes: z.string()
    .max(1000, 'Notes cannot exceed 1000 characters')
    .optional()
});

export type FinancialMetricsInput = z.infer<typeof financialMetricsSchema>;
export type CreateFinancialReportInput = z.infer<typeof createFinancialReportSchema>;
export type FinancialAnalysisInput = z.infer<typeof financialAnalysisSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type FinancialQueryInput = z.infer<typeof financialQuerySchema>;
export type CreateInvestmentInput = z.infer<typeof createInvestmentSchema>;
