/**
 * FinSathi AI - Company Search Repository
 * High-performance database queries for NEPSE company search
 */

const { PrismaClient } = require('@prisma/client');

class CompanySearchRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  async searchCompanies(params) {
    try {
      const {
        q: query,
        page = 1,
        limit = 20,
        sortBy = 'RELEVANCE',
        sortOrder = 'DESC',
        filters,
        sector,
        listedYear,
        marketCap,
      } = params;

      const whereClause = this.buildWhereClause(query, filters, sector, listedYear, marketCap);
      const orderClause = this.buildOrderClause(sortBy, sortOrder);

      const [companies, total] = await Promise.all([
        this.prisma.company.findMany({
          where: whereClause,
          select: this.getSearchSelect(),
          order: orderClause,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.company.count({ where: whereClause }),
      ]);

      return {
        companies,
        total,
        hasMore: page * limit < total,
      };

    } catch (error) {
      throw new Error('Company search failed: ' + error.message);
    }
  }

  async getSearchSuggestions(query, limit = 5) {
    try {
      const queryLower = query.toLowerCase();
      const queryUpper = query.toUpperCase();
      
      const suggestions = await this.prisma.company.findMany({
        where: {
          OR: [
            { symbol: { contains: queryUpper, mode: 'insensitive' } },
            { name: { contains: query, mode: 'insensitive' } },
            { name: { startsWith: query, mode: 'insensitive' } },
            { sector: { contains: query, mode: 'insensitive' } },
          ],
        },
        select: {
          id: true,
          symbol: true,
          name: true,
          sector: true,
          listedYear: true,
        },
        orderBy: [
          { symbol: { equals: queryUpper } },
          { name: { equals: query } },
          { name: { startsWith: query } },
          { marketCap: 'desc' },
          { name: 'asc' },
        ],
        take: limit,
      });

      return suggestions;

    } catch (error) {
      throw new Error('Search suggestions failed: ' + error.message);
    }
  }

  async getPopularSearches(limit = 10) {
    try {
      const popularSearches = [
        { query: 'NABIL', count: 15420, trend: 'stable' },
        { query: 'NICA', count: 12350, trend: 'up' },
        { query: 'SCB', count: 10230, trend: 'stable' },
        { query: 'EBL', count: 9870, trend: 'up' },
        { query: 'NBL', count: 8950, trend: 'down' },
        { query: 'Himalayan Bank', count: 7650, trend: 'stable' },
        { query: 'Prabhu Bank', count: 6430, trend: 'stable' },
        { query: 'Agricultural Development Bank', count: 5890, trend: 'up' },
        { query: 'Citizens Bank', count: 5210, trend: 'stable' },
        { query: 'Sanima Bank', count: 4890, trend: 'down' },
      ];

      return popularSearches.slice(0, limit);

    } catch (error) {
      throw new Error('Popular searches failed: ' + error.message);
    }
  }

  buildWhereClause(query, filters, sector, listedYear, marketCap) {
    const whereClause = {
      isActive: true,
    };

    if (query) {
      whereClause.OR = [
        { symbol: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { sector: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (sector) {
      whereClause.sector = { contains: sector, mode: 'insensitive' };
    }

    if (listedYear) {
      whereClause.listedYear = listedYear;
    }

    if (marketCap) {
      const marketCapCondition = this.getMarketCapWhereClause(marketCap);
      if (Object.keys(marketCapCondition).length > 0) {
        whereClause.AND = [
          ...(whereClause.AND || []),
          marketCapCondition,
        ];
      }
    }

    if (filters) {
      if (filters.sectors && filters.sectors.length > 0) {
        whereClause.sector = { in: filters.sectors };
      }

      if (filters.marketCapRanges && filters.marketCapRanges.length > 0) {
        const marketCapConditions = filters.marketCapRanges.map(range => 
          this.getMarketCapWhereClause(range)
        );
        const existingConditions = whereClause.AND || [];
        whereClause.AND = [
          ...existingConditions,
          ...marketCapConditions,
        ];
      }

      if (filters.listedYearRanges && filters.listedYearRanges.length > 0) {
        const yearConditions = filters.listedYearRanges.map(year => ({
          listedYear: year,
        }));
        const existingConditions = whereClause.AND || [];
        whereClause.AND = [
          ...existingConditions,
          ...yearConditions,
        ];
      }
    }

    return whereClause;
  }

  buildOrderClause(sortBy, sortOrder) {
    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';

    switch (sortBy.toUpperCase()) {
      case 'RELEVANCE':
        return [
          { marketCap: { order: orderDirection } },
          { name: { order: 'asc' } },
          { symbol: { order: 'asc' } },
        ];

      case 'NAME':
        return [{ name: { order: orderDirection } }];

      case 'SYMBOL':
        return [{ symbol: { order: orderDirection } }];

      case 'MARKET_CAP':
        return [{ marketCap: { order: orderDirection } }];

      case 'LISTED_YEAR':
        return [{ listedYear: { order: orderDirection } }];

      case 'SECTOR':
        return [{ sector: { order: orderDirection } }];

      default:
        return [
          { marketCap: { order: 'desc' } },
          { name: { order: 'asc' } },
        ];
    }
  }

  getMarketCapWhereClause(marketCapRange) {
    if (typeof marketCapRange === 'object' && marketCapRange.min !== undefined && marketCapRange.max !== undefined) {
      return {
        marketCap: {
          gte: marketCapRange.min,
          lte: marketCapRange.max,
        },
      };
    }

    if (typeof marketCapRange === 'string') {
      const ranges = {
        'SMALL': { lt: 1000000000 },
        'MEDIUM': { gte: 1000000000, lt: 10000000000 },
        'LARGE': { gte: 10000000000, lt: 100000000000 },
        'MEGA': { gte: 100000000000 },
      };
      return ranges[marketCapRange.toUpperCase()] || {};
    }

    return {};
  }

  getSearchSelect() {
    return {
      id: true,
      symbol: true,
      name: true,
      sector: true,
      listedYear: true,
      marketCap: true,
      description: true,
      website: true,
      isActive: true,
      createdAt: true,
      updatedAt: true,
      financialReports: {
        select: {
          id: true,
        },
      },
    };
  }

  async getCompanyBySymbol(symbol) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { 
          symbol: symbol.toUpperCase(),
          isActive: true,
        },
        include: {
          financialReports: {
            select: {
              id: true,
              year: true,
            },
            orderBy: { year: 'desc' },
            take: 1,
          },
        },
      });

      if (!company) {
        return null;
      }

      const hasFinancialData = company.financialReports && company.financialReports.length > 0;

      return {
        ...company,
        hasFinancialData,
      };

    } catch (error) {
      throw new Error('Get company by symbol failed: ' + error.message);
    }
  }

  async getCompaniesBySector(sector, options = {}) {
    try {
      const { page = 1, limit = 20, sortBy = 'MARKET_CAP', sortOrder = 'DESC' } = options;

      const whereClause = {
        sector: { contains: sector, mode: 'insensitive' },
        isActive: true,
      };

      const orderClause = this.buildOrderClause(sortBy, sortOrder);

      const [companies, total] = await Promise.all([
        this.prisma.company.findMany({
          where: whereClause,
          select: this.getSearchSelect(),
          order: orderClause,
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.company.count({ where: whereClause }),
      ]);

      return {
        companies,
        total,
        page,
        limit,
      };

    } catch (error) {
      throw new Error('Get companies by sector failed: ' + error.message);
    }
  }

  async getMarketCapDistribution() {
    try {
      const marketCapStats = await this.prisma.company.groupBy({
        by: ['marketCapCategory'],
        _count: {
          id: true,
        },
        where: {
          isActive: true,
          marketCap: { not: null },
        },
      });

      return marketCapStats;

    } catch (error) {
      throw new Error('Market cap distribution failed: ' + error.message);
    }
  }

  async updateSearchAnalytics(query, resultCount) {
    try {
      console.log('Search analytics: "' + query + '" - ' + resultCount + ' results');
    } catch (error) {
      console.error('Failed to update search analytics:', error);
    }
  }

  async getCompanyStatistics() {
    try {
      const [
        totalCompanies,
        activeCompanies,
        companiesBySector,
        companiesByYear,
        marketCapDistribution,
      ] = await Promise.all([
        this.prisma.company.count(),
        this.prisma.company.count({ where: { isActive: true } }),
        this.prisma.company.groupBy({
          by: ['sector'],
          _count: { id: true },
          where: { isActive: true },
        }),
        this.prisma.company.groupBy({
          by: ['listedYear'],
          _count: { id: true },
          where: { isActive: true },
        }),
        this.getMarketCapDistribution(),
      ]);

      return {
        totalCompanies,
        activeCompanies,
        inactiveCompanies: totalCompanies - activeCompanies,
        companiesBySector,
        companiesByYear,
        marketCapDistribution,
        lastUpdated: new Date().toISOString(),
      };

    } catch (error) {
      throw new Error('Company statistics failed: ' + error.message);
    }
  }

  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = CompanySearchRepository;
