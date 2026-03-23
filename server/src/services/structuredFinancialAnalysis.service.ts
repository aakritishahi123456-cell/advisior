type RevenueTrend = 'increasing' | 'stable' | 'declining'
type Verdict = 'Strong' | 'Moderate' | 'Weak'
type RiskLevel = 'Low' | 'Medium' | 'High'

export type StructuredFinancialAnalysisInput = {
  roe: number
  eps: number
  debt_ratio: number
  revenue_trend: RevenueTrend
}

export type StructuredFinancialAnalysisOutput = {
  strength: string[]
  weakness: string[]
  verdict: Verdict
  risk_level: RiskLevel
}

function isStrongProfitability(roe: number) {
  return roe >= 15
}

function isModerateProfitability(roe: number) {
  return roe >= 10 && roe < 15
}

function hasStableEarnings(eps: number) {
  return eps > 0
}

function isHighDebt(debtRatio: number) {
  return debtRatio >= 0.6
}

function isModerateDebt(debtRatio: number) {
  return debtRatio >= 0.4 && debtRatio < 0.6
}

export class StructuredFinancialAnalysisService {
  static analyze(input: StructuredFinancialAnalysisInput): StructuredFinancialAnalysisOutput {
    const strength: string[] = []
    const weakness: string[] = []
    const materialWeaknesses: string[] = []

    if (isStrongProfitability(input.roe)) {
      strength.push(`Strong profitability with ROE of ${input.roe}%.`)
    } else if (isModerateProfitability(input.roe)) {
      strength.push(`Acceptable profitability with ROE of ${input.roe}%.`)
    } else {
      weakness.push(`Weak profitability with ROE of ${input.roe}%.`)
      materialWeaknesses.push('profitability')
    }

    if (hasStableEarnings(input.eps)) {
      strength.push(`Earnings appear stable with positive EPS of ${input.eps}.`)
    } else {
      weakness.push(`Earnings stability is weak because EPS is ${input.eps}.`)
      materialWeaknesses.push('earnings')
    }

    if (input.revenue_trend === 'increasing') {
      strength.push('Revenue trend is increasing, which supports business momentum.')
    } else if (input.revenue_trend === 'stable') {
      strength.push('Revenue trend is stable.')
    } else {
      weakness.push('Revenue trend is declining.')
      materialWeaknesses.push('revenue')
    }

    if (isHighDebt(input.debt_ratio)) {
      weakness.push(`Debt ratio of ${input.debt_ratio} indicates high leverage.`)
      materialWeaknesses.push('debt')
    } else if (isModerateDebt(input.debt_ratio)) {
      weakness.push(`Debt ratio of ${input.debt_ratio} is manageable but should be monitored.`)
      materialWeaknesses.push('debt')
    } else {
      strength.push(`Debt ratio of ${input.debt_ratio} suggests conservative leverage.`)
    }

    const positiveSignals = strength.length
    const negativeSignals = weakness.length

    let verdict: Verdict = 'Moderate'
    if (positiveSignals >= 3 && negativeSignals === 0) {
      verdict = 'Strong'
    } else if (
      negativeSignals >= 3 ||
      (input.roe < 10 && input.revenue_trend === 'declining') ||
      (materialWeaknesses.includes('revenue') && materialWeaknesses.includes('debt')) ||
      (materialWeaknesses.includes('revenue') && materialWeaknesses.includes('profitability'))
    ) {
      verdict = 'Weak'
    }

    let riskLevel: RiskLevel = 'Medium'
    if (input.debt_ratio < 0.4 && input.eps > 0 && input.revenue_trend !== 'declining') {
      riskLevel = 'Low'
    } else if (input.debt_ratio >= 0.6 || input.eps <= 0 || input.revenue_trend === 'declining') {
      riskLevel = 'High'
    }

    return {
      strength,
      weakness,
      verdict,
      risk_level: riskLevel,
    }
  }
}
