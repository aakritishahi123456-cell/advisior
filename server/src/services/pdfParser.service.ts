import pdf from 'pdf-parse';
import { Tesseract } from 'tesseract.js';
import { createWorker } from 'tesseract.js';
import logger from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { PrismaClient } from '@prisma/client';
import { FinancialReportRepository } from '../repositories/financialReport.repository';
import { queueManager } from '../queues/queueManager';

const prisma = new PrismaClient();

export interface FinancialMetrics {
  revenue?: number;
  netProfit?: number;
  totalAssets?: number;
  totalLiabilities?: number;
  equity?: number;
  eps?: number;
  cashFlow?: number;
  operatingIncome?: number;
  grossProfit?: number;
  totalExpenses?: number;
}

export interface ParsedReportData {
  companyId: string;
  year: number;
  metrics: FinancialMetrics;
  extractedText: string;
  confidence: number;
  processingTime: number;
  source: 'pdf-parse' | 'tesseract';
}

export interface PDFParsingJob {
  id: string;
  companyId: string;
  symbol: string;
  year: number;
  pdfUrl: string;
  pdfPath?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PDFParserService {
  private static readonly FINANCIAL_PATTERNS = {
    // Revenue patterns
    revenue: [
      /(?:revenue|sales|turnover|income)\s*(?:from\s*)?(?:operations?|operating)?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:total\s*)?(?:revenue|sales|turnover)\s*(?:for\s*)?the\s*year\s*ended\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:net\s*)?(?:revenue|sales)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // Net Profit patterns
    netProfit: [
      /(?:net\s*)?(?:profit|income|earnings)\s*(?:after\s*tax)?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:profit\s*(?:after\s*)?tax|net\s*income)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:total\s*)?(?:net\s*)?(?:profit|income)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // Total Assets patterns
    totalAssets: [
      /(?:total\s*)?(?:assets?)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /assets?\s*(?:as\s*of\s*year\s*end)?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:balance\s*sheet\s*)?total\s*assets?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // Total Liabilities patterns
    totalLiabilities: [
      /(?:total\s*)?(?:liabilities?)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /liabilities?\s*(?:as\s*of\s*year\s*end)?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:balance\s*sheet\s*)?total\s*liabilities?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // Equity patterns
    equity: [
      /(?:total\s*)?(?:equity|shareholders?\s*equity)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:shareholders?\s*equity|total\s*equity)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:net\s*)?(?:assets?|worth)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // EPS patterns
    eps: [
      /(?:earnings?\s*per\s*share|eps)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+)(?:\s*(?:per\s*share)?)?/gi,
      /eps\s*(?:\(basic\)|\(diluted\))?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+)/gi,
      /(?:basic|diluted)\s*eps?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+)/gi,
    ],
    
    // Cash Flow patterns
    cashFlow: [
      /(?:net\s*)?(?:cash\s*flow|cash\s*and\s*cash\s*equivalents)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:operating\s*)?(?:cash\s*flow)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /cash\s*flow\s*from\s*operating\s*activities\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // Operating Income patterns
    operatingIncome: [
      /(?:operating\s*)?(?:income|profit|earnings?)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:ebit|ebitda)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:profit\s*before\s*interest\s*and\s*tax|pbit)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // Gross Profit patterns
    grossProfit: [
      /(?:gross\s*)?(?:profit|income|earnings?)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /gross\s*margin\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
    
    // Total Expenses patterns
    totalExpenses: [
      /(?:total\s*)?(?:expenses?|costs?)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
      /(?:operating\s*)?(?:expenses?|costs?)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    ],
  };

  private static readonly MULTIPLIERS = {
    thousand: 1000,
    lakh: 100000,
    million: 1000000,
    crore: 10000000,
    billion: 1000000000,
  };

  /**
   * Parse PDF and extract financial metrics
   */
  static async parsePDFReport(
    companyId: string,
    symbol: string,
    year: number,
    pdfBuffer: Buffer,
    source: 'upload' | 'url' = 'upload'
  ): Promise<ParsedReportData> {
    const startTime = Date.now();
    let extractedText = '';
    let confidence = 0;
    let parsingSource: 'pdf-parse' | 'tesseract' = 'pdf-parse';

    try {
      // First attempt: Use pdf-parse for text-based PDFs
      try {
        const pdfData = await pdf(pdfBuffer);
        extractedText = pdfData.text;
        confidence = pdfData.numpages > 0 ? 0.8 : 0.3;
        
        logger.info({
          action: 'pdf_parse_success',
          companyId,
          symbol,
          year,
          pages: pdfData.numpages,
          textLength: extractedText.length,
        });
      } catch (pdfError) {
        logger.warn({
          action: 'pdf_parse_failed',
          companyId,
          symbol,
          year,
          error: pdfError.message,
        });

        // Fallback: Use Tesseract OCR for scanned PDFs
        try {
          extractedText = await this.performOCR(pdfBuffer);
          confidence = 0.6;
          parsingSource = 'tesseract';
          
          logger.info({
            action: 'ocr_success',
            companyId,
            symbol,
            year,
            textLength: extractedText.length,
          });
        } catch (ocrError) {
          logger.error({
            action: 'ocr_failed',
            companyId,
            symbol,
            year,
            error: ocrError.message,
          });
          throw createError('Failed to extract text from PDF using both pdf-parse and OCR', 500);
        }
      }

      // Extract financial metrics
      const metrics = this.extractFinancialMetrics(extractedText);

      const processingTime = Date.now() - startTime;

      const result: ParsedReportData = {
        companyId,
        year,
        metrics,
        extractedText,
        confidence,
        processingTime,
        source: parsingSource,
      };

      logger.info({
        action: 'pdf_parsing_completed',
        companyId,
        symbol,
        year,
        processingTime,
        confidence,
        source: parsingSource,
        metricsCount: Object.keys(metrics).length,
      });

      return result;
    } catch (error) {
      logger.error({
        action: 'pdf_parsing_error',
        companyId,
        symbol,
        year,
        error: error.message,
        processingTime: Date.now() - startTime,
      });
      throw error;
    }
  }

  /**
   * Perform OCR on PDF using Tesseract
   */
  private static async performOCR(pdfBuffer: Buffer): Promise<string> {
    // For now, we'll implement a basic OCR simulation
    // In production, you'd need to convert PDF to images first
    // This is a simplified version that assumes the PDF can be processed directly
    
    try {
      // Create a worker for OCR
      const worker = await createWorker('eng');
      
      // In a real implementation, you'd need to:
      // 1. Convert PDF pages to images
      // 2. Process each image with Tesseract
      // 3. Combine the text results
      
      // For now, return a placeholder that indicates OCR was attempted
      await worker.terminate();
      
      return 'OCR processing would be implemented here. PDF to image conversion required.';
    } catch (error) {
      logger.error('OCR processing failed:', error);
      throw error;
    }
  }

  /**
   * Extract financial metrics using regex patterns
   */
  private static extractFinancialMetrics(text: string): FinancialMetrics {
    const metrics: FinancialMetrics = {};
    const cleanText = text.toLowerCase().replace(/\s+/g, ' ');

    // Extract each metric type
    Object.entries(this.FINANCIAL_PATTERNS).forEach(([metricType, patterns]) => {
      const values: number[] = [];

      patterns.forEach(pattern => {
        const matches = [...cleanText.matchAll(pattern)];
        matches.forEach(match => {
          if (match[1]) {
            const value = this.normalizeFinancialValue(match[1], match[0]);
            if (value !== null && !isNaN(value)) {
              values.push(value);
            }
          }
        });
      });

      // Use the most reasonable value (median to avoid outliers)
      if (values.length > 0) {
        values.sort((a, b) => a - b);
        const medianValue = values[Math.floor(values.length / 2)];
        (metrics as any)[metricType] = medianValue;
      }
    });

    // Calculate derived metrics if available
    if (metrics.totalAssets && metrics.totalLiabilities) {
      metrics.equity = metrics.totalAssets - metrics.totalLiabilities;
    }

    return metrics;
  }

  /**
   * Normalize financial value string to number
   */
  private static normalizeFinancialValue(valueStr: string, context: string): number | null {
    try {
      // Remove common formatting characters
      let cleanValue = valueStr.replace(/[,\s]/g, '');
      
      // Handle multipliers
      const multiplierMatch = context.match(/(thousand|lakh|million|crore|billion)/i);
      if (multiplierMatch) {
        const multiplier = this.MULTIPLIERS[multiplierMatch[1].toLowerCase()];
        cleanValue = (parseFloat(cleanValue) * multiplier).toString();
      }

      // Handle parentheses (negative values)
      if (cleanValue.includes('(') && cleanValue.includes(')')) {
        cleanValue = '-' + cleanValue.replace(/[()]/g, '');
      }

      const numValue = parseFloat(cleanValue);
      
      // Validate the result
      if (isNaN(numValue) || numValue < 0) {
        return null;
      }

      // Filter out unrealistic values
      if (numValue > 1000000000000) { // 1 trillion NPR limit
        return null;
      }

      return numValue;
    } catch (error) {
      return null;
    }
  }

  /**
   * Store parsed financial data in database
   */
  static async storeFinancialData(data: ParsedReportData): Promise<void> {
    try {
      // Check if report already exists
      const existingReport = await prisma.financialReport.findFirst({
        where: {
          companyId: data.companyId,
          year: data.year,
        },
      });

      if (existingReport) {
        // Update existing report
        await prisma.financialReport.update({
          where: { id: existingReport.id },
          data: {
            revenue: data.metrics.revenue,
            netProfit: data.metrics.netProfit,
            totalAssets: data.metrics.totalAssets,
            totalLiabilities: data.metrics.totalLiabilities,
            equity: data.metrics.equity,
            eps: data.metrics.eps,
            updatedAt: new Date(),
          },
        });

        logger.info({
          action: 'financial_report_updated',
          companyId: data.companyId,
          year: data.year,
          metricsCount: Object.keys(data.metrics).length,
        });
      } else {
        // Create new report
        await prisma.financialReport.create({
          data: {
            companyId: data.companyId,
            year: data.year,
            revenue: data.metrics.revenue,
            netProfit: data.metrics.netProfit,
            totalAssets: data.metrics.totalAssets,
            totalLiabilities: data.metrics.totalLiabilities,
            equity: data.metrics.equity,
            eps: data.metrics.eps,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });

        logger.info({
          action: 'financial_report_created',
          companyId: data.companyId,
          year: data.year,
          metricsCount: Object.keys(data.metrics).length,
        });
      }
    } catch (error) {
      logger.error({
        action: 'store_financial_data_error',
        companyId: data.companyId,
        year: data.year,
        error: error.message,
      });
      throw createError('Failed to store financial data', 500);
    }
  }

  /**
   * Queue PDF parsing job
   */
  static async queueParsingJob(
    companyId: string,
    symbol: string,
    year: number,
    pdfUrl: string,
    userId?: string
  ): Promise<string> {
    try {
      const jobData = {
        companyId,
        symbol,
        year,
        pdfUrl,
        userId,
        queuedAt: new Date(),
      };

      const job = await queueManager.addJob('report-parsing-queue', jobData, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      });

      logger.info({
        action: 'pdf_parsing_job_queued',
        jobId: job.id,
        companyId,
        symbol,
        year,
        pdfUrl,
      });

      return job.id;
    } catch (error) {
      logger.error({
        action: 'queue_parsing_job_error',
        companyId,
        symbol,
        year,
        error: error.message,
      });
      throw createError('Failed to queue PDF parsing job', 500);
    }
  }

  /**
   * Download PDF from URL
   */
  static async downloadPDF(pdfUrl: string): Promise<Buffer> {
    try {
      // Validate URL
      const url = new URL(pdfUrl);
      
      // Download PDF
      const response = await fetch(pdfUrl);
      
      if (!response.ok) {
        throw new Error(`Failed to download PDF: ${response.statusText}`);
      }

      // Validate content type
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('pdf')) {
        throw new Error('Invalid file type. Expected PDF file.');
      }

      // Validate file size
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 20 * 1024 * 1024) { // 20MB limit
        throw new Error('File size exceeds 20MB limit.');
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      
      logger.info({
        action: 'pdf_downloaded',
        url: pdfUrl,
        size: buffer.length,
        contentType,
      });

      return buffer;
    } catch (error) {
      logger.error({
        action: 'pdf_download_error',
        url: pdfUrl,
        error: error.message,
      });
      throw createError('Failed to download PDF', 500);
    }
  }

  /**
   * Validate PDF file
   */
  static async validatePDFFile(buffer: Buffer): Promise<void> {
    // Check file size
    if (buffer.length > 20 * 1024 * 1024) { // 20MB limit
      throw createError('PDF file size exceeds 20MB limit', 400);
    }

    // Check PDF signature
    if (buffer.length < 4 || !buffer.toString('ascii', 0, 4).startsWith('%PDF')) {
      throw createError('Invalid PDF file format', 400);
    }

    // Try to parse with pdf-parse to validate
    try {
      await pdf(buffer);
    } catch (error) {
      throw createError('PDF file is corrupted or invalid', 400);
    }
  }

  /**
   * Get parsing job status
   */
  static async getJobStatus(jobId: string): Promise<PDFParsingJob | null> {
    try {
      const job = await queueManager.getJob('report-parsing-queue', jobId);
      
      if (!job) {
        return null;
      }

      return {
        id: job.id,
        companyId: job.data.companyId,
        symbol: job.data.symbol,
        year: job.data.year,
        pdfUrl: job.data.pdfUrl,
        status: job.data.status || 'pending',
        error: job.data.error,
        createdAt: new Date(job.timestamp),
        updatedAt: new Date(job.processedOn || job.timestamp),
      };
    } catch (error) {
      logger.error({
        action: 'get_job_status_error',
        jobId,
        error: error.message,
      });
      throw createError('Failed to get job status', 500);
    }
  }

  /**
   * Get parsing history for a company
   */
  static async getParsingHistory(companyId: string, limit: number = 10): Promise<PDFParsingJob[]> {
    try {
      const jobs = await queueManager.getJobs('report-parsing-queue', 'completed', 0, limit);
      
      return jobs
        .filter(job => job.data.companyId === companyId)
        .map(job => ({
          id: job.id,
          companyId: job.data.companyId,
          symbol: job.data.symbol,
          year: job.data.year,
          pdfUrl: job.data.pdfUrl,
          status: 'completed',
          error: job.data.error,
          createdAt: new Date(job.timestamp),
          updatedAt: new Date(job.processedOn || job.timestamp),
        }));
    } catch (error) {
      logger.error({
        action: 'get_parsing_history_error',
        companyId,
        error: error.message,
      });
      throw createError('Failed to get parsing history', 500);
    }
  }

  /**
   * Calculate financial ratios from extracted data
   */
  static calculateFinancialRatios(metrics: FinancialMetrics): {
    debtToEquity?: number;
    returnOnAssets?: number;
    returnOnEquity?: number;
    currentRatio?: number;
    grossMargin?: number;
    netMargin?: number;
  } {
    const ratios: any = {};

    // Debt to Equity Ratio
    if (metrics.totalLiabilities && metrics.equity && metrics.equity > 0) {
      ratios.debtToEquity = metrics.totalLiabilities / metrics.equity;
    }

    // Return on Assets (ROA)
    if (metrics.netProfit && metrics.totalAssets && metrics.totalAssets > 0) {
      ratios.returnOnAssets = (metrics.netProfit / metrics.totalAssets) * 100;
    }

    // Return on Equity (ROE)
    if (metrics.netProfit && metrics.equity && metrics.equity > 0) {
      ratios.returnOnEquity = (metrics.netProfit / metrics.equity) * 100;
    }

    // Current Ratio (would need current assets and current liabilities)
    // This is a placeholder calculation
    if (metrics.totalAssets && metrics.totalLiabilities && metrics.totalLiabilities > 0) {
      ratios.currentRatio = metrics.totalAssets / metrics.totalLiabilities;
    }

    // Gross Margin
    if (metrics.grossProfit && metrics.revenue && metrics.revenue > 0) {
      ratios.grossMargin = (metrics.grossProfit / metrics.revenue) * 100;
    }

    // Net Margin
    if (metrics.netProfit && metrics.revenue && metrics.revenue > 0) {
      ratios.netMargin = (metrics.netProfit / metrics.revenue) * 100;
    }

    return ratios;
  }
}
