import { Request, Response } from 'express';
import { ReportGeneratorService } from '../services/reportGenerator.service';
import { FinancialRatioService } from '../services/financialRatio.service';
import { asyncHandler } from '../middleware/asyncHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';
import logger from '../utils/logger';

// Validation schemas
const generateReportSchema = z.object({
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  templateId: z.string().optional().default('retail_investor'),
});

const batchReportSchema = z.object({
  companies: z.array(z.object({
    companyId: z.string(),
    symbol: z.string(),
    year: z.number().int().min(2000).max(new Date().getFullYear()),
    templateId: z.string().optional().default('retail_investor'),
  })),
});

const getReportsSchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export class ReportGeneratorController {
  /**
   * Generate AI analysis report for a company
   */
  static generateReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { year, templateId } = req.body;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get financial ratios for the year
    const ratios = await FinancialRatioService.getCompanyRatios(
      company.id,
      year,
      year,
      1
    );

    if (ratios.length === 0) {
      throw createError(`No financial data found for year ${year}`, 404);
    }

    // Generate AI analysis
    const analysis = await ReportGeneratorService.generateAIAnalysis({
      companyId: company.id,
      symbol: company.symbol,
      year,
      ratios: ratios[0].ratios,
      companyName: company.name,
      industry: company.industry,
      marketCap: company.marketCap,
      sharePrice: company.sharePrice,
    }, templateId);

    // Store the report
    const reportId = await ReportGeneratorService.storeAIReport(
      company.id,
      year,
      analysis,
      templateId
    );

    res.json({
      success: true,
      data: {
        reportId,
        companyId: company.id,
        symbol: company.symbol,
        companyName: company.name,
        year,
        templateId,
        analysis,
        message: 'AI analysis report generated successfully',
      },
    });
  });

  /**
   * Get AI analysis report for a company
   */
  static getReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { year } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get AI report
    const analysis = await ReportGeneratorService.getAIReport(
      company.id,
      Number(year),
      'retail_investor'
    );

    if (!analysis) {
      throw createError(`No AI report found for year ${year}`, 404);
    }

    res.json({
      success: true,
      data: {
        companyId: company.id,
        symbol: company.symbol,
        companyName: company.name,
        year: Number(year),
        analysis,
        message: 'AI analysis report retrieved successfully',
      },
    });
  });

  /**
   * Get all AI reports for a company
   */
  static getCompanyReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { limit } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get all reports
    const reports = await ReportGeneratorService.getCompanyAIReports(
      company.id,
      Number(limit)
    );

    res.json({
      success: true,
      data: {
        companyId: company.id,
        symbol: company.symbol,
        companyName: company.name,
        reports,
        message: 'Company AI reports retrieved successfully',
      },
    });
  });

  /**
   * Generate batch AI reports
   */
  static generateBatchReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { companies } = req.body;

    if (!Array.isArray(companies) || companies.length === 0) {
      throw createError('Companies array is required', 400);
    }

    // Validate and prepare company data
    const companyData = [];
    for (const company of companies) {
      const companyInfo = await prisma.company.findUnique({
        where: { symbol: company.symbol?.toUpperCase() },
      });

      if (!companyInfo) {
        continue;
      }

      // Get financial ratios
      const ratios = await FinancialRatioService.getCompanyRatios(
        companyInfo.id,
        company.year,
        company.year,
        1
      );

      if (ratios.length === 0) {
        continue;
      }

      companyData.push({
        companyId: companyInfo.id,
        symbol: companyInfo.symbol,
        year: company.year,
        ratios: ratios[0].ratios,
        companyName: companyInfo.name,
        industry: companyInfo.industry,
        templateId: company.templateId || 'retail_investor',
      });
    }

    // Generate batch reports
    const results = await ReportGeneratorService.generateBatchReports(companyData);

    const successCount = results.filter(r => !r.error).length;
    const errorCount = results.filter(r => r.error).length;

    res.json({
      success: true,
      data: {
        results,
        summary: {
          total: results.length,
          success: successCount,
          errors: errorCount,
        },
        message: `Batch report generation completed: ${successCount} successful, ${errorCount} errors`,
      },
    });
  });

  /**
   * Get available report templates
   */
  static getTemplates = asyncHandler(async (req: AuthRequest, res: Response) => {
    const templates = ReportGeneratorService.getAvailableTemplates();

    res.json({
      success: true,
      data: {
        templates,
        message: 'Available report templates retrieved successfully',
      },
    });
  });

  /**
   * Delete AI report
   */
  static deleteReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { reportId } = req.params;

    await ReportGeneratorService.deleteAIReport(reportId);

    res.json({
      success: true,
      message: 'AI report deleted successfully',
    });
  });

  /**
   * Get report statistics
   */
  static getReportStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const statistics = await ReportGeneratorService.getReportStatistics();

    res.json({
      success: true,
      data: {
        statistics,
        message: 'Report statistics retrieved successfully',
      },
    });
  });

  /**
   * Generate report PDF
   */
  static generatePDF = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { year } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get AI report
    const analysis = await ReportGeneratorService.getAIReport(
      company.id,
      Number(year),
      'retail_investor'
    );

    if (!analysis) {
      throw createError(`No AI report found for year ${year}`, 404);
    }

    // Generate PDF content
    const pdfContent = this.generatePDFContent(company, analysis, Number(year));

    // Set response headers for PDF download
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${symbol}_analysis_${year}.pdf"`);
    res.send(pdfContent);
  });

  /**
   * Generate PDF content
   */
  private static generatePDFContent(company: any, analysis: any, year: number): Buffer {
    // In a real implementation, you would use a PDF library like puppeteer or jsPDF
    // For now, we'll return a simple text-based PDF simulation
    
    const content = `
${company.name} (${company.symbol})
AI Financial Analysis Report - ${year}
=====================================

COMPANY OVERVIEW
================
${analysis.companyOverview}

PROFITABILITY ANALYSIS
======================
${analysis.profitabilityAnalysis}

DEBT RISK ANALYSIS
==================
${analysis.debtRiskAnalysis}

GROWTH POTENTIAL
================
${analysis.growthPotential}

INVESTOR RISK SCORE
==================
Risk Score: ${analysis.investorRiskScore.score}/100 (${analysis.investorRiskScore.category})
${analysis.investorRiskScore.description}

FINAL VERDICT
=============
Rating: ${analysis.finalVerdict.rating}
${analysis.finalVerdict.recommendation}

Key Strengths:
${analysis.finalVerdict.keyStrengths.map((s: string) => `• ${s}`).join('\n')}

Key Risks:
${analysis.finalVerdict.keyRisks.map((r: string) => `• ${r}`).join('\n')}

SUMMARY
=======
${analysis.summary}

Generated on: ${analysis.generatedAt.toLocaleString()}
Confidence Score: ${analysis.confidence}%
=====================================
    `.trim();

    // Return as Buffer (in real implementation, use actual PDF generation)
    return Buffer.from(content, 'utf-8');
  }

  /**
   * Generate report comparison
   */
  static compareReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { years = 3 } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get reports for multiple years
    const currentYear = new Date().getFullYear();
    const startYear = currentYear - Number(years) + 1;

    const reports = await ReportGeneratorService.getCompanyAIReports(
      company.id,
      Number(years)
    );

    // Filter reports by year range
    const filteredReports = reports.filter(report => 
      report.year >= startYear && report.year <= currentYear
    );

    // Generate comparison analysis
    const comparison = this.generateComparisonAnalysis(filteredReports);

    res.json({
      success: true,
      data: {
        companyId: company.id,
        symbol: company.symbol,
        companyName: company.name,
        years: filteredReports.map(r => r.year),
        reports: filteredReports,
        comparison,
        message: 'Report comparison generated successfully',
      },
    });
  });

  /**
   * Generate comparison analysis
   */
  private static generateComparisonAnalysis(reports: any[]): any {
    if (reports.length === 0) {
      return {
        trend: 'insufficient_data',
        averageRiskScore: 0,
        ratingDistribution: {},
        recommendation: 'Insufficient data for comparison',
      };
    }

    const riskScores = reports.map(r => r.riskScore);
    const ratings = reports.map(r => r.rating);

    const averageRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
    
    const ratingDistribution = ratings.reduce((acc, rating) => {
      acc[rating] = (acc[rating] || 0) + 1;
      return acc;
    }, {});

    // Determine trend
    let trend = 'stable';
    if (reports.length >= 2) {
      const latest = reports[0].riskScore;
      const previous = reports[1].riskScore;
      
      if (latest < previous - 10) {
        trend = 'improving';
      } else if (latest > previous + 10) {
        trend = 'declining';
      }
    }

    return {
      trend,
      averageRiskScore: Math.round(averageRiskScore),
      ratingDistribution,
      recommendation: this.generateComparisonRecommendation(trend, averageRiskScore, ratingDistribution),
    };
  }

  /**
   * Generate comparison recommendation
   */
  private static generateComparisonRecommendation(
    trend: string,
    averageRiskScore: number,
    ratingDistribution: any
  ): string {
    let recommendation = '';

    if (trend === 'improving') {
      recommendation = 'Company shows improving financial health over time. Consider investment for long-term growth.';
    } else if (trend === 'declining') {
      recommendation = 'Company shows declining financial performance. Exercise caution and monitor closely.';
    } else {
      recommendation = 'Company shows stable financial performance. Suitable for balanced investment approach.';
    }

    if (averageRiskScore <= 40) {
      recommendation += ' Low risk profile suitable for conservative investors.';
    } else if (averageRiskScore <= 70) {
      recommendation += ' Moderate risk profile suitable for diversified portfolios.';
    } else {
      recommendation += ' High risk profile requiring thorough due diligence.';
    }

    return recommendation;
  }

  /**
   * Export reports to CSV
   */
  static exportReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { format = 'csv' } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get all reports
    const reports = await ReportGeneratorService.getCompanyAIReports(
      company.id,
      50
    );

    if (format === 'csv') {
      // Generate CSV
      const csvHeader = 'Year,Report Type,Rating,Risk Score,Summary,Created At';
      const csvRows = reports.map(r => 
        `${r.year},${r.reportType},${r.rating},${r.riskScore},"${r.summary.replace(/"/g, '""')}",${r.createdAt}`
      );

      const csvContent = [csvHeader, ...csvRows].join('\n');

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${symbol}_reports.csv"`);
      res.send(csvContent);
    } else {
      // Return JSON
      res.json({
        success: true,
        data: {
          symbol: company.symbol,
          companyName: company.name,
          reports,
          message: 'Reports exported successfully',
        },
      });
    }
  });

  /**
   * Validate report request data
   */
  static validateReportData = asyncHandler(async (req: AuthRequest, res: Response, next: any) => {
    const { symbol, year } = req.body;

    if (!symbol || !year) {
      return next();
    }

    // Validate year
    const yearNum = Number(year);
    if (isNaN(yearNum) || yearNum < 2000 || yearNum > new Date().getFullYear()) {
      throw createError('Invalid year provided', 400);
    }

    // Validate symbol format
    if (typeof symbol !== 'string' || symbol.length > 10) {
      throw createError('Invalid symbol provided', 400);
    }

    next();
  }

  /**
   * Rate limiting for AI report generation
   */
  static checkReportLimits = asyncHandler(async (req: AuthRequest, res: Response, next: any) => {
    const userId = req.user?.id;
    
    if (!userId) {
      return next();
    }

    // Check user's subscription limits
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { subscription: true },
    });

    if (!user) {
      return next();
    }

    // Get today's report count
    const today = new Date().toISOString().split('T')[0];
    const todayReports = await prisma.aIReport.count({
      where: {
        userId,
        createdAt: {
          gte: new Date(today),
          lt: new Date(today + 'T23:59:59.999Z'),
        },
      },
    });

    // Check limits based on subscription
    const dailyLimit = user.subscription?.plan === 'PRO' ? 100 : 10;
    
    if (todayReports >= dailyLimit) {
      throw createError(`Daily report limit exceeded. Your limit is ${dailyLimit} reports per day.`, 429);
    }

    next();
  });
}

export default ReportGeneratorController;
