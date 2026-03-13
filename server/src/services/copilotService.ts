import {
  CopilotConversation,
  CopilotMessage,
  CopilotContext,
  CopilotResponse,
  ExtractedEntity,
  Intent,
  COPILOT_INTENTS,
  Source,
} from './copilotTypes';

const COMPANY_ALIASES: Record<string, string> = {
  nbl: 'NBL',
  nmb: 'NMB',
  nib: 'NIB',
  nibl: 'NIBL',
  'nic asia': 'NIC',
  'prabhu bank': 'PRABHU',
  'sanima bank': 'SANIMA',
  'machha': 'MCH',
  ntc: 'NTC',
  ncell: 'NCELL',
  vhl: 'VHL',
};

const CONCEPT_DEFINITIONS: Record<string, { definition: string; formula?: string; interpretation?: string }> = {
  'roe': {
    definition: 'Return on Equity (ROE) measures how efficiently a company uses shareholder equity to generate profits.',
    formula: 'ROE = Net Income / Shareholder Equity × 100',
    interpretation: 'Higher ROE indicates better efficiency. >15% is generally considered good.',
  },
  'roa': {
    definition: 'Return on Assets (ROA) measures how efficiently a company uses its assets to generate earnings.',
    formula: 'ROA = Net Income / Total Assets × 100',
    interpretation: 'Higher is better. >5% is generally considered good.',
  },
  'pe ratio': {
    definition: 'Price-to-Earnings ratio measures a company\'s current share price relative to its per-share earnings.',
    formula: 'P/E = Market Price per Share / Earnings per Share',
    interpretation: 'Lower may indicate undervalued. Higher may indicate growth expectations.',
  },
  'pb ratio': {
    definition: 'Price-to-Book ratio measures a company\'s market value relative to its book value.',
    formula: 'P/B = Market Cap / Total Equity',
    interpretation: '<1 may indicate undervalued. >3 may indicate overvalued.',
  },
  'market cap': {
    definition: 'Market Capitalization is the total market value of a company\'s outstanding shares.',
    formula: 'Market Cap = Share Price × Shares Outstanding',
    interpretation: 'Large cap >$10B, Mid cap $2-10B, Small cap <$2B',
  },
  'dividend yield': {
    definition: 'Dividend Yield shows the annual dividend payment relative to the share price.',
    formula: 'Dividend Yield = Annual Dividend / Share Price × 100',
    interpretation: 'Higher yield is attractive but consider sustainability.',
  },
  'debt to equity': {
    definition: 'Debt-to-Equity ratio measures a company\'s financial leverage.',
    formula: 'D/E = Total Liabilities / Shareholder Equity',
    interpretation: 'Lower is generally safer. >2 may indicate high risk.',
  },
  'eps': {
    definition: 'Earnings Per Share measures a company\'s profit allocated to each share.',
    formula: 'EPS = Net Income / Shares Outstanding',
    interpretation: 'Higher EPS indicates more profit per share.',
  },
  'current ratio': {
    definition: 'Current Ratio measures a company\'s ability to pay short-term obligations.',
    formula: 'Current Ratio = Current Assets / Current Liabilities',
    interpretation: '>1.5 is generally healthy.',
  },
  'beta': {
    definition: 'Beta measures a stock\'s volatility relative to the market.',
    formula: 'Beta = Covariance(Stock, Market) / Variance(Market)',
    interpretation: '<1 less volatile than market, >1 more volatile.',
  },
};

type Tier = 'basic' | 'pro' | 'investor';

export class CopilotService {
  private conversationHistory: Map<string, CopilotConversation> = new Map();

