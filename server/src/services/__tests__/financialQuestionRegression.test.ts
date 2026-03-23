type RevenueTrend = 'increasing' | 'stable' | 'declining'

type Case = {
  question: string
  input: {
    roe: number
    eps: number
    debt_ratio: number
    revenue_trend: RevenueTrend
  }
  expected: {
    verdict: 'Strong' | 'Moderate' | 'Weak'
    risk_level: 'Low' | 'Medium' | 'High'
    mustMentionStrengths?: string[]
    mustMentionWeaknesses?: string[]
  }
}

const CASES: Case[] = [
  {
    question: 'Is NABIL fundamentally strong?',
    input: { roe: 21, eps: 34, debt_ratio: 0.28, revenue_trend: 'increasing' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Is NICA financially risky because of leverage?',
    input: { roe: 16, eps: 18, debt_ratio: 0.72, revenue_trend: 'increasing' },
    expected: {
      verdict: 'Moderate',
      risk_level: 'High',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue'],
      mustMentionWeaknesses: ['Debt'],
    },
  },
  {
    question: 'Should I worry if NBL revenue is falling?',
    input: { roe: 8, eps: 9, debt_ratio: 0.34, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      mustMentionWeaknesses: ['ROE', 'Revenue'],
    },
  },
  {
    question: 'Does SCB have stable earnings?',
    input: { roe: 14, eps: 25, debt_ratio: 0.31, revenue_trend: 'stable' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'How weak are MBL fundamentals if EPS is negative?',
    input: { roe: 7, eps: -4, debt_ratio: 0.66, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      mustMentionWeaknesses: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Is SANIMA balanced and investable?',
    input: { roe: 12, eps: 17, debt_ratio: 0.38, revenue_trend: 'stable' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Does NMB show strong profitability?',
    input: { roe: 18, eps: 20, debt_ratio: 0.41, revenue_trend: 'increasing' },
    expected: {
      verdict: 'Moderate',
      risk_level: 'Medium',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue'],
      mustMentionWeaknesses: ['Debt'],
    },
  },
  {
    question: 'Is ADBL weak despite low leverage?',
    input: { roe: 9, eps: 6, debt_ratio: 0.22, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      mustMentionStrengths: ['Debt'],
      mustMentionWeaknesses: ['ROE', 'Revenue'],
    },
  },
  {
    question: 'Does EBL have low risk and stable operations?',
    input: { roe: 15, eps: 26, debt_ratio: 0.27, revenue_trend: 'stable' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Is PCBL showing moderate quality only?',
    input: { roe: 11, eps: 12, debt_ratio: 0.55, revenue_trend: 'stable' },
    expected: {
      verdict: 'Moderate',
      risk_level: 'Medium',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue'],
      mustMentionWeaknesses: ['Debt'],
    },
  },
  {
    question: 'Would you classify HBL as financially strong?',
    input: { roe: 23, eps: 40, debt_ratio: 0.35, revenue_trend: 'increasing' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Is PRVU fundamentally weak because earnings turned negative?',
    input: { roe: 5, eps: -1, debt_ratio: 0.58, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      mustMentionWeaknesses: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Can I treat GBIME as low-risk?',
    input: { roe: 13, eps: 18, debt_ratio: 0.33, revenue_trend: 'stable' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Is SBI debt too high even if profitability looks okay?',
    input: { roe: 17, eps: 23, debt_ratio: 0.62, revenue_trend: 'stable' },
    expected: {
      verdict: 'Moderate',
      risk_level: 'High',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue'],
      mustMentionWeaknesses: ['Debt'],
    },
  },
  {
    question: 'Does BOKL have strong momentum?',
    input: { roe: 10, eps: 14, debt_ratio: 0.29, revenue_trend: 'increasing' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Is CZBIL under pressure from falling revenue?',
    input: { roe: 10, eps: 11, debt_ratio: 0.44, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      mustMentionStrengths: ['ROE', 'EPS'],
      mustMentionWeaknesses: ['Revenue', 'Debt'],
    },
  },
  {
    question: 'Would you rate LBBL as moderate rather than strong?',
    input: { roe: 12, eps: 15, debt_ratio: 0.49, revenue_trend: 'stable' },
    expected: {
      verdict: 'Moderate',
      risk_level: 'Medium',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue'],
      mustMentionWeaknesses: ['Debt'],
    },
  },
  {
    question: 'Is SHINE resilient on fundamentals?',
    input: { roe: 16, eps: 19, debt_ratio: 0.24, revenue_trend: 'stable' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
  {
    question: 'Does MEGA look weak because of low ROE and declining sales?',
    input: { roe: 6, eps: 8, debt_ratio: 0.39, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      mustMentionStrengths: ['EPS', 'Debt'],
      mustMentionWeaknesses: ['ROE', 'Revenue'],
    },
  },
  {
    question: 'Can KBL be considered safe with stable revenue?',
    input: { roe: 14, eps: 16, debt_ratio: 0.36, revenue_trend: 'stable' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      mustMentionStrengths: ['ROE', 'EPS', 'Revenue', 'Debt'],
    },
  },
]

function mentionsKeyword(lines: string[], keyword: string) {
  const combined = lines.join(' ').toLowerCase()

  switch (keyword) {
    case 'ROE':
      return combined.includes('roe') || combined.includes('profitability')
    case 'EPS':
      return combined.includes('eps') || combined.includes('earnings')
    case 'Revenue':
      return combined.includes('revenue')
    case 'Debt':
      return combined.includes('debt') || combined.includes('leverage')
    default:
      return false
  }
}

describe('20-question financial regression', () => {
  let StructuredFinancialAnalysisService: any

  beforeEach(() => {
    jest.resetModules()
    ;({ StructuredFinancialAnalysisService } = require('../structuredFinancialAnalysis.service'))
  })

  test('answers 20 financial questions without unsupported reasoning', () => {
    const failures: string[] = []

    for (const testCase of CASES) {
      const result = StructuredFinancialAnalysisService.analyze(testCase.input)

      if (result.verdict !== testCase.expected.verdict) {
        failures.push(`${testCase.question}: expected verdict ${testCase.expected.verdict}, got ${result.verdict}`)
      }

      if (result.risk_level !== testCase.expected.risk_level) {
        failures.push(
          `${testCase.question}: expected risk ${testCase.expected.risk_level}, got ${result.risk_level}`
        )
      }

      for (const keyword of testCase.expected.mustMentionStrengths || []) {
        if (!mentionsKeyword(result.strength, keyword)) {
          failures.push(`${testCase.question}: missing strength reasoning for ${keyword}`)
        }
      }

      for (const keyword of testCase.expected.mustMentionWeaknesses || []) {
        if (!mentionsKeyword(result.weakness, keyword)) {
          failures.push(`${testCase.question}: missing weakness reasoning for ${keyword}`)
        }
      }

      const combined = [...result.strength, ...result.weakness].join(' ').toLowerCase()
      if (combined.includes('pe ratio') || combined.includes('market cap') || combined.includes('dividend')) {
        failures.push(`${testCase.question}: introduced reasoning outside provided inputs`)
      }
    }

    expect(failures).toEqual([])
  })
})
