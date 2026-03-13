/**
 * FinSathi AI - Financial Profile Service
 * Service layer for managing user financial profiles and investment recommendations
 */

const { PrismaClient } = require('@prisma/client');
const { 
  FinancialProfile, 
  InvestmentRecommendation, 
  FinancialGoalProfile,
  RiskTolerance,
  FinancialGoal 
} = require('@prisma/client');

class FinancialProfileService {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Create a new financial profile for a user
   * @param {string} userId - User ID
   * @param {Object} profileData - Financial profile data
   * @returns {Promise<Object>} Created financial profile
   */
  async createFinancialProfile(userId, profileData) {
    try {
      const profile = await this.prisma.financialProfile.create({
        data: {
          userId,
          monthlyIncome: profileData.monthlyIncome,
          monthlyExpenses: profileData.monthlyExpenses,
          currentSavings: profileData.currentSavings,
          riskTolerance: profileData.riskTolerance,
          investmentHorizonYears: profileData.investmentHorizonYears,
          financialGoal: profileData.financialGoal,
          targetAmount: profileData.targetAmount,
          targetDate: profileData.targetDate ? new Date(profileData.targetDate) : null,
          monthlyContribution: profileData.monthlyContribution,
          emergencyFundMonths: profileData.emergencyFundMonths,
          insuranceCoverage: profileData.insuranceCoverage || false,
          dependentsCount: profileData.dependentsCount,
          employmentStatus: profileData.employmentStatus,
          annualIncomeGrowth: profileData.annualIncomeGrowth,
          preferredInvestmentTypes: profileData.preferredInvestmentTypes || [],
          investmentExperience: profileData.investmentExperience,
          liquidityPreference: profileData.liquidityPreference,
          taxBracket: profileData.taxBracket,
        },
        include: {
          investmentRecommendations: true,
          financialGoals: true,
        },
      });

      // Generate initial investment recommendations
      await this.generateInvestmentRecommendations(profile.id);

      return profile;
    } catch (error) {
      throw new Error(`Failed to create financial profile: ${error.message}`);
    }
  }

  /**
   * Get financial profile by user ID and goal type
   * @param {string} userId - User ID
   * @param {FinancialGoal} goalType - Financial goal type
   * @returns {Promise<Object|null>} Financial profile
   */
  async getFinancialProfile(userId, goalType) {
    try {
      const profile = await this.prisma.financialProfile.findUnique({
        where: {
          userId_financialGoal: {
            userId,
            financialGoal: goalType,
          },
        },
        include: {
          investmentRecommendations: {
            where: {
              isActive: true,
            },
            orderBy: {
              confidenceScore: 'desc',
            },
          },
          financialGoals: {
            orderBy: {
              priority: 'asc',
            },
          },
        },
      });

      return profile;
    } catch (error) {
      throw new Error(`Failed to get financial profile: ${error.message}`);
    }
  }

