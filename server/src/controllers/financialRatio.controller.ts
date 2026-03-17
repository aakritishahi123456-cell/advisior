import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { FinancialRatioService, FinancialRatios } from '../services/financialRatio.service';
import { asyncHandler } from '../middleware/errorHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Validation schemas
const calculateRatiosSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  previousYear: z.number().int().min(2000).max(new Date().getFullYear()).optional(),
});

const getRatiosSchema = z.object({
  startYear: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
  endYear: z.coerce.number().int().min(2000).max(new Date().getFullYear()).optional(),
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

const ratioAnalysisSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear()),
});

export class FinancialRatioController {
  /**
   * Calculate financial ratios for a company
   */
  static calculateRatios = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { year, previousYear } = req.body;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Calculate ratios
    const ratios = await FinancialRatioService.calculateCompanyRatios(
      company.id,
      year,
      previousYear
    );

    res.json({
      success: true,
      data: {
        companyId: company.id,
        symbol: company.symbol,
        year,
        previousYear,
        ratios,
        message: 'Financial ratios calculated successfully',
      },
    });
  });

  /**
   * Get financial ratios for a company
   */
  static getRatios = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { startYear, endYear, limit } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get ratios
    const ratios = await FinancialRatioService.getCompanyRatios(
      company.id,
      startYear ? Number(startYear) : undefined,
      endYear ? Number(endYear) : undefined,
      Number(limit)
    );

    res.json({
      success: true,
      data: {
        companyId: company.id,
        symbol: company.symbol,
        companyName: company.name,
        ratios,
        message: 'Financial ratios retrieved successfully',
      },
    });
  });

  /**
   * Get ratio analysis for a company
   */
  static getRatioAnalysis = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { year } = req.body;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get ratio analysis
    const analysis = await FinancialRatioService.getRatioAnalysis(company.id, Number(year));

    res.json({
      success: true,
      data: {
        companyId: company.id,
        symbol: company.symbol,
        companyName: company.name,
        year: Number(year),
        analysis,
        message: 'Ratio analysis completed successfully',
      },
    });
  });

  /**
   * Calculate ratios for multiple companies
   */
  static calculateBatchRatios = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companies } = req.body;

    if (!Array.isArray(companies) || companies.length === 0) {
      throw createError('Companies array is required', 400);
    }

    const results = [];

    for (const companyData of companies) {
      try {
        const company = await prisma.company.findUnique({
          where: { symbol: companyData.symbol.toUpperCase() },
        });

        if (!company) {
          results.push({
            symbol: companyData.symbol,
            error: 'Company not found',
            ratios: null,
          });
          continue;
        }

        const ratios = await FinancialRatioService.calculateCompanyRatios(
          company.id,
          companyData.year,
          companyData.previousYear
        );

        results.push({
          symbol: companyData.symbol,
          companyId: company.id,
          year: companyData.year,
          ratios,
          error: null,
        });
      } catch (error: any) {
        logger.error({
          action: 'batch_ratio_calculation_error',
          symbol: companyData.symbol,
          error: error.message,
        });
        results.push({
          symbol: companyData.symbol,
          error: error.message,
          ratios: null,
        });
      }
    }

    res.json({
      success: true,
      data: {
        results,
        message: 'Batch ratio calculation completed',
      },
    });
  });

  /**
   * Get ratio comparison across companies
   */
  static getRatioComparison = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbols, year } = req.body;

    if (!Array.isArray(symbols) || symbols.length === 0) {
      throw createError('Symbols array is required', 400);
    }

    if (!year) {
      throw createError('Year is required', 400);
    }

    const comparisons = [];

    for (const symbol of symbols) {
      try {
        const company = await prisma.company.findUnique({
          where: { symbol: symbol.toUpperCase() },
        });

        if (!company) {
          continue;
        }

        const ratios = await FinancialRatioService.getCompanyRatios(
          company.id,
          Number(year),
          Number(year),
          1
        );

        if (ratios.length > 0) {
          comparisons.push({
            symbol: company.symbol,
            companyName: company.name,
            companyId: company.id,
            year: Number(year),
            ratios: ratios[0].ratios,
          });
        }
      } catch (error: any) {
        logger.error({
          action: 'ratio_comparison_error',
          symbol,
          error: error.message,
        });
      }
    }

    // Sort by ROE if available
    comparisons.sort((a, b) => {
      if (a.ratios.roe && b.ratios.roe) {
        return b.ratios.roe - a.ratios.roe;
      }
      return 0;
    });

    res.json({
      success: true,
      data: {
        year: Number(year),
        comparisons,
        message: 'Ratio comparison completed',
      },
    });
  });

  /**
   * Get industry benchmarks
   */
  static getIndustryBenchmarks = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { industry, ratios } = req.body;

    if (!industry) {
      throw createError('Industry is required', 400);
    }

    if (!ratios) {
      throw createError('Ratios object is required', 400);
    }

    const benchmarks = await FinancialRatioService.getIndustryBenchmarks(industry, ratios);

    res.json({
      success: true,
      data: benchmarks,
      message: 'Industry benchmarks retrieved successfully',
    });
  });

  /**
   * Compare company to industry benchmarks
   */
  static compareToIndustry = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol, year, industry } = req.body;

    if (!symbol || !year || !industry) {
      throw createError('Symbol, year, and industry are required', 400);
    }

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Compare to industry
    const comparison = await FinancialRatioService.compareToIndustry(
      company.id,
      Number(year),
      industry
    );

    res.json({
      success: true,
      data: comparison,
      message: 'Industry comparison completed successfully',
    });
  });

  /**
   * Get ratio trends over time
   */
  static getRatioTrends = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { years = 5 } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get ratios for multiple years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - Number(years) + 1;

    const ratios = await FinancialRatioService.getCompanyRatios(
      company.id,
      startYear,
      currentYear,
      Number(years)
    );

    // Calculate trends
    const trends = {
      roeTrend: this.calculateTrend(ratios.map(r => r.ratios.roe)),
      debtRatioTrend: this.calculateTrend(ratios.map(r => r.ratios.debtRatio)),
      profitMarginTrend: this.calculateTrend(ratios.map(r => r.ratios.profitMargin)),
      currentRatioTrend: this.calculateTrend(ratios.map(r => r.ratios.currentRatio)),
    };

    res.json({
      success: true,
      data: {
        symbol: company.symbol,
        companyName: company.name,
        years: ratios.map(r => r.year),
        ratios,
        trends,
        message: 'Ratio trends calculated successfully',
      },
    });
  });

  /**
   * Calculate trend direction and percentage change
   */
  private static calculateTrend(values: Array<number | null>): {
    direction: 'up' | 'down' | 'stable' | 'unknown';
    percentageChange: number | null;
    average: number | null;
  } {
    const validValues = values.filter(v => v !== null && v !== undefined) as number[];
    
    if (validValues.length < 2) {
      return {
        direction: 'unknown',
        percentageChange: null,
        average: validValues.length > 0 ? validValues[0] : null,
      };
    }

    const first = validValues[0];
    const last = validValues[validValues.length - 1];
    const average = validValues.reduce((sum, val) => sum + val, 0) / validValues.length;

    let direction: 'up' | 'down' | 'stable' | 'unknown' = 'stable';
    let percentageChange: number | null = null;

    if (last > first) {
      direction = 'up';
      percentageChange = ((last - first) / first) * 100;
    } else if (last < first) {
      direction = 'down';
      percentageChange = ((last - first) / first) * 100;
    }

    return {
      direction,
      percentageChange,
      average,
    };
  }

  /**
   * Validate and format ratio values
   */
  static validateRatios(req: AuthRequest, res: Response, next: any) {
    const { ratios } = req.body;

    if (!ratios) {
      return next();
    }

    // Validate each ratio
    const validatedRatios: any = {};
    const errors: string[] = [];

    Object.entries(ratios).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        const numValue = Number(value);
        
        if (isNaN(numValue)) {
          errors.push(`${key} must be a valid number`);
          return;
        }

        if (!FinancialRatioService.validateRatio(numValue, key)) {
          errors.push(`${key} is outside valid range`);
          return;
        }

        validatedRatios[key] = numValue;
      } else {
        validatedRatios[key] = null;
      }
    });

    if (errors.length > 0) {
      throw createError(`Invalid ratio values: ${errors.join(', ')}`, 400);
    }

    req.body.ratios = validatedRatios;
    next();
  }

  /**
   * Get ratio statistics
   */
  static getRatioStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get all ratios for the company
    const ratios = await FinancialRatioService.getCompanyRatios(company.id, undefined, undefined, 50);

    if (ratios.length === 0) {
      return res.json({
        success: true,
        data: {
          symbol: company.symbol,
          companyName: company.name,
          statistics: {
            totalYears: 0,
            averageRoe: null,
            averageDebtRatio: null,
            averageProfitMargin: null,
            averageCurrentRatio: null,
            bestYear: null,
            worstYear: null,
          },
          message: 'No ratio data available',
        },
      });
    }

    // Calculate statistics
    const validRatios = {
      roe: ratios.map(r => r.ratios.roe).filter(v => v !== null) as number[],
      debtRatio: ratios.map(r => r.ratios.debtRatio).filter(v => v !== null) as number[],
      profitMargin: ratios.map(r => r.ratios.profitMargin).filter(v => v !== null) as number[],
      currentRatio: ratios.map(r => r.ratios.currentRatio).filter(v => v !== null) as number[],
    };

    const statistics = {
      totalYears: ratios.length,
      averageRoe: validRatios.roe.length > 0 ? validRatios.roe.reduce((sum, val) => sum + val, 0) / validRatios.roe.length : null,
      averageDebtRatio: validRatios.debtRatio.length > 0 ? validRatios.debtRatio.reduce((sum, val) => sum + val, 0) / validRatios.debtRatio.length : null,
      averageProfitMargin: validRatios.profitMargin.length > 0 ? validRatios.profitMargin.reduce((sum, val) => sum + val, 0) / validRatios.profitMargin.length : null,
      averageCurrentRatio: validRatios.currentRatio.length > 0 ? validRatios.currentRatio.reduce((sum, val) => sum + val, 0) / validRatios.currentRatio.length : null,
      bestYear: null,
      worstYear: null,
    };

    // Find best and worst years based on overall score
    const yearScores = ratios.map(r => {
      const score = this.calculateOverallScore(r.ratios);
      return { year: r.year, score };
    });

    const sortedScores = yearScores.sort((a, b) => b.score - a.score);
    if (sortedScores.length > 0) {
      statistics.bestYear = sortedScores[0].year;
      statistics.worstYear = sortedScores[sortedScores.length - 1].year;
    }

    res.json({
      success: true,
      data: {
        symbol: company.symbol,
        companyName: company.name,
        statistics,
        message: 'Ratio statistics calculated successfully',
      },
    });
  });

  /**
   * Calculate overall score for a set of ratios
   */
  private static calculateOverallScore(ratios: FinancialRatios): number {
    let score = 0;
    let count = 0;

    if (ratios.roe !== undefined) {
      score += Math.min(25, Math.max(0, ratios.roe / 20 * 25));
      count++;
    }

    if (ratios.debtRatio !== undefined) {
      score += Math.max(0, (100 - ratios.debtRatio) / 100 * 25);
      count++;
    }

    if (ratios.profitMargin !== undefined) {
      score += Math.min(25, Math.max(0, ratios.profitMargin / 20 * 25));
      count++;
    }

    if (ratios.currentRatio !== undefined) {
      score += Math.min(25, Math.max(0, ratios.currentRatio / 2 * 25));
      count++;
    }

    return count > 0 ? score / count : 0;
  }

  /**
   * Format ratio values for display
   */
  static formatRatios = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ratios } = req.body;

    if (!ratios) {
      return res.json({
        success: true,
        data: {
          formattedRatios: {},
          message: 'No ratios to format',
        },
      });
    }

    const formattedRatios: any = {};

    Object.entries(ratios).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        formattedRatios[key] = FinancialRatioService.formatRatio(Number(value));
      } else {
        formattedRatios[key] = 'N/A';
      }
    });

    res.json({
      success: true,
      data: {
        formattedRatios,
        message: 'Ratios formatted successfully',
      },
    });
  });

  /**
   * Get color coding for ratios
   */
  static getRatioColors = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { ratios } = req.body;

    if (!ratios) {
      return res.json({
        success: true,
        data: {
          colors: {},
          message: 'No ratios to color code',
        },
      });
    }

    const colors: any = {};

    Object.entries(ratios).forEach(([key, value]) => {
      if (value !== null && value !== undefined) {
        colors[key] = FinancialRatioService.getRatioColor(Number(value), key);
      } else {
        colors[key] = 'text-gray-500';
      }
    });

    res.json({
      success: true,
      data: {
        colors,
        message: 'Ratio colors generated successfully',
      },
    });
  });

  /**
   * Export ratios to CSV
   */
  static exportRatios = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { startYear, endYear, format = 'csv' } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get ratios
    const ratios = await FinancialRatioService.getCompanyRatios(
      company.id,
      startYear ? Number(startYear) : undefined,
      endYear ? Number(endYear) : undefined,
      50
    );

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Year,ROE,Debt Ratio,Profit Margin,Current Ratio,Quick Ratio,Gross Margin,Operating Margin,ROA,Asset Turnover';
      const csvRows = ratios.map(r => 
        `${r.year},${r.ratios.roe || 'N/A'},${r.ratios.debtRatio || 'N/A'},${r.ratios.profitMargin || 'N/A'},${r.ratios.currentRatio || 'N/A'},${r.ratios.quickRatio || 'N/A'},${r.ratios.grossMargin || 'N/A'},${r.ratios.operatingMargin || 'N/A'},${ratios.returnOnAssets || 'N/A'},${ratios.assetTurnover || 'N/A'}`
      );

      const csvContent = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${symbol}_ratios.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          symbol: company.symbol,
          companyName: company.name,
          ratios,
          message: 'Ratios exported successfully',
        },
      });
    }
  });
}

export default FinancialRatioController;
