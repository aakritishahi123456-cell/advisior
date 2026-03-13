import { PrismaClient, FinancialReport, ReportType } from '@prisma/client';
import { FinancialReportRepository } from '../repositories/financialReport.repository';
import { createError } from '../middleware/errorHandler';
import logger from '../utils/logger';

export interface CreateReportData {
  title: string;
  reportType: ReportType;
  content?: string;
  fileUrl?: string;
  companyId?: string;
  year?: number;
}

export interface ReportAnalytics {
  totalReports: number;
  reportsByType: Record<ReportType, number>;
  reportsByYear: Record<number, number>;
  recentReports: FinancialReport[];
  uploadTrends: {
    daily: Array<{ date: string; count: number }>;
    monthly: Array<{ month: string; count: number }>;
  };
}

export class FinancialReportService {
  private static prisma = new PrismaClient();

  static async createReport(userId: string, reportData: CreateReportData): Promise<FinancialReport> {
    try {
      logger.info({ userId, action: 'create_report', data: reportData });

      const report = await FinancialReportRepository.create({
        userId,
        title: reportData.title,
        reportType: reportData.reportType,
        content: reportData.content,
        fileUrl: reportData.fileUrl,
        companyId: reportData.companyId,
        year: reportData.year
      });

      logger.info({ reportId: report.id, action: 'report_created' });
      return report;
    } catch (error) {
      logger.error({ error, action: 'create_report_failed' });
      throw createError('Failed to create financial report', 500);
    }
  }

  static async getUserReports(
    userId: string,
    page: number = 1,
    limit: number = 10,
    reportType?: string,
    year?: number
  ): Promise<{ reports: FinancialReport[]; pagination: any }> {
    try {
      const where: any = { userId };
      
      if (reportType && Object.values(ReportType).includes(reportType as ReportType)) {
        where.reportType = reportType;
      }
      
      if (year) {
        where.year = year;
      }

      const [reports, total] = await Promise.all([
        FinancialReportRepository.findMany(where, page, limit),
        FinancialReportRepository.count(where)
      ]);

      const totalPages = Math.ceil(total / limit);

      logger.info({ userId, page, limit, total, action: 'get_user_reports' });
      
      return {
        reports,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error({ error, action: 'get_user_reports_failed' });
      throw createError('Failed to retrieve user reports', 500);
    }
  }

  static async getReportById(reportId: string, userId: string): Promise<FinancialReport> {
    try {
      const report = await FinancialReportRepository.findById(reportId, userId);
      
      if (!report) {
        throw createError('Financial report not found', 404);
      }

      logger.info({ reportId, userId, action: 'get_report_by_id' });
      return report;
    } catch (error) {
      logger.error({ error, reportId, userId, action: 'get_report_by_id_failed' });
      throw error;
    }
  }

  static async updateReport(
    reportId: string,
    userId: string,
    updateData: Partial<CreateReportData>
  ): Promise<FinancialReport> {
    try {
      const report = await FinancialReportRepository.findById(reportId, userId);
      
      if (!report) {
        throw createError('Financial report not found', 404);
      }

      const updatedReport = await FinancialReportRepository.update(reportId, userId, updateData);
      logger.info({ reportId, userId, updateData, action: 'report_updated' });
      return updatedReport;
    } catch (error) {
      logger.error({ error, reportId, userId, updateData, action: 'update_report_failed' });
      throw createError('Failed to update financial report', 500);
    }
  }

  static async deleteReport(reportId: string, userId: string): Promise<void> {
    try {
      const report = await FinancialReportRepository.findById(reportId, userId);
      
      if (!report) {
        throw createError('Financial report not found', 404);
      }

      await FinancialReportRepository.delete(reportId, userId);
      logger.info({ reportId, userId, action: 'report_deleted' });
    } catch (error) {
      logger.error({ error, reportId, userId, action: 'delete_report_failed' });
      throw createError('Failed to delete financial report', 500);
    }
  }

  static async parseReport(reportId: string, userId: string): Promise<any> {
    try {
      const report = await FinancialReportRepository.findById(reportId, userId);
      
      if (!report) {
        throw createError('Financial report not found', 404);
      }

      // This is a placeholder for actual parsing logic
      // In a real implementation, this would parse the report content
      // and extract structured data like revenue, expenses, etc.
      const parsedData = {
        revenue: Math.random() * 1000000, // Mock data
        expenses: Math.random() * 800000,   // Mock data
        profit: Math.random() * 200000,    // Mock data
        parsedAt: new Date()
      };

      await FinancialReportRepository.update(reportId, userId, { 
        parsedData: parsedData as any 
      });

      logger.info({ reportId, userId, action: 'report_parsed' });
      return parsedData;
    } catch (error) {
      logger.error({ error, reportId, userId, action: 'parse_report_failed' });
      throw createError('Failed to parse financial report', 500);
    }
  }

  static async getReportAnalytics(userId: string, period: string = '1year'): Promise<ReportAnalytics> {
    try {
      const reports = await FinancialReportRepository.findMany({ userId });
      
      const reportsByType = reports.reduce((acc, report) => {
        acc[report.reportType] = (acc[report.reportType] || 0) + 1;
        return acc;
      }, {} as Record<ReportType, number>);

      const reportsByYear = reports.reduce((acc, report) => {
        if (report.year) {
          acc[report.year] = (acc[report.year] || 0) + 1;
        }
        return acc;
      }, {} as Record<number, number>);

      const recentReports = reports
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5);

      // Mock trend data - in real implementation, this would come from database
      const uploadTrends = {
        daily: Array.from({ length: 30 }, (_, i) => ({
          date: new Date(Date.now() - (29 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          count: Math.floor(Math.random() * 10) + 1
        })),
        monthly: Array.from({ length: 12 }, (_, i) => ({
          month: new Date(Date.now() - (11 - i) * 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 7),
          count: Math.floor(Math.random() * 50) + 10
        }))
      };

      const analytics: ReportAnalytics = {
        totalReports: reports.length,
        reportsByType,
        reportsByYear,
        recentReports,
        uploadTrends
      };

      logger.info({ userId, period, action: 'report_analytics_retrieved' });
      return analytics;
    } catch (error) {
      logger.error({ error, userId, period, action: 'get_report_analytics_failed' });
      throw createError('Failed to retrieve report analytics', 500);
    }
  }

  static async uploadReportFile(
    userId: string,
    file: Express.Multer.File,
    reportData: { title: string; reportType: ReportType }
  ): Promise<FinancialReport> {
    try {
      if (!file) {
        throw createError('No file uploaded', 400);
      }

      // In a real implementation, this would upload to cloud storage
      // For now, we'll use a mock URL
      const fileUrl = `/uploads/reports/${file.filename}`;

      const report = await FinancialReportRepository.create({
        userId,
        title: reportData.title,
        reportType: reportData.reportType,
        fileUrl,
        content: `Uploaded file: ${file.originalname}`
      });

      logger.info({ 
        userId, 
        fileName: file.filename, 
        fileSize: file.size,
        action: 'report_file_uploaded' 
      });

      return report;
    } catch (error) {
      logger.error({ error, userId, action: 'upload_report_file_failed' });
      throw createError('Failed to upload report file', 500);
    }
  }
}
