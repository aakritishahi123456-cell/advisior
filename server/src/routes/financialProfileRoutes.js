/**
 * FinSathi AI - Financial Profile Routes
 * API route definitions for financial profile management
 */

const { FinancialProfileController } = require('../controllers/financialProfileController');

const controller = new FinancialProfileController();

/**
 * Financial profile routes
 */
const financialProfileRoutes = [
  // Create financial profile
  {
    method: 'post',
    path: '/api/v1/financial-profiles',
    handler: controller.createFinancialProfile.bind(controller),
    description: 'Create a new financial profile for investment planning',
    parameters: {
      monthlyIncome: {
        type: 'body',
        required: true,
        description: 'Monthly income in NPR',
        example: 100000,
      },
      monthlyExpenses: {
        type: 'body',
        required: true,
        description: 'Monthly expenses in NPR',
        example: 60000,
      },
      currentSavings: {
        type: 'body',
        required: true,
        description: 'Current total savings in NPR',
        example: 500000,
      },
      riskTolerance: {
        type: 'body',
        required: true,
        description: 'Risk tolerance level',
        example: 'MODERATE',
        options: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
      },
      investmentHorizonYears: {
        type: 'body',
        required: true,
        description: 'Investment time horizon in years',
        example: 10,
      },
      financialGoal: {
        type: 'body',
        required: true,
        description: 'Primary financial goal',
        example: 'RETIREMENT',
        options: ['RETIREMENT', 'HOUSE_PURCHASE', 'EDUCATION_FUND', 'WEALTH_GROWTH', 'EMERGENCY_FUND', 'DEBT_PAYOFF', 'VACATION', 'CAR_PURCHASE', 'WEDDING', 'BUSINESS_STARTUP', 'INHERITANCE_PLANNING', 'CHARITY_DONATION'],
      },
      targetAmount: {
        type: 'body',
        required: false,
        description: 'Target amount for financial goal in NPR',
        example: 5000000,
      },
      targetDate: {
        type: 'body',
        required: false,
        description: 'Target date for achieving financial goal',
        example: '2035-12-31',
      },
      monthlyContribution: {
        type: 'body',
        required: false,
        description: 'Monthly contribution towards goal in NPR',
        example: 15000,
      },
      emergencyFundMonths: {
        type: 'body',
        required: false,
        description: 'Emergency fund coverage in months',
        example: 6,
      },
      insuranceCoverage: {
        type: 'body',
        required: false,
        description: 'Whether user has insurance coverage',
        example: true,
      },
      dependentsCount: {
        type: 'body',
        required: false,
        description: 'Number of dependents',
        example: 2,
      },
      employmentStatus: {
        type: 'body',
        required: false,
        description: 'Current employment status',
        example: 'EMPLOYED',
      },
      annualIncomeGrowth: {
        type: 'body',
        required: false,
        description: 'Expected annual income growth percentage',
        example: 5.5,
      },
      preferredInvestmentTypes: {
        type: 'body',
        required: false,
        description: 'Preferred investment types',
        example: ['MUTUAL_FUNDS', 'FIXED_DEPOSITS', 'STOCKS'],
      },
      investmentExperience: {
        type: 'body',
        required: false,
        description: 'Investment experience level',
        example: 'INTERMEDIATE',
      },
      liquidityPreference: {
        type: 'body',
        required: false,
        description: 'Liquidity preference',
        example: 'MEDIUM',
      },
      taxBracket: {
        type: 'body',
        required: false,
        description: 'Tax bracket',
        example: '20%',
      },
    },
    responses: {
      201: {
        description: 'Financial profile created successfully',
        schema: {
          success: true,
          data: {
            id: 'string',
            userId: 'string',
            monthlyIncome: 'number',
            monthlyExpenses: 'number',
            currentSavings: 'number',
            riskTolerance: 'string',
            investmentHorizonYears: 'number',
            financialGoal: 'string',
            targetAmount: 'number',
            targetDate: 'string',
            monthlyContribution: 'number',
            emergencyFundMonths: 'number',
            insuranceCoverage: 'boolean',
            dependentsCount: 'number',
            employmentStatus: 'string',
            annualIncomeGrowth: 'number',
            preferredInvestmentTypes: 'array',
            investmentExperience: 'string',
            liquidityPreference: 'string',
            taxBracket: 'string',
            createdAt: 'string',
            updatedAt: 'string',
          },
          message: 'Financial profile created successfully',
        },
      },
      400: {
        description: 'Bad request - Missing required fields',
        schema: {
          success: false,
          error: 'string',
          code: 'MISSING_REQUIRED_FIELDS',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Get all financial profiles for user
  {
    method: 'get',
    path: '/api/v1/financial-profiles',
    handler: controller.getUserFinancialProfiles.bind(controller),
    description: 'Get all financial profiles for the authenticated user',
    responses: {
      200: {
        description: 'Financial profiles retrieved successfully',
        schema: {
          success: true,
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: 'string',
                userId: 'string',
                monthlyIncome: 'number',
                monthlyExpenses: 'number',
                currentSavings: 'number',
                riskTolerance: 'string',
                investmentHorizonYears: 'number',
                financialGoal: 'string',
                targetAmount: 'number',
                targetDate: 'string',
                monthlyContribution: 'number',
                emergencyFundMonths: 'number',
                insuranceCoverage: 'boolean',
                dependentsCount: 'number',
                employmentStatus: 'string',
                annualIncomeGrowth: 'number',
                preferredInvestmentTypes: 'array',
                investmentExperience: 'string',
                liquidityPreference: 'string',
                taxBracket: 'string',
                createdAt: 'string',
                updatedAt: 'string',
              },
            },
          },
          meta: {
            count: 'number',
            userId: 'string',
          },
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Get specific financial profile
  {
    method: 'get',
    path: '/api/v1/financial-profiles/:goalType',
    handler: controller.getFinancialProfile.bind(controller),
    description: 'Get financial profile by goal type',
    parameters: {
      goalType: {
        type: 'path',
        required: true,
        description: 'Financial goal type',
        example: 'RETIREMENT',
        options: ['RETIREMENT', 'HOUSE_PURCHASE', 'EDUCATION_FUND', 'WEALTH_GROWTH', 'EMERGENCY_FUND', 'DEBT_PAYOFF', 'VACATION', 'CAR_PURCHASE', 'WEDDING', 'BUSINESS_STARTUP', 'INHERITANCE_PLANNING', 'CHARITY_DONATION'],
      },
    },
    responses: {
      200: {
        description: 'Financial profile retrieved successfully',
        schema: {
          success: true,
          data: {
            id: 'string',
            userId: 'string',
            monthlyIncome: 'number',
            monthlyExpenses: 'number',
            currentSavings: 'number',
            riskTolerance: 'string',
            investmentHorizonYears: 'number',
            financialGoal: 'string',
            targetAmount: 'number',
            targetDate: 'string',
            monthlyContribution: 'number',
            emergencyFundMonths: 'number',
            insuranceCoverage: 'boolean',
            dependentsCount: 'number',
            employmentStatus: 'string',
            annualIncomeGrowth: 'number',
            preferredInvestmentTypes: 'array',
            investmentExperience: 'string',
            liquidityPreference: 'string',
            taxBracket: 'string',
            createdAt: 'string',
            updatedAt: 'string',
            investmentRecommendations: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'string',
                  investmentType: 'string',
                  recommendationText: 'string',
                  riskLevel: 'string',
                  expectedReturn: 'number',
                  timeHorizon: 'number',
                  minimumInvestment: 'number',
                  confidenceScore: 'number',
                },
              },
            },
            financialGoals: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  id: 'string',
                  goalType: 'string',
                  goalName: 'string',
                  targetAmount: 'number',
                  currentAmount: 'number',
                  targetDate: 'string',
                  monthlyContribution: 'number',
                  priority: 'string',
                  status: 'string',
                  progressPercentage: 'number',
                  createdAt: 'string',
                  updatedAt: 'string',
                },
              },
            },
          },
        },
      },
      404: {
        description: 'Financial profile not found',
        schema: {
          success: false,
          error: 'string',
          code: 'PROFILE_NOT_FOUND',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Update financial profile
  {
    method: 'put',
    path: '/api/v1/financial-profiles/:profileId',
    handler: controller.updateFinancialProfile.bind(controller),
    description: 'Update existing financial profile',
    parameters: {
      profileId: {
        type: 'path',
        required: true,
        description: 'Financial profile ID',
        example: 'profile_123',
      },
      monthlyIncome: {
        type: 'body',
        required: false,
        description: 'Updated monthly income in NPR',
        example: 120000,
      },
      monthlyExpenses: {
        type: 'body',
        required: false,
        description: 'Updated monthly expenses in NPR',
        example: 70000,
      },
      currentSavings: {
        type: 'body',
        required: false,
        description: 'Updated current savings in NPR',
        example: 600000,
      },
      riskTolerance: {
        type: 'body',
        required: false,
        description: 'Updated risk tolerance level',
        example: 'AGGRESSIVE',
        options: ['CONSERVATIVE', 'MODERATE', 'AGGRESSIVE'],
      },
      investmentHorizonYears: {
        type: 'body',
        required: false,
        description: 'Updated investment time horizon in years',
        example: 15,
      },
      financialGoal: {
        type: 'body',
        required: false,
        description: 'Updated primary financial goal',
        example: 'WEALTH_GROWTH',
        options: ['RETIREMENT', 'HOUSE_PURCHASE', 'EDUCATION_FUND', 'WEALTH_GROWTH', 'EMERGENCY_FUND', 'DEBT_PAYOFF', 'VACATION', 'CAR_PURCHASE', 'WEDDING', 'BUSINESS_STARTUP', 'INHERITANCE_PLANNING', 'CHARITY_DONATION'],
      },
    },
    responses: {
      200: {
        description: 'Financial profile updated successfully',
        schema: {
          success: true,
          data: {
            id: 'string',
            userId: 'string',
            monthlyIncome: 'number',
            monthlyExpenses: 'number',
            currentSavings: 'number',
            riskTolerance: 'string',
            investmentHorizonYears: 'number',
            financialGoal: 'string',
            targetAmount: 'number',
            targetDate: 'string',
            monthlyContribution: 'number',
            emergencyFundMonths: 'number',
            insuranceCoverage: 'boolean',
            dependentsCount: 'number',
            employmentStatus: 'string',
            annualIncomeGrowth: 'number',
            preferredInvestmentTypes: 'array',
            investmentExperience: 'string',
            liquidityPreference: 'string',
            taxBracket: 'string',
            createdAt: 'string',
            updatedAt: 'string',
          },
          message: 'Financial profile updated successfully',
        },
      },
      403: {
        description: 'Access denied',
        schema: {
          success: false,
          error: 'string',
          code: 'ACCESS_DENIED',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Delete financial profile
  {
    method: 'delete',
    path: '/api/v1/financial-profiles/:profileId',
    handler: controller.deleteFinancialProfile.bind(controller),
    description: 'Delete financial profile',
    parameters: {
      profileId: {
        type: 'path',
        required: true,
        description: 'Financial profile ID to delete',
        example: 'profile_123',
      },
    },
    responses: {
      200: {
        description: 'Financial profile deleted successfully',
        schema: {
          success: true,
          message: 'Financial profile deleted successfully',
        },
      },
      403: {
        description: 'Access denied',
        schema: {
          success: false,
          error: 'string',
          code: 'ACCESS_DENIED',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Get investment recommendations
  {
    method: 'get',
    path: '/api/v1/financial-profiles/:profileId/recommendations',
    handler: controller.getInvestmentRecommendations.bind(controller),
    description: 'Get investment recommendations for a financial profile',
    parameters: {
      profileId: {
        type: 'path',
        required: true,
        description: 'Financial profile ID',
        example: 'profile_123',
      },
    },
    responses: {
      200: {
        description: 'Investment recommendations retrieved successfully',
        schema: {
          success: true,
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                id: 'string',
                investmentType: 'string',
                recommendationText: 'string',
                riskLevel: 'string',
                expectedReturn: 'number',
                timeHorizon: 'number',
                minimumInvestment: 'number',
                confidenceScore: 'number',
                createdAt: 'string',
                updatedAt: 'string',
              },
            },
          },
          meta: {
            profileId: 'string',
            generatedAt: 'string',
            count: 'number',
          },
        },
      },
      403: {
        description: 'Access denied',
        schema: {
          success: false,
          error: 'string',
          code: 'ACCESS_DENIED',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Create financial goal
  {
    method: 'post',
    path: '/api/v1/financial-profiles/:profileId/goals',
    handler: controller.createFinancialGoal.bind(controller),
    description: 'Create a new financial goal',
    parameters: {
      profileId: {
        type: 'path',
        required: true,
        description: 'Financial profile ID',
        example: 'profile_123',
      },
      goalType: {
        type: 'body',
        required: true,
        description: 'Goal type',
        example: 'RETIREMENT',
        options: ['RETIREMENT', 'HOUSE_PURCHASE', 'EDUCATION_FUND', 'WEALTH_GROWTH', 'EMERGENCY_FUND', 'DEBT_PAYOFF', 'VACATION', 'CAR_PURCHASE', 'WEDDING', 'BUSINESS_STARTUP', 'INHERITANCE_PLANNING', 'CHARITY_DONATION'],
      },
      goalName: {
        type: 'body',
        required: true,
        description: 'Goal name',
        example: 'Early Retirement Fund',
      },
      targetAmount: {
        type: 'body',
        required: true,
        description: 'Target amount in NPR',
        example: 10000000,
      },
      currentAmount: {
        type: 'body',
        required: false,
        description: 'Current amount saved',
        example: 2000000,
      },
      targetDate: {
        type: 'body',
        required: true,
        description: 'Target date to achieve goal',
        example: '2045-12-31',
      },
      monthlyContribution: {
        type: 'body',
        required: true,
        description: 'Monthly contribution towards goal',
        example: 25000,
      },
      priority: {
        type: 'body',
        required: false,
        description: 'Goal priority',
        example: 'HIGH',
        options: ['HIGH', 'MEDIUM', 'LOW'],
      },
      status: {
        type: 'body',
        required: false,
        description: 'Goal status',
        example: 'ACTIVE',
        options: ['ACTIVE', 'PAUSED', 'COMPLETED', 'CANCELLED'],
      },
    },
    responses: {
      201: {
        description: 'Financial goal created successfully',
        schema: {
          success: true,
          data: {
            id: 'string',
            financialProfileId: 'string',
            goalType: 'string',
            goalName: 'string',
            targetAmount: 'number',
            currentAmount: 'number',
            targetDate: 'string',
            monthlyContribution: 'number',
            priority: 'string',
            status: 'string',
            progressPercentage: 'number',
            createdAt: 'string',
            updatedAt: 'string',
          },
          message: 'Financial goal created successfully',
        },
      },
      400: {
        description: 'Bad request - Missing required fields',
        schema: {
          success: false,
          error: 'string',
          code: 'MISSING_REQUIRED_FIELDS',
        },
      },
      403: {
        description: 'Access denied',
        schema: {
          success: false,
          error: 'string',
          code: 'ACCESS_DENIED',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Update goal progress
  {
    method: 'put',
    path: '/api/v1/financial-goals/:goalId/progress',
    handler: controller.updateGoalProgress.bind(controller),
    description: 'Update progress for a financial goal',
    parameters: {
      goalId: {
        type: 'path',
        required: true,
        description: 'Financial goal ID',
        example: 'goal_123',
      },
      currentAmount: {
        type: 'body',
        required: true,
        description: 'Current amount saved towards goal',
        example: 3500000,
      },
    },
    responses: {
      200: {
        description: 'Goal progress updated successfully',
        schema: {
          success: true,
          data: {
            id: 'string',
            financialProfileId: 'string',
            goalType: 'string',
            goalName: 'string',
            targetAmount: 'number',
            currentAmount: 'number',
            targetDate: 'string',
            monthlyContribution: 'number',
            priority: 'string',
            status: 'string',
            progressPercentage: 'number',
            createdAt: 'string',
            updatedAt: 'string',
          },
          message: 'Goal progress updated successfully',
        },
      },
      400: {
        description: 'Bad request - Missing current amount',
        schema: {
          success: false,
          error: 'string',
          code: 'MISSING_CURRENT_AMOUNT',
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Get financial health assessment
  {
    method: 'get',
    path: '/api/v1/financial-profiles/health-assessment',
    handler: controller.getFinancialHealthAssessment.bind(controller),
    description: 'Get comprehensive financial health assessment',
    responses: {
      200: {
        description: 'Financial health assessment retrieved successfully',
        schema: {
          success: true,
          data: {
            score: 'number',
            category: 'string',
            savingsRate: 'number',
            emergencyFundMonths: 'number',
            totalSavings: 'number',
            totalMonthlyIncome: 'number',
            totalMonthlyExpenses: 'number',
            recommendations: {
              type: 'array',
              items: 'string',
            },
          },
          meta: {
            userId: 'string',
            assessedAt: 'string',
          },
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Get portfolio suggestions
  {
    method: 'get',
    path: '/api/v1/financial-profiles/portfolio-suggestions',
    handler: controller.getPortfolioSuggestions.bind(controller),
    description: 'Get personalized portfolio allocation suggestions',
    responses: {
      200: {
        description: 'Portfolio suggestions retrieved successfully',
        schema: {
          success: true,
          data: {
            allocation: {
              type: 'object',
              properties: {
                'Debt Instruments': 'number',
                'Equity': 'number',
                'Fixed Deposits': 'number',
                'Gold': 'number',
                'Real Estate': 'number',
                'Equity Mutual Funds': 'number',
              },
            },
            totalSavings: 'number',
            avgRiskTolerance: 'string',
            avgInvestmentHorizon: 'number',
            suggestions: {
              type: 'array',
              items: 'string',
            },
          },
          meta: {
            userId: 'string',
            generatedAt: 'string',
          },
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Get available financial goals
  {
    method: 'get',
    path: '/api/v1/financial-profiles/goals',
    handler: controller.getAvailableGoals.bind(controller),
    description: 'Get list of available financial goal types',
    responses: {
      200: {
        description: 'Available goals retrieved successfully',
        schema: {
          success: true,
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                value: 'string',
                label: 'string',
                description: 'string',
                icon: 'string',
              },
            },
          },
          meta: {
            count: 'number',
          },
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },

  // Get risk tolerance options
  {
    method: 'get',
    path: '/api/v1/financial-profiles/risk-tolerance-options',
    handler: controller.getRiskToleranceOptions.bind(controller),
    description: 'Get risk tolerance options with descriptions',
    responses: {
      200: {
        description: 'Risk tolerance options retrieved successfully',
        schema: {
          success: true,
          data: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                value: 'string',
                label: 'string',
                description: 'string',
                riskLevel: 'string',
                expectedReturns: 'string',
                suitableFor: 'string',
                icon: 'string',
              },
            },
          },
          meta: {
            count: 'number',
          },
        },
      },
      500: {
        description: 'Internal server error',
        schema: {
          success: false,
          error: 'string',
          code: 'INTERNAL_ERROR',
        },
      },
    },
  },
];

module.exports = financialProfileRoutes;
