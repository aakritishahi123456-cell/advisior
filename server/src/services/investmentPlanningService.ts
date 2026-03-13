import {
  Investment,
  InvestmentGoal,
  InvestmentPlan,
  PortfolioAllocation,
  InvestmentRecommendation,
  GoalProjection,
  RiskProfile,
  AllocationItem,
} from './personalFinanceTypes';

export class InvestmentPlanningService {
  private DEFAULT_ALLOCATION: Record<string, AllocationItem[]> = {
    conservative: [
      { category: 'Bonds', percentage: 60, value: 0 },
      { category: 'Stocks', percentage: 20, value: 0 },
      { category: 'EPF/PF', percentage: 15, value: 0 },
      { category: 'Cash', percentage: 5, value: 0 },
    ],
    moderate: [
      { category: 'Stocks', percentage: 50, value: 0 },
      { category: 'Bonds', percentage: 25, value: 0 },
      { category: 'EPF/PF', percentage: 15, value: 0 },
      { category: 'Real Estate', percentage: 5, value: 0 },
      { category: 'Gold', percentage: 5, value: 0 },
    ],
    aggressive: [
      { category: 'Stocks', percentage: 70, value: 0 },
      { category: 'Real Estate', percentage: 15, value: 0 },
      { category: 'EPF/PF', percentage: 10, value: 0 },
      { category: 'Crypto', percentage: 5, value: 0 },
    ],
  };

  async createInvestmentPlan(
    userId: string,
    investments: Investment[],
    goals: InvestmentGoal[],
    riskTolerance: string
  ): Promise<InvestmentPlan> {
    const allocation = this.calculateAllocation(investments);
    const targetAllocation = this.DEFAULT_ALLOCATION[riskTolerance] || this.DEFAULT_ALLOCATION.moderate;
    const drift = this.calculateDrift(allocation, targetAllocation);
    const recommendations = this.generateRecommendations(allocation, drift, riskTolerance);
    const projections = this.calculateGoalProjections(goals, investments);
    const riskProfile = this.assessRiskProfile(riskTolerance, allocation);

    return {
      userId,
      goals,
      currentPortfolio: investments,
      allocation: {
        current: allocation,
        target: targetAllocation,
        drift,
      },
      recommendations,
      projections,
      riskProfile,
    };
  }

  private calculateAllocation(investments: Investment[]): AllocationItem[] {
    const totalValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const byCategory: Record<string, number> = {};

    for (const inv of investments) {
      byCategory[inv.type] = (byCategory[inv.type] || 0) + inv.currentValue;
    }

    return Object.entries(byCategory).map(([category, value]) => ({
      category,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0,
      value,
    }));
  }

  private calculateDrift(current: AllocationItem[], target: AllocationItem[]): AllocationItem[] {
    return target.map(t => {
      const currentItem = current.find(c => c.category === t.category);
      return {
        category: t.category,
        percentage: (currentItem?.percentage || 0) - t.percentage,
        value: (currentItem?.value || 0),
      };
    }).filter(d => Math.abs(d.percentage) > 5);
  }

  private generateRecommendations(
    current: AllocationItem[],
    drift: AllocationItem[],
    riskTolerance: string
  ): InvestmentRecommendation[] {
    const recommendations: InvestmentRecommendation[] = [];

    for (const d of drift) {
      if (d.percentage > 10) {
        recommendations.push({
          action: 'sell',
          investment: d.category,
          amount: Math.abs(d.value * (d.percentage / 100)),
          rationale: `Overweight in ${d.category} by ${d.percentage.toFixed(1)}%`,
          risk: 'medium',
        });
      } else if (d.percentage < -10) {
        recommendations.push({
          action: 'buy',
          investment: d.category,
          amount: Math.abs(d.value * (Math.abs(d.percentage) / 100)),
          rationale: `Underweight in ${d.category} by ${Math.abs(d.percentage).toFixed(1)}%`,
          risk: 'medium',
        });
      }
    }

    if (recommendations.length === 0) {
      recommendations.push({
        action: 'hold',
        rationale: 'Portfolio is well-balanced',
        risk: 'low',
      });
    }

    return recommendations;
  }

