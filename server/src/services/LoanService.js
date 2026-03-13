import { BaseService } from './BaseService';
import { LoanRepository } from '../repositories/LoanRepository';
import { calculateLoanEMI, validateLoanParameters, LOAN_CONSTANTS } from '../utils/loanCalculator';
import { logger } from '../utils/logger';

export class LoanService extends BaseService {
  constructor() {
    super(new LoanRepository());
    this.loanRepository = new LoanRepository();
  }

  /**
   * Simulate loan EMI calculation
   * @param {Object} simulationData - Loan simulation parameters
   * @param {number} simulationData.loanAmount - Principal loan amount
   * @param {number} simulationData.interestRate - Annual interest rate
   * @param {number} simulationData.tenureYears - Loan tenure in years
   * @param {string} simulationData.userId - User ID (optional for MVP)
   * @returns {Object} Simulation result with EMI details
   */
  async simulateLoan(simulationData) {
    try {
      const startTime = Date.now();
      
      // Extract and validate inputs
      const { loanAmount, interestRate, tenureYears, userId } = simulationData;

      // Enhanced input validation
      this.validateSimulationInputs({
        loanAmount,
        interestRate,
        tenureYears,
      });

      // Additional business logic validation
      const validation = validateLoanParameters({
        loanAmount,
        interestRate,
        tenureYears,
      });

      // Calculate EMI using the loan calculator
      const calculation = calculateLoanEMI({
        loanAmount,
        interestRate,
        tenureYears,
      });

      // Prepare simulation data for storage
      const simulationRecord = {
        userId: userId || null, // Optional for MVP
        amount: calculation.principal,
        rate: calculation.annualRate,
        tenure: calculation.tenureYears,
        emi: calculation.emi,
        totalInterest: calculation.totalInterest,
        totalPayment: calculation.totalPayment,
        // Additional metadata
        monthlyRate: calculation.monthlyRate,
        totalMonths: calculation.totalMonths,
        processingTime: Date.now() - startTime,
        validationWarnings: validation.warnings,
      };

      // Store simulation in database
      const storedSimulation = await this.repository.create(simulationRecord);

      // Log successful simulation
      logger.info('Loan simulation completed', {
        simulationId: storedSimulation.id,
        userId,
        amount: calculation.principal,
        emi: calculation.emi,
        processingTime: simulationRecord.processingTime,
      });

      // Return clean response
      return {
        id: storedSimulation.id,
        emi: calculation.emi,
        totalInterest: calculation.totalInterest,
        totalPayment: calculation.totalPayment,
        processingTime: simulationRecord.processingTime,
        warnings: validation.warnings,
        calculatedAt: new Date().toISOString(),
      };

    } catch (error) {
      logger.error('Loan simulation failed', {
        error: error.message,
        simulationData,
      });
      throw this.handleError(error, { action: 'simulateLoan' });
    }
  }

  /**
   * Get simulation by ID
   * @param {string} id - Simulation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Simulation details
   */
  async getSimulation(id, userId = null) {
    try {
      const simulation = await this.repository.findById(id);
      
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      // Authorization check - users can only access their own simulations
      if (userId && simulation.userId !== userId) {
        throw new Error('Access denied: You can only access your own simulations');
      }

      return this.transformSimulationData(simulation);
    } catch (error) {
      logger.error('Get simulation failed', { id, userId, error: error.message });
      throw this.handleError(error, { action: 'getSimulation' });
    }
  }

