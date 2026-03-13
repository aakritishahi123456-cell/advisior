/**
 * FinSathi AI - Portfolio Tracking API Routes
 * Express routes for portfolio management endpoints
 */

const express = require('express');
const PortfolioController = require('../controllers/portfolioController');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const controller = new PortfolioController();

// Middleware for request logging
router.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Portfolio Management Endpoints

/**
 * POST /api/v1/portfolios
 * Create a new portfolio
 * Requires authentication
 * Body: { name, description? }
 */
router.post('/', authMiddleware, controller.createPortfolio.bind(controller));

/**
 * GET /api/v1/portfolios
 * Get all portfolios for the authenticated user
 * Requires authentication
 */
router.get('/', authMiddleware, controller.getUserPortfolios.bind(controller));

/**
 * GET /api/v1/portfolios/summary
 * Get portfolio summary for dashboard
 * Requires authentication
 */
router.get('/summary', authMiddleware, controller.getPortfolioSummary.bind(controller));

/**
 * GET /api/v1/portfolios/search
 * Search available companies for adding to portfolio
 * Query params: q (required), limit
 * Requires authentication
 */
router.get('/search', authMiddleware, controller.searchCompanies.bind(controller));

/**
 * GET /api/v1/portfolios/:id
 * Get detailed portfolio information
 * Requires authentication
 */
router.get('/:id', authMiddleware, controller.getPortfolio.bind(controller));

/**
 * PUT /api/v1/portfolios/:id/settings
 * Update portfolio settings
 * Requires authentication
 */
router.put('/:id/settings', authMiddleware, controller.updatePortfolioSettings.bind(controller));

/**
 * DELETE /api/v1/portfolios/:id
 * Delete a portfolio
 * Requires authentication
 */
router.delete('/:id', authMiddleware, controller.deletePortfolio.bind(controller));

// Asset Management Endpoints

/**
 * POST /api/v1/portfolios/:id/assets
 * Add asset to portfolio
 * Requires authentication
 * Body: { companyId, shares, purchasePrice, purchaseDate? }
 */
router.post('/:id/assets', authMiddleware, controller.addAsset.bind(controller));

/**
 * POST /api/v1/portfolios/:id/assets/sell
 * Sell/remove asset from portfolio
 * Requires authentication
 * Body: { companyId, shares, sellPrice, sellDate? }
 */
router.post('/:id/assets/sell', authMiddleware, controller.sellAsset.bind(controller));

// Performance Analysis Endpoints

/**
 * GET /api/v1/portfolios/:id/performance
 * Get portfolio performance history
 * Requires authentication
 * Query params: period (1W, 1M, 3M, 6M, 1Y)
 */
router.get('/:id/performance', authMiddleware, controller.getPortfolioPerformance.bind(controller));

/**
 * GET /api/v1/portfolios/:id/risk
 * Get portfolio risk metrics
 * Requires authentication
 */
router.get('/:id/risk', authMiddleware, controller.getPortfolioRiskMetrics.bind(controller));

/**
 * GET /api/v1/portfolios/:id/transactions
 * Get portfolio transactions
 * Requires authentication
 * Query params: limit
 */
router.get('/:id/transactions', authMiddleware, controller.getPortfolioTransactions.bind(controller));

// Analytics and Insights Endpoints

/**
 * GET /api/v1/portfolios/:id/allocation
 * Get portfolio asset allocation
 * Requires authentication
 */
