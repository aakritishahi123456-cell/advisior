/**
 * FinSathi AI - Financial Normalization Tests
 * Comprehensive test suite for financial data normalization functions
 */

const {
  normalizeFinancialValue,
  normalizeFinancialData,
  normalizeNepaliNumber,
  validateAndNormalizeFinancialData,
  createNormalizationPipeline,
  removeCurrencySymbols,
  handleParentheses,
  removeFormatting,
} = require('./financialNormalization');

describe('Financial Normalization Tests', () => {
  describe('normalizeFinancialValue', () => {
    test('should convert comma numbers correctly', () => {
      expect(normalizeFinancialValue("1,200,000")).toBe(1200000);
      expect(normalizeFinancialValue("12,34,567.89")).toBe(1234567.89);
    });

    test('should handle NPR currency formats', () => {
      expect(normalizeFinancialValue("NPR 1,200,000")).toBe(1200000);
      expect(normalizeFinancialValue("Rs. 1,200,000")).toBe(1200000);
      expect(normalizeFinancialValue("रू 1,200,000")).toBe(1200000);
    });

    test('should handle parentheses for negative numbers', () => {
      expect(normalizeFinancialValue("(1,200,000)")).toBe(-1200000);
      expect(normalizeFinancialValue("(120000)")).toBe(-120000);
    });

    test('should handle missing values', () => {
      expect(normalizeFinancialValue(null)).toBe(0);
      expect(normalizeFinancialValue(undefined)).toBe(0);
      expect(normalizeFinancialValue("")).toBe(0);
      expect(normalizeFinancialValue("N/A")).toBe(0);
    });

    test('should handle decimal values', () => {
      expect(normalizeFinancialValue("1,200,000.50")).toBe(1200000.5);
      expect(normalizeFinancialValue("1200000.75")).toBe(1200000.75);
    });

    test('should round to specified decimals', () => {
      const result = normalizeFinancialValue("1,200,000.789", { roundTo: 2 });
      expect(result).toBe(1200000.79);
    });

    test('should handle negative numbers based on config', () => {
      expect(normalizeFinancialValue("-1,200,000", { allowNegative: true })).toBe(-1200000);
      expect(normalizeFinancialValue("-1,200,000", { allowNegative: false })).toBe(1200000);
    });
  });

  describe('normalizeNepaliNumber', () => {
    test('should handle lakh notation', () => {
      expect(normalizeNepaliNumber("1.2 LAKH")).toBe(120000);
      expect(normalizeNepaliNumber("5 LAKHS")).toBe(500000);
    });

    test('should handle crore notation', () => {
      expect(normalizeNepaliNumber("2.5 CRORE")).toBe(25000000);
      expect(normalizeNepaliNumber("12 CRORES")).toBe(120000000);
    });

    test('should handle arab notation', () => {
      expect(normalizeNepaliNumber("1.5 ARAB")).toBe(1500000000);
    });

    test('should handle Devanagari digits', () => {
      expect(normalizeNepaliNumber("१,२०,०००")).toBe(120000);
      expect(normalizeNepaliNumber("रू १,२०,०००")).toBe(120000);
    });
  });

  describe('validateAndNormalizeFinancialData', () => {
    test('should validate and normalize complete financial data', () => {
      const rawData = {
        revenue: "1,200,000",
        netProfit: "(120,000)",
        totalAssets: "2.5 CRORE",
        totalEquity: "NPR 800,000",
        totalDebt: "400,000",
      };

      const result = validateAndNormalizeFinancialData(rawData);

      expect(result.valid).toBe(true);
      expect(result.data.revenue).toBe(1200000);
      expect(result.data.netProfit).toBe(-120000);
      expect(result.data.totalAssets).toBe(25000000);
      expect(result.data.totalEquity).toBe(800000);
      expect(result.data.totalDebt).toBe(400000);
    });

    test('should detect validation errors', () => {
      const rawData = {
        revenue: -1000, // Invalid negative revenue
        netProfit: "invalid", // Invalid number
        totalAssets: null, // Missing required field
      };

      const result = validateAndNormalizeFinancialData(rawData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should generate warnings for unusual values', () => {
      const rawData = {
        revenue: "999999999999", // Unusually high
        netProfit: "100,000",
        totalAssets: "2,000,000",
        totalEquity: "1,000,000",
        totalDebt: "1,500,000", // Equity + Debt > Assets
      };

      const result = validateAndNormalizeFinancialData(rawData);

      expect(result.warnings.length).toBeGreaterThan(0);
    });
  });

  describe('createNormalizationPipeline', () => {
    test('should process batch data correctly', async () => {
      const rawData = [
        {
          revenue: "1,200,000",
          netProfit: "120,000",
          totalAssets: "2,000,000",
          totalEquity: "800,000",
          totalDebt: "400,000",
        },
        {
          revenue: "रू १,५०,०००",
          netProfit: "(150,000)",
          totalAssets: "3 CRORE",
          totalEquity: "1 LAKH",
          totalDebt: "500,000",
        },
      ];

      const result = await createNormalizationPipeline(rawData);

      expect(result.summary.total).toBe(2);
      expect(result.summary.successful).toBe(2);
      expect(result.summary.failed).toBe(0);
      expect(result.processed.length).toBe(2);
    });

    test('should handle mixed success/failure in batch', async () => {
      const rawData = [
        {
          revenue: "1,200,000",
          netProfit: "120,000",
          totalAssets: "2,000,000",
          totalEquity: "800,000",
          totalDebt: "400,000",
        },
        {
          revenue: "invalid", // This should fail
          netProfit: "150,000",
          totalAssets: "3,000,000",
          totalEquity: "1,000,000",
          totalDebt: "500,000",
        },
      ];

      const result = await createNormalizationPipeline(rawData);

      expect(result.summary.successful).toBe(1);
      expect(result.summary.failed).toBe(1);
      expect(result.errors.length).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    test('should handle extreme values', () => {
      expect(normalizeFinancialValue("0")).toBe(0);
      expect(normalizeFinancialValue("999,999,999.99")).toBe(999999999.99);
    });

    test('should handle malformed input gracefully', () => {
      expect(normalizeFinancialValue("abc")).toBe(0);
      expect(normalizeFinancialValue("12abc34")).toBe(0);
      expect(normalizeFinancialValue("1.2.3.4")).toBe(0);
    });

    test('should handle mixed currency formats', () => {
      expect(normalizeFinancialValue("$1,200,000")).toBe(1200000);
      expect(normalizeFinancialValue("€1,200,000")).toBe(1200000);
      expect(normalizeFinancialValue("£1,200,000")).toBe(1200000);
    });
  });
});

// Performance tests
describe('Performance Tests', () => {
  test('should handle large datasets efficiently', async () => {
    const largeDataset = Array.from({ length: 1000 }, (_, i) => ({
      revenue: `${(i + 1) * 1000}`,
      netProfit: `${(i + 1) * 100}`,
      totalAssets: `${(i + 1) * 5000}`,
      totalEquity: `${(i + 1) * 2000}`,
      totalDebt: `${(i + 1) * 1000}`,
    }));

    const startTime = Date.now();
    const result = await createNormalizationPipeline(largeDataset);
    const endTime = Date.now();

    expect(result.summary.successful).toBe(1000);
    expect(endTime - startTime).toBeLessThan(5000); // Should complete in under 5 seconds
  });
});

// Integration test examples
describe('Integration Examples', () => {
  test('example 1: typical Nepali financial statement', () => {
    const example = {
      revenue: "NPR 12,50,00,000",
      netProfit: "(2,30,00,000)",
      totalAssets: "45.5 CRORE",
      totalEquity: "15.2 CRORE", 
      totalDebt: "18.7 CRORE",
    };

    const result = validateAndNormalizeFinancialData(example);

    expect(result.valid).toBe(true);
    expect(result.data.revenue).toBe(125000000);
    expect(result.data.netProfit).toBe(-23000000);
    expect(result.data.totalAssets).toBe(455000000);
    expect(result.data.totalEquity).toBe(152000000);
    expect(result.data.totalDebt).toBe(187000000);
  });

  test('example 2: mixed format financial data', () => {
    const example = {
      revenue: "रू ८,५०,०००",
      netProfit: "1.2 LAKH",
      totalAssets: "2,000,000",
      totalEquity: "Rs. 800,000",
      totalDebt: "500,000",
    };

    const result = validateAndNormalizeFinancialData(example);

    expect(result.valid).toBe(true);
    expect(result.data.revenue).toBe(850000);
    expect(result.data.netProfit).toBe(120000);
    expect(result.data.totalAssets).toBe(2000000);
    expect(result.data.totalEquity).toBe(800000);
    expect(result.data.totalDebt).toBe(500000);
  });
});
