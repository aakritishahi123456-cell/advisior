/**
 * FinSathi AI - Financial Ratios Test Suite
 * Comprehensive tests for financial ratio calculation engine
 */

const {
  calculateROE,
  calculateDebtToEquity,
  calculateNetProfitMargin,
  calculateAssetTurnover,
  calculateEPS,
  calculateFinancialRatios,
  calculateBatchRatios,
  analyzeRatios,
  getIndustryBenchmarks,
} = require('./financialRatios');

describe('Financial Ratios Tests', () => {
  describe('Individual Ratio Calculations', () => {
    test('should calculate ROE correctly', () => {
      expect(calculateROE(120000, 800000)).toBe(15.00);
      expect(calculateROE(-50000, 800000)).toBe(-6.25);
      expect(calculateROE(0, 800000)).toBe(0);
      expect(calculateROE(120000, 0)).toBeNull(); // Division by zero
    });

    test('should calculate Debt to Equity correctly', () => {
      expect(calculateDebtToEquity(400000, 800000)).toBe(0.50);
      expect(calculateDebtToEquity(1600000, 800000)).toBe(2.00);
      expect(calculateDebtToEquity(0, 800000)).toBe(0);
      expect(calculateDebtToEquity(400000, 0)).toBe(Infinity);
    });

    test('should calculate Net Profit Margin correctly', () => {
      expect(calculateNetProfitMargin(120000, 1000000)).toBe(12.00);
      expect(calculateNetProfitMargin(-50000, 1000000)).toBe(-5.00);
      expect(calculateNetProfitMargin(120000, 0)).toBe(Infinity);
    });

    test('should calculate Asset Turnover correctly', () => {
      expect(calculateAssetTurnover(1000000, 2000000)).toBe(0.50);
      expect(calculateAssetTurnover(3000000, 2000000)).toBe(1.50);
      expect(calculateAssetTurnover(1000000, 0)).toBe(Infinity);
    });

    test('should calculate EPS correctly', () => {
      expect(calculateEPS(120000, 1000000)).toBe(0.12);
      expect(calculateEPS(-50000, 1000000)).toBe(-0.05);
      expect(calculateEPS(120000, 0)).toBeNull(); // Division by zero
    });
  });

  describe('Comprehensive Ratio Calculation', () => {
    test('should calculate all basic ratios correctly', () => {
      const financialReport = {
        revenue: 1000000,
        netProfit: 120000,
        totalAssets: 2000000,
        totalEquity: 800000,
        totalDebt: 400000,
      };

      const result = calculateFinancialRatios(financialReport);

      expect(result.ratios.returnOnEquity).toBe(15.00);
      expect(result.ratios.netProfitMargin).toBe(12.00);
      expect(result.ratios.debtToEquity).toBe(0.50);
      expect(result.ratios.assetTurnover).toBe(0.50);
      expect(result.ratios.earningsPerShare).toBeNull(); // No shares provided
    });

    test('should include EPS when shares outstanding provided', () => {
      const financialReport = {
        revenue: 1000000,
        netProfit: 120000,
        totalAssets: 2000000,
        totalEquity: 800000,
        totalDebt: 400000,
      };

      const options = { sharesOutstanding: 1000000 };
      const result = calculateFinancialRatios(financialReport, options);

      expect(result.ratios.earningsPerShare).toBe(0.12);
    });

    test('should handle advanced ratios when requested', () => {
      const financialReport = {
        revenue: 1000000,
        netProfit: 120000,
        totalAssets: 2000000,
        totalEquity: 800000,
        totalDebt: 400000,
        marketPrice: 15.00,
      };

      const options = { 
        includeAdvancedRatios: true,
        sharesOutstanding: 1000000 
      };
      
      const result = calculateFinancialRatios(financialReport, options);

      expect(result.ratios.advanced.debtToAssets).toBe(20.00);
      expect(result.ratios.advanced.returnOnAssets).toBe(6.00);
      expect(result.ratios.advanced.equityMultiplier).toBe(2.50);
      expect(result.ratios.advanced.bookValuePerShare).toBe(0.80);
      expect(result.ratios.advanced.priceToBook).toBe(18.75);
    });
  });

  describe('Ratio Analysis', () => {
    test('should analyze strong financial performance', () => {
      const strongRatios = {
        returnOnEquity: 18.5,
        netProfitMargin: 20.0,
        debtToEquity: 0.3,
        assetTurnover: 1.8,
      };

      const analysis = analyzeRatios(strongRatios);

      expect(analysis.overall).toBe('STRONG');
      expect(analysis.strengths).toContain('Excellent return on equity');
      expect(analysis.strengths).toContain('Strong profit margins');
      expect(analysis.strengths).toContain('Conservative debt level');
      expect(analysis.strengths).toContain('Efficient asset utilization');
    });

    test('should analyze weak financial performance', () => {
      const weakRatios = {
        returnOnEquity: 3.2,
        netProfitMargin: 2.5,
        debtToEquity: 3.5,
        assetTurnover: 0.3,
      };

      const analysis = analyzeRatios(weakRatios);

      expect(analysis.overall).toBe('NEUTRAL');
      expect(analysis.concerns).toContain('Low return on equity');
      expect(analysis.concerns).toContain('Low profit margins');
      expect(analysis.concerns).toContain('High debt burden');
      expect(analysis.concerns).toContain('Low asset efficiency');
      expect(analysis.recommendations.length).toBeGreaterThan(0);
    });

    test('should provide industry comparison', () => {
      const ratios = {
        returnOnEquity: 15.0,
        netProfitMargin: 12.0,
        debtToEquity: 1.2,
        assetTurnover: 0.9,
      };

      const analysis = analyzeRatios(ratios, 'Banking');

      expect(analysis.industryComparison).toBeDefined();
      expect(analysis.industryComparison.returnOnEquity.performance).toBe('ABOVE_AVERAGE');
      expect(analysis.industryComparison.netProfitMargin.performance).toBe('BELOW_AVERAGE');
    });
  });

  describe('Industry Benchmarks', () => {
    test('should return correct benchmarks for known industries', () => {
      const bankingBenchmarks = getIndustryBenchmarks('Banking');
      expect(bankingBenchmarks.returnOnEquity).toBe(12);
      expect(bankingBenchmarks.netProfitMargin).toBe(15);
      expect(bankingBenchmarks.debtToEquity).toBe(8);

      const techBenchmarks = getIndustryBenchmarks('Technology');
      expect(techBenchmarks.returnOnEquity).toBe(18);
      expect(techBenchmarks.netProfitMargin).toBe(20);
      expect(techBenchmarks.debtToEquity).toBe(0.8);
    });

    test('should return null for unknown industries', () => {
      const unknownBenchmarks = getIndustryBenchmarks('Unknown Industry');
      expect(unknownBenchmarks).toBeNull();
    });
  });

  describe('Batch Processing', () => {
    test('should process multiple financial reports', () => {
      const reports = [
        {
          companyId: 'BANK1',
          revenue: 1000000,
          netProfit: 120000,
          totalAssets: 2000000,
          totalEquity: 800000,
          totalDebt: 400000,
        },
        {
          companyId: 'BANK2',
          revenue: 2000000,
          netProfit: 180000,
          totalAssets: 4000000,
          totalEquity: 1500000,
          totalDebt: 1200000,
        },
      ];

      const result = calculateBatchRatios(reports);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.calculations.length).toBe(2);
    });

    test('should handle errors in batch processing', () => {
      const reports = [
        {
          companyId: 'VALID',
          revenue: 1000000,
          netProfit: 120000,
          totalAssets: 2000000,
          totalEquity: 800000,
          totalDebt: 400000,
        },
        {
          companyId: 'INVALID',
          revenue: 'invalid', // This will cause error
          netProfit: 180000,
          totalAssets: 4000000,
          totalEquity: 1500000,
          totalDebt: 1200000,
        },
      ];

      const result = calculateBatchRatios(reports);

      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle zero values correctly', () => {
      expect(calculateROE(0, 1000)).toBe(0);
      expect(calculateDebtToEquity(0, 1000)).toBe(0);
      expect(calculateNetProfitMargin(0, 1000)).toBe(0);
      expect(calculateAssetTurnover(0, 1000)).toBe(0);
      expect(calculateEPS(0, 1000)).toBe(0);
    });

    test('should handle negative values correctly', () => {
      expect(calculateROE(-50000, 800000)).toBe(-6.25);
      expect(calculateNetProfitMargin(-100000, 1000000)).toBe(-10.00);
      expect(calculateEPS(-50000, 1000000)).toBe(-0.05);
    });

    test('should handle null/undefined inputs gracefully', () => {
      expect(calculateROE(null, 800000)).toBeNull();
      expect(calculateDebtToEquity(undefined, 800000)).toBeNull();
      expect(calculateNetProfitMargin(120000, null)).toBeNull();
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('should calculate ratios instantly', () => {
    const financialReport = {
      revenue: 1000000,
      netProfit: 120000,
      totalAssets: 2000000,
      totalEquity: 800000,
      totalDebt: 400000,
    };

    const startTime = performance.now();
    const result = calculateFinancialRatios(financialReport);
    const endTime = performance.now();

    const processingTime = endTime - startTime;
    expect(processingTime).toBeLessThan(10); // Should complete in under 10ms
    expect(result).toBeDefined();
    expect(result.ratios).toBeDefined();
  });

  test('should handle large batch efficiently', () => {
    const largeDataset = Array.from({ length: 10000 }, (_, i) => ({
      companyId: `COMPANY_${i}`,
      revenue: (i + 1) * 1000,
      netProfit: (i + 1) * 100,
      totalAssets: (i + 1) * 5000,
      totalEquity: (i + 1) * 2000,
      totalDebt: (i + 1) * 1000,
    }));

    const startTime = performance.now();
    const result = calculateBatchRatios(largeDataset);
    const endTime = performance.now();

    const processingTime = endTime - startTime;
    expect(processingTime).toBeLessThan(1000); // Should complete in under 1 second
    expect(result.summary.successful).toBe(10000);
  });
});