router.get('/:id/allocation', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await controller.portfolioService.getPortfolio(id);
    
    // Verify ownership
    if (portfolio.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this portfolio'
      });
    }

    res.json({
      success: true,
      data: {
        assetAllocation: portfolio.metrics.assetAllocation,
        sectorAllocation: portfolio.metrics.sectorAllocation,
        topHoldings: portfolio.metrics.topHoldings
      }
    });
  } catch (error) {
    console.error('Error fetching portfolio allocation:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch portfolio allocation',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/portfolios/:id/dividends
 * Get portfolio dividend information
 * Requires authentication
 */
router.get('/:id/dividends', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await controller.portfolioService.getPortfolio(id);
    
    // Verify ownership
    if (portfolio.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this portfolio'
      });
    }

    // Calculate dividend information
    const dividendYield = portfolio.assets.reduce((sum, asset) => {
      return sum + ((asset.dividendYield || 0) * (asset.currentValue || 0));
    }, 0);

    const annualDividends = dividendYield;

    res.json({
      success: true,
      data: {
        annualDividends,
        dividendYield: portfolio.metrics.totalValue > 0 ? (annualDividends / portfolio.metrics.totalValue) * 100 : 0,
        dividendPayingStocks: portfolio.assets.filter(asset => (asset.dividendYield || 0) > 0).length
      }
    });
  } catch (error) {
    console.error('Error fetching dividend information:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dividend information',
      message: error.message
    });
  }
});

/**
 * GET /api/v1/portfolios/:id/recommendations
 * Get portfolio optimization recommendations
 * Requires authentication
 */
router.get('/:id/recommendations', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const portfolio = await controller.portfolioService.getPortfolio(id);
    
    // Verify ownership
    if (portfolio.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this portfolio'
      });
    }

    const recommendations = [];

    // Concentration risk analysis
    const maxPosition = Math.max(...portfolio.metrics.assetAllocation.map(a => a.percentage || 0));
    if (maxPosition > 25) {
      recommendations.push({
        type: 'RISK',
        priority: 'HIGH',
        title: 'High Concentration Risk',
        description: `Your largest position represents ${maxPosition.toFixed(1)}% of your portfolio. Consider diversifying.`,
        action: 'Reduce position size or add more diversified assets'
      });
    }

    // Sector concentration analysis
    const sectorConcentrations = Object.values(portfolio.metrics.sectorAllocation);
    const maxSectorConcentration = Math.max(...sectorConcentrations.map(s => s.percentage || 0));
    if (maxSectorConcentration > 50) {
      recommendations.push({
        type: 'DIVERSIFICATION',
        priority: 'MEDIUM',
        title: 'Sector Concentration',
        description: `One sector represents ${maxSectorConcentration.toFixed(1)}% of your portfolio.`,
        action: 'Consider adding assets from other sectors'
      });
    }

    // Performance analysis
    if (portfolio.metrics.totalPLP < -10) {
      recommendations.push({
        type: 'PERFORMANCE',
        priority: 'HIGH',
        title: 'Underperformance',
        description: `Your portfolio is down ${Math.abs(portfolio.metrics.totalPLP).toFixed(1)}%.`,
        action: 'Review underperforming positions and consider rebalancing'
      });
    }

    // Rebalancing suggestions
    const riskMetrics = await controller.portfolioService.calculateRiskMetrics(id);
    if (riskMetrics.volatility > 30) {
      recommendations.push({
        type: 'RISK',
        priority: 'MEDIUM',
        title: 'High Volatility',
        description: `Portfolio volatility is ${riskMetrics.volatility.toFixed(1)}%, which may be too high for your risk tolerance.`,
        action: 'Consider adding less volatile assets or reducing position sizes'
      });
    }

    res.json({
      success: true,
      data: {
        recommendations,
        riskMetrics,
        overallScore: Math.max(0, 100 - (recommendations.filter(r => r.priority === 'HIGH').length * 20) - (recommendations.filter(r => r.priority === 'MEDIUM').length * 10))
      }
    });
  } catch (error) {
    console.error('Error generating recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate recommendations',
      message: error.message
    });
  }
});

// Batch Operations

/**
 * POST /api/v1/portfolios/:id/rebalance
 * Rebalance portfolio based on target allocation
 * Requires authentication
 * Body: { targetAllocation: [{ symbol, targetPercentage }] }
 */
