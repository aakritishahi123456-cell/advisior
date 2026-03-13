import { Job } from 'bull';
import { PrismaClient, FinancialReport, ReportType } from '@prisma/client';
import { FinancialReportRepository } from '../repositories/financialReport.repository';
import { queueManager } from '../queues/queueManager';
import logger from '../utils/logger';

const prisma = new PrismaClient();

export interface ReportParsingJobData {
  type: 'report-parsing';
  reportId: string;
  userId: string;
  fileUrl?: string;
  content?: string;
  reportType: string;
}

export interface ParsedReportData {
  revenue?: number;
  expenses?: number;
  profit?: number;
  assets?: number;
  liabilities?: number;
  equity?: number;
  cashFlow?: number;
  financialRatios?: {
    debtToEquity?: number;
    currentRatio?: number;
    quickRatio?: number;
    grossMargin?: number;
    netMargin?: number;
    returnOnEquity?: number;
  };
  lineItems?: Array<{
    description: string;
    amount: number;
    category: string;
    date?: string;
  }>;
  metadata?: {
    parsedAt: string;
    parserVersion: string;
    confidence: number;
  };
}

export default async function reportParserProcessor(job: Job<ReportParsingJobData>): Promise<void> {
  const { reportId, userId, fileUrl, content, reportType } = job.data;

  logger.info({
    jobId: job.id,
    reportId,
    userId,
    reportType,
    action: 'start_report_parsing'
  });

  try {
    // Update job status to processing
    await job.progress(10);

    // Get the financial report
    const report = await FinancialReportRepository.findById(reportId, userId);
    if (!report) {
      throw new Error(`Financial report not found: ${reportId}`);
    }

    // Update job progress
    await job.progress(25);

    // Parse the report content
    let parsedData: ParsedReportData;

    if (content) {
      parsedData = await parseTextContent(content, reportType);
    } else if (fileUrl) {
      parsedData = await parseFileContent(fileUrl, reportType);
    } else {
      throw new Error('No content or file URL provided for parsing');
    }

    // Update job progress
    await job.progress(75);

    // Save parsed data to database
    const updatedReport = await FinancialReportRepository.update(reportId, userId, {
      parsedData: parsedData as any
    });

    // Update job progress to completion
    await job.progress(100);

    logger.info({
      jobId: job.id,
      reportId,
      userId,
      action: 'report_parsing_completed',
      parsedDataKeys: Object.keys(parsedData)
    });

    // Optionally, trigger AI analysis after successful parsing
    if (parsedData && shouldTriggerAIAnalysis(parsedData)) {
      await queueManager.addJob(queueManager.QUEUE_NAMES.AI_REPORT, {
        type: 'ai-report',
        reportId,
        userId,
        analysisType: 'financial-health',
        inputData: parsedData,
        priority: 'normal'
      });
    }

  } catch (error) {
    logger.error({
      jobId: job.id,
      reportId,
      userId,
      error: error.message,
      stack: error.stack,
      action: 'report_parsing_failed'
    });
    throw error;
  }
}

