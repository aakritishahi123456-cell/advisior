/**
 * FinSathi AI - Company Search Controller
 * High-performance API for searching NEPSE companies
 */

class CompanySearchController {
  constructor(repository) {
    this.repository = repository;
    this.cache = new Map(); // Simple in-memory cache
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Search companies with comprehensive filtering and pagination
   * GET /v1/companies
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async searchCompanies(req, res, next) {
    try {
      const startTime = Date.now();
      
      // Parse and validate query parameters
      const searchParams = this.parseSearchParams(req.query);
      
      // Validate parameters
      const validation = this.validateSearchParams(searchParams);
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: validation.error,
          code: validation.code,
        });
      }

      // Check cache for identical queries
      const cacheKey = this.generateCacheKey(searchParams);
      const cachedResult = this.getFromCache(cacheKey);
      
      if (cachedResult) {
        return res.status(200).json({
          success: true,
          data: cachedResult,
          meta: {
            ...cachedResult.meta,
            cached: true,
            processingTime: Date.now() - startTime,
          },
        });
      }

      // Perform database search
      const searchResult = await this.repository.searchCompanies(searchParams);

      // Process results
      const processedResults = this.processSearchResults(searchResult.companies, searchParams);

      // Build response
      const response = {
        success: true,
        data: {
          companies: processedResults,
          pagination: {
            currentPage: searchParams.page,
            pageSize: searchParams.limit,
            totalItems: searchResult.total,
            totalPages: Math.ceil(searchResult.total / searchParams.limit),
            hasNextPage: searchParams.page * searchParams.limit < searchResult.total,
            hasPreviousPage: searchParams.page > 1,
          },
          search: {
            query: searchParams.q,
            filters: searchParams.filters,
            sortBy: searchParams.sortBy,
            sortOrder: searchParams.sortOrder,
          },
        },
        meta: {
          requestId: this.generateRequestId(),
          timestamp: new Date().toISOString(),
          processingTime: Date.now() - startTime,
          cacheTimeout: this.cacheTimeout / 1000,
          performance: {
            queryComplexity: this.assessQueryComplexity(searchParams),
            database: 'postgresql',
            indexing: 'optimized',
          },
        },
      };

      // Cache the result
      this.setCache(cacheKey, response);

      // Set cache headers
      res.set('Cache-Control', `public, max-age=${this.cacheTimeout / 1000}`);
      res.set('ETag', cacheKey);