  private calculateGoalProjections(goals: InvestmentGoal[], investments: Investment[]): GoalProjection[] {
    const totalInvested = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const avgReturn = 0.12;

    return goals.map(goal => {
      const monthsRemaining = this.monthsBetween(new Date(), goal.targetDate);
      const monthlyContribution = goal.monthlyContribution || 0;
      
      const projections: { date: string; projected: number; target: number }[] = [];
      let projected = totalInvested;

      for (let i = 0; i <= monthsRemaining; i += 6) {
        const date = new Date();
        date.setMonth(date.getMonth() + i);
        projected = projected * Math.pow(1 + avgReturn, i / 12) + monthlyContribution * ((Math.pow(1 + avgReturn, i / 12) - 1) / (avgReturn / 12));
        
        projections.push({
          date: date.toISOString().slice(0, 7),
          projected: Math.round(projected),
          target: goal.targetAmount,
        });
      }

      const finalProjected = projections[projections.length - 1]?.projected || 0;
      const onTrack = finalProjected >= goal.targetAmount;
      const shortfall = onTrack ? 0 : goal.targetAmount - finalProjected;

      return {
        goalId: goal.id,
        projections,
        onTrack,
        shortfall,
      };
    });
  }

  private monthsBetween(start: Date, end: Date): number {
    return (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());
  }

  private assessRiskProfile(tolerance: string, allocation: AllocationItem[]): RiskProfile {
    const stockWeight = allocation.find(a => a.category === 'stocks')?.percentage || 0;
    const score = Math.min(100, stockWeight + (tolerance === 'aggressive' ? 30 : tolerance === 'moderate' ? 15 : 0));

    return {
      score,
      level: score > 70 ? 'aggressive' : score > 40 ? 'moderate' : 'conservative',
      tolerance: score / 100,
      capacity: 1 - (score / 200),
    };
  }

  calculateFIRE(number: number, annualExpenses: number, withdrawalRate: number = 4): number {
    return annualExpenses / (withdrawalRate / 100);
  }

  calculateRequiredSavings(
    currentAge: number,
    retirementAge: number,
    targetRetirementCorpus: number,
    currentSavings: number,
    expectedReturn: number
  ): number {
    const years = retirementAge - currentAge;
    const monthlyReturn = expectedReturn / 12;
    const months = years * 12;
    
    const futureValueCurrent = currentSavings * Math.pow(1 + expectedReturn, years);
    const shortfall = Math.max(0, targetRetirementCorpus - futureValueCurrent);
    
    const monthlySavings = shortfall / ((Math.pow(1 + monthlyReturn, months) - 1) / monthlyReturn);
    return Math.round(monthlySavings);
  }

  projectPortfolio(investments: Investment[], years: number): { year: number; value: number }[] {
    const projections: { year: number; value: number }[] = [];
    let currentValue = investments.reduce((sum, i) => sum + i.currentValue, 0);
    const avgReturn = 0.1;

    for (let year = 0; year <= years; year++) {
      projections.push({
        year: new Date().getFullYear() + year,
        value: Math.round(currentValue),
      });
      currentValue *= (1 + avgReturn);
    }

    return projections;
  }

  suggestGoalAllocation(goal: InvestmentGoal): AllocationItem[] {
    const timeHorizon = this.monthsBetween(new Date(), goal.targetDate) / 12;
    
    if (timeHorizon < 2) {
      return [
        { category: 'Cash', percentage: 50, value: 0 },
        { category: 'Bonds', percentage: 40, value: 0 },
        { category: 'Stocks', percentage: 10, value: 0 },
      ];
    } else if (timeHorizon < 5) {
      return [
        { category: 'Bonds', percentage: 40, value: 0 },
        { category: 'Stocks', percentage: 40, value: 0 },
        { category: 'EPF/PF', percentage: 20, value: 0 },
      ];
    } else {
      return [
        { category: 'Stocks', percentage: 60, value: 0 },
        { category: 'Bonds', percentage: 20, value: 0 },
        { category: 'EPF/PF', percentage: 15, value: 0 },
        { category: 'Gold', percentage: 5, value: 0 },
      ];
    }
  }
}

export const investmentPlanningService = new InvestmentPlanningService();
