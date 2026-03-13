/**
 * FinSathi AI - Loan Calculator Unit Tests
 * Comprehensive test suite for EMI calculation and loan utilities
 */

const {
  calculateEMI,
  calculateAffordability,
  generateAmortizationSchedule,
  compareLoans,
  calculatePrepaymentSavings,
  validateLoanParams,
  getLoanRecommendations,
} = require('../loanCalculator.cjs');

describe('Loan Calculator Tests', () => {
  describe('calculateEMI', () => {
    describe('Basic EMI Calculation', () => {
      test('should calculate EMI correctly for standard loan', () => {
        const result = calculateEMI(1000000, 12, 5);
        
        expect(result).not.toBeNull();
        expect(result.emi).toBeCloseTo(22472.44, 2);
        expect(result.totalInterest).toBeCloseTo(348346.40, 2);
        expect(result.totalPayment).toBeCloseTo(1348346.40, 2);
        expect(result.monthlyRate).toBe(1);
        expect(result.totalMonths).toBe(60);
      });

      test('should handle zero interest rate correctly', () => {
        const result = calculateEMI(1000000, 0, 5);
        
        expect(result).not.toBeNull();
        expect(result.emi).toBeCloseTo(16666.67, 2);
        expect(result.totalInterest).toBe(0);
        expect(result.totalPayment).toBe(1000000);
      });

      test('should handle small loan amounts', () => {
        const result = calculateEMI(10000, 12, 1);
        
        expect(result).not.toBeNull();
        expect(result.emi).toBeGreaterThan(0);
        expect(result.totalPayment).toBeGreaterThan(10000);
      });

      test('should handle large loan amounts', () => {
        const result = calculateEMI(10000000, 12, 20);
        
        expect(result).not.toBeNull();
        expect(result.emi).toBeGreaterThan(0);
        expect(result.totalPayment).toBeGreaterThan(10000000);
      });

      test('should handle short tenures', () => {
        const result = calculateEMI(1000000, 12, 1);
        
        expect(result).not.toBeNull();
        expect(result.totalMonths).toBe(12);
        expect(result.emi).toBeGreaterThan(80000);
      });

      test('should handle long tenures', () => {
        const result = calculateEMI(1000000, 12, 30);
        
        expect(result).not.toBeNull();
        expect(result.totalMonths).toBe(360);
        expect(result.emi).toBeLessThan(15000);
      });
    });

    describe('Edge Cases', () => {
      test('should return null for invalid inputs', () => {
        expect(calculateEMI(0, 12, 5)).toBeNull();
        expect(calculateEMI(1000000, -1, 5)).toBeNull();
        expect(calculateEMI(1000000, 12, 0)).toBeNull();
        expect(calculateEMI(-1000, 12, 5)).toBeNull();
      });

      test('should handle very high interest rates', () => {
        const result = calculateEMI(1000000, 40, 5);
        
        expect(result).not.toBeNull();
        expect(result.emi).toBeGreaterThan(30000);
        expect(result.totalInterest).toBeGreaterThan(1000000);
      });

      test('should handle very low interest rates', () => {
        const result = calculateEMI(1000000, 0.1, 5);
        
        expect(result).not.toBeNull();
        expect(result.totalInterest).toBeGreaterThan(0);
        expect(result.totalInterest).toBeLessThan(50000);
      });
    });

    describe('Calculation Accuracy', () => {
      test('should match standard EMI formula results', () => {
        // Test case: 1 lakh at 10% for 1 year
        const result = calculateEMI(100000, 10, 1);
        
        // Expected: P * r * (1+r)^n / ((1+r)^n - 1)
        // P = 100000, r = 0.008333, n = 12
        // Expected EMI ≈ 8791.59
        expect(result.emi).toBeCloseTo(8791.59, 2);
      });

      test('should calculate monthly rate correctly', () => {
        const result = calculateEMI(1000000, 12, 5);
        
        expect(result.monthlyRate).toBe(1); // 12% / 12 = 1%
      });

      test('should calculate total months correctly', () => {
        const result = calculateEMI(1000000, 12, 5);
        
        expect(result.totalMonths).toBe(60); // 5 years * 12 months
      });

      test('should calculate interest to principal ratio correctly', () => {
        const result = calculateEMI(1000000, 12, 5);
        
        const expectedRatio = (result.totalInterest / 1000000) * 100;
        expect(result.interestToPrincipalRatio).toBeCloseTo(expectedRatio, 2);
      });
    });

    describe('Precision and Rounding', () => {
      test('should round EMI to 2 decimal places', () => {
        const result = calculateEMI(1000000, 12, 5);
        
        expect(result.emi).toBe(22472.44);
        expect(result.emi).toBe(result.emi.toFixed(2));
      });

      test('should round total interest to 2 decimal places', () => {
        const result = calculateEMI(1000000, 12, 5);
        
        expect(result.totalInterest).toBe(348346.40);
        expect(result.totalInterest).toBe(result.totalInterest.toFixed(2));
      });

      test('should round total payment to 2 decimal places', () => {
        const result = calculateEMI(1000000, 12, 5);
        
        expect(result.totalPayment).toBe(1348346.40);
        expect(result.totalPayment).toBe(result.totalPayment.toFixed(2));
      });
    });
  });

  describe('calculateAffordability', () => {
    describe('Basic Affordability Calculation', () => {
      test('should calculate maximum affordable loan amount', () => {
        const result = calculateAffordability(50000, 10000, 12, 5);
        
        expect(result.affordable).toBe(true);
        expect(result.maxLoanAmount).toBeGreaterThan(0);
        expect(result.maxEMI).toBe(15000); // 50% of income - existing EMIs
      });

      test('should handle zero existing EMIs', () => {
        const result = calculateAffordability(50000, 0, 12, 5);
        
        expect(result.affordable).toBe(true);
        expect(result.maxEMI).toBe(25000); // 50% of income
      });

      test('should calculate DTI ratio correctly', () => {
        const result = calculateAffordability(50000, 10000, 12, 5);
        
        expect(result.dtiRatio).toBe(50); // (10000 + 15000) / 50000 * 100
      });
    });

    describe('Affordability Edge Cases', () => {
      test('should return not affordable when no capacity for EMIs', () => {
        const result = calculateAffordability(50000, 30000, 12, 5);
        
        expect(result.affordable).toBe(false);
        expect(result.maxLoanAmount).toBe(0);
        expect(result.maxEMI).toBe(0);
      });

      test('should handle zero interest rate', () => {
        const result = calculateAffordability(50000, 0, 0, 5);
        
        expect(result.affordable).toBe(true);
        expect(result.maxLoanAmount).toBeGreaterThan(0);
      });

      test('should handle very high income', () => {
        const result = calculateAffordability(500000, 50000, 12, 5);
        
        expect(result.affordable).toBe(true);
        expect(result.maxLoanAmount).toBeGreaterThan(1000000);
      });
    });

    describe('Affordability Validation', () => {
      test('should validate input parameters', () => {
        expect(() => calculateAffordability(0, 0, 12, 5)).not.toThrow();
        expect(() => calculateAffordability(-50000, 0, 12, 5)).not.toThrow();
        expect(() => calculateAffordability(50000, -10000, 12, 5)).not.toThrow();
      });
    });
  });

  describe('generateAmortizationSchedule', () => {
    describe('Basic Schedule Generation', () => {
      test('should generate complete amortization schedule', () => {
        const schedule = generateAmortizationSchedule(1000000, 12, 5);
        
        expect(schedule).toHaveLength(60); // 5 years * 12 months
        expect(schedule[0].month).toBe(1);
        expect(schedule[59].month).toBe(60);
      });

      test('should calculate correct principal and interest breakdown', () => {
        const schedule = generateAmortizationSchedule(1000000, 12, 5);
        
        // First month: higher interest, lower principal
        expect(schedule[0].interest).toBeGreaterThan(schedule[0].principal);
        
        // Last month: lower interest, higher principal
        expect(schedule[59].interest).toBeLessThan(schedule[59].principal);
      });

      test('should ensure balance decreases to zero', () => {
        const schedule = generateAmortizationSchedule(1000000, 12, 5);
        
        expect(schedule[0].balance).toBeLessThan(1000000);
        expect(schedule[59].balance).toBe(0);
      });

      test('should maintain constant EMI throughout', () => {
        const schedule = generateAmortizationSchedule(1000000, 12, 5);
        
        const emiValues = schedule.map(month => month.emi);
        const allSameEMI = emiValues.every(emi => emi === emiValues[0]);
        expect(allSameEMI).toBe(true);
      });
    });

    describe('Amortization Edge Cases', () => {
      test('should handle zero interest rate', () => {
        const schedule = generateAmortizationSchedule(1000000, 0, 5);
        
        expect(schedule).toHaveLength(60);
        expect(schedule[0].interest).toBe(0);
        expect(schedule[0].principal).toBeGreaterThan(0);
      });

      test('should handle short tenure', () => {
        const schedule = generateAmortizationSchedule(1000000, 12, 1);
        
        expect(schedule).toHaveLength(12);
        expect(schedule[11].balance).toBe(0);
      });

      test('should handle very small loan amount', () => {
        const schedule = generateAmortizationSchedule(1000, 12, 1);
        
        expect(schedule).toHaveLength(12);
        expect(schedule[11].balance).toBe(0);
      });
    });

    describe('Amortization Precision', () => {
      test('should round values to 2 decimal places', () => {
        const schedule = generateAmortizationSchedule(1000000, 12, 5);
        
        schedule.forEach(month => {
          expect(month.emi).toBe(month.emi.toFixed(2));
          expect(month.principal).toBe(month.principal.toFixed(2));
          expect(month.interest).toBe(month.interest.toFixed(2));
          expect(month.balance).toBe(month.balance.toFixed(2));
        });
      });

      test('should ensure principal + interest = EMI', () => {
        const schedule = generateAmortizationSchedule(1000000, 12, 5);
        
        schedule.forEach(month => {
          expect(month.principal + month.interest).toBeCloseTo(month.emi, 2);
        });
      });
    });
  });

  describe('compareLoans', () => {
    describe('Basic Comparison', () => {
      test('should compare multiple loans correctly', () => {
        const loans = [
          { amount: 1000000, rate: 12, tenure: 5 },
          { amount: 1000000, rate: 10, tenure: 5 },
          { amount: 1000000, rate: 15, tenure: 5 },
        ];

        const result = compareLoans(loans);
        
        expect(result.loans).toHaveLength(3);
        expect(result.bestEMI).toBeDefined();
        expect(result.lowestInterest).toBeDefined();
        expect(result.lowestTotal).toBeDefined();
      });

      test('should sort loans by total payment', () => {
        const loans = [
          { amount: 1000000, rate: 15, tenure: 5 }, // Highest total payment
          { amount: 1000000, rate: 10, tenure: 5 }, // Lowest total payment
          { amount: 1000000, rate: 12, tenure: 5 }, // Middle total payment
        ];

        const result = compareLoans(loans);
        
        expect(result.loans[0].rate).toBe(10); // Lowest rate should be first
        expect(result.loans[1].rate).toBe(12);
        expect(result.loans[2].rate).toBe(15);
      });

      test('should identify best EMI option', () => {
        const loans = [
          { amount: 1000000, rate: 12, tenure: 7 }, // Lower EMI
          { amount: 1000000, rate: 12, tenure: 5 }, // Higher EMI
        ];

        const result = compareLoans(loans);
        
        expect(result.bestEMI.tenure).toBe(7);
        expect(result.bestEMI.emi).toBeLessThan(result.loans[1].emi);
      });

      test('should identify lowest interest option', () => {
        const loans = [
          { amount: 1000000, rate: 15, tenure: 5 },
          { amount: 1000000, rate: 10, tenure: 5 },
        ];

        const result = compareLoans(loans);
        
        expect(result.lowestInterest.rate).toBe(10);
        expect(result.lowestInterest.totalInterest).toBeLessThan(result.loans[0].totalInterest);
      });
    });

    describe('Comparison Edge Cases', () => {
      test('should handle empty loan array', () => {
        const result = compareLoans([]);
        
        expect(result.loans).toHaveLength(0);
        expect(result.bestEMI).toBeNull();
        expect(result.lowestInterest).toBeNull();
        expect(result.lowestTotal).toBeNull();
      });

      test('should handle single loan', () => {
        const loans = [{ amount: 1000000, rate: 12, tenure: 5 }];
        
        const result = compareLoans(loans);
        
        expect(result.loans).toHaveLength(1);
        expect(result.bestEMI).toBeDefined();
        expect(result.lowestInterest).toBeDefined();
        expect(result.lowestTotal).toBeDefined();
      });

      test('should handle invalid loan parameters', () => {
        const loans = [
          { amount: -1000, rate: 12, tenure: 5 }, // Invalid
          { amount: 1000000, rate: 12, tenure: 5 }, // Valid
        ];

        const result = compareLoans(loans);
        
        expect(result.loans).toHaveLength(1); // Only valid loan included
      });
    });

    describe('Comparison Summary', () => {
      test('should calculate correct summary statistics', () => {
        const loans = [
          { amount: 1000000, rate: 12, tenure: 5 },
          { amount: 2000000, rate: 10, tenure: 5 },
        ];

        const result = compareLoans(loans);
        
        expect(result.summary.totalLoans).toBe(2);
        expect(result.summary.averageEMI).toBeGreaterThan(0);
        expect(result.summary.averageInterest).toBeGreaterThan(0);
      });

      test('should handle loans with names', () => {
        const loans = [
          { amount: 1000000, rate: 12, tenure: 5, name: 'Loan A' },
          { amount: 1000000, rate: 10, tenure: 5, name: 'Loan B' },
        ];

        const result = compareLoans(loans);
        
        expect(result.loans[0].name).toBe('Loan A');
        expect(result.loans[1].name).toBe('Loan B');
      });
    });
  });

  describe('calculatePrepaymentSavings', () => {
    describe('Basic Prepayment Calculation', () => {
      test('should calculate savings for early prepayment', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 100000, 12);
        
        expect(result).not.toBeNull();
        expect(result.originalTenure).toBe(60);
        expect(result.newTenure).toBeLessThan(60);
        expect(result.savings).toBeGreaterThan(0);
      });

      test('should calculate savings for late prepayment', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 100000, 48);
        
        expect(result).not.toBeNull();
        expect(result.newTenure).toBeLessThan(60);
        expect(result.savings).toBeGreaterThan(0);
      });

      test('should handle zero prepayment', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 0, 12);
        
        expect(result).toBeNull();
      });

      test('should handle prepayment that clears loan', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 1000000, 1);
        
        expect(result).not.toBeNull();
        expect(result.newTenure).toBeLessThan(60);
      });
    });

    describe('Prepayment Edge Cases', () => {
      test('should handle prepayment at first month', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 200000, 1);
        
        expect(result).not.toBeNull();
        expect(result.prepaymentMonth).toBe(1);
        expect(result.savings).toBeGreaterThan(0);
      });

      test('should handle prepayment at last month', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 10000, 59);
        
        expect(result).not.toBeNull();
        expect(result.prepaymentMonth).toBe(59);
        expect(result.savings).toBeLessThan(10000); // Less than prepayment amount
      });

      test('should handle very large prepayment', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 900000, 12);
        
        expect(result).not.toBeNull();
        expect(result.newTenure).toBeMuchLessThan(60);
      });
    });

    describe('Prepayment Validation', () => {
      test('should validate input parameters', () => {
        expect(() => calculatePrepaymentSavings(0, 12, 5, 100000, 12)).not.toThrow();
        expect(() => calculatePrepaymentSavings(1000000, -1, 5, 100000, 12)).not.toThrow();
        expect(() => calculatePrepaymentSavings(1000000, 12, 0, 100000, 12)).not.toThrow();
      });

      test('should return null for invalid prepayment month', () => {
        const result = calculatePrepaymentSavings(1000000, 12, 5, 100000, 61);
        
        expect(result).toBeNull();
      });
    });
  });

  describe('validateLoanParams', () => {
    describe('Basic Validation', () => {
      test('should validate correct parameters', () => {
        const result = validateLoanParams(1000000, 12, 5);
        
        expect(result.isValid).toBe(true);
        expect(result.errors).toHaveLength(0);
      });

      test('should reject negative amount', () => {
        const result = validateLoanParams(-1000000, 12, 5);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Loan amount must be positive');
      });

      test('should reject amount below minimum', () => {
        const result = validateLoanParams(5000, 12, 5);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Loan amount must be at least NPR 10,000');
      });

      test('should reject amount above maximum', () => {
        const result = validateLoanParams(200000000, 12, 5);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Loan amount cannot exceed NPR 10 crore');
      });
    });

    describe('Rate Validation', () => {
      test('should reject negative interest rate', () => {
        const result = validateLoanParams(1000000, -5, 5);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Interest rate cannot be negative');
      });

      test('should warn about unusually high interest rate', () => {
        const result = validateLoanParams(1000000, 60, 5);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Interest rate seems unusually high');
      });
    });

    describe('Tenure Validation', () => {
      test('should reject negative tenure', () => {
        const result = validateLoanParams(1000000, 12, -5);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Tenure must be positive');
      });

      test('should reject tenure below minimum', () => {
        const result = validateLoanParams(1000000, 12, 0);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Tenure must be at least 1 year');
      });

      test('should reject tenure above maximum', () => {
        const result = validateLoanParams(1000000, 12, 35);
        
        expect(result.isValid).toBe(false);
        expect(result.errors).toContain('Tenure cannot exceed 30 years');
      });
    });

    describe('Multiple Validation Errors', () => {
      test('should collect multiple errors', () => {
        const result = validateLoanParams(-1000, -5, 0);
        
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(2);
        expect(result.errors).toContain('Loan amount must be positive');
        expect(result.errors).toContain('Interest rate cannot be negative');
        expect(result.errors).toContain('Tenure must be at least 1 year');
      });
    });
  });

  describe('getLoanRecommendations', () => {
    describe('Income-Based Recommendations', () => {
      test('should provide recommendations for low income', () => {
        const recommendations = getLoanRecommendations(25000, 5000, 'PERSONAL');
        
        expect(recommendations).toContain('Consider increasing income before applying for large loans');
      });

      test('should provide recommendations for high income', () => {
        const recommendations = getLoanRecommendations(150000, 10000, 'HOME');
        
        expect(recommendations).toContain('You may be eligible for preferential rates with higher income');
      });

      test('should provide recommendations for moderate income', () => {
        const recommendations = getLoanRecommendations(75000, 15000, 'PERSONAL');
        
        expect(recommendations.length).toBeGreaterThan(0);
      });
    });

    describe('Existing Debt Recommendations', () => {
      test('should recommend debt consolidation for high existing debt', () => {
        const recommendations = getLoanRecommendations(50000, 20000, 'PERSONAL');
        
        expect(recommendations).toContain('High existing debt burden - consider debt consolidation');
      });

      test('should not mention debt consolidation for low existing debt', () => {
        const recommendations = getLoanRecommendations(50000, 5000, 'PERSONAL');
        
        expect(recommendations).not.toContain('High existing debt burden - consider debt consolidation');
      });
    });

    describe('Loan Type Specific Recommendations', () => {
      test('should provide home loan recommendations', () => {
        const recommendations = getLoanRecommendations(100000, 0, 'HOME');
        
        expect(recommendations).toContain('Consider making a larger down payment to reduce EMI');
        expect(recommendations).toContain('Home loans typically have lower interest rates');
      });

      test('should provide personal loan recommendations', () => {
        const recommendations = getLoanRecommendations(100000, 0, 'PERSONAL');
        
        expect(recommendations).toContain('Personal loans have higher rates - keep tenure short');
        expect(recommendations).toContain('Consider collateral for better rates');
      });

      test('should provide business loan recommendations', () => {
        const recommendations = getLoanRecommendations(100000, 0, 'BUSINESS');
        
        expect(recommendations).toContain('Business loans require strong business plan');
        expect(recommendations).toContain('Consider government schemes for MSME loans');
      });

      test('should provide education loan recommendations', () => {
        const recommendations = getLoanRecommendations(100000, 0, 'EDUCATION');
        
        expect(recommendations).toContain('Education loans often have tax benefits');
        expect(recommendations).toContain('Look for scholarships to reduce loan amount');
      });

      test('should provide vehicle loan recommendations', () => {
        const recommendations = getLoanRecommendations(100000, 0, 'VEHICLE');
        
        expect(recommendations).toContain('Vehicle loans may require down payment');
        expect(recommendations).toContain('Consider total cost of ownership beyond EMI');
      });
    });

    describe('Recommendation Quality', () => {
      test('should provide relevant recommendations', () => {
        const recommendations = getLoanRecommendations(50000, 10000, 'PERSONAL');
        
        expect(recommendations.length).toBeGreaterThan(0);
        expect(recommendations.every(rec => typeof rec === 'string' && rec.length > 0)).toBe(true);
      });

      test('should handle unknown loan types', () => {
        const recommendations = getLoanRecommendations(50000, 10000, 'UNKNOWN');
        
        expect(recommendations.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete loan calculation workflow', () => {
      // Step 1: Validate parameters
      const validation = validateLoanParams(1000000, 12, 5);
      expect(validation.isValid).toBe(true);

      // Step 2: Calculate EMI
      const emiResult = calculateEMI(1000000, 12, 5);
      expect(emiResult).not.toBeNull();

      // Step 3: Generate amortization schedule
      const schedule = generateAmortizationSchedule(1000000, 12, 5);
      expect(schedule).toHaveLength(60);

      // Step 4: Check affordability
      const affordability = calculateAffordability(50000, 0, 12, 5);
      expect(affordability.affordable).toBe(true);

      // Step 5: Get recommendations
      const recommendations = getLoanRecommendations(50000, 0, 'PERSONAL');
      expect(recommendations.length).toBeGreaterThan(0);
    });

    test('should handle comparison workflow', () => {
      const loans = [
        { amount: 1000000, rate: 12, tenure: 5, name: 'Bank A' },
        { amount: 1000000, rate: 10, tenure: 5, name: 'Bank B' },
        { amount: 1000000, rate: 15, tenure: 5, name: 'Bank C' },
      ];

      const comparison = compareLoans(loans);
      
      expect(comparison.loans).toHaveLength(3);
      expect(comparison.bestEMI.name).toBe('Bank B'); // Lowest rate
      expect(comparison.lowestInterest.name).toBe('Bank B');
      expect(comparison.lowestTotal.name).toBe('Bank B');
    });

    test('should handle prepayment workflow', () => {
      // Step 1: Calculate initial loan
      const initialLoan = calculateEMI(1000000, 12, 5);
      expect(initialLoan).not.toBeNull();

      // Step 2: Calculate prepayment savings
      const prepayment = calculatePrepaymentSavings(1000000, 12, 5, 100000, 24);
      expect(prepayment).not.toBeNull();
      expect(prepayment.savings).toBeGreaterThan(0);

      // Step 3: Verify new tenure is shorter
      expect(prepayment.newTenure).toBeLessThan(initialLoan.totalMonths);
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of calculations efficiently', () => {
      const start = Date.now();
      
      // Perform 1000 EMI calculations
      for (let i = 0; i < 1000; i++) {
        calculateEMI(1000000 + i * 1000, 12 + i * 0.01, 5);
      }
      
      const end = Date.now();
      const duration = end - start;
      
      // Should complete within reasonable time (less than 1 second)
      expect(duration).toBeLessThan(1000);
    });

    test('should handle large amortization schedule generation', () => {
      const start = Date.now();
      
      // Generate 30-year schedule (360 months)
      const schedule = generateAmortizationSchedule(1000000, 12, 30);
      
      const end = Date.now();
      const duration = end - start;
      
      expect(schedule).toHaveLength(360);
      expect(duration).toBeLessThan(500); // Should be fast
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(() => calculateEMI(NaN, 12, 5)).not.toThrow();
      expect(() => calculateEMI(Infinity, 12, 5)).not.toThrow();
      expect(() => calculateEMI(1000000, NaN, 5)).not.toThrow();
      expect(() => calculateEMI(1000000, 12, NaN)).not.toThrow();
    });

    test('should return null for calculation errors', () => {
      expect(calculateEMI(-1000000, 12, 5)).toBeNull();
      expect(calculateEMI(1000000, -12, 5)).toBeNull();
      expect(calculateEMI(1000000, 12, -5)).toBeNull();
    });

    test('should handle edge cases without crashing', () => {
      expect(() => generateAmortizationSchedule(0, 12, 5)).not.toThrow();
      expect(() => compareLoans([])).not.toThrow();
      expect(() => calculatePrepaymentSavings(1000000, 12, 5, 0, 1)).not.toThrow();
    });
  });
});
