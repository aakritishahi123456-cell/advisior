import { Simulation, SimulationParameter, SimulationOutcome, SimulationResult, SimulationType } from './educationTypes';

export class InvestmentSimulationService {
  private simulations: Map<SimulationType, Simulation> = new Map();

  constructor() {
    this.initializeSimulations();
  }

  private initializeSimulations(): void {
    this.simulations.set('compound_growth', {
      id: 'sim_compound_growth',
      name: 'Compound Growth Calculator',
      type: 'compound_growth',
      parameters: [
        { name: 'initialInvestment', type: 'number', min: 1000, max: 10000000, defaultValue: 10000, label: 'Initial Investment (NPR)' },
        { name: 'monthlyContribution', type: 'number', min: 0, max: 100000, defaultValue: 5000, label: 'Monthly Contribution (NPR)' },
        { name: 'annualReturn', type: 'percentage', min: 1, max: 30, defaultValue: 12, label: 'Expected Annual Return (%)' },
        { name: 'years', type: 'number', min: 1, max: 50, defaultValue: 20, label: 'Investment Period (Years)' },
      ],
      scenario: {
        title: 'Compound Growth Simulation',
        description: 'See how your investments can grow over time with compound interest and regular contributions.',
        initialState: { balance: 0 },
      },
      outcomes: [
        { metric: 'totalInvested', format: 'currency' },
        { metric: 'totalReturns', format: 'currency' },
        { metric: 'finalValue', format: 'currency' },
        { metric: 'growthMultiplier', format: 'number' },
      ],
    });

    this.simulations.set('portfolio_builder', {
      id: 'sim_portfolio_builder',
      name: 'Portfolio Builder',
      type: 'portfolio_builder',
      parameters: [
        { name: 'banking', type: 'percentage', min: 0, max: 100, defaultValue: 30, label: 'Banking (%)' },
        { name: 'hydro', type: 'percentage', min: 0, max: 100, defaultValue: 25, label: 'Hydro Power (%)' },
        { name: 'insurance', type: 'percentage', min: 0, max: 100, defaultValue: 15, label: 'Insurance (%)' },
        { name: 'mutualFunds', type: 'percentage', min: 0, max: 100, defaultValue: 20, label: 'Mutual Funds (%)' },
        { name: 'others', type: 'percentage', min: 0, max: 100, defaultValue: 10, label: 'Others (%)' },
        { name: 'investmentAmount', type: 'number', min: 10000, max: 10000000, defaultValue: 100000, label: 'Total Investment (NPR)' },
        { name: 'expectedReturn', type: 'percentage', min: 1, max: 30, defaultValue: 15, label: 'Expected Annual Return (%)' },
      ],
      scenario: {
        title: 'Portfolio Allocation Simulator',
        description: 'Build a diversified portfolio and see how different allocations perform.',
        initialState: {},
      },
      outcomes: [
        { metric: 'finalValue', format: 'currency' },
        { metric: 'expectedReturn', format: 'currency' },
        { metric: 'riskScore', format: 'number' },
      ],
    });

    this.simulations.set('dollar_cost_averaging', {
      id: 'sim_dca',
      name: 'Dollar Cost Averaging',
      type: 'dollar_cost_averaging',
      parameters: [
        { name: 'lumpSum', type: 'number', min: 0, max: 10000000, defaultValue: 100000, label: 'Lump Sum Amount (NPR)' },
        { name: 'monthlyAmount', type: 'number', min: 1000, max: 100000, defaultValue: 10000, label: 'Monthly Investment (NPR)' },
        { name: 'months', type: 'number', min: 6, max: 60, defaultValue: 24, label: 'Investment Period (Months)' },
        { name: 'volatility', type: 'select', options: ['low', 'medium', 'high'], defaultValue: 'medium', label: 'Market Volatility' },
      ],
      scenario: {
        title: 'Lump Sum vs DCA',
        description: 'Compare the results of investing a lump sum versus dollar cost averaging over time.',
        initialState: {},
      },
      outcomes: [
        { metric: 'lumpSumFinal', format: 'currency' },
        { metric: 'dcaFinal', format: 'currency' },
        { metric: 'difference', format: 'currency' },
        { metric: 'dcaAdvantage', format: 'percentage' },
      ],
    });

    this.simulations.set('risk_return', {
      id: 'sim_risk_return',
      name: 'Risk-Return Tradeoff',
      type: 'risk_return',
      parameters: [
        { name: 'riskLevel', type: 'select', options: ['conservative', 'moderate', 'aggressive'], defaultValue: 'moderate', label: 'Risk Profile' },
        { name: 'investment', type: 'number', min: 10000, max: 10000000, defaultValue: 100000, label: 'Investment Amount (NPR)' },
        { name: 'years', type: 'number', min: 1, max: 30, defaultValue: 10, label: 'Investment Period (Years)' },
      ],
      scenario: {
        title: 'Risk vs Return Analysis',
        description: 'Understand how different risk levels affect potential returns over time.',
        initialState: {},
      },
      outcomes: [
        { metric: 'expectedReturn', format: 'percentage' },
        { metric: 'potentialGain', format: 'currency' },
        { metric: 'potentialLoss', format: 'currency' },
        { metric: 'riskScore', format: 'number' },
      ],
    });

    this.simulations.set('sector_allocation', {
      id: 'sim_sector',
      name: 'Sector Allocation',
      type: 'sector_allocation',
      parameters: [
        { name: 'sectors', type: 'select', options: ['banking', 'hydro', 'insurance', 'mutual_funds', 'hotels', 'manufacturing'], defaultValue: 'banking', label: 'Sector' },
        { name: 'investment', type: 'number', min: 10000, max: 10000000, defaultValue: 100000, label: 'Investment (NPR)' },
        { name: 'holdingPeriod', type: 'number', min: 1, max: 10, defaultValue: 3, label: 'Holding Period (Years)' },
      ],
      scenario: {
        title: 'Sector Performance',
        description: 'Analyze potential returns from different sectors in the Nepalese market.',
        initialState: {},
      },
      outcomes: [
        { metric: 'projectedReturn', format: 'percentage' },
        { metric: 'historicalVolatility', format: 'percentage' },
        { metric: 'riskAdjustedReturn', format: 'number' },
      ],
    });
  }

