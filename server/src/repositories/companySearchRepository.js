/**
 * FinSathi AI - Company Search Repository
 * High-performance database queries for NEPSE company search
 */

const { PrismaClient } = require('@prisma/client');

class CompanySearchRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Search companies with advanced filtering and pagination
   * @param {Object} params - Search parameters
   * @returns {Promise<Object>} Search results
   */
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

      // Build where clause
      const whereClause = this.buildWhereClause(query, filters, sector, listedYear, marketCap);

      // Build order clause
      const orderClause = this.buildOrderClause(sortBy, sortOrder);

      // Execute query with pagination
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
      throw new Error(`Company search failed: ${error.message}`);
    }
  }

  /**
   * Get search suggestions with optimized queries
   * @param {string} query - Search query
   * @param {number} limit - Number of suggestions
   * @returns {Promise<Array>} Search suggestions
   */
  async getSearchSuggestions(query, limit = 5) {
    try {
      const queryLower = query.toLowerCase();
      const queryUpper = query.toUpperCase();
      
      // Use optimized text search with multiple conditions
      const suggestions = await this.prisma.company.findMany({
        where: {
          OR: [
            // Exact symbol match (highest priority)
            { symbol: { contains: queryUpper, mode: 'insensitive' } },
            
            // Exact name match
            { name: { contains: query, mode: 'insensitive' } },
            
            // Name starts with query
            { name: { startsWith: query, mode: 'insensitive' } },
            
            // Sector match
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
          // Prioritize exact matches
          { symbol: { equals: queryUpper } },
          { name: { equals: query } },
          { name: { startsWith: query } },
          // Then by relevance (market cap as proxy)
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

  /**
   * Get popular searches (can be from analytics or predefined)
   * @param {number} limit - Number of popular searches
   * @returns {Promise<Array>} Popular searches
   */
  async getPopularSearches(limit = 10) {
    try {
      // For now, return predefined popular searches
      // In production, this would come from analytics data
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
      throw new Error(`Popular searches failed: ${error.message}`);
    }
  }

  /**
   * Build where clause for search query
   * @param {string} query - Search query
   * @param {Object} filters - Filter options
   * @param {string} sector - Sector filter
   * @param {number} listedYear - Listed year filter
   * @param {Object} marketCap - Market cap filter
   * @returns {Object} Prisma where clause
   */
  buildWhereClause(query, filters, sector, listedYear, marketCap) {
    const whereClause = {
      isActive: true, // Only active companies
    };

    // Text search
    if (query) {
      whereClause.OR = [
        { symbol: { contains: query, mode: 'insensitive' } },
        { name: { contains: query, mode: 'insensitive' } },
        { sector: { contains: query, mode: 'insensitive' } },
      ];
    }

    // Sector filter
    if (sector) {
      whereClause.sector = { contains: sector, mode: 'insensitive' } };
    }

    // Listed year filter
    if (listedYear) {
      whereClause.listedYear = listedYear;
    }

    // Market cap filter
    if (marketCap) {
      whereClause.marketCap = this.getMarketCapWhereClause(marketCap);
    }

    // Advanced filters
    if (filters) {
      if (filters.sectors && filters.sectors.length > 0) {
        whereClause.sector = { in: filters.sectors };
      }

      if (filters.marketCapRanges && filters.marketCapRanges.length > 0) {
        const marketCapConditions = filters.marketCapRanges.map(range => 
          this.getMarketCapWhereClause(range)
        );
        whereClause.OR = [
          ...(whereClause.OR || []),
          ...marketCapConditions,
        ];
      }

      if (filters.listedYearRanges && filters.listedYearRanges.length > 0) {
        const yearConditions = filters.listedYearRanges.map(year => ({
          listedYear: year,
        }));
        whereClause.OR = [
          ...(whereClause.OR || []),
          ...yearConditions,
        ];
      }
    }

    return whereClause;
  }

  /**
   * Build order clause for search results
   * @param {string} sortBy - Sort field
   * @param {string} sortOrder - Sort order
   * @returns {Array} Prisma order clause
   */
  buildOrderClause(sortBy, sortOrder) {
    const orderDirection = sortOrder.toLowerCase() === 'desc' ? 'desc' : 'asc';

    switch (sortBy.toUpperCase()) {
      case 'RELEVANCE':
        // For relevance, we sort by multiple criteria
        return [
          { marketCap: { order: orderDirection, null: 'desc' } }, // Larger companies first
          { name: { order: 'asc', null: orderDirection } }, // Then alphabetically
          { symbol: { order: 'asc', null: orderDirection } },
        ];

      case 'NAME':
        return [{ name: { order: orderDirection, null: orderDirection } }];

      case 'SYMBOL':
        return [{ symbol: { order: orderDirection, null: orderDirection } }];

      case 'MARKET_CAP':
        return [{ marketCap: { order: orderDirection, null: orderDirection } }];

      case 'LISTED_YEAR':
        return [{ listedYear: { order: orderDirection, null: orderDirection } }];

      case 'SECTOR':
        return [{ sector: { order: orderDirection, null: orderDirection } }];

      default:
        // Default to relevance
        return [
          { marketCap: { order: 'desc', null: 'desc' } },
          { name: { order: 'asc', null: 'asc' } },
        ];
    }
  }

  /**
   * Get market cap where clause for range
   * @param {Object} marketCapRange - Market cap range object
   * @returns {Object} Market cap where clause
   */
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
        'SMALL': { lt: 1000000000 }, // < 100 crore
        'MEDIUM': { gte: 1000000000, lt: 10000000000 }, // 100-1000 crore
        'LARGE': { gte: 10000000000, lt: 100000000000 }, // 1000-10000 crore
        'MEGA': { gte: 100000000000 }, // > 10000 crore
      };
      return ranges[marketCapRange.toUpperCase()] || {};
    }

    return {};
  }

  /**
   * Get select fields for search results
   * @returns {Object} Prisma select object
   */
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
      // Include financial data availability flag
      financialReports: {
        select: {
          id: true,
        },
      },
    };
  }

  /**
   * Get company by symbol for detailed view
   * @param {string} symbol - Company symbol
   * @returns {Promise<Object>} Company details
   */
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

      // Add hasFinancialData flag
      const hasFinancialData = company.financialReports && company.financialReports.length > 0;

      return {
        ...company,
        hasFinancialData,
      };

    } catch (error) {
      throw new Error(`Get company by symbol failed: ${error.message}`);
    }
  }

  /**
   * Get companies by sector with pagination
   * @param {string} sector - Sector name
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Sector companies
   */
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
      throw new Error(`Get companies by sector failed: ${error.message}`);
    }
  }

  /**
   * Get market cap distribution
   * @returns {Promise<Object>} Market cap statistics
   */
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
      throw new Error(`Market cap distribution failed: ${error.message}`);
    }
  }

  /**
   * Update search analytics
   * @param {string} query - Search query
   * @param {number} resultCount - Number of results
   * @returns {Promise<void>}
   */
  async updateSearchAnalytics(query, resultCount) {
    try {
      // This would typically store search analytics in a separate table
      // For now, we'll just log it
      console.log(`Search analytics: "${query}" - ${resultCount} results`);

      // In production, you might store this in a search_analytics table
      // await this.prisma.searchAnalytics.create({
      //   query,
      //   resultCount,
      //   searchedAt: new Date(),
      // });

    } catch (error) {
      console.error('Failed to update search analytics:', error);
    }
  }

  /**
   * Get company statistics
   * @returns {Promise<Object>} Company statistics
   */
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
      throw new Error(`Company statistics failed: ${error.message}`);
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = CompanySearchRepository;
