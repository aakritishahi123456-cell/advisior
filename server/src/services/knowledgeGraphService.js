/**
 * FinSathi AI - Knowledge Graph Service
 * Query and manage the financial knowledge graph
 */

const { PrismaClient } = require('@prisma/client');

class KnowledgeGraphService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  // ============================================
  // COMPANY QUERIES
  // ============================================

  /**
   * Get company with all related data
   */
  async getCompanyProfile(symbol) {
    return this.prisma.company.findUnique({
      where: { symbol },
      include: {
        sector: true,
        industry: true,
        market: true,
        financialReports: {
          orderBy: { periodEnd: 'desc' },
          take: 12
        },
        stockPrices: {
          orderBy: { date: 'desc' },
          take: 30
        },
        dividends: {
          orderBy: { fiscalYear: 'desc' },
          take: 5
        },
        peers: {
          include: { peer: true }
        },
        aiReports: {
          orderBy: { createdAt: 'desc' },
          take: 5
        }
      }
    });
  }

  /**
   * Get companies by sector
   */
  async getCompaniesBySector(sectorId, options = {}) {
    const { limit = 20, offset = 0, sortBy = 'marketCap' } = options;

    return this.prisma.company.findMany({
      where: { sectorId, isActive: true },
      include: {
        sector: true,
        stockPrices: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      orderBy: sortBy === 'marketCap' 
        ? { stockPrices: { some: { marketCap: 'desc' } } }
        : { name: 'asc' },
      skip: offset,
      take: limit
    });
  }

  /**
   * Find similar companies (peers)
   */
  async findSimilarCompanies(companyId, limit = 5) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: { sector: true, industry: true }
    });

    if (!company) return [];

    return this.prisma.company.findMany({
      where: {
        id: { not: companyId },
        OR: [
          { sectorId: company.sectorId },
          { industryId: company.industryId }
        ],
        isActive: true
      },
      include: {
        sector: true,
        stockPrices: {
          orderBy: { date: 'desc' },
          take: 1
        }
      },
      take: limit
    });
  }

  // ============================================
  // SECTOR QUERIES
  // ============================================

  /**
   * Get sector with companies and statistics
   */
  async getSectorAnalysis(sectorId) {
    const sector = await this.prisma.sector.findUnique({
      where: { id: sectorId },
      include: {
        companies: {
          include: {
            stockPrices: {
              orderBy: { date: 'desc' },
              take: 1
            },
            financialReports: {
              orderBy: { periodEnd: 'desc' },
              take: 1
            }
          }
        },
        children: true,
        parent: true
      }
    });

    // Calculate sector statistics
    const stats = this.calculateSectorStats(sector.companies);

    return { ...sector, ...stats };
  }

  calculateSectorStats(companies) {
    const activeCompanies = companies.filter(c => c.isActive);
    
    return {
      totalCompanies: activeCompanies.length,
      totalMarketCap: activeCompanies.reduce((sum, c) => 
        sum + (c.stockPrices[0]?.marketCap || 0), 0),
      avgPE: this.average(activeCompanies.map(c => c.stockPrices[0]?.peRatio)),
      avgPB: this.average(activeCompanies.map(c => c.stockPrices[0]?.pbRatio)),
      topGainers: activeCompanies
        .filter(c => c.stockPrices[0]?.changePercent > 0)
        .sort((a, b) => b.stockPrices[0].changePercent - a.stockPrices[0].changePercent)
        .slice(0, 5),
      topLosers: activeCompanies
        .filter(c => c.stockPrices[0]?.changePercent < 0)
        .sort((a, b) => a.stockPrices[0].changePercent - b.stockPrices[0].changePercent)
        .slice(0, 5)
    };
  }

  average(arr) {
    const filtered = arr.filter(v => v != null);
    return filtered.length > 0 ? filtered.reduce((a, b) => a + b, 0) / filtered.length : null;
  }

  // ============================================
  // FINANCIAL ANALYSIS
  // ============================================

  /**
   * Get company financial ratios over time
   */
  async getFinancialRatios(companyId, years = 5) {
    const reports = await this.prisma.financialReport.findMany({
      where: {
        companyId,
        reportType: 'ANNUAL'
      },
      orderBy: { fiscalYear: 'desc' },
      take: years,
      select: {
        fiscalYear: true,
        peRatio: true,
        pbRatio: true,
        roe: true,
        roa: true,
        debtToEquity: true,
        currentRatio: true,
        netProfit: true,
        revenue: true,
        totalEquity: true
      }
    });

    return reports;
  }

  /**
   * Compare companies financially
   */
  async compareCompanies(companyIds) {
    const companies = await this.prisma.company.findMany({
      where: { id: { in: companyIds } },
      include: {
        financialReports: {
          where: { reportType: 'ANNUAL' },
          orderBy: { fiscalYear: 'desc' },
          take: 1
        },
        stockPrices: {
          orderBy: { date: 'desc' },
          take: 1
        }
      }
    });

    return companies.map(c => ({
      symbol: c.symbol,
      name: c.name,
      price: c.stockPrices[0]?.close || 0,
      marketCap: c.stockPrices[0]?.marketCap || 0,
      peRatio: c.stockPrices[0]?.peRatio || c.financialReports[0]?.peRatio,
      pbRatio: c.stockPrices[0]?.pbRatio || c.financialReports[0]?.pbRatio,
      roe: c.financialReports[0]?.roe || 0,
      debtToEquity: c.financialReports[0]?.debtToEquity || 0,
      revenue: c.financialReports[0]?.revenue || 0,
      netProfit: c.financialReports[0]?.netProfit || 0
    }));
  }

  // ============================================
  // MARKET DATA
  // ============================================

  /**
   * Get market index with historical data
   */
  async getMarketIndex(code, days = 30) {
    const index = await this.prisma.marketIndex.findUnique({
      where: { code },
      include: {
        indexValues: {
          orderBy: { date: 'desc' },
          take: days
        }
      }
    });

    if (!index) return null;

    // Calculate statistics
    const values = index.indexValues;
    const stats = {
      current: values[0]?.close || 0,
      high: Math.max(...values.map(v => v.high)),
      low: Math.min(...values.map(v => v.low)),
      avgVolume: this.average(values.map(v => v.volume)),
      avgChange: this.average(values.map(v => v.changePercent)),
      volatility: this.calculateVolatility(values.map(v => v.close))
    };

    return { ...index, stats };
  }

  calculateVolatility(prices) {
    if (prices.length < 2) return 0;
    const returns = [];
    for (let i = 1; i < prices.length; i++) {
      returns.push((prices[i] - prices[i-1]) / prices[i-1]);
    }
    const avg = this.average(returns) || 0;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avg, 2), 0) / returns.length;
    return Math.sqrt(variance) * Math.sqrt(252) * 100; // Annualized volatility %
  }

  /**
   * Get market trends
   */
  async getMarketTrends(options = {}) {
    const { type, sectorId, limit = 10 } = options;

    return this.prisma.marketTrend.findMany({
      where: {
        isActive: true,
        ...(type && { trendType: type }),
        ...(sectorId && { sectorId })
      },
      include: {
        sector: true,
        company: { select: { symbol: true, name: true } },
        index: true
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });
  }

  // ============================================
  // GRAPH TRAVERSALS
  // ============================================

  /**
   * Get full company network (sector → companies → peers)
   */
  async getCompanyNetwork(companyId) {
    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      include: {
        sector: { include: { companies: { take: 10 } } },
        industry: true,
        peers: { include: { peer: true } },
        peerOf: { include: { company: true } }
      }
    });

    return {
      center: company,
      sectorCompanies: company?.sector?.companies || [],
      competitors: company?.peers?.map(p => p.peer) || [],
      groupCompanies: company?.peerOf?.map(p => p.company) || []
    };
  }

  /**
   * Get sector comparison
   */
  async compareSectors(sectorIds) {
    const sectors = await Promise.all(
      sectorIds.map(id => this.getSectorAnalysis(id))
    );

    return sectors.map(s => ({
      name: s.name,
      code: s.code,
      totalCompanies: s.totalCompanies,
      totalMarketCap: s.totalMarketCap,
      avgPE: s.avgPE,
      avgPB: s.avgPB
    }));
  }

  // ============================================
  // SEARCH & DISCOVERY
  // ============================================

  /**
   * Search companies with autocomplete
   */
  async searchCompanies(query, limit = 10) {
    return this.prisma.company.findMany({
      where: {
        OR: [
          { symbol: { contains: query, mode: 'insensitive' } },
          { name: { contains: query, mode: 'insensitive' } }
        ],
        isActive: true
      },
      select: {
        id: true,
        symbol: true,
        name: true,
        sector: { select: { name: true } }
      },
      take: limit
    });
  }

  /**
   * Get market overview
   */
  async getMarketOverview() {
    const indices = await this.prisma.marketIndex.findMany({
      where: { isActive: true },
      include: {
        indexValues: {
          orderBy: { date: 'desc' },
          take: 2
        }
      }
    });

    const totalCompanies = await this.prisma.company.count({
      where: { isActive: true }
    });

    return {
      indices: indices.map(i => ({
        code: i.code,
        name: i.name,
        value: i.indexValues[0]?.close || 0,
        change: i.indexValues[0]?.changePercent || 0
      })),
      totalCompanies,
      marketStatus: 'OPEN' // Would integrate with market hours
    };
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = KnowledgeGraphService;