  async processMessage(
    userId: string,
    message: string,
    context: CopilotContext
  ): Promise<CopilotResponse> {
    const startTime = Date.now();
    
    const intent = this.identifyIntent(message);
    const entities = this.extractEntities(message);
    
    if (!intent) {
      return this.createErrorResponse('I didn\'t understand that. Try asking about a company, concept, or your portfolio.');
    }

    const tierMap: Record<string, Tier> = { FREE: 'basic', PRO: 'pro', INVESTOR: 'investor' };
    const userTier = tierMap[context.subscriptionPlan] || 'basic';
    const requiredTier = tierMap[intent.tier] || 'basic';

    if (!this.hasAccess(userTier, requiredTier)) {
      return this.createUpgradeResponse(intent.tier);
    }

    let response: CopilotResponse;

    switch (intent.name) {
      case 'explain_concept':
        response = await this.handleExplainConcept(entities, context);
        break;
      case 'analyze_company':
        response = await this.handleAnalyzeCompany(entities, context);
        break;
      case 'compare_companies':
        response = await this.handleCompareCompanies(entities, context);
        break;
      case 'portfolio_analysis':
        response = await this.handlePortfolioAnalysis(context);
        break;
      case 'market_overview':
        response = await this.handleMarketOverview(entities, context);
        break;
      case 'financial_health':
        response = await this.handleFinancialHealth(entities, context);
        break;
      case 'risk_analysis':
        response = await this.handleRiskAnalysis(entities, context);
        break;
      case 'sector_analysis':
        response = await this.handleSectorAnalysis(entities, context);
        break;
      case 'get_investment_recommendation':
        response = await this.handleInvestmentRecommendations(context);
        break;
      default:
        response = await this.handleGeneralQuery(message, context);
    }

    response.metadata.processingTime = Date.now() - startTime;
    return response;
  }

  private identifyIntent(message: string): Intent | null {
    const lowerMessage = message.toLowerCase();
    
    for (const intent of COPILOT_INTENTS) {
      for (const example of intent.examples) {
        const similarity = this.calculateSimilarity(lowerMessage, example.toLowerCase());
        if (similarity > 0.6) {
          return intent;
        }
      }
    }
    
    for (const intent of COPILOT_INTENTS) {
      if (lowerMessage.includes(intent.name.replace('_', ' '))) {
        return intent;
      }
    }
    
    return null;
  }

  private calculateSimilarity(str1: string, str2: string): number {
    const words1 = new Set(str1.split(' '));
    const words2 = new Set(str2.split(' '));
    const intersection = new Set([...words1].filter(x => words2.has(x)));
    return intersection.size / Math.max(words1.size, words2.size);
  }

  private extractEntities(message: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];
    const lowerMessage = message.toLowerCase();

    for (const [alias, symbol] of Object.entries(COMPANY_ALIASES)) {
      if (lowerMessage.includes(alias)) {
        entities.push({
          type: 'company',
          value: symbol,
          confidence: 0.9,
        });
      }
    }

    for (const concept of Object.keys(CONCEPT_DEFINITIONS)) {
      if (lowerMessage.includes(concept)) {
        entities.push({
          type: 'concept',
          value: concept,
          confidence: 0.95,
        });
      }
    }

    const sectors = ['banking', 'hydro', 'power', 'insurance', 'mutual fund', 'hotels', 'manufacturing'];
    for (const sector of sectors) {
      if (lowerMessage.includes(sector)) {
        entities.push({
          type: 'sector',
          value: sector,
          confidence: 0.8,
        });
      }
    }

