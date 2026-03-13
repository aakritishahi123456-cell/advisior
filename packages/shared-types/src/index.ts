import { z } from 'zod';

// User related types
export const UserSchema = z.object({
  id: z.string(),
  email: z.string().email(),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof UserSchema>;

export const RegisterSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  phone: z.string().optional()
});

export type RegisterRequest = z.infer<typeof RegisterSchema>;

export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1)
});

export type LoginRequest = z.infer<typeof LoginSchema>;

export const AuthResponseSchema = z.object({
  message: z.string(),
  user: UserSchema.omit({ createdAt: true, updatedAt: true }),
  token: z.string()
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Subscription types
export enum SubscriptionPlan {
  FREE = 'FREE',
  BASIC = 'BASIC',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE'
}

export enum SubscriptionStatus {
  ACTIVE = 'ACTIVE',
  CANCELLED = 'CANCELLED',
  EXPIRED = 'EXPIRED',
  SUSPENDED = 'SUSPENDED'
}

export const SubscriptionSchema = z.object({
  id: z.string(),
  userId: z.string(),
  plan: z.nativeEnum(SubscriptionPlan),
  status: z.nativeEnum(SubscriptionStatus),
  startDate: z.date(),
  endDate: z.date().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Subscription = z.infer<typeof SubscriptionSchema>;

// Loan types
export enum LoanType {
  PERSONAL = 'PERSONAL',
  BUSINESS = 'BUSINESS',
  HOME = 'HOME',
  VEHICLE = 'VEHICLE',
  EDUCATION = 'EDUCATION'
}

export enum LoanStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  DEFAULTED = 'DEFAULTED'
}

export const LoanSchema = z.object({
  id: z.string(),
  userId: z.string(),
  amount: z.number(),
  interestRate: z.number(),
  term: z.number(),
  type: z.nativeEnum(LoanType),
  status: z.nativeEnum(LoanStatus),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type Loan = z.infer<typeof LoanSchema>;

export const CreateLoanSchema = z.object({
  amount: z.number().positive(),
  interestRate: z.number().positive(),
  term: z.number().int().positive(),
  type: z.nativeEnum(LoanType)
});

export type CreateLoanRequest = z.infer<typeof CreateLoanSchema>;

export const LoanSimulationSchema = z.object({
  amount: z.number().positive(),
  interestRate: z.number().positive(),
  term: z.number().int().positive()
});

export type LoanSimulationRequest = z.infer<typeof LoanSimulationSchema>;

export const LoanSimulationResultSchema = z.object({
  monthlyPayment: z.number(),
  totalPayment: z.number(),
  totalInterest: z.number(),
  principal: z.number(),
  interestRate: z.number(),
  term: z.number()
});

export type LoanSimulationResult = z.infer<typeof LoanSimulationResultSchema>;

// Financial Report types
export enum ReportType {
  BANK_STATEMENT = 'BANK_STATEMENT',
  TAX_RETURN = 'TAX_RETURN',
  FINANCIAL_STATEMENT = 'FINANCIAL_STATEMENT',
  CREDIT_REPORT = 'CREDIT_REPORT',
  INCOME_STATEMENT = 'INCOME_STATEMENT'
}

export const FinancialReportSchema = z.object({
  id: z.string(),
  userId: z.string(),
  title: z.string(),
  fileUrl: z.string().url().optional(),
  content: z.string().optional(),
  reportType: z.nativeEnum(ReportType),
  parsedData: z.any().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type FinancialReport = z.infer<typeof FinancialReportSchema>;

export const CreateReportSchema = z.object({
  title: z.string().min(1),
  reportType: z.nativeEnum(ReportType),
  content: z.string().optional()
});

export type CreateReportRequest = z.infer<typeof CreateReportSchema>;

// AI Analysis types
export enum AnalysisType {
  LOAN_ELIGIBILITY = 'LOAN_ELIGIBILITY',
  RISK_ASSESSMENT = 'RISK_ASSESSMENT',
  FINANCIAL_HEALTH = 'FINANCIAL_HEALTH',
  CREDIT_SCORE = 'CREDIT_SCORE',
  INVESTMENT_ANALYSIS = 'INVESTMENT_ANALYSIS'
}

export const AIAnalysisSchema = z.object({
  id: z.string(),
  userId: z.string(),
  reportId: z.string().optional(),
  analysisType: z.nativeEnum(AnalysisType),
  input: z.any(),
  result: z.any(),
  confidence: z.number().optional(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type AIAnalysis = z.infer<typeof AIAnalysisSchema>;

export const CreateAnalysisSchema = z.object({
  analysisType: z.nativeEnum(AnalysisType),
  input: z.any()
});

export type CreateAnalysisRequest = z.infer<typeof CreateAnalysisSchema>;

// API Response types
export const ApiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  error: z.string().optional()
});

export type ApiResponse<T = any> = {
  success: boolean;
  message: string;
  data?: T;
  error?: string;
};

// Pagination types
export const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  total: z.number(),
  totalPages: z.number()
});

export type Pagination = z.infer<typeof PaginationSchema>;

export const PaginatedResponseSchema = z.object({
  data: z.array(z.any()),
  pagination: PaginationSchema
});

export type PaginatedResponse<T = any> = {
  data: T[];
  pagination: Pagination;
};
