import { Worker, Job } from 'bullmq';
import { PDFParserService } from '../services/pdfParser.service';
import { logger } from '../utils/logger';
import { redisConnection } from '../config/redis';

export interface ReportParsingJobData {
  companyId: string;
  symbol: string;
  year: number;
  pdfUrl: string;
  userId?: string;
  pdfPath?: string;
  queuedAt: Date;
}

export interface ReportParsingJobResult {
  success: boolean;
  companyId: string;
  symbol: string;
  year: number;
  metrics?: any;
  error?: string;
  processingTime: number;
  source: 'pdf-parse' | 'tesseract';
  confidence: number;
}

export class ReportParserWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'report-parsing-queue',
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 3, // Process up to 3 PDFs concurrently
        limiter: {
          max: 10,
          duration: 60000, // 10 jobs per minute
        },
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job: Job<ReportParsingJobData, ReportParsingJobResult>) => {
      logger.info({
        action: 'report_parsing_job_completed',
        jobId: job.id,
        companyId: job.data.companyId,
        symbol: job.data.symbol,
        year: job.data.year,
        result: job.returnvalue,
        processingTime: job.processedOn ? job.processedOn - job.timestamp : 0,
      });
    });

    this.worker.on('failed', (job: Job<ReportParsingJobData, any>, err: Error) => {
      logger.error({
        action: 'report_parsing_job_failed',
        jobId: job.id,
        companyId: job.data.companyId,
        symbol: job.data.symbol,
        year: job.data.year,
        error: err.message,
        stack: err.stack,
        attemptsMade: job.attemptsMade,
      });
    });

    this.worker.on('error', (err: Error) => {
      logger.error({
        action: 'report_parser_worker_error',
        error: err.message,
        stack: err.stack,
      });
    });

    this.worker.on('stalled', (job: Job) => {
      logger.warn({
        action: 'report_parsing_job_stalled',
        jobId: job.id,
        companyId: job.data.companyId,
        symbol: job.data.symbol,
        year: job.data.year,
      });
    });
  }

  async processJob(job: Job<ReportParsingJobData>): Promise<ReportParsingJobResult> {
    const startTime = Date.now();
    const { companyId, symbol, year, pdfUrl, userId } = job.data;

    logger.info({
      action: 'report_parsing_job_started',
      jobId: job.id,
      companyId,
      symbol,
      year,
      pdfUrl,
      userId,
    });

    try {
      // Update job status to processing
      await job.updateProgress(10, 'Downloading PDF...');
      
      // Download PDF from URL
      let pdfBuffer: Buffer;
      if (pdfUrl.startsWith('http')) {
        pdfBuffer = await PDFParserService.downloadPDF(pdfUrl);
      } else {
        // Handle local file upload
        throw new Error('Local file upload not implemented yet');
      }

      await job.updateProgress(30, 'Validating PDF...');

      // Validate PDF file
      await PDFParserService.validatePDFFile(pdfBuffer);

      await job.updateProgress(50, 'Extracting text...');

      // Parse PDF and extract financial metrics
      const parsedData = await PDFParserService.parsePDFReport(
        companyId,
        symbol,
        year,
        pdfBuffer,
        'url'
      );

      await job.updateProgress(80, 'Storing financial data...');

      // Store extracted data in database
      await PDFParserService.storeFinancialData(parsedData);

      await job.updateProgress(90, 'Calculating financial ratios...');

      // Calculate financial ratios
      const ratios = PDFParserService.calculateFinancialRatios(parsedData.metrics);

      const processingTime = Date.now() - startTime;

      const result: ReportParsingJobResult = {
        success: true,
        companyId,
        symbol,
        year,
        metrics: {
          ...parsedData.metrics,
          ratios,
        },
        processingTime,
        source: parsedData.source,
        confidence: parsedData.confidence,
      };

      await job.updateProgress(100, 'Completed');

      logger.info({
        action: 'report_parsing_job_success',
        jobId: job.id,
        companyId,
        symbol,
        year,
        processingTime,
        source: parsedData.source,
        confidence: parsedData.confidence,
        metricsCount: Object.keys(parsedData.metrics).length,
        ratiosCount: Object.keys(ratios).length,
      });

      return result;
    } catch (error: any) {
      const processingTime = Date.now() - startTime;

      logger.error({
        action: 'report_parsing_job_error',
        jobId: job.id,
        companyId,
        symbol,
        year,
        error: error.message,
        stack: error.stack,
        processingTime,
      });

      // Don't retry for certain errors
      if (error.message.includes('Invalid PDF file') || 
          error.message.includes('File size exceeds') ||
          error.message.includes('Failed to download PDF')) {
        throw error; // Don't retry
      }

      // Retry for other errors
      throw error;
    }
  }

  async close(): Promise<void> {
    await this.worker.close();
    logger.info({ action: 'report_parser_worker_closed' });
  }

  getWorker(): Worker {
    return this.worker;
  }
}

// Create and export worker instance
export const reportParserWorker = new ReportParserWorker();
