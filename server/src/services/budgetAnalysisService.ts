import {
  Transaction,
  Budget,
  BudgetAnalysis,
  CategoryBreakdown,
  TrendData,
  BudgetAlert,
  TransactionCategory,
} from './personalFinanceTypes';

export class BudgetAnalysisService {
  private CATEGORY_GOALS: Record<TransactionCategory, number> = {
    salary: 0,
    investment: 20,
    business: 0,
    rent: 30,
    utilities: 10,
    food: 15,
    transportation: 10,
    healthcare: 5,
    entertainment: 5,
    shopping: 10,
    education: 5,
    insurance: 5,
    loan_payment: 0,
    other: 5,
  };

  async analyzeBudget(
    userId: string,
    transactions: Transaction[],
    budgets: Budget[],
    period: string
  ): Promise<BudgetAnalysis> {
    const income = transactions.filter(t => t.isIncome);
    const expenses = transactions.filter(t => !t.isIncome);

    const totalIncome = this.calculateTotal(income);
    const totalExpenses = this.calculateTotal(expenses);
    const savings = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? (savings / totalIncome) * 100 : 0;

    const categoryBreakdown = this.calculateCategoryBreakdown(expenses, budgets, totalExpenses);
    const trends = this.calculateTrends(transactions);
    const alerts = this.generateAlerts(categoryBreakdown, savingsRate);
    const recommendations = this.generateRecommendations(categoryBreakdown, savingsRate, totalIncome);

    return {
      userId,
      period,
      totalIncome,
      totalExpenses,
      savings,
      savingsRate,
      categoryBreakdown,
      trends,
      alerts,
      recommendations,
    };
  }

  private calculateTotal(transactions: Transaction[]): number {
    return transactions.reduce((sum, t) => sum + t.amount, 0);
  }

  private calculateCategoryBreakdown(
    expenses: Transaction[],
    budgets: Budget[],
    totalExpenses: number
  ): CategoryBreakdown[] {
    const categoryTotals: Record<TransactionCategory, number> = {} as Record<TransactionCategory, number>;
    
    for (const expense of expenses) {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    }

    const breakdown: CategoryBreakdown[] = [];

    for (const [category, actual] of Object.entries(categoryTotals)) {
      const budget = budgets.find(b => b.category === category);
      const budgeted = budget?.amount || 0;
      const percentage = totalExpenses > 0 ? (actual / totalExpenses) * 100 : 0;
      const variance = budgeted > 0 ? ((actual - budgeted) / budgeted) * 100 : 0;

      breakdown.push({
        category: category as TransactionCategory,
        budgeted,
        actual,
        variance,
        percentage,
      });
    }

    return breakdown.sort((a, b) => b.actual - a.actual);
  }

  private calculateTrends(transactions: Transaction[]): TrendData[] {
    const monthlyData: Record<string, { income: number; expenses: number }> = {};

    for (const transaction of transactions) {
      const month = new Date(transaction.date).toISOString().slice(0, 7);
      
      if (!monthlyData[month]) {
        monthlyData[month] = { income: 0, expenses: 0 };
      }

      if (transaction.isIncome) {
        monthlyData[month].income += transaction.amount;
      } else {
        monthlyData[month].expenses += transaction.amount;
      }
    }

    const trends: TrendData[] = [];
    for (const [month, data] of Object.entries(monthlyData)) {
      trends.push({
        month,
        income: data.income,
        expenses: data.expenses,
        savings: data.income - data.expenses,
      });
    }

    return trends.sort((a, b) => a.month.localeCompare(b.month)).slice(-6);
  }

  private generateAlerts(breakdown: CategoryBreakdown[], savingsRate: number): BudgetAlert[] {
    const alerts: BudgetAlert[] = [];

    for (const category of breakdown) {
      if (category.budgeted > 0 && category.variance > 10) {
        alerts.push({
          threshold: category.variance,
          type: category.variance > 25 ? 'critical' : 'warning',
          triggered: true,
        });
      }
    }

    if (savingsRate < 10) {
      alerts.push({
        threshold: 10,
        type: savingsRate < 5 ? 'critical' : 'warning',
        triggered: true,
      });
    }

    return alerts;
  }

