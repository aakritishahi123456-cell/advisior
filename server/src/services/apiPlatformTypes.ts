export type ApiTier = 'free' | 'basic' | 'pro' | 'enterprise';

export interface ApiKey {
  id: string;
  key: string;
  name: string;
  userId: string;
  tier: ApiTier;
  permissions: ApiPermission[];
  rateLimit: number;
  rateLimitWindow: number;
  monthlyQuota: number;
  usedThisMonth: number;
  createdAt: Date;
  expiresAt?: Date;
  lastUsed?: Date;
  status: 'active' | 'suspended' | 'expired';
}

export interface ApiPermission {
  resource: string;
  actions: ('read' | 'write' | 'delete')[];
}

export interface ApiEndpoint {
  path: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  description: string;
  tier: ApiTier;
  rateLimit: number;
  rateLimitWindow: number;
  parameters: ApiParameter[];
  response: any;
  example: any;
}

export interface ApiParameter {
  name: string;
  type: string;
  required: boolean;
  description: string;
  example?: any;
}

export interface ApiUsage {
  apiKeyId: string;
  endpoint: string;
  method: string;
  statusCode: number;
  responseTime: number;
  timestamp: Date;
  userAgent?: string;
  ipAddress?: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: ApiError;
  meta?: ResponseMeta;
}

export interface ApiError {
  code: string;
  message: string;
  details?: any;
}

export interface ResponseMeta {
  requestId: string;
  timestamp: string;
  version: string;
  rateLimit?: RateLimitInfo;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
}

export interface ApiPlan {
  tier: ApiTier;
  name: string;
  price: number;
  rateLimit: number;
  rateLimitWindow: number;
  monthlyQuota: number;
  features: string[];
  supports: string[];
}

export const API_PLANS: ApiPlan[] = [
  {
    tier: 'free',
    name: 'Free',
    price: 0,
    rateLimit: 10,
    rateLimitWindow: 60,
    monthlyQuota: 100,
    features: ['Basic market data', 'Company info'],
    supports: ['GET /market', 'GET /company/:symbol'],
  },
  {
    tier: 'basic',
    name: 'Basic',
    price: 29,
    rateLimit: 50,
    rateLimitWindow: 60,
    monthlyQuota: 5000,
    features: ['Full market data', 'Financial analysis', 'Historical data'],
    supports: ['GET /market/**', 'GET /company/**', 'GET /analysis/**'],
  },
  {
    tier: 'pro',
    name: 'Pro',
    price: 99,
    rateLimit: 200,
    rateLimitWindow: 60,
    monthlyQuota: 50000,
    features: ['Predictions', 'AI advisor', 'Portfolio optimization', 'Real-time'],
    supports: ['GET /predictions/**', 'POST /portfolio/**', 'POST /advisor/**'],
  },
  {
    tier: 'enterprise',
    name: 'Enterprise',
    price: 499,
    rateLimit: 1000,
    rateLimitWindow: 60,
    monthlyQuota: -1,
    features: ['Unlimited', 'Webhooks', 'Custom models', 'Dedicated support', 'SLA'],
    supports: ['All endpoints', 'POST /webhooks', 'Custom integrations'],
  },
];

