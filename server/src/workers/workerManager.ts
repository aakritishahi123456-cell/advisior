import { queueManager, QUEUE_NAMES } from '../queues/queueManager';
import reportParserProcessor from './report-parser.worker';
import aiReportProcessor from './ai-report.worker';
import nepseCollectorProcessor from './nepse-collector.worker';
import loanProductsScraperProcessor from './loan-products-scraper.worker';
import logger from '../utils/logger';

export class WorkerManager {
  private workers: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing worker manager...');

      // Initialize report parsing worker
      const reportParsingQueue = queueManager.getQueue(QUEUE_NAMES.REPORT_PARSING);
      if (reportParsingQueue) {
        reportParsingQueue.process(5, reportParserProcessor);
        this.workers.set(QUEUE_NAMES.REPORT_PARSING, reportParsingQueue);
        logger.info('Report parsing worker initialized');
      }

      // Initialize AI report worker
      const aiReportQueue = queueManager.getQueue(QUEUE_NAMES.AI_REPORT);
      if (aiReportQueue) {
        aiReportQueue.process(3, aiReportProcessor);
        this.workers.set(QUEUE_NAMES.AI_REPORT, aiReportQueue);
        logger.info('AI report worker initialized');
      }

      // Initialize NEPSE collector worker
      const nepseCollectorQueue = queueManager.getQueue(QUEUE_NAMES.NEPSE_COLLECTOR);
      if (nepseCollectorQueue) {
        nepseCollectorQueue.process(1, nepseCollectorProcessor);
        this.workers.set(QUEUE_NAMES.NEPSE_COLLECTOR, nepseCollectorQueue);
        logger.info('NEPSE collector worker initialized');
      }

      // Initialize loan products scraper worker
      const loanProductsQueue = queueManager.getQueue(QUEUE_NAMES.LOAN_PRODUCTS_SCRAPER);
      if (loanProductsQueue) {
        loanProductsQueue.process(1, loanProductsScraperProcessor);
        this.workers.set(QUEUE_NAMES.LOAN_PRODUCTS_SCRAPER, loanProductsQueue);
        logger.info('Loan products scraper worker initialized');
      }

      logger.info('Worker manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize worker manager:', error);
      throw error;
    }
  }

  async shutdown(): Promise<void> {
    logger.info('Shutting down worker manager...');

    const shutdownPromises = Array.from(this.workers.values()).map(worker => {
      return worker.close();
    });

    await Promise.all(shutdownPromises);
    this.workers.clear();

    logger.info('Worker manager shutdown complete');
  }

  getWorkerStatus(): Record<string, any> {
    const status: Record<string, any> = {};

    for (const [queueName, worker] of this.workers) {
      status[queueName] = {
        initialized: true,
        queueName,
        // Add more worker-specific status as needed
      };
    }

    return status;
  }
}

export const workerManager = new WorkerManager();
