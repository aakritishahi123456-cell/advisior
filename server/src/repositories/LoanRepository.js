import { BaseRepository } from './BaseRepository';
import { logger } from '../utils/logger';

export class LoanRepository extends BaseRepository {
  constructor() {
    super(prisma.loanSimulation);
  }

  /**
   * Create loan simulation
   * @param {Object} simulationData - Simulation data
   * @returns {Object} Created simulation
   */
  async createSimulation(simulationData) {
    try {
      return await this.create(simulationData);
    } catch (error) {
      logger.error('Error creating loan simulation:', error);
      throw error;
    }
  }

  /**
   * Get simulation by ID
   * @param {string} id - Simulation ID
   * @returns {Object} Simulation data
   */
  async getSimulationById(id) {
    try {
      return await this.findById(id);
    } catch (error) {
      logger.error('Error getting loan simulation by ID:', error);
      throw error;
    }
  }

  /**
   * Get user's simulations
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Paginated simulations
   */
  async getUserSimulations(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      return await this.findWithPagination(
        { userId },
        {
          page,
          limit,
          orderBy: { [sortBy]: sortOrder },
        }
      );
    } catch (error) {
      logger.error('Error getting user simulations:', error);
      throw error;
    }
  }

  /**
   * Delete simulation
   * @param {string} id - Simulation ID
   * @returns {Object} Deleted simulation
   */
  async deleteSimulation(id) {
    try {
      return await this.delete(id);
    } catch (error) {
      logger.error('Error deleting loan simulation:', error);
      throw error;
    }
  }

  /**
   * Get simulation statistics
   * @param {string} userId - User ID (optional)
   * @returns {Object} Statistics
   */
  async getSimulationStats(userId = null) {
    try {
      const where = userId ? { userId } : {};
      
      const [
        totalSimulations,
        totalAmount,
        averageEMI,
        averageTenure,
      ] = await Promise.all([
        this.count(where),
        this.aggregate({
          _sum: { amount: true },
          where,
        }),
        this.aggregate({
          _avg: { emi: true },
          where,
        }),
        this.aggregate({
          _avg: { tenure: true },
          where,
        }),
      ]);

      return {
        totalSimulations,
        totalAmount: totalAmount._sum.amount || 0,
        averageEMI: averageEMI._avg.emi || 0,
        averageTenure: averageTenure._avg.tenure || 0,
      };
    } catch (error) {
      logger.error('Error getting simulation stats:', error);
      throw error;
    }
  }

  /**
   * Get simulations by amount range
   * @param {number} minAmount - Minimum amount
   * @param {number} maxAmount - Maximum amount
   * @param {Object} options - Query options
   * @returns {Array} Simulations
   */
  async getSimulationsByAmountRange(minAmount, maxAmount, options = {}) {
    try {
      return await this.findMany(
        {
          amount: {
            gte: minAmount,
            lte: maxAmount,
          },
        },
        options
      );
    } catch (error) {
      logger.error('Error getting simulations by amount range:', error);
      throw error;
    }
  }

  /**
   * Get simulations by interest rate range
   * @param {number} minRate - Minimum rate
   * @param {number} maxRate - Maximum rate
   * @param {Object} options - Query options
   * @returns {Array} Simulations
   */
  async getSimulationsByRateRange(minRate, maxRate, options = {}) {
    try {
      return await this.findMany(
        {
          rate: {
            gte: minRate,
            lte: maxRate,
          },
        },
        options
      );
    } catch (error) {
      logger.error('Error getting simulations by rate range:', error);
      throw error;
    }
  }

  /**
   * Get simulations by tenure
   * @param {number} tenure - Tenure in years
   * @param {Object} options - Query options
   * @returns {Array} Simulations
   */
  async getSimulationsByTenure(tenure, options = {}) {
    try {
      return await this.findMany({ tenure }, options);
    } catch (error) {
      logger.error('Error getting simulations by tenure:', error);
      throw error;
    }
  }

  /**
   * Get recent simulations
   * @param {number} limit - Number of recent simulations
   * @param {string} userId - User ID (optional)
   * @returns {Array} Recent simulations
   */
  async getRecentSimulations(limit = 10, userId = null) {
    try {
      const where = userId ? { userId } : {};
      
      return await this.findMany(where, {
        orderBy: { createdAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error getting recent simulations:', error);
      throw error;
    }
  }

  /**
   * Search simulations
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async searchSimulations(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        userId = null,
      } = options;

      // For numeric fields, we'll search by approximate ranges
      const numericQuery = parseFloat(query);
      
      let where = {};
      
      if (userId) {
        where.userId = userId;
      }

      // If query is numeric, search by amount range
      if (!isNaN(numericQuery)) {
        const searchAmount = numericQuery;
        const range = searchAmount * 0.1; // 10% range
        
        where.amount = {
          gte: searchAmount - range,
          lte: searchAmount + range,
        };
      }

      return await this.findWithPagination(where, {
        page,
        limit,
        orderBy: { createdAt: 'desc' },
      });
    } catch (error) {
      logger.error('Error searching simulations:', error);
      throw error;
    }
  }

  /**
   * Get popular simulations (most common amounts/rates)
   * @param {number} limit - Number of popular simulations
   * @returns {Array} Popular simulations
   */
  async getPopularSimulations(limit = 10) {
    try {
      // This would typically involve complex aggregation
      // For now, return recent simulations as a proxy for popularity
      return await this.getRecentSimulations(limit);
    } catch (error) {
      logger.error('Error getting popular simulations:', error);
      throw error;
    }
  }

  /**
   * Get simulation trends over time
   * @param {string} userId - User ID (optional)
   * @param {number} days - Number of days to analyze
   * @returns {Object} Trend data
   */
  async getSimulationTrends(userId = null, days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where = {
        createdAt: {
          gte: startDate,
        },
      };

      if (userId) {
        where.userId = userId;
      }

      const simulations = await this.findMany(where, {
        orderBy: { createdAt: 'asc' },
      });

      // Group by day and calculate trends
      const trends = {};
      
      simulations.forEach(sim => {
        const day = sim.createdAt.toISOString().split('T')[0];
        
        if (!trends[day]) {
          trends[day] = {
            date: day,
            count: 0,
            totalAmount: 0,
            averageEMI: 0,
            averageRate: 0,
          };
        }
        
        trends[day].count++;
        trends[day].totalAmount += sim.amount;
        trends[day].averageEMI += sim.emi;
        trends[day].averageRate += sim.rate;
      });

      // Calculate averages
      Object.values(trends).forEach(trend => {
        if (trend.count > 0) {
          trend.averageEMI = trend.averageEMI / trend.count;
          trend.averageRate = trend.averageRate / trend.count;
        }
      });

      return {
        trends: Object.values(trends),
        period: `${days} days`,
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting simulation trends:', error);
      throw error;
    }
  }

  /**
   * Update simulation
   * @param {string} id - Simulation ID
   * @param {Object} updateData - Data to update
   * @returns {Object} Updated simulation
   */
  async updateSimulation(id, updateData) {
    try {
      return await this.update(id, updateData);
    } catch (error) {
      logger.error('Error updating loan simulation:', error);
      throw error;
    }
  }

  /**
   * Get simulation analytics
   * @param {string} userId - User ID (optional)
   * @returns {Object} Analytics data
   */
  async getSimulationAnalytics(userId = null) {
    try {
      const where = userId ? { userId } : {};
      
      const [
        stats,
        amountDistribution,
        rateDistribution,
        tenureDistribution,
      ] = await Promise.all([
        this.getSimulationStats(userId),
        // Amount distribution (group by ranges)
        this.getAmountDistribution(where),
        // Rate distribution (group by ranges)
        this.getRateDistribution(where),
        // Tenure distribution
        this.getTenureDistribution(where),
      ]);

      return {
        stats,
        distributions: {
          amount: amountDistribution,
          rate: rateDistribution,
          tenure: tenureDistribution,
        },
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting simulation analytics:', error);
      throw error;
    }
  }

  /**
   * Get amount distribution
   * @param {Object} where - Query conditions
   * @returns {Array} Amount distribution data
   */
  async getAmountDistribution(where = {}) {
    try {
      const simulations = await this.findMany(where);
      
      const ranges = [
        { min: 0, max: 100000, label: '0-1L' },
        { min: 100000, max: 500000, label: '1L-5L' },
        { min: 500000, max: 1000000, label: '5L-10L' },
        { min: 1000000, max: 5000000, label: '10L-50L' },
        { min: 5000000, max: Infinity, label: '50L+' },
      ];

      return ranges.map(range => ({
        range: range.label,
        count: simulations.filter(s => s.amount >= range.min && s.amount < range.max).length,
      }));
    } catch (error) {
      logger.error('Error getting amount distribution:', error);
      throw error;
    }
  }

  /**
   * Get rate distribution
   * @param {Object} where - Query conditions
   * @returns {Array} Rate distribution data
   */
  async getRateDistribution(where = {}) {
    try {
      const simulations = await this.findMany(where);
      
      const ranges = [
        { min: 0, max: 8, label: '0-8%' },
        { min: 8, max: 12, label: '8-12%' },
        { min: 12, max: 16, label: '12-16%' },
        { min: 16, max: 20, label: '16-20%' },
        { min: 20, max: Infinity, label: '20%+' },
      ];

      return ranges.map(range => ({
        range: range.label,
        count: simulations.filter(s => s.rate >= range.min && s.rate < range.max).length,
      }));
    } catch (error) {
      logger.error('Error getting rate distribution:', error);
      throw error;
    }
  }

  /**
   * Get tenure distribution
   * @param {Object} where - Query conditions
   * @returns {Array} Tenure distribution data
   */
  async getTenureDistribution(where = {}) {
    try {
      const simulations = await this.findMany(where);
      
      const ranges = [
        { min: 0, max: 5, label: '0-5 years' },
        { min: 5, max: 10, label: '5-10 years' },
        { min: 10, max: 15, label: '10-15 years' },
        { min: 15, max: 20, label: '15-20 years' },
        { min: 20, max: Infinity, label: '20+ years' },
      ];

      return ranges.map(range => ({
        range: range.label,
        count: simulations.filter(s => s.tenure >= range.min && s.tenure < range.max).length,
      }));
    } catch (error) {
      logger.error('Error getting tenure distribution:', error);
      throw error;
    }
  }
}