  getSimulation(type: SimulationType): Simulation | undefined {
    return this.simulations.get(type);
  }

  getAllSimulations(): Simulation[] {
    return Array.from(this.simulations.values());
  }

  runSimulation(type: SimulationType, params: Record<string, any>): SimulationResult {
    const sim = this.simulations.get(type);
    if (!sim) {
      throw new Error(`Simulation type ${type} not found`);
    }

    let outcomes: SimulationOutcome[] = [];

    switch (type) {
      case 'compound_growth':
        outcomes = this.runCompoundGrowth(params);
        break;
      case 'portfolio_builder':
        outcomes = this.runPortfolioBuilder(params);
        break;
      case 'dollar_cost_averaging':
        outcomes = this.runDCA(params);
        break;
      case 'risk_return':
        outcomes = this.runRiskReturn(params);
        break;
      case 'sector_allocation':
        outcomes = this.runSectorAllocation(params);
        break;
    }

    return {
      simulationId: sim.id,
      userId: '',
      parameters: params,
      outcomes,
      createdAt: new Date(),
    };
  }

  private runCompoundGrowth(params: any): SimulationOutcome[] {
    const P = params.initialInvestment;
    const PMT = params.monthlyContribution;
    const r = params.annualReturn / 100 / 12;
    const n = params.years * 12;

    const futureValueAnnuity = PMT * ((Math.pow(1 + r, n) - 1) / r);
    const futureValueLumpSum = P * Math.pow(1 + r, n);
    const totalInvested = P + (PMT * n);
    const finalValue = futureValueAnnuity + futureValueLumpSum;
    const totalReturns = finalValue - totalInvested;
    const growthMultiplier = totalInvested > 0 ? finalValue / totalInvested : 0;

    return [
      { metric: 'totalInvested', value: totalInvested, format: 'currency' },
      { metric: 'totalReturns', value: totalReturns, format: 'currency' },
      { metric: 'finalValue', value: finalValue, format: 'currency' },
      { metric: 'growthMultiplier', value: growthMultiplier, format: 'number' },
    ];
  }