async function parseTextContent(content: string, reportType: string): Promise<ParsedReportData> {
  logger.info({ reportType, action: 'parsing_text_content' });

  // This is a simplified parser - in production, you would use:
  // - PDF parsing libraries (pdf-parse, pdf2pic)
  // - Excel parsing libraries (xlsx)
  // - OCR services for image-based documents
  // - NLP for text extraction

  const parsedData: ParsedData = {
    metadata: {
      parsedAt: new Date().toISOString(),
      parserVersion: '1.0.0',
      confidence: 0.85
    }
  };

  // Extract financial data using regex patterns
  const lines = content.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // Revenue patterns
    const revenueMatch = trimmedLine.match(/(?:revenue|income|sales)[:\s]*\$?\s*([\d,]+(?:\.\d+)?)/i);
    if (revenueMatch) {
      parsedData.revenue = parseFloat(revenueMatch[1].replace(/,/g, ''));
    }

    // Expense patterns
    const expenseMatch = trimmedLine.match(/(?:expense|cost|spending)[:\s]*\$?\s*([\d,]+(?:\.\d+)?)/i);
    if (expenseMatch) {
      parsedData.expenses = parseFloat(expenseMatch[1].replace(/,/g, ''));
    }

    // Asset patterns
    const assetMatch = trimmedLine.match(/(?:assets|total assets)[:\s]*\$?\s*([\d,]+(?:\.\d+)?)/i);
    if (assetMatch) {
      parsedData.assets = parseFloat(assetMatch[1].replace(/,/g, ''));
    }

    // Liability patterns
    const liabilityMatch = trimmedLine.match(/(?:liabilities|total liabilities)[:\s]*\$?\s*([\d,]+(?:\.\d+)?)/i);
    if (liabilityMatch) {
      parsedData.liabilities = parseFloat(liabilityMatch[1].replace(/,/g, ''));
    }

    // Equity patterns
    const equityMatch = trimmedLine.match(/(?:equity|shareholders'?\s*equity)[:\s]*\$?\s*([\d,]+(?:\.\d+)?)/i);
    if (equityMatch) {
      parsedData.equity = parseFloat(equityMatch[1].replace(/,/g, ''));
    }
  }

  // Calculate derived values
  if (parsedData.revenue && parsedData.expenses) {
    parsedData.profit = parsedData.revenue - parsedData.expenses;
  }

  if (parsedData.assets && parsedData.liabilities) {
    parsedData.equity = parsedData.assets - parsedData.liabilities;
  }

  // Calculate financial ratios
  parsedData.financialRatios = {};
  
  if (parsedData.liabilities && parsedData.equity && parsedData.equity > 0) {
    parsedData.financialRatios.debtToEquity = parsedData.liabilities / parsedData.equity;
  }

  if (parsedData.assets && parsedData.liabilities && parsedData.assets > 0) {
    parsedData.financialRatios.currentRatio = parsedData.assets / parsedData.liabilities;
  }

  if (parsedData.revenue && parsedData.profit && parsedData.revenue > 0) {
    parsedData.financialRatios.netMargin = (parsedData.profit / parsedData.revenue) * 100;
  }

  if (parsedData.profit && parsedData.equity && parsedData.equity > 0) {
    parsedData.financialRatios.returnOnEquity = (parsedData.profit / parsedData.equity) * 100;
  }

  return parsedData;
}

async function parseFileContent(fileUrl: string, reportType: string): Promise<ParsedReportData> {
  logger.info({ fileUrl, reportType, action: 'parsing_file_content' });

  // In production, you would:
  // 1. Download the file from cloud storage
  // 2. Use appropriate parser based on file type
  // 3. Extract text content
  // 4. Parse the extracted text

  // For now, return mock data
  return {
    revenue: Math.random() * 1000000 + 500000,
    expenses: Math.random() * 800000 + 300000,
    profit: Math.random() * 200000 + 50000,
    assets: Math.random() * 2000000 + 1000000,
    liabilities: Math.random() * 1000000 + 500000,
    equity: Math.random() * 1500000 + 750000,
    cashFlow: Math.random() * 300000 + 100000,
    financialRatios: {
      debtToEquity: Math.random() * 2 + 0.5,
      currentRatio: Math.random() * 3 + 1,
      grossMargin: Math.random() * 40 + 10,
      netMargin: Math.random() * 30 + 5,
      returnOnEquity: Math.random() * 25 + 5
    },
    metadata: {
      parsedAt: new Date().toISOString(),
      parserVersion: '1.0.0',
      confidence: 0.75
    }
  };
}

function shouldTriggerAIAnalysis(parsedData: ParsedReportData): boolean {
  // Trigger AI analysis if we have meaningful financial data
  return !!(
    parsedData.revenue && 
    parsedData.revenue > 0 &&
    parsedData.financialRatios &&
    Object.keys(parsedData.financialRatios).length > 0
  );
}

// Graceful shutdown handler
process.on('SIGINT', () => {
  logger.info('Report parser worker shutting down...');
  prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', () => {
  logger.info('Report parser worker shutting down...');
  prisma.$disconnect();
  process.exit(0);
});
