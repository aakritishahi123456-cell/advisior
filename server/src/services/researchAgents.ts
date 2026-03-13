import {
  AgentConfig,
  AgentRole,
  AgentStatus,
  AgentTask,
  AgentResult,
  AgentMetrics,
  AgentMessage,
  DEFAULT_AGENT_CONFIGS,
} from './researchSwarmTypes';

export abstract class BaseAgent {
  protected config: AgentConfig;
  protected status: AgentStatus = 'idle';
  protected currentTask: AgentTask | null = null;
  protected metrics: AgentMetrics = {
    totalTasks: 0,
    successfulTasks: 0,
    failedTasks: 0,
    averageProcessingTime: 0,
  };

  constructor(role: AgentRole) {
    const defaultConfig = DEFAULT_AGENT_CONFIGS[role];
    this.config = {
      id: `${role}_${Date.now()}`,
      name: defaultConfig.name || role,
      role,
      capabilities: defaultConfig.capabilities || [],
      status: 'idle',
      metrics: this.metrics,
    };
  }

  getId(): string {
    return this.config.id;
  }

  getRole(): AgentRole {
    return this.config.role;
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  getMetrics(): AgentMetrics {
    return this.metrics;
  }

  async executeTask(task: AgentTask): Promise<AgentResult> {
    this.status = 'running';
    this.currentTask = task;
    task.startedAt = new Date();

    const startTime = Date.now();

    try {
      const result = await this.processTask(task);
      
      this.status = 'completed';
      this.updateMetrics(true, Date.now() - startTime);
      
      return {
        agentId: this.config.id,
        agentRole: this.config.role,
        success: true,
        data: result.data,
        confidence: result.confidence || 0.8,
        sources: result.sources || [],
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
        recommendations: result.recommendations,
      };
    } catch (error) {
      this.status = 'failed';
      this.updateMetrics(false, Date.now() - startTime);
      
      return {
        agentId: this.config.id,
        agentRole: this.config.role,
        success: false,
        data: null,
        confidence: 0,
        sources: [],
        timestamp: new Date(),
        processingTime: Date.now() - startTime,
      };
    }
  }

  protected updateMetrics(success: boolean, processingTime: number): void {
    this.metrics.totalTasks++;
    if (success) {
      this.metrics.successfulTasks++;
      this.metrics.lastSuccess = new Date();
    } else {
      this.metrics.failedTasks++;
      this.metrics.lastFailure = new Date();
    }

    const totalTime = this.metrics.averageProcessingTime * (this.metrics.totalTasks - 1) + processingTime;
    this.metrics.averageProcessingTime = totalTime / this.metrics.totalTasks;
  }

  protected abstract processTask(task: AgentTask): Promise<any>;

  canHandle(taskType: string): boolean {
    return this.config.capabilities.some(cap => cap.name === taskType);
  }

  async receiveMessage(message: AgentMessage): Promise<AgentMessage | null> {
    if (message.to !== this.config.id && message.to !== 'broadcast') {
      return null;
    }

    const task: AgentTask = {
      id: `task_${Date.now()}`,
      agentId: this.config.id,
      type: message.content.intent,
      input: message.content.payload,
      status: 'waiting',
    };

    const result = await this.executeTask(task);

    return {
      id: `msg_${Date.now()}`,
      from: this.config.id,
      to: message.from,
      type: 'response',
      content: {
        intent: message.content.intent,
        payload: result,
      },
      timestamp: new Date(),
      correlationId: message.id,
    };
  }
}

export class CompanyAnalysisAgent extends BaseAgent {
  constructor() {
    super('company_analysis');
  }