  private runPortfolioBuilder(params: any): SimulationOutcome[] {
    const allocations = [
      { sector: 'Banking', weight: params.banking / 100, return: 0.15, risk: 0.25 },
      { sector: 'Hydro', weight: params.hydro / 100, return: 0.12, risk: 0.30 },
      { sector: 'Insurance', weight: params.insurance / 100, return: 0.10, risk: 0.20 },
      { sector: 'Mutual Funds', weight: params.mutualFunds / 100, return: 0.11, risk: 0.15 },
      { sector: 'Others', weight: params.others / 100, return: 0.08, risk: 0.35 },
    ];

    let expectedReturn = 0;
    let riskScore = 0;

    for (const alloc of allocations) {
      expectedReturn += alloc.weight * alloc.return;
      riskScore += alloc.weight * alloc.risk;
    }

    const finalValue = params.investmentAmount * Math.pow(1 + expectedReturn, 1);

    return [
      { metric: 'finalValue', value: finalValue, format: 'currency' },
      { metric: 'expectedReturn', value: expectedReturn * params.investmentAmount, format: 'currency' },
      { metric: 'riskScore', value: riskScore * 100, format: 'number' },
    ];
  }

  private runDCA(params: any): SimulationOutcome[] {
    const monthlyReturn = (params.monthlyAmount * 12) / params.investmentAmount;
    const volatilityMultiplier = params.volatility === 'low' ? 0.8 : params.volatility === 'high' ? 1.2 : 1;
    
    const lumpSumReturn = params.lumpSum * (1 + 0.12 * volatilityMultiplier);
    const totalDCAInvested = params.monthlyAmount * params.months;
    const dcaReturn = totalDCAInvested * (1 + 0.10 * volatilityMultiplier);
    
    const difference = lumpSumReturn - dcaReturn;
    const dcaAdvantage = (difference / lumpSumReturn) * 100;

    return [
      { metric: 'lumpSumFinal', value: lumpSumReturn, format: 'currency' },
      { metric: 'dcaFinal', value: dcaReturn, format: 'currency' },
      { metric: 'difference', value: Math.abs(difference), format: 'currency' },
      { metric: 'dcaAdvantage', value: Math.abs(dcaAdvantage), format: 'percentage' },
    ];
  }

  private runRiskReturn(params: any): SimulationOutcome[] {
    const riskProfiles = {
      conservative: { return: 0.06, loss: 0.08 },
      moderate: { return: 0.10, loss: 0.15 },
      aggressive: { return: 0.15, loss: 0.25 },
    };

    const profile = riskProfiles[params.riskLevel as keyof typeof riskProfiles] || riskProfiles.moderate;
    const expectedReturn = profile.return * Math.pow(1.1, params.years - 1);
    const potentialGain = params.investment * Math.pow(1 + expectedReturn, params.years);
    const potentialLoss = params.investment * (1 - profile.loss);

    return [
      { metric: 'expectedReturn', value: expectedReturn * 100, format: 'percentage' },
      { metric: 'potentialGain', value: potentialGain, format: 'currency' },
      { metric: 'potentialLoss', value: potentialLoss, format: 'currency' },
      { metric: 'riskScore', value: profile.loss * 100, format: 'number' },
    ];
  }

  private runSectorAllocation(params: any): SimulationOutcome[] {
    const sectorData: Record<string, { return: number; volatility: number }> = {
      banking: { return: 0.15, volatility: 0.25 },
      hydro: { return: 0.12, volatility: 0.30 },
      insurance: { return: 0.10, volatility: 0.20 },
      mutual_funds: { return: 0.11, volatility: 0.15 },
      hotels: { return: 0.08, volatility: 0.35 },
      manufacturing: { return: 0.09, volatility: 0.28 },
    };

    const data = sectorData[params.sectors] || sectorData.banking;
    const projectedReturn = data.return * params.holdingPeriod;
    const historicalVolatility = data.volatility * 100;
    const riskAdjustedReturn = projectedReturn / (data.volatility || 1);

    return [
      { metric: 'projectedReturn', value: projectedReturn * 100, format: 'percentage' },
      { metric: 'historicalVolatility', value: historicalVolatility, format: 'percentage' },
      { metric: 'riskAdjustedReturn', value: riskAdjustedReturn * 100, format: 'number' },
    ];
  }
}

export const investmentSimulationService = new InvestmentSimulationService();
