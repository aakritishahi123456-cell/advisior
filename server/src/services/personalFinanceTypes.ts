export type TransactionCategory = 
  | 'salary'
  | 'investment'
  | 'business'
  | 'rent'
  | 'utilities'
  | 'food'
  | 'transportation'
  | 'healthcare'
  | 'entertainment'
  | 'shopping'
  | 'education'
  | 'insurance'
  | 'loan_payment'
  | 'other';

export interface Transaction {
  id: string;
  userId: string;
  date: Date;
  amount: number;
  currency: string;
  category: TransactionCategory;
  description: string;
  isIncome: boolean;
  tags?: string[];
  recurring?: RecurringConfig;
  source?: string;
}

export interface RecurringConfig {
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'quarterly' | 'yearly';
  nextDate: Date;
  endDate?: Date;
}

export interface Budget {
  id: string;
  userId: string;
  category: TransactionCategory;
  amount: number;
  period: 'weekly' | 'monthly' | 'yearly';
  startDate: Date;
  alerts: BudgetAlert[];
}

export interface BudgetAlert {
  threshold: number;
  type: 'warning' | 'critical';
  triggered: boolean;
}

export interface BudgetAnalysis {
  userId: string;
  period: string;
  totalIncome: number;
  totalExpenses: number;
  savings: number;
  savingsRate: number;
  categoryBreakdown: CategoryBreakdown[];
  trends: TrendData[];
  alerts: BudgetAlert[];
  recommendations: string[];
}

export interface CategoryBreakdown {
  category: TransactionCategory;
  budgeted: number;
  actual: number;
  variance: number;
  percentage: number;
}

export interface TrendData {
  month: string;
  income: number;
  expenses: number;
  savings: number;
}

export interface Debt {
  id: string;
  userId: string;
  name: string;
  type: 'mortgage' | 'car_loan' | 'personal_loan' | 'student_loan' | 'credit_card' | 'other';
  principal: number;
  currentBalance: number;
  interestRate: number;
  monthlyPayment: number;
  startDate: Date;
  endDate?: Date;
  lender: string;
  collateral?: string;
}

export interface DebtPayoffStrategy {
  debtId: string;
  method: 'avalanche' | 'snowball' | 'custom';
  payoffDate: Date;
  totalInterest: number;
  monthlyPayments: PayoffSchedule[];
}

export interface PayoffSchedule {
  month: string;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export interface DebtAnalysis {
  userId: string;
  totalDebt: number;
  totalMonthlyPayment: number;
  debts: Debt[];
  strategies: DebtPayoffStrategy[];
  recommendations: DebtRecommendation[];
}

export interface DebtRecommendation {
  type: 'accelerate' | 'refinance' | 'consolidate' | 'maintain';
  debtId?: string;
  rationale: string;
  savings?: number;
  priority: 'high' | 'medium' | 'low';
}

export interface Investment {
  id: string;
  userId: string;
  name: string;
  type: 'stock' | 'bond' | 'mutual_fund' | 'epf' | 'pf' | 'real_estate' | 'crypto' | 'gold' | 'other';
  symbol?: string;
  purchasePrice: number;
  currentValue: number;
  quantity: number;
  purchaseDate: Date;
  currentPrice?: number;
  returns: InvestmentReturn;
}

export interface InvestmentReturn {
  absolute: number;
  percentage: number;
  annualized: number;
}

export interface InvestmentGoal {
  id: string;
  userId: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  monthlyContribution: number;
  expectedReturn: number;
  priority: 'high' | 'medium' | 'low';
  category: 'retirement' | 'house' | 'education' | 'emergency' | 'travel' | 'other';
}

export interface InvestmentPlan {
  userId: string;
  goals: InvestmentGoal[];
  currentPortfolio: Investment[];
  allocation: PortfolioAllocation;
  recommendations: InvestmentRecommendation[];
  projections: GoalProjection[];
  riskProfile: RiskProfile;
}

export interface PortfolioAllocation {
  current: AllocationItem[];
  target: AllocationItem[];
  drift: AllocationItem[];
}

export interface AllocationItem {
  category: string;
  percentage: number;
  value: number;
}

export interface InvestmentRecommendation {
  action: 'buy' | 'sell' | 'hold' | 'switch';
  investment?: string;
  fund?: string;
  amount?: number;
  rationale: string;
  risk: 'low' | 'medium' | 'high';
}

export interface GoalProjection {
  goalId: string;
  projections: ProjectionPoint[];
  onTrack: boolean;
  shortfall?: number;
}

export interface ProjectionPoint {
  date: string;
  projected: number;
  target: number;
}

export interface RiskProfile {
  score: number;
  level: 'conservative' | 'moderate' | 'aggressive';
  tolerance: number;
  capacity: number;
}

export interface WealthPlan {
  userId: string;
  netWorth: number;
  assets: Asset[];
  liabilities: Liability[];
  timeline: WealthTimeline;
  milestones: Milestone[];
  strategies: WealthStrategy[];
  projections: NetWorthProjection[];
}

export interface Asset {
  category: string;
  value: number;
  return: number;
  liquidity: 'high' | 'medium' | 'low';
}

export interface Liability {
  category: string;
  value: number;
  interestRate: number;
}

export interface WealthTimeline {
  currentAge: number;
  retirementAge: number;
  lifeExpectancy: number;
}

export interface Milestone {
  name: string;
  targetAge: number;
  targetAmount: number;
  achieved: boolean;
}

export interface WealthStrategy {
  name: string;
  description: string;
  timeline: string;
  expectedImpact: number;
  actions: string[];
}

export interface NetWorthProjection {
  year: number;
  assets: number;
  liabilities: number;
  netWorth: number;
}

export interface PersonalFinanceProfile {
  userId: string;
  monthlyIncome: number;
  monthlyExpenses: number;
  savings: number;
  investments: number;
  debts: number;
  netWorth: number;
  creditScore?: number;
  financialGoals: FinancialGoal[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  lastUpdated: Date;
}

export interface FinancialGoal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: Date;
  priority: 'high' | 'medium' | 'low';
}

export interface FinancialAlert {
  id: string;
  userId: string;
  type: 'budget' | 'investment' | 'debt' | 'wealth' | 'tax' | 'reminder';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  action?: string;
  createdAt: Date;
  read: boolean;
}

export interface PersonalFinanceReport {
  id: string;
  userId: string;
  generatedAt: Date;
  period: string;
  summary: FinanceSummary;
  budget: BudgetAnalysis;
  investments: InvestmentPlan;
  debts: DebtAnalysis;
  wealth: WealthPlan;
  alerts: FinancialAlert[];
  recommendations: string[];
}

export interface FinanceSummary {
  totalIncome: number;
  totalExpenses: number;
  netSavings: number;
  investmentGrowth: number;
  debtReduction: number;
  netWorthChange: number;
}
