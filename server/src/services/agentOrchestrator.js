/**
 * FinSathi AI - Agent Orchestrator
 * Coordinates multiple AI agents and manages workflows
 */

const ResearchAgent = require('./researchAgent');
const StockPredictionPipeline = require('./stockPredictionService');
const FinancialNewsNLP = require('./financialNewsNLP');
const PortfolioOptimizer = require('./portfolioOptimizer');
const ExperimentTracker = require('./experimentTracker');

class AgentOrchestrator {
  constructor() {
    this.agents = {
      research: new ResearchAgent(),
      prediction: new StockPredictionPipeline(),
      news: new FinancialNewsNLP(),
      portfolio: new PortfolioOptimizer()
    };
    this.experimentTracker = new ExperimentTracker();
    this.schedules = new Map();
    this.taskQueue = [];
    this.isRunning = false;
  }

  // ============================================
  // ORCHESTRATION
  // ============================================

  /**
   * Run complete AI workflow
   */
  async runWorkflow(workflowConfig = {}) {
    const {
      symbols = ['NABIL', 'NICA', 'SCB', 'MBL', 'BOK'],
      userId,
      generateReport = true
    } = workflowConfig;

    console.log('[Orchestrator] Starting AI workflow...');
    const startTime = Date.now();

    // Create experiment for tracking
    const experiment = await this.experimentTracker.createExperiment({
      name: `Workflow_${Date.now()}`,
      description: 'Complete AI analysis workflow',
      type: 'ENSEMBLE',
      parameters: { symbols, generateReport }
    });

    try {
      // Step 1: Research Agent - Analyze market
      console.log('[Orchestrator] Running Research Agent...');
      const researchResult = await this.runResearchAgent(symbols);
      
      await this.experimentTracker.logMetric(experiment.id, {
        step: 'research',
        status: 'completed',
        strongCompanies: researchResult.strongCompanies?.count || 0,
        risksDetected: researchResult.riskAlerts?.totalRisks || 0
      });

      // Step 2: Prediction Agent - Generate predictions
      console.log('[Orchestrator] Running Prediction Agent...');
      const predictionResult = await this.runPredictionAgent(symbols);
      
      await this.experimentTracker.logMetric(experiment.id, {
        step: 'predictions',
        status: 'completed',
        predictionsGenerated: predictionResult.length
      });

      // Step 3: News Analysis Agent - Sentiment analysis
      console.log('[Orchestrator] Running News Agent...');
      const newsResult = await this.runNewsAgent();
      
      await this.experimentTracker.logMetric(experiment.id, {
        step: 'news',
        status: 'completed',
        articlesAnalyzed: newsResult.summary?.totalArticles || 0,
        sentiment: newsResult.marketSentiment?.sentiment
      });

      // Step 4: Portfolio Optimization
      console.log('[Orchestrator] Running Portfolio Optimizer...');
      const portfolioResult = await this.runPortfolioOptimizer(symbols, researchResult);
      
      await this.experimentTracker.logMetric(experiment.id, {
        step: 'portfolio',
        status: 'completed',
        recommendedPositions: portfolioResult.allocation?.length || 0
      });

      // Aggregate all insights
      const aggregatedInsights = this.aggregateInsights({
        research: researchResult,
        predictions: predictionResult,
        news: newsResult,
        portfolio: portfolioResult
      });

      // Complete experiment
      await this.experimentTracker.completeExperiment(experiment.id, {
        workflowDuration: Date.now() - startTime,
        insights: aggregatedInsights
      });

      const duration = Date.now() - startTime;
      console.log(`[Orchestrator] Workflow completed in ${duration}ms`);

      return {
        success: true,
        experimentId: experiment.id,
        duration,
        results: aggregatedInsights,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('[Orchestrator] Workflow failed:', error);
      await this.experimentTracker.completeExperiment(experiment.id, {
        status: 'FAILED',
        error: error.message
      });
      throw error;
    }
  }

  // ============================================
  // AGENT EXECUTION
  // ============================================

  /**
   * Run research agent
   */
  async runResearchAgent(symbols) {
    try {
      // Initialize research agent if needed
      if (!this.agents.research.analysis) {
        // Would initialize with repository
      }

      const strongCompanies = await this.agents.research.identifyStrongCompanies();
      const riskAlerts = await this.agents.research.detectFinancialRisks();
      const sectorAnalysis = await this.agents.research.analyzeAllSectors();

      return {
        strongCompanies,
        riskAlerts,
        sectorAnalysis
      };
    } catch (error) {
      console.error('[Orchestrator] Research agent error:', error);
      return { strongCompanies: {}, riskAlerts: {}, sectorAnalysis: [] };
    }
  }

  /**
   * Run prediction agent
   */
  async runPredictionAgent(symbols) {
    const predictions = [];

    for (const symbol of symbols.slice(0, 5)) {
      try {
        const prediction = await this.agents.prediction.predict(symbol);
        predictions.push(prediction);
      } catch (error) {
        console.error(`[Orchestrator] Prediction error for ${symbol}:`, error.message);
      }
    }

    return predictions;
  }

  /**
   * Run news analysis agent
   */
  async runNewsAgent() {
    try {
      const news = await this.agents.news.collectNews({ limit: 50 });
      const processed = await this.agents.news.processNews(news);

      return processed;
    } catch (error) {
      console.error('[Orchestrator] News agent error:', error);
      return { marketSentiment: {}, summary: {} };
    }
  }

  /**
   * Run portfolio optimizer
   */
  async runPortfolioOptimizer(symbols, researchData) {
    try {
      // Determine risk profile based on market conditions
      const riskProfile = this.determineRiskProfile(researchData);

      const result = await this.agents.portfolio.optimizePortfolio({
        riskProfile,
        symbols: symbols.slice(0, 5),
        investmentAmount: 100000
      });

      return result;
    } catch (error) {
      console.error('[Orchestrator] Portfolio optimizer error:', error);
      return { allocation: [], metrics: {} };
    }
  }

  /**
   * Determine risk profile based on market conditions
   */
  determineRiskProfile(researchData) {
    const { riskAlerts, sectorAnalysis } = researchData;
    
    // High risks -> Conservative
    if (riskAlerts?.totalRisks > 10) {
      return 'CONSERVATIVE';
    }
    
    // Check sector performance
    const avgHealth = sectorAnalysis?.reduce((sum, s) => 
      sum + (s.statistics?.averageHealthScore || 50), 0) / (sectorAnalysis?.length || 1);
    
    if (avgHealth > 60) {
      return 'AGGRESSIVE';
    } else if (avgHealth > 40) {
      return 'MODERATE';
    }
    
    return 'MODERATE';
  }

  // ============================================
  // INSIGHT AGGREGATION
  // ============================================

  /**
   * Aggregate insights from all agents
   */
  aggregateInsights(agentResults) {
    const { research, predictions, news, portfolio } = agentResults;

    // Market sentiment
    const marketSentiment = news.marketSentiment?.sentiment || 'NEUTRAL';
    const sentimentScore = news.marketSentiment?.score || 0;

    // Top opportunities
    const opportunities = this.identifyOpportunities(predictions, research);

    // Risk warnings
    const warnings = this.identifyWarnings(research);

    // Recommended actions
    const actions = this.generateActions({
      marketSentiment,
      opportunities,
      warnings,
      portfolio
    });

    return {
      summary: {
        marketSentiment,
        sentimentScore,
        totalOpportunities: opportunities.length,
        totalWarnings: warnings.length,
        recommendedRiskProfile: portfolio?.riskProfile || 'MODERATE'
      },
      opportunities,
      warnings,
      actions,
      portfolio: portfolio?.allocation?.slice(0, 5),
      metrics: portfolio?.metrics,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Identify investment opportunities
   */
  identifyOpportunities(predictions, research) {
    const opportunities = [];

    // From predictions
    predictions.forEach(pred => {
      if (pred.prediction?.direction === 'UP' && pred.prediction?.confidence > 0.7) {
        opportunities.push({
          type: 'PREDICTION',
          symbol: pred.symbol,
          confidence: pred.prediction.confidence,
          reason: `AI predicts ${pred.prediction.probability}% probability of increase`
        });
      }
    });

    // From research
    research.strongCompanies?.companies?.forEach(company => {
      if (company.healthScore > 70) {
        opportunities.push({
          type: 'RESEARCH',
          symbol: company.symbol,
          confidence: company.healthScore / 100,
          reason: `Strong financial health (score: ${company.healthScore})`
        });
      }
    });

    return opportunities
      .sort((a, b) => b.confidence - a.confidence)
      .slice(0, 5);
  }

  /**
   * Identify risk warnings
   */
  identifyWarnings(research) {
    const warnings = [];

    research.riskAlerts?.alerts?.forEach(alert => {
      if (alert.overallSeverity === 'HIGH') {
        warnings.push({
          symbol: alert.symbol,
          severity: alert.overallSeverity,
          reasons: alert.risks.map(r => r.message)
        });
      }
    });

    return warnings.slice(0, 5);
  }

  /**
   * Generate recommended actions
   */
  generateActions(context) {
    const { marketSentiment, opportunities, warnings, portfolio } = context;
    const actions = [];

    // Market sentiment based
    if (marketSentiment === 'POSITIVE' && opportunities.length > 0) {
      actions.push({
        action: 'INCREASE_EXPOSURE',
        priority: 'HIGH',
        reason: 'Positive market sentiment with strong opportunities'
      });
    } else if (marketSentiment === 'NEGATIVE') {
      actions.push({
        action: 'REDUCE_EXPOSURE',
        priority: 'HIGH',
        reason: 'Negative market sentiment detected'
      });
    }

    // Warnings based
    if (warnings.length > 3) {
      actions.push({
        action: 'REVIEW_PORTFOLIO',
        priority: 'MEDIUM',
        reason: `${warnings.length} high-risk stocks in market`
      });
    }

    // Rebalancing
    actions.push({
      action: 'REBALANCE',
      priority: 'LOW',
      reason: 'Review portfolio allocation based on AI recommendations'
    });

    return actions;
  }

  // ============================================
  // SCHEDULING
  // ============================================

  /**
   * Schedule workflow
   */
  scheduleWorkflow(cronExpression, workflowConfig) {
    const scheduleId = `schedule_${Date.now()}`;
    
    this.schedules.set(scheduleId, {
      id: scheduleId,
      config: workflowConfig,
      cron: cronExpression,
      lastRun: null,
      nextRun: this.calculateNextRun(cronExpression)
    });

    console.log(`[Orchestrator] Scheduled workflow ${scheduleId}`);
    return scheduleId;
  }

  /**
   * Calculate next run time
   */
  calculateNextRun(cronExpression) {
    // Simplified - would use cron parser in production
    const now = new Date();
    return new Date(now.getTime() + 24 * 60 * 60 * 1000); // Daily
  }

  /**
   * Run scheduled workflows
   */
  async runScheduledWorkflows() {
    const now = new Date();
    
    for (const [id, schedule] of this.schedules) {
      if (schedule.nextRun <= now) {
        console.log(`[Orchestrator] Running scheduled workflow ${id}`);
        
        try {
          await this.runWorkflow(schedule.config);
          schedule.lastRun = now;
          schedule.nextRun = this.calculateNextRun(schedule.cron);
        } catch (error) {
          console.error(`[Orchestrator] Scheduled workflow ${id} failed:`, error);
        }
      }
    }
  }

  /**
   * Start scheduler
   */
  startScheduler() {
    if (this.isRunning) return;
    
    this.isRunning = true;
    console.log('[Orchestrator] Starting scheduler...');
    
    // Check every minute
    this.schedulerInterval = setInterval(() => {
      this.runScheduledWorkflows();
    }, 60000);
  }

  /**
   * Stop scheduler
   */
  stopScheduler() {
    if (this.schedulerInterval) {
      clearInterval(this.schedulerInterval);
      this.isRunning = false;
      console.log('[Orchestrator] Scheduler stopped');
    }
  }

  // ============================================
  // STATUS
  // ============================================

  /**
   * Get orchestrator status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      schedules: Array.from(this.schedules.values()).map(s => ({
        id: s.id,
        lastRun: s.lastRun,
        nextRun: s.nextRun
      })),
      agentsAvailable: Object.keys(this.agents)
    };
  }
}

module.exports = AgentOrchestrator;
