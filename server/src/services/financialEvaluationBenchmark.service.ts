import {
  StructuredFinancialAnalysisInput,
  StructuredFinancialAnalysisService,
} from './structuredFinancialAnalysis.service'

type Verdict = 'Strong' | 'Moderate' | 'Weak'
type RiskLevel = 'Low' | 'Medium' | 'High'

type BenchmarkCase = {
  id: string
  company: string
  question: string
  input: StructuredFinancialAnalysisInput
  expected: {
    verdict: Verdict
    risk_level: RiskLevel
    strengths: string[]
    weaknesses: string[]
  }
}

type BenchmarkCaseResult = {
  id: string
  company: string
  question: string
  expected: BenchmarkCase['expected']
  actual: ReturnType<typeof StructuredFinancialAnalysisService.analyze>
  scores: {
    accuracy: number
    reasoning_quality: number
    total: number
  }
}

type BenchmarkSummary = {
  total_questions: number
  accuracy_score: number
  reasoning_quality_score: number
  overall_score: number
}

type BenchmarkReport = {
  summary: BenchmarkSummary
  cases: BenchmarkCaseResult[]
}

const COMPANIES = [
  'NABIL',
  'NICA',
  'NBL',
  'SCB',
  'MBL',
  'SANIMA',
  'NMB',
  'ADBL',
  'EBL',
  'PCBL',
]

const SCENARIOS: Array<{
  slug: string
  prompt: string
  input: StructuredFinancialAnalysisInput
  expected: BenchmarkCase['expected']
}> = [
  {
    slug: 'elite',
    prompt: 'Is {{company}} fundamentally strong?',
    input: { roe: 22, eps: 38, debt_ratio: 0.25, revenue_trend: 'increasing' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      strengths: ['profitability', 'earnings', 'revenue', 'debt'],
      weaknesses: [],
    },
  },
  {
    slug: 'steady',
    prompt: 'Does {{company}} show stable earnings and manageable leverage?',
    input: { roe: 13, eps: 21, debt_ratio: 0.45, revenue_trend: 'stable' },
    expected: {
      verdict: 'Moderate',
      risk_level: 'Medium',
      strengths: ['profitability', 'earnings', 'revenue'],
      weaknesses: ['debt'],
    },
  },
  {
    slug: 'debt-heavy',
    prompt: 'Is {{company}} risky because of high debt?',
    input: { roe: 16, eps: 19, debt_ratio: 0.72, revenue_trend: 'increasing' },
    expected: {
      verdict: 'Moderate',
      risk_level: 'High',
      strengths: ['profitability', 'earnings', 'revenue'],
      weaknesses: ['debt'],
    },
  },
  {
    slug: 'revenue-slide',
    prompt: 'Should I worry about {{company}} if revenue is declining?',
    input: { roe: 9, eps: 7, debt_ratio: 0.35, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      strengths: ['earnings', 'debt'],
      weaknesses: ['profitability', 'revenue'],
    },
  },
  {
    slug: 'loss-making',
    prompt: 'How weak are {{company}} fundamentals if EPS is negative?',
    input: { roe: 6, eps: -3, debt_ratio: 0.68, revenue_trend: 'declining' },
    expected: {
      verdict: 'Weak',
      risk_level: 'High',
      strengths: [],
      weaknesses: ['profitability', 'earnings', 'revenue', 'debt'],
    },
  },
  {
    slug: 'balanced',
    prompt: 'Give a balanced fundamental view on {{company}}.',
    input: { roe: 11, eps: 14, debt_ratio: 0.32, revenue_trend: 'stable' },
    expected: {
      verdict: 'Strong',
      risk_level: 'Low',
      strengths: ['profitability', 'earnings', 'revenue', 'debt'],
      weaknesses: [],
    },
  },
]

function keywordFound(texts: string[], keyword: string) {
  const blob = texts.join(' ').toLowerCase()

  switch (keyword) {
    case 'profitability':
      return blob.includes('profitability') || blob.includes('roe')
    case 'earnings':
      return blob.includes('earnings') || blob.includes('eps')
    case 'revenue':
      return blob.includes('revenue')
    case 'debt':
      return blob.includes('debt') || blob.includes('leverage')
    default:
      return false
  }
}

function round(value: number) {
  return Math.round(value * 100) / 100
}

export function buildFinancialBenchmarkDataset(): BenchmarkCase[] {
  const cases: BenchmarkCase[] = []

  for (const company of COMPANIES) {
    for (const scenario of SCENARIOS) {
      cases.push({
        id: `${company.toLowerCase()}_${scenario.slug}`,
        company,
        question: scenario.prompt.replace('{{company}}', company),
        input: scenario.input,
        expected: scenario.expected,
      })
    }
  }

  return cases
}

function scoreCase(benchmarkCase: BenchmarkCase): BenchmarkCaseResult {
  const actual = StructuredFinancialAnalysisService.analyze(benchmarkCase.input)

  let accuracy = 0
  if (actual.verdict === benchmarkCase.expected.verdict) {
    accuracy += 0.5
  }
  if (actual.risk_level === benchmarkCase.expected.risk_level) {
    accuracy += 0.5
  }

  const expectedSignals = benchmarkCase.expected.strengths.length + benchmarkCase.expected.weaknesses.length
  let matchedSignals = 0

  for (const signal of benchmarkCase.expected.strengths) {
    if (keywordFound(actual.strength, signal)) {
      matchedSignals += 1
    }
  }

  for (const signal of benchmarkCase.expected.weaknesses) {
    if (keywordFound(actual.weakness, signal)) {
      matchedSignals += 1
    }
  }

  const reasoningQuality = expectedSignals === 0 ? 1 : matchedSignals / expectedSignals
  const total = accuracy * 0.7 + reasoningQuality * 0.3

  return {
    id: benchmarkCase.id,
    company: benchmarkCase.company,
    question: benchmarkCase.question,
    expected: benchmarkCase.expected,
    actual,
    scores: {
      accuracy: round(accuracy),
      reasoning_quality: round(reasoningQuality),
      total: round(total),
    },
  }
}

export class FinancialEvaluationBenchmarkService {
  static runBenchmark(): BenchmarkReport {
    const dataset = buildFinancialBenchmarkDataset()
    const cases = dataset.map(scoreCase)
    const totalQuestions = cases.length

    const accuracyScore =
      cases.reduce((sum, entry) => sum + entry.scores.accuracy, 0) / totalQuestions
    const reasoningQualityScore =
      cases.reduce((sum, entry) => sum + entry.scores.reasoning_quality, 0) / totalQuestions
    const overallScore =
      cases.reduce((sum, entry) => sum + entry.scores.total, 0) / totalQuestions

    return {
      summary: {
        total_questions: totalQuestions,
        accuracy_score: round(accuracyScore * 100),
        reasoning_quality_score: round(reasoningQualityScore * 100),
        overall_score: round(overallScore * 100),
      },
      cases,
    }
  }
}

