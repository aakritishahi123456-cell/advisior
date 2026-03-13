import {
  AgentRole,
  AgentTask,
  AgentResult,
  AgentMessage,
  AgentConfig,
} from './researchSwarmTypes';
import {
  BaseAgent,
  CompanyAnalysisAgent,
  MacroTrendAgent,
  MarketSentimentAgent,
  PortfolioStrategyAgent,
} from './researchAgents';

export interface SwarmConfig {
  agents: AgentRole[];
  parallelExecution: boolean;
  maxConcurrent: number;
  timeout: number;
  retryFailed: boolean;
}

export interface ResearchRequest {
  type: 'company' | 'market' | 'portfolio' | 'comprehensive';
  symbols?: string[];
  market?: string;
  portfolio?: any;
  constraints?: any;
  period?: string;
}

export interface MarketIntelligenceReport {
  id: string;
  type: string;
  generatedAt: Date;
  request: ResearchRequest;
  agentResults: AgentResult[];
  synthesized: SynthesizedReport;
  confidence: number;
  nextUpdate: Date;
}

export interface SynthesizedReport {
  title: string;
  summary: string;
  sections: ReportSection[];
  recommendations: ReportRecommendation[];
  dataSources: string[];
}

export interface ReportSection {
  title: string;
  content: string;
  source: AgentRole;
  keyMetrics?: Record<string, any>;
}

export interface ReportRecommendation {
  id: string;
  type: 'buy' | 'sell' | 'hold' | 'rebalance' | 'watch';
  target: string;
  rationale: string;
  confidence: number;
  priority: 'high' | 'medium' | 'low';
}

export class ResearchSwarmOrchestrator {
  private agents: Map<AgentRole, BaseAgent> = new Map();
  private messageQueue: AgentMessage[] = [];
  private config: SwarmConfig;

  constructor(config?: Partial<SwarmConfig>) {
    this.config = {
      agents: ['company_analysis', 'macro_trend', 'market_sentiment', 'portfolio_strategy'],
      parallelExecution: true,
      maxConcurrent: 4,
      timeout: 60000,
      retryFailed: true,
      ...config,
    };

    this.initializeAgents();
  }

  private initializeAgents(): void {
    this.agents.set('company_analysis', new CompanyAnalysisAgent());
    this.agents.set('macro_trend', new MacroTrendAgent());
    this.agents.set('market_sentiment', new MarketSentimentAgent());
    this.agents.set('portfolio_strategy', new PortfolioStrategyAgent());
  }

  getAgent(role: AgentRole): BaseAgent | undefined {
    return this.agents.get(role);
  }

  getAllAgents(): BaseAgent[] {
    return Array.from(this.agents.values());
  }

  async executeResearch(request: ResearchRequest): Promise<MarketIntelligenceReport> {
    const startTime = Date.now();
    const tasks = this.createTasks(request);
    
    let agentResults: AgentResult[];

    if (this.config.parallelExecution) {
      agentResults = await this.executeParallel(tasks);
    } else {
      agentResults = await this.executeSequential(tasks);
    }

    const synthesized = this.synthesizeResults(request, agentResults);
    const confidence = this.calculateConfidence(agentResults);

    return {
      id: `report_${Date.now()}`,
      type: request.type,
      generatedAt: new Date(),
      request,
      agentResults,
      synthesized,
      confidence,
      nextUpdate: new Date(Date.now() + 3600000),
    };
  }