    return entities;
  }

  private hasAccess(userTier: Tier, requiredTier: Tier): boolean {
    const tierLevels: Record<Tier, number> = { basic: 1, pro: 2, investor: 3 };
    return tierLevels[userTier] >= tierLevels[requiredTier];
  }

  private createErrorResponse(error: string): CopilotResponse {
    return {
      message: error,
      type: 'text',
      metadata: {
        intent: 'error',
        confidence: 0,
        processingTime: 0,
        cached: false,
        tier: 'basic',
      },
    };
  }

  private createUpgradeResponse(requiredTier: string): CopilotResponse {
    return {
      message: `This feature requires a ${requiredTier} subscription. Would you like to upgrade to access this feature?`,
      type: 'action',
      actions: [
        {
          type: 'open_page',
          label: 'Upgrade Plan',
          payload: { page: '/pricing' },
        },
      ],
      metadata: {
        intent: 'upgrade',
        confidence: 1,
        processingTime: 0,
        cached: false,
        tier: requiredTier.toLowerCase() as Tier,
      },
    };
  }

  private async handleExplainConcept(entities: ExtractedEntity[], context: CopilotContext): Promise<CopilotResponse> {
    const conceptEntity = entities.find(e => e.type === 'concept');
    
    if (!conceptEntity) {
      return {
        message: 'Which financial concept would you like me to explain? Try asking about ROE, P/E ratio, market cap, or dividend yield.',
        type: 'text',
        suggestions: Object.keys(CONCEPT_DEFINITIONS),
        metadata: {
          intent: 'explain_concept',
          confidence: 0.5,
          processingTime: 0,
          cached: false,
          tier: 'basic',
        },
      };
    }

    const concept = CONCEPT_DEFINITIONS[conceptEntity.value.toLowerCase()];
    if (!concept) {
      return this.createErrorResponse(`I don't have information about "${conceptEntity.value}".`);
    }

    let response = `**${conceptEntity.value.toUpperCase()}**\n\n${concept.definition}\n\n`;
    if (concept.formula) {
      response += `**Formula:** ${concept.formula}\n\n`;
    }
    if (concept.interpretation) {
      response += `**How to interpret:** ${concept.interpretation}`;
    }

    return {
      message: response,
      type: 'text',
      suggestions: Object.keys(CONCEPT_DEFINITIONS).filter(c => c !== conceptEntity.value.toLowerCase()),
      metadata: {
        intent: 'explain_concept',
        confidence: conceptEntity.confidence,
        processingTime: 0,
        cached: true,
        tier: 'basic',
      },
    };
  }

  private async handleAnalyzeCompany(entities: ExtractedEntity[], context: CopilotContext): Promise<CopilotResponse> {
    const companyEntity = entities.find(e => e.type === 'company');
    
    if (!companyEntity) {
      return {
        message: 'Which company would you like me to analyze? Please provide a company name or symbol.',
        type: 'text',
        suggestions: ['NBL', 'NMB', 'NIC', 'SANIMA'],
        metadata: {
          intent: 'analyze_company',
          confidence: 0.5,
          processingTime: 0,
          cached: false,
          tier: 'basic',
        },
      };
    }

    const symbol = companyEntity.value;
    const analysis = await this.generateCompanyAnalysis(symbol, context);

    return {
      message: analysis.summary,
      type: 'analysis',
      data: analysis,
      sources: analysis.sources,
      metadata: {
        intent: 'analyze_company',
        confidence: companyEntity.confidence,
        processingTime: 0,
        cached: false,
        tier: 'basic',
      },
    };
  }

  private async generateCompanyAnalysis(symbol: string, context: CopilotContext) {
    const financialData = await this.getCompanyFinancials(symbol);
    const healthScore = this.calculateHealthScore(financialData);
    const prediction = await this.getPrediction(symbol);
    
    return {
      symbol,
      summary: `**${symbol} Analysis**\n\nBased on my analysis, ${symbol} shows ${healthScore.overall >= 70 ? 'strong' : healthScore.overall >= 50 ? 'moderate' : 'weak'} financial health with a score of ${healthScore.overall}/100.\n\n**Key Metrics:**\n- ROE: ${financialData.roe?.toFixed(2)}%\n- P/E Ratio: ${financialData.peRatio?.toFixed(2)}\n- Debt/Equity: ${financialData.debtToEquity?.toFixed(2)}\n- Current Ratio: ${financialData.currentRatio?.toFixed(2)}\n\n**Recommendation:** ${healthScore.overall >= 70 ? 'BUY' : healthScore.overall >= 50 ? 'HOLD' : 'SELL'} (Confidence: ${prediction?.confidence || 'N/A'}%)`,
      healthScore,
      financials: financialData,
      prediction,
      sources: [
        { type: 'company' as const, id: symbol, title: `${symbol} Financial Data` },
        { type: 'market_data' as const, id: symbol, title: `${symbol} Market Data` },
      ],
    };
  }

  private async getCompanyFinancials(symbol: string): Promise<any> {
    return {
      symbol,
      revenue: 15000000000,
      netIncome: 2500000000,
      totalAssets: 100000000000,
      equity: 15000000000,
      roe: 16.67,
      peRatio: 12.5,
      pbRatio: 1.8,
      debtToEquity: 0.65,
      currentRatio: 1.8,
      quickRatio: 1.5,
      dividendYield: 4.2,
    };
  }

  private calculateHealthScore(financialData: any): any {
    const profitability = Math.min(100, (financialData.roe / 20) * 100);
    const liquidity = Math.min(100, (financialData.currentRatio / 2) * 100);
    const leverage = Math.max(0, 100 - (financialData.debtToEquity * 50));
    const overall = Math.round((profitability + liquidity + leverage) / 3);
    
    return {
      overall,
      rating: overall >= 70 ? 'Strong' : overall >= 50 ? 'Moderate' : 'Weak',
      profitability: Math.round(profitability),
      liquidity: Math.round(liquidity),
      leverage: Math.round(leverage),
      efficiency: 70,
    };
  }

  private async getPrediction(symbol: string): Promise<any> {
    return {
      symbol,
      direction: 'bullish',
      confidence: 72,
      targetPrice: 500,
      timeframe: '3 months',
    };
  }

  private async handleCompareCompanies(entities: ExtractedEntity[], context: CopilotContext): Promise<CopilotResponse> {
    const companies = entities.filter(e => e.type === 'company').map(e => e.value);
    
    if (companies.length < 2) {
      return {
        message: 'Please provide at least two companies to compare.',
        type: 'text',
        suggestions: ['NBL vs NMB', 'NIB vs SANIMA'],
        metadata: {
          intent: 'compare_companies',
          confidence: 0.5,
          processingTime: 0,
          cached: false,
          tier: 'pro',
        },
      };
    }

    const comparison = await this.compareCompanies(companies);

    return {
      message: `**${companies.join(' vs ')} Comparison**\n\n${comparison.table}`,
      type: 'table',
      data: comparison,
      metadata: {
        intent: 'compare_companies',
        confidence: 0.9,
        processingTime: 0,
        cached: false,
        tier: 'pro',
      },
    };
  }

  private async compareCompanies(symbols: string[]): Promise<any> {
    const companies = await Promise.all(symbols.map(s => this.getCompanyFinancials(s)));
    
    const metrics = ['ROE', 'P/E', 'P/B', 'D/E', 'Current Ratio', 'Dividend Yield'];
    const table = metrics.map(metric => {
      const row = [metric];
      for (const company of companies) {
        switch (metric) {
          case 'ROE': row.push(`${company.roe?.toFixed(2)}%`); break;
          case 'P/E': row.push(company.peRatio?.toFixed(2)); break;
          case 'P/B': row.push(company.pbRatio?.toFixed(2)); break;
          case 'D/E': row.push(company.debtToEquity?.toFixed(2)); break;
          case 'Current Ratio': row.push(company.currentRatio?.toFixed(2)); break;
          case 'Dividend Yield': row.push(`${company.dividendYield?.toFixed(2)}%`); break;
        }
      }
      return row.join(' | ');
    }).join('\n');

    const winner = companies[0].roe > companies[1].roe ? symbols[0] : symbols[1];

    return {
      symbols,
      table,
      winner,
      recommendation: `${winner} has stronger fundamentals based on the comparison.`,
    };
  }

  private async handlePortfolioAnalysis(context: CopilotContext): Promise<CopilotResponse> {
    if (!context.portfolioIds?.length) {
      return {
        message: 'You don\'t have any portfolios yet. Would you like to create one?',
        type: 'action',
        actions: [
          { type: 'open_page', label: 'Create Portfolio', payload: { page: '/portfolio/new' } },
        ],
        metadata: {
          intent: 'portfolio_analysis',
          confidence: 1,
          processingTime: 0,
          cached: false,
          tier: 'pro',
        },
      };
    }

    const portfolioSummary = await this.generatePortfolioSummary(context.portfolioIds[0]);

    return {
      message: portfolioSummary.summary,
      type: 'analysis',
      data: portfolioSummary,
      metadata: {
        intent: 'portfolio_analysis',
        confidence: 1,
        processingTime: 0,
        cached: false,
        tier: 'pro',
      },
    };
  }

  private async generatePortfolioSummary(portfolioId: string): Promise<any> {
    return {
      portfolioId,
      summary: 'Your portfolio is currently showing a **+5.2%** return this month.\n\n**Allocation:**\n- Banking: 45%\n- Hydro: 30%\n- Insurance: 15%\n- Others: 10%\n\n**Risk Score:** Moderate\n\n**Recommendation:** Consider rebalancing to reduce banking sector concentration.',
      totalValue: 1000000,
      returns: { day: 0.5, month: 5.2, year: 12.8 },
      allocation: [
        { sector: 'Banking', percentage: 45 },
        { sector: 'Hydro', percentage: 30 },
        { sector: 'Insurance', percentage: 15 },
        { sector: 'Others', percentage: 10 },
      ],
    };
  }

  private async handleMarketOverview(entities: ExtractedEntity[], context: CopilotContext): Promise<CopilotResponse> {
    const sectorEntity = entities.find(e => e.type === 'sector');
    
    if (sectorEntity) {
      const sectorAnalysis = await this.analyzeSector(sectorEntity.value);
      return {
        message: sectorAnalysis.summary,
        type: 'analysis',
        data: sectorAnalysis,
        metadata: {
          intent: 'market_overview',
          confidence: 0.8,
          processingTime: 0,
          cached: false,
          tier: 'basic',
        },
      };
    }

    return {
      message: '**NEPSE Market Overview**\n\n• Index: 2,450.67 (+1.2%)\n• Volume: 45.2M shares\n• Top Gainers: NBL (+3.2%), NMB (+2.1%)\n• Top Losers: VHL (-1.8%), SHIVM (-1.2%)\n\nThe market is showing **bullish** momentum today.',
      type: 'text',
      suggestions: ['Analyze banking sector', 'Show top gainers', 'What about hydro?'],
      metadata: {
        intent: 'market_overview',
        confidence: 0.9,
        processingTime: 0,
        cached: false,
        tier: 'basic',
      },
    };
  }

  private async analyzeSector(sector: string): Promise<any> {
    return {
      sector,
      summary: `**${sector.toUpperCase()} Sector Analysis**\n\nThe sector is showing **positive** momentum with average gains of 2.5% this week.\n\n**Key Metrics:**\n• Average P/E: 12.3\n• Average ROE: 15.2%\n• Market Cap: NPR 500B\n\n**Outlook:** Stable with growth potential in select stocks.`,
      metrics: { pe: 12.3, roe: 15.2, marketCap: 500000000000 },
    };
  }

  private async handleFinancialHealth(entities: ExtractedEntity[], context: CopilotContext): Promise<CopilotResponse> {
    const companyEntity = entities.find(e => e.type === 'company');
    
    if (!companyEntity) {
      return this.createErrorResponse('Please specify a company to analyze.');
    }

    const financialData = await this.getCompanyFinancials(companyEntity.value);
    const healthScore = this.calculateHealthScore(financialData);

    return {
      message: `**${companyEntity.value} Financial Health**\n\n**Overall Score:** ${healthScore.overall}/100 (${healthScore.rating})\n\n**Breakdown:**\n• Profitability: ${healthScore.profitability}/100\n• Liquidity: ${healthScore.liquidity}/100\n• Leverage: ${healthScore.leverage}/100\n• Efficiency: ${healthScore.efficiency}/100\n\n${healthScore.overall >= 70 ? '✓ Strong financial position' : healthScore.overall >= 50 ? '⚠ Moderate financial position' : '✗ Weak financial position'}`,
      type: 'analysis',
      data: healthScore,
      metadata: {
        intent: 'financial_health',
        confidence: 0.9,
        processingTime: 0,
        cached: false,
        tier: 'pro',
      },
    };
  }

  private async handleRiskAnalysis(entities: ExtractedEntity[], context: CopilotContext): Promise<CopilotResponse> {
    const companyEntity = entities.find(e => e.type === 'company');
    
    if (!companyEntity) {
      return this.createErrorResponse('Please specify a company for risk analysis.');
    }

    const financialData = await this.getCompanyFinancials(companyEntity.value);
    const riskFactors = this.analyzeRiskFactors(financialData);

    return {
      message: `**${companyEntity.value} Risk Analysis**\n\n**Risk Level:** ${riskFactors.level}\n\n**Key Risk Factors:**\n${riskFactors.factors.map((f: string, i: number) => `${i + 1}. ${f}`).join('\n')}\n\n**Mitigation:** ${riskFactors.mitigation}`,
      type: 'analysis',
      data: riskFactors,
      metadata: {
        intent: 'risk_analysis',
        confidence: 0.85,
        processingTime: 0,
        cached: false,
        tier: 'pro',
      },
    };
  }

  private analyzeRiskFactors(financialData: any): any {
    const factors: string[] = [];
    let riskScore = 0;

    if (financialData.debtToEquity > 1) {
      factors.push('High debt levels (D/E > 1)');
      riskScore += 25;
    }
    if (financialData.currentRatio < 1) {
      factors.push('Low liquidity (Current Ratio < 1)');
      riskScore += 20;
    }
    if (financialData.roe < 10) {
      factors.push('Low profitability (ROE < 10%)');
      riskScore += 15;
    }

    return {
      level: riskScore < 20 ? 'Low' : riskScore < 40 ? 'Medium' : 'High',
      factors,
      riskScore,
      mitigation: 'Diversify portfolio and set stop-loss orders.',
    };
  }

  private async handleSectorAnalysis(entities: ExtractedEntity[], context: CopilotContext): Promise<CopilotResponse> {
    const sectorEntity = entities.find(e => e.type === 'sector');
    
    if (!sectorEntity) {
      return {
        message: 'Which sector would you like me to analyze?',
        type: 'text',
        suggestions: ['Banking', 'Hydro Power', 'Insurance', 'Mutual Fund'],
        metadata: {
          intent: 'sector_analysis',
          confidence: 0.5,
          processingTime: 0,
          cached: false,
          tier: 'investor',
        },
      };
    }

    const sectorData = await this.generateSectorAnalysis(sectorEntity.value);

    return {
      message: sectorData.summary,
      type: 'analysis',
      data: sectorData,
      metadata: {
        intent: 'sector_analysis',
        confidence: 0.9,
        processingTime: 0,
        cached: false,
        tier: 'investor',
      },
    };
  }

  private async generateSectorAnalysis(sector: string): Promise<any> {
    return {
      sector,
      summary: `**${sector.toUpperCase()} Sector Deep Dive**\n\n**Market Cap:** NPR 500B\n**Companies:** 25\n**Avg P/E:** 12.3\n**Avg ROE:** 15.2%\n\n**Top Picks:**\n1. NBL - Strong fundamentals\n2. NMB - Good growth potential\n3. NIB - Undervalued\n\n**Outlook:** Positive with moderate risk.`,
      topPicks: ['NBL', 'NMB', 'NIB'],
    };
  }

  private async handleInvestmentRecommendations(context: CopilotContext): Promise<CopilotResponse> {
    const recommendations = await this.generateRecommendations(context);

    return {
      message: `**Investment Recommendations**\n\nBased on your ${context.preferences?.riskTolerance || 'moderate'} risk tolerance:\n\n**Strong Buy:**\n• NBL - Strong ROE, undervalued\n• NMB - Good growth potential\n\n**Hold:**\n• SANIMA - Fair value\n\n**Avoid:**\n• VHL - High risk\n\n*Note: These are not financial advice. Do your own research.*`,
      type: 'recommendation',
      data: recommendations,
      metadata: {
        intent: 'get_investment_recommendation',
        confidence: 0.75,
        processingTime: 0,
        cached: false,
        tier: 'pro',
      },
    };
  }

  private async generateRecommendations(context: CopilotContext): Promise<any> {
    return {
      strongBuy: [
        { symbol: 'NBL', rationale: 'Strong ROE, undervalued' },
        { symbol: 'NMB', rationale: 'Good growth potential' },
      ],
      hold: [
        { symbol: 'SANIMA', rationale: 'Fair value' },
      ],
      avoid: [
        { symbol: 'VHL', rationale: 'High risk' },
      ],
    };
  }

  private async handleGeneralQuery(message: string, context: CopilotContext): Promise<CopilotResponse> {
    return {
      message: `I can help you with:\n\n• **Company Analysis** - "Analyze NBL"\n• **Concept Explanation** - "What is ROE?"\n• **Portfolio Review** - "How is my portfolio?"\n• **Market Overview** - "How is NEPSE doing?"\n• **Recommendations** - "What should I invest in?"\n\nWhat would you like to know?`,
      type: 'text',
      metadata: {
        intent: 'general',
        confidence: 0.5,
        processingTime: 0,
        cached: false,
        tier: 'basic',
      },
    };
  }

  async createConversation(userId: string, title?: string): Promise<CopilotConversation> {
    const conversation: CopilotConversation = {
      id: `conv_${Date.now()}`,
      userId,
      title: title || 'New Conversation',
      messages: [],
      context: {
        userId,
        subscriptionPlan: 'FREE',
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    
    this.conversationHistory.set(conversation.id, conversation);
    return conversation;
  }

  async getConversation(conversationId: string): Promise<CopilotConversation | null> {
    return this.conversationHistory.get(conversationId) || null;
  }
}

export const copilotService = new CopilotService();
