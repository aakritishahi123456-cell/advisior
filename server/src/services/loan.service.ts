import { Loan, LoanStatus, LoanType } from '@prisma/client';
import { LoanRepository } from '../repositories/loan.repository';
import { createError } from '../middleware/errorHandler';
import logger from '../utils/logger';
import prisma from '../lib/prisma';
import { normalizeLoanType } from './loanProducts.service';

export interface CreateLoanData {
  principal: number;
  interestRate: number;
  tenure: number;
  type: LoanType;
}

export interface LoanSimulationData {
  principal: number;
  interestRate: number;
  tenure: number;
}

export interface AmortizationSchedule {
  month: number;
  principal: number;
  interest: number;
  emi: number;
  balance: number;
}

export interface LoanSimulationResult {
  emi: number;
  totalInterest: number;
  totalPayment: number;
  principal: number;
  interestRate: number;
  tenure: number;
  schedule: AmortizationSchedule[];
}

export type LoanRecommendationRanking = 'lowest_total_cost' | 'lowest_emi';

export interface LoanMarketplaceSimulationInput {
  loanAmount: number;
  tenure: number;
  loanType?: string;
  ranking?: LoanRecommendationRanking;
  limit?: number;
}

export interface LoanRecommendationItem {
  bankName: string;
  interestRate: number;
  tenure: number;
  processingFee: number;
  emi: number;
  totalInterest: number;
  totalCost: number;
  rankingScore: number;
  sourceUrl: string | null;
  lastUpdated: string;
}

export interface LoanMarketplaceSimulationResult {
  loanAmount: number;
  tenure: number;
  ranking: LoanRecommendationRanking;
  bestLoanSuggestions: LoanRecommendationItem[];
  summary: {
    bestByTotalCost: LoanRecommendationItem | null;
    bestByEMI: LoanRecommendationItem | null;
  };
  savedSimulationId: string | null;
}

export interface LoanStatistics {
  totalLoans: number;
  totalAmount: number;
  averageInterestRate: number;
  loansByStatus: Record<LoanStatus, number>;
  loansByType: Record<LoanType, number>;
}

export class LoanService {
  static async createLoan(userId: string, loanData: CreateLoanData): Promise<Loan> {
    try {
      logger.info({ userId, action: 'create_loan', data: loanData });

      // Calculate EMI and total payment
      const simulation = await this.calculateEMI(
        loanData.principal,
        loanData.interestRate,
        loanData.tenure
      );

      const loan = await LoanRepository.create({
        userId,
        principal: loanData.principal,
        interestRate: loanData.interestRate,
        tenure: loanData.tenure,
        emi: simulation.emi,
        totalPayment: simulation.totalPayment,
        type: loanData.type,
        status: LoanStatus.PENDING
      });

      logger.info({ loanId: loan.id, action: 'loan_created' });
      return loan;
    } catch (error) {
      logger.error({ error, action: 'create_loan_failed' });
      throw createError('Failed to create loan application', 500);
    }
  }

