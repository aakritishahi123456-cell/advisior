import { Request, Response } from 'express';
import multer from 'multer';
import { PrismaClient } from '@prisma/client';
import { PDFParserService } from '../services/pdfParser.service';
import { asyncHandler } from '../middleware/errorHandler';
import { createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation.middleware';
import { z } from 'zod';
import logger from '../utils/logger';

const prisma = new PrismaClient();

// Validation schemas
const parseReportSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Invalid symbol format'),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
  pdfUrl: z.string().url().optional(),
});

const uploadReportSchema = z.object({
  symbol: z.string().min(1).max(10).regex(/^[A-Z0-9]+$/, 'Invalid symbol format'),
  year: z.number().int().min(2000).max(new Date().getFullYear()),
});

// Configure multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 20 * 1024 * 1024, // 20MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
    } else {
      cb(new Error('Only PDF files are allowed'));
    }
  },
});

export class ReportParserController {
  /**
   * Parse report from URL
   */
  static parseReportFromURL = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol, year, pdfUrl } = req.body;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Queue the parsing job
    const jobId = await PDFParserService.queueParsingJob(
      company.id,
      symbol,
      year,
      pdfUrl,
      req.user?.id
    );

    res.status(202).json({
      success: true,
      data: {
        jobId,
        companyId: company.id,
        symbol,
        year,
        pdfUrl,
        status: 'queued',
        message: 'Report parsing job has been queued for processing',
      },
    });
  });

  /**
   * Upload and parse report from file
   */
  static uploadAndParseReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol, year } = req.body;
    const file = req.file;

    if (!file) {
      throw createError('No PDF file uploaded', 400);
    }

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Validate PDF file
    await PDFParserService.validatePDFFile(file.buffer);

    // For now, we'll store the file temporarily and process it
    // In production, you'd store it in cloud storage
    const pdfPath = `uploads/${Date.now()}-${file.originalname}`;
    
    // Queue the parsing job with file data
    const jobId = await PDFParserService.queueParsingJob(
      company.id,
      symbol,
      year,
      pdfPath,
      req.user?.id
    );

    // Store file buffer in job data (in production, use cloud storage)
    const queueManager = await import('../queues/queueManager').then(m => m.queueManager);
    await queueManager.updateJobData('report-parsing-queue', jobId, {
      pdfBuffer: file.buffer,
      originalName: file.originalname,
      size: file.size,
    });

    res.status(202).json({
      success: true,
      data: {
        jobId,
        companyId: company.id,
        symbol,
        year,
        fileName: file.originalname,
        fileSize: file.size,
        status: 'queued',
        message: 'Report parsing job has been queued for processing',
      },
    });
  });

  /**
   * Get parsing job status
   */
  static getJobStatus = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { jobId } = req.params;

    const jobStatus = await PDFParserService.getJobStatus(jobId);

    if (!jobStatus) {
      throw createError('Job not found', 404);
    }

    res.json({
      success: true,
      data: jobStatus,
    });
  });

  /**
   * Get parsing history for a company
   */
  static getParsingHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { limit = 10 } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    const history = await PDFParserService.getParsingHistory(
      company.id,
      Number(limit)
    );

    res.json({
      success: true,
      data: history,
    });
  });

  /**
   * Get financial reports for a company
   */
  static getFinancialReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { year, limit = 10 } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Build where clause
    const where: any = { companyId: company.id };
    if (year) {
      where.year = Number(year);
    }

    const reports = await prisma.financialReport.findMany({
      where,
      orderBy: { year: 'desc' },
      take: Number(limit),
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true,
          },
        },
      },
    });

    // Calculate financial ratios for each report
    const reportsWithRatios = reports.map(report => ({
      ...report,
      ratios: PDFParserService.calculateFinancialRatios({
        revenue: report.revenue || undefined,
        netProfit: report.netProfit || undefined,
        totalAssets: report.totalAssets || undefined,
        totalLiabilities: report.totalLiabilities || undefined,
        equity: report.equity || undefined,
        eps: report.eps || undefined,
      }),
    }));

    res.json({
      success: true,
      data: reportsWithRatios,
    });
  });

  /**
   * Get financial metrics summary
   */
  static getFinancialSummary = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol } = req.params;
    const { years = 5 } = req.query;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Get recent reports
    const reports = await prisma.financialReport.findMany({
      where: { companyId: company.id },
      orderBy: { year: 'desc' },
      take: Number(years),
    });

    if (reports.length === 0) {
      return res.json({
        success: true,
        data: {
          company: {
            id: company.id,
            name: company.name,
            symbol: company.symbol,
          },
          reports: [],
          summary: null,
        },
      });
    }

    // Calculate summary statistics
    const summary = {
      totalReports: reports.length,
      yearRange: {
        start: Math.min(...reports.map(r => r.year)),
        end: Math.max(...reports.map(r => r.year)),
      },
      averageMetrics: {
        revenue: reports.reduce((sum, r) => sum + (r.revenue || 0), 0) / reports.length,
        netProfit: reports.reduce((sum, r) => sum + (r.netProfit || 0), 0) / reports.length,
        totalAssets: reports.reduce((sum, r) => sum + (r.totalAssets || 0), 0) / reports.length,
        totalLiabilities: reports.reduce((sum, r) => sum + (r.totalLiabilities || 0), 0) / reports.length,
        equity: reports.reduce((sum, r) => sum + (r.equity || 0), 0) / reports.length,
        eps: reports.reduce((sum, r) => sum + (r.eps || 0), 0) / reports.filter(r => r.eps).length,
      },
      latestReport: reports[0],
      trend: {
        revenueGrowth: this.calculateGrowthRate(reports, 'revenue'),
        profitGrowth: this.calculateGrowthRate(reports, 'netProfit'),
        assetGrowth: this.calculateGrowthRate(reports, 'totalAssets'),
      },
    };

    res.json({
      success: true,
      data: {
        company: {
          id: company.id,
          name: company.name,
          symbol: company.symbol,
        },
        reports,
        summary,
      },
    });
  });

  /**
   * Delete financial report
   */
  static deleteFinancialReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol, year } = req.params;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Delete the report
    const deletedReport = await prisma.financialReport.deleteMany({
      where: {
        companyId: company.id,
        year: Number(year),
      },
    });

    if (deletedReport.count === 0) {
      throw createError('Financial report not found', 404);
    }

    res.json({
      success: true,
      message: 'Financial report deleted successfully',
    });
  });

  /**
   * Update financial report
   */
  static updateFinancialReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { symbol, year } = req.params;
    const updateData = req.body;

    // Find company by symbol
    const company = await prisma.company.findUnique({
      where: { symbol: symbol.toUpperCase() },
    });

    if (!company) {
      throw createError(`Company with symbol ${symbol} not found`, 404);
    }

    // Update the report
    const updatedReport = await prisma.financialReport.updateMany({
      where: {
        companyId: company.id,
        year: Number(year),
      },
      data: {
        revenue: updateData.revenue,
        netProfit: updateData.netProfit,
        totalAssets: updateData.totalAssets,
        totalLiabilities: updateData.totalLiabilities,
        equity: updateData.equity,
        eps: updateData.eps,
        updatedAt: new Date(),
      },
    });

    if (updatedReport.count === 0) {
      throw createError('Financial report not found', 404);
    }

    // Get the updated report
    const report = await prisma.financialReport.findFirst({
      where: {
        companyId: company.id,
        year: Number(year),
      },
    });

    res.json({
      success: true,
      data: report,
      message: 'Financial report updated successfully',
    });
  });

  /**
   * Get parsing statistics
   */
  static getParsingStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const stats = await prisma.financialReport.groupBy({
      by: ['year'],
      _count: {
        id: true,
      },
      _sum: {
        revenue: true,
        netProfit: true,
        totalAssets: true,
      },
      orderBy: {
        year: 'desc',
      },
    });

    const totalReports = await prisma.financialReport.count();
    const totalCompanies = await prisma.company.count();

    res.json({
      success: true,
      data: {
        totalReports,
        totalCompanies,
        yearlyStats: stats,
      },
    });
  });

  /**
   * Helper method to calculate growth rate
   */
  private static calculateGrowthRate(
    reports: any[],
    field: keyof typeof reports[0]
  ): number | null {
    if (reports.length < 2) return null;

    const sortedReports = reports.sort((a, b) => a.year - b.year);
    const latest = sortedReports[sortedReports.length - 1];
    const previous = sortedReports[sortedReports.length - 2];

    const latestValue = latest[field] as number;
    const previousValue = previous[field] as number;

    if (!latestValue || !previousValue || previousValue === 0) return null;

    return ((latestValue - previousValue) / previousValue) * 100;
  }
}
