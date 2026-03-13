/**
 * FinSathi AI - Loan Comparison Unit Tests
 * Comprehensive test suite for loan comparison engine
 */

const {
  compareLoans,
  quickCompare,
  compareByCriteria,
  calculateComparisonMatrix,
  generateComparisonSummary,
  exportComparisonToCSV,
} = require('../loanComparison.cjs');

describe('Loan Comparison Tests', () => {
  describe('compareLoans', () => {
    describe('Basic Comparison Functionality', () => {
      test('should compare multiple loans successfully', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            bank: 'Nabil Bank',
            loanType: 'HOME',
            description: 'Home loan for apartment',
          },
          {
            loanAmount: 1000000,
            interestRate: 10,
            tenureYears: 5,
            bank: 'Global IME',
            loanType: 'HOME',
            description: 'Home loan with lower rate',
          },
          {
            loanAmount: 1000000,
            interestRate: 15,
            tenureYears: 5,
            bank: 'NIC Asia',
            loanType: 'HOME',
            description: 'Home loan with higher rate',
          },
        ];

        const result = compareLoans(loanOptions);

        expect(result).toBeDefined();
        expect(result.loans).toHaveLength(3);
        expect(result.analysis).toBeDefined();
        expect(result.recommendations).toBeDefined();
        expect(result.comparison).toBeDefined();
      });

      test('should return all loans in results', () => {
        const loanOptions = [
          { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans).toHaveLength(2);
        expect(result.loans[0].loanAmount).toBe(500000);
        expect(result.loans[1].loanAmount).toBe(1000000);
      });

      test('should calculate EMI for each loan', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        result.loans.forEach(loan => {
          expect(loan.emi).toBeGreaterThan(0);
          expect(loan.totalInterest).toBeGreaterThanOrEqual(0);
          expect(loan.totalPayment).toBeGreaterThan(loan.loanAmount);
        });
      });

      test('should include calculated metrics', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);
        const loan = result.loans[0];

        expect(loan.monthlyRate).toBeDefined();
        expect(loan.totalMonths).toBe(60);
        expect(loan.totalInterestRate).toBeDefined();
        expect(loan.interestToPrincipalRatio).toBeDefined();
        expect(loan.emiToIncomeRatio).toBeDefined();
        expect(loan.loanToValueRatio).toBeDefined();
      });
    });

    describe('Sorting and Ranking', () => {
      test('should sort loans by total payment by default', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 }, // Highest payment
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 }, // Lowest payment
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 }, // Middle payment
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans[0].totalPayment).toBeLessThan(result.loans[1].totalPayment);
        expect(result.loans[1].totalPayment).toBeLessThan(result.loans[2].totalPayment);
      });

      test('should identify best EMI option', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 7 }, // Lower EMI
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 }, // Higher EMI
        ];

        const result = compareLoans(loanOptions);

        expect(result.analysis.bestEMI).toBeDefined();
        expect(result.analysis.bestEMI.tenureYears).toBe(7);
        expect(result.analysis.lowestInterestBurden).toBeDefined();
        expect(result.analysis.lowestTotalPayment).toBeDefined();
      });

      test('should identify lowest interest burden', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.analysis.lowestInterestBurden.interestRate).toBe(10);
        expect(result.analysis.lowestInterestBurden.totalInterest).toBeLessThan(
          result.loans.find(loan => loan.interestRate === 15).totalInterest
        );
      });

      test('should identify lowest total payment', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.analysis.lowestTotalPayment.interestRate).toBe(10);
        expect(result.analysis.lowestTotalPayment.totalPayment).toBe(
          result.loans[0].totalPayment
        );
      });
    });

    describe('Analysis and Recommendations', () => {
      test('should provide comprehensive analysis', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.analysis.averages).toBeDefined();
        expect(result.analysis.ranges).toBeDefined();
        expect(result.analysis.savings).toBeDefined();
        expect(result.analysis.bestEMI).toBeDefined();
        expect(result.analysis.lowestInterestBurden).toBeDefined();
        expect(result.analysis.lowestTotalPayment).toBeDefined();
      });

      test('should calculate averages correctly', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 2000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.analysis.averages.emi).toBeGreaterThan(0);
        expect(result.analysis.averages.totalInterest).toBeGreaterThan(0);
        expect(result.analysis.averages.totalPayment).toBeGreaterThan(0);
        expect(result.analysis.averages.loanAmount).toBe(1500000);
        expect(result.analysis.averages.interestRate).toBe(11);
      });

      test('should calculate ranges correctly', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
          { loanAmount: 2000000, interestRate: 15, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.analysis.ranges.emi.min).toBeGreaterThan(0);
        expect(result.analysis.ranges.emi.max).toBeGreaterThan(result.analysis.ranges.emi.min);
        expect(result.analysis.ranges.emi.range).toBe(
          result.analysis.ranges.emi.max - result.analysis.ranges.emi.min
        );
      });

      test('should calculate savings correctly', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.analysis.savings.emiVsWorst).toBeGreaterThan(0);
        expect(result.analysis.savings.interestVsWorst).toBeGreaterThan(0);
        expect(result.analysis.savings.paymentVsWorst).toBeGreaterThan(0);
      });

      test('should generate recommendations', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);
        expect(result.recommendations.length).toBeGreaterThan(0);
      });

      test('should include different recommendation types', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        const recommendationTypes = result.recommendations.map(rec => rec.type);
        expect(recommendationTypes).toContain('LOWEST_EMI');
        expect(recommendationTypes).toContain('LOWEST_INTEREST');
        expect(recommendationTypes).toContain('LOWEST_TOTAL');
      });
    });

    describe('Edge Cases', () => {
      test('should handle empty loan array', () => {
        const result = compareLoans([]);

        expect(result.loans).toHaveLength(0);
        expect(result.analysis.bestEMI).toBeNull();
        expect(result.analysis.lowestInterestBurden).toBeNull();
        expect(result.analysis.lowestTotalPayment).toBeNull();
      });

      test('should handle single loan', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans).toHaveLength(1);
        expect(result.analysis.bestEMI).toBeDefined();
        expect(result.analysis.lowestInterestBurden).toBeDefined();
        expect(result.analysis.lowestTotalPayment).toBeDefined();
      });

      test('should handle maximum number of loans', () => {
        const loanOptions = Array.from({ length: 10 }, (_, i) => ({
          loanAmount: 1000000 + i * 100000,
          interestRate: 10 + i,
          tenureYears: 5,
        }));

        const result = compareLoans(loanOptions);

        expect(result.loans).toHaveLength(10);
        expect(result.analysis.averages).toBeDefined();
      });

      test('should reject too many loans', () => {
        const loanOptions = Array.from({ length: 11 }, (_, i) => ({
          loanAmount: 1000000,
          interestRate: 12,
          tenureYears: 5,
        }));

        expect(() => compareLoans(loanOptions)).toThrow('Maximum 10 loan options can be compared at once');
      });

      test('should handle invalid loan data', () => {
        const loanOptions = [
          { loanAmount: -1000, interestRate: 12, tenureYears: 5 }, // Invalid amount
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 }, // Valid
        ];

        expect(() => compareLoans(loanOptions)).toThrow('Loan amount must be greater than 0');
      });

      test('should handle zero interest rate', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 0, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans).toHaveLength(2);
        expect(result.loans.find(loan => loan.interestRate === 0).totalInterest).toBe(0);
      });

      test('should handle very high interest rate', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 40, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans).toHaveLength(2);
        expect(result.loans.find(loan => loan.interestRate === 40).emi).toBeGreaterThan(30000);
      });
    });

    describe('Additional Features', () => {
      test('should handle processing fees', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            processingFee: 5000,
          },
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            processingFee: 10000,
          },
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans[0].totalPayment).toBe(1348346.40 + 5000);
        expect(result.loans[1].totalPayment).toBe(1348346.40 + 10000);
      });

      test('should handle down payments', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            downPayment: 200000,
          },
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            downPayment: 300000,
          },
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans[0].effectiveAmount).toBe(800000);
        expect(result.loans[1].effectiveAmount).toBe(700000);
      });

      test('should handle different loan types', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 10, tenureYears: 20, loanType: 'HOME' },
          { loanAmount: 1000000, interestRate: 14, tenureYears: 5, loanType: 'PERSONAL' },
          { loanAmount: 1000000, interestRate: 16, tenureYears: 7, loanType: 'VEHICLE' },
        ];

        const result = compareLoans(loanOptions);

        expect(result.loans).toHaveLength(3);
        expect(result.loans[0].loanType).toBe('HOME');
        expect(result.loans[1].loanType).toBe('PERSONAL');
        expect(result.loans[2].loanType).toBe('VEHICLE');
      });
    });
  });

  describe('quickCompare', () => {
    describe('Basic Quick Comparison', () => {
      test('should perform quick comparison for 2 loans', () => {
        const loanOptions = [
          { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
          { loanAmount: 500000, interestRate: 10, tenureYears: 3 },
        ];

        const result = quickCompare(loanOptions);

        expect(result).toBeDefined();
        expect(result.loans).toHaveLength(2);
        expect(result.analysis).toBeDefined();
      });

      test('should perform quick comparison for 3 loans', () => {
        const loanOptions = [
          { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
          { loanAmount: 500000, interestRate: 10, tenureYears: 3 },
          { loanAmount: 500000, interestRate: 15, tenureYears: 3 },
        ];

        const result = quickCompare(loanOptions);

        expect(result.loans).toHaveLength(3);
        expect(result.analysis).toBeDefined();
      });

      test('should not include recommendations in quick comparison', () => {
        const loanOptions = [
          { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
        ];

        const result = quickCompare(loanOptions);

        expect(result.recommendations).toBeUndefined();
      });

      test('should use default sorting in quick comparison', () => {
        const loanOptions = [
          { loanAmount: 500000, interestRate: 15, tenureYears: 3 },
          { loanAmount: 500000, interestRate: 10, tenureYears: 3 },
        ];

        const result = quickCompare(loanOptions);

        expect(result.loans[0].totalPayment).toBeLessThan(result.loans[1].totalPayment);
      });
    });

    describe('Quick Comparison Edge Cases', () => {
      test('should reject too many loans for quick comparison', () => {
        const loanOptions = Array.from({ length: 4 }, () => ({
          loanAmount: 500000,
          interestRate: 12,
          tenureYears: 3,
        }));

        expect(() => quickCompare(loanOptions)).toThrow('Maximum 3 loan options can be compared at once');
      });

      test('should handle empty array for quick comparison', () => {
        expect(() => quickCompare([])).toThrow('At least one loan option is required');
      });

      test('should handle single loan for quick comparison', () => {
        const loanOptions = [
          { loanAmount: 500000, interestRate: 12, tenureYears: 3 },
        ];

        const result = quickCompare(loanOptions);

        expect(result.loans).toHaveLength(1);
        expect(result.analysis).toBeDefined();
      });
    });
  });

  describe('compareByCriteria', () => {
    describe('Criteria-based Comparison', () => {
      test('should compare by EMI', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 7 }, // Lower EMI
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 }, // Higher EMI
        ];

        const result = compareByCriteria(loanOptions, 'EMI');

        expect(result.loans[0].tenureYears).toBe(7);
        expect(result.loans[0].emi).toBeLessThan(result.loans[1].emi);
      });

      test('should compare by total interest', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
        ];

        const result = compareByCriteria(loanOptions, 'TOTAL_INTEREST');

        expect(result.loans[0].interestRate).toBe(10);
        expect(result.loans[0].totalInterest).toBeLessThan(result.loans[1].totalInterest);
      });

      test('should compare by total payment', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareByCriteria(loanOptions, 'TOTAL_PAYMENT');

        expect(result.loans[0].interestRate).toBe(10);
        expect(result.loans[0].totalPayment).toBeLessThan(result.loans[1].totalPayment);
      });

      test('should compare by effective rate', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = compareByCriteria(loanOptions, 'EFFECTIVE_RATE');

        expect(result.loans[0].interestRate).toBe(10);
        expect(result.loans[0].effectiveRate).toBeLessThan(result.loans[1].effectiveRate);
      });

      test('should compare by loan amount', () => {
        const loanOptions = [
          { loanAmount: 500000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareByCriteria(loanOptions, 'LOAN_AMOUNT');

        expect(result.loans[0].loanAmount).toBe(500000);
        expect(result.loans[1].loanAmount).toBe(1000000);
      });
    });

    describe('Criteria Edge Cases', () => {
      test('should handle invalid criteria', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        // Should default to TOTAL_PAYMENT for invalid criteria
        const result = compareByCriteria(loanOptions, 'INVALID');

        expect(result.loans).toHaveLength(1);
        expect(result.comparison.sortBy).toBe('TOTAL_PAYMENT');
      });

      test('should handle case-insensitive criteria', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = compareByCriteria(loanOptions, 'emi');

        expect(result.loans).toHaveLength(1);
        expect(result.comparison.sortBy).toBe('EMI');
      });
    });
  });

  describe('calculateComparisonMatrix', () => {
    describe('Matrix Generation', () => {
      test('should generate comparison matrix for multiple loans', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
        ];

        const result = calculateComparisonMatrix(loanOptions);

        expect(result.matrix).toBeDefined();
        expect(result.matrix).toHaveLength(3);
        expect(result.comparison).toBeDefined();
      });

      test('should include all pairwise comparisons', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = calculateComparisonMatrix(loanOptions);

        expect(result.matrix[0].comparisons).toHaveLength(2);
        expect(result.matrix[1].comparisons).toHaveLength(2);
        expect(result.matrix[0].comparisons[0].better).toBe('equal');
        expect(result.matrix[0].comparisons[1].better).toBeDefined();
      });

      test('should calculate EMI differences', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = calculateComparisonMatrix(loanOptions);

        const comparison = result.matrix[0].comparisons[1];
        expect(comparison.emiDifference).toBeDefined();
        expect(comparison.emiDifference).toBeGreaterThan(0);
        expect(comparison.interestDifference).toBeDefined();
        expect(comparison.paymentDifference).toBeDefined();
      });

      test('should calculate percentage differences', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = calculateComparisonMatrix(loanOptions);

        const comparison = result.matrix[0].comparisons[1];
        expect(comparison.emiDifferencePercent).toBeDefined();
        expect(comparison.interestDifferencePercent).toBeDefined();
        expect(comparison.paymentDifferencePercent).toBeDefined();
      });

      test('should identify better loan', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = calculateComparisonMatrix(loanOptions);

        const comparison = result.matrix[0].comparisons[1];
        expect(comparison.better).toBe('loan2'); // Second loan is better
      });
    });

    describe('Matrix Edge Cases', () => {
      test('should handle single loan matrix', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = calculateComparisonMatrix(loanOptions);

        expect(result.matrix).toHaveLength(1);
        expect(result.matrix[0].comparisons).toHaveLength(1);
        expect(result.matrix[0].comparisons[0].better).toBe('equal');
      });

      test('should handle identical loans', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = calculateComparisonMatrix(loanOptions);

        const comparison = result.matrix[0].comparisons[1];
        expect(comparison.emiDifference).toBe(0);
        expect(comparison.interestDifference).toBe(0);
        expect(comparison.paymentDifference).toBe(0);
        expect(comparison.better).toBe('equal');
      });
    });
  });

  describe('generateComparisonSummary', () => {
    describe('Summary Generation', () => {
      test('should generate summary for multiple loans', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
        ];

        const result = generateComparisonSummary(loanOptions);

        expect(result.summary).toBeDefined();
        expect(result.summary.totalLoans).toBe(3);
        expect(result.summary.bestEMI).toBeDefined();
        expect(result.summary.lowestInterest).toBeDefined();
        expect(result.summary.lowestPayment).toBeDefined();
      });

      test('should calculate summary statistics', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 2000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = generateComparisonSummary(loanOptions);

        expect(result.summary.averageEMI).toBeGreaterThan(0);
        expect(result.summary.averageInterest).toBeGreaterThan(0);
        expect(result.summary.averagePayment).toBeGreaterThan(0);
      });

      test('should generate insights', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
        ];

        const result = generateComparisonSummary(loanOptions);

        expect(result.insights).toBeDefined();
        expect(Array.isArray(result.insights)).toBe(true);
        expect(result.insights.length).toBeGreaterThan(0);
      });

      test('should include potential savings', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
          { loanAmount: 1000000, interestRate: 15, tenureYears: 5 },
        ];

        const result = generateComparisonSummary(loanOptions);

        expect(result.summary.totalSavings).toBeGreaterThan(0);
      });
    });

    describe('Summary Edge Cases', () => {
      test('should handle single loan summary', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const result = generateComparisonSummary(loanOptions);

        expect(result.summary.totalLoans).toBe(1);
        expect(result.summary.bestEMI).toBeDefined();
        expect(result.summary.lowestInterest).toBeDefined();
        expect(result.summary.lowestPayment).toBeDefined();
      });

      test('should handle empty loan list', () => {
        const result = generateComparisonSummary([]);

        expect(result.summary.totalLoans).toBe(0);
        expect(result.summary.bestEMI).toBe(0);
        expect(result.summary.lowestInterest).toBe(0);
        expect(result.summary.lowestPayment).toBe(0);
      });
    });
  });

  describe('exportComparisonToCSV', () => {
    describe('CSV Export', () => {
      test('should export comparison to CSV format', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            bank: 'Nabil Bank',
            loanType: 'HOME',
            description: 'Home loan',
          },
          {
            loanAmount: 1000000,
            interestRate: 10,
            tenureYears: 5,
            bank: 'Global IME',
            loanType: 'HOME',
            description: 'Home loan with lower rate',
          },
        ];

        const csvData = exportComparisonToCSV(loanOptions);

        expect(csvData).toBeDefined();
        expect(typeof csvData).toBe('string');
        expect(csvData.split('\n')).toHaveLength(3); // Header + 2 data rows
      });

      test('should include all required columns', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            bank: 'Nabil Bank',
            loanType: 'HOME',
          },
        ];

        const csvData = exportComparisonToCSV(loanOptions);
        const headers = csvData.split('\n')[0].split(',');

        expect(headers).toContain('Rank');
        expect(headers).toContain('Bank');
        expect(headers).toContain('Loan Type');
        expect(headers).toContain('Amount');
        expect(headers).toContain('Rate');
        expect(headers).toContain('Tenure');
        expect(headers).toContain('EMI');
        expect(headers).toContain('Total Interest');
        expect(headers).toContain('Total Payment');
      });

      test('should include calculated values in CSV', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            bank: 'Nabil Bank',
            loanType: 'HOME',
          },
        ];

        const csvData = exportComparisonToCSV(loanOptions);
        const dataRow = csvData.split('\n')[1].split(',');

        expect(dataRow[3]).toBe('1000000'); // Amount
        expect(dataRow[4]).toBe('12'); // Rate
        expect(dataRow[5]).toBe('5'); // Tenure
        expect(dataRow[6]).toContain('22472'); // EMI
      });

      test('should handle optional fields', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            // No optional fields
          },
        ];

        const csvData = exportComparisonToCSV(loanOptions);
        const dataRow = csvData.split('\n')[1].split(',');

        expect(dataRow[1]).toBe('Unknown'); // Bank
        expect(dataRow[2]).toBe('Personal'); // Loan type default
        expect(dataRow[12]).toBe('Loan 1'); // Description default
      });
    });

    describe('CSV Export Edge Cases', () => {
      test('should handle empty loan list', () => {
        const csvData = exportComparisonToCSV([]);

        expect(csvData).toBeDefined();
        expect(csvData.split('\n')).toHaveLength(1); // Only header
      });

      test('should handle single loan', () => {
        const loanOptions = [
          { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        ];

        const csvData = exportComparisonToCSV(loanOptions);

        expect(csvData.split('\n')).toHaveLength(2); // Header + 1 data row
      });

      test('should handle special characters in descriptions', () => {
        const loanOptions = [
          {
            loanAmount: 1000000,
            interestRate: 12,
            tenureYears: 5,
            description: 'Home loan with special characters: $, %, &, etc.',
          },
        ];

        const csvData = exportComparisonToCSV(loanOptions);

        expect(csvData).toBeDefined();
        expect(csvData.includes('special characters')).toBe(true);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete comparison workflow', () => {
      const loanOptions = [
        {
          loanAmount: 1000000,
          interestRate: 12,
          tenureYears: 5,
          bank: 'Nabil Bank',
          loanType: 'HOME',
          processingFee: 5000,
          downPayment: 200000,
        },
        {
          loanAmount: 1000000,
          interestRate: 10,
          tenureYears: 5,
          bank: 'Global IME',
          loanType: 'HOME',
          processingFee: 7500,
          downPayment: 300000,
        },
      ];

      // Step 1: Basic comparison
      const comparison = compareLoans(loanOptions);
      expect(comparison.loans).toHaveLength(2);
      expect(comparison.analysis).toBeDefined();

      // Step 2: Quick comparison
      const quick = quickCompare(loanOptions);
      expect(quick.loans).toHaveLength(2);

      // Step 3: Criteria comparison
      const emiComparison = compareByCriteria(loanOptions, 'EMI');
      expect(emiComparison.loans).toHaveLength(2);

      // Step 4: Matrix generation
      const matrix = calculateComparisonMatrix(loanOptions);
      expect(matrix.matrix).toHaveLength(2);

      // Step 5: Summary generation
      const summary = generateComparisonSummary(loanOptions);
      expect(summary.summary.totalLoans).toBe(2);

      // Step 6: CSV export
      const csv = exportComparisonToCSV(loanOptions);
      expect(csv.split('\n')).toHaveLength(3);
    });

    test('should maintain consistency across all functions', () => {
      const loanOptions = [
        { loanAmount: 1000000, interestRate: 12, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 10, tenureYears: 5 },
      ];

      const comparison = compareLoans(loanOptions);
      const quick = quickCompare(loanOptions);
      const summary = generateComparisonSummary(loanOptions);

      // All should identify the same best loan
      expect(comparison.analysis.lowestTotalPayment.interestRate).toBe(10);
      expect(quick.loans[0].interestRate).toBe(10);
      expect(summary.summary.lowestPayment).toBe(comparison.analysis.lowestTotalPayment.totalPayment);
    });

    test('should handle complex scenarios', () => {
      const complexLoans = [
        {
          loanAmount: 5000000,
          interestRate: 9.5,
          tenureYears: 20,
          loanType: 'HOME',
          processingFee: 15000,
          downPayment: 1000000,
        },
        {
          loanAmount: 3000000,
          interestRate: 11,
          tenureYears: 7,
          loanType: 'VEHICLE',
          processingFee: 8000,
          downPayment: 600000,
        },
        {
          loanAmount: 1000000,
          interestRate: 14,
          tenureYears: 3,
          loanType: 'PERSONAL',
          processingFee: 5000,
        },
      ];

      const result = compareLoans(complexLoans);

      expect(result.loans).toHaveLength(3);
      expect(result.analysis.averages).toBeDefined();
      expect(result.analysis.ranges).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of comparisons efficiently', () => {
      const start = Date.now();

      // Compare maximum number of loans
      const loanOptions = Array.from({ length: 10 }, (_, i) => ({
        loanAmount: 1000000 + i * 100000,
        interestRate: 10 + i,
        tenureYears: 5,
        bank: `Bank ${i}`,
      }));

      const result = compareLoans(loanOptions);

      const end = Date.now();
      const duration = end - start;

      expect(result.loans).toHaveLength(10);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle matrix generation efficiently', () => {
      const start = Date.now();

      const loanOptions = Array.from({ length: 10 }, (_, i) => ({
        loanAmount: 1000000 + i * 100000,
        interestRate: 10 + i,
        tenureYears: 5,
      }));

      const result = calculateComparisonMatrix(loanOptions);

      const end = Date.now();
      const duration = end - start;

      expect(result.matrix).toHaveLength(10);
      expect(duration).toBeLessThan(500); // Should be fast
    });

    test('should handle CSV export efficiently', () => {
      const start = Date.now();

      const loanOptions = Array.from({ length: 10 }, (_, i) => ({
        loanAmount: 1000000 + i * 100000,
        interestRate: 10 + i,
        tenureYears: 5,
        bank: `Bank ${i}`,
      }));

      const csv = exportComparisonToCSV(loanOptions);

      const end = Date.now();
      const duration = end - start;

      expect(csv.split('\n')).toHaveLength(11); // Header + 10 rows
      expect(duration).toBeLessThan(100); // Should be very fast
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(() => compareLoans(null)).toThrow();
      expect(() => compareLoans(undefined)).toThrow();
      expect(() => compareLoans('invalid')).toThrow();
    });

    test('should handle malformed loan objects', () => {
      const invalidLoans = [
        { loanAmount: 'invalid', interestRate: 12, tenureYears: 5 },
        { loanAmount: 1000000, interestRate: 'invalid', tenureYears: 5 },
      ];

      expect(() => compareLoans(invalidLoans)).toThrow();
    });

    test('should handle edge cases without crashing', () => {
      expect(() => quickCompare([])).not.toThrow();
      expect(() => calculateComparisonMatrix([])).not.toThrow();
      expect(() => generateComparisonSummary([])).not.toThrow();
      expect(() => exportComparisonToCSV([])).not.toThrow();
    });
  });
});
