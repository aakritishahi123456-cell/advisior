describe('FinancialEvaluationBenchmarkService', () => {
  let buildFinancialBenchmarkDataset: any
  let FinancialEvaluationBenchmarkService: any

  beforeEach(() => {
    jest.resetModules()
    ;({
      buildFinancialBenchmarkDataset,
      FinancialEvaluationBenchmarkService,
    } = require('../financialEvaluationBenchmark.service'))
  })

  test('builds a benchmark dataset with 60 financial questions', () => {
    const dataset = buildFinancialBenchmarkDataset()

    expect(dataset).toHaveLength(60)
    expect(dataset[0].question).toBeTruthy()
  })

  test('returns aggregate accuracy and reasoning scores', () => {
    const report = FinancialEvaluationBenchmarkService.runBenchmark()

    expect(report.summary.total_questions).toBe(60)
    expect(report.summary.accuracy_score).toBeGreaterThanOrEqual(0)
    expect(report.summary.reasoning_quality_score).toBeGreaterThanOrEqual(0)
    expect(report.summary.overall_score).toBeGreaterThanOrEqual(0)
    expect(report.cases[0].scores).toHaveProperty('accuracy')
  })
})