  private createTasks(request: ResearchRequest): AgentTask[] {
    const tasks: AgentTask[] = [];

    switch (request.type) {
      case 'company':
        if (request.symbols?.length) {
          tasks.push(this.createTask('company_analysis', 'analyze_financials', {
            symbol: request.symbols[0],
            period: request.period,
          }));
          tasks.push(this.createTask('market_sentiment', 'analyze_news', {
            symbols: request.symbols,
          }));
        }
        break;

      case 'market':
        tasks.push(this.createTask('macro_trend', 'analyze_market', {
          market: request.market || 'NEPSE',
          period: request.period || '1M',
        }));
        tasks.push(this.createTask('market_sentiment', 'investor_sentiment', {
          market: request.market || 'NEPSE',
        }));
        break;

      case 'portfolio':
        if (request.portfolio) {
          tasks.push(this.createTask('portfolio_strategy', 'risk_assess', {
            portfolio: request.portfolio,
          }));
          tasks.push(this.createTask('portfolio_strategy', 'optimize', {
            holdings: request.portfolio.holdings,
            constraints: request.constraints,
          }));
        }
        break;

      case 'comprehensive':
        if (request.symbols?.length) {
          tasks.push(this.createTask('company_analysis', 'analyze_financials', {
            symbol: request.symbols[0],
            period: request.period,
          }));
          tasks.push(this.createTask('company_analysis', 'compare', {
            symbols: request.symbols,
          }));
          tasks.push(this.createTask('market_sentiment', 'analyze_news', {
            symbols: request.symbols,
          }));
        }
        tasks.push(this.createTask('macro_trend', 'analyze_market', {
          market: request.market || 'NEPSE',
          period: request.period || '1M',
        }));
        tasks.push(this.createTask('macro_trend', 'track_sectors', {
          sectors: ['Banking', 'Hydro', 'Insurance'],
        }));
        if (request.portfolio) {
          tasks.push(this.createTask('portfolio_strategy', 'risk_assess', {
            portfolio: request.portfolio,
          }));
        }
        break;
    }

    return tasks;
  }

