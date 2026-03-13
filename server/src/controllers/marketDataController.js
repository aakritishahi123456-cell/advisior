/**
 * FinSathi AI - Market Data API Controller
 * REST API endpoints for accessing market data
 */

const { PrismaClient } = require('@prisma/client');
const MarketDataPipeline = require('./marketDataPipeline');

class MarketDataController {
  constructor() {
    this.prisma = new PrismaClient();
    this.pipeline = new MarketDataPipeline();
  }

  /**
   * Get current market snapshot
   */
  async getMarketSnapshot(req, res) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      let snapshot = await this.prisma.marketSnapshot.findUnique({
        where: { date: today },
        include: {
          stockPriceHistory: {
            take: 10,
            orderBy: { volume: 'desc' }
          }
        }
      });

      if (!snapshot) {
        // If today's data not available, get latest
        snapshot = await this.prisma.marketSnapshot.findFirst({
          orderBy: { date: 'desc' },
          include: {
            stockPriceHistory: {
              take: 10,
              orderBy: { volume: 'desc' }
            }
          }
        });
      }

      res.json({
        success: true,
        data: snapshot,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching market snapshot:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market snapshot',
        message: error.message
      });
    }
  }

  /**
   * Get stock list with current prices
   */
  async getStockList(req, res) {
    try {
      const { page = 1, limit = 50, sector, search } = req.query;
      const skip = (page - 1) * limit;

      const where = {
        isActive: true,
        ...(sector && { sector }),
        ...(search && {
          OR: [
            { symbol: { contains: search, mode: 'insensitive' } },
            { name: { contains: search, mode: 'insensitive' } }
          ]
        })
      };

      const [stocks, total] = await Promise.all([
        this.prisma.stock.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { volume: 'desc' },
          select: {
            symbol: true,
            name: true,
            price: true,
            change: true,
            changePercent: true,
            volume: true,
            marketCap: true,
            sector: true,
            lastUpdated: true
          }
        }),
        this.prisma.stock.count({ where })
      ]);

      res.json({
        success: true,
        data: stocks,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching stock list:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stock list',
        message: error.message
      });
    }
  }

  /**
   * Get detailed stock information
   */
  async getStockDetails(req, res) {
    try {
      const { symbol } = req.params;

      const stock = await this.prisma.stock.findUnique({
        where: { symbol: symbol.toUpperCase() },
        include: {
          priceHistory: {
            take: 30,
            orderBy: { date: 'desc' }
          },
          recommendations: {
            where: {
              validUntil: {
                gt: new Date()
              }
            },
            orderBy: { createdAt: 'desc' },
            take: 5
          }
        }
      });

      if (!stock) {
        return res.status(404).json({
          success: false,
          error: 'Stock not found',
          message: `Stock ${symbol} not found in database`
        });
      }

      res.json({
        success: true,
        data: stock,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching stock details:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stock details',
        message: error.message
      });
    }
  }

  /**
   * Get stock price history
   */
  async getStockHistory(req, res) {
    try {
      const { symbol } = req.params;
      const { period = '1M', startDate, endDate } = req.query;

      // Calculate date range based on period
      let start, end;
      const now = new Date();

      if (startDate && endDate) {
        start = new Date(startDate);
        end = new Date(endDate);
      } else {
        end = now;
        switch (period) {
          case '1W':
            start = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '1M':
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '3M':
            start = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          case '6M':
            start = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
            break;
          case '1Y':
            start = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
            break;
          default:
            start = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
      }

      const history = await this.prisma.stockPriceHistory.findMany({
        where: {
          symbol: symbol.toUpperCase(),
          date: {
            gte: start.toISOString().split('T')[0],
            lte: end.toISOString().split('T')[0]
          }
        },
        orderBy: { date: 'asc' }
      });

      res.json({
        success: true,
        data: history,
        period,
        dateRange: {
          start: start.toISOString().split('T')[0],
          end: end.toISOString().split('T')[0]
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching stock history:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch stock history',
        message: error.message
      });
    }
  }

  /**
   * Get market indicators
   */
  async getMarketIndicators(req, res) {
    try {
      const indicators = await this.prisma.marketIndicator.findMany({
        orderBy: { lastUpdated: 'desc' }
      });

      res.json({
        success: true,
        data: indicators,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching market indicators:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market indicators',
        message: error.message
      });
    }
  }

  /**
   * Get top gainers and losers
   */
  async getTopMovers(req, res) {
    try {
      const { limit = 10 } = req.query;

      const [gainers, losers] = await Promise.all([
        this.prisma.stock.findMany({
          where: {
            isActive: true,
            changePercent: { gt: 0 }
          },
          orderBy: { changePercent: 'desc' },
          take: parseInt(limit),
          select: {
            symbol: true,
            name: true,
            price: true,
            change: true,
            changePercent: true,
            volume: true
          }
        }),
        this.prisma.stock.findMany({
          where: {
            isActive: true,
            changePercent: { lt: 0 }
          },
          orderBy: { changePercent: 'asc' },
          take: parseInt(limit),
          select: {
            symbol: true,
            name: true,
            price: true,
            change: true,
            changePercent: true,
            volume: true
          }
        })
      ]);

      res.json({
        success: true,
        data: {
          gainers,
          losers
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching top movers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch top movers',
        message: error.message
      });
    }
  }

  /**
   * Get market news
   */
  async getMarketNews(req, res) {
    try {
      const { page = 1, limit = 20, category } = req.query;
      const skip = (page - 1) * limit;

      const where = category ? { category } : {};

      const [news, total] = await Promise.all([
        this.prisma.marketNews.findMany({
          where,
          skip,
          take: parseInt(limit),
          orderBy: { publishedAt: 'desc' },
          select: {
            id: true,
            title: true,
            summary: true,
            source: true,
            category: true,
            sentiment: true,
            publishedAt: true
          }
        }),
        this.prisma.marketNews.count({ where })
      ]);

      res.json({
        success: true,
        data: news,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / limit)
        },
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching market news:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch market news',
        message: error.message
      });
    }
  }

  /**
   * Trigger manual pipeline execution
   */
  async triggerPipeline(req, res) {
    try {
      const { source = 'manual' } = req.body;

      // Start pipeline execution
      this.pipeline.runManually()
        .then(result => {
          console.log('Pipeline execution completed:', result);
        })
        .catch(error => {
          console.error('Pipeline execution failed:', error);
        });

      res.json({
        success: true,
        message: 'Pipeline execution started',
        source,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error triggering pipeline:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger pipeline',
        message: error.message
      });
    }
  }

  /**
   * Get pipeline status
   */
  async getPipelineStatus(req, res) {
    try {
      const status = await this.pipeline.getStatus();

      res.json({
        success: true,
        data: status,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching pipeline status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch pipeline status',
        message: error.message
      });
    }
  }

  /**
   * Search stocks
   */
  async searchStocks(req, res) {
    try {
      const { q, limit = 20 } = req.query;

      if (!q) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          message: 'Please provide a search query'
        });
      }

      const stocks = await this.prisma.stock.findMany({
        where: {
          isActive: true,
          OR: [
            { symbol: { contains: q, mode: 'insensitive' } },
            { name: { contains: q, mode: 'insensitive' } }
          ]
        },
        take: parseInt(limit),
        select: {
          symbol: true,
          name: true,
          price: true,
          change: true,
          changePercent: true,
          sector: true
        }
      });

      res.json({
        success: true,
        data: stocks,
        query: q,
        count: stocks.length,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error searching stocks:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to search stocks',
        message: error.message
      });
    }
  }

  /**
   * Get sector analysis
   */
  async getSectorAnalysis(req, res) {
    try {
      const sectors = await this.prisma.stock.groupBy({
        by: ['sector'],
        where: {
          isActive: true,
          sector: { not: null }
        },
        _count: {
          symbol: true
        },
        _sum: {
          marketCap: true,
          volume: true
        },
        _avg: {
          changePercent: true
        }
      });

      const sectorData = sectors
        .filter(s => s.sector)
        .map(sector => ({
          sector: sector.sector,
          stockCount: sector._count.symbol,
          totalMarketCap: sector._sum.marketCap || 0,
          totalVolume: sector._sum.volume || 0,
          avgChangePercent: sector._avg.changePercent || 0
        }))
        .sort((a, b) => b.totalMarketCap - a.totalMarketCap);

      res.json({
        success: true,
        data: sectorData,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching sector analysis:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sector analysis',
        message: error.message
      });
    }
  }
}

module.exports = MarketDataController;
