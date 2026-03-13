import { Router, Request, Response } from 'express';
import { personalFinanceOrchestrator, PersonalFinanceInput } from '../../services/personalFinanceOrchestrator';
import { budgetAnalysisService } from '../../services/budgetAnalysisService';
import { debtManagementService } from '../../services/debtManagementService';
import { investmentPlanningService } from '../../services/investmentPlanningService';
import { TransactionCategory } from '../../services/personalFinanceTypes';

const router = Router();

router.post('/report', async (req: Request, res: Response) => {
  try {
    const input: PersonalFinanceInput = req.body;

    if (!input.userId || !input.transactions) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const report = await personalFinanceOrchestrator.generateFullReport(input, 'monthly');

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Personal finance report error:', error);
    res.status(500).json({ error: 'Failed to generate report' });
  }
});

router.get('/profile', async (req: Request, res: Response) => {
  try {
    const { userId } = req.query;

    const input: PersonalFinanceInput = {
      userId: userId as string,
      transactions: [],
      budgets: [],
      debts: [],
      investments: [],
      goals: [],
      monthlyIncome: 100000,
      riskTolerance: 'moderate',
      currentAge: 30,
      retirementAge: 60,
    };

    const profile = await personalFinanceOrchestrator.getProfile(input);

    res.json({
      success: true,
      profile,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get profile' });
  }
});

router.post('/budget/analyze', async (req: Request, res: Response) => {
  try {
    const { userId, transactions, budgets, period } = req.body;

    const analysis = await budgetAnalysisService.analyzeBudget(
      userId,
      transactions,
      budgets,
      period || 'monthly'
    );

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    res.status(500).json({ error: 'Budget analysis failed' });
  }
});

router.post('/budget/ideal', (req: Request, res: Response) => {
  const { monthlyIncome } = req.body;

  if (!monthlyIncome) {
    return res.status(400).json({ error: 'Monthly income required' });
  }

  const budgets = budgetAnalysisService.calculateIdealBudget(monthlyIncome);

  res.json({
    success: true,
    budgets,
  });
});

router.post('/budget/forecast', (req: Request, res: Response) => {
  const { transactions, months } = req.body;

  const forecast = budgetAnalysisService.forecastExpenses(transactions, months || 3);

  res.json({
    success: true,
    forecast,
  });
});

router.post('/debt/analyze', async (req: Request, res: Response) => {
  try {
    const { userId, debts } = req.body;

    const analysis = await debtManagementService.analyzeDebts(userId, debts);

    res.json({
      success: true,
      analysis,
    });
  } catch (error) {
    res.status(500).json({ error: 'Debt analysis failed' });
  }
});

router.post('/debt/simulate', (req: Request, res: Response) => {
  const { debts, extraAmount } = req.body;

  const simulation = debtManagementService.simulateExtraPayment(debts, extraAmount || 5000);

  res.json({
    success: true,
    simulation,
    message: `Extra NPR ${extraAmount || 5000}/month saves ${simulation.monthsSaved} months and NPR ${simulation.interestSaved.toFixed(0)} in interest`,
  });
});

router.post('/debt/dti', (req: Request, res: Response) => {
  const { debts, monthlyIncome } = req.body;

  const dti = debtManagementService.calculateDebtToIncomeRatio(debts, monthlyIncome);

  let status: string;
  if (dti < 15) status = 'Excellent';
  else if (dti < 28) status = 'Good';
  else if (dti < 36) status = 'Fair';
  else status = 'Poor';

  res.json({
    success: true,
    dti: dti.toFixed(1),
    status,
    recommendation: dti > 36 ? 'Consider debt consolidation' : 'Debt levels are manageable',
  });
});

router.post('/investment/plan', async (req: Request, res: Response) => {
  try {
    const { userId, investments, goals, riskTolerance } = req.body;

    const plan = await investmentPlanningService.createInvestmentPlan(
      userId,
      investments,
      goals,
      riskTolerance || 'moderate'
    );

    res.json({
      success: true,
      plan,
    });
  } catch (error) {
    res.status(500).json({ error: 'Investment planning failed' });
  }
});

router.post('/investment/project', (req: Request, res: Response) => {
  const { investments, years } = req.body;

  const projections = investmentPlanningService.projectPortfolio(investments, years || 10);

  res.json({
    success: true,
    projections,
  });
});

router.post('/investment/fire', (req: Request, res: Response) => {
  const { annualExpenses, withdrawalRate } = req.body;

  const fireNumber = investmentPlanningService.calculateFIRE(
    0,
    annualExpenses,
    withdrawalRate || 4
  );

  res.json({
    success: true,
    fireNumber,
    monthlyPassiveIncome: Math.round(fireNumber * (withdrawalRate || 4) / 100 / 12),
  });
});

router.post('/investment/required-savings', (req: Request, res: Response) => {
  const { currentAge, retirementAge, targetCorpus, currentSavings, expectedReturn } = req.body;

  const required = investmentPlanningService.calculateRequiredSavings(
    currentAge,
    retirementAge,
    targetCorpus,
    currentSavings,
    expectedReturn || 0.1
  );

  res.json({
    success: true,
    monthlySavingsRequired: required,
    message: `Save NPR ${required.toLocaleString()}/month to reach your goal`,
  });
});

router.post('/investment/goal-allocation', (req: Request, res: Response) => {
  const { goal } = req.body;

  const allocation = investmentPlanningService.suggestGoalAllocation(goal);

  res.json({
    success: true,
    allocation,
  });
});

router.get('/categories', (req: Request, res: Response) => {
  const categories: TransactionCategory[] = [
    'salary',
    'investment',
    'business',
    'rent',
    'utilities',
    'food',
    'transportation',
    'healthcare',
    'entertainment',
    'shopping',
    'education',
    'insurance',
    'loan_payment',
    'other',
  ];

  res.json({
    success: true,
    categories: categories.map(c => ({
      value: c,
      label: c.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    })),
  });
});

export default router;