  protected async processTask(task: AgentTask): Promise<any> {
    const { type, input } = task;

    switch (type) {
      case 'analyze_financials':
        return this.analyzeFinancials(input.symbol, input.period);
      case 'calculate_metrics':
        return this.calculateMetrics(input.symbol, input.metrics);
      case 'assess_health':
        return this.assessFinancialHealth(input.symbol);
      case 'compare':
        return this.compareCompanies(input.symbols);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  private async analyzeFinancials(symbol: string, period?: string) {
    const financialData = await this.fetchFinancialData(symbol, period);
    const analysis = this.performFinancialAnalysis(financialData);

    return {
      symbol,
      period: period || 'latest',
      financials: financialData,
      analysis,
      recommendation: this.generateRecommendation(analysis),
    };
  }

  private async fetchFinancialData(symbol: string, period?: string) {
    return {
      symbol,
      revenue: 15000000000,
      netIncome: 2500000000,
      totalAssets: 100000000000,
      equity: 15000000000,
      liabilities: 85000000000,
      roe: 16.67,
      roa: 2.5,
      peRatio: 12.5,
      pbRatio: 1.8,
      debtToEquity: 0.65,
      currentRatio: 1.8,
      quickRatio: 1.5,
      dividendYield: 4.2,
      eps: 42.5,
    };
  }

  private performFinancialAnalysis(data: any) {
    const profitability = {
      roe: data.roe,
      roa: data.roa,
      netMargin: (data.netIncome / data.revenue) * 100,
      assessment: data.roe > 15 ? 'Strong' : data.roe > 10 ? 'Moderate' : 'Weak',
    };

    const liquidity = {
      currentRatio: data.currentRatio,
      quickRatio: data.quickRatio,
      assessment: data.currentRatio > 1.5 ? 'Strong' : data.currentRatio > 1 ? 'Moderate' : 'Weak',
    };

    const leverage = {
      debtToEquity: data.debtToEquity,
      assessment: data.debtToEquity < 0.5 ? 'Low' : data.debtToEquity < 1 ? 'Moderate' : 'High',
    };

    const valuation = {
      peRatio: data.peRatio,
      pbRatio: data.pbRatio,
      dividendYield: data.dividendYield,
      assessment: data.peRatio < 15 ? 'Undervalued' : data.peRatio < 25 ? 'Fair' : 'Overvalued',
    };

    return { profitability, liquidity, leverage, valuation };
  }

  private generateRecommendation(analysis: any) {
    const scores = {
      profitability: analysis.profitability.assessment === 'Strong' ? 3 : analysis.profitability.assessment === 'Moderate' ? 2 : 1,
      liquidity: analysis.liquidity.assessment === 'Strong' ? 3 : analysis.liquidity.assessment === 'Moderate' ? 2 : 1,
      leverage: analysis.leverage.assessment === 'Low' ? 3 : analysis.leverage.assessment === 'Moderate' ? 2 : 1,
      valuation: analysis.valuation.assessment === 'Undervalued' ? 3 : analysis.valuation.assessment === 'Fair' ? 2 : 1,
    };

    const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);

    if (totalScore >= 10) return { action: 'BUY', confidence: 'High' };
    if (totalScore >= 7) return { action: 'HOLD', confidence: 'Medium' };
    return { action: 'SELL', confidence: 'Medium' };
  }

  private async calculateMetrics(symbol: string, metrics: string[]) {
    const financialData = await this.fetchFinancialData(symbol);
    const calculated: Record<string, number> = {};

    for (const metric of metrics) {
      switch (metric.toLowerCase()) {
        case 'roe':
          calculated.ROE = financialData.roe;
          break;
        case 'roa':
          calculated.ROA = financialData.roa;
          break;
        case 'pe':
          calculated['P/E'] = financialData.peRatio;
          break;
        case 'pb':
          calculated['P/B'] = financialData.pbRatio;
          break;
        case 'de':
          calculated['D/E'] = financialData.debtToEquity;
          break;
      }
    }

    return { symbol, metrics: calculated };
  }

  private async assessFinancialHealth(symbol: string) {
    const financialData = await this.fetchFinancialData(symbol);
    
    const profitabilityScore = Math.min(100, (financialData.roe / 20) * 100);
    const liquidityScore = Math.min(100, (financialData.currentRatio / 2) * 100);
    const leverageScore = Math.max(0, 100 - (financialData.debtToEquity * 50));
    const overallScore = Math.round((profitabilityScore + liquidityScore + leverageScore) / 3);

    return {
      symbol,
      overallScore,
      rating: overallScore >= 70 ? 'Strong' : overallScore >= 50 ? 'Moderate' : 'Weak',
      breakdown: {
        profitability: Math.round(profitabilityScore),
        liquidity: Math.round(liquidityScore),
        leverage: Math.round(leverageScore),
      },
      factors: this.identifyKeyFactors(financialData),
    };
  }

  private identifyKeyFactors(data: any): string[] {
    const factors = [];
    if (data.roe > 15) factors.push('High ROE (>15%)');
    if (data.currentRatio > 1.5) factors.push('Strong liquidity');
    if (data.debtToEquity < 0.5) factors.push('Low debt');
    if (data.dividendYield > 3) factors.push('Good dividend yield');
    return factors;
  }

  private async compareCompanies(symbols: string[]) {
    const companies = await Promise.all(symbols.map(s => this.fetchFinancialData(s)));
    
    const comparison = {
      symbols,
      metrics: ['ROE', 'P/E', 'P/B', 'D/E', 'Current Ratio', 'Dividend Yield'],
      data: companies.map(c => ({
        symbol: c.symbol,
        ROE: c.roe,
        'P/E': c.peRatio,
        'P/B': c.pbRatio,
        'D/E': c.debtToEquity,
        'Current Ratio': c.currentRatio,
        'Dividend Yield': c.dividendYield,
      })),
      ranking: this.rankCompanies(companies),
    };

    return comparison;
  }

  private rankCompanies(companies: any[]) {
    const ranked = [...companies].sort((a, b) => b.roe - a.roe);
    return ranked.map((c, i) => ({ symbol: c.symbol, rank: i + 1 }));
  }
}

export class MacroTrendAgent extends BaseAgent {
  constructor() {
    super('macro_trend');
  }