      res.status(200).json(response);

    } catch (error) {
      console.error('Company search error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        meta: {
          timestamp: new Date().toISOString(),
          requestId: this.generateRequestId(),
        },
      });
    }
  }

  /**
   * Get search suggestions
   * GET /v1/companies/suggestions
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getSearchSuggestions(req, res, next) {
    try {
      const { q: query, limit = 5 } = req.query;

      if (!query || query.length < 2) {
        return res.status(400).json({
          success: false,
          error: 'Query parameter is required and must be at least 2 characters',
          code: 'INVALID_QUERY',
        });
      }

      if (limit < 1 || limit > 20) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 20',
          code: 'INVALID_LIMIT',
        });
      }

      // Get suggestions using optimized query
      const suggestions = await this.repository.getSearchSuggestions(query, parseInt(limit));

      res.status(200).json({
        success: true,
        data: {
          query,
          suggestions,
        },
        meta: {
          count: suggestions.length,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Search suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get popular searches
   * GET /v1/companies/popular-searches
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPopularSearches(req, res, next) {
    try {
      const { limit = 10 } = req.query;

      const popularSearches = await this.repository.getPopularSearches(parseInt(limit));

      res.status(200).json({
        success: true,
        data: popularSearches,
        meta: {
          count: popularSearches.length,
          timestamp: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Popular searches error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Parse and sanitize search parameters
   * @param {Object} query - Request query parameters
   * @returns {Object} Parsed search parameters
   */
  parseSearchParams(query) {
    return {
      q: (query.q || '').trim().substring(0, 100), // Limit query length
      page: Math.max(1, parseInt(query.page) || 1),
      limit: Math.min(100, Math.max(1, parseInt(query.limit) || 20)), // Max 100 per page
      sortBy: query.sortBy || 'RELEVANCE',
      sortOrder: query.sortOrder || 'DESC',
      filters: this.parseFilters(query.filters),
      sector: query.sector || null,
      listedYear: query.listedYear ? parseInt(query.listedYear) : null,
      marketCap: query.marketCap || null,
    };
  }

  /**
   * Parse filter parameters
   * @param {string} filters - Filter string
   * @returns {Object} Parsed filters
   */
  parseFilters(filters) {
    const parsedFilters = {
      sectors: [],
      marketCapRanges: [],
      listedYearRanges: [],
    };

    if (!filters) return parsedFilters;

    try {
      const filterObj = JSON.parse(filters);
      
      if (filterObj.sectors && Array.isArray(filterObj.sectors)) {
        parsedFilters.sectors = filterObj.sectors.filter(s => typeof s === 'string');
      }
      
      if (filterObj.marketCap && Array.isArray(filterObj.marketCap)) {
        parsedFilters.marketCapRanges = filterObj.marketCap;
      }
      
      if (filterObj.listedYears && Array.isArray(filterObj.listedYears)) {
        parsedFilters.listedYearRanges = filterObj.listedYears.filter(y => typeof y === 'number');
      }

    } catch (error) {
      // Invalid JSON, ignore filters
    }

    return parsedFilters;
  }

  /**
   * Validate search parameters
   * @param {Object} params - Parsed parameters
   * @returns {Object} Validation result
   */
  validateSearchParams(params) {
    // Validate page number
    if (params.page < 1 || params.page > 1000) {
      return {
        isValid: false,
        error: 'Page must be between 1 and 1000',
        code: 'INVALID_PAGE',
      };
    }

    // Validate limit
    if (params.limit < 1 || params.limit > 100) {
      return {
        isValid: false,
        error: 'Limit must be between 1 and 100',
        code: 'INVALID_LIMIT',
      };
    }

    // Validate sort options
    const validSortOptions = ['RELEVANCE', 'NAME', 'SYMBOL', 'MARKET_CAP', 'LISTED_YEAR', 'SECTOR'];
    if (!validSortOptions.includes(params.sortBy)) {
      return {
        isValid: false,
        error: `Invalid sort option. Must be one of: ${validSortOptions.join(', ')}`,
        code: 'INVALID_SORT',
      };
    }

    const validSortOrders = ['ASC', 'DESC'];
    if (!validSortOrders.includes(params.sortOrder)) {
      return {
        isValid: false,
        error: `Invalid sort order. Must be one of: ${validSortOrders.join(', ')}`,
        code: 'INVALID_SORT_ORDER',
      };
    }

    // Validate listed year range
    if (params.listedYear && (params.listedYear < 1900 || params.listedYear > new Date().getFullYear())) {
      return {
        isValid: false,
        error: 'Listed year must be between 1900 and current year',
        code: 'INVALID_LISTED_YEAR',
      };
    }

    return { isValid: true };
  }

  /**
   * Process search results for API response
   * @param {Array} companies - Raw company data from database
   * @param {Object} params - Search parameters
   * @returns {Array} Processed company results
   */
  processSearchResults(companies, params) {
    return companies.map(company => ({
      id: company.id,
      symbol: company.symbol,
      name: company.name,
      sector: company.sector,
      listedYear: company.listedYear,
      marketCap: company.marketCap || null,
      description: company.description || null,
      website: company.website || null,
      isActive: company.isActive !== false,
      searchRelevance: this.calculateRelevance(company, params.q),
      searchHighlights: this.generateSearchHighlights(company, params.q),
      metadata: {
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        hasFinancialData: company.hasFinancialData || false,
      },
    }));
  }

  /**
   * Calculate search relevance score
   * @param {Object} company - Company data
   * @param {string} query - Search query
   * @returns {number} Relevance score (0-100)
   */
  calculateRelevance(company, query) {
    if (!query) return 100;

    const queryLower = query.toLowerCase();
    const nameLower = company.name.toLowerCase();
    const symbolLower = company.symbol.toLowerCase();
    const sectorLower = company.sector.toLowerCase();

    let score = 0;

    // Exact symbol match (highest relevance)
    if (symbolLower === queryLower) {
      return 100;
    }

    // Exact name match
    if (nameLower === queryLower) {
      score += 80;
    }
    // Name starts with query
    else if (nameLower.startsWith(queryLower)) {
      score += 60;
    }
    // Name contains query
    else if (nameLower.includes(queryLower)) {
      score += 40;
    }

    // Sector match
    if (sectorLower.includes(queryLower)) {
      score += 20;
    }

    // Partial word matches
    const queryWords = queryLower.split(' ');
    queryWords.forEach(word => {
      if (word.length > 2 && nameLower.includes(word)) {
        score += 10;
      }
    });

    return Math.min(100, score);
  }

  /**
   * Generate search highlights for response
   * @param {Object} company - Company data
   * @param {string} query - Search query
   * @returns {Object} Search highlights
   */
  generateSearchHighlights(company, query) {
    if (!query) return null;

    const queryLower = query.toLowerCase();
    const nameLower = company.name.toLowerCase();
    const symbolLower = company.symbol.toLowerCase();

    const highlights = {};

    // Highlight matching parts in name
    const nameParts = [];
    if (nameLower.includes(queryLower)) {
      const startIndex = nameLower.indexOf(queryLower);
      if (startIndex !== -1) {
        nameParts.push({
          text: company.name.substring(startIndex, startIndex + query.length),
          type: 'exact',
        });
      }
    }

    // Highlight symbol
    if (symbolLower === queryLower) {
      highlights.symbol = {
        text: company.symbol,
        type: 'exact',
      };
    }

    if (nameParts.length > 0) {
      highlights.name = nameParts;
    }

    return highlights;
  }

  /**
   * Generate cache key for search results
   * @param {Object} params - Search parameters
   * @returns {string} Cache key
   */
  generateCacheKey(params) {
    const keyData = {
      q: params.q,
      page: params.page,
      limit: params.limit,
      sortBy: params.sortBy,
      sortOrder: params.sortOrder,
      filters: params.filters,
      sector: params.sector,
    };
    
    return Buffer.from(JSON.stringify(keyData)).toString('base64');
  }

  /**
   * Get result from cache
   * @param {string} key - Cache key
   * @returns {Object|null} Cached result or null
   */
  getFromCache(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheTimeout) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set result in cache
   * @param {string} key - Cache key
   * @param {Object} data - Data to cache
   */
  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Assess query complexity for performance monitoring
   * @param {Object} params - Search parameters
   * @returns {string} Complexity level
   */
  assessQueryComplexity(params) {
    let complexity = 'LOW';
    
    if (params.filters && (params.filters.sectors.length > 0 || params.filters.marketCapRanges.length > 0)) {
      complexity = 'MEDIUM';
    }
    
    if (params.q && params.q.length > 20) {
      complexity = 'HIGH';
    }
    
    if (params.filters && params.filters.sectors.length > 5) {
      complexity = 'VERY_HIGH';
    }

    return complexity;
  }

  /**
   * Generate unique request ID
   * @returns {string} Request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Clear expired cache entries
   */
  clearExpiredCache() {
    const now = Date.now();
    for (const [key, value] of this.cache.entries()) {
      if (now - value.timestamp > this.cacheTimeout) {
        this.cache.delete(key);
      }
    }
  }
}

module.exports = CompanySearchController;
