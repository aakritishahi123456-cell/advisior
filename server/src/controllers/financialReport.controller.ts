import { Request, Response } from 'express';
import { FinancialReportService } from '../services/financialReport.service';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export class FinancialReportController {
  static createReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await FinancialReportService.createReport(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: report,
      message: 'Financial report created successfully'
    });
  });

  static getUserReports = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, reportType, year } = req.query;
    const result = await FinancialReportService.getUserReports(
      req.user!.id,
      Number(page),
      Number(limit),
      reportType as string,
      year ? Number(year) : undefined
    );
    res.json({
      success: true,
      data: result.reports,
      pagination: result.pagination,
      message: 'Financial reports retrieved successfully'
    });
  });

  static getReportById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const report = await FinancialReportService.getReportById(id, req.user!.id);
    res.json({
      success: true,
      data: report,
      message: 'Financial report retrieved successfully'
    });
  });

  static updateReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const report = await FinancialReportService.updateReport(id, req.user!.id, req.body);
    res.json({
      success: true,
      data: report,
      message: 'Financial report updated successfully'
    });
  });

  static deleteReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await FinancialReportService.deleteReport(id, req.user!.id);
    res.json({
      success: true,
      message: 'Financial report deleted successfully'
    });
  });

  static parseReport = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const parsedData = await FinancialReportService.parseReport(id, req.user!.id);
    res.json({
      success: true,
      data: parsedData,
      message: 'Financial report parsed successfully'
    });
  });

  static getReportAnalytics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { period = '1year' } = req.query;
    const analytics = await FinancialReportService.getReportAnalytics(req.user!.id, period as string);
    res.json({
      success: true,
      data: analytics,
      message: 'Report analytics retrieved successfully'
    });
  });

  static uploadReportFile = asyncHandler(async (req: AuthRequest, res: Response) => {
    const report = await FinancialReportService.uploadReportFile(req.user!.id, req.file, req.body);
    res.status(201).json({
      success: true,
      data: report,
      message: 'Financial report file uploaded successfully'
    });
  });
}