router.post('/:id/rebalance', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { targetAllocation } = req.body;
    const userId = req.user.id;

    if (!targetAllocation || !Array.isArray(targetAllocation)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid target allocation',
        message: 'Please provide a valid target allocation array'
      });
    }

    // Verify portfolio ownership
    const portfolio = await controller.portfolioService.getPortfolio(id);
    if (portfolio.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to modify this portfolio'
      });
    }

    // Calculate rebalancing recommendations
    const currentValue = portfolio.metrics.totalValue;
    const rebalancingActions = [];

    targetAllocation.forEach(target => {
      const currentAsset = portfolio.metrics.assetAllocation.find(a => a.symbol === target.symbol);
      const targetValue = (target.targetPercentage / 100) * currentValue;
      
      if (currentAsset) {
        const currentValue = currentAsset.value;
        const difference = targetValue - currentValue;
        const sharesToTrade = difference / (currentAsset.currentPrice || 0);
        
        if (Math.abs(sharesToTrade) > 0.01) { // Minimum trade threshold
          rebalancingActions.push({
            symbol: target.symbol,
            action: sharesToTrade > 0 ? 'BUY' : 'SELL',
            shares: Math.abs(sharesToTrade),
            currentValue,
            targetValue,
            difference
          });
        }
      } else {
        // New position needed
        const sharesToBuy = targetValue / 1000; // Assuming $1000 per share for estimation
        rebalancingActions.push({
          symbol: target.symbol,
          action: 'BUY',
          shares: sharesToBuy,
          currentValue: 0,
          targetValue,
          difference: targetValue
        });
      }
    });

    res.json({
      success: true,
      data: {
        rebalancingActions,
        currentValue,
        targetAllocation,
        estimatedCost: rebalancingActions.reduce((sum, action) => sum + (action.action === 'BUY' ? action.difference : 0), 0)
      },
      message: 'Rebalancing recommendations generated'
    });
  } catch (error) {
    console.error('Error generating rebalancing recommendations:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate rebalancing recommendations',
      message: error.message
    });
  }
});

// Export functionality

/**
 * GET /api/v1/portfolios/:id/export
 * Export portfolio data
 * Requires authentication
 * Query params: format (json, csv)
 */
