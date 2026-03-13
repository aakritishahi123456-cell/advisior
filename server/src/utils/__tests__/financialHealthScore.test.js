/**
 * FinSathi AI - Financial Health Score Test Suite
 * Comprehensive tests for financial health scoring system
 */

const {
  calculateFinancialHealthScore,
  calculateROEScore,
  calculateDebtRatioScore,
  calculateProfitMarginScore,
  calculateRevenueGrowthScore,
  getScoreCategory,
  getIndustryWeights,
} = require('./financialHealthScore');

describe('Financial Health Score Tests', () => {
  describe('Component Score Calculations', () => {
    test('should calculate ROE score correctly', () => {
      expect(calculateROEScore(25).score).toBe(100);
      expect(calculateROEScore(25).grade).toBe('A+');
      expect(calculateROEScore(15).score).toBe(90);
      expect(calculateROEScore(8).score).toBe(70);
      expect(calculateROEScore(3).score).toBe(40);
      expect(calculateROEScore(-5).score).toBe(20);
    });

    test('should calculate Debt Ratio score correctly', () => {
      expect(calculateDebtRatioScore(0.2).score).toBe(100);
      expect(calculateDebtRatioScore(0.5).score).toBe(90);
      expect(calculateDebtRatioScore(1.0).score).toBe(65);
      expect(calculateDebtRatioScore(1.5).score).toBe(45);
      expect(calculateDebtRatioScore(3.0).score).toBe(20);
    });

    test('should calculate Profit Margin score correctly', () => {
      expect(calculateProfitMarginScore(25).score).toBe(100);
      expect(calculateProfitMarginScore(12).score).toBe(80);
      expect(calculateProfitMarginScore(7).score).toBe(70);
      expect(calculateProfitMarginScore(3).score).toBe(50);
      expect(calculateProfitMarginScore(-5).score).toBe(20);
    });

    test('should calculate Revenue Growth score correctly', () => {
      expect(calculateRevenueGrowthScore(30).score).toBe(100);
      expect(calculateRevenueGrowthScore(12).score).toBe(85);
      expect(calculateRevenueGrowthScore(6).score).toBe(75);
      expect(calculateRevenueGrowthScore(2).score).toBe(65);
      expect(calculateRevenueGrowthScore(-5).score).toBe(40);
      expect(calculateRevenueGrowthScore(-20).score).toBe(15);
    });
  });

  describe('Score Categories', () => {
    test('should categorize scores correctly', () => {
      expect(getScoreCategory(95)).toBe('STRONG');
      expect(getScoreCategory(85)).toBe('STRONG');
      expect(getScoreCategory(80)).toBe('STRONG');
      expect(getScoreCategory(75)).toBe('MODERATE');
      expect(getScoreCategory(60)).toBe('MODERATE');
      expect(getScoreCategory(59)).toBe('RISKY');
      expect(getScoreCategory(30)).toBe('RISKY');
    });
  });

  describe('Industry Weights', () => {
    test('should return correct industry weights', () => {
      const bankingWeights = getIndustryWeights('BANKING');
      expect(bankingWeights.roe).toBe(35);
      expect(bankingWeights.debtRatio).toBe(30);
      expect(bankingWeights.profitMargin).toBe(20);

      const techWeights = getIndustryWeights('TECHNOLOGY');
      expect(techWeights.roe).toBe(25);
      expect(techWeights.profitMargin).toBe(30);
      expect(techWeights.revenueGrowth).toBe(25);

      const balancedWeights = getIndustryWeights(null, 'BALANCED');
      expect(balancedWeights.roe).toBe(30);
      expect(balancedWeights.debtRatio).toBe(25);
    });
  });

  describe('Complete Financial Health Score', () => {
    test('should calculate strong financial health correctly', () => {
      const metrics = {
        roe: 18,
        debtRatio: 0.4,
        profitMargin: 15,
        revenueGrowth: 12,
      };

      const result = calculateFinancialHealthScore(metrics);

      expect(result.score).toBeGreaterThanOrEqual(80);
      expect(result.category).toBe('STRONG');
      expect(result.valid).toBe(true);
      expect(result.confidence).toBe('HIGH');
    });

    test('should calculate moderate financial health correctly', () => {
      const metrics = {
        roe: 10,
        debtRatio: 1.0,
        profitMargin: 8,
        revenueGrowth: 5,
      };

      const result = calculateFinancialHealthScore(metrics);

      expect(result.score).toBeGreaterThanOrEqual(60);
      expect(result.score).toBeLessThan(80);
      expect(result.category).toBe('MODERATE');
      expect(result.valid).toBe(true);
    });

    test('should calculate risky financial health correctly', () => {
      const metrics = {
        roe: 2,
        debtRatio: 2.5,
        profitMargin: 2,
        revenueGrowth: -8,
      };

      const result = calculateFinancialHealthScore(metrics);

      expect(result.score).toBeLessThan(60);
      expect(result.category).toBe('RISKY');
      expect(result.valid).toBe(true);
    });

    test('should handle industry-specific scoring', () => {
      const metrics = {
        roe: 12,
        debtRatio: 0.8,
        profitMargin: 10,
        revenueGrowth: 8,
      };

      const options = { industry: 'BANKING' };
      const result = calculateFinancialHealthScore(metrics, options);

      expect(result.weights.roe).toBe(35); // Banking-specific weight
      expect(result.metadata.industry).toBe('BANKING');
      expect(result.valid).toBe(true);
    });

    test('should handle different weighting strategies', () => {
      const metrics = {
        roe: 12,
        debtRatio: 0.8,
        profitMargin: 10,
        revenueGrowth: 8,
      };

      // Growth-focused weighting
      const growthResult = calculateFinancialHealthScore(metrics, { weighting: 'GROWTH_FOCUSED' });
      expect(growthResult.weights.revenueGrowth).toBe(40);

      // Profitability-focused weighting
      const profitResult = calculateFinancialHealthScore(metrics, { weighting: 'PROFITABILITY_FOCUSED' });
      expect(profitResult.weights.profitMargin).toBe(35);

      // Stability-focused weighting
      const stabilityResult = calculateFinancialHealthScore(metrics, { weighting: 'STABILITY_FOCUSED' });
      expect(stabilityResult.weights.debtRatio).toBe(40);
    });
  });

  describe('Edge Cases', () => {
    test('should handle null/undefined values', () => {
      const metrics = {
        roe: null,
        debtRatio: undefined,
        profitMargin: 15,
        revenueGrowth: 10,
      };

      const result = calculateFinancialHealthScore(metrics);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should handle extreme values', () => {
      const extremeMetrics = {
        roe: 150, // Extremely high
        debtRatio: 20, // Extremely high
        profitMargin: -50, // Extremely low
        revenueGrowth: 200, // Extremely high
      };

      const result = calculateFinancialHealthScore(extremeMetrics);

      expect(result.score).toBeDefined();
      expect(result.confidence).toBe('LOW');
    });

    test('should handle zero values', () => {
      const zeroMetrics = {
        roe: 0,
        debtRatio: 0,
        profitMargin: 0,
        revenueGrowth: 0,
      };

      const result = calculateFinancialHealthScore(zeroMetrics);

      expect(result.score).toBeGreaterThan(0);
      expect(result.valid).toBe(true);
    });
  });

  describe('Insights and Recommendations', () => {
    test('should generate relevant insights', () => {
      const strongMetrics = {
        roe: 20,
        debtRatio: 0.3,
        profitMargin: 18,
        revenueGrowth: 15,
      };

      const result = calculateFinancialHealthScore(strongMetrics);

      expect(result.insights.length).toBeGreaterThan(0);
      expect(result.insights.some(insight => 
        insight.includes('Strong shareholder returns')
      )).toBe(true);
    });

    test('should generate appropriate recommendations', () => {
      const riskyMetrics = {
        roe: 3,
        debtRatio: 2.5,
        profitMargin: 2,
        revenueGrowth: -10,
      };

      const result = calculateFinancialHealthScore(riskyMetrics);

      expect(result.recommendations.length).toBeGreaterThan(0);
      expect(result.recommendations.some(rec => 
        rec.includes('Immediate operational review')
      )).toBe(true);
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('should calculate score instantly', () => {
    const metrics = {
      roe: 12,
      debtRatio: 0.8,
      profitMargin: 10,
      revenueGrowth: 8,
    };

    const startTime = performance.now();
    const result = calculateFinancialHealthScore(metrics);
    const endTime = performance.now();

    const processingTime = endTime - startTime;
    expect(processingTime).toBeLessThan(5); // Should complete in under 5ms
    expect(result).toBeDefined();
    expect(result.score).toBeDefined();
  });

  test('should handle batch processing efficiently', () => {
    const batchMetrics = Array.from({ length: 10000 }, (_, i) => ({
      roe: 10 + (i % 20),
      debtRatio: 0.5 + (i % 3) * 0.5,
      profitMargin: 8 + (i % 15),
      revenueGrowth: 5 + (i % 25),
    }));

    const startTime = performance.now();
    const results = batchMetrics.map(metrics => calculateFinancialHealthScore(metrics));
    const endTime = performance.now();

    const processingTime = endTime - startTime;
    expect(processingTime).toBeLessThan(1000); // Should complete in under 1 second
    expect(results.length).toBe(10000);
  });
});
