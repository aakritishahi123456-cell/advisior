/**
 * FinSathi AI - Portfolio Tracking API Controller
 * REST API endpoints for portfolio management and performance tracking
 */

const PortfolioTrackingService = require('../services/portfolioTrackingService');

class PortfolioController {
  constructor() {
    this.portfolioService = new PortfolioTrackingService();
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(req, res) {
    try {
      const userId = req.user.id; // Assuming user is authenticated
      const { name, description } = req.body;

      if (!name) {
        return res.status(400).json({
          success: false,
          error: 'Portfolio name is required',
          message: 'Please provide a portfolio name'
        });
      }

      const portfolio = await this.portfolioService.createPortfolio(userId, { name, description });

      res.status(201).json({
        success: true,
        data: portfolio,
        message: 'Portfolio created successfully'
      });
    } catch (error) {
      console.error('Error creating portfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create portfolio',
        message: error.message
      });
    }
  }

  /**
   * Get all portfolios for the authenticated user
   */
  async getUserPortfolios(req, res) {
    try {
      const userId = req.user.id;

      const portfolios = await this.portfolioService.getUserPortfolios(userId);

      res.json({
        success: true,
        data: portfolios,
        count: portfolios.length
      });
    } catch (error) {
      console.error('Error fetching user portfolios:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolios',
        message: error.message
      });
    }
  }

  /**
   * Get detailed portfolio information
   */
  async getPortfolio(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this portfolio'
        });
      }

      res.json({
        success: true,
        data: portfolio
      });
    } catch (error) {
      console.error('Error fetching portfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio',
        message: error.message
      });
    }
  }

  /**
   * Add asset to portfolio
   */
  async addAsset(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { companyId, shares, purchasePrice, purchaseDate } = req.body;

      // Validate input
      if (!companyId || !shares || !purchasePrice) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'companyId, shares, and purchasePrice are required'
        });
      }

      if (shares <= 0 || purchasePrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid values',
          message: 'Shares and purchase price must be positive numbers'
        });
      }

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to modify this portfolio'
        });
      }

      const asset = await this.portfolioService.addAsset(id, {
        companyId,
        shares,
        purchasePrice,
        purchaseDate: purchaseDate || new Date().toISOString()
      });

      res.status(201).json({
        success: true,
        data: asset,
        message: 'Asset added to portfolio successfully'
      });
    } catch (error) {
      console.error('Error adding asset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add asset',
        message: error.message
      });
    }
  }

  /**
   * Sell/remove asset from portfolio
   */
  async sellAsset(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const { companyId, shares, sellPrice, sellDate } = req.body;

      // Validate input
      if (!companyId || !shares || !sellPrice) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          message: 'companyId, shares, and sellPrice are required'
        });
      }

      if (shares <= 0 || sellPrice <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Invalid values',
          message: 'Shares and sell price must be positive numbers'
        });
      }

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to modify this portfolio'
        });
      }

      const result = await this.portfolioService.sellAsset(id, {
        companyId,
        shares,
        sellPrice,
        sellDate: sellDate || new Date().toISOString()
      });

      res.json({
        success: true,
        data: result,
        message: 'Asset sold successfully'
      });
    } catch (error) {
      console.error('Error selling asset:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to sell asset',
        message: error.message
      });
    }
  }

  /**
   * Get portfolio performance history
   */
  async getPortfolioPerformance(req, res) {
    try {
      const { id } = req.params;
      const { period = '1M' } = req.query;
      const userId = req.user.id;

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this portfolio'
        });
      }

      const performance = await this.portfolioService.getPortfolioPerformance(id, period);

      res.json({
        success: true,
        data: performance,
        period
      });
    } catch (error) {
      console.error('Error fetching portfolio performance:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio performance',
        message: error.message
      });
    }
  }

  /**
   * Get portfolio transactions
   */
  async getPortfolioTransactions(req, res) {
    try {
      const { id } = req.params;
      const { limit = 50 } = req.query;
      const userId = req.user.id;

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this portfolio'
        });
      }

      const transactions = await this.portfolioService.getPortfolioTransactions(id, parseInt(limit));

      res.json({
        success: true,
        data: transactions,
        count: transactions.length
      });
    } catch (error) {
      console.error('Error fetching portfolio transactions:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio transactions',
        message: error.message
      });
    }
  }

  /**
   * Get portfolio risk metrics
   */
  async getPortfolioRiskMetrics(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to access this portfolio'
        });
      }

      const riskMetrics = await this.portfolioService.calculateRiskMetrics(id);

      res.json({
        success: true,
        data: riskMetrics
      });
    } catch (error) {
      console.error('Error calculating risk metrics:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to calculate risk metrics',
        message: error.message
      });
    }
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to delete this portfolio'
        });
      }

      await this.portfolioService.deletePortfolio(id);

      res.json({
        success: true,
        message: 'Portfolio deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting portfolio:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete portfolio',
        message: error.message
      });
    }
  }

  /**
   * Update portfolio settings
   */
  async updatePortfolioSettings(req, res) {
    try {
      const { id } = req.params;
      const userId = req.user.id;
      const settings = req.body;

      // Verify portfolio ownership
      const portfolio = await this.portfolioService.getPortfolio(id);
      if (portfolio.userId !== userId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          message: 'You do not have permission to modify this portfolio'
        });
      }

      // Update settings (this would need to be implemented in the service)
      const updatedSettings = await this.portfolioService.updateSettings(id, settings);

      res.json({
        success: true,
        data: updatedSettings,
        message: 'Portfolio settings updated successfully'
      });
    } catch (error) {
      console.error('Error updating portfolio settings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update portfolio settings',
        message: error.message
      });
    }
  }

  /**
   * Get portfolio summary for dashboard
   */
  async getPortfolioSummary(req, res) {
    try {
      const userId = req.user.id;

      const portfolios = await this.portfolioService.getUserPortfolios(userId);

      // Calculate summary metrics
      const totalValue = portfolios.reduce((sum, portfolio) => sum + (portfolio.metrics?.totalValue || 0), 0);
      const totalCost = portfolios.reduce((sum, portfolio) => sum + (portfolio.metrics?.totalCost || 0), 0);
      const totalPL = totalValue - totalCost;
      const totalPLP = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

      // Get best and worst performing portfolios
      const portfolioReturns = portfolios.map(portfolio => ({
        id: portfolio.id,
        name: portfolio.name,
        return: portfolio.metrics?.totalPLP || 0,
        value: portfolio.metrics?.totalValue || 0
      }));

      const bestPerformer = portfolioReturns.reduce((best, current) => 
        current.return > best.return ? current : best, portfolioReturns[0]);
      
      const worstPerformer = portfolioReturns.reduce((worst, current) => 
        current.return < worst.return ? current : worst, portfolioReturns[0]);

      // Asset allocation across all portfolios
      const allAssets = portfolios.flatMap(portfolio => portfolio.metrics?.assetAllocation || []);
      const totalAssetValue = allAssets.reduce((sum, asset) => sum + asset.value, 0);
      
      const aggregatedAllocation = allAssets.reduce((acc, asset) => {
        const existing = acc.find(a => a.symbol === asset.symbol);
        if (existing) {
          existing.value += asset.value;
          existing.percentage = (existing.value / totalAssetValue) * 100;
        } else {
          acc.push({
            ...asset,
            percentage: (asset.value / totalAssetValue) * 100
          });
        }
        return acc;
      }, []).sort((a, b) => b.value - a.value);

      const summary = {
        totalPortfolios: portfolios.length,
        totalValue,
        totalCost,
        totalPL,
        totalPLP,
        bestPerformer,
        worstPerformer,
        topHoldings: aggregatedAllocation.slice(0, 10),
        recentActivity: portfolios.flatMap(portfolio => 
          (portfolio.transactions || []).slice(0, 3)
        ).sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10)
      };

      res.json({
        success: true,
        data: summary
      });
    } catch (error) {
      console.error('Error fetching portfolio summary:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch portfolio summary',
        message: error.message
      });
    }
  }

  /**
   * Search available companies for adding to portfolio
   */
  async searchCompanies(req, res) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          message: 'Please provide a search query'
        });
      }

      // This would need to be implemented in the service
      const companies = await this.portfolioService.searchCompanies(q, parseInt(limit));

      res.json({
        success: true,
        data: companies,
        query: q,
        count: companies.length
      });
    } catch (error) {
      console.error('Error searching companies:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search companies',
        message: error.message
      });
    }
  }
}

module.exports = PortfolioController;
