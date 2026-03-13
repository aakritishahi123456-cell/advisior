import { Router, Request, Response } from 'express';
import { apiGateway } from '../../services/apiGateway';
import { apiKeyService } from '../../services/apiKeyService';
import { copilotService } from '../../services/copilotService';
import { researchSwarm } from '../../services/researchSwarmOrchestrator';
import { API_PLANS, API_ENDPOINTS, ApiTier } from '../../services/apiPlatformTypes';

const router = Router();

router.get('/health', (req: Request, res: Response) => {
  apiGateway.sendSuccess(res, {
    status: 'healthy',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

router.get('/plans', (req: Request, res: Response) => {
  apiGateway.sendSuccess(res, {
    plans: API_PLANS,
    currencies: ['USD', 'NPR'],
    billingCycles: ['monthly', 'yearly'],
  });
});

router.get('/docs', (req: Request, res: Response) => {
  apiGateway.sendSuccess(res, {
    title: 'FinSathi AI API',
    version: '1.0.0',
    description: 'Financial Intelligence API for Nepal markets',
    endpoints: API_ENDPOINTS.map(e => ({
      path: e.path,
      method: e.method,
      description: e.description,
      tier: e.tier,
    })),
    authentication: {
      type: 'API Key',
      header: 'Authorization: Bearer <api_key>',
      alternative: 'X-API-Key: <api_key>',
    },
  });
});

router.post('/keys', apiGateway.authenticate, async (req: Request, res: Response) => {
  try {
    const { name, tier } = req.body;

    if (!name || !tier) {
      return apiGateway.sendError(res, 400, 'INVALID_REQUEST', 'Name and tier are required');
    }

    const apiKey = await apiKeyService.generateApiKey(
      req.apiKey!.userId,
      name,
      tier as ApiTier
    );

    apiGateway.sendSuccess(res, {
      apiKey: {
        id: apiKey.id,
        name: apiKey.name,
        tier: apiKey.tier,
        rateLimit: apiKey.rateLimit,
        monthlyQuota: apiKey.monthlyQuota,
        createdAt: apiKey.createdAt,
      },
      credentials: {
        key: apiKey.key,
        warning: 'This is the only time the key will be shown. Store it securely.',
      },
    }, { expiresAt: apiKey.expiresAt });
  } catch (error) {
    apiGateway.sendError(res, 500, 'INTERNAL_ERROR', 'Failed to generate API key');
  }
});

router.get('/keys', apiGateway.authenticate, async (req: Request, res: Response) => {
  const stats = await apiKeyService.getUsageStats(req.apiKey!.id);
  apiGateway.sendSuccess(res, {
    keyId: req.apiKey!.id,
    tier: req.apiKey!.tier,
    rateLimit: req.apiKey!.rateLimit,
    monthlyQuota: req.apiKey!.monthlyQuota,
    usage: stats,
    lastUsed: req.apiKey!.lastUsed,
  });
});

router.delete('/keys/:id', apiGateway.authenticate, async (req: Request, res: Response) => {
  const revoked = await apiKeyService.revokeApiKey(req.params.id);
  if (revoked) {
    apiGateway.sendSuccess(res, { message: 'API key revoked successfully' });
  } else {
    apiGateway.sendError(res, 404, 'NOT_FOUND', 'API key not found');
  }
});

router.get('/market', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  apiGateway.sendSuccess(res, {
    indices: [
      { name: 'NEPSE', value: 2450.67, change: 1.2, volume: 45200000 },
      { name: 'NEPSE 20', value: 1850.32, change: 0.8, volume: 12500000 },
    ],
    gainers: [
      { symbol: 'NBL', price: 450, change: 3.2 },
      { symbol: 'NMB', price: 380, change: 2.1 },
    ],
    losers: [
      { symbol: 'VHL', price: 120, change: -1.8 },
    ],
    marketStatus: 'open',
    lastUpdated: new Date().toISOString(),
  });
});

router.get('/company/:symbol', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { symbol } = req.params;
  
  apiGateway.sendSuccess(res, {
    symbol: symbol.toUpperCase(),
    name: `${symbol.toUpperCase()} Limited`,
    sector: 'Banking',
    industry: 'Commercial Banks',
    listingDate: '2017-04-15',
    price: 450,
    change: 3.2,
    volume: 2500000,
    marketCap: 45000000000,
    freeFloat: 35,
  });
});

router.get('/company/:symbol/financials', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { symbol } = req.params;
  const { period } = req.query;

  apiGateway.sendSuccess(res, {
    symbol: symbol.toUpperCase(),
    period: period || '2024-Q1',
    incomeStatement: {
      revenue: 15000000000,
      netIncome: 2500000000,
      eps: 42.5,
    },
    balanceSheet: {
      totalAssets: 100000000000,
      totalEquity: 15000000000,
      totalLiabilities: 85000000000,
    },
    ratios: {
      roe: 16.67,
      roa: 2.5,
      peRatio: 12.5,
      pbRatio: 1.8,
      debtToEquity: 0.65,
      currentRatio: 1.8,
      dividendYield: 4.2,
    },
  });
});

router.get('/company/:symbol/analysis', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { symbol } = req.params;

  apiGateway.sendSuccess(res, {
    symbol: symbol.toUpperCase(),
    score: 75,
    rating: 'Strong Buy',
    confidence: 82,
    recommendation: 'BUY',
    analysis: {
      profitability: { score: 80, assessment: 'Strong' },
      liquidity: { score: 75, assessment: 'Strong' },
      leverage: { score: 70, assessment: 'Moderate' },
      valuation: { score: 75, assessment: 'Fair' },
    },
    keyMetrics: {
      roe: 16.67,
      peRatio: 12.5,
      dividendYield: 4.2,
    },
    generatedAt: new Date().toISOString(),
  });
});

