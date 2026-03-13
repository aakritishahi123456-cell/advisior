import {
  Debt,
  DebtAnalysis,
  DebtPayoffStrategy,
  DebtRecommendation,
  PayoffSchedule,
} from './personalFinanceTypes';

export class DebtManagementService {
  async analyzeDebts(userId: string, debts: Debt[]): Promise<DebtAnalysis> {
    const totalDebt = this.calculateTotalDebt(debts);
    const totalMonthlyPayment = this.calculateTotalPayment(debts);

    const avalanche = this.calculateAvalancheStrategy(debts);
    const snowball = this.calculateSnowballStrategy(debts);

    const strategies: DebtPayoffStrategy[] = [avalanche, snowball];
    const recommendations = this.generateRecommendations(debts, strategies);

    return {
      userId,
      totalDebt,
      totalMonthlyPayment,
      debts,
      strategies,
      recommendations,
    };
  }

  private calculateTotalDebt(debts: Debt[]): number {
    return debts.reduce((sum, d) => sum + d.currentBalance, 0);
  }

  private calculateTotalPayment(debts: Debt[]): number {
    return debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
  }

  private calculateAvalancheStrategy(debts: Debt[]): DebtPayoffStrategy {
    if (debts.length === 0) {
      return this.emptyStrategy();
    }

    const sorted = [...debts].sort((a, b) => b.interestRate - a.interestRate);
    const extraPayment = this.calculateExtraPayment(debts);
    const schedule = this.generateSchedule(sorted, extraPayment, 'avalanche');

    return {
      debtId: 'all',
      method: 'avalanche',
      payoffDate: new Date(schedule[schedule.length - 1]?.month || ''),
      totalInterest: schedule.reduce((sum, p) => sum + p.interest, 0),
      monthlyPayments: schedule,
    };
  }

  private calculateSnowballStrategy(debts: Debt[]): DebtPayoffStrategy {
    if (debts.length === 0) {
      return this.emptyStrategy();
    }

    const sorted = [...debts].sort((a, b) => a.currentBalance - b.currentBalance);
    const extraPayment = this.calculateExtraPayment(debts);
    const schedule = this.generateSchedule(sorted, extraPayment, 'snowball');

    return {
      debtId: 'all',
      method: 'snowball',
      payoffDate: new Date(schedule[schedule.length - 1]?.month || ''),
      totalInterest: schedule.reduce((sum, p) => sum + p.interest, 0),
      monthlyPayments: schedule,
    };
  }

  private emptyStrategy(): DebtPayoffStrategy {
    return {
      debtId: 'all',
      method: 'avalanche',
      payoffDate: new Date(),
      totalInterest: 0,
      monthlyPayments: [],
    };
  }

  private calculateExtraPayment(debts: Debt[]): number {
    const totalIncome = 100000;
    const totalMinPayment = debts.reduce((sum, d) => sum + d.monthlyPayment, 0);
    return Math.max(0, totalIncome * 0.1 - totalMinPayment);
  }

  private generateSchedule(
    debts: Debt[],
    extraPayment: number,
    method: 'avalanche' | 'snowball'
  ): PayoffSchedule[] {
    const schedule: PayoffSchedule[] = [];
    const balances = new Map(debts.map(d => [d.id, d.currentBalance]));
    const rates = new Map(debts.map(d => [d.id, d.interestRate / 12 / 100]));
    const payments = new Map(debts.map(d => [d.id, d.monthlyPayment]));

    const debtIds = debts.map(d => d.id);
    let month = 0;
    const maxMonths = 360;

    while (Array.from(balances.values()).some(b => b > 0) && month < maxMonths) {
      month++;
      const date = new Date();
      date.setMonth(date.getMonth() + month);
      const monthStr = date.toISOString().slice(0, 7);

      let availableExtra = extraPayment;

      for (const debtId of debtIds) {
        const balance = balances.get(debtId) || 0;
        if (balance <= 0) continue;

        const rate = rates.get(debtId) || 0;
        const interest = balance * rate;
        const payment = (payments.get(debtId) || 0) + (debtId === debtIds[0] ? availableExtra : 0);

        let principal = payment - interest;
        if (principal > balance) {
          availableExtra += principal - balance;
          principal = balance;
        }

        const newBalance = Math.max(0, balance - principal);
        balances.set(debtId, newBalance);

        schedule.push({
          month: monthStr,
          payment: payment + interest,
          principal,
          interest,
          balance: newBalance,
        });

        availableExtra = 0;
      }
    }

    return schedule;
  }

  private generateRecommendations(
    debts: Debt[],
    strategies: DebtPayoffStrategy[]
  ): DebtRecommendation[] {
    const recommendations: DebtRecommendation[] = [];

    const highInterest = debts.filter(d => d.interestRate > 15);
    if (highInterest.length > 0) {
      recommendations.push({
        type: 'refinance',
        debtId: highInterest[0].id,
        rationale: 'High interest rate - consider refinancing to lower rates',
        savings: highInterest[0].currentBalance * 0.05,
        priority: 'high',
      });
    }

    const avalanche = strategies.find(s => s.method === 'avalanche');
    const snowball = strategies.find(s => s.method === 'snowball');

    if (avalanche && snowball) {
      const interestSavings = snowball.totalInterest - avalanche.totalInterest;
      if (interestSavings > 10000) {
        recommendations.push({
          type: 'accelerate',
          rationale: `Avalanche method saves NPR ${interestSavings.toFixed(0)} in interest vs Snowball`,
          priority: 'medium',
        });
      }
    }

    const creditCards = debts.filter(d => d.type === 'credit_card');
    if (creditCards.length > 0) {
      recommendations.push({
        type: 'accelerate',
        debtId: creditCards[0].id,
        rationale: 'Prioritize credit card debt - highest interest',
        priority: 'high',
      });
    }

    if (recommendations.length === 0) {
      recommendations.push({
        type: 'maintain',
        rationale: 'Your debt portfolio is well managed',
        priority: 'low',
      });
    }

    return recommendations;
  }

  calculateDebtToIncomeRatio(debts: Debt[], monthlyIncome: number): number {
    const totalPayment = this.calculateTotalPayment(debts);
    return (totalPayment / monthlyIncome) * 100;
  }

  calculateNetDebtAfterInvestment(debts: Debt[], investments: number): number {
    const totalDebt = this.calculateTotalDebt(debts);
    return Math.max(0, totalDebt - investments);
  }

  simulateExtraPayment(debts: Debt[], extraAmount: number): { monthsSaved: number; interestSaved: number } {
    const baseAvalanche = this.calculateAvalancheStrategy(debts);
    const baseMonths = baseAvalanche.monthlyPayments.length;
    const baseInterest = baseAvalanche.totalInterest;

    const modifiedDebts = debts.map(d => ({
      ...d,
      monthlyPayment: d.monthlyPayment + extraAmount,
    }));

    const modifiedAvalanche = this.calculateAvalancheStrategy(modifiedDebts);
    const modifiedMonths = modifiedAvalanche.monthlyPayments.length;
    const modifiedInterest = modifiedAvalanche.totalInterest;

    return {
      monthsSaved: baseMonths - modifiedMonths,
      interestSaved: baseInterest - modifiedInterest,
    };
  }
}

export const debtManagementService = new DebtManagementService();
