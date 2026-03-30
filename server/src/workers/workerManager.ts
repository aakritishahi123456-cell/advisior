import { queueManager, QUEUE_NAMES } from '../queues/queueManager';
import logger from '../utils/logger';

export class WorkerManager {
  private workers: Map<string, any> = new Map();

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing worker manager...');

      await this.registerWorker(QUEUE_NAMES.REPORT_PARSING, './report-parser.worker', 5, 'Report parsing');
      await this.registerWorker(QUEUE_NAMES.AI_REPORT, './ai-report.worker', 3, 'AI report');
      await this.registerWorker(QUEUE_NAMES.NEPSE_COLLECTOR, './nepse-collector.worker', 1, 'NEPSE collector');
      await this.registerWorker(QUEUE_NAMES.LOAN_PRODUCTS_SCRAPER, './loan-products-scraper.worker', 1, 'Loan products scraper');
      await this.registerWorker(QUEUE_NAMES.FUNDAMENTALS_SCRAPING, './fundamentals.worker', 2, 'Fundamentals scraping pipeline');
      await this.registerWorker(QUEUE_NAMES.PORTFOLIO_RECALCULATION, './portfolio.worker', 5, 'Portfolio recalculation');

      logger.info('Worker manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize worker manager:', error);
      throw error;
    }
  }

  private async registerWorker(
    queueName: string,
    modulePath: string,
    concurrency: number,
    label: string
  ): Promise<void> {
    const queue = queueManager.getQueue(queueName);
    if (!queue) {
      logger.warn(`${label} worker skipped because queue ${queueName} is unavailable`);
      return;
    }

    try {
      const module = await import(modulePath);
      const processor = module.default;

      if (typeof processor !== 'function') {
        logger.warn(`${label} worker skipped because ${modulePath} has no default processor export`);
        return;
      }

      queue.process(concurrency, processor);
      this.workers.set(queueName, queue);
      logger.info(`${label} worker initialized`);
    } catch (error) {
      logger.warn(`${label} worker disabled during startup`, {
        queueName,
        modulePath,
        error: error instanceof Error ? error.message : String(error),
      });
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
