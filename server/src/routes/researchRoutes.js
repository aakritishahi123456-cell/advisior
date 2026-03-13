/**
 * FinSathi AI - Research Agent Routes
 * API endpoints for research insights and agent control
 */

const express = require('express');
const ResearchAgent = require('../agents/researchAgent');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Initialize research agent
const researchAgent = new ResearchAgent();

/**
 * GET /api/v1/research/daily
 * Get daily research insights
 */
router.get('/daily', async (req, res) => {
  try {
    const report = await researchAgent.runDailyCycle();
    
    res.json({
      success: true,
      data: report
    });
  } catch (error) {
    console.error('Error generating daily report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate daily report'
    });
  }
});

/**
 * GET /api/v1/research/strong-companies
 * Get list of strong companies
 */
router.get('/strong-companies', async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    const result = await researchAgent.identifyStrongCompanies();
    
    res.json({
      success: true,
      data: {
        ...result,
        companies: result.companies.slice(0, parseInt(limit))
      }
    });
  } catch (error) {
    console.error('Error identifying strong companies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to identify strong companies'
    });
  }
});

/**
 * GET /api/v1/research/risks
 * Get financial risk alerts
 */
router.get('/risks', async (req, res) => {
  try {
    const { severity } = req.query;
    const result = await researchAgent.detectFinancialRisks();
    
    let alerts = result.alerts;
    if (severity) {
      alerts = alerts.filter(a => a.overallSeverity === severity.toUpperCase());
    }
    
    res.json({
      success: true,
      data: {
        ...result,
        alerts
      }
    });
  } catch (error) {
    console.error('Error detecting risks:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to detect financial risks'
    });
  }
});

/**
 * GET /api/v1/research/sectors
 * Get sector analysis
 */
router.get('/sectors', async (req, res) => {
  try {
    const { sector } = req.query;
    
    if (sector) {
      const analysis = await researchAgent.analysis.getSectorAnalysis(sector);
      return res.json({
        success: true,
        data: analysis
      });
    }
    
    const sectors = await researchAgent.analyzeAllSectors();
    
    res.json({
      success: true,
      data: sectors
    });
  } catch (error) {
    console.error('Error analyzing sectors:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sectors'
    });
  }
});

/**
 * GET /api/v1/research/price-alerts
 * Get price movement alerts
 */
router.get('/price-alerts', async (req, res) => {
  try {
    const { threshold = 5 } = req.query;
    const alerts = await researchAgent.checkPriceMovements(parseFloat(threshold));
    
    res.json({
      success: true,
      data: {
        count: alerts.length,
        alerts
      }
    });
  } catch (error) {
    console.error('Error checking prices:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to check price movements'
    });
  }
});

/**
 * GET /api/v1/research/sentiment
 * Get market sentiment
 */
router.get('/sentiment', async (req, res) => {
  try {
    const strongCompanies = await researchAgent.identifyStrongCompanies();
    const riskAlerts = await researchAgent.detectFinancialRisks();
    const sentiment = researchAgent.calculateMarketSentiment(strongCompanies, riskAlerts);
    
    res.json({
      success: true,
      data: sentiment
    });
  } catch (error) {
    console.error('Error calculating sentiment:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to calculate market sentiment'
    });
  }
});

/**
 * GET /api/v1/research/company/:symbol
 * Get research report for specific company
 */
router.get('/company/:symbol', async (req, res) => {
  try {
    const { symbol } = req.params;
    const analysis = await researchAgent.analysis.getCompanyAnalysis(symbol);
    
    if (!analysis) {
      return res.status(404).json({
        success: false,
        error: 'Company not found'
      });
    }
    
    res.json({
      success: true,
      data: analysis
    });
  } catch (error) {
    console.error('Error generating company report:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate company report'
    });
  }
});

/**
 * GET /api/v1/research/compare
 * Compare multiple companies
 */
router.get('/compare', async (req, res) => {
  try {
    const { symbols } = req.query;
    
    if (!symbols) {
      return res.status(400).json({
        success: false,
        error: 'symbols parameter required'
      });
    }
    
    const symbolList = symbols.split(',');
    const comparison = await researchAgent.analysis.getPeerComparison(symbolList[0], symbolList.slice(1));
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error comparing companies:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to compare companies'
    });
  }
});

/**
 * GET /api/v1/research/history
 * Get historical research reports
 */
router.get('/history', async (req, res) => {
  try {
    const { days = 7 } = req.query;
    const reports = await researchAgent.getReports(parseInt(days));
    
    res.json({
      success: true,
      data: reports
    });
  } catch (error) {
    console.error('Error fetching history:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch research history'
    });
  }
});

// Admin routes - Agent control

/**
 * POST /api/v1/research/agent/start
 * Start the research agent
 */
router.post('/agent/start', authMiddleware, async (req, res) => {
  try {
    const { schedule = 'daily' } = req.body;
    await researchAgent.start(schedule);
    
    res.json({
      success: true,
      message: `Research agent started (${schedule} mode)`
    });
  } catch (error) {
    console.error('Error starting agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start research agent'
    });
  }
});

/**
 * POST /api/v1/research/agent/stop
 * Stop the research agent
 */
router.post('/agent/stop', authMiddleware, async (req, res) => {
  try {
    researchAgent.stop();
    
    res.json({
      success: true,
      message: 'Research agent stopped'
    });
  } catch (error) {
    console.error('Error stopping agent:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stop research agent'
    });
  }
});

/**
 * GET /api/v1/research/agent/status
 * Get agent status
 */
router.get('/agent/status', async (req, res) => {
  res.json({
    success: true,
    data: {
      isRunning: researchAgent.isRunning,
      lastRun: researchAgent.lastRun,
      config: {
        scanInterval: researchAgent.config.scanInterval,
        riskThresholds: researchAgent.config.riskThresholds,
        strongCompanyCriteria: researchAgent.config.strongCompanyCriteria
      }
    }
  });
});

module.exports = router;