router.get('/:id/export', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { format = 'json' } = req.query;
    const userId = req.user.id;

    // Verify portfolio ownership
    const portfolio = await controller.portfolioService.getPortfolio(id);
    if (portfolio.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
        message: 'You do not have permission to access this portfolio'
      });
    }

    const exportData = {
      portfolio: {
        id: portfolio.id,
        name: portfolio.name,
        description: portfolio.description,
        createdAt: portfolio.createdAt
      },
      assets: portfolio.assets,
      metrics: portfolio.metrics,
      transactions: portfolio.transactions,
      exportedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Convert to CSV format
      const csvData = convertToCSV(exportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${portfolio.name}_portfolio.csv"`);
      res.send(csvData);
    } else {
      // JSON format
      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename="${portfolio.name}_portfolio.json"`);
      res.json(exportData);
    }
  } catch (error) {
    console.error('Error exporting portfolio:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to export portfolio',
      message: error.message
    });
  }
});

// Helper function to convert portfolio data to CSV
function convertToCSV(data) {
  const headers = ['Symbol', 'Name', 'Shares', 'Purchase Price', 'Current Price', 'Current Value', 'P&L', 'P&L %'];
  const rows = data.assets.map(asset => [
    asset.company.symbol,
    asset.company.name,
    asset.shares,
    asset.purchasePrice,
    asset.currentPrice || 0,
    asset.currentValue || 0,
    asset.unrealizedPL || 0,
    `${asset.unrealizedPLP || 0}%`
  ]);

  const csvContent = [
    headers.join(','),
    ...rows.map(row => row.join(','))
  ].join('\n');

  return csvContent;
}

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Portfolio API Error:', error);
  
  if (error.name === 'PrismaClientKnownRequestError') {
    return res.status(400).json({
      success: false,
      error: 'Database error',
      message: 'Invalid request parameters'
    });
  }
  
  if (error.name === 'PrismaClientUnknownRequestError') {
    return res.status(500).json({
      success: false,
      error: 'Database connection error',
      message: 'Unable to connect to database'
    });
  }
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// ============================================
// PORTFOLIO OPTIMIZATION ROUTES
// ============================================

const PortfolioOptimizer = require('../services/portfolioOptimizer');
const optimizer = new PortfolioOptimizer();

/**
 * POST /api/v1/portfolio/optimize
 * Optimize portfolio based on user profile
 */
router.post('/optimize', authMiddleware, async (req, res) => {
  try {
    const { riskProfile, symbols, investmentAmount, constraints } = req.body;

    if (!riskProfile || !symbols || !investmentAmount) {
      return res.status(400).json({
        success: false,
        error: 'riskProfile, symbols, and investmentAmount are required'
      });
    }

    const result = await optimizer.optimizePortfolio({
      userId: req.user.id,
      riskProfile,
      symbols,
      constraints
    });

    result.allocation = result.allocation.map(a => ({
      ...a,
      investment: Math.round(a.weight * investmentAmount / 100)
    }));

    res.json({ success: true, data: result });
  } catch (error) {
    console.error('Optimization error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * POST /api/v1/portfolio/rebalance
 * Rebalance existing portfolio
 */
router.post('/rebalance', authMiddleware, async (req, res) => {
  try {
    const { currentHoldings, investmentAmount, riskProfile } = req.body;

    if (!currentHoldings) {
      return res.status(400).json({
        success: false,
        error: 'currentHoldings array is required'
      });
    }

    const symbolsToUse = currentHoldings.map(h => h.symbol);
    const result = await optimizer.optimizePortfolio({
      userId: req.user.id,
      riskProfile: riskProfile || 'MODERATE',
      symbols: symbolsToUse,
      investmentAmount
    });

    const currentTotal = currentHoldings.reduce((sum, h) => sum + h.value, 0);
    const trades = result.allocation.map(target => {
      const current = currentHoldings.find(h => h.symbol === target.symbol);
      const currentValue = current?.value || 0;
      const targetValue = target.weight * investmentAmount;
      const difference = targetValue - currentValue;

      return {
        symbol: target.symbol,
        action: difference > 0 ? 'BUY' : 'SELL',
        amount: Math.abs(difference)
      };
    });

    res.json({
      success: true,
      data: { allocation: result.allocation, trades, metrics: result.metrics }
    });
  } catch (error) {
    console.error('Rebalance error:', error);
    res.status(500).json({ success: false, error: 'Rebalancing failed' });
  }
});

/**
 * POST /api/v1/portfolio/risk-profile
 * Calculate risk profile from quiz
 */
router.post('/risk-profile', authMiddleware, async (req, res) => {
  try {
    const { answers } = req.body;
    const totalScore = answers.reduce((sum, a) => sum + (a.score || 0), 0);
    const maxScore = answers.length * 3;
    const percentage = (totalScore / maxScore) * 100;

    let riskProfile;
    if (percentage <= 40) riskProfile = 'CONSERVATIVE';
    else if (percentage <= 70) riskProfile = 'MODERATE';
    else riskProfile = 'AGGRESSIVE';

    res.json({
      success: true,
      data: { riskProfile, score: totalScore, percentage: Math.round(percentage) }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Risk profile calculation failed' });
  }
});

/**
 * GET /api/v1/portfolio/strategies
 * Get optimization strategies
 */
router.get('/strategies', (req, res) => {
  res.json({
    success: true,
    data: [
      { name: 'MARKOWITZ', description: 'Mean-Variance Optimization' },
      { name: 'RISK_PARITY', description: 'Equal risk contribution' },
      { name: 'BLACK_LITTERMAN', description: 'Incorporates market views' },
      { name: 'MAXIMUM_SHARPE', description: 'Max risk-adjusted returns' }
    ]
  });
});

// 404 handler
router.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `Cannot ${req.method} ${req.originalUrl}`
  });
});

module.exports = router;
