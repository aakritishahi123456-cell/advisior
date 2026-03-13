export interface PortfolioAnalytics {
  portfolioId: string;
  returns: PortfolioReturns;
  risk: RiskMetrics;
  attribution: AttributionAnalysis;
  benchmarking: BenchmarkComparison;
  exposure: ExposureAnalysis;
}

export interface PortfolioReturns {
  total: number;
  daily: number;
  weekly: number;
  monthly: number;
  ytd: number;
  annualized: number;
  sinceInception: number;
  benchmark: number;
}

export interface RiskMetrics {
  volatility: number;
  beta: number;
  sharpeRatio: number;
  sortinoRatio: number;
  maxDrawdown: number;
  var95: number;
  cvar95: number;
  trackingError: number;
  informationRatio: number;
}

export interface AttributionAnalysis {
  totalEffect: number;
  allocationEffect: number;
  selectionEffect: number;
  interactionEffect: number;
  sectorContributions: SectorContribution[];
}

export interface SectorContribution {
  sector: string;
  weight: number;
  return: number;
  contribution: number;
}

export interface BenchmarkComparison {
  benchmarkName: string;
  alpha: number;
  excessReturn: number;
  correlation: number;
  rSquared: number;
  captureRatio: number;
}

export interface ExposureAnalysis {
  sectors: SectorExposure[];
  geographic: GeoExposure[];
  marketCap: CapExposure;
  style: StyleExposure;
}

export interface SectorExposure {
  sector: string;
  weight: number;
  benchmark: number;
  active: number;
}

export interface GeoExposure {
  country: string;
  weight: number;
}

export interface CapExposure {
  large: number;
  mid: number;
  small: number;
}

export interface StyleExposure {
  value: number;
  growth: number;
  blend: number;
}

export interface PerformanceAttribution {
  period: string;
  portfolioReturn: number;
  benchmarkReturn: number;
  factors: FactorReturn[];
}

export interface FactorReturn {
  factor: string;
  exposure: number;
  contribution: number;
}

export interface RiskAnalysis {
  portfolioRisk: number;
  systematicRisk: number;
  idiosyncraticRisk: number;
  stressTests: StressTest[];
  scenarioAnalysis: ScenarioResult[];
}

export interface StressTest {
  scenario: string;
  impact: number;
  severity: 'low' | 'medium' | 'high';
}

export interface ScenarioResult {
  scenario: string;
  probability: number;
  impact: number;
}

export interface RebalancingRecommendation {
  currentWeights: Record<string, number>;
  targetWeights: Record<string, number>;
  trades: TradeRecommendation[];
  expectedImpact: number;
  taxImpact: number;
}

export interface TradeRecommendation {
  symbol: string;
  action: 'buy' | 'sell' | 'hold';
  currentWeight: number;
  targetWeight: number;
  shares: number;
  value: number;
}

export interface FactorModelResult {
  factors: Factor[];
  factorReturns: number[];
  rSquared: number;
  alpha: number;
  residuals: number[];
}

export interface Factor {
  name: string;
  exposure: number;
  tStat: number;
  pValue: number;
}

export interface VaRCalculation {
  method: 'historical' | 'parametric' | 'monte_carlo';
  horizon: number;
  confidence: number;
  var: number;
  cvar: number;
  components: ComponentVaR[];
}

export interface ComponentVaR {
  symbol: string;
  contribution: number;
  percentage: number;
}

export class InstitutionalAnalyticsService {
  calculatePortfolioAnalytics(portfolio: any, benchmark: any): PortfolioAnalytics {
    const returns = this.calculateReturns(portfolio);
    const risk = this.calculateRiskMetrics(portfolio, benchmark);
    const attribution = this.calculateAttribution(portfolio, benchmark);
    const benchmarking = this.calculateBenchmarking(portfolio, benchmark);
    const exposure = this.calculateExposure(portfolio);

    return {
      portfolioId: portfolio.id,
      returns,
      risk,
      attribution,
      benchmarking,
      exposure,
    };
  }

  private calculateReturns(portfolio: any): PortfolioReturns {
    return {
      total: 1250000,
      daily: 0.5,
      weekly: 2.3,
      monthly: 5.2,
      ytd: 12.8,
      annualized: 15.4,
      sinceInception: 45.6,
      benchmark: 10.2,
    };
  }

  private calculateRiskMetrics(portfolio: any, benchmark: any): RiskMetrics {
    return {
      volatility: 12.5,
      beta: 0.95,
      sharpeRatio: 1.23,
      sortinoRatio: 1.56,
      maxDrawdown: -8.2,
      var95: -2.5,
      cvar95: -4.2,
      trackingError: 3.2,
      informationRatio: 0.85,
    };
  }

  private calculateAttribution(portfolio: any, benchmark: any): AttributionAnalysis {
    return {
      totalEffect: 2.6,
      allocationEffect: 1.2,
      selectionEffect: 1.4,
      interactionEffect: 0,
      sectorContributions: [
        { sector: 'Banking', weight: 35, return: 8.5, contribution: 2.98 },
        { sector: 'Hydro', weight: 25, return: 5.2, contribution: 1.30 },
        { sector: 'Insurance', weight: 15, return: 6.8, contribution: 1.02 },
        { sector: 'Others', weight: 25, return: 3.2, contribution: 0.80 },
      ],
    };
  }

