/**
 * FinSathi AI - Financial Advisor Controller
 * API endpoints for complete financial planning
 */

const FinancialAdvisorService = require('../services/financialAdvisorService');

class FinancialAdvisorController {
  constructor() {
    this.service = new FinancialAdvisorService();
  }

  /**
   * Generate complete financial plan
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async generateFinancialPlan(req, res) {
    try {
      // Extract user profile from request body
      const userProfile = req.body;
      
      // Validate required fields
      const requiredFields = ['age', 'monthlyIncome', 'monthlyExpenses', 'currentSavings'];
      const missingFields = requiredFields.filter(field => !userProfile[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields,
          code: 'MISSING_FIELDS',
        });
      }

      // Generate complete financial plan
      const result = await this.service.generateCompleteFinancialPlan(userProfile, req.query);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.details || null,
        });
      }

      // Return successful response
      return res.status(200).json({
        success: true,
        data: result.data,
        meta: result.meta,
      });

    } catch (error) {
      console.error('Error in generateFinancialPlan:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get risk profile only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getRiskProfile(req, res) {
    try {
      const userProfile = req.body;
      
      // Validate required fields
      const requiredFields = ['age', 'monthlyIncome', 'monthlyExpenses', 'currentSavings'];
      const missingFields = requiredFields.filter(field => !userProfile[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields,
          code: 'MISSING_FIELDS',
        });
      }

      const result = await this.service.generateRiskProfile(userProfile, req.query);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.details || null,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });

    } catch (error) {
      console.error('Error in getRiskProfile:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get investment plans only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getInvestmentPlans(req, res) {
    try {
      const userProfile = req.body;
      
      // Validate required fields
      const requiredFields = ['age', 'monthlyIncome', 'monthlyExpenses', 'currentSavings'];
      const missingFields = requiredFields.filter(field => !userProfile[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields,
          code: 'MISSING_FIELDS',
        });
      }

      const result = await this.service.calculateInvestmentPlans(userProfile, req.query);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.details || null,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });

    } catch (error) {
      console.error('Error in getInvestmentPlans:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get portfolio allocation only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPortfolioAllocation(req, res) {
    try {
      const userProfile = req.body;
      
      // First generate risk profile
      const riskProfileResult = await this.service.generateRiskProfile(userProfile, req.query);
      
      if (!riskProfileResult.success) {
        return res.status(400).json({
          success: false,
          error: riskProfileResult.error,
          code: riskProfileResult.code,
          details: riskProfileResult.details || null,
        });
      }

      // Then get portfolio allocation
      const allocationResult = await this.service.selectPortfolioAllocation(riskProfileResult.data, req.query);
      
      if (!allocationResult.success) {
        return res.status(400).json({
          success: false,
          error: allocationResult.error,
          code: allocationResult.code,
          details: allocationResult.details || null,
        });
      }

      return res.status(200).json({
        success: true,
        data: allocationResult.data,
      });

    } catch (error) {
      console.error('Error in getPortfolioAllocation:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get top companies only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getTopCompanies(req, res) {
    try {
      const userProfile = req.body;
      
      // First generate risk profile
      const riskProfileResult = await this.service.generateRiskProfile(userProfile, req.query);
      
      if (!riskProfileResult.success) {
        return res.status(400).json({
          success: false,
          error: riskProfileResult.error,
          code: riskProfileResult.code,
          details: riskProfileResult.details || null,
        });
      }

      // Then get portfolio allocation
      const allocationResult = await this.service.selectPortfolioAllocation(riskProfileResult.data, req.query);
      
      if (!allocationResult.success) {
        return res.status(400).json({
          success: false,
          error: allocationResult.error,
          code: allocationResult.code,
          details: allocationResult.details || null,
        });
      }

      // Then get top companies
      const companiesResult = await this.service.selectTopCompanies(allocationResult.data, req.query);
      
      if (!companiesResult.success) {
        return res.status(400).json({
          success: false,
          error: companiesResult.error,
          code: companiesResult.code,
          details: companiesResult.details || null,
        });
      }

      return res.status(200).json({
        success: true,
        data: companiesResult.data,
      });

    } catch (error) {
      console.error('Error in getTopCompanies:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get investment strategy only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getInvestmentStrategy(req, res) {
    try {
      const userProfile = req.body;
      
      // Generate all required components
      const riskProfileResult = await this.service.generateRiskProfile(userProfile, req.query);
      
      if (!riskProfileResult.success) {
        return res.status(400).json({
          success: false,
          error: riskProfileResult.error,
          code: riskProfileResult.code,
          details: riskProfileResult.details || null,
        });
      }

      const allocationResult = await this.service.selectPortfolioAllocation(riskProfileResult.data, req.query);
      
      if (!allocationResult.success) {
        return res.status(400).json({
          success: false,
          error: allocationResult.error,
          code: allocationResult.code,
          details: allocationResult.details || null,
        });
      }

      const strategyResult = await this.service.generateInvestmentStrategy(
        userProfile,
        riskProfileResult.data,
        allocationResult.data,
        req.query
      );
      
      if (!strategyResult.success) {
        return res.status(400).json({
          success: false,
          error: strategyResult.error,
          code: strategyResult.code,
          details: strategyResult.details || null,
        });
      }

      return res.status(200).json({
        success: true,
        data: strategyResult.data,
      });

    } catch (error) {
      console.error('Error in getInvestmentStrategy:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get financial health score only
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getFinancialHealth(req, res) {
    try {
      const userProfile = req.body;
      
      // Validate required fields
      const requiredFields = ['age', 'monthlyIncome', 'monthlyExpenses', 'currentSavings'];
      const missingFields = requiredFields.filter(field => !userProfile[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields,
          code: 'MISSING_FIELDS',
        });
      }

      const result = await this.service.calculateFinancialHealth(userProfile, req.query);
      
      if (!result.success) {
        return res.status(400).json({
          success: false,
          error: result.error,
          code: result.code,
          details: result.details || null,
        });
      }

      return res.status(200).json({
        success: true,
        data: result.data,
      });

    } catch (error) {
      console.error('Error in getFinancialHealth:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Validate user profile input
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async validateProfile(req, res) {
    try {
      const userProfile = req.body;
      
      // Use service validation
      const validation = this.service.validateUserProfile(userProfile);
      
      if (!validation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Validation failed',
          details: validation.error,
          code: 'VALIDATION_ERROR',
        });
      }

      // Additional business logic validation
      const businessValidation = this.validateBusinessRules(userProfile);
      
      if (!businessValidation.isValid) {
        return res.status(400).json({
          success: false,
          error: 'Business validation failed',
          details: businessValidation.error,
          code: 'BUSINESS_VALIDATION_ERROR',
        });
      }

      return res.status(200).json({
        success: true,
        data: {
          valid: true,
          message: 'Profile validation successful',
          warnings: businessValidation.warnings || [],
        },
      });

    } catch (error) {
      console.error('Error in validateProfile:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Get plan summary (lightweight version)
   * @param {Object} req - Express request object
   * @param {Object} res - Express response object
   */
  async getPlanSummary(req, res) {
    try {
      const userProfile = req.body;
      
      // Validate required fields
      const requiredFields = ['age', 'monthlyIncome', 'monthlyExpenses', 'currentSavings'];
      const missingFields = requiredFields.filter(field => !userProfile[field]);
      
      if (missingFields.length > 0) {
        return res.status(400).json({
          success: false,
          error: 'Missing required fields',
          missingFields,
          code: 'MISSING_FIELDS',
        });
      }

      // Generate only key components for summary
      const riskProfile = await this.service.generateRiskProfile(userProfile, req.query);
      const financialHealth = await this.service.calculateFinancialHealth(userProfile, req.query);
      
      if (!riskProfile.success || !financialHealth.success) {
        return res.status(400).json({
          success: false,
          error: 'Failed to generate summary',
          code: 'SUMMARY_ERROR',
        });
      }

      // Calculate basic investment needs
      const monthlySavings = userProfile.monthlyIncome - userProfile.monthlyExpenses;
      const savingsRate = (monthlySavings / userProfile.monthlyIncome) * 100;

      const summary = {
        userProfile: {
          age: userProfile.age,
          monthlyIncome: userProfile.monthlyIncome,
          savingsRate: Math.round(savingsRate * 100) / 100,
          investmentCapacity: monthlySavings,
        },
        riskProfile: {
          name: riskProfile.data.profile.name,
          score: riskProfile.data.score,
          description: riskProfile.data.profile.description,
        },
        financialHealth: {
          score: financialHealth.data.overallScore,
          category: financialHealth.data.category.label,
          keyFactors: financialHealth.data.analysis.strengths.slice(0, 2).map(s => s.description),
        },
        quickRecommendations: [
          `Maintain ${riskProfile.data.profile.name} risk approach`,
          `Save NPR ${monthlySavings.toLocaleString()} monthly (${savingsRate.toFixed(1)}% rate)`,
          `Focus on ${financialHealth.data.category.label} financial health`,
        ],
        nextSteps: [
          'Complete full financial plan for detailed recommendations',
          'Open demat account and complete KYC',
          'Start systematic investment plan',
        ],
      };

      return res.status(200).json({
        success: true,
        data: summary,
      });

    } catch (error) {
      console.error('Error in getPlanSummary:', error);
      return res.status(500).json({
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined,
      });
    }
  }

  /**
   * Validate business rules for user profile
   * @param {Object} userProfile - User profile to validate
   * @returns {Object} Validation result
   */
  validateBusinessRules(userProfile) {
    const warnings = [];

    // Check if expenses are too high relative to income
    const expenseRatio = (userProfile.monthlyExpenses / userProfile.monthlyIncome) * 100;
    if (expenseRatio > 80) {
      warnings.push('Monthly expenses are very high relative to income');
    }

    // Check if savings are very low
    const monthlySavings = userProfile.monthlyIncome - userProfile.monthlyExpenses;
    if (monthlySavings < 0.1 * userProfile.monthlyIncome) {
      warnings.push('Savings rate is very low, consider reducing expenses');
    }

    // Check age-appropriate investment horizon
    if (userProfile.age > 60 && (!userProfile.investmentHorizonYears || userProfile.investmentHorizonYears > 10)) {
      warnings.push('Consider shorter investment horizon for your age');
    }

    if (userProfile.age < 25 && userProfile.investmentHorizonYears && userProfile.investmentHorizonYears < 5) {
      warnings.push('Consider longer investment horizon for your age');
    }

    return {
      isValid: warnings.length === 0,
      warnings,
    };
  }
}

module.exports = FinancialAdvisorController;
