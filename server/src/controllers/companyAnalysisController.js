/**
 * FinSathi AI - Company Analysis Controller
 * API endpoints for company financial analysis
 */

const CompanyAnalysisService = require('../services/companyAnalysisService');
const CompanyAnalysisRepository = require('../repositories/companyAnalysisRepository');

class CompanyAnalysisController {
  constructor() {
    this.service = new CompanyAnalysisService(new CompanyAnalysisRepository());
  }

  /**
   * Get comprehensive company analysis
   * GET /v1/companies/:symbol/report
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getCompanyReport(req, res, next) {
    try {
      const { symbol } = req.params;
      
      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Company symbol is required',
          code: 'MISSING_SYMBOL',
        });
      }

      // Validate symbol format
      if (!/^[A-Z0-9]{1,10}$/i.test(symbol)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid company symbol format',
          code: 'INVALID_SYMBOL',
        });
      }

      // Parse query parameters
      const options = {
        includeHistoricalData: req.query.historical === 'true',
        yearsOfHistory: parseInt(req.query.years) || 5,
        industry: req.query.industry || null,
        benchmarkAgainstIndustry: req.query.benchmark !== 'false',
        weightingStrategy: req.query.weighting || 'BALANCED',
      };

      // Validate years parameter
      if (options.yearsOfHistory < 1 || options.yearsOfHistory > 10) {
        return res.status(400).json({
          success: false,
          error: 'Years of history must be between 1 and 10',
          code: 'INVALID_YEARS',
        });
      }

      // Validate weighting strategy
      const validStrategies = ['BALANCED', 'GROWTH_FOCUSED', 'PROFITABILITY_FOCUSED', 'STABILITY_FOCUSED'];
      if (!validStrategies.includes(options.weightingStrategy)) {
        return res.status(400).json({
          success: false,
          error: 'Invalid weighting strategy',
          code: 'INVALID_WEIGHTING',
          validOptions: validStrategies,
        });
      }

      // Get company analysis
      const analysis = await this.service.getCompanyAnalysis(symbol, options);

      // Cache response for 5 minutes
      res.set('Cache-Control', 'public, max-age=300');

      res.status(200).json({
        success: true,
        data: analysis,
        meta: {
          symbol: symbol.toUpperCase(),
          requestedAt: new Date().toISOString(),
          processingTime: Date.now() - req.startTime,
          options,
        },
      });

    } catch (error) {
      console.error('Company analysis error:', error);
      
      if (error.message.includes('not found')) {
        return res.status(404).json({
          success: false,
          error: `Company '${symbol}' not found`,
          code: 'COMPANY_NOT_FOUND',
        });
      }

      if (error.message.includes('No financial data')) {
        return res.status(404).json({
          success: false,
          error: `No financial data available for '${symbol}'`,
          code: 'NO_FINANCIAL_DATA',
        });
      }

      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get peer comparison analysis
   * GET /v1/companies/:symbol/peers
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getPeerComparison(req, res, next) {
    try {
      const { symbol } = req.params;
      const { peers } = req.query;

      if (!symbol) {
        return res.status(400).json({
          success: false,
          error: 'Company symbol is required',
          code: 'MISSING_SYMBOL',
        });
      }

      if (!peers) {
        return res.status(400).json({
          success: false,
          error: 'Peer symbols are required',
          code: 'MISSING_PEERS',
        });
      }

      // Parse and validate peer symbols
      const peerSymbols = peers.split(',').map(s => s.trim().toUpperCase()).filter(s => s);
      
      if (peerSymbols.length === 0 || peerSymbols.length > 10) {
        return res.status(400).json({
          success: false,
          error: 'Between 1 and 10 peer symbols required',
          code: 'INVALID_PEERS',
        });
      }

      // Get peer comparison
      const comparison = await this.service.getPeerComparison(symbol, peerSymbols);

      res.status(200).json({
        success: true,
        data: comparison,
        meta: {
          symbol: symbol.toUpperCase(),
          peers: peerSymbols,
          requestedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Peer comparison error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get sector analysis
   * GET /v1/sectors/:sector/analysis
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async getSectorAnalysis(req, res, next) {
    try {
      const { sector } = req.params;
      const { limit = 20 } = req.query;

      if (!sector) {
        return res.status(400).json({
          success: false,
          error: 'Sector name is required',
          code: 'MISSING_SECTOR',
        });
      }

      if (limit < 1 || limit > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100',
          code: 'INVALID_LIMIT',
        });
      }

      const analysis = await this.service.getSectorAnalysis(sector);

      res.status(200).json({
        success: true,
        data: analysis,
        meta: {
          sector,
          limit,
          requestedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Sector analysis error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Search companies
   * GET /v1/companies/search
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   * @param {Function} next - Express next function
   */
  async searchCompanies(req, res, next) {
    try {
      const { q: query, limit = 10 } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          error: 'Search query is required',
          code: 'MISSING_QUERY',
        });
      }

      if (query.length < 2 || query.length > 50) {
        return res.status(400).json({
          success: false,
          error: 'Query must be between 2 and 50 characters',
          code: 'INVALID_QUERY',
        });
      }

      if (limit < 1 || limit > 50) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 50',
          code: 'INVALID_LIMIT',
        });
      }

      const companies = await this.service.repository.searchCompanies(query, parseInt(limit));

      res.status(200).json({
        success: true,
        data: companies,
        meta: {
          query,
          limit,
          count: companies.length,
          requestedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Company search error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get available industries
   * GET /v1/industries
   * 
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getIndustries(req, res, next) {
    try {
      const industries = [
        { id: 'BANKING', name: 'Banking', description: 'Commercial and investment banks' },
        { id: 'INSURANCE', name: 'Insurance', description: 'Life and non-life insurance companies' },
        { id: 'TECHNOLOGY', name: 'Technology', description: 'Software and IT services' },
        { id: 'MANUFACTURING', name: 'Manufacturing', description: 'Industrial and consumer manufacturing' },
        { id: 'TELECOMMUNICATIONS', name: 'Telecommunications', description: 'Telecom service providers' },
        { id: 'RETAIL', name: 'Retail', description: 'Retail and consumer goods' },
        { id: 'ENERGY', name: 'Energy', description: 'Oil, gas, and renewable energy' },
        { id: 'REAL_ESTATE', name: 'Real Estate', description: 'Property development and construction' },
        { id: 'TRANSPORT', name: 'Transport', description: 'Transportation and logistics' },
      ];

      res.status(200).json({
        success: true,
        data: industries,
        meta: {
          count: industries.length,
          requestedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Industries error:', error);
      res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

// Middleware to add request timestamp
const addRequestTimestamp = (req, res, next) => {
  req.startTime = Date.now();
  next();
};

module.exports = {
  CompanyAnalysisController,
  addRequestTimestamp,
};