router.post('/company/compare', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { symbols } = req.body;

  apiGateway.sendSuccess(res, {
    symbols,
    comparison: [
      { metric: 'ROE', [symbols[0]]: 16.67, [symbols[1]]: 15.2 },
      { metric: 'P/E', [symbols[0]]: 12.5, [symbols[1]]: 14.2 },
      { metric: 'P/B', [symbols[0]]: 1.8, [symbols[1]]: 1.6 },
      { metric: 'D/E', [symbols[0]]: 0.65, [symbols[1]]: 0.72 },
      { metric: 'Current Ratio', [symbols[0]]: 1.8, [symbols[1]]: 1.6 },
      { metric: 'Dividend Yield', [symbols[0]]: 4.2, [symbols[1]]: 3.8 },
    ],
    winner: symbols[0],
    generatedAt: new Date().toISOString(),
  });
});

router.get('/predictions/:symbol', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { symbol } = req.params;
  const { timeframe } = req.query;

  apiGateway.sendSuccess(res, {
    symbol: symbol.toUpperCase(),
    timeframe: timeframe || '3M',
    prediction: {
      direction: 'bullish',
      targetPrice: 520,
      confidence: 72,
      timeframe: timeframe || '3 months',
    },
    factors: ['Strong earnings', 'Positive sentiment', 'Favorable sector trends'],
    model: 'lstm_v2',
    generatedAt: new Date().toISOString(),
  });
});

router.get('/predictions/market', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { market } = req.query;

  apiGateway.sendSuccess(res, {
    market: market || 'NEPSE',
    overallTrend: 'bullish',
    confidence: 68,
    sectorTrends: [
      { sector: 'Banking', direction: 'bullish', strength: 75 },
      { sector: 'Hydro', direction: 'neutral', strength: 55 },
      { sector: 'Insurance', direction: 'bullish', strength: 65 },
    ],
    signals: [
      { type: 'moving_average', signal: 'bullish', strength: 70 },
      { type: 'momentum', signal: 'bullish', strength: 65 },
    ],
    generatedAt: new Date().toISOString(),
  });
});

router.post('/portfolio/optimize', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { holdings, constraints } = req.body;

  apiGateway.sendSuccess(res, {
    current: holdings,
    optimized: [
      { symbol: 'NBL', weight: 25, action: 'HOLD' },
      { symbol: 'NMB', weight: 20, action: 'BUY' },
      { symbol: 'NIB', weight: 15, action: 'SELL' },
      { symbol: 'HRL', weight: 25, action: 'BUY' },
      { symbol: 'NIC', weight: 15, action: 'HOLD' },
    ],
    expectedReturn: 12.5,
    risk: 15.2,
    sharpeRatio: 0.82,
    constraints: constraints || { maxWeight: 30, minWeight: 5 },
    generatedAt: new Date().toISOString(),
  });
});

router.post('/portfolio/backtest', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { strategy, startDate, endDate } = req.body;

  apiGateway.sendSuccess(res, {
    strategy,
    period: { start: startDate, end: endDate },
    results: {
      totalReturn: 25.3,
      annualizedReturn: 18.5,
      sharpeRatio: 1.45,
      maxDrawdown: -8.2,
      winRate: 62,
      totalTrades: 45,
    },
    monthlyReturns: [
      { month: 'Jan', return: 2.5 },
      { month: 'Feb', return: 1.8 },
      { month: 'Mar', return: -1.2 },
    ],
    generatedAt: new Date().toISOString(),
  });
});

router.post('/advisor/chat', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, async (req: Request, res: Response) => {
  const { message, context } = req.body;

  if (!message) {
    return apiGateway.sendError(res, 400, 'INVALID_REQUEST', 'Message is required');
  }

  const response = await copilotService.processMessage(req.apiKey!.userId, message, {
    userId: req.apiKey!.userId,
    subscriptionPlan: req.apiKey!.tier.toUpperCase() as any,
  });

  apiGateway.sendSuccess(res, {
    reply: response.message,
    type: response.type,
    suggestions: response.suggestions,
    metadata: response.metadata,
  });
});

router.get('/advisor/recommendations', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, (req: Request, res: Response) => {
  const { riskTolerance } = req.query;

  apiGateway.sendSuccess(res, {
    riskTolerance: riskTolerance || 'moderate',
    recommendations: [
      { symbol: 'NBL', action: 'BUY', rationale: 'Strong ROE, undervalued', confidence: 82 },
      { symbol: 'NMB', action: 'BUY', rationale: 'Good growth potential', confidence: 75 },
      { symbol: 'HRL', action: 'HOLD', rationale: 'Fair value', confidence: 65 },
    ],
    generatedAt: new Date().toISOString(),
  });
});

router.post('/swarm/research', apiGateway.authenticate, apiGateway.rateLimit, apiGateway.checkTierAccess, async (req: Request, res: Response) => {
  const { type, symbols, market, portfolio, period } = req.body;

  const report = await researchSwarm.executeResearch({
    type: type || 'comprehensive',
    symbols,
    market,
    portfolio,
    period,
  });

  apiGateway.sendSuccess(res, {
    report: {
      id: report.id,
      type: report.type,
      title: report.synthesized.title,
      summary: report.synthesized.summary,
      recommendations: report.synthesized.recommendations,
      confidence: report.confidence,
      generatedAt: report.generatedAt,
      nextUpdate: report.nextUpdate,
    },
  });
});

export default router;
