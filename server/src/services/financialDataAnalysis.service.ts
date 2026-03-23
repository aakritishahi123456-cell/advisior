type StructuredFinancialData = {
  revenue: number | null
  profit: number | null
  growth: number | null
  latest_price: number | null
  PE_ratio: number | null
}

type StructuredFinancialAnalysisInput = {
  company: string
  data: StructuredFinancialData
}

type StructuredFinancialAnalysisOutput = {
  analysis: string
  strengths: string[]
  risks: string[]
}

type Claim = {
  text: string
  supports: Array<'revenue' | 'profit' | 'growth' | 'latest_price' | 'PE_ratio' | 'profit_margin' | 'pe_vs_growth'>
}

function round(value: number): number {
  return Math.round(value * 100) / 100
}

function formatNumber(value: number | null): string {
  if (value === null || !Number.isFinite(value)) {
    return 'N/A'
  }

  return new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 }).format(value)
}

function isSupported(
  claim: Claim,
  data: StructuredFinancialData
): boolean {
  return claim.supports.every((support) => {
    switch (support) {
      case 'revenue':
        return data.revenue !== null
      case 'profit':
        return data.profit !== null
      case 'growth':
        return data.growth !== null
      case 'latest_price':
        return data.latest_price !== null
      case 'PE_ratio':
        return data.PE_ratio !== null
      case 'profit_margin':
        return data.revenue !== null && data.revenue !== 0 && data.profit !== null
      case 'pe_vs_growth':
        return data.PE_ratio !== null && data.growth !== null
      default:
        return false
    }
  })
}

export class FinancialDataAnalysisService {
  static analyze(
    input: StructuredFinancialAnalysisInput
  ): StructuredFinancialAnalysisOutput | 'INSUFFICIENT DATA' {
    const { company, data } = input
    const analysisClaims: Claim[] = [
      {
        text: `Analysis for ${company} is based only on the provided structured financial data.`,
        supports: [],
      },
    ]
    const strengthClaims: Claim[] = []
    const riskClaims: Claim[] = []

    if (data.revenue !== null) {
      analysisClaims.push({
        text: `Reported revenue is ${formatNumber(data.revenue)}.`,
        supports: ['revenue'],
      })
    } else {
      riskClaims.push({
        text: 'Revenue data is unavailable, which limits trend and margin analysis.',
        supports: [],
      })
    }

    if (data.profit !== null) {
      analysisClaims.push({
        text: `Reported profit is ${formatNumber(data.profit)}.`,
        supports: ['profit'],
      })

      if (data.profit > 0) {
        strengthClaims.push({
          text: `The company is profitable based on the provided profit figure of ${formatNumber(data.profit)}.`,
          supports: ['profit'],
        })
      } else if (data.profit < 0) {
        riskClaims.push({
          text: `The company is loss-making based on the provided profit figure of ${formatNumber(data.profit)}.`,
          supports: ['profit'],
        })
      } else {
        riskClaims.push({
          text: 'Profit is zero in the provided data.',
          supports: ['profit'],
        })
      }
    } else {
      riskClaims.push({
        text: 'Profit data is unavailable, so profitability cannot be fully evaluated.',
        supports: [],
      })
    }

    if (data.revenue !== null && data.profit !== null && data.revenue !== 0) {
      const profitMargin = round((data.profit / data.revenue) * 100)
      analysisClaims.push({
        text: `Calculated profit margin is ${profitMargin}%.`,
        supports: ['profit_margin'],
      })

      if (profitMargin > 0) {
        strengthClaims.push({
          text: `Profit margin is positive at ${profitMargin}%.`,
          supports: ['profit_margin'],
        })
      } else if (profitMargin < 0) {
        riskClaims.push({
          text: `Profit margin is negative at ${profitMargin}%.`,
          supports: ['profit_margin'],
        })
      }
    }

    if (data.growth !== null) {
      analysisClaims.push({
        text: `Reported growth is ${round(data.growth)}%.`,
        supports: ['growth'],
      })

      if (data.growth > 0) {
        strengthClaims.push({
          text: `Growth is positive at ${round(data.growth)}%.`,
          supports: ['growth'],
        })
      } else if (data.growth < 0) {
        riskClaims.push({
          text: `Growth is negative at ${round(data.growth)}%.`,
          supports: ['growth'],
        })
      } else {
        riskClaims.push({
          text: 'Growth is flat at 0% in the provided data.',
          supports: ['growth'],
        })
      }
    } else {
      riskClaims.push({
        text: 'Growth data is unavailable, so growth trend analysis is limited.',
        supports: [],
      })
    }

    if (data.latest_price !== null) {
      analysisClaims.push({
        text: `Latest price is ${formatNumber(data.latest_price)}.`,
        supports: ['latest_price'],
      })
    } else {
      riskClaims.push({
        text: 'Latest price data is unavailable.',
        supports: [],
      })
    }

    if (data.PE_ratio !== null) {
      analysisClaims.push({
        text: `P/E ratio is ${round(data.PE_ratio)}.`,
        supports: ['PE_ratio'],
      })

      if (data.profit !== null && data.profit > 0) {
        strengthClaims.push({
          text: `A positive earnings figure supports interpretation of the reported P/E ratio of ${round(data.PE_ratio)}.`,
          supports: ['PE_ratio', 'profit'],
        })
      } else {
        riskClaims.push({
          text: `The reported P/E ratio of ${round(data.PE_ratio)} should be treated cautiously because earnings data is non-positive or incomplete.`,
          supports: ['PE_ratio'],
        })
      }
    } else {
      riskClaims.push({
        text: 'P/E ratio is unavailable, which limits valuation comparison.',
        supports: [],
      })
    }

    if (data.PE_ratio !== null && data.growth !== null) {
      if (data.PE_ratio > data.growth) {
        analysisClaims.push({
          text: 'The reported P/E ratio is numerically above the reported growth rate.',
          supports: ['pe_vs_growth'],
        })
      } else if (data.PE_ratio < data.growth) {
        analysisClaims.push({
          text: 'The reported P/E ratio is numerically below the reported growth rate.',
          supports: ['pe_vs_growth'],
        })
      } else {
        analysisClaims.push({
          text: 'The reported P/E ratio matches the reported growth rate numerically.',
          supports: ['pe_vs_growth'],
        })
      }
    }

    const verifiedAnalysis = analysisClaims.filter((claim) => isSupported(claim, data))
    const verifiedStrengths = strengthClaims.filter((claim) => isSupported(claim, data))
    const verifiedRisks = riskClaims.filter((claim) => isSupported(claim, data))

    const hasUnsupportedAnalysis = verifiedAnalysis.length !== analysisClaims.length
    const hasUnsupportedStrengths = verifiedStrengths.length !== strengthClaims.length
    const hasUnsupportedRisks = verifiedRisks.length !== riskClaims.length

    if (hasUnsupportedAnalysis || hasUnsupportedStrengths || hasUnsupportedRisks) {
      return 'INSUFFICIENT DATA'
    }

    if (verifiedAnalysis.length <= 1) {
      return 'INSUFFICIENT DATA'
    }

    return {
      analysis: verifiedAnalysis.map((claim) => claim.text).join(' '),
      strengths:
        verifiedStrengths.length > 0
          ? verifiedStrengths.map((claim) => claim.text)
          : ['No clear quantitative strength can be stated from the provided data alone.'],
      risks:
        verifiedRisks.length > 0
          ? verifiedRisks.map((claim) => claim.text)
          : ['No specific quantitative risk is visible in the provided fields alone.'],
    }
  }
}
