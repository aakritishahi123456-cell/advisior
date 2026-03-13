import {
  Transaction,
  Budget,
  Debt,
  Investment,
  InvestmentGoal,
  PersonalFinanceReport,
  FinanceSummary,
  BudgetAnalysis,
  DebtAnalysis,
  InvestmentPlan,
  WealthPlan,
  FinancialAlert,
  RiskProfile,
  PersonalFinanceProfile,
} from './personalFinanceTypes';
import { budgetAnalysisService } from './budgetAnalysisService';
import { debtManagementService } from './debtManagementService';
import { investmentPlanningService } from './investmentPlanningService';

export interface PersonalFinanceInput {
  userId: string;
  transactions: Transaction[];
  budgets: Budget[];
  debts: Debt[];
  investments: Investment[];
  goals: InvestmentGoal[];
  monthlyIncome: number;
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  currentAge: number;
  retirementAge: number;
}

export class PersonalFinanceOrchestrator {
  async generateFullReport(input: PersonalFinanceInput, period: string): Promise<PersonalFinanceReport> {
    const summary = await this.generateSummary(input);
    const budget = await budgetAnalysisService.analyzeBudget(
      input.userId,
      input.transactions,
      input.budgets,
      period
    );
    const debts = await debtManagementService.analyzeDebts(input.userId, input.debts);
    const investments = await investmentPlanningService.createInvestmentPlan(
      input.userId,
      input.investments,
      input.goals,
      input.riskTolerance
    );
    const wealth = this.generateWealthPlan(input);
    const alerts = this.generateAlerts(budget, debts, investments, input);
    const recommendations = this.generateAllRecommendations(budget, debts, investments);

    return {
      id: `pfr_${Date.now()}`,
      userId: input.userId,
      generatedAt: new Date(),
      period,
      summary,
      budget,
      investments,
      debts,
      wealth,
      alerts,
      recommendations,
    };
  }

  private async generateSummary(input: PersonalFinanceInput): Promise<FinanceSummary> {
    const incomeTransactions = input.transactions.filter(t => t.isIncome);
    const expenseTransactions = input.transactions.filter(t => !t.isIncome);

    const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
    const totalExpenses = expenseTransactions.reduce((sum, t) => sum + t.amount, 0);
    const netSavings = totalIncome - totalExpenses;

    const totalInvestmentValue = input.investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalInvestmentCost = input.investments.reduce((sum, i) => sum + (i.purchasePrice * i.quantity), 0);
    const investmentGrowth = totalInvestmentValue - totalInvestmentCost;

    const totalDebt = input.debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const debtReduction = input.debts.reduce((sum, d) => sum + (d.principal - d.currentBalance), 0);

    const totalAssets = totalInvestmentValue + input.debts.reduce((sum, d) => sum + d.principal, 0);
    const netWorth = totalAssets - totalDebt;

    return {
      totalIncome,
      totalExpenses,
      netSavings,
      investmentGrowth,
      debtReduction: debtReduction > 0 ? debtReduction : 0,
      netWorthChange: netWorth,
    };
  }

  private generateWealthPlan(input: PersonalFinanceInput): WealthPlan {
    const totalAssets = input.investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalLiabilities = input.debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const netWorth = totalAssets - totalLiabilities;

    const assets = [
      { category: 'Investments', value: totalAssets, return: 10, liquidity: 'high' as const },
      { category: 'Cash', value: input.monthlyIncome * 3, return: 4, liquidity: 'high' as const },
    ];

    const liabilities = input.debts.map(d => ({
      category: d.type,
      value: d.currentBalance,
      interestRate: d.interestRate,
    }));

    const milestones = this.generateMilestones(input.currentAge, input.retirementAge, netWorth);
    const strategies = this.generateWealthStrategies(input);
    const projections = this.generateNetWorthProjections(netWorth, input);

    return {
      userId: input.userId,
      netWorth,
      assets,
      liabilities,
      timeline: {
        currentAge: input.currentAge,
        retirementAge: input.retirementAge,
        lifeExpectancy: 80,
      },
      milestones,
      strategies,
      projections,
    };
  }

  private generateMilestones(currentAge: number, retirementAge: number, currentNetWorth: number): any[] {
    return [
      {
        name: 'Emergency Fund',
        targetAge: currentAge + 1,
        targetAmount: 6 * 50000,
        achieved: currentNetWorth > 300000,
      },
      {
        name: 'Retirement Fund',
        targetAge: retirementAge,
        targetAmount: 50000000,
        achieved: false,
      },
      {
        name: 'Financial Independence',
        targetAge: retirementAge - 5,
        targetAmount: 40000000,
        achieved: false,
      },
    ];
  }

