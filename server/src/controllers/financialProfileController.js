/**
 * FinSathi AI - Financial Profile Controller
 * API controller for managing user financial profiles and investment recommendations
 */

const FinancialProfileService = require('../services/financialProfileService');

class FinancialProfileController {
  constructor() {
    this.service = new FinancialProfileService();
  }

  /**
   * Create a new financial profile
   * POST /api/v1/financial-profiles
   */
  async createFinancialProfile(req, res, next) {
    try {
      const userId = req.user.id; // Assuming user is authenticated
      const profileData = {
        monthlyIncome: parseFloat(req.body.monthlyIncome),
        monthlyExpenses: parseFloat(req.body.monthlyExpenses),
        currentSavings: parseFloat(req.body.currentSavings),
        riskTolerance: req.body.riskTolerance,
        investmentHorizonYears: parseInt(req.body.investmentHorizonYears),
        financialGoal: req.body.financialGoal,
        targetAmount: req.body.targetAmount ? parseFloat(req.body.targetAmount) : null,
        targetDate: req.body.targetDate,
        monthlyContribution: req.body.monthlyContribution ? parseFloat(req.body.monthlyContribution) : null,
        emergencyFundMonths: req.body.emergencyFundMonths ? parseInt(req.body.emergencyFundMonths) : null,
        insuranceCoverage: req.body.insuranceCoverage,
        dependentsCount: req.body.dependentsCount ? parseInt(req.body.dependentsCount) : null,
        employmentStatus: req.body.employmentStatus,
        annualIncomeGrowth: req.body.annualIncomeGrowth ? parseFloat(req.body.annualIncomeGrowth) : null,
        preferredInvestmentTypes: req.body.preferredInvestmentTypes,
        investmentExperience: req.body.investmentExperience,
        liquidityPreference: req.body.liquidityPreference,
        taxBracket: req.body.taxBracket,
      };

      // Validate required fields
      if (!profileData.monthlyIncome || !profileData.monthlyExpenses || !profileData.currentSavings) {
        return res.status(400).json({
          success: false,
          error: 'Missing required financial fields',
          code: 'MISSING_REQUIRED_FIELDS',
        });
      }

      if (!profileData.riskTolerance || !profileData.investmentHorizonYears || !profileData.financialGoal) {
        return res.status(400).json({
          success: false,
          error: 'Missing required investment fields',
          code: 'MISSING_INVESTMENT_FIELDS',
        });
      }

      const profile = await this.service.createFinancialProfile(userId, profileData);

      res.status(201).json({
        success: true,
        data: profile,
        message: 'Financial profile created successfully',
      });

    } catch (error) {
      console.error('Create financial profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create financial profile',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get financial profile by user ID and goal type
   * GET /api/v1/financial-profiles/:goalType
   */
  async getFinancialProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { goalType } = req.params;

      if (!goalType) {
        return res.status(400).json({
          success: false,
          error: 'Goal type is required',
          code: 'MISSING_GOAL_TYPE',
        });
      }

      const profile = await this.service.getFinancialProfile(userId, goalType);

      if (!profile) {
        return res.status(404).json({
          success: false,
          error: 'Financial profile not found',
          code: 'PROFILE_NOT_FOUND',
        });
      }

      res.status(200).json({
        success: true,
        data: profile,
      });

    } catch (error) {
      console.error('Get financial profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get financial profile',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get all financial profiles for a user
   * GET /api/v1/financial-profiles
   */
  async getUserFinancialProfiles(req, res, next) {
    try {
      const userId = req.user.id;
      const profiles = await this.service.getUserFinancialProfiles(userId);

      res.status(200).json({
        success: true,
        data: profiles,
        meta: {
          count: profiles.length,
          userId,
        },
      });

    } catch (error) {
      console.error('Get user financial profiles error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get financial profiles',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Update financial profile
   * PUT /api/v1/financial-profiles/:profileId
   */
  async updateFinancialProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { profileId } = req.params;

      // Verify user owns this profile
      const existingProfile = await this.service.getFinancialProfile(userId, req.body.financialGoal);
      if (!existingProfile || existingProfile.id !== profileId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      const updateData = {};
      
      // Only update provided fields
      if (req.body.monthlyIncome !== undefined) updateData.monthlyIncome = parseFloat(req.body.monthlyIncome);
      if (req.body.monthlyExpenses !== undefined) updateData.monthlyExpenses = parseFloat(req.body.monthlyExpenses);
      if (req.body.currentSavings !== undefined) updateData.currentSavings = parseFloat(req.body.currentSavings);
      if (req.body.riskTolerance !== undefined) updateData.riskTolerance = req.body.riskTolerance;
      if (req.body.investmentHorizonYears !== undefined) updateData.investmentHorizonYears = parseInt(req.body.investmentHorizonYears);
      if (req.body.financialGoal !== undefined) updateData.financialGoal = req.body.financialGoal;
      if (req.body.targetAmount !== undefined) updateData.targetAmount = parseFloat(req.body.targetAmount);
      if (req.body.targetDate !== undefined) updateData.targetDate = req.body.targetDate;
      if (req.body.monthlyContribution !== undefined) updateData.monthlyContribution = parseFloat(req.body.monthlyContribution);
      if (req.body.emergencyFundMonths !== undefined) updateData.emergencyFundMonths = parseInt(req.body.emergencyFundMonths);
      if (req.body.insuranceCoverage !== undefined) updateData.insuranceCoverage = req.body.insuranceCoverage;
      if (req.body.dependentsCount !== undefined) updateData.dependentsCount = parseInt(req.body.dependentsCount);
      if (req.body.employmentStatus !== undefined) updateData.employmentStatus = req.body.employmentStatus;
      if (req.body.annualIncomeGrowth !== undefined) updateData.annualIncomeGrowth = parseFloat(req.body.annualIncomeGrowth);
      if (req.body.preferredInvestmentTypes !== undefined) updateData.preferredInvestmentTypes = req.body.preferredInvestmentTypes;
      if (req.body.investmentExperience !== undefined) updateData.investmentExperience = req.body.investmentExperience;
      if (req.body.liquidityPreference !== undefined) updateData.liquidityPreference = req.body.liquidityPreference;
      if (req.body.taxBracket !== undefined) updateData.taxBracket = req.body.taxBracket;

      const profile = await this.service.updateFinancialProfile(profileId, updateData);

      res.status(200).json({
        success: true,
        data: profile,
        message: 'Financial profile updated successfully',
      });

    } catch (error) {
      console.error('Update financial profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update financial profile',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Delete financial profile
   * DELETE /api/v1/financial-profiles/:profileId
   */
  async deleteFinancialProfile(req, res, next) {
    try {
      const userId = req.user.id;
      const { profileId } = req.params;

      // Verify user owns this profile
      const existingProfile = await this.service.getFinancialProfile(userId, req.body.financialGoal);
      if (!existingProfile || existingProfile.id !== profileId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      await this.service.deleteFinancialProfile(profileId);

      res.status(200).json({
        success: true,
        message: 'Financial profile deleted successfully',
      });

    } catch (error) {
      console.error('Delete financial profile error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete financial profile',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get investment recommendations
   * GET /api/v1/financial-profiles/:profileId/recommendations
   */
  async getInvestmentRecommendations(req, res, next) {
    try {
      const userId = req.user.id;
      const { profileId } = req.params;

      // Verify user owns this profile
      const profile = await this.service.getFinancialProfile(userId, req.body.financialGoal);
      if (!profile || profile.id !== profileId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      // Generate fresh recommendations
      const recommendations = await this.service.generateInvestmentRecommendations(profileId);

      res.status(200).json({
        success: true,
        data: recommendations,
        meta: {
          profileId,
          generatedAt: new Date().toISOString(),
          count: recommendations.length,
        },
      });

    } catch (error) {
      console.error('Get investment recommendations error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get investment recommendations',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Create financial goal
   * POST /api/v1/financial-profiles/:profileId/goals
   */
  async createFinancialGoal(req, res, next) {
    try {
      const userId = req.user.id;
      const { profileId } = req.params;

      // Verify user owns this profile
      const profile = await this.service.getFinancialProfile(userId, req.body.financialGoal);
      if (!profile || profile.id !== profileId) {
        return res.status(403).json({
          success: false,
          error: 'Access denied',
          code: 'ACCESS_DENIED',
        });
      }

      const goalData = {
        goalType: req.body.goalType,
        goalName: req.body.goalName,
        targetAmount: parseFloat(req.body.targetAmount),
        currentAmount: req.body.currentAmount ? parseFloat(req.body.currentAmount) : 0,
        targetDate: req.body.targetDate,
        monthlyContribution: parseFloat(req.body.monthlyContribution),
        priority: req.body.priority || 'MEDIUM',
        status: req.body.status || 'ACTIVE',
      };

      // Validate required fields
      if (!goalData.goalType || !goalData.goalName || !goalData.targetAmount || !goalData.targetDate) {
        return res.status(400).json({
          success: false,
          error: 'Missing required goal fields',
          code: 'MISSING_REQUIRED_FIELDS',
        });
      }

      const goal = await this.service.createFinancialGoal(profileId, goalData);

      res.status(201).json({
        success: true,
        data: goal,
        message: 'Financial goal created successfully',
      });

    } catch (error) {
      console.error('Create financial goal error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create financial goal',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Update goal progress
   * PUT /api/v1/financial-goals/:goalId/progress
   */
  async updateGoalProgress(req, res, next) {
    try {
      const userId = req.user.id;
      const { goalId } = req.params;
      const { currentAmount } = req.body;

      if (currentAmount === undefined) {
        return res.status(400).json({
          success: false,
          error: 'Current amount is required',
          code: 'MISSING_CURRENT_AMOUNT',
        });
      }

      // Verify user owns this goal (this would require additional query to check ownership)
      const goal = await this.service.updateGoalProgress(goalId, parseFloat(currentAmount));

      res.status(200).json({
        success: true,
        data: goal,
        message: 'Goal progress updated successfully',
      });

    } catch (error) {
      console.error('Update goal progress error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update goal progress',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get financial health assessment
   * GET /api/v1/financial-profiles/health-assessment
   */
  async getFinancialHealthAssessment(req, res, next) {
    try {
      const userId = req.user.id;
      const assessment = await this.service.getFinancialHealthAssessment(userId);

      res.status(200).json({
        success: true,
        data: assessment,
        meta: {
          userId,
          assessedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Get financial health assessment error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get financial health assessment',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get portfolio suggestions
   * GET /api/v1/financial-profiles/portfolio-suggestions
   */
  async getPortfolioSuggestions(req, res, next) {
    try {
      const userId = req.user.id;
      const suggestions = await this.service.getPortfolioSuggestions(userId);

      res.status(200).json({
        success: true,
        data: suggestions,
        meta: {
          userId,
          generatedAt: new Date().toISOString(),
        },
      });

    } catch (error) {
      console.error('Get portfolio suggestions error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get portfolio suggestions',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get available financial goals
   * GET /api/v1/financial-profiles/goals
   */
  async getAvailableGoals(req, res, next) {
    try {
      const goals = [
        {
          value: 'RETIREMENT',
          label: 'Retirement Planning',
          description: 'Plan for your retirement with long-term investments',
          icon: '🏖️',
        },
        {
          value: 'HOUSE_PURCHASE',
          label: 'House Purchase',
          description: 'Save for buying your dream home',
          icon: '🏠',
        },
        {
          value: 'EDUCATION_FUND',
          label: 'Education Fund',
          description: 'Save for children\'s education expenses',
          icon: '🎓',
        },
        {
          value: 'WEALTH_GROWTH',
          label: 'Wealth Growth',
          description: 'Grow your wealth through strategic investments',
          icon: '💰',
        },
        {
          value: 'EMERGENCY_FUND',
          label: 'Emergency Fund',
          description: 'Build a safety net for unexpected expenses',
          icon: '🛡️',
        },
        {
          value: 'DEBT_PAYOFF',
          label: 'Debt Payoff',
          description: 'Plan to clear your debts efficiently',
          icon: '💳',
        },
        {
          value: 'VACATION',
          label: 'Vacation Fund',
          description: 'Save for your dream vacation',
          icon: '✈️',
        },
        {
          value: 'CAR_PURCHASE',
          label: 'Car Purchase',
          description: 'Save for buying a vehicle',
          icon: '🚗',
        },
        {
          value: 'WEDDING',
          label: 'Wedding Fund',
          description: 'Plan for your wedding expenses',
          icon: '💒',
        },
        {
          value: 'BUSINESS_STARTUP',
          label: 'Business Startup',
          description: 'Save for starting your own business',
          icon: '🚀',
        },
        {
          value: 'INHERITANCE_PLANNING',
          label: 'Inheritance Planning',
          description: 'Plan for wealth transfer and inheritance',
          icon: '📜',
        },
        {
          value: 'CHARITY_DONATION',
          label: 'Charity Donation',
          description: 'Plan for charitable giving',
          icon: '❤️',
        },
      ];

      res.status(200).json({
        success: true,
        data: goals,
        meta: {
          count: goals.length,
        },
      });

    } catch (error) {
      console.error('Get available goals error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get available goals',
        code: 'INTERNAL_ERROR',
      });
    }
  }

  /**
   * Get risk tolerance options
   * GET /api/v1/financial-profiles/risk-tolerance-options
   */
  async getRiskToleranceOptions(req, res, next) {
    try {
      const options = [
        {
          value: 'CONSERVATIVE',
          label: 'Conservative',
          description: 'Low risk tolerance. Prefer stable returns with capital protection.',
          riskLevel: 'LOW',
          expectedReturns: '6-8%',
          suitableFor: 'Retirees, risk-averse investors',
          icon: '🛡️',
        },
        {
          value: 'MODERATE',
          label: 'Moderate',
          description: 'Balanced risk tolerance. Willing to take calculated risks for better returns.',
          riskLevel: 'MEDIUM',
          expectedReturns: '8-12%',
          suitableFor: 'Most investors, balanced approach',
          icon: '⚖️',
        },
        {
          value: 'AGGRESSIVE',
          label: 'Aggressive',
          description: 'High risk tolerance. Willing to take significant risks for high returns.',
          riskLevel: 'HIGH',
          expectedReturns: '12-18%',
          suitableFor: 'Young investors, high-risk appetite',
          icon: '🚀',
        },
      ];

      res.status(200).json({
        success: true,
        data: options,
        meta: {
          count: options.length,
        },
      });

    } catch (error) {
      console.error('Get risk tolerance options error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to get risk tolerance options',
        code: 'INTERNAL_ERROR',
      });
    }
  }
}

module.exports = FinancialProfileController;