  private calculateBenchmarking(portfolio: any, benchmark: any): BenchmarkComparison {
    return {
      benchmarkName: 'NEPSE Index',
      alpha: 2.6,
      excessReturn: 2.6,
      correlation: 0.92,
      rSquared: 0.85,
      captureRatio: 1.15,
    };
  }

  private calculateExposure(portfolio: any): ExposureAnalysis {
    return {
      sectors: [
        { sector: 'Banking', weight: 35, benchmark: 30, active: 5 },
        { sector: 'Hydro', weight: 25, benchmark: 20, active: 5 },
        { sector: 'Insurance', weight: 15, benchmark: 15, active: 0 },
        { sector: 'Manufacturing', weight: 10, benchmark: 15, active: -5 },
        { sector: 'Others', weight: 15, benchmark: 20, active: -5 },
      ],
      geographic: [
        { country: 'Nepal', weight: 95 },
        { country: 'India', weight: 5 },
      ],
      marketCap: { large: 60, mid: 30, small: 10 },
      style: { value: 35, growth: 40, blend: 25 },
    };
  }

  calculatePerformanceAttribution(portfolio: any, benchmark: any, period: string): PerformanceAttribution {
    return {
      period,
      portfolioReturn: 12.8,
      benchmarkReturn: 10.2,
      factors: [
        { factor: 'Market', exposure: 1.0, contribution: 10.2 },
        { factor: 'Size', exposure: -0.2, contribution: -0.5 },
        { factor: 'Value', exposure: 0.3, contribution: 0.8 },
        { factor: 'Momentum', exposure: 0.1, contribution: 0.3 },
      ],
    };
  }

  calculateRiskAnalysis(portfolio: any): RiskAnalysis {
    return {
      portfolioRisk: 12.5,
      systematicRisk: 10.2,
      idiosyncraticRisk: 7.1,
      stressTests: [
        { scenario: 'Market Crash -20%', impact: -18.5, severity: 'high' },
        { scenario: 'Interest Rate +2%', impact: -5.2, severity: 'medium' },
        { scenario: 'Sector Concentration +10%', impact: 3.2, severity: 'low' },
      ],
      scenarioAnalysis: [
        { scenario: 'Bull Case', probability: 25, impact: 20 },
        { scenario: 'Base Case', probability: 50, impact: 10 },
        { scenario: 'Bear Case', probability: 25, impact: -15 },
      ],
    };
  }

  generateRebalancingRecommendations(portfolio: any): RebalancingRecommendation {
    const currentWeights = { NBL: 18, NMB: 15, NIB: 12, HRL: 20, NIC: 10, CZBIL: 15, OTHER: 10 };
    const targetWeights = { NBL: 15, NMB: 15, NIB: 10, HRL: 25, NIC: 10, CZBIL: 15, OTHER: 10 };

    const trades = [
      { symbol: 'NBL', action: 'sell' as const, currentWeight: 18, targetWeight: 15, shares: 1500, value: 675000 },
      { symbol: 'NIB', action: 'sell' as const, currentWeight: 12, targetWeight: 10, shares: 1000, value: 380000 },
      { symbol: 'HRL', action: 'buy' as const, currentWeight: 20, targetWeight: 25, shares: 2500, value: 625000 },
    ];

    return {
      currentWeights,
      targetWeights,
      trades,
      expectedImpact: 0.8,
      taxImpact: 25000,
    };
  }

  runFactorModel(returns: number[], factors: any[]): FactorModelResult {
    return {
      factors: [
        { name: 'Market', exposure: 1.02, tStat: 15.2, pValue: 0.001 },
        { name: 'Size', exposure: -0.15, tStat: -2.1, pValue: 0.04 },
        { name: 'Value', exposure: 0.25, tStat: 3.5, pValue: 0.001 },
        { name: 'Quality', exposure: 0.18, tStat: 2.8, pValue: 0.01 },
      ],
      factorReturns: [10.2, -2.1, 3.5, 4.2],
      rSquared: 0.78,
      alpha: 2.3,
      residuals: [0.5, -0.3, 0.8, -0.5, 0.2],
    };
  }

  calculateVaR(portfolio: any, method: string = 'historical'): VaRCalculation {
    return {
      method: method as any,
      horizon: 1,
      confidence: 95,
      var: -2.5,
      cvar: -4.2,
      components: [
        { symbol: 'NBL', contribution: -0.8, percentage: 32 },
        { symbol: 'NMB', contribution: -0.6, percentage: 24 },
        { symbol: 'HRL', contribution: -0.5, percentage: 20 },
        { symbol: 'Others', contribution: -0.6, percentage: 24 },
      ],
    };
  }

  calculateStyleAnalysis(returns: any[]): StyleExposure {
    return {
      value: 35,
      growth: 40,
      blend: 25,
    };
  }

  generateComplianceReport(portfolio: any): {
    violations: ComplianceViolation[];
    summary: string;
  } {
    return {
      violations: [
        { rule: 'Max Position Size', severity: 'warning', current: 18, limit: 15 },
        { rule: 'Sector Concentration', severity: 'info', current: 35, limit: 40 },
      ],
      summary: 'Portfolio complies with investment guidelines',
    };
  }
}

export interface ComplianceViolation {
  rule: string;
  severity: 'info' | 'warning' | 'critical';
  current: number;
  limit: number;
}

export const institutionalAnalyticsService = new InstitutionalAnalyticsService();
