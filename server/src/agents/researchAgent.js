/**
 * FinSathi AI - Research Agent System
 * Autonomous agent for continuous market analysis and company research
 */

const KnowledgeGraphService = require('./knowledgeGraphService');
const CompanyAnalysisService = require('./companyAnalysisService');
const { calculateFinancialHealthScore } = require('../utils/financialRatios');

class ResearchAgent {
  constructor() {
    this.kg = new KnowledgeGraphService();
    this.analysis = null; // Will be initialized with repository
    this.config = {
      scanInterval: 24 * 60 * 60 * 1000, // Daily
      riskThresholds: {
        minROE: 10,
        maxDebtToEquity: 1.5,
        minCurrentRatio: 1.0,
        minProfitMargin: 5
      },
      strongCompanyCriteria: {
        minHealthScore: 70,
        minROE: 15,
        maxDebtToEquity: 1.0,
        consecutiveProfitYears: 3
      }
    };
    this.isRunning = false;
    this.lastRun = null;
  }

  /**
   * Initialize the research agent
   */
  async initialize(companyRepository) {
    this.analysis = new CompanyAnalysisService(companyRepository);
    console.log('[ResearchAgent] Initialized');
  }

  /**
   * Start the autonomous research cycle
   */
  async start(schedule = 'daily') {
    if (this.isRunning) {
      console.log('[ResearchAgent] Already running');
      return;
    }

    this.isRunning = true;
    console.log(`[ResearchAgent] Starting ${schedule} research cycle`);

    try {
      switch (schedule) {
        case 'hourly':
          await this.runHourlyCycle();
          break;
        case 'daily':
          await this.runDailyCycle();
          break;
        case 'weekly':
          await this.runWeeklyCycle();
          break;
        default:
          await this.runDailyCycle();
      }

      this.lastRun = new Date();
    } catch (error) {
      console.error('[ResearchAgent] Cycle failed:', error);
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Run daily research cycle
   */
  async runDailyCycle() {
    console.log('[ResearchAgent] Starting daily research cycle...');

    // 1. Update market data
    await this.updateMarketData();

    // 2. Identify strong companies
    const strongCompanies = await this.identifyStrongCompanies();

    // 3. Detect financial risks
    const riskAlerts = await this.detectFinancialRisks();

    // 4. Generate sector analysis
    const sectorAnalysis = await this.analyzeAllSectors();

    // 5. Generate daily insights report
    const report = await this.generateDailyReport({
      strongCompanies,
      riskAlerts,
      sectorAnalysis
    });

    console.log('[ResearchAgent] Daily cycle completed');
    return report;
  }

  /**
   * Run hourly cycle for real-time alerts
   */
  async runHourlyCycle() {
    console.log('[ResearchAgent] Starting hourly research cycle...');

    // Quick risk checks
    const riskAlerts = await this.detectFinancialRisks();
    
    // Price movement alerts
    const priceAlerts = await this.checkPriceMovements();

    return { riskAlerts, priceAlerts };
  }

  /**
   * Run weekly comprehensive analysis
   */
  async runWeeklyCycle() {
    console.log('[ResearchAgent] Starting weekly research cycle...');

    // Full sector analysis
    const sectorReports = await this.analyzeAllSectors();

    // Peer comparison for all companies
    const peerReports = await this.generatePeerReports();

    // Market trend analysis
    const trends = await this.analyzeMarketTrends();

    return { sectorReports, peerReports, trends };
  }

  // ============================================
  // CORE ANALYSIS FUNCTIONS
  // ============================================

  /**
   * Identify strong companies based on criteria
   */
  async identifyStrongCompanies() {
    const { strongCompanyCriteria } = this.config;
    const companies = await this.kg.searchCompanies('');
    
    const strongCompanies = [];

    for (const company of companies.slice(0, 50)) {
      try {
        const analysis = await this.analysis.getCompanyAnalysis(company.symbol, {
          benchmarkAgainstIndustry: true
        });

        if (!analysis) continue;

        const { healthScore, ratios } = analysis.analysis;

        // Check strong company criteria
        const isStrong = 
          healthScore.score >= strongCompanyCriteria.minHealthScore &&
          ratios.returnOnEquity >= strongCompanyCriteria.minROE &&
          ratios.debtToEquity <= strongCompanyCriteria.maxDebtToEquity;

        if (isStrong) {
          strongCompanies.push({
            symbol: company.symbol,
            name: company.name,
            healthScore: healthScore.score,
            category: healthScore.category,
            roe: ratios.returnOnEquity,
            debtToEquity: ratios.debtToEquity,
            recommendation: this.generateBuyRecommendation(healthScore, ratios)
          });
        }
      } catch (error) {
        console.error(`[ResearchAgent] Error analyzing ${company.symbol}:`, error.message);
      }
    }

    // Sort by health score
    strongCompanies.sort((a, b) => b.healthScore - a.healthScore);

    return {
      count: strongCompanies.length,
      companies: strongCompanies.slice(0, 20),
      topPicks: strongCompanies.slice(0, 5)
    };
  }

  /**
   * Detect financial risks across all companies
   */
  async detectFinancialRisks() {
    const { riskThresholds } = this.config;
    const companies = await this.kg.searchCompanies('');
    
    const riskAlerts = [];

    for (const company of companies.slice(0, 50)) {
      try {
        const analysis = await this.analysis.getCompanyAnalysis(company.symbol);

        if (!analysis) continue;

        const { healthScore, ratios, insights } = analysis.analysis;
        const risks = [];

        // Check each risk threshold
        if (ratios.returnOnEquity < riskThresholds.minROE) {
          risks.push({
            type: 'LOW_ROE',
            severity: 'HIGH',
            message: `ROE (${ratios.returnOnEquity.toFixed(1)}%) below threshold (${riskThresholds.minROE}%)`
          });
        }

        if (ratios.debtToEquity > riskThresholds.maxDebtToEquity) {
          risks.push({
            type: 'HIGH_DEBT',
            severity: ratios.debtToEquity > 2 ? 'HIGH' : 'MEDIUM',
            message: `Debt/Equity (${ratios.debtToEquity.toFixed(1)}) exceeds threshold (${riskThresholds.maxDebtToEquity})`
          });
        }

        if (ratios.currentRatio < riskThresholds.minCurrentRatio) {
          risks.push({
            type: 'LOW_LIQUIDITY',
            severity: 'MEDIUM',
            message: `Current ratio (${ratios.currentRatio.toFixed(1)}) below threshold (${riskThresholds.minCurrentRatio})`
          });
        }

        if (ratios.netProfitMargin < riskThresholds.minProfitMargin) {
          risks.push({
            type: 'LOW_MARGIN',
            severity: 'MEDIUM',
            message: `Profit margin (${ratios.netProfitMargin.toFixed(1)}%) below threshold (${riskThresholds.minProfitMargin}%)`
          });
        }

        // Check for concerning insights
        const concernInsights = insights.filter(i => i.type === 'CONCERN');
        if (concernInsights.length > 0) {
          concernInsights.forEach(insight => {
            risks.push({
              type: 'INSIGHT_ALERT',
              severity: insight.priority === 'HIGH' ? 'HIGH' : 'MEDIUM',
              message: insight.title
            });
          });
        }

        if (risks.length > 0) {
          riskAlerts.push({
            symbol: company.symbol,
            name: company.name,
            sector: company.sector,
            risks,
            overallSeverity: risks.some(r => r.severity === 'HIGH') ? 'HIGH' : 'MEDIUM'
          });
        }
      } catch (error) {
        console.error(`[ResearchAgent] Risk check failed for ${company.symbol}:`, error.message);
      }
    }

    // Sort by severity
    riskAlerts.sort((a, b) => {
      const severityOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
      return severityOrder[a.overallSeverity] - severityOrder[b.overallSeverity];
    });

    return {
      totalRisks: riskAlerts.length,
      highSeverity: riskAlerts.filter(r => r.overallSeverity === 'HIGH').length,
      alerts: riskAlerts.slice(0, 20)
    };
  }

  /**
   * Analyze all market sectors
   */
  async analyzeAllSectors() {
    const sectors = ['BANKING', 'HYDRO', 'MUTUAL_FUND', 'HOTEL', 'MANUFACTURING'];
    const sectorReports = [];

    for (const sector of sectors) {
      try {
        const analysis = await this.analysis.getSectorAnalysis(sector);
        
        if (analysis) {
          sectorReports.push({
            sector: analysis.sector,
            statistics: analysis.statistics,
            topPerformers: analysis.topPerformers?.slice(0, 3),
            summary: this.generateSectorSummary(analysis)
          });
        }
      } catch (error) {
        console.error(`[ResearchAgent] Sector analysis failed for ${sector}:`, error.message);
      }
    }

    return sectorReports;
  }

  /**
   * Check for significant price movements
   */
  async checkPriceMovements(threshold = 5) {
    const companies = await this.kg.searchCompanies('');
    const alerts = [];

    for (const company of companies.slice(0, 30)) {
      try {
        const prices = await this.kg.getCompanyProfile(company.symbol);
        
        if (!prices?.stockPrices || prices.stockPrices.length < 2) continue;

        const [latest, previous] = prices.stockPrices;
        const change = ((latest.close - previous.close) / previous.close) * 100;

        if (Math.abs(change) >= threshold) {
          alerts.push({
            symbol: company.symbol,
            name: company.name,
            change: change.toFixed(2),
            price: latest.close,
            direction: change > 0 ? 'UP' : 'DOWN'
          });
        }
      } catch (error) {
        // Skip on error
      }
    }

    return alerts.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
  }

  // ============================================
  // REPORT GENERATION
  // ============================================

  /**
   * Generate comprehensive daily report
   */
  async generateDailyReport(data) {
    const { strongCompanies, riskAlerts, sectorAnalysis } = data;

    const report = {
      date: new Date().toISOString(),
      summary: {
        strongCompaniesFound: strongCompanies.count,
        risksDetected: riskAlerts.totalRisks,
        highPriorityRisks: riskAlerts.highSeverity
      },
      topPicks: strongCompanies.topPicks,
      riskAlerts: riskAlerts.alerts.slice(0, 10),
      sectorHighlights: this.generateSectorHighlights(sectorAnalysis),
      recommendations: this.generateDailyRecommendations(strongCompanies, riskAlerts),
      marketSentiment: this.calculateMarketSentiment(strongCompanies, riskAlerts)
    };

    // Store report
    await this.storeReport(report);

    return report;
  }

  /**
   * Generate sector highlights
   */
  generateSectorHighlights(sectors) {
    return sectors
      .filter(s => s.statistics)
      .map(s => ({
        sector: s.sector,
        totalCompanies: s.statistics.totalCompanies,
        averageHealthScore: s.statistics.averageHealthScore?.toFixed(1),
        strongCount: s.statistics.strongCompanies,
        riskyCount: s.statistics.riskyCompanies,
        topPerformer: s.topPerformers?.[0]
      }))
      .sort((a, b) => b.averageHealthScore - a.averageHealthScore);
  }

  /**
   * Generate daily recommendations
   */
  generateDailyRecommendations(strongCompanies, riskAlerts) {
    const recommendations = [];

    // Strong company recommendations
    strongCompanies.topPicks.forEach(company => {
      recommendations.push({
        type: 'BUY',
        symbol: company.symbol,
        title: `Strong Financials - ${company.name}`,
        rationale: `ROE: ${company.roe.toFixed(1)}%, Health Score: ${company.healthScore.toFixed(0)}`,
        priority: 'HIGH'
      });
    });

    // Risk alerts
    riskAlerts.alerts
      .filter(r => r.overallSeverity === 'HIGH')
      .slice(0, 5)
      .forEach(alert => {
        recommendations.push({
          type: 'AVOID',
          symbol: alert.symbol,
          title: `Risk Detected - ${alert.name}`,
          rationale: `${alert.risks.length} risk factors identified`,
          priority: 'HIGH'
        });
      });

    return recommendations;
  }

  /**
   * Calculate overall market sentiment
   */
  calculateMarketSentiment(strongCompanies, riskAlerts) {
    const strongScore = strongCompanies.count * 5;
    const riskPenalty = riskAlerts.highSeverity * 10;
    const totalScore = strongScore - riskPenalty;

    let sentiment = 'NEUTRAL';
    if (totalScore > 50) sentiment = 'POSITIVE';
    else if (totalScore < 0) sentiment = 'NEGATIVE';

    return {
      sentiment,
      score: totalScore,
      factors: {
        strongCompanies: strongCompanies.count,
        highRisks: riskAlerts.highSeverity
      }
    };
  }

  /**
   * Generate buy recommendation
   */
  generateBuyRecommendation(healthScore, ratios) {
    if (healthScore.category === 'STRONG' && ratios.returnOnEquity > 20) {
      return 'STRONG_BUY';
    } else if (healthScore.category === 'STRONG') {
      return 'BUY';
    } else if (healthScore.category === 'MODERATE') {
      return 'HOLD';
    }
    return 'SELL';
  }

  /**
   * Generate sector summary
   */
  generateSectorSummary(analysis) {
    if (!analysis.statistics) return null;

    const { totalCompanies, averageHealthScore, strongCompanies, riskyCompanies } = analysis.statistics;

    let outlook = 'NEUTRAL';
    if (averageHealthScore > 65 && riskyCompanies < strongCompanies) {
      outlook = 'POSITIVE';
    } else if (averageHealthScore < 40 || riskyCompanies > strongCompanies) {
      outlook = 'NEGATIVE';
    }

    return {
      outlook,
      totalCompanies,
      healthScore: averageHealthScore?.toFixed(1),
      strongVsRisky: `${strongCompanies} strong / ${riskyCompanies} risky`
    };
  }

  // ============================================
  // DATA MANAGEMENT
  // ============================================

  /**
   * Update market data (placeholder for data ingestion)
   */
  async updateMarketData() {
    console.log('[ResearchAgent] Updating market data...');
    // Would integrate with market data providers
    // For now, just log
  }

  /**
   * Store research report
   */
  async storeReport(report) {
    console.log('[ResearchAgent] Storing report:', report.date);
    // Would store to database
  }

  /**
   * Get recent reports
   */
  async getReports(days = 7) {
    // Would fetch from database
    return [];
  }

  /**
   * Stop the agent
   */
  stop() {
    this.isRunning = false;
    console.log('[ResearchAgent] Stopped');
  }
}

module.exports = ResearchAgent;
