/**
 * FinSathi AI - Portfolio Tracking Service
 * Comprehensive portfolio management and performance calculation service
 */

const { PrismaClient } = require('@prisma/client');

class PortfolioTrackingService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new portfolio
   */
  async createPortfolio(userId, portfolioData) {
    try {
      const portfolio = await this.prisma.portfolio.create({
        data: {
          name: portfolioData.name,
          description: portfolioData.description,
          userId: userId
        },
        include: {
          assets: {
            include: {
              company: true
            }
          }
        }
      });

      // Create default settings
      await this.prisma.portfolioSettings.create({
        data: {
          portfolioId: portfolio.id,
          riskTolerance: 'MODERATE',
          maxPositionSize: 20.0,
          stopLossPercent: 15.0,
          takeProfitPercent: 25.0
        }
      });

      return portfolio;
    } catch (error) {
      throw new Error(`Failed to create portfolio: ${error.message}`);
    }
  }

  /**
   * Add asset to portfolio
   */
  async addAsset(portfolioId, assetData) {
    try {
      const { companyId, shares, purchasePrice, purchaseDate } = assetData;

      // Check if asset already exists
      const existingAsset = await this.prisma.portfolioAsset.findUnique({
        where: {
          portfolioId_companyId: {
            portfolioId,
            companyId
          }
        }
      });

      let asset;
      if (existingAsset) {
        // Update existing asset (average cost basis)
        const newTotalShares = existingAsset.shares + shares;
        const newTotalCost = (existingAsset.shares * existingAsset.purchasePrice) + (shares * purchasePrice);
        const newAveragePrice = newTotalCost / newTotalShares;

        asset = await this.prisma.portfolioAsset.update({
          where: {
            id: existingAsset.id
          },
          data: {
            shares: newTotalShares,
            purchasePrice: newAveragePrice,
            lastUpdated: new Date()
          },
          include: {
            company: true
          }
        });
      } else {
        // Create new asset
        asset = await this.prisma.portfolioAsset.create({
          data: {
            portfolioId,
            companyId,
            shares,
            purchasePrice,
            purchaseDate: new Date(purchaseDate),
            totalCost: shares * purchasePrice
          },
          include: {
            company: true
          }
        });
      }

      // Record transaction
      await this.prisma.portfolioTransaction.create({
        data: {
          portfolioId,
          assetId: asset.id,
          companyId,
          type: 'BUY',
          shares,
          price: purchasePrice,
          totalAmount: shares * purchasePrice,
          date: new Date(purchaseDate)
        }
      });

      // Update portfolio performance
      await this.updatePortfolioPerformance(portfolioId);

      return asset;
    } catch (error) {
      throw new Error(`Failed to add asset: ${error.message}`);
    }
  }

  /**
   * Remove/sell asset from portfolio
   */
  async sellAsset(portfolioId, assetData) {
    try {
      const { companyId, shares, sellPrice, sellDate } = assetData;

      const existingAsset = await this.prisma.portfolioAsset.findUnique({
        where: {
          portfolioId_companyId: {
            portfolioId,
            companyId
          }
        }
      });

      if (!existingAsset) {
        throw new Error('Asset not found in portfolio');
      }

      if (shares > existingAsset.shares) {
        throw new Error('Cannot sell more shares than owned');
      }

      const sellAmount = shares * sellPrice;
      const costBasis = shares * existingAsset.purchasePrice;
      const realizedPL = sellAmount - costBasis;

      // Update asset
      const updatedAsset = await this.prisma.portfolioAsset.update({
        where: {
          id: existingAsset.id
        },
        data: {
          shares: existingAsset.shares - shares,
          realizedPL: existingAsset.realizedPL + realizedPL,
          lastUpdated: new Date()
        },
        include: {
          company: true
        }
      });

      // Remove asset if no shares left
      if (updatedAsset.shares === 0) {
        await this.prisma.portfolioAsset.delete({
          where: { id: existingAsset.id }
        });
      }

      // Record transaction
      await this.prisma.portfolioTransaction.create({
        data: {
          portfolioId,
          assetId: existingAsset.id,
          companyId,
          type: 'SELL',
          shares,
          price: sellPrice,
          totalAmount: sellAmount,
          date: new Date(sellDate)
        }
      });

      // Update portfolio performance
      await this.updatePortfolioPerformance(portfolioId);

      return {
        asset: updatedAsset,
        realizedPL,
        sellAmount,
        costBasis
      };
    } catch (error) {
      throw new Error(`Failed to sell asset: ${error.message}`);
    }
  }

  /**
   * Get portfolio with current values
   */
  async getPortfolio(portfolioId) {
    try {
      const portfolio = await this.prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: {
          assets: {
            include: {
              company: true
            }
          },
          transactions: {
            orderBy: { date: 'desc' },
            take: 10
          },
          performance: {
            orderBy: { date: 'desc' },
            take: 30
          },
          settings: true,
          user: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        }
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Get current prices for all assets
      const assetsWithCurrentValues = await Promise.all(
        portfolio.assets.map(async (asset) => {
          const currentPrice = await this.getCurrentPrice(asset.companyId);
          const currentValue = asset.shares * currentPrice;
          const unrealizedPL = currentValue - (asset.shares * asset.purchasePrice);
          const unrealizedPLP = (unrealizedPL / (asset.shares * asset.purchasePrice)) * 100;

          return {
            ...asset,
            currentPrice,
            currentValue,
            unrealizedPL,
            unrealizedPLP
          };
        })
      );

      // Calculate portfolio metrics
      const portfolioMetrics = this.calculatePortfolioMetrics(assetsWithCurrentValues, portfolio.transactions);

      return {
        ...portfolio,
        assets: assetsWithCurrentValues,
        metrics: portfolioMetrics
      };
    } catch (error) {
      throw new Error(`Failed to get portfolio: ${error.message}`);
    }
  }

  /**
   * Get current price for a company
   */
  async getCurrentPrice(companyId) {
    try {
      const latestPrice = await this.prisma.dailyStockPrice.findFirst({
        where: { companyId },
        orderBy: { date: 'desc' },
        select: { closePrice: true }
      });

      return latestPrice ? latestPrice.closePrice : 0;
    } catch (error) {
      console.error(`Failed to get current price for ${companyId}:`, error);
      return 0;
    }
  }

  /**
   * Calculate portfolio performance metrics
   */
  calculatePortfolioMetrics(assets, transactions) {
    const totalValue = assets.reduce((sum, asset) => sum + (asset.currentValue || 0), 0);
    const totalCost = assets.reduce((sum, asset) => sum + (asset.shares * asset.purchasePrice), 0);
    const totalPL = totalValue - totalCost;
    const totalPLP = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;

    // Calculate realized P&L from transactions
    const sellTransactions = transactions.filter(t => t.type === 'SELL');
    const realizedPL = sellTransactions.reduce((sum, transaction) => {
      const correspondingBuy = transactions.find(t => 
        t.type === 'BUY' && 
        t.companyId === transaction.companyId && 
        t.date <= transaction.date
      );
      if (correspondingBuy) {
        return sum + (transaction.totalAmount - (transaction.shares * correspondingBuy.price));
      }
      return sum;
    }, 0);

    // Calculate asset allocation
    const assetAllocation = assets.map(asset => ({
      symbol: asset.company.symbol,
      name: asset.company.name,
      shares: asset.shares,
      value: asset.currentValue || 0,
      percentage: totalValue > 0 ? ((asset.currentValue || 0) / totalValue) * 100 : 0,
      weight: totalValue > 0 ? (asset.currentValue || 0) / totalValue : 0
    })).sort((a, b) => b.value - a.value);

    // Sector allocation
    const sectorAllocation = {};
    assets.forEach(asset => {
      const sector = asset.company.sector || 'Unknown';
      const value = asset.currentValue || 0;
      if (!sectorAllocation[sector]) {
        sectorAllocation[sector] = { value: 0, percentage: 0 };
      }
      sectorAllocation[sector].value += value;
      sectorAllocation[sector].percentage = totalValue > 0 ? (sectorAllocation[sector].value / totalValue) * 100 : 0;
    });

    // Performance metrics
    const performanceMetrics = {
      totalValue,
      totalCost,
      totalPL,
      totalPLP,
      realizedPL,
      unrealizedPL: totalPL - realizedPL,
      assetCount: assets.length,
      assetAllocation,
      sectorAllocation,
      topHoldings: assetAllocation.slice(0, 10),
      cashBalance: 0 // Can be calculated from transactions if needed
    };

    return performanceMetrics;
  }

  /**
   * Update portfolio performance history
   */
  async updatePortfolioPerformance(portfolioId) {
    try {
      const portfolio = await this.prisma.portfolio.findUnique({
        where: { id: portfolioId },
        include: {
          assets: {
            include: {
              company: true
            }
          }
        }
      });

      if (!portfolio) {
        throw new Error('Portfolio not found');
      }

      // Get current values
      const assetsWithCurrentValues = await Promise.all(
        portfolio.assets.map(async (asset) => {
          const currentPrice = await this.getCurrentPrice(asset.companyId);
          const currentValue = asset.shares * currentPrice;
          return {
            ...asset,
            currentPrice,
            currentValue
          };
        })
      );

      const metrics = this.calculatePortfolioMetrics(assetsWithCurrentValues, []);

      // Get previous day's performance for change calculation
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const previousPerformance = await this.prisma.portfolioPerformance.findFirst({
        where: {
          portfolioId,
          date: {
            lt: yesterday
          }
        },
        orderBy: { date: 'desc' }
      });

      const dayChange = previousPerformance ? metrics.totalValue - previousPerformance.totalValue : 0;
      const dayChangeP = previousPerformance.totalValue > 0 ? (dayChange / previousPerformance.totalValue) * 100 : 0;

      // Create or update performance record
      await this.prisma.portfolioPerformance.upsert({
        where: {
          portfolioId_date: {
            portfolioId,
            date: new Date().setHours(0, 0, 0, 0)
          }
        },
        update: {
          totalValue: metrics.totalValue,
          totalCost: metrics.totalCost,
          totalPL: metrics.totalPL,
          totalPLP: metrics.totalPLP,
          dayChange,
          dayChangeP
        },
        create: {
          portfolioId,
          date: new Date().setHours(0, 0, 0, 0),
          totalValue: metrics.totalValue,
          totalCost: metrics.totalCost,
          totalPL: metrics.totalPL,
          totalPLP: metrics.totalPLP,
          dayChange,
          dayChangeP
        }
      });

      return metrics;
    } catch (error) {
      throw new Error(`Failed to update portfolio performance: ${error.message}`);
    }
  }

  /**
   * Get portfolio performance history
   */
  async getPortfolioPerformance(portfolioId, period = '1M') {
    try {
      const startDate = new Date();
      switch (period) {
        case '1W':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case '1M':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case '3M':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case '6M':
          startDate.setMonth(startDate.getMonth() - 6);
          break;
        case '1Y':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
        default:
          startDate.setMonth(startDate.getMonth() - 1);
      }

      const performance = await this.prisma.portfolioPerformance.findMany({
        where: {
          portfolioId,
          date: {
            gte: startDate
          }
        },
        orderBy: { date: 'asc' }
      });

      return performance;
    } catch (error) {
      throw new Error(`Failed to get portfolio performance: ${error.message}`);
    }
  }

  /**
   * Get all portfolios for a user
   */
  async getUserPortfolios(userId) {
    try {
      const portfolios = await this.prisma.portfolio.findMany({
        where: {
          userId,
          isActive: true
        },
        include: {
          assets: {
            include: {
              company: true
            }
          },
          _count: {
            select: {
              assets: true,
              transactions: true
            }
          }
        },
        orderBy: { updatedAt: 'desc' }
      });

      // Calculate basic metrics for each portfolio
      const portfoliosWithMetrics = await Promise.all(
        portfolios.map(async (portfolio) => {
          const assetsWithCurrentValues = await Promise.all(
            portfolio.assets.map(async (asset) => {
              const currentPrice = await this.getCurrentPrice(asset.companyId);
              const currentValue = asset.shares * currentPrice;
              return {
                ...asset,
                currentPrice,
                currentValue
              };
            })
          );

          const metrics = this.calculatePortfolioMetrics(assetsWithCurrentValues, []);

          return {
            ...portfolio,
            metrics
          };
        })
      );

      return portfoliosWithMetrics;
    } catch (error) {
      throw new Error(`Failed to get user portfolios: ${error.message}`);
    }
  }

  /**
   * Delete portfolio
   */
  async deletePortfolio(portfolioId) {
    try {
      // Delete related records first (cascade delete should handle this, but being explicit)
      await this.prisma.portfolioTransaction.deleteMany({
        where: { portfolioId }
      });

      await this.prisma.portfolioPerformance.deleteMany({
        where: { portfolioId }
      });

      await this.prisma.portfolioAsset.deleteMany({
        where: { portfolioId }
      });

      await this.prisma.portfolio.delete({
        where: { id: portfolioId }
      });

      return { success: true };
    } catch (error) {
      throw new Error(`Failed to delete portfolio: ${error.message}`);
    }
  }

  /**
   * Get portfolio transactions
   */
  async getPortfolioTransactions(portfolioId, limit = 50) {
    try {
      const transactions = await this.prisma.portfolioTransaction.findMany({
        where: { portfolioId },
        include: {
          asset: {
            include: {
              company: true
            }
          }
        },
        orderBy: { date: 'desc' },
        take: limit
      });

      return transactions;
    } catch (error) {
      throw new Error(`Failed to get portfolio transactions: ${error.message}`);
    }
  }

  /**
   * Calculate portfolio risk metrics
   */
  async calculateRiskMetrics(portfolioId) {
    try {
      const portfolio = await this.getPortfolio(portfolioId);
      const performance = await this.getPortfolioPerformance(portfolioId, '1Y');

      if (performance.length < 2) {
        return {
          volatility: 0,
          sharpeRatio: 0,
          maxDrawdown: 0,
          beta: 1,
          alpha: 0
        };
      }

      // Calculate daily returns
      const returns = [];
      for (let i = 1; i < performance.length; i++) {
        const dailyReturn = (performance[i].totalValue - performance[i-1].totalValue) / performance[i-1].totalValue;
        returns.push(dailyReturn);
      }

      // Calculate volatility (standard deviation of returns)
      const meanReturn = returns.reduce((sum, ret) => sum + ret, 0) / returns.length;
      const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - meanReturn, 2), 0) / returns.length;
      const volatility = Math.sqrt(variance) * Math.sqrt(252); // Annualized

      // Calculate maximum drawdown
      let maxDrawdown = 0;
      let peak = performance[0].totalValue;
      
      for (const perf of performance) {
        if (perf.totalValue > peak) {
          peak = perf.totalValue;
        }
        const drawdown = (peak - perf.totalValue) / peak;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }

      // Calculate Sharpe ratio (assuming risk-free rate of 3%)
      const annualReturn = (performance[performance.length - 1].totalValue / performance[0].totalValue) - 1;
      const riskFreeRate = 0.03;
      const sharpeRatio = volatility > 0 ? (annualReturn - riskFreeRate) / volatility : 0;

      return {
        volatility: volatility * 100, // Convert to percentage
        sharpeRatio,
        maxDrawdown: maxDrawdown * 100, // Convert to percentage
        beta: 1, // Would need market data for accurate calculation
        alpha: 0  // Would need market data for accurate calculation
      };
    } catch (error) {
      throw new Error(`Failed to calculate risk metrics: ${error.message}`);
    }
  }
}

module.exports = PortfolioTrackingService;
