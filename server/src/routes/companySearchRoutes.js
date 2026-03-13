/**
 * FinSathi AI - Company Search Routes
 * API route definitions for NEPSE company search
 */

const { CompanySearchController } = require('../controllers/companySearchController');

const controller = new CompanySearchController();

/**
 * Company search routes
 */
const companySearchRoutes = [
  // Main search endpoint
  {
    method: 'get',
    path: '/v1/companies',
    handler: controller.searchCompanies.bind(controller),
    description: 'Search NEPSE companies with comprehensive filtering and pagination',
    parameters: {
      q: {
        type: 'query',
        required: false,
        description: 'Search query (company name or symbol)',
        example: 'NABIL',
      },
      page: {
        type: 'query',
        required: false,
        description: 'Page number for pagination',
        example: '1',
        default: '1',
      },
      limit: {
        type: 'query',
        required: false,
        description: 'Number of results per page (1-100)',
        example: '20',
        default: '20',
      },
      sortBy: {
        type: 'query',
        required: false,
        description: 'Sort field for results',
        example: 'RELEVANCE',
        default: 'RELEVANCE',
        options: ['RELEVANCE', 'NAME', 'SYMBOL', 'MARKET_CAP', 'LISTED_YEAR', 'SECTOR'],
      },
      sortOrder: {
        type: 'query',
        required: false,
        description: 'Sort order (ASC/DESC)',
        example: 'DESC',
        default: 'DESC',
        options: ['ASC', 'DESC'],
      },
      filters: {
        type: 'query',
        required: false,
        description: 'Advanced filters (JSON object)',
        example: '{"sectors": ["Banking", "Insurance"], "marketCapRanges": [{"min": 1000000000, "max": 5000000000}]}',
      },
      sector: {
        type: 'query',
        required: false,
        description: 'Filter by sector',
        example: 'Banking',
      },
      listedYear: {
        type: 'query',
        required: fixed,
        description: 'Filter by listed year',
        example: '2020',
      },
      marketCap: {
        type: 'query',
        required: false,
        description: 'Filter by market cap',
        example: 'LARGE',
        options: ['SMALL', 'MEDIUM', 'LARGE', 'MEGA'],
      },
    },
    responses: {
      200: {
        description: 'Search completed successfully',
        schema: {
          success: true,
          data: {
            companies: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Company unique identifier' },
                  symbol: { type: 'string', description: 'NEPSE stock symbol' },
                  name: { type: 'string', description: 'Company name' },
                  sector: { type: 'string', description: 'Industry sector' },
                  listedYear: { type: 'integer', description: 'Year listed on NEPSE' },
                  marketCap: { type: 'number', description: 'Market capitalization' },
                  description: { type: 'string', description: 'Company description' },
                  website: { type: 'string', description: 'Company website' },
                  isActive: { type: 'boolean', description: 'Whether company is active' },
                  searchRelevance: { type: 'number', description: 'Search relevance score (0-100)' },
                  searchHighlights: { type: 'object', description: 'Highlighted search terms' },
                  metadata: {
                    type: 'object',
                    properties: {
                      createdAt: { type: 'string', description: 'Record creation date' },
                      updatedAt: { type: 'string', description: 'Last update date' },
                      hasFinancialData: { type: 'boolean', description: 'Whether financial data is available' },
                    },
                  },
                },
              },
            },
            pagination: {
              type: 'object',
              properties: {
                currentPage: { type: 'integer', description: 'Current page number' },
                pageSize: { type: 'integer', description: 'Results per page' },
                totalItems: { type: 'integer', description: 'Total number of results' },
                totalPages: { type: 'integer', description: 'Total number of pages' },
                hasNextPage: { type: 'boolean', description: 'Whether next page exists' },
                hasPreviousPage: { type: 'boolean', description: 'Whether previous page exists' },
              },
            },
            search: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search query' },
                filters: { type: 'object', description: 'Applied filters' },
                sortBy: { type: 'string', description: 'Sort field' },
                sortOrder: { type: 'string', description: 'Sort order' },
              },
            },
            meta: {
              type: 'object',
              properties: {
                requestId: { type: 'string', description: 'Unique request identifier' },
                timestamp: { type: 'string', description: 'Request timestamp' },
                processingTime: { type: 'integer', description: 'Processing time in milliseconds' },
                cacheTimeout: { type: 'integer', description: 'Cache timeout in seconds' },
                performance: {
                  type: 'object',
                  properties: {
                    queryComplexity: { type: 'string', description: 'Query complexity assessment' },
                    database: { type: 'string', description: 'Database system' },
                    indexing: { type: 'string', description: 'Indexing strategy' },
                  },
                },
              },
            },
          },
        },
      },
      400: {
        description: 'Bad request - Invalid parameters',
        schema: {
          success: false,
          error: { type: 'string', description: 'Error description' },
          code: { type: 'string', description: 'Error code' },
        },
      },
      404: {
        description: 'No companies found for search criteria',
        schema: {
          success: false,
          error: { type: 'string', description: 'Error description' },
          code: { type: 'string', description: 'Error code' },
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: { type: 'string', description: 'Error description' },
          code: 'INTERNAL_ERROR' },
          meta: {
            timestamp: { type: 'string', description: 'Error timestamp' },
            requestId: { type: 'string', description: 'Request identifier' },
          },
        },
      },
    },
    example: {
      request: 'GET /v1/companies?q=NABIL&limit=10&sortBy=MARKET_CAP&sortOrder=DESC',
      response: {
        success: true,
        data: {
          companies: [
            {
              id: 'company_001',
              symbol: 'NABIL',
              name: 'Nabil Bank Limited',
              sector: 'Banking',
              listedYear: 2004,
              marketCap: 120000000000,
            },
          ],
          pagination: {
            currentPage: 1,
            pageSize: 10,
            totalItems: 156,
            totalPages: 16,
            hasNextPage: true,
            hasPreviousPage: false,
          },
        },
      },
    },
  },

  // Search suggestions endpoint
  {
    method: 'get',
    path: '/v1/companies/suggestions',
    handler: controller.getSearchSuggestions.bind(controller),
    description: 'Get search suggestions as user types',
    parameters: {
      q: {
        type: 'query',
        required: true,
        description: 'Search query for suggestions',
        example: 'NAB',
      },
      limit: {
        type: 'query',
        required: false,
        description: 'Number of suggestions to return (1-20)',
        example: '5',
        default: '5',
      },
    },
    responses: {
      200: {
        description: 'Search suggestions retrieved successfully',
        schema: {
          success: true,
          data: {
            query: { type: 'string', description: 'Original search query' },
            suggestions: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: { type: 'string', description: 'Company ID' },
                  symbol: { type: 'string', description: 'Company symbol' },
                  name: { type: 'string', description: 'Company name' },
                  sector: { type: 'string', description: 'Industry sector' },
                  listedYear: { type: 'integer', description: 'Year listed' },
                },
              },
            },
          },
          meta: {
            count: { type: 'integer', description: 'Number of suggestions' },
            timestamp: { type: 'string', description: 'Response timestamp' },
          },
        },
      },
      400: {
        description: 'Invalid query parameters',
        schema: {
          success: false,
          error: { type: 'string', description: 'Error description' },
          code: { type: 'string', description: 'Error code' },
        },
      },
    },
    example: {
      request: 'GET /v1/companies/suggestions?q=NABIL&limit=5',
      response: {
        success: true,
        data: {
          query: 'NABIL',
          suggestions: [
            {
              id: 'company_001',
              symbol: 'NABIL',
              name: 'Nabil Bank Limited',
              sector: 'Banking',
              listedYear: 2004,
            },
          ],
        },
      },
    },
  },

  // Popular searches endpoint
  {
    method: 'get',
    path: '/v1/companies/popular-searches',
    handler: controller.getPopularSearches.bind(controller),
    description: 'Get popular search terms with trend data',
    parameters: {
      limit: {
        type: 'query',
        required: false,
        description: 'Number of popular searches to return (1-50)',
        example: '10',
        default: '10',
      },
    },
    responses: {
      200: {
        description: 'Popular searches retrieved successfully',
        schema: {
          success: true,
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                query: { type: 'string', description: 'Search term' },
                count: { type: 'integer', description: 'Search frequency' },
                trend: { type: 'string', description: 'Trend direction' },
              },
            },
          },
          meta: {
            count: { type: 'integer', description: 'Number of results' },
            timestamp: { type: 'string', description: 'Response timestamp' },
          },
        },
      },
    },
    example: {
      request: 'GET /v1/companies/popular-searches?limit=5',
      response: {
        success: true,
        data: {
          type: 'array',
          items: [
            {
              query: 'NABIL',
              count: 15420,
              trend: 'stable',
            },
          ],
        },
      },
    },
  },
];

module.exports = companySearchRoutes;
