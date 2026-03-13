/**
 * FinSathi AI - Company Analysis Routes
 * API route definitions for company financial analysis
 */

const { CompanyAnalysisController, addRequestTimestamp } = require('../controllers/companyAnalysisController');

const controller = new CompanyAnalysisController();

/**
 * Company analysis routes
 */
const companyAnalysisRoutes = [
  // Add timestamp middleware to all routes
  {
    method: 'use',
    path: '/',
    handler: addRequestTimestamp,
  },

  // Get comprehensive company report
  {
    method: 'get',
    path: '/v1/companies/:symbol/report',
    handler: controller.getCompanyReport.bind(controller),
    description: 'Get comprehensive financial analysis for a company',
    parameters: {
      symbol: {
        type: 'path',
        required: true,
        description: 'Company stock symbol (e.g., NABIL)',
      },
      historical: {
        type: 'query',
        required: false,
        description: 'Include historical data (true/false)',
        default: 'false',
      },
      years: {
        type: 'query',
        required: false,
        description: 'Number of years of historical data (1-10)',
        default: '5',
      },
      industry: {
        type: 'query',
        required: false,
        description: 'Industry for benchmarking (e.g., BANKING, TECHNOLOGY)',
      },
      benchmark: {
        type: 'query',
        required: false,
        description: 'Include industry benchmarking (true/false)',
        default: 'true',
      },
      weighting: {
        type: 'query',
        required: false,
        description: 'Weighting strategy for health score',
        default: 'BALANCED',
        options: ['BALANCED', 'GROWTH_FOCUSED', 'PROFITABILITY_FOCUSED', 'STABILITY_FOCUSED'],
      },
    },
    responses: {
      200: {
        description: 'Company analysis retrieved successfully',
        schema: {
          success: true,
          data: {
            company: 'Company information',
            analysis: {
              period: 'Analysis period information',
              financialData: 'Normalized financial metrics',
              ratios: 'Calculated financial ratios',
              healthScore: 'Financial health score (0-100)',
              summary: 'Company financial summary',
              insights: 'Generated insights',
              recommendations: 'Actionable recommendations',
            },
            historicalData: 'Historical financial reports (if requested)',
            industryComparison: 'Industry benchmarking (if requested)',
            metadata: 'Analysis metadata',
          },
          meta: 'Request metadata',
        },
      },
      400: {
        description: 'Bad request - Invalid parameters',
        schema: {
          success: false,
          error: 'Error description',
          code: 'Error code',
        },
      },
      404: {
        description: 'Company not found or no financial data available',
        schema: {
          success: false,
          error: 'Error description',
          code: 'Error code',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'Error description',
          code: 'INTERNAL_ERROR',
        },
      },
    },
    example: {
      request: 'GET /v1/companies/NABIL/report?historical=true&years=3&industry=BANKING',
      response: {
        success: true,
        data: {
          company: {
            id: 'company_id',
            symbol: 'NABIL',
            name: 'Nabil Bank Limited',
            sector: 'Banking',
            listedYear: 2004,
          },
          analysis: {
            period: {
              year: 2023,
              fiscalYear: 2023,
              dataDate: '2024-03-10T12:00:00.000Z',
            },
            financialData: {
              revenue: 15000000000,
              netProfit: 1800000000,
              totalAssets: 35000000000,
              totalEquity: 12000000000,
              totalDebt: 15000000000,
            },
            ratios: {
              returnOnEquity: 15.0,
              netProfitMargin: 12.0,
              debtToEquity: 1.25,
              assetTurnover: 0.43,
              earningsPerShare: 150.0,
              advanced: {
                returnOnAssets: 5.14,
                debtToAssets: 42.86,
                equityMultiplier: 2.92,
                priceToBook: 1.25,
              },
            },
            healthScore: {
              score: 78,
              category: 'MODERATE',
              valid: true,
              confidence: 'HIGH',
              componentScores: {
                roe: { score: 90, grade: 'A' },
                debtRatio: { score: 65, grade: 'B' },
                profitMargin: { score: 80, grade: 'B+' },
                revenueGrowth: { score: 75, grade: 'B' },
              },
              insights: [
                {
                  type: 'STRENGTH',
                  title: 'Strong Return on Equity',
                  description: 'Company generates excellent returns for shareholders',
                },
              ],
              recommendations: [
                {
                  type: 'FINANCIAL',
                  title: 'Debt Optimization',
                  description: 'Consider debt restructuring options',
                },
              ],
            },
            summary: {
              marketPosition: {
                marketCap: 120000000000,
                bookValue: 12000000000,
                totalAssets: 35000000000,
                totalDebt: 15000000000,
                debtToAssets: 0.43,
              },
              performance: {
                revenue: 15000000000,
                netProfit: 1800000000,
                profitMargin: 12.0,
                roe: 15.0,
              },
              efficiency: {
                assetTurnover: 0.43,
                returnOnAssets: 5.14,
              },
            },
          },
          meta: {
            analysisDate: '2024-03-10T20:16:00.000Z',
            dataQuality: { completeness: 100, quality: 'EXCELLENT' },
            industry: 'BANKING',
            weightingStrategy: 'BALANCED',
          },
        },
        meta: {
          symbol: 'NABIL',
          requestedAt: '2024-03-10T20:16:00.000Z',
          processingTime: 125,
          options: {
            historical: true,
            years: 3,
            industry: 'BANKING',
            benchmark: true,
            weighting: 'BALANCED',
          },
        },
      },
    },
  },

  // Get peer comparison
  {
    method: 'get',
    path: '/v1/companies/:symbol/peers',
    handler: controller.getPeerComparison.bind(controller),
    description: 'Compare company against specified peers',
    parameters: {
      symbol: {
        type: 'path',
        required: true,
        description: 'Company stock symbol to analyze',
      },
      peers: {
        type: 'query',
        required: true,
        description: 'Comma-separated list of peer company symbols',
      },
    },
    responses: {
      200: {
        description: 'Peer comparison completed successfully',
      },
      400: {
        description: 'Invalid peer symbols provided',
      },
    },
    example: {
      request: 'GET /v1/companies/NABIL/peers?peers=SCB,EBL,NICA',
    },
  },

  // Get sector analysis
  {
    method: 'get',
    path: '/v1/sectors/:sector/analysis',
    handler: controller.getSectorAnalysis.bind(controller),
    description: 'Get sector-wide financial analysis',
    parameters: {
      sector: {
        type: 'path',
        required: true,
        description: 'Sector name for analysis',
      },
      limit: {
        type: 'query',
        required: false,
        description: 'Number of companies to analyze (1-100)',
        default: '20',
      },
    },
    responses: {
      200: {
        description: 'Sector analysis completed successfully',
      },
    },
    example: {
      request: 'GET /v1/sectors/BANKING/analysis?limit=10',
    },
  },

  // Search companies
  {
    method: 'get',
    path: '/v1/companies/search',
    handler: controller.searchCompanies.bind(controller),
    description: 'Search for companies by name or symbol',
    parameters: {
      q: {
        type: 'query',
        required: true,
        description: 'Search query (company name or symbol)',
      },
      limit: {
        type: 'query',
        required: false,
        description: 'Maximum number of results (1-50)',
        default: '10',
      },
    },
    responses: {
      200: {
        description: 'Search completed successfully',
      },
    },
    example: {
      request: 'GET /v1/companies/search?q=Nabil&limit=5',
    },
  },

  // Get available industries
  {
    method: 'get',
    path: '/v1/industries',
    handler: controller.getIndustries.bind(controller),
    description: 'Get list of available industries for analysis',
    responses: {
      200: {
        description: 'Industries retrieved successfully',
        schema: {
          success: true,
          data: [
            {
              id: 'BANKING',
              name: 'Banking',
              description: 'Commercial and investment banks',
            },
            // ... other industries
          ],
          meta: {
            count: 10,
            requestedAt: '2024-03-10T20:16:00.000Z',
          },
        },
      },
    },
    example: {
      request: 'GET /v1/industries',
    },
  },
];

module.exports = companyAnalysisRoutes;