  private generateRecommendations(
    breakdown: CategoryBreakdown[],
    savingsRate: number,
    totalIncome: number
  ): string[] {
    const recommendations: string[] = [];

    const overspent = breakdown.filter(c => c.variance > 10);
    if (overspent.length > 0) {
      recommendations.push(`Consider reducing spending in ${overspent.map(c => c.category).join(', ')}`);
    }

    if (savingsRate < 20) {
      recommendations.push('Aim to save at least 20% of your income for long-term financial health');
    }

    if (savingsRate < 10) {
      recommendations.push('Your savings rate is low. Review fixed expenses and look for areas to cut');
    }

    const highSpending = breakdown.find(c => c.percentage > 30);
    if (highSpending) {
      recommendations.push(`${highSpending.category} accounts for ${highSpending.percentage.toFixed(1)}% of expenses - consider reducing`);
    }

    return recommendations;
  }

  calculateIdealBudget(monthlyIncome: number): Budget[] {
    const budgets: Budget[] = [];

    for (const [category, percentage] of Object.entries(this.CATEGORY_GOALS)) {
      if (percentage > 0) {
        budgets.push({
          id: `budget_${category}`,
          userId: '',
          category: category as TransactionCategory,
          amount: (monthlyIncome * percentage) / 100,
          period: 'monthly',
          startDate: new Date(),
          alerts: [
            { threshold: 80, type: 'warning', triggered: false },
            { threshold: 100, type: 'critical', triggered: false },
          ],
        });
      }
    }

    return budgets;
  }

  compareWithIdeal(actual: CategoryBreakdown[], monthlyIncome: number): CategoryBreakdown[] {
    const ideal = this.calculateIdealBudget(monthlyIncome);

    return ideal.map(idealItem => {
      const actualItem = actual.find(a => a.category === idealItem.category);
      return {
        category: idealItem.category,
        budgeted: idealItem.amount,
        actual: actualItem?.actual || 0,
        variance: actualItem ? ((actualItem.actual - idealItem.amount) / idealItem.amount) * 100 : -100,
        percentage: actualItem?.percentage || 0,
      };
    });
  }

  detectAnomalies(transactions: Transaction[]): { category: TransactionCategory; amount: number; date: Date }[] {
    const anomalies: { category: TransactionCategory; amount: number; date: Date }[] = [];
    const categoryStats: Record<string, { mean: number; std: number }> = {};

    const expenses = transactions.filter(t => !t.isIncome);
    const grouped = this.groupByCategory(expenses);

    for (const [category, txns] of Object.entries(grouped)) {
      const amounts = txns.map(t => t.amount);
      const mean = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const std = Math.sqrt(amounts.reduce((sum, x) => sum + Math.pow(x - mean, 2), 0) / amounts.length);
      categoryStats[category] = { mean, std };
    }

    for (const transaction of expenses) {
      const stats = categoryStats[transaction.category];
      if (stats && stats.std > 0) {
        const zScore = (transaction.amount - stats.mean) / stats.std;
        if (zScore > 2) {
          anomalies.push({
            category: transaction.category,
            amount: transaction.amount,
            date: transaction.date,
          });
        }
      }
    }

    return anomalies;
  }

  private groupByCategory(transactions: Transaction[]): Record<string, Transaction[]> {
    return transactions.reduce((acc, t) => {
      if (!acc[t.category]) acc[t.category] = [];
      acc[t.category].push(t);
      return acc;
    }, {} as Record<string, Transaction[]>);
  }

  forecastExpenses(transactions: Transaction[], months: number = 3): { month: string; forecast: number }[] {
    const recent = this.calculateTrends(transactions).slice(-6);
    if (recent.length < 3) return [];

    const avgExpenses = recent.reduce((sum, m) => sum + m.expenses, 0) / recent.length;
    const trend = this.calculateTrend(recent.map(r => r.expenses));

    const forecast: { month: string; forecast: number }[] = [];
    const now = new Date();

    for (let i = 0; i < months; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() + i + 1, 1);
      const month = date.toISOString().slice(0, 7);
      const projected = avgExpenses * Math.pow(1 + trend, i + 1);
      forecast.push({ month, forecast: Math.round(projected) });
    }

    return forecast;
  }

  private calculateTrend(values: number[]): number {
    if (values.length < 2) return 0;
    const n = values.length;
    const xMean = (n - 1) / 2;
    const yMean = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;

    for (let i = 0; i < n; i++) {
      numerator += (i - xMean) * (values[i] - yMean);
      denominator += Math.pow(i - xMean, 2);
    }

    return denominator > 0 ? numerator / denominator / yMean : 0;
  }
}

export const budgetAnalysisService = new BudgetAnalysisService();