  static async getUserLoans(
    userId: string,
    page: number = 1,
    limit: number = 10,
    status?: string
  ): Promise<{ loans: Loan[]; pagination: any }> {
    try {
      const where: any = { userId };
      if (status && Object.values(LoanStatus).includes(status as LoanStatus)) {
        where.status = status;
      }

      const [loans, total] = await Promise.all([
        LoanRepository.findMany(where, page, limit),
        LoanRepository.count(where)
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info({ userId, page, limit, total, action: 'get_user_loans' });
      
      return {
        loans,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error({ error, action: 'get_user_loans_failed' });
      throw createError('Failed to retrieve user loans', 500);
    }
  }

  static async getLoanById(loanId: string, userId: string): Promise<Loan> {
    try {
      const loan = await LoanRepository.findById(loanId, userId);
      
      if (!loan) {
        throw createError('Loan not found', 404);
      }

      logger.info({ loanId, userId, action: 'get_loan_by_id' });
      return loan;
    } catch (error) {
      logger.error({ error, loanId, userId, action: 'get_loan_by_id_failed' });
      throw error;
    }
  }

  static async updateLoan(loanId: string, userId: string, updateData: Partial<CreateLoanData>): Promise<Loan> {
    try {
      // Only allow updates if loan is still pending
      const existingLoan = await LoanRepository.findById(loanId, userId);
      
      if (!existingLoan) {
        throw createError('Loan not found', 404);
      }

      if (existingLoan.status !== LoanStatus.PENDING) {
        throw createError('Cannot update loan that is already processed', 400);
      }

      // Recalculate EMI if principal, rate, or tenure changed
      let emi = existingLoan.emi;
      let totalPayment = existingLoan.totalPayment;

      if (updateData.principal || updateData.interestRate || updateData.tenure) {
        const principal = updateData.principal ?? existingLoan.principal;
        const interestRate = updateData.interestRate ?? existingLoan.interestRate;
        const tenure = updateData.tenure ?? existingLoan.tenure;

        const simulation = await this.calculateEMI(principal, interestRate, tenure);
        emi = simulation.emi;
        totalPayment = simulation.totalPayment;
      }

      const loan = await LoanRepository.update(loanId, userId, {
        ...updateData,
        emi,
        totalPayment
      });

      logger.info({ loanId, userId, updateData, action: 'loan_updated' });
      return loan;
    } catch (error) {
      logger.error({ error, loanId, userId, updateData, action: 'update_loan_failed' });
      throw createError('Failed to update loan', 500);
    }
  }

  static async deleteLoan(loanId: string, userId: string): Promise<void> {
    try {
      const loan = await LoanRepository.findById(loanId, userId);
      
      if (!loan) {
        throw createError('Loan not found', 404);
      }

      if (loan.status !== LoanStatus.PENDING) {
        throw createError('Cannot delete loan that is already processed', 400);
      }

      await LoanRepository.delete(loanId, userId);
      logger.info({ loanId, userId, action: 'loan_deleted' });
    } catch (error) {
      logger.error({ error, loanId, userId, action: 'delete_loan_failed' });
      throw createError('Failed to delete loan', 500);
    }
  }

  static async simulateLoan(simulationData: LoanSimulationData): Promise<LoanSimulationResult> {
    try {
      // Validate inputs
      this.validateLoanInputs(simulationData.principal, simulationData.interestRate, simulationData.tenure);

      const startTime = performance.now();
      
      const result = await this.calculateEMI(
        simulationData.principal,
        simulationData.interestRate,
        simulationData.tenure
      );

      const endTime = performance.now();
      const executionTime = endTime - startTime;

      logger.info({ 
        simulationData, 
        result, 
        executionTime: `${executionTime.toFixed(2)}ms`,
        action: 'loan_simulation' 
      });
      
      return result;
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode) {
        throw error;
      }
      logger.error({ error, simulationData, action: 'loan_simulation_failed' });
      throw createError('Failed to simulate loan', 500);
    }
  }

  static async simulateMarketplaceLoan(
    input: LoanMarketplaceSimulationInput,
    userId?: string
  ): Promise<LoanMarketplaceSimulationResult> {
    const normalized = this.normalizeMarketplaceInput(input);

    try {
      const products = await prisma.loanProduct.findMany({
        where: {
          loanType: {
            equals: normalized.loanType,
            mode: 'insensitive',
          },
          OR: [
            { maxLoanAmount: null },
            { maxLoanAmount: { gte: normalized.loanAmount } },
          ],
          AND: [
            {
              OR: [
                { loanTerm: null },
                { loanTerm: { gte: normalized.tenure } },
              ],
            },
          ],
        },
        orderBy: [
          { interestRate: 'asc' },
          { processingFee: 'asc' },
          { bankName: 'asc' },
        ],
        take: Math.max(normalized.limit * 3, normalized.limit),
      });

      const recommendations = products
        .map((product) => {
          const simulation = this.calculateEMIQuickBreakdown(
            normalized.loanAmount,
            product.interestRate,
            normalized.tenure
          );
          const processingFee = Number(product.processingFee ?? 0);
          const totalCost = Number((simulation.totalPayment + processingFee).toFixed(2));

          return {
            bankName: product.bankName,
            interestRate: Number(product.interestRate),
            tenure: normalized.tenure,
            processingFee,
            emi: simulation.emi,
            totalInterest: simulation.totalInterest,
            totalCost,
            rankingScore:
              normalized.ranking === 'lowest_emi' ? simulation.emi : totalCost,
            sourceUrl: product.sourceUrl,
            lastUpdated: product.lastUpdated.toISOString(),
          } satisfies LoanRecommendationItem;
        })
        .sort((left, right) => {
          if (normalized.ranking === 'lowest_emi') {
            return left.emi - right.emi || left.totalCost - right.totalCost || left.bankName.localeCompare(right.bankName);
          }

          return left.totalCost - right.totalCost || left.emi - right.emi || left.bankName.localeCompare(right.bankName);
        })
        .slice(0, normalized.limit);

      if (recommendations.length === 0) {
        throw this.marketplaceError('No matching loan products found for the selected amount and tenure', 404);
      }

      const savedSimulationId = userId
        ? await this.saveLoanMarketplaceSimulation(
            userId,
            normalized.loanAmount,
            recommendations[0].interestRate,
            normalized.tenure
          )
        : null;

      return {
        loanAmount: normalized.loanAmount,
        tenure: normalized.tenure,
        ranking: normalized.ranking,
        bestLoanSuggestions: recommendations,
        summary: {
          bestByTotalCost: [...recommendations].sort((a, b) => a.totalCost - b.totalCost || a.emi - b.emi)[0] ?? null,
          bestByEMI: [...recommendations].sort((a, b) => a.emi - b.emi || a.totalCost - b.totalCost)[0] ?? null,
        },
        savedSimulationId,
      };
    } catch (error) {
      if ((error as { statusCode?: number })?.statusCode) {
        throw error;
      }

      logger.error({ error, input, userId, action: 'loan_marketplace_simulation_failed' });
      throw createError('Failed to simulate loan marketplace options', 500);
    }
  }

  static async getLoanRecommendations(
    input: LoanMarketplaceSimulationInput
  ): Promise<LoanRecommendationItem[]> {
    const result = await this.simulateMarketplaceLoan(input);
    return result.bestLoanSuggestions;
  }

  static async getLoanStatistics(userId: string): Promise<LoanStatistics> {
    try {
      const loans = await LoanRepository.findMany({ userId });

      const totalLoans = loans.length;
      const totalAmount = loans.reduce((sum, loan) => sum + loan.principal, 0);
      const averageInterestRate = totalLoans > 0 
        ? loans.reduce((sum, loan) => sum + loan.interestRate, 0) / totalLoans 
        : 0;

      const loansByStatus = loans.reduce((acc, loan) => {
        acc[loan.status] = (acc[loan.status] || 0) + 1;
        return acc;
      }, {} as Record<LoanStatus, number>);

      const loansByType = loans.reduce((acc, loan) => {
        acc[loan.type] = (acc[loan.type] || 0) + 1;
        return acc;
      }, {} as Record<LoanType, number>);

      const statistics: LoanStatistics = {
        totalLoans,
        totalAmount,
        averageInterestRate: Math.round(averageInterestRate * 100) / 100,
        loansByStatus,
        loansByType
      };

      logger.info({ userId, statistics, action: 'loan_statistics_retrieved' });
      return statistics;
    } catch (error) {
      logger.error({ error, userId, action: 'get_loan_statistics_failed' });
      throw createError('Failed to retrieve loan statistics', 500);
    }
  }

  static async saveSimulation(userId: string, simulationData: LoanSimulationData): Promise<Loan> {
    try {
      const result = await this.simulateLoan(simulationData);

      // Save as a loan simulation record
      const loan = await LoanRepository.create({
        userId,
        principal: simulationData.principal,
        interestRate: simulationData.interestRate,
        tenure: simulationData.tenure,
        emi: result.emi,
        totalPayment: result.totalPayment,
        type: LoanType.PERSONAL, // Default type for simulations
        status: LoanStatus.SIMULATED
      });

      logger.info({ userId, loanId: loan.id, action: 'loan_simulation_saved' });
      return loan;
    } catch (error) {
      logger.error({ error, userId, simulationData, action: 'save_simulation_failed' });
      throw createError('Failed to save loan simulation', 500);
    }
  }

  static async compareLoans(loans: LoanSimulationData[]): Promise<LoanSimulationResult[]> {
    try {
      const results = await Promise.all(
        loans.map(loan => this.simulateLoan(loan))
      );

      // Sort by total payment (ascending - cheapest first)
      results.sort((a, b) => a.totalPayment - b.totalPayment);

      logger.info({ 
        loanCount: loans.length, 
        action: 'loan_comparison' 
      });
      
      return results;
    } catch (error) {
      logger.error({ error, action: 'loan_comparison_failed' });
      throw createError('Failed to compare loans', 500);
    }
  }

  static async getSimulationHistory(userId: string, limit: number = 10): Promise<Loan[]> {
    try {
      const loans = await LoanRepository.findMany(
        { userId, status: LoanStatus.SIMULATED }, 
        1, 
        limit,
        { createdAt: 'desc' }
      );

      logger.info({ userId, limit, count: loans.length, action: 'simulation_history_retrieved' });
      return loans;
    } catch (error) {
      logger.error({ error, userId, action: 'simulation_history_failed' });
      throw createError('Failed to retrieve simulation history', 500);
    }
  }

  private static validateLoanInputs(principal: number, interestRate: number, tenure: number): void {
    if (principal <= 0) {
      throw createError('Principal amount must be greater than 0', 400);
    }
    
    if (principal > 100000000) { // 10 crore NPR limit
      throw createError('Principal amount is too large', 400);
    }

    if (interestRate < 0) {
      throw createError('Interest rate cannot be negative', 400);
    }
    
    if (interestRate > 50) {
      throw createError('Interest rate is too high', 400);
    }

    if (tenure <= 0) {
      throw createError('Tenure must be greater than 0', 400);
    }
    
    if (tenure > 360) { // 30 years max
      throw createError('Tenure is too long', 400);
    }
  }

  private static normalizeMarketplaceInput(input: LoanMarketplaceSimulationInput): Required<LoanMarketplaceSimulationInput> & { loanType: string } {
    const loanAmount = Number(input.loanAmount);
    const tenure = Number(input.tenure);
    const ranking = input.ranking ?? 'lowest_total_cost';
    const limit = input.limit ?? 5;

    if (!Number.isFinite(loanAmount) || loanAmount <= 0) {
      throw this.marketplaceError('Loan amount must be greater than 0', 400);
    }

    if (!Number.isFinite(tenure) || tenure <= 0) {
      throw this.marketplaceError('Tenure must be greater than 0', 400);
    }

    if (tenure > 600) {
      throw this.marketplaceError('Tenure is too long', 400);
    }

    if (limit <= 0 || limit > 20) {
      throw this.marketplaceError('Recommendation limit must be between 1 and 20', 400);
    }

    let loanType = 'HOME';
    try {
      loanType = normalizeLoanType(input.loanType ?? 'HOME');
    } catch {
      throw this.marketplaceError('Unsupported loan type', 400);
    }

    return {
      loanAmount,
      tenure,
      loanType,
      ranking,
      limit,
    };
  }

  private static async calculateEMI(principal: number, annualRate: number, tenureMonths: number): Promise<LoanSimulationResult> {
    // Handle edge case: zero interest rate
    if (annualRate === 0) {
      const emi = principal / tenureMonths;
      const totalPayment = principal;
      const totalInterest = 0;
      
      return {
        emi: Math.round(emi * 100) / 100,
        totalPayment: Math.round(totalPayment * 100) / 100,
        totalInterest: Math.round(totalInterest * 100) / 100,
        principal,
        interestRate: annualRate,
        tenure: tenureMonths,
        schedule: this.generateAmortizationSchedule(principal, 0, emi, tenureMonths)
      };
    }

    const monthlyRate = annualRate / 12 / 100;
    
    // EMI Formula: EMI = P × r × (1+r)^n / ((1+r)^n − 1)
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    
    const totalPayment = emi * tenureMonths;
    const totalInterest = totalPayment - principal;

    // Generate amortization schedule
    const schedule = this.generateAmortizationSchedule(principal, monthlyRate, emi, tenureMonths);

    return {
      emi: Math.round(emi * 100) / 100,
      totalPayment: Math.round(totalPayment * 100) / 100,
      totalInterest: Math.round(totalInterest * 100) / 100,
      principal,
      interestRate: annualRate,
      tenure: tenureMonths,
      schedule
    };
  }

  private static calculateEMIQuickBreakdown(principal: number, annualRate: number, tenureMonths: number) {
    if (annualRate === 0) {
      const emi = Number((principal / tenureMonths).toFixed(2));
      return {
        emi,
        totalPayment: Number(principal.toFixed(2)),
        totalInterest: 0,
      };
    }

    const monthlyRate = annualRate / 12 / 100;
    const emi =
      (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) /
      (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    const totalPayment = emi * tenureMonths;

    return {
      emi: Number(emi.toFixed(2)),
      totalPayment: Number(totalPayment.toFixed(2)),
      totalInterest: Number((totalPayment - principal).toFixed(2)),
    };
  }

  private static async saveLoanMarketplaceSimulation(
    userId: string,
    amount: number,
    rate: number,
    tenure: number
  ): Promise<string> {
    const simulation = this.calculateEMIQuickBreakdown(amount, rate, tenure);
    const saved = await prisma.loanSimulation.create({
      data: {
        userId,
        amount,
        rate,
        tenure,
        emi: simulation.emi,
        totalInterest: simulation.totalInterest,
        totalPayment: simulation.totalPayment,
      },
      select: {
        id: true,
      },
    });

    logger.info({
      userId,
      amount,
      rate,
      tenure,
      loanSimulationId: saved.id,
      action: 'loan_marketplace_simulation_saved',
    });

    return saved.id;
  }

  private static marketplaceError(message: string, statusCode: number) {
    const error = new Error(message) as Error & { statusCode: number; isOperational: boolean };
    error.statusCode = statusCode;
    error.isOperational = true;
    return error;
  }

  private static generateAmortizationSchedule(
    principal: number, 
    monthlyRate: number, 
    emi: number, 
    tenureMonths: number
  ): AmortizationSchedule[] {
    const schedule: AmortizationSchedule[] = [];
    let balance = principal;

    for (let month = 1; month <= tenureMonths; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = emi - interestPayment;
      balance -= principalPayment;

      // Handle floating point precision issues
      const finalBalance = Math.max(0, balance);

      schedule.push({
        month,
        principal: Math.round(principalPayment * 100) / 100,
        interest: Math.round(interestPayment * 100) / 100,
        emi: Math.round(emi * 100) / 100,
        balance: Math.round(finalBalance * 100) / 100
      });
    }

    return schedule;
  }

  // Utility method for quick EMI calculation (without schedule)
  static calculateEMIQuick(principal: number, annualRate: number, tenureMonths: number): number {
    if (annualRate === 0) {
      return principal / tenureMonths;
    }

    const monthlyRate = annualRate / 12 / 100;
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, tenureMonths)) / 
                (Math.pow(1 + monthlyRate, tenureMonths) - 1);
    
    return Math.round(emi * 100) / 100;
  }

  // Method to calculate affordability based on monthly income
  static calculateAffordability(monthlyIncome: number, existingEMIs: number = 0): {
    maxEMI: number;
    maxLoanAmount: number;
    recommendedTenure: number;
  } {
    // Rule of thumb: EMI should not exceed 40% of monthly income
    const maxEMI = monthlyIncome * 0.4 - existingEMIs;
    
    // Calculate maximum loan amount at 12% interest for 5 years
    const annualRate = 12;
    const tenureMonths = 60;
    const monthlyRate = annualRate / 12 / 100;
    
    // Rearranged EMI formula to calculate principal
    const maxLoanAmount = (maxEMI * (Math.pow(1 + monthlyRate, tenureMonths) - 1)) / 
                         (monthlyRate * Math.pow(1 + monthlyRate, tenureMonths));

    return {
      maxEMI: Math.round(maxEMI * 100) / 100,
      maxLoanAmount: Math.round(maxLoanAmount * 100) / 100,
      recommendedTenure: tenureMonths
    };
  }
}