export const API_ENDPOINTS: ApiEndpoint[] = [
  {
    path: '/api/v1/market',
    method: 'GET',
    description: 'Get current market overview and indices',
    tier: 'free',
    rateLimit: 60,
    rateLimitWindow: 60,
    parameters: [],
    response: { indices: [], volume: 0, gainers: [], losers: [] },
    example: { indices: [{ name: 'NEPSE', value: 2450.67, change: 1.2 }] },
  },
  {
    path: '/api/v1/company/:symbol',
    method: 'GET',
    description: 'Get company information and basic financials',
    tier: 'free',
    rateLimit: 30,
    rateLimitWindow: 60,
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: 'Company symbol', example: 'NBL' },
    ],
    response: { symbol: '', name: '', sector: '', price: 0 },
    example: { symbol: 'NBL', name: 'Nepal Bank Limited', sector: 'Banking', price: 450 },
  },
  {
    path: '/api/v1/company/:symbol/financials',
    method: 'GET',
    description: 'Get detailed financial statements and ratios',
    tier: 'basic',
    rateLimit: 20,
    rateLimitWindow: 60,
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: 'Company symbol' },
      { name: 'period', type: 'string', required: false, description: 'Fiscal period', example: '2024-Q1' },
    ],
    response: { balanceSheet: {}, incomeStatement: {}, ratios: {} },
    example: { roe: 16.5, peRatio: 12.3, debtToEquity: 0.65 },
  },
  {
    path: '/api/v1/company/:symbol/analysis',
    method: 'GET',
    description: 'Get AI-powered company analysis',
    tier: 'basic',
    rateLimit: 10,
    rateLimitWindow: 60,
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: 'Company symbol' },
    ],
    response: { score: 0, recommendation: '', confidence: 0 },
    example: { score: 75, recommendation: 'BUY', confidence: 82 },
  },
  {
    path: '/api/v1/company/compare',
    method: 'POST',
    description: 'Compare multiple companies',
    tier: 'pro',
    rateLimit: 10,
    rateLimitWindow: 60,
    parameters: [
      { name: 'symbols', type: 'array', required: true, description: 'Array of company symbols', example: ['NBL', 'NMB'] },
    ],
    response: { comparison: [] },
    example: { comparison: [{ metric: 'ROE', NBL: 16.5, NMB: 15.2 }] },
  },
  {
    path: '/api/v1/predictions/:symbol',
    method: 'GET',
    description: 'Get AI predictions for a symbol',
    tier: 'pro',
    rateLimit: 10,
    rateLimitWindow: 60,
    parameters: [
      { name: 'symbol', type: 'string', required: true, description: 'Company symbol' },
      { name: 'timeframe', type: 'string', required: false, description: 'Prediction timeframe', example: '3M' },
    ],
    response: { prediction: '', target: 0, confidence: 0 },
    example: { direction: 'bullish', targetPrice: 520, confidence: 72 },
  },
  {
    path: '/api/v1/predictions/market',
    method: 'GET',
    description: 'Get market-wide predictions and trends',
    tier: 'pro',
    rateLimit: 5,
    rateLimitWindow: 60,
    parameters: [
      { name: 'market', type: 'string', required: false, description: 'Market identifier', example: 'NEPSE' },
    ],
    response: { trends: [], signals: [] },
    example: { trends: [{ sector: 'Banking', direction: 'bullish' }] },
  },
  {
    path: '/api/v1/portfolio/optimize',
    method: 'POST',
    description: 'Optimize portfolio allocation',
    tier: 'pro',
    rateLimit: 5,
    rateLimitWindow: 60,
    parameters: [
      { name: 'holdings', type: 'array', required: true, description: 'Current portfolio holdings' },
      { name: 'constraints', type: 'object', required: false, description: 'Optimization constraints' },
    ],
    response: { allocation: [], expectedReturn: 0, risk: 0 },
    example: { allocation: [{ symbol: 'NBL', weight: 25 }], expectedReturn: 12.5, risk: 15.2 },
  },
  {
    path: '/api/v1/portfolio/backtest',
    method: 'POST',
    description: 'Backtest portfolio strategy',
    tier: 'pro',
    rateLimit: 5,
    rateLimitWindow: 60,
    parameters: [
      { name: 'strategy', type: 'object', required: true, description: 'Trading strategy definition' },
      { name: 'startDate', type: 'string', required: true, description: 'Backtest start date' },
      { name: 'endDate', type: 'string', required: true, description: 'Backtest end date' },
    ],
    response: { returns: 0, sharpe: 0, drawdown: 0 },
    example: { returns: 25.3, sharpe: 1.45, maxDrawdown: -8.2 },
  },
  {
    path: '/api/v1/advisor/chat',
    method: 'POST',
    description: 'AI financial advisor chat',
    tier: 'pro',
    rateLimit: 20,
    rateLimitWindow: 60,
    parameters: [
      { name: 'message', type: 'string', required: true, description: 'User message', example: 'Analyze NBL' },
      { name: 'context', type: 'object', required: false, description: 'Conversation context' },
    ],
    response: { reply: '', suggestions: [] },
    example: { reply: 'NBL shows strong fundamentals...', suggestions: ['Compare with NMB'] },
  },
  {
    path: '/api/v1/advisor/recommendations',
    method: 'GET',
    description: 'Get personalized investment recommendations',
    tier: 'pro',
    rateLimit: 5,
    rateLimitWindow: 60,
    parameters: [
      { name: 'riskTolerance', type: 'string', required: false, description: 'Risk tolerance level' },
    ],
    response: { recommendations: [] },
    example: { recommendations: [{ symbol: 'NBL', action: 'BUY', rationale: '...' }] },
  },
  {
    path: '/api/v1/swarm/research',
    method: 'POST',
    description: 'Multi-agent research swarm',
    tier: 'enterprise',
    rateLimit: 2,
    rateLimitWindow: 60,
    parameters: [
      { name: 'type', type: 'string', required: true, description: 'Research type' },
      { name: 'symbols', type: 'array', required: false, description: 'Symbols to research' },
    ],
    response: { report: {} },
    example: { report: { title: '...', sections: [], recommendations: [] } },
  },
];