  private generateWealthStrategies(input: PersonalFinanceInput): any[] {
    const strategies = [];

    const savingsRate = (input.monthlyIncome - input.transactions.filter(t => !t.isIncome).reduce((s, t) => s + t.amount, 0)) / input.monthlyIncome;

    if (savingsRate < 0.2) {
      strategies.push({
        name: 'Increase Savings Rate',
        description: 'Target 20% savings rate to accelerate wealth building',
        timeline: '6 months',
        expectedImpact: 15,
        actions: ['Track expenses', 'Automate savings', 'Reduce discretionary spending'],
      });
    }

    if (input.debts.length > 0) {
      strategies.push({
        name: 'Debt Payoff Strategy',
        description: 'Use avalanche method to pay off high-interest debt',
        timeline: '2-5 years',
        expectedImpact: 10,
        actions: ['Focus on high-interest debt', 'Make extra payments', 'Consider refinancing'],
      });
    }

    strategies.push({
      name: 'Investment Growth',
      description: 'Maximize tax-advantaged accounts and diversified portfolio',
      timeline: 'Long-term',
      expectedImpact: 8,
      actions: ['Maximize EPF contribution', 'Invest in index funds', 'Rebalance annually'],
    });

    return strategies;
  }

  private generateNetWorthProjections(currentNetWorth: number, input: PersonalFinanceInput): any[] {
    const projections = [];
    const yearsToRetirement = input.retirementAge - input.currentAge;
    const annualReturn = 0.1;
    const annualSavings = input.monthlyIncome * 12 * 0.2;

    for (let year = 0; year <= yearsToRetirement; year++) {
      const value = currentNetWorth * Math.pow(1 + annualReturn, year) + 
                    annualSavings * ((Math.pow(1 + annualReturn, year) - 1) / annualReturn);
      
      projections.push({
        year: new Date().getFullYear() + year,
        assets: Math.round(value * 1.2),
        liabilities: Math.round(value * 0.1),
        netWorth: Math.round(value),
      });
    }

    return projections;
  }

  private generateAlerts(
    budget: BudgetAnalysis,
    debts: DebtAnalysis,
    investments: InvestmentPlan,
    input: PersonalFinanceInput
  ): FinancialAlert[] {
    const alerts: FinancialAlert[] = [];

    if (budget.savingsRate < 10) {
      alerts.push({
        id: `alert_${Date.now()}_1`,
        userId: input.userId,
        type: 'budget',
        severity: budget.savingsRate < 5 ? 'critical' : 'warning',
        title: 'Low Savings Rate',
        message: `Your savings rate is ${budget.savingsRate.toFixed(1)}%. Aim for at least 20%.`,
        action: 'Review budget',
        createdAt: new Date(),
        read: false,
      });
    }

    const highInterestDebt = debts.debts.filter(d => d.interestRate > 15);
    if (highInterestDebt.length > 0) {
      alerts.push({
        id: `alert_${Date.now()}_2`,
        userId: input.userId,
        type: 'debt',
        severity: 'warning',
        title: 'High Interest Debt',
        message: `${highInterestDebt[0].name} has ${highInterestDebt[0].interestRate}% interest rate`,
        action: 'Consider refinancing',
        createdAt: new Date(),
        read: false,
      });
    }

    const offTrackGoals = investments.projections.filter(p => !p.onTrack);
    if (offTrackGoals.length > 0) {
      alerts.push({
        id: `alert_${Date.now()}_3`,
        userId: input.userId,
        type: 'investment',
        severity: 'warning',
        title: 'Investment Goals Off Track',
        message: `${offTrackGoals.length} goal(s) may not be achieved on current trajectory`,
        action: 'Adjust contributions',
        createdAt: new Date(),
        read: false,
      });
    }

    return alerts;
  }

  private generateAllRecommendations(
    budget: BudgetAnalysis,
    debts: DebtAnalysis,
    investments: InvestmentPlan
  ): string[] {
    const recommendations: string[] = [];

    recommendations.push(...budget.recommendations);
    recommendations.push(...debts.recommendations.map(r => r.rationale));
    recommendations.push(...investments.recommendations.map(r => r.rationale));

    return [...new Set(recommendations)];
  }

  async getProfile(input: PersonalFinanceInput): Promise<PersonalFinanceProfile> {
    const totalAssets = input.investments.reduce((sum, i) => sum + i.currentValue, 0);
    const totalDebts = input.debts.reduce((sum, d) => sum + d.currentBalance, 0);
    const netWorth = totalAssets - totalDebts;

    return {
      userId: input.userId,
      monthlyIncome: input.monthlyIncome,
      monthlyExpenses: input.transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0),
      savings: input.monthlyIncome - input.transactions.filter(t => !t.isIncome).reduce((sum, t) => sum + t.amount, 0),
      investments: totalAssets,
      debts: totalDebts,
      netWorth,
      financialGoals: input.goals.map(g => ({
        id: g.id,
        name: g.name,
        targetAmount: g.targetAmount,
        currentAmount: g.currentAmount,
        targetDate: g.targetDate,
        priority: g.priority,
      })),
      riskTolerance: input.riskTolerance,
      lastUpdated: new Date(),
    };
  }
}

export const personalFinanceOrchestrator = new PersonalFinanceOrchestrator();