  private createTask(agentRole: AgentRole, type: string, input: any): AgentTask {
    return {
      id: `task_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      agentId: agentRole,
      type,
      input,
      status: 'waiting',
    };
  }

  private async executeParallel(tasks: AgentTask[]): Promise<AgentResult[]> {
    const chunks = this.chunkArray(tasks, this.config.maxConcurrent);
    const results: AgentResult[] = [];

    for (const chunk of chunks) {
      const chunkResults = await Promise.all(
        chunk.map(task => this.executeTask(task))
      );
      results.push(...chunkResults);
    }

    return results;
  }

  private async executeSequential(tasks: AgentTask[]): Promise<AgentResult[]> {
    const results: AgentResult[] = [];

    for (const task of tasks) {
      const result = await this.executeTask(task);
      results.push(result);
    }

    return results;
  }

  private async executeTask(task: AgentTask): Promise<AgentResult> {
    const agent = this.agents.get(task.agentId as AgentRole);
    
    if (!agent) {
      return {
        agentId: task.agentId,
        agentRole: task.agentId as AgentRole,
        success: false,
        data: null,
        confidence: 0,
        sources: [],
        timestamp: new Date(),
        processingTime: 0,
      };
    }

    return agent.executeTask(task);
  }

  private synthesizeResults(request: ResearchRequest, results: AgentResult[]): SynthesizedReport {
    const sections: ReportSection[] = [];
    const recommendations: ReportRecommendation[] = [];

    for (const result of results) {
      if (!result.success) continue;

      const section = this.createSection(result);
      sections.push(section);

      const recs = this.extractRecommendations(result);
      recommendations.push(...recs);
    }

    const title = this.generateTitle(request);
    const summary = this.generateSummary(sections, recommendations);
    const dataSources = this.extractDataSources(results);

    return {
      title,
      summary,
      sections,
      recommendations: recommendations.sort((a, b) => {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }),
      dataSources,
    };
  }

  private createSection(result: AgentResult): ReportSection {
    const content = this.formatResultData(result);
    
    return {
      title: this.getSectionTitle(result.agentRole),
      content,
      source: result.agentRole,
      keyMetrics: result.data,
    };
  }

  private getSectionTitle(role: AgentRole): string {
    const titles: Record<AgentRole, string> = {
      company_analysis: 'Company Analysis',
      macro_trend: 'Market Trends',
      market_sentiment: 'Market Sentiment',
      portfolio_strategy: 'Portfolio Strategy',
      orchestrator: 'Summary',
    };
    return titles[role];
  }

  private formatResultData(result: AgentResult): string {
    const data = result.data;
    
    if (result.agentRole === 'company_analysis') {
      return `Analysis for ${data.symbol}: ROE ${data.analysis?.profitability?.roe}%, P/E ${data.analysis?.valuation?.peRatio}, Recommendation: ${data.recommendation?.action}`;
    }
    
    if (result.agentRole === 'macro_trend') {
      return `${data.market} market overview: Index ${data.overview?.index}, Change ${data.overview?.change}, Outlook: ${data.outlook}`;
    }
    
    if (result.agentRole === 'market_sentiment') {
      return `Sentiment: ${data.overallSentiment?.label} (${data.overallSentiment?.score}%)`;
    }
    
    if (result.agentRole === 'portfolio_strategy') {
      return `Risk Score: ${data.riskScore}, Level: ${data.riskLevel}`;
    }
    
    return JSON.stringify(data, null, 2);
  }

  private extractRecommendations(result: AgentResult): ReportRecommendation[] {
    const recommendations: ReportRecommendation[] = [];

    if (result.agentRole === 'company_analysis' && result.data?.recommendation) {
      recommendations.push({
        id: `rec_${result.agentId}_${Date.now()}`,
        type: result.data.recommendation.action.toLowerCase() as any,
        target: result.data.symbol,
        rationale: `Based on financial analysis with ${result.confidence}% confidence`,
        confidence: result.confidence,
        priority: result.data.recommendation.confidence === 'High' ? 'high' : 'medium',
      });
    }

    if (result.agentRole === 'portfolio_strategy' && result.data?.recommendations) {
      result.data.recommendations.forEach((rec: string, i: number) => {
        recommendations.push({
          id: `rec_${result.agentId}_${i}`,
          type: 'rebalance',
          target: 'Portfolio',
          rationale: rec,
          confidence: result.confidence,
          priority: 'medium',
        });
      });
    }

    return recommendations;
  }

  private generateTitle(request: ResearchRequest): string {
    switch (request.type) {
      case 'company':
        return `Company Analysis: ${request.symbols?.[0]}`;
      case 'market':
        return `Market Intelligence: ${request.market || 'NEPSE'}`;
      case 'portfolio':
        return 'Portfolio Analysis Report';
      case 'comprehensive':
        return 'Comprehensive Market Intelligence Report';
      default:
        return 'Market Intelligence Report';
    }
  }

  private generateSummary(sections: ReportSection[], recommendations: ReportRecommendation[]): string {
    const buyRecs = recommendations.filter(r => r.type === 'buy').length;
    const sellRecs = recommendations.filter(r => r.type === 'sell').length;
    
    return `This report synthesizes analysis from ${sections.length} areas. ` +
      `Found ${buyRecs} buy recommendations and ${sellRecs} sell recommendations. ` +
      `Key themes include ${sections[0]?.content?.substring(0, 100) || 'market analysis'}.`;
  }

  private extractDataSources(results: AgentResult[]): string[] {
    const sources = new Set<string>();
    
    for (const result of results) {
      sources.add(result.agentRole);
      if (result.sources) {
        result.sources.forEach(s => sources.add(s));
      }
    }
    
    return Array.from(sources);
  }

  private calculateConfidence(results: AgentResult[]): number {
    const successful = results.filter(r => r.success);
    if (successful.length === 0) return 0;

    const avgConfidence = successful.reduce((sum, r) => sum + r.confidence, 0) / successful.length;
    const successRate = successful.length / results.length;

    return Math.round(avgConfidence * successRate);
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  async sendMessage(message: AgentMessage): Promise<AgentMessage[]> {
    const responses: AgentMessage[] = [];
    
    if (message.to === 'broadcast') {
      for (const agent of this.agents.values()) {
        const response = await agent.receiveMessage(message);
        if (response) responses.push(response);
      }
    } else {
      const agent = this.agents.get(message.to as AgentRole);
      if (agent) {
        const response = await agent.receiveMessage(message);
        if (response) responses.push(response);
      }
    }

    return responses;
  }

  getAgentMetrics(): Record<AgentRole, any> {
    const metrics: Record<string, any> = {};
    
    for (const [role, agent] of this.agents) {
      metrics[role] = agent.getMetrics();
    }
    
    return metrics;
  }

  getSwarmStatus(): { agents: number; status: string; uptime: number } {
    return {
      agents: this.agents.size,
      status: 'operational',
      uptime: Date.now(),
    };
  }
}

export const researchSwarm = new ResearchSwarmOrchestrator();
