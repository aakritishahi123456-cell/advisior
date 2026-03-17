/**
 * FinSathi AI - Risk Scoring Unit Tests
 * Comprehensive test suite for loan risk assessment
 */

const {
  calculateLoanRisk,
  quickRiskAssessment,
  batchRiskAssessment,
  analyzeRiskTrend,
} = require('../riskScoring.cjs');

describe('Risk Scoring Tests', () => {
  describe('calculateLoanRisk', () => {
    describe('Basic Risk Assessment', () => {
      test('should assess low risk correctly', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('LOW');
        expect(result.debtBurdenRatio).toBe(15);
        expect(result.riskScore).toBeLessThan(30);
        expect(result.riskLevel.color).toBe('GREEN');
        expect(result.riskLevel.priority).toBe('LOW');
      });

      test('should assess moderate risk correctly', () => {
        const params = {
          emi: 30000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('MODERATE');
        expect(result.debtBurdenRatio).toBe(30);
        expect(result.riskScore).toBeGreaterThanOrEqual(30);
        expect(result.riskScore).toBeLessThan(60);
        expect(result.riskLevel.color).toBe('YELLOW');
        expect(result.riskLevel.priority).toBe('MEDIUM');
      });

      test('should assess high risk correctly', () => {
        const params = {
          emi: 45000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('HIGH');
        expect(result.debtBurdenRatio).toBe(45);
        expect(result.riskScore).toBeGreaterThanOrEqual(60);
        expect(result.riskLevel.color).toBe('RED');
        expect(result.riskLevel.priority).toBe('HIGH');
      });

      test('should calculate debt burden ratio correctly', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params);

        expect(result.debtBurdenRatio).toBe(25);
        expect(result.totalMonthlyEMIs).toBe(25000);
      });

      test('should handle existing EMIs', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
          existingEMIs: 5000,
        };

        const result = calculateLoanRisk(params);

        expect(result.debtBurdenRatio).toBe(20);
        expect(result.totalMonthlyEMIs).toBe(20000);
      });
    });

    describe('Risk Factors Calculation', () => {
      test('should calculate basic risk factors', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          existingEMIs: 5000,
          loanAmount: 1000000,
          interestRate: 12,
          tenureYears: 5,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors).toBeDefined();
        expect(result.riskFactors.debtBurdenRatio).toBe(30);
        expect(result.riskFactors.existingDebtRatio).toBe(5);
        expect(result.riskFactors.loanToIncomeRatio).toBeDefined();
        expect(result.riskFactors.interestBurden).toBe(12);
        expect(result.riskFactors.tenureRisk).toBe('LOW');
      });

      test('should assess credit risk', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          creditScore: 750,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.creditRisk).toBe('EXCELLENT');
        expect(result.riskFactors.overallRiskScore).toBeDefined();
      });

      test('should assess employment risk', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          employmentStability: 'STABLE',
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.employmentRisk).toBe('LOW');
      });

      test('should assess age risk', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          age: 30,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.ageRisk).toBe('LOW');
      });

      test('should assess dependency risk', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          dependents: 2,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.dependencyRisk).toBe('MEDIUM');
      });

      test('should calculate disposable income', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          otherMonthlyExpenses: 15000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.disposableIncome).toBe(60000);
        expect(result.riskFactors.expenseRatio).toBe(15);
      });
    });

    describe('Risk Level Adjustment', () => {
      test('should upgrade risk level for poor credit', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
          creditScore: 550, // Poor credit
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('MODERATE'); // Upgraded from LOW
        expect(result.riskLevel.adjustingFactors).toContain('Poor credit history');
      });

      test('should upgrade risk level for unstable employment', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
          employmentStability: 'UNSTABLE',
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('MODERATE'); // Upgraded from LOW
        expect(result.riskLevel.adjustingFactors).toContain('Unstable employment');
      });

      test('should upgrade risk level for high dependency', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
          dependents: 5,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('MODERATE'); // Upgraded from LOW
        expect(result.riskLevel.adjustingFactors).toContain('High dependency burden');
      });

      test('should upgrade risk level for high risk loan type', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
          loanType: 'BUSINESS',
          interestRate: 20,
          tenureYears: 10,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('MODERATE'); // Upgraded from LOW
        expect(result.riskLevel.adjustingFactors).toContain('High-risk loan type');
      });

      test('should upgrade moderate to high for multiple factors', () => {
        const params = {
          emi: 30000,
          monthlyIncome: 100000,
          creditScore: 550, // Poor credit
          employmentStability: 'UNSTABLE', // Unstable employment
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('HIGH'); // Upgraded from MODERATE
        expect(result.riskLevel.adjustingFactors.length).toBeGreaterThan(1);
      });
    });

    describe('Risk Score Calculation', () => {
      test('should calculate risk score correctly for low risk', () => {
        const params = {
          emi: 10000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskScore).toBeLessThan(20);
      });

      test('should calculate risk score correctly for moderate risk', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskScore).toBeGreaterThanOrEqual(20);
        expect(result.riskScore).toBeLessThan(60);
      });

      test('should calculate risk score correctly for high risk', () => {
        const params = {
          emi: 50000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskScore).toBeGreaterThanOrEqual(60);
      });

      test('should include risk factor score in total score', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          creditScore: 550, // Adds to risk score
          employmentStability: 'UNSTABLE', // Adds to risk score
        };

        const result = calculateLoanRisk(params);

        expect(result.riskScore).toBeGreaterThan(25); // Base 10% + risk factors
      });
    });

    describe('Detailed Analysis', () => {
      test('should include detailed analysis when requested', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          includeDetailedAnalysis: true,
        });

        expect(result.analysis).toBeDefined();
        expect(result.analysis.debtBurdenAnalysis).toBeDefined();
        expect(result.analysis.cashFlowAnalysis).toBeDefined();
        expect(result.analysis.riskFactorAnalysis).toBeDefined();
        expect(result.analysis.scoreAnalysis).toBeDefined();
        expect(result.analysis.marketContext).toBeDefined();
      });

      test('should categorize debt burden correctly', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          includeDetailedAnalysis: true,
        });

        expect(result.analysis.debtBurdenAnalysis.category).toBe('GOOD');
        expect(result.analysis.debtBurdenAnalysis.description).toContain('safe limits');
      });

      test('should analyze cash flow correctly', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          includeDetailedAnalysis: true,
        });

        expect(result.analysis.cashFlowAnalysis.disposableIncome).toBe(75000);
        expect(result.analysis.cashFlowAnalysis.disposableRatio).toBe(75);
      });

      test('should include market context', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          includeDetailedAnalysis: true,
        });

        expect(result.analysis.marketContext.nepaliMarketAverage).toBe(25);
        expect(result.analysis.marketContext.marketPosition).toBeDefined();
        expect(result.analysis.marketContext.recommendation).toBeDefined();
      });
    });

    describe('Recommendations', () => {
      test('should generate recommendations for low risk', () => {
        const params = {
          emi: 15000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          includeRecommendations: true,
        });

        expect(result.recommendations).toBeDefined();
        expect(Array.isArray(result.recommendations)).toBe(true);
        expect(result.recommendations.length).toBeGreaterThan(0);

        const approvalRec = result.recommendations.find(rec => rec.type === 'APPROVAL');
        expect(approvalRec).toBeDefined();
        expect(approvalRec.action).toBe('APPLY');
      });

      test('should generate recommendations for moderate risk', () => {
        const params = {
          emi: 30000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          includeRecommendations: true,
        });

        const cautionRec = result.recommendations.find(rec => rec.type === 'CAUTION');
        expect(cautionRec).toBeDefined();
        expect(cautionRec.action).toBe('REVIEW');
      });

      test('should generate recommendations for high risk', () => {
        const params = {
          emi: 50000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          includeRecommendations: true,
        });

        const rejectionRec = result.recommendations.find(rec => rec.type === 'REJECTION');
        expect(rejectionRec).toBeDefined();
        expect(rejectionRec.action).toBe('POSTPONE');
      });

      test('should include specific recommendations based on factors', () => {
        const params = {
          emi: 30000,
          monthlyIncome: 100000,
          existingEMIs: 20000, // High existing debt
        };

        const result = calculateLoanRisk(params, {
          includeRecommendations: true,
        });

        const debtConsolidationRec = result.recommendations.find(rec => rec.type === 'DEBT_CONSOLIDATION');
        expect(debtConsolidationRec).toBeDefined();
      });

      test('should include emergency fund recommendation for low disposable income', () => {
        const params = {
          emi: 45000,
          monthlyIncome: 50000,
        };

        const result = calculateLoanRisk(params, {
          includeRecommendations: true,
        });

        const emergencyFundRec = result.recommendations.find(rec => rec.type === 'EMERGENCY_FUND');
        expect(emergencyFundRec).toBeDefined();
      });
    });

    describe('Edge Cases', () => {
      test('should handle minimum income', () => {
        const params = {
          emi: 5000,
          monthlyIncome: 10000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('HIGH');
        expect(result.debtBurdenRatio).toBe(50);
      });

      test('should handle very high income', () => {
        const params = {
          emi: 50000,
          monthlyIncome: 500000,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskLevel.level).toBe('LOW');
        expect(result.debtBurdenRatio).toBe(10);
      });

      test('should handle zero existing EMIs', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          existingEMIs: 0,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.existingDebtRatio).toBe(0);
      });

      test('should handle very high existing EMIs', () => {
        const params = {
          emi: 5000,
          monthlyIncome: 100000,
          existingEMIs: 96000,
        };

        expect(() => calculateLoanRisk(params)).toThrow('EMI cannot exceed monthly income');
      });

      test('should handle zero interest rate', () => {
        const params = {
          emi: 20000,
          monthlyIncome: 100000,
          loanAmount: 1200000,
          interestRate: 0,
          tenureYears: 5,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.interestBurden).toBe(0);
      });

      test('should handle very high interest rate', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
          loanAmount: 1000000,
          interestRate: 40,
          tenureYears: 5,
        };

        const result = calculateLoanRisk(params);

        expect(result.riskFactors.tenureRisk).toBe('LOW');
        expect(result.riskFactors.interestBurden).toBe(40);
      });
    });

    describe('Input Validation', () => {
      test('should validate EMI input', () => {
        expect(() => calculateLoanRisk({ emi: -1000, monthlyIncome: 100000 }))
          .toThrow('EMI must be a positive number');
        
        expect(() => calculateLoanRisk({ emi: 0, monthlyIncome: 100000 }))
          .toThrow('EMI must be a positive number');
      });

      test('should validate monthly income input', () => {
        expect(() => calculateLoanRisk({ emi: 10000, monthlyIncome: -1000 }))
          .toThrow('Monthly income must be a positive number');
        
        expect(() => calculateLoanRisk({ emi: 10000, monthlyIncome: 0 }))
          .toThrow('Monthly income must be a positive number');
      });

      test('should validate EMI vs income relationship', () => {
        expect(() => calculateLoanRisk({ emi: 150000, monthlyIncome: 100000 }))
          .toThrow('EMI cannot exceed monthly income');
      });

      test('should validate Nepali market minimum income', () => {
        expect(() => calculateLoanRisk({ emi: 1000, monthlyIncome: 5000 }))
          .toThrow('Monthly income seems too low for Nepali market context');
      });

      test('should validate unusually high EMI', () => {
        expect(() => calculateLoanRisk({ emi: 92000, monthlyIncome: 100000 }))
          .toThrow('EMI seems unusually high relative to income');
      });
    });

    describe('Options Configuration', () => {
      test('should respect includeRecommendations option', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const resultWithoutRecs = calculateLoanRisk(params, {
          includeRecommendations: false,
        });

        const resultWithRecs = calculateLoanRisk(params, {
          includeRecommendations: true,
        });

        expect(resultWithoutRecs.recommendations).toBeUndefined();
        expect(resultWithRecs.recommendations).toBeDefined();
      });

      test('should respect includeDetailedAnalysis option', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const resultWithoutAnalysis = calculateLoanRisk(params, {
          includeDetailedAnalysis: false,
        });

        const resultWithAnalysis = calculateLoanRisk(params, {
          includeDetailedAnalysis: true,
        });

        expect(resultWithoutAnalysis.analysis).toBeNull();
        expect(resultWithAnalysis.analysis).toBeDefined();
      });

      test('should use custom currency and locale', () => {
        const params = {
          emi: 25000,
          monthlyIncome: 100000,
        };

        const result = calculateLoanRisk(params, {
          currency: 'USD',
          locale: 'en-US',
        });

        expect(result.assessment.currency).toBe('USD');
        expect(result.assessment.locale).toBe('en-US');
      });
    });
  });

  describe('quickRiskAssessment', () => {
    describe('Basic Quick Assessment', () => {
      test('should assess low risk quickly', () => {
        const result = quickRiskAssessment(15000, 100000);

        expect(result.riskLevel).toBe('LOW');
        expect(result.debtBurdenRatio).toBe(15);
        expect(result.explanation).toContain('Low risk');
        expect(result.recommendation).toContain('Proceed with confidence');
      });

      test('should assess moderate risk quickly', () => {
        const result = quickRiskAssessment(30000, 100000);

        expect(result.riskLevel).toBe('MODERATE');
        expect(result.debtBurdenRatio).toBe(30);
        expect(result.explanation).toContain('Moderate risk');
        expect(result.recommendation).toContain('Proceed with caution');
      });

      test('should assess high risk quickly', () => {
        const result = quickRiskAssessment(45000, 100000);

        expect(result.riskLevel).toBe('HIGH');
        expect(result.debtBurdenRatio).toBe(45);
        expect(result.explanation).toContain('High risk');
        expect(result.recommendation).toContain('Reconsider');
      });

      test('should calculate debt burden ratio correctly', () => {
        const result = quickRiskAssessment(25000, 100000);

        expect(result.debtBurdenRatio).toBe(25);
      });
    });

    describe('Quick Assessment Edge Cases', () => {
      test('should handle boundary values', () => {
        expect(quickRiskAssessment(19999, 100000).riskLevel).toBe('LOW');
        expect(quickRiskAssessment(20000, 100000).riskLevel).toBe('LOW');
        expect(quickRiskAssessment(20001, 100000).riskLevel).toBe('MODERATE');
        expect(quickRiskAssessment(34999, 100000).riskLevel).toBe('MODERATE');
        expect(quickRiskAssessment(35000, 100000).riskLevel).toBe('MODERATE');
        expect(quickRiskAssessment(35001, 100000).riskLevel).toBe('HIGH');
      });

      test('should handle very low ratios', () => {
        const result = quickRiskAssessment(5000, 100000);

        expect(result.riskLevel).toBe('LOW');
        expect(result.debtBurdenRatio).toBe(5);
      });

      test('should handle very high ratios', () => {
        const result = quickRiskAssessment(80000, 100000);

        expect(result.riskLevel).toBe('HIGH');
        expect(result.debtBurdenRatio).toBe(80);
      });
    });

    describe('Quick Assessment Validation', () => {
      test('should validate EMI input', () => {
        expect(() => quickRiskAssessment(-1000, 100000))
          .toThrow('EMI must be a positive number');
        
        expect(() => quickRiskAssessment(0, 100000))
          .toThrow('EMI must be a positive number');
      });

      test('should validate monthly income input', () => {
        expect(() => quickRiskAssessment(10000, -1000))
          .toThrow('Monthly income must be a positive number');
        
        expect(() => quickRiskAssessment(10000, 0))
          .toThrow('Monthly income must be a positive number');
      });

      test('should validate EMI vs income relationship', () => {
        expect(() => quickRiskAssessment(150000, 100000))
          .toThrow('EMI cannot exceed monthly income');
      });
    });
  });

  describe('batchRiskAssessment', () => {
    describe('Basic Batch Assessment', () => {
      test('should assess multiple applications', () => {
        const applications = [
          { emi: 15000, monthlyIncome: 100000 },
          { emi: 30000, monthlyIncome: 100000 },
          { emi: 45000, monthlyIncome: 100000 },
        ];

        const results = batchRiskAssessment(applications);

        expect(results).toHaveLength(3);
        expect(results[0].riskLevel).toBeDefined();
        expect(results[1].riskLevel).toBeDefined();
        expect(results[2].riskLevel).toBeDefined();
      });

      test('should include application index', () => {
        const applications = [
          { emi: 15000, monthlyIncome: 100000 },
          { emi: 30000, monthlyIncome: 100000 },
        ];

        const results = batchRiskAssessment(applications);

        expect(results[0].applicationIndex).toBe(0);
        expect(results[1].applicationIndex).toBe(1);
      });

      test('should handle mixed risk levels', () => {
        const applications = [
          { emi: 15000, monthlyIncome: 100000 }, // LOW
          { emi: 30000, monthlyIncome: 100000 }, // MODERATE
          { emi: 45000, monthlyIncome: 100000 }, // HIGH
        ];

        const results = batchRiskAssessment(applications);

        expect(results[0].riskLevel).toBe('LOW');
        expect(results[1].riskLevel).toBe('MODERATE');
        expect(results[2].riskLevel).toBe('HIGH');
      });
    });

    describe('Batch Assessment Edge Cases', () => {
      test('should handle empty applications array', () => {
        expect(() => batchRiskAssessment([]))
          .toThrow('At least one loan application is required');
      });

      test('should handle invalid input type', () => {
        expect(() => batchRiskAssessment('invalid'))
          .toThrow('Loan applications must be an array');
      });

      test('should handle too many applications', () => {
        const applications = Array.from({ length: 11 }, (_, i) => ({
          emi: 25000,
          monthlyIncome: 100000,
        }));

        expect(() => batchRiskAssessment(applications))
          .toThrow('Maximum 10 loan applications can be assessed at once');
      });

      test('should handle invalid applications', () => {
        const applications = [
          { emi: 15000, monthlyIncome: 100000 }, // Valid
          { emi: -1000, monthlyIncome: 100000 }, // Invalid
        ];

        const results = batchRiskAssessment(applications);

        expect(results).toHaveLength(2);
        expect(results[0].riskLevel).toBeDefined();
        expect(results[1].error).toBeDefined();
        expect(results[1].riskLevel).toBe('ERROR');
      });
    });

    describe('Batch Assessment Performance', () => {
      test('should handle maximum applications efficiently', () => {
        const start = Date.now();

        const applications = Array.from({ length: 10 }, (_, i) => ({
          emi: 15000 + i * 5000,
          monthlyIncome: 100000,
        }));

        const results = batchRiskAssessment(applications);

        const end = Date.now();
        const duration = end - start;

        expect(results).toHaveLength(10);
        expect(duration).toBeLessThan(1000); // Should complete within 1 second
      });
    });
  });

  describe('analyzeRiskTrend', () => {
    describe('Basic Trend Analysis', () => {
      test('should analyze increasing risk trend', () => {
        const historicalData = [
          {
            riskLevel: { level: 'LOW' },
            debtBurdenRatio: 15,
            riskScore: 20,
            assessment: { timestamp: '2024-01-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
            assessment: { timestamp: '2024-02-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'HIGH' },
            debtBurdenRatio: 40,
            riskScore: 70,
            assessment: { timestamp: '2024-03-01T00:00:00Z' },
          },
        ];

        const result = analyzeRiskTrend(historicalData);

        expect(result.trends).toBeDefined();
        expect(result.trends.debtBurdenTrend).toBe('INCREASING');
        expect(result.trends.riskScoreTrend).toBe('INCREASING');
        expect(result.trends.riskLevelTrend).toBe('WORSENING');
      });

      test('should analyze decreasing risk trend', () => {
        const historicalData = [
          {
            riskLevel: { level: 'HIGH' },
            debtBurdenRatio: 40,
            riskScore: 70,
            assessment: { timestamp: '2024-01-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
            assessment: { timestamp: '2024-02-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'LOW' },
            debtBurdenRatio: 15,
            riskScore: 20,
            assessment: { timestamp: '2024-03-01T00:00:00Z' },
          },
        ];

        const result = analyzeRiskTrend(historicalData);

        expect(result.trends.debtBurdenTrend).toBe('DECREASING');
        expect(result.trends.riskScoreTrend).toBe('DECREASING');
        expect(result.trends.riskLevelTrend).toBe('IMPROVING');
      });

      test('should analyze stable trend', () => {
        const historicalData = [
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
            assessment: { timestamp: '2024-01-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
            assessment: { timestamp: '2024-02-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
            assessment: { timestamp: '2024-03-01T00:00:00Z' },
          },
        ];

        const result = analyzeRiskTrend(historicalData);

        expect(result.trends.debtBurdenTrend).toBe('STABLE');
        expect(result.trends.riskScoreTrend).toBe('STABLE');
        expect(result.trends.riskLevelTrend).toBe('STABLE');
      });
    });

    describe('Trend Analysis Features', () => {
      test('should generate summary', () => {
        const historicalData = [
          {
            riskLevel: { level: 'LOW' },
            debtBurdenRatio: 15,
            riskScore: 20,
            assessment: { timestamp: '2024-01-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
            assessment: { timestamp: '2024-02-01T00:00:00Z' },
          },
        ];

        const result = analyzeRiskTrend(historicalData);

        expect(result.summary).toBeDefined();
        expect(typeof result.summary).toBe('string');
      });

      test('should generate recommendation', () => {
        const historicalData = [
          {
            riskLevel: { level: 'LOW' },
            debtBurdenRatio: 15,
            riskScore: 20,
            assessment: { timestamp: '2024-01-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'HIGH' },
            debtBurdenRatio: 40,
            riskScore: 70,
            assessment: { timestamp: '2024-02-01T00:00:00Z' },
          },
        ];

        const result = analyzeRiskTrend(historicalData);

        expect(result.recommendation).toBeDefined();
        expect(typeof result.recommendation).toBe('string');
      });

      test('should include analysis date', () => {
        const historicalData = [
          {
            riskLevel: { level: 'LOW' },
            debtBurdenRatio: 15,
            riskScore: 20,
            assessment: { timestamp: '2024-01-01T00:00:00Z' },
          },
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
            assessment: { timestamp: '2024-02-01T00:00:00Z' },
          },
        ];

        const result = analyzeRiskTrend(historicalData);

        expect(result.analysisDate).toBeDefined();
        expect(result.analysisDate).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
      });
    });

    describe('Trend Analysis Edge Cases', () => {
      test('should handle insufficient data', () => {
        expect(() => analyzeRiskTrend([]))
          .toThrow('At least 2 historical assessments are required for trend analysis');

        expect(() => analyzeRiskTrend([{ riskLevel: { level: 'LOW' } }]))
          .toThrow('At least 2 historical assessments are required for trend analysis');
      });

      test('should handle single data point', () => {
        const historicalData = [
          {
            riskLevel: { level: 'LOW' },
            debtBurdenRatio: 15,
            riskScore: 20,
            assessment: { timestamp: '2024-01-01T00:00:00Z' },
          },
        ];

        expect(() => analyzeRiskTrend(historicalData))
          .toThrow('At least 2 historical assessments are required for trend analysis');
      });

      test('should handle missing timestamp', () => {
        const historicalData = [
          {
            riskLevel: { level: 'LOW' },
            debtBurdenRatio: 15,
            riskScore: 20,
          },
          {
            riskLevel: { level: 'MODERATE' },
            debtBurdenRatio: 25,
            riskScore: 40,
          },
        ];

        // Should still work but might have sorting issues
        const result = analyzeRiskTrend(historicalData);
        expect(result.trends).toBeDefined();
      });
    });

    describe('Trend Analysis Performance', () => {
      test('should handle large dataset efficiently', () => {
        const start = Date.now();

        const historicalData = Array.from({ length: 100 }, (_, i) => ({
          riskLevel: { level: i % 3 === 0 ? 'LOW' : i % 3 === 1 ? 'MODERATE' : 'HIGH' },
          debtBurdenRatio: 15 + i * 0.5,
          riskScore: 20 + i * 2,
          assessment: { timestamp: new Date(Date.now() - i * 86400000).toISOString() },
        }));

        const result = analyzeRiskTrend(historicalData);

        const end = Date.now();
        const duration = end - start;

        expect(result.trends).toBeDefined();
        expect(duration).toBeLessThan(500); // Should be fast
      });
    });
  });

  describe('Integration Tests', () => {
    test('should handle complete risk assessment workflow', () => {
      // Step 1: Basic assessment
      const basicResult = calculateLoanRisk({
        emi: 25000,
        monthlyIncome: 100000,
        loanAmount: 1000000,
        interestRate: 12,
        tenureYears: 5,
        creditScore: 650,
        age: 30,
        dependents: 2,
      });

      expect(basicResult.riskLevel).toBeDefined();
      expect(basicResult.riskScore).toBeDefined();

      // Step 2: Quick assessment
      const quickResult = quickRiskAssessment(25000, 100000);
      expect(quickResult.riskLevel).toBeDefined();

      // Step 3: Verify consistency
      expect(basicResult.riskLevel.level).toBe(quickResult.riskLevel);
      expect(basicResult.debtBurdenRatio).toBe(quickResult.debtBurdenRatio);
    });

    test('should handle batch assessment with mixed results', () => {
      const applications = [
        { emi: 15000, monthlyIncome: 100000, creditScore: 750 }, // LOW
        { emi: 30000, monthlyIncome: 100000, creditScore: 550 }, // MODERATE
        { emi: 45000, monthlyIncome: 100000, creditScore: 450 }, // HIGH
        { emi: -1000, monthlyIncome: 100000 }, // ERROR
      ];

      const results = batchRiskAssessment(applications);

      expect(results).toHaveLength(4);
      expect(results[0].riskLevel).toBe('LOW');
      expect(results[1].riskLevel).toBe('MODERATE');
      expect(results[2].riskLevel).toBe('HIGH');
      expect(results[3].riskLevel).toBe('ERROR');
    });

    test('should handle trend analysis with real-world data', () => {
      // Simulate realistic risk progression
      const historicalData = [
        {
          riskLevel: { level: 'LOW' },
          debtBurdenRatio: 12,
          riskScore: 18,
          assessment: { timestamp: '2024-01-01T00:00:00Z' },
        },
        {
          riskLevel: { level: 'LOW' },
          debtBurdenRatio: 15,
          riskScore: 22,
          assessment: { timestamp: '2024-02-01T00:00:00Z' },
        },
        {
          riskLevel: { level: 'MODERATE' },
          debtBurdenRatio: 28,
          riskScore: 45,
          assessment: { timestamp: '2024-03-01T00:00:00Z' },
        },
        {
          riskLevel: { level: 'MODERATE' },
          debtBurdenRatio: 32,
          riskScore: 52,
          assessment: { timestamp: '2024-04-01T00:00:00Z' },
        },
        {
          riskLevel: { level: 'HIGH' },
          debtBurdenRatio: 45,
          riskScore: 75,
          assessment: { timestamp: '2024-05-01T00:00:00Z' },
        },
      ];

      const result = analyzeRiskTrend(historicalData);

      expect(result.trends.debtBurdenTrend).toBe('INCREASING');
      expect(result.trends.riskScoreTrend).toBe('INCREASING');
      expect(result.trends.riskLevelTrend).toBe('WORSENING');
      expect(result.summary).toContain('increasing');
      expect(result.recommendation).toContain('deteriorating');
    });

    test('should maintain consistency across all functions', () => {
      const params = {
        emi: 25000,
        monthlyIncome: 100000,
        creditScore: 650,
        age: 30,
        employmentStability: 'STABLE',
      };

      const fullResult = calculateLoanRisk(params);
      const quickResult = quickRiskAssessment(params.emi, params.monthlyIncome);

      expect(fullResult.riskLevel.level).toBe(quickResult.riskLevel);
      expect(fullResult.debtBurdenRatio).toBe(quickResult.debtBurdenRatio);
    });

    test('should handle Nepali market context correctly', () => {
      const params = {
        emi: 25000,
        monthlyIncome: 50000, // Average Nepali income
        loanType: 'HOME',
        interestRate: 11,
        tenureYears: 20,
      };

      const result = calculateLoanRisk(params, {
        includeDetailedAnalysis: true,
      });

      expect(result.analysis.marketContext.nepaliMarketAverage).toBe(25);
      expect(result.analysis.marketContext.marketPosition).toBeDefined();
      expect(result.analysis.marketContext.recommendation).toBeDefined();
    });
  });

  describe('Performance Tests', () => {
    test('should handle large number of calculations efficiently', () => {
      const start = Date.now();

      // Perform 1000 risk assessments
      for (let i = 0; i < 1000; i++) {
        const emi = Math.min(25000 + i * 100, 89000); // cap at 89% of income
        calculateLoanRisk({
          emi,
          monthlyIncome: 100000,
        });
      }

      const end = Date.now();
      const duration = end - start;

      expect(duration).toBeLessThan(2000); // Should complete within 2 seconds
    });

    test('should handle batch assessment efficiently', () => {
      const start = Date.now();

      const applications = Array.from({ length: 10 }, (_, i) => ({
        emi: 15000 + i * 5000,
        monthlyIncome: 100000,
        creditScore: 650 + i * 10,
        age: 25 + i,
      }));

      const results = batchRiskAssessment(applications);

      const end = Date.now();
      const duration = end - start;

      expect(results).toHaveLength(10);
      expect(duration).toBeLessThan(1000); // Should complete within 1 second
    });

    test('should handle trend analysis efficiently', () => {
      const start = Date.now();

      const historicalData = Array.from({ length: 50 }, (_, i) => ({
        riskLevel: { level: i % 3 === 0 ? 'LOW' : i % 3 === 1 ? 'MODERATE' : 'HIGH' },
        debtBurdenRatio: 15 + i * 0.5,
        riskScore: 20 + i * 2,
        assessment: { timestamp: new Date(Date.now() - i * 86400000).toISOString() },
      }));

      const result = analyzeRiskTrend(historicalData);

      const end = Date.now();
      const duration = end - start;

      expect(result.trends).toBeDefined();
      expect(duration).toBeLessThan(500); // Should be fast
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid inputs gracefully', () => {
      expect(() => calculateLoanRisk(null)).toThrow();
      expect(() => calculateLoanRisk(undefined)).toThrow();
      expect(() => calculateLoanRisk('invalid')).toThrow();
    });

    test('should handle malformed data', () => {
      expect(() => calculateLoanRisk({ emi: 'invalid', monthlyIncome: 100000 }))
        .toThrow('EMI must be a positive number');
      
      expect(() => calculateLoanRisk({ emi: 25000, monthlyIncome: 'invalid' }))
        .toThrow('Monthly income must be a positive number');
    });

    test('should handle edge cases without crashing', () => {
      expect(() => quickRiskAssessment(0, 0)).toThrow();
      expect(() => batchRiskAssessment([])).toThrow();
      expect(() => analyzeRiskTrend([])).toThrow();
    });

    test('should provide meaningful error messages', () => {
      try {
        calculateLoanRisk({ emi: -1000, monthlyIncome: 100000 });
      } catch (error) {
        expect(error.message).toBe('EMI must be a positive number');
      }

      try {
        calculateLoanRisk({ emi: 25000, monthlyIncome: -1000 });
      } catch (error) {
        expect(error.message).toBe('Monthly income must be a positive number');
      }

      try {
        calculateLoanRisk({ emi: 150000, monthlyIncome: 100000 });
      } catch (error) {
        expect(error.message).toBe('EMI cannot exceed monthly income');
      }
    });
  });

  describe('Business Logic Validation', () => {
    test('should apply Nepali market rules', () => {
      const lowIncomeParams = {
        emi: 5000,
        monthlyIncome: 8000, // Below practical minimum
      };

      expect(() => calculateLoanRisk(lowIncomeParams))
        .toThrow('Monthly income seems too low for Nepali market context');

      const highEMIParams = {
        emi: 92000,
        monthlyIncome: 100000, // Very high EMI ratio
      };

      expect(() => calculateLoanRisk(highEMIParams))
        .toThrow('EMI seems unusually high relative to income');
    });

    test('should validate debt burden ratio thresholds', () => {
      const lowRisk = calculateLoanRisk({ emi: 15000, monthlyIncome: 100000 });
      expect(lowRisk.riskLevel.level).toBe('LOW');
      expect(lowRisk.debtBurdenRatio).toBeLessThan(20);

      const moderateRisk = calculateLoanRisk({ emi: 30000, monthlyIncome: 100000 });
      expect(moderateRisk.riskLevel.level).toBe('MODERATE');
      expect(moderateRisk.debtBurdenRatio).toBeGreaterThanOrEqual(20);
      expect(moderateRisk.debtBurdenRatio).toBeLessThanOrEqual(35);

      const highRisk = calculateLoanRisk({ emi: 45000, monthlyIncome: 100000 });
      expect(highRisk.riskLevel.level).toBe('HIGH');
      expect(highRisk.debtBurdenRatio).toBeGreaterThan(35);
    });

    test('should adjust risk level based on multiple factors', () => {
      // Low base risk but poor credit
      const poorCreditResult = calculateLoanRisk({
        emi: 15000,
        monthlyIncome: 100000,
        creditScore: 550, // Poor credit
      });

      expect(poorCreditResult.riskLevel.level).toBe('MODERATE');

      // Low base risk but unstable employment
      const unstableEmploymentResult = calculateLoanRisk({
        emi: 15000,
        monthlyIncome: 100000,
        employmentStability: 'UNSTABLE',
      });

      expect(unstableEmploymentResult.riskLevel.level).toBe('MODERATE');

      // Multiple negative factors
      const multipleRisksResult = calculateLoanRisk({
        emi: 15000,
        monthlyIncome: 100000,
        creditScore: 550,
        employmentStability: 'UNSTABLE',
        age: 20, // Young age
        dependents: 4, // High dependencies
      });

      expect(multipleRisksResult.riskLevel.level).toBe('HIGH');
    });
  });
});