  /**
   * Get all financial profiles for a user
   * @param {string} userId - User ID
   * @returns {Promise<Array>} Array of financial profiles
   */
  async getUserFinancialProfiles(userId) {
    try {
      const profiles = await this.prisma.financialProfile.findMany({
        where: {
          userId,
        },
        include: {
          investmentRecommendations: {
            where: {
              isActive: true,
            },
          },
          financialGoals: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      return profiles;
    } catch (error) {
      throw new Error(`Failed to get user financial profiles: ${error.message}`);
    }
  }

  /**
   * Update financial profile
   * @param {string} profileId - Profile ID
   * @param {Object} updateData - Update data
   * @returns {Promise<Object>} Updated financial profile
   */
  async updateFinancialProfile(profileId, updateData) {
    try {
      const profile = await this.prisma.financialProfile.update({
        where: {
          id: profileId,
        },
        data: {
          ...updateData,
          targetDate: updateData.targetDate ? new Date(updateData.targetDate) : undefined,
        },
        include: {
          investmentRecommendations: true,
          financialGoals: true,
        },
      });

      // Regenerate recommendations if key fields changed
      if (updateData.riskTolerance || updateData.investmentHorizonYears || updateData.financialGoal) {
        await this.generateInvestmentRecommendations(profileId);
      }

      return profile;
    } catch (error) {
      throw new Error(`Failed to update financial profile: ${error.message}`);
    }
  }

  /**
   * Delete financial profile
   * @param {string} profileId - Profile ID
   * @returns {Promise<Object>} Deleted financial profile
   */
  async deleteFinancialProfile(profileId) {
    try {
      const profile = await this.prisma.financialProfile.delete({
        where: {
          id: profileId,
        },
      });

      return profile;
    } catch (error) {
      throw new Error(`Failed to delete financial profile: ${error.message}`);
    }
  }

  /**
   * Generate investment recommendations based on financial profile
   * @param {string} profileId - Profile ID
   * @returns {Promise<Array>} Generated recommendations
   */
  async generateInvestmentRecommendations(profileId) {
    try {
      const profile = await this.prisma.financialProfile.findUnique({
        where: {
          id: profileId,
        },
      });

      if (!profile) {
        throw new Error('Financial profile not found');
      }

      // Deactivate existing recommendations
      await this.prisma.investmentRecommendation.updateMany({
        where: {
          financialProfileId: profileId,
        },
        data: {
          isActive: false,
        },
      });

      // Generate new recommendations based on profile
      const recommendations = this.calculateInvestmentRecommendations(profile);

      // Save new recommendations
      const savedRecommendations = await Promise.all(
        recommendations.map(rec => 
          this.prisma.investmentRecommendation.create({
            data: {
              financialProfileId: profileId,
              ...rec,
            },
          })
        )
      );

      return savedRecommendations;
    } catch (error) {
      throw new Error(`Failed to generate investment recommendations: ${error.message}`);
    }
  }

  /**
   * Calculate investment recommendations based on financial profile
   * @param {Object} profile - Financial profile data
   * @returns {Array} Investment recommendations
   */
  calculateInvestmentRecommendations(profile) {
    const recommendations = [];
    const { riskTolerance, investmentHorizonYears, financialGoal, monthlyIncome, currentSavings } = profile;

    // Risk-based investment recommendations
    if (riskTolerance === RiskTolerance.CONSERVATIVE) {
      recommendations.push({
        investmentType: 'Fixed Deposits',
        recommendationText: 'Low-risk fixed deposits offer stable returns with capital protection. Ideal for conservative investors seeking predictable income.',
        riskLevel: 'LOW',
        expectedReturn: 6.5,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 10000,
        confidenceScore: 0.85,
      });

      recommendations.push({
        investmentType: 'Government Bonds',
        recommendationText: 'Government securities provide safety and regular income. Backed by government guarantee.',
        riskLevel: 'LOW',
        expectedReturn: 7.2,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 25000,
        confidenceScore: 0.90,
      });

      recommendations.push({
        investmentType: 'Debt Mutual Funds',
        recommendationText: 'Debt funds invest in fixed income securities, offering better returns than FDs with moderate risk.',
        riskLevel: 'LOW_TO_MODERATE',
        expectedReturn: 8.5,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 5000,
        confidenceScore: 0.75,
      });
    } else if (riskTolerance === RiskTolerance.MODERATE) {
      recommendations.push({
        investmentType: 'Balanced Mutual Funds',
        recommendationText: 'Balanced funds mix equity and debt for optimal risk-return balance. Good for moderate risk appetite.',
        riskLevel: 'MODERATE',
        expectedReturn: 10.5,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 5000,
        confidenceScore: 0.80,
      });

      recommendations.push({
        investmentType: 'Index Funds',
        recommendationText: 'Index funds track market indices, offering diversification at low cost. Passive investing strategy.',
        riskLevel: 'MODERATE',
        expectedReturn: 11.2,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 5000,
        confidenceScore: 0.75,
      });

      recommendations.push({
        investmentType: 'Corporate Bonds',
        recommendationText: 'Corporate bonds offer higher yields than government bonds with slightly higher risk.',
        riskLevel: 'MODERATE',
        expectedReturn: 9.8,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 10000,
        confidenceScore: 0.70,
      });
    } else if (riskTolerance === RiskTolerance.AGGRESSIVE) {
      recommendations.push({
        investmentType: 'Equity Mutual Funds',
        recommendationText: 'Equity funds offer high growth potential with higher risk. Suitable for long-term wealth creation.',
        riskLevel: 'HIGH',
        expectedReturn: 14.5,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 5000,
        confidenceScore: 0.70,
      });

      recommendations.push({
        investmentType: 'Direct Stocks',
        recommendationText: 'Direct equity investment offers highest returns but requires research and monitoring.',
        riskLevel: 'HIGH',
        expectedReturn: 16.8,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 1000,
        confidenceScore: 0.60,
      });

      recommendations.push({
        investmentType: 'Sectoral Funds',
        recommendationText: 'Sectoral funds focus on specific sectors for targeted growth opportunities.',
        riskLevel: 'HIGH',
        expectedReturn: 15.2,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 5000,
        confidenceScore: 0.65,
      });
    }

    // Goal-specific recommendations
    if (financialGoal === FinancialGoal.RETIREMENT) {
      recommendations.push({
        investmentType: 'Retirement Funds (NPS)',
        recommendationText: 'National Pension System offers tax benefits and retirement-focused investment strategy.',
        riskLevel: 'MODERATE',
        expectedReturn: 9.5,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 6000,
        confidenceScore: 0.85,
      });
    } else if (financialGoal === FinancialGoal.EDUCATION_FUND) {
      recommendations.push({
        investmentType: 'Child Education Funds',
        recommendationText: 'Specialized funds for children\'s education with tax benefits under Section 80C.',
        riskLevel: 'MODERATE',
        expectedReturn: 10.2,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 5000,
        confidenceScore: 0.80,
      });
    } else if (financialGoal === FinancialGoal.HOUSE_PURCHASE) {
      recommendations.push({
        investmentType: 'Real Estate Funds',
        recommendationText: 'Real estate funds provide exposure to property market with professional management.',
        riskLevel: 'MODERATE_TO_HIGH',
        expectedReturn: 12.5,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 10000,
        confidenceScore: 0.70,
      });
    }

    // Income-based recommendations
    if (monthlyIncome > 100000) { // High income
      recommendations.push({
        investmentType: 'Portfolio Management Services (PMS)',
        recommendationText: 'Professional portfolio management for high-net-worth individuals with customized strategies.',
        riskLevel: 'MODERATE_TO_HIGH',
        expectedReturn: 13.5,
        timeHorizon: investmentHorizonYears,
        minimumInvestment: 2500000,
        confidenceScore: 0.75,
      });
    }

    return recommendations;
  }

  /**
   * Create financial goal
   * @param {string} profileId - Profile ID
   * @param {Object} goalData - Goal data
   * @returns {Promise<Object>} Created financial goal
   */
  async createFinancialGoal(profileId, goalData) {
    try {
      const goal = await this.prisma.financialGoalProfile.create({
        data: {
          financialProfileId: profileId,
          goalType: goalData.goalType,
          goalName: goalData.goalName,
          targetAmount: goalData.targetAmount,
          currentAmount: goalData.currentAmount || 0,
          targetDate: new Date(goalData.targetDate),
          monthlyContribution: goalData.monthlyContribution,
          priority: goalData.priority || 'MEDIUM',
          status: goalData.status || 'ACTIVE',
          progressPercentage: goalData.currentAmount ? (goalData.currentAmount / goalData.targetAmount) * 100 : 0,
        },
      });

      return goal;
    } catch (error) {
      throw new Error(`Failed to create financial goal: ${error.message}`);
    }
  }

  /**
   * Update financial goal progress
   * @param {string} goalId - Goal ID
   * @param {number} currentAmount - Current amount saved
   * @returns {Promise<Object>} Updated goal
   */
  async updateGoalProgress(goalId, currentAmount) {
    try {
      const goal = await this.prisma.financialGoalProfile.findUnique({
        where: {
          id: goalId,
        },
      });

      if (!goal) {
        throw new Error('Financial goal not found');
      }

      const progressPercentage = (currentAmount / goal.targetAmount) * 100;
      const status = progressPercentage >= 100 ? 'COMPLETED' : 'ACTIVE';

      const updatedGoal = await this.prisma.financialGoalProfile.update({
        where: {
          id: goalId,
        },
        data: {
          currentAmount,
          progressPercentage,
          status,
        },
      });

      return updatedGoal;
    } catch (error) {
      throw new Error(`Failed to update goal progress: ${error.message}`);
    }
  }

  /**
   * Get financial health assessment
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Financial health assessment
   */
  async getFinancialHealthAssessment(userId) {
    try {
      const profiles = await this.getUserFinancialProfiles(userId);
      
      if (profiles.length === 0) {
        return {
          score: 0,
          category: 'NO_DATA',
          recommendations: ['Create a financial profile to get health assessment'],
        };
      }

      // Calculate health metrics
      const totalMonthlyIncome = profiles.reduce((sum, p) => sum + p.monthlyIncome, 0);
      const totalMonthlyExpenses = profiles.reduce((sum, p) => sum + p.monthlyExpenses, 0);
      const totalSavings = profiles.reduce((sum, p) => sum + p.currentSavings, 0);
      
      const savingsRate = totalMonthlyIncome > 0 ? ((totalMonthlyIncome - totalMonthlyExpenses) / totalMonthlyIncome) * 100 : 0;
      const emergencyFundMonths = totalMonthlyExpenses > 0 ? (totalSavings / totalMonthlyExpenses) : 0;
      
      let healthScore = 0;
      let category = 'POOR';
      
      // Calculate health score
      if (savingsRate >= 20) healthScore += 30;
      else if (savingsRate >= 10) healthScore += 20;
      else if (savingsRate >= 5) healthScore += 10;
      
      if (emergencyFundMonths >= 6) healthScore += 30;
      else if (emergencyFundMonths >= 3) healthScore += 20;
      else if (emergencyFundMonths >= 1) healthScore += 10;
      
      if (totalSavings >= totalMonthlyIncome * 6) healthScore += 20;
      else if (totalSavings >= totalMonthlyIncome * 3) healthScore += 15;
      else if (totalSavings >= totalMonthlyIncome) healthScore += 10;
      
      if (profiles.some(p => p.insuranceCoverage)) healthScore += 20;
      
      if (healthScore >= 80) category = 'EXCELLENT';
      else if (healthScore >= 60) category = 'GOOD';
      else if (healthScore >= 40) category = 'FAIR';
      else if (healthScore >= 20) category = 'POOR';
      else category = 'CRITICAL';

      const recommendations = [];
      
      if (savingsRate < 10) {
        recommendations.push('Increase your savings rate to at least 10% of monthly income');
      }
      
      if (emergencyFundMonths < 3) {
        recommendations.push('Build an emergency fund covering at least 3 months of expenses');
      }
      
      if (!profiles.some(p => p.insuranceCoverage)) {
        recommendations.push('Consider getting insurance coverage for financial protection');
      }
      
      if (totalSavings < totalMonthlyIncome * 3) {
        recommendations.push('Work towards building savings equal to at least 3 months of income');
      }

      return {
        score: healthScore,
        category,
        savingsRate: Math.round(savingsRate * 100) / 100,
        emergencyFundMonths: Math.round(emergencyFundMonths * 100) / 100,
        totalSavings,
        totalMonthlyIncome,
        totalMonthlyExpenses,
        recommendations,
      };
    } catch (error) {
      throw new Error(`Failed to get financial health assessment: ${error.message}`);
    }
  }

  /**
   * Get investment portfolio suggestions
   * @param {string} userId - User ID
   * @returns {Promise<Object>} Portfolio suggestions
   */
  async getPortfolioSuggestions(userId) {
    try {
      const profiles = await this.getUserFinancialProfiles(userId);
      
      if (profiles.length === 0) {
        return {
          allocation: {},
          suggestions: ['Create a financial profile to get portfolio suggestions'],
        };
      }

      // Aggregate profile data
      const avgRiskTolerance = this.getMostCommonRiskTolerance(profiles);
      const avgInvestmentHorizon = Math.round(profiles.reduce((sum, p) => sum + p.investmentHorizonYears, 0) / profiles.length);
      const totalSavings = profiles.reduce((sum, p) => sum + p.currentSavings, 0);
      
      // Generate portfolio allocation based on risk tolerance
      let allocation = {};
      
      if (avgRiskTolerance === RiskTolerance.CONSERVATIVE) {
        allocation = {
          'Debt Instruments': 60,
          'Fixed Deposits': 20,
          'Gold': 10,
          'Equity': 10,
        };
      } else if (avgRiskTolerance === RiskTolerance.MODERATE) {
        allocation = {
          'Equity Mutual Funds': 40,
          'Debt Instruments': 30,
          'Fixed Deposits': 15,
          'Gold': 10,
          'Real Estate': 5,
        };
      } else if (avgRiskTolerance === RiskTolerance.AGGRESSIVE) {
        allocation = {
          'Equity': 50,
          'Equity Mutual Funds': 25,
          'Debt Instruments': 15,
          'Gold': 5,
          'Real Estate': 5,
        };
      }

      return {
        allocation,
        totalSavings,
        avgRiskTolerance,
        avgInvestmentHorizon,
        suggestions: this.generatePortfolioSuggestions(allocation, avgRiskTolerance),
      };
    } catch (error) {
      throw new Error(`Failed to get portfolio suggestions: ${error.message}`);
    }
  }

  /**
   * Get most common risk tolerance from profiles
   * @param {Array} profiles - Array of financial profiles
   * @returns {string} Most common risk tolerance
   */
  getMostCommonRiskTolerance(profiles) {
    const riskCounts = {};
    profiles.forEach(p => {
      riskCounts[p.riskTolerance] = (riskCounts[p.riskTolerance] || 0) + 1;
    });
    
    return Object.keys(riskCounts).reduce((a, b) => 
      riskCounts[a] > riskCounts[b] ? a : b
    );
  }

  /**
   * Generate portfolio suggestions based on allocation
   * @param {Object} allocation - Portfolio allocation
   * @param {string} riskTolerance - Risk tolerance
   * @returns {Array} Portfolio suggestions
   */
  generatePortfolioSuggestions(allocation, riskTolerance) {
    const suggestions = [];
    
    if (riskTolerance === RiskTolerance.CONSERVATIVE) {
      suggestions.push('Consider Systematic Investment Plans (SIPs) for disciplined investing');
      suggestions.push('Review and optimize your fixed deposit rates annually');
      suggestions.push('Maintain 6-12 months of expenses in liquid funds');
    } else if (riskTolerance === RiskTolerance.MODERATE) {
      suggestions.push('Diversify across multiple mutual fund categories');
      suggestions.push('Consider index funds for low-cost market exposure');
      suggestions.push('Review portfolio performance quarterly');
    } else if (riskTolerance === RiskTolerance.AGGRESSIVE) {
      suggestions.push('Limit direct equity exposure to 50% of portfolio');
      suggestions.push('Consider sectoral funds for targeted growth');
      suggestions.push('Regular portfolio rebalancing recommended');
    }
    
    return suggestions;
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = FinancialProfileService;