  /**
   * Get user's simulation history
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

      const where = userId ? { userId } : {};
      const orderBy = { [sortBy]: sortOrder };

      return await this.repository.findWithPagination(where, {
        page,
        limit,
        orderBy,
      });
    } catch (error) {
      logger.error('Get user simulations failed', { userId, error: error.message });
      throw this.handleError(error, { action: 'getUserSimulations' });
    }
  }

  /**
   * Delete simulation
   * @param {string} id - Simulation ID
   * @param {string} userId - User ID (for authorization)
   * @returns {Object} Deletion result
   */
  async deleteSimulation(id, userId = null) {
    try {
      // First check if simulation exists and belongs to user
      const simulation = await this.repository.findById(id);
      
      if (!simulation) {
        throw new Error('Simulation not found');
      }

      // Authorization check
      if (userId && simulation.userId !== userId) {
        throw new Error('Access denied: You can only delete your own simulations');
      }

      await this.repository.delete(id);

      logger.info('Simulation deleted', {
        simulationId: id,
        userId,
      });

      return { success: true, message: 'Simulation deleted successfully' };
    } catch (error) {
      logger.error('Delete simulation failed', { id, userId, error: error.message });
      throw this.handleError(error, { action: 'deleteSimulation' });
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
        recentSimulations,
      ] = await Promise.all([
        this.repository.count(where),
        this.repository.aggregate({
          _sum: { amount: true },
          where,
        }),
        this.repository.aggregate({
          _avg: { emi: true },
          where,
        }),
        this.repository.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          take: 5,
        }),
      ]);

      return {
        totalSimulations,
        totalAmount: totalAmount._sum.amount || 0,
        averageEMI: averageEMI._avg.emi || 0,
        recentSimulations: recentSimulations.map(s => this.transformSimulationData(s)),
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Get simulation stats failed', { userId, error: error.message });
      throw this.handleError(error, { action: 'getSimulationStats' });
    }
  }

  /**
   * Compare multiple simulations
   * @param {Array} simulationIds - Array of simulation IDs
   * @param {string} userId - User ID (for authorization)
   * @returns {Array} Comparison results
   */
  async compareSimulations(simulationIds, userId = null) {
    try {
      if (!Array.isArray(simulationIds) || simulationIds.length === 0) {
        throw new Error('At least one simulation ID is required');
      }

      if (simulationIds.length > 5) {
        throw new Error('Maximum 5 simulations can be compared at once');
      }

      // Fetch all simulations
      const simulations = await Promise.all(
        simulationIds.map(id => this.getSimulation(id, userId))
      );

      // Sort by total payment (lowest first)
      simulations.sort((a, b) => a.totalPayment - b.totalPayment);

      // Add rankings
      return simulations.map((sim, index) => ({
        ...sim,
        rank: index + 1,
        isBestOption: index === 0,
      }));
    } catch (error) {
      logger.error('Compare simulations failed', { simulationIds, userId, error: error.message });
      throw this.handleError(error, { action: 'compareSimulations' });
    }
  }

  /**
   * Validate simulation inputs
   * @param {Object} inputs - Input parameters
   */
  validateSimulationInputs(inputs) {
    const { loanAmount, interestRate, tenureYears } = inputs;

    // Type validation
    if (typeof loanAmount !== 'number' || !Number.isFinite(loanAmount)) {
      throw new Error('Loan amount must be a valid number');
    }

    if (typeof interestRate !== 'number' || !Number.isFinite(interestRate)) {
      throw new Error('Interest rate must be a valid number');
    }

    if (typeof tenureYears !== 'number' || !Number.isFinite(tenureYears)) {
      throw new Error('Tenure must be a valid number');
    }

    // Range validation
    if (loanAmount < LOAN_CONSTANTS.MIN_AMOUNT) {
      throw new Error(`Loan amount must be at least NPR ${LOAN_CONSTANTS.MIN_AMOUNT.toLocaleString()}`);
    }

    if (loanAmount > LOAN_CONSTANTS.MAX_AMOUNT) {
      throw new Error(`Loan amount cannot exceed NPR ${LOAN_CONSTANTS.MAX_AMOUNT.toLocaleString()}`);
    }

    if (interestRate < LOAN_CONSTANTS.MIN_RATE) {
      throw new Error('Interest rate cannot be negative');
    }

    if (interestRate > LOAN_CONSTANTS.MAX_RATE) {
      throw new Error(`Interest rate cannot exceed ${LOAN_CONSTANTS.MAX_RATE}%`);
    }

    if (tenureYears < LOAN_CONSTANTS.MIN_TENURE) {
      throw new Error(`Tenure must be at least ${LOAN_CONSTANTS.MIN_TENURE} year`);
    }

    if (tenureYears > LOAN_CONSTANTS.MAX_TENURE) {
      throw new Error(`Tenure cannot exceed ${LOAN_CONSTANTS.MAX_TENURE} years`);
    }

    // Business logic validation
    if (loanAmount < 50000) {
      throw new Error('Loan amount is too small for practical use');
    }

    if (tenureYears > 25 && interestRate > 15) {
      throw new Error('High interest rate with very long tenure is not recommended');
    }

    return true;
  }

  /**
   * Transform simulation data for API response
   * @param {Object} simulation - Raw simulation data
   * @returns {Object} Transformed data
   */
  transformSimulationData(simulation) {
    return {
      id: simulation.id,
      amount: simulation.amount,
      rate: simulation.rate,
      tenure: simulation.tenure,
      emi: simulation.emi,
      totalInterest: simulation.totalInterest,
      totalPayment: simulation.totalPayment,
      createdAt: simulation.createdAt,
      updatedAt: simulation.updatedAt,
      // Additional calculated fields
      monthlyRate: (simulation.rate / 12 / 100).toFixed(4),
      totalMonths: simulation.tenure * 12,
      interestToPrincipalRatio: ((simulation.totalInterest / simulation.amount) * 100).toFixed(2),
    };
  }

  /**
   * Batch simulate multiple loans
   * @param {Array} simulations - Array of simulation parameters
   * @param {string} userId - User ID
   * @returns {Array} Batch simulation results
   */
  async batchSimulate(simulations, userId = null) {
    try {
      if (!Array.isArray(simulations) || simulations.length === 0) {
        throw new Error('At least one simulation is required');
      }

      if (simulations.length > 10) {
        throw new Error('Maximum 10 simulations can be processed at once');
      }

      const results = await Promise.allSettled(
        simulations.map((sim, index) => 
          this.simulateLoan({ ...sim, userId })
            .catch(error => ({
              error: error.message,
              index,
            }))
        )
      );

      const successful = results.filter(r => r.status === 'fulfilled').map(r => r.value);
      const failed = results.filter(r => r.status === 'rejected').map(r => r.reason);

      return {
        successful,
        failed,
        summary: {
          total: simulations.length,
          successful: successful.length,
          failed: failed.length,
        },
      };
    } catch (error) {
      logger.error('Batch simulation failed', { simulations, userId, error: error.message });
      throw this.handleError(error, { action: 'batchSimulate' });
    }
  }

  /**
   * Export simulations data
   * @param {string} userId - User ID
   * @param {string} format - Export format (json, csv)
   * @returns {Object} Export data
   */
  async exportSimulations(userId, format = 'json') {
    try {
      const simulations = await this.repository.findMany({ userId });
      
      const transformedData = simulations.map(sim => this.transformSimulationData(sim));

      if (format === 'csv') {
        return this.convertToCSV(transformedData);
      }

      return transformedData;
    } catch (error) {
      logger.error('Export simulations failed', { userId, format, error: error.message });
      throw this.handleError(error, { action: 'exportSimulations' });
    }
  }

  /**
   * Convert simulations data to CSV
   * @param {Array} data - Simulations data
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = [
      'ID', 'Amount', 'Rate', 'Tenure', 'EMI', 'Total Interest', 
      'Total Payment', 'Created At'
    ];

    const csvRows = data.map(sim => [
      sim.id,
      sim.amount,
      sim.rate,
      sim.tenure,
      sim.emi,
      sim.totalInterest,
      sim.totalPayment,
      sim.createdAt.toISOString(),
    ]);

    return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  }

  /**
   * Get user's loan simulation history
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Paginated loan history
   */
  async getLoanHistory(userId, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {},
      } = options;

      // Build query conditions
      const where = {
        userId,
        ...filters,
      };

      // Build order by clause
      const orderBy = {};
      orderBy[sortBy] = sortOrder;

      // Get paginated results
      const result = await this.repository.findWithPagination(where, {
        page,
        limit,
        orderBy,
        include: {
          select: {
            id: true,
            amount: true,
            rate: true,
            tenure: true,
            emi: true,
            totalInterest: true,
            totalPayment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      });

      // Transform data for API response
      const transformedData = result.data.map(simulation => 
        this.transformSimulationData(simulation)
      );

      // Add additional metadata
      const enrichedData = transformedData.map(simulation => ({
        ...simulation,
        monthlyRate: (simulation.rate / 12 / 100).toFixed(4),
        totalMonths: simulation.tenure * 12,
        interestToPrincipalRatio: ((simulation.totalInterest / simulation.amount) * 100).toFixed(2),
      }));

      return {
        data: enrichedData,
        pagination: result.pagination,
        summary: {
          currentPage: result.pagination.page,
          totalSimulations: result.pagination.total,
          averageLoanAmount: this.calculateAverage(result.data, 'amount'),
          averageEMI: this.calculateAverage(result.data, 'emi'),
          averageInterestRate: this.calculateAverage(result.data, 'rate'),
          averageTenure: this.calculateAverage(result.data, 'tenure'),
        },
      };
    } catch (error) {
      logger.error('Error getting loan history:', {
        userId,
        options,
        error: error.message,
      });
      throw this.handleError(error, { action: 'getLoanHistory' });
    }
  }

  /**
   * Get loan history with advanced filtering
   * @param {string} userId - User ID
   * @param {Object} filters - Advanced filters
   * @param {Object} options - Query options
   * @returns {Object} Filtered loan history
   */
  async getFilteredLoanHistory(userId, filters = {}, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // Build advanced filters
      const where = { userId };

      // Amount range filter
      if (filters.amountRange) {
        const { min, max } = filters.amountRange;
        where.amount = {};
        if (min !== undefined) where.amount.gte = min;
        if (max !== undefined) where.amount.lte = max;
      }

      // Interest rate range filter
      if (filters.rateRange) {
        const { min, max } = filters.rateRange;
        where.rate = {};
        if (min !== undefined) where.rate.gte = min;
        if (max !== undefined) where.rate.lte = max;
      }

      // Tenure range filter
      if (filters.tenureRange) {
        const { min, max } = filters.tenureRange;
        where.tenure = {};
        if (min !== undefined) where.tenure.gte = min;
        if (max !== undefined) where.tenure.lte = max;
      }

      // EMI range filter
      if (filters.emiRange) {
        const { min, max } = filters.emiRange;
        where.emi = {};
        if (min !== undefined) where.emi.gte = min;
        if (max !== undefined) where.emi.lte = max;
      }

      // Date range filter
      if (filters.dateRange) {
        const { startDate, endDate } = filters.dateRange;
        where.createdAt = {};
        if (startDate) where.createdAt.gte = startDate;
        if (endDate) where.createdAt.lte = endDate;
      }

      // Build order by clause
      const orderBy = {};
      orderBy[sortBy] = sortOrder;

      const result = await this.repository.findWithPagination(where, {
        page,
        limit,
        orderBy,
        include: {
          select: {
            id: true,
            amount: true,
            rate: true,
            tenure: true,
            emi: true,
            totalInterest: true,
            totalPayment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      });

      // Transform data
      const transformedData = result.data.map(simulation => 
        this.transformSimulationData(simulation)
      );

      return {
        data: transformedData,
        pagination: result.pagination,
        filters,
      };
    } catch (error) {
      logger.error('Error getting filtered loan history:', {
        userId,
        filters,
        options,
        error: error.message,
      });
      throw this.handleError(error, { action: 'getFilteredLoanHistory' });
    }
  }

  /**
   * Get loan history summary statistics
   * @param {string} userId - User ID
   * @param {Object} options - Query options
   * @returns {Object} Summary statistics
   */
  async getLoanHistorySummary(userId, options = {}) {
    try {
      const {
        period = 'all', // 'all', 'week', 'month', 'quarter', 'year'
      } = options;

      // Calculate date range based on period
      const dateRange = this.getDateRange(period);
      
      const where = { userId };
      if (dateRange.startDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
      }

      // Get statistics
      const [
        totalSimulations,
        totalAmount,
        averageEMI,
        averageRate,
        averageTenure,
        firstSimulation,
        lastSimulation,
      ] = await Promise.all([
        this.repository.count(where),
        this.repository.aggregate({
          _sum: { amount: true },
          where,
        }),
        this.repository.aggregate({
          _avg: { emi: true },
          where,
        }),
        this.repository.aggregate({
          _avg: { rate: true },
          where,
        }),
        this.repository.aggregate({
          _avg: { tenure: true },
          where,
        }),
        this.repository.findFirst({
          where,
          orderBy: { createdAt: 'asc' },
        }),
        this.repository.findFirst({
          where,
          orderBy: { createdAt: 'desc' },
        }),
      ]);

      return {
        summary: {
          totalSimulations,
          totalAmount: totalAmount._sum.amount || 0,
          averageEMI: averageEMI._avg.emi || 0,
          averageRate: averageRate._avg.rate || 0,
          averageTenure: averageTenure._avg.tenure || 0,
        },
        period,
        dateRange,
        firstSimulation: firstSimulation ? this.transformSimulationData(firstSimulation) : null,
        lastSimulation: lastSimulation ? this.transformSimulationData(lastSimulation) : null,
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting loan history summary:', {
        userId,
        options,
        error: error.message,
      });
      throw this.handleError(error, { action: 'getLoanHistorySummary' });
    }
  }

  /**
   * Get loan history trends over time
   * @param {string} userId - User ID
   * @param {Object} options - Trend options
   * @returns {Object} Trend data
   */
  async getLoanHistoryTrends(userId, options = {}) {
    try {
      const {
        period = 'month', // 'day', 'week', 'month', 'quarter', 'year'
      } = options;

      // Get date range for trend analysis
      const dateRange = this.getDateRange(period);
      
      const where = { userId };
      if (dateRange.startDate) {
        where.createdAt = {};
        if (dateRange.startDate) where.createdAt.gte = dateRange.startDate;
        if (dateRange.endDate) where.createdAt.lte = dateRange.endDate;
      }

      // Get all simulations in the period
      const simulations = await this.repository.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        include: {
          select: {
            id: true,
            amount: true,
            rate: true,
            tenure: true,
            emi: true,
            totalInterest: true,
            totalPayment: true,
            createdAt: true,
          },
        },
      });

      // Group by period and calculate trends
      const trends = this.groupSimulationsByPeriod(simulations, period);

      return {
        trends,
        period,
        dateRange,
        totalSimulations: simulations.length,
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting loan history trends:', {
        userId,
        options,
        error: error.message,
      });
      throw this.handleError(error, { action: 'getLoanHistoryTrends' });
    }
  }

  /**
   * Get loan history analytics
   * @param {string} userId - User ID
   * @returns {Object} Analytics data
   */
  async getLoanHistoryAnalytics(userId) {
    try {
      // Get all user simulations
      const simulations = await this.repository.findMany({
        where: { userId },
        include: {
          select: {
            id: true,
            amount: true,
            rate: true,
            tenure: true,
            emi: true,
            totalInterest: true,
            totalPayment: true,
            createdAt: true,
          },
        },
      });

      if (simulations.length === 0) {
        return {
          totalSimulations: 0,
          analytics: {
            amountDistribution: [],
            rateDistribution: [],
            tenureDistribution: [],
            emiDistribution: [],
            monthlyTrends: [],
          },
          calculatedAt: new Date().toISOString(),
        };
      }

      // Calculate distributions
      const analytics = {
        amountDistribution: this.calculateDistribution(simulations, 'amount'),
        rateDistribution: this.calculateDistribution(simulations, 'rate'),
        tenureDistribution: this.calculateDistribution(simulations, 'tenure'),
        emiDistribution: this.calculateDistribution(simulations, 'emi'),
        monthlyTrends: this.calculateMonthlyTrends(simulations),
      };

      return {
        totalSimulations: simulations.length,
        analytics,
        calculatedAt: new Date().toISOString(),
      };
    } catch (error) {
      logger.error('Error getting loan history analytics:', {
        userId,
        error: error.message,
      });
      throw this.handleError(error, { action: 'getLoanHistoryAnalytics' });
    }
  }

  /**
   * Search loan history
   * @param {string} userId - User ID
   * @param {string} query - Search query
   * @param {Object} options - Search options
   * @returns {Object} Search results
   */
  async searchLoanHistory(userId, query, options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc',
        filters = {},
      } = options;

      // Build search conditions
      const where = { userId };

      // Search by amount (numeric)
      const numericQuery = parseFloat(query);
      if (!isNaN(numericQuery)) {
        const searchAmount = numericQuery;
        const range = searchAmount * 0.2; // 20% range
        where.amount = {
          gte: Math.max(0, searchAmount - range),
          lte: searchAmount + range,
        };
      }

      // Search by rate (numeric)
      const rateQuery = parseFloat(query);
      if (!isNaN(rateQuery) && rateQuery <= 50) {
        const searchRate = rateQuery;
        const range = searchRate * 0.1; // 10% range
        where.rate = {
          gte: Math.max(0, searchRate - range),
          lte: searchRate + range,
        };
      }

      // Build order by clause
      const orderBy = {};
      orderBy[sortBy] = sortOrder;

      const result = await this.repository.findWithPagination(where, {
        page,
        limit,
        orderBy,
        include: {
          select: {
            id: true,
            amount: true,
            rate: true,
            tenure: true,
            emi: true,
            totalInterest: true,
            totalPayment: true,
            createdAt: true,
          },
        },
      });

      // Transform data
      const transformedData = result.data.map(simulation => 
        this.transformSimulationData(simulation)
      );

      return {
        data: transformedData,
        pagination: result.pagination,
        searchQuery: query,
        filters,
      };
    } catch (error) {
      logger.error('Error searching loan history:', {
        userId,
        query,
        options,
        error: error.message,
      });
      throw this.handleError(error, { action: 'searchLoanHistory' });
    }
  }

  /**
   * Export loan history
   * @param {string} userId - User ID
   * @param {string} format - Export format (json, csv, excel)
   * @param {Object} options - Export options
   * @returns {Object} Export data
   */
  async exportLoanHistory(userId, format = 'json', options = {}) {
    try {
      const {
        filters = {},
        sortBy = 'createdAt',
        sortOrder = 'desc',
      } = options;

      // Get all simulations
      const where = { userId, ...filters };
      
      const simulations = await this.repository.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        include: {
          select: {
            id: true,
            amount: true,
            rate: true,
            tenure: true,
            emi: true,
            totalInterest: true,
            totalPayment: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      });

      // Transform data for export
      const transformedData = simulations.map(simulation => 
        this.transformSimulationData(simulation)
      );

      if (format === 'csv') {
        return this.convertToCSV(transformedData);
      }

      if (format === 'excel') {
        return this.convertToExcel(transformedData);
      }

      return transformedData;
    } catch (error) {
      logger.error('Error exporting loan history:', {
        userId,
        format,
        options,
        error: error.message,
      });
      throw this.handleError(error, { action: 'exportLoanHistory' });
    }
  }

  /**
   * Transform simulation data for API response
   * @param {Object} simulation - Raw simulation data
   * @returns {Object} Transformed data
   */
  transformSimulationData(simulation) {
    return {
      id: simulation.id,
      amount: simulation.amount,
      rate: simulation.rate,
      tenure: simulation.tenure,
      emi: simulation.emi,
      totalInterest: simulation.totalInterest,
      totalPayment: simulation.totalPayment,
      createdAt: simulation.createdAt,
      updatedAt: simulation.updatedAt,
      // Additional calculated fields
      monthlyRate: (simulation.rate / 12 / 100).toFixed(4),
      totalMonths: simulation.tenure * 12,
      interestToPrincipalRatio: ((simulation.totalInterest / simulation.amount) * 100).toFixed(2),
      monthlyPayment: (simulation.totalPayment / (simulation.tenure * 12)).toFixed(2),
    };
  }

  /**
   * Calculate average for a field
   * @param {Array} data - Array of objects
   * @param {string} field - Field name
   * @returns {number} Average value
   */
  calculateAverage(data, field) {
    if (!data || data.length === 0) return 0;
    const sum = data.reduce((acc, item) => acc + (item[field] || 0), 0);
    return sum / data.length;
  }

  /**
   * Get date range based on period
   * @param {string} period - Period type
   * @returns {Object} Date range
   */
  getDateRange(period) {
    const now = new Date();
    let startDate, endDate;

    switch (period) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        endDate = new Date(now.getFullYear(), (quarter + 1) * 3, 0);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear() + 1, 0, 1);
        break;
      case 'all':
        // No date range for all time
        break;
      default:
        // Default to last 30 days
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        endDate = now;
    }

    return { startDate, endDate };
  }

  /**
   * Group simulations by period
   * @param {Array} simulations - Array of simulations
   * @param {string} period - Period type
   * @returns {Array} Grouped data
   */
  groupSimulationsByPeriod(simulations, period) {
    const trends = [];

    simulations.forEach(simulation => {
      const date = new Date(simulation.createdAt);
      let periodKey;

      switch (period) {
        case 'day':
          periodKey = date.toISOString().split('T')[0];
          break;
        case 'week':
          const weekStart = new Date(date.setDate(date.getDate() - date.getDay() + 1));
          periodKey = weekStart.toISOString().split('T')[0];
          break;
        case 'month':
          periodKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
          break;
        case 'quarter':
          const quarter = Math.floor(date.getMonth() / 3);
          periodKey = `${date.getFullYear()}-Q${quarter + 1}`;
          break;
        case 'year':
          periodKey = date.getFullYear().toString();
          break;
        default:
          periodKey = date.toISOString().split('T')[0];
      }

      let trend = trends.find(t => t.period === periodKey);
      
      if (!trend) {
        trend = {
          period: periodKey,
          count: 0,
          totalAmount: 0,
          averageEMI: 0,
          averageRate: 0,
          averageTenure: 0,
          simulations: [],
        };
        trends.push(trend);
      }

      trend.count++;
      trend.totalAmount += simulation.amount;
      trend.averageEMI += simulation.emi;
      trend.averageRate += simulation.rate;
      trend.averageTenure += simulation.tenure;
      trend.simulations.push(simulation);
    });

    // Calculate averages
    trends.forEach(trend => {
      if (trend.count > 0) {
        trend.averageEMI = trend.averageEMI / trend.count;
        trend.averageRate = trend.averageRate / trend.count;
        trend.averageTenure = trend.averageTenure / trend.count;
      }
    });

    return trends;
  }

  /**
   * Calculate distribution for a field
   * @param {Array} data - Array of objects
   * @param {string} field - Field name
   * @returns {Array} Distribution data
   */
  calculateDistribution(data, field) {
    const ranges = this.getFieldRanges(field);
    
    return ranges.map(range => ({
      range: range.label,
      min: range.min,
      max: range.max,
      count: data.filter(item => {
        const value = item[field];
        return value >= range.min && value < range.max;
      }).length,
      percentage: ((data.filter(item => {
        const value = item[field];
        return value >= range.min && value < range.max;
      }).length / data.length) * 100).toFixed(2),
    }));
  }

  /**
   * Get field ranges for distribution
   * @param {string} field - Field name
   * @returns {Array} Range definitions
   */
  getFieldRanges(field) {
    switch (field) {
      case 'amount':
        return [
          { label: '0-1L', min: 0, max: 100000 },
          { label: '1L-5L', min: 100000, max: 500000 },
          { label: '5L-10L', min: 500000, max: 1000000 },
          { label: '10L-25L', min: 1000000, max: 2500000 },
          { label: '25L-50L', min: 2500000, max: 5000000 },
          { label: '50L+', min: 5000000, max: Infinity },
        ];
      case 'rate':
        return [
          { label: '0-8%', min: 0, max: 8 },
          { label: '8-12%', min: 8, max: 12 },
          { label: '12-16%', min: 12, max: 16 },
          { label: '16-20%', min: 16, max: 20 },
          { label: '20-25%', min: 20, max: 25 },
          { label: '25%+', min: 25, max: 50 },
        ];
      case 'tenure':
        return [
          { label: '0-5 years', min: 0, max: 5 },
          { label: '5-10 years', min: 5, max: 10 },
          { label: '10-15 years', min: 10, max: 15 },
          { label: '15-20 years', min: 15, max: 20 },
          { label: '20-25 years', min: 20, max: 25 },
          { label: '25+ years', min: 25, max: 30 },
        ];
      case 'emi':
        return [
          { label: '0-5K', min: 0, max: 5000 },
          { label: '5K-10K', min: 5000, max: 10000 },
          { label: '10K-20K', min: 10000, max: 20000 },
          { label: '20K-30K', min: 20000, max: 30000 },
          { label: '30K-50K', min: 30000, max: 50000 },
          { label: '50K+', min: 50000, max: Infinity },
        ];
      default:
        return [];
    }
  }

  /**
   * Calculate monthly trends
   * @param {Array} simulations - Array of simulations
   * @returns {Array} Monthly trend data
   */
  calculateMonthlyTrends(simulations) {
    const monthlyData = {};

    simulations.forEach(simulation => {
      const date = new Date(simulation.createdAt);
      const monthKey = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;
      
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = {
          month: monthKey,
          count: 0,
          totalAmount: 0,
          averageEMI: 0,
          averageRate: 0,
          averageTenure: 0,
        };
      }

      const month = monthlyData[monthKey];
      month.count++;
      month.totalAmount += simulation.amount;
      month.averageEMI += simulation.emi;
      month.averageRate += simulation.rate;
      month.averageTenure += simulation.tenure;
    });

    // Calculate averages
    Object.values(monthlyData).forEach(month => {
      if (month.count > 0) {
        month.averageEMI = month.averageEMI / month.count;
        month.averageRate = month.averageRate / month.count;
        month.averageTenure = month.averageTenure / month.count;
      }
    });

    return Object.values(monthlyData).sort((a, b) => a.month.localeCompare(b.month));
  }

  /**
   * Convert data to CSV format
   * @param {Array} data - Data to convert
   * @returns {string} CSV string
   */
  convertToCSV(data) {
    if (!data || data.length === 0) {
      return '';
    }

    const headers = [
      'ID', 'Amount', 'Rate', 'Tenure', 'EMI', 
      'Total Interest', 'Total Payment', 'Created At', 'Updated At'
    ];

    const csvRows = data.map(sim => [
      sim.id,
      sim.amount.toString(),
      sim.rate.toString(),
      sim.tenure.toString(),
      sim.emi.toString(),
      sim.totalInterest.toString(),
      sim.totalPayment.toString(),
      sim.createdAt.toISOString(),
      sim.updatedAt.toISOString(),
    ]);

    return [headers.join(','), ...csvRows.map(row => row.join(','))].join('\n');
  }

  /**
   * Convert data to Excel format (simplified)
   * @param {Array} data - Data to convert
   * @returns {Object} Excel-like structure
   */
  convertToExcel(data) {
    if (!data || data.length === 0) {
      return { worksheets: [{ name: 'Loan History', data: [] }] };
    }

    const worksheetData = data.map(sim => ({
      'ID': sim.id,
      'Amount (NPR)': sim.amount,
      'Rate (%)': sim.rate,
      'Tenure (Years)': sim.tenure,
      'EMI (NPR)': sim.emi,
      'Total Interest (NPR)': sim.totalInterest,
      'Total Payment (NPR)': sim.totalPayment,
      'Created Date': sim.createdAt.toISOString(),
      'Updated Date': sim.updatedAt.toISOString(),
    }));

    return {
      worksheets: [{
        name: 'Loan History',
        data: worksheetData,
      }],
    };
  }
}