  protected async processTask(task: AgentTask): Promise<any> {
    const { type, input } = task;

    switch (type) {
      case 'analyze_market':
        return this.analyzeMarket(input.market, input.period);
      case 'track_sectors':
        return this.trackSectors(input.sectors);
      case 'identify_patterns':
        return this.identifyPatterns(input.market);
      case 'forecast':
        return this.forecastMarket(input.market, input.timeframe);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  private async analyzeMarket(market: string, period?: string) {
    const marketData = await this.fetchMarketData(market, period);
    const trends = this.analyzeTrends(marketData);

    return {
      market,
      period: period || '1M',
      overview: this.generateOverview(marketData),
      trends,
      outlook: this.generateOutlook(trends),
    };
  }

  private async fetchMarketData(market: string, period?: string) {
    return {
      market,
      index: 2450.67,
      change: 1.2,
      volume: 45200000,
      advancing: 145,
      declining: 89,
      unchanged: 12,
      high52Week: 2600,
      low52Week: 1800,
      avgPE: 14.5,
      avgDividendYield: 3.2,
    };
  }

  private analyzeTrends(data: any) {
    return {
      shortTerm: data.change > 0 ? 'Bullish' : 'Bearish',
      mediumTerm: 'Bullish',
      longTerm: 'Bullish',
      momentum: 'Strong',
      volatility: 'Moderate',
    };
  }

  private generateOverview(data: any) {
    return {
      index: data.index,
      change: `${data.change > 0 ? '+' : ''}${data.change}%`,
      volume: `${(data.volume / 1000000).toFixed(1)}M`,
      marketStatus: data.change > 0 ? 'Green' : 'Red',
      advanceDecline: `${data.advancing}/${data.declining}`,
    };
  }

  private generateOutlook(trends: any) {
    if (trends.momentum === 'Strong' && trends.shortTerm === 'Bullish') {
      return 'Positive outlook with strong buying momentum';
    }
    return 'Neutral - monitor for key support/resistance levels';
  }

  private async trackSectors(sectors: string[]) {
    const sectorPerformance = await Promise.all(
      sectors.map(async (sector) => ({
        name: sector,
        change: Math.random() * 4 - 1,
        volume: Math.random() * 10000000 + 5000000,
        marketCap: Math.random() * 100000000000 + 50000000000,
        topPerformers: this.getTopPerformers(sector),
      }))
    );

    return {
      sectors: sectorPerformance.sort((a, b) => b.change - a.change),
      strongest: sectorPerformance[0],
      weakest: sectorPerformance[sectorPerformance.length - 1],
    };
  }

  private getTopPerformers(sector: string) {
    return ['NBL', 'NMB', 'NIB'].slice(0, 2);
  }

  private async identifyPatterns(market: string) {
    const historicalData = await this.fetchHistoricalData(market);
    const patterns = this.detectChartPatterns(historicalData);

    return {
      market,
      patterns,
      signals: this.generateSignals(patterns),
    };
  }

  private async fetchHistoricalData(market: string) {
    return Array.from({ length: 50 }, (_, i) => ({
      date: new Date(Date.now() - i * 86400000).toISOString(),
      close: 2400 + Math.random() * 100,
      volume: Math.random() * 50000000,
    }));
  }

  private detectChartPatterns(data: any[]) {
    return [
      { type: 'moving_average', signal: 'bullish', confidence: 75 },
      { type: 'support_level', price: 2350, confidence: 80 },
      { type: 'resistance_level', price: 2500, confidence: 70 },
    ];
  }

  private generateSignals(patterns: any[]) {
    return patterns.map(p => ({
      ...p,
      action: p.signal === 'bullish' ? 'BUY' : 'SELL',
    }));
  }

  private async forecastMarket(market: string, timeframe: string) {
    const currentData = await this.fetchMarketData(market);
    const historicalTrends = await this.analyzeHistoricalTrends(market);
    
    return {
      market,
      timeframe,
      currentLevel: currentData.index,
      forecast: this.generateForecast(historicalTrends, timeframe),
      confidence: 65,
      factors: ['Earnings season', 'Global markets', 'Local economic indicators'],
    };
  }

  private async analyzeHistoricalTrends(market: string) {
    return { trend: 'upward', strength: 0.7 };
  }

  private generateForecast(historical: any, timeframe: string) {
    const multipliers: Record<string, number> = {
      '1W': 1.01,
      '1M': 1.05,
      '3M': 1.15,
      '6M': 1.25,
      '1Y': 1.4,
    };

    const basePrice = 2450;
    return {
      target: Math.round(basePrice * (multipliers[timeframe] || 1.1)),
      direction: 'up',
      probability: 60,
    };
  }
}

export class MarketSentimentAgent extends BaseAgent {
  constructor() {
    super('market_sentiment');
  }

  protected async processTask(task: AgentTask): Promise<any> {
    const { type, input } = task;

    switch (type) {
      case 'analyze_news':
        return this.analyzeNews(input.symbols);
      case 'social_sentiment':
        return this.analyzeSocialSentiment(input.symbols);
      case 'investor_sentiment':
        return this.analyzeInvestorSentiment(input.market);
      case 'trend_analysis':
        return this.analyzeSentimentTrends(input.symbols, input.period);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  private async analyzeNews(symbols: string[]) {
    const newsAnalysis = await Promise.all(
      symbols.map(async (symbol) => ({
        symbol,
        articles: await this.fetchNews(symbol),
        sentiment: this.calculateSentiment(await this.fetchNews(symbol)),
      }))
    );

    return {
      symbols,
      analysis: newsAnalysis,
      overallSentiment: this.calculateOverallSentiment(newsAnalysis),
      keyDrivers: this.identifyKeyDrivers(newsAnalysis),
    };
  }

  private async fetchNews(symbol: string) {
    return [
      { title: `${symbol} reports strong Q4 earnings`, sentiment: 'positive', source: 'The Kathmandu Post' },
      { title: `${symbol} announces dividend hike`, sentiment: 'positive', source: 'Business News' },
      { title: `Analysts upgrade ${symbol} to BUY`, sentiment: 'positive', source: 'Research Report' },
    ];
  }

  private calculateSentiment(articles: any[]) {
    const scores = { positive: 0, negative: 0, neutral: 0 };
    articles.forEach(a => scores[a.sentiment as keyof typeof scores]++);
    
    const total = articles.length;
    return {
      positive: (scores.positive / total) * 100,
      negative: (scores.negative / total) * 100,
      neutral: (scores.neutral / total) * 100,
      score: ((scores.positive - scores.negative) / total) * 100,
    };
  }

  private calculateOverallSentiment(analyses: any[]) {
    const avgScore = analyses.reduce((sum, a) => sum + a.sentiment.score, 0) / analyses.length;
    
    return {
      score: avgScore,
      label: avgScore > 20 ? 'Bullish' : avgScore < -20 ? 'Bearish' : 'Neutral',
      confidence: 75,
    };
  }

  private identifyKeyDrivers(analyses: any[]) {
    return [
      'Strong earnings performance',
      'Positive analyst recommendations',
      'Dividend growth outlook',
    ];
  }

  private async analyzeSocialSentiment(symbols: string[]) {
    return {
      symbols,
      platformBreakdown: {
        twitter: { mentions: 1250, sentiment: 65 },
        reddit: { mentions: 340, sentiment: 58 },
        news: { mentions: 89, sentiment: 72 },
      },
      overall: { score: 65, label: 'Positive' },
      trendingTopics: ['#NBL', '#NepalStocks', '#NEPSE'],
    };
  }

  private async analyzeInvestorSentiment(market: string) {
    return {
      market,
      fearGreedIndex: 65,
      label: 'Greed',
      components: {
        putCallRatio: 0.8,
        vix: 15.2,
        marketMomentum: 1.2,
        junkBondDemand: 0.9,
      },
      investorBehavior: 'Risk-on',
    };
  }

  private async analyzeSentimentTrends(symbols: string[], period: string) {
    return {
      symbols,
      period,
      trends: [
        { date: '2024-01', sentiment: 55 },
        { date: '2024-02', sentiment: 58 },
        { date: '2024-03', sentiment: 62 },
        { date: '2024-04', sentiment: 65 },
      ],
      prediction: 'Continuing positive trend',
    };
  }
}

export class PortfolioStrategyAgent extends BaseAgent {
  constructor() {
    super('portfolio_strategy');
  }

  protected async processTask(task: AgentTask): Promise<any> {
    const { type, input } = task;

    switch (type) {
      case 'optimize':
        return this.optimizePortfolio(input.holdings, input.constraints);
      case 'rebalance':
        return this.suggestRebalancing(input.portfolio);
      case 'risk_assess':
        return this.assessPortfolioRisk(input.portfolio);
      case 'generate_report':
        return this.generateStrategyReport(input.type);
      default:
        throw new Error(`Unknown task type: ${type}`);
    }
  }

  private async optimizePortfolio(holdings: any[], constraints: any) {
    const optimized = this.performOptimization(holdings, constraints);
    
    return {
      current: holdings,
      optimized: optimized.allocation,
      expectedReturn: optimized.expectedReturn,
      risk: optimized.risk,
      sharpeRatio: optimized.sharpeRatio,
      changes: this.calculateChanges(holdings, optimized.allocation),
    };
  }

  private performOptimization(holdings: any[], constraints: any) {
    return {
      allocation: holdings.map(h => ({
        ...h,
        targetWeight: Math.random() * 30 + 5,
      })),
      expectedReturn: 12.5,
      risk: 15.2,
      sharpeRatio: 0.82,
    };
  }

  private calculateChanges(current: any[], target: any[]) {
    return target.map(t => {
      const c = current.find((x: any) => x.symbol === t.symbol);
      return {
        symbol: t.symbol,
        currentWeight: c?.weight || 0,
        targetWeight: t.targetWeight,
        action: t.targetWeight > (c?.weight || 0) ? 'BUY' : 'SELL',
        amount: Math.abs(t.targetWeight - (c?.weight || 0)) / 100 * 1000000,
      };
    });
  }

  private async suggestRebalancing(portfolio: any) {
    const currentAllocation = portfolio.allocation || [];
    const targetAllocation = this.calculateTargetAllocation(currentAllocation);
    const drifts = this.calculateDrift(currentAllocation, targetAllocation);
    
    const needsRebalance = drifts.some((d: any) => Math.abs(d.drift) > 5);

    return {
      needsRebalance,
      currentAllocation,
      targetAllocation,
      drifts,
      recommendations: this.generateRebalanceRecommendations(drifts),
      estimatedTaxImpact: needsRebalance ? 2500 : 0,
    };
  }

  private calculateTargetAllocation(current: any[]) {
    return current.map(c => ({ ...c, targetWeight: 25 }));
  }

  private calculateDrift(current: any[], target: any[]) {
    return target.map(t => {
      const c = current.find((x: any) => x.symbol === t.symbol);
      return {
        symbol: t.symbol,
        current: c?.weight || 0,
        target: t.targetWeight,
        drift: (c?.weight || 0) - t.targetWeight,
      };
    });
  }

  private generateRebalanceRecommendations(drifts: any[]) {
    return drifts
      .filter(d => Math.abs(d.drift) > 5)
      .map(d => ({
        symbol: d.symbol,
        action: d.drift > 0 ? 'SELL' : 'BUY',
        amount: Math.abs(d.drift) / 100 * 1000000,
      }));
  }

  private async assessPortfolioRisk(portfolio: any) {
    const riskMetrics = this.calculateRiskMetrics(portfolio);
    
    return {
      portfolio,
      riskScore: riskMetrics.score,
      riskLevel: riskMetrics.score > 70 ? 'High' : riskMetrics.score > 40 ? 'Moderate' : 'Low',
      metrics: riskMetrics.breakdown,
      var95: riskMetrics.var95,
      recommendations: this.generateRiskRecommendations(riskMetrics),
    };
  }

  private calculateRiskMetrics(portfolio: any) {
    return {
      score: 55,
      breakdown: {
        volatility: 65,
        concentration: 70,
        leverage: 40,
        correlation: 50,
      },
      var95: 12500,
    };
  }

  private generateRiskRecommendations(metrics: any) {
    const recommendations = [];
    
    if (metrics.breakdown.concentration > 60) {
      recommendations.push('Consider diversifying across more sectors');
    }
    if (metrics.breakdown.volatility > 60) {
      recommendations.push('Add defensive positions to reduce volatility');
    }
    
    return recommendations;
  }

  private async generateStrategyReport(type: string) {
    return {
      type,
      generatedAt: new Date().toISOString(),
      summary: this.generateSummary(),
      sections: this.generateSections(type),
    };
  }

  private generateSummary() {
    return 'Portfolio showing positive returns with moderate risk. Banking sector concentration requires attention.';
  }

  private generateSections(type: string) {
    return [
      { title: 'Performance', content: 'YTD return: +12.5%' },
      { title: 'Allocation', content: 'Banking: 45%, Hydro: 30%, Insurance: 15%' },
      { title: 'Risk', content: 'Moderate risk with concentration in banking sector' },
      { title: 'Recommendations', content: 'Consider rebalancing to reduce concentration risk' },
    ];
  }
}
