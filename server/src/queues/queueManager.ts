import Bull from 'bull';
import { Redis } from 'ioredis';
import { connectRedis, getRedis } from '../config/redis';
import logger from '../utils/logger';

// Queue names
export const QUEUE_NAMES = {
  REPORT_PARSING: 'report-parsing',
  AI_REPORT: 'ai-report',
  NOTIFICATIONS: 'notifications',
  EMAIL_SENDING: 'email-sending',
  DATA_SYNC: 'data-sync',
  NEPSE_COLLECTOR: 'nepse-collector',
  LOAN_PRODUCTS_SCRAPER: 'loan-products-scraper'
} as const;

// Job types
export interface ReportParsingJob {
  type: 'report-parsing';
  reportId: string;
  userId: string;
  fileUrl?: string;
  content?: string;
  reportType: string;
}

export interface AIReportJob {
  type: 'ai-report';
  reportId: string;
  userId: string;
  analysisType: string;
  inputData: any;
  priority?: 'low' | 'normal' | 'high';
}

export interface NotificationJob {
  type: 'notification';
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  data?: any;
}

export interface EmailJob {
  type: 'email';
  to: string;
  subject: string;
  template: string;
  data: any;
}

// Queue configurations
const queueConfigs = {
  [QUEUE_NAMES.REPORT_PARSING]: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 2000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    settings: {
      maxConcurrency: 5,
    }
  },
  [QUEUE_NAMES.AI_REPORT]: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    settings: {
      maxConcurrency: 3,
    }
  },
  [QUEUE_NAMES.NOTIFICATIONS]: {
    defaultJobOptions: {
      attempts: 5,
      backoff: {
        type: 'exponential',
        delay: 1000,
      },
      removeOnComplete: 200,
      removeOnFail: 100,
    },
    settings: {
      maxConcurrency: 10,
    }
  },
  [QUEUE_NAMES.EMAIL_SENDING]: {
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 3000,
      },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    settings: {
      maxConcurrency: 2,
    }
  },
  [QUEUE_NAMES.NEPSE_COLLECTOR]: {
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 10_000,
      },
      removeOnComplete: 20,
      removeOnFail: 50,
    },
    settings: {
      maxConcurrency: 1,
    }
  },
  [QUEUE_NAMES.LOAN_PRODUCTS_SCRAPER]: {
    defaultJobOptions: {
      attempts: 2,
      backoff: {
        type: 'exponential',
        delay: 30_000,
      },
      removeOnComplete: 20,
      removeOnFail: 50,
    },
    settings: {
      maxConcurrency: 1,
    }
  }
};

class QueueManager {
  private queues: Map<string, Bull.Queue> = new Map();
  private redis: Redis;

  constructor() {
    this.redis = getRedis();
  }

  async initialize(): Promise<void> {
    try {
      logger.info('Initializing queue manager...');

      // Initialize all queues
      for (const [queueName, config] of Object.entries(queueConfigs)) {
        const queue = new Bull(queueName, {
          redis: this.redis,
          defaultJobOptions: config.defaultJobOptions,
          settings: config.settings,
        });

        // Set up event listeners
        this.setupQueueListeners(queue, queueName);

        this.queues.set(queueName, queue);
        logger.info(`Initialized queue: ${queueName}`);
      }

      logger.info('Queue manager initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize queue manager:', error);
      throw error;
    }
  }

  private setupQueueListeners(queue: Bull.Queue, queueName: string): void {
    // Job completed
    queue.on('completed', (job, result) => {
      logger.info({
        queue: queueName,
        jobId: job.id,
        jobName: job.name,
        result: result,
        action: 'job_completed'
      });
    });

    // Job failed
    queue.on('failed', (job, err) => {
      logger.error({
        queue: queueName,
        jobId: job.id,
        jobName: job.name,
        error: err.message,
        attempts: job.attemptsMade,
        action: 'job_failed'
      });

      // If max attempts reached, move to dead letter queue
      if (job.attemptsMade === job.opts.attempts) {
        this.moveToDeadLetterQueue(job, queueName, err);
      }
    });

    // Job stalled
    queue.on('stalled', (job) => {
      logger.warn({
        queue: queueName,
        jobId: job.id,
        jobName: job.name,
        action: 'job_stalled'
      });
    });

    // Queue error
    queue.on('error', (err) => {
      logger.error({
        queue: queueName,
        error: err.message,
        action: 'queue_error'
      });
    });
  }

  private async moveToDeadLetterQueue(job: Bull.Job, queueName: string, error: Error): Promise<void> {
    try {
      const deadLetterQueue = new Bull(`${queueName}-dead-letter`, {
        redis: this.redis,
      });

      await deadLetterQueue.add({
        originalJobId: job.id,
        originalJobName: job.name,
        originalQueue: queueName,
        data: job.data,
        error: error.message,
        stack: error.stack,
        failedAt: new Date().toISOString(),
        attempts: job.attemptsMade,
      });

      logger.info({
        originalJobId: job.id,
        originalQueue: queueName,
        deadLetterJobId: `${queueName}-dead-letter`,
        action: 'moved_to_dead_letter'
      });
    } catch (dlqError) {
      logger.error('Failed to move job to dead letter queue:', dlqError);
    }
  }

  // Get queue by name
  getQueue(queueName: string): Bull.Queue | undefined {
    return this.queues.get(queueName);
  }

  // Add job to queue
  async addJob(queueName: string, jobData: any, options?: Bull.JobOptions): Promise<Bull.Job> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    return queue.add(jobData, options);
  }

  // Get queue statistics
  async getQueueStats(queueName: string): Promise<any> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    const waiting = await queue.getWaiting();
    const active = await queue.getActive();
    const completed = await queue.getCompleted();
    const failed = await queue.getFailed();

    return {
      waiting: waiting.length,
      active: active.length,
      completed: completed.length,
      failed: failed.length,
      total: waiting.length + active.length + completed.length + failed.length
    };
  }

  // Get all queue statistics
  async getAllQueueStats(): Promise<Record<string, any>> {
    const stats: Record<string, any> = {};

    for (const queueName of Object.values(QUEUE_NAMES)) {
      try {
        stats[queueName] = await this.getQueueStats(queueName);
      } catch (error) {
        stats[queueName] = { error: error.message };
      }
    }

    return stats;
  }

  // Pause queue
  async pauseQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.pause();
    logger.info(`Paused queue: ${queueName}`);
  }

  // Resume queue
  async resumeQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.resume();
    logger.info(`Resumed queue: {queueName}`);
  }

  // Clear queue
  async clearQueue(queueName: string): Promise<void> {
    const queue = this.getQueue(queueName);
    if (!queue) {
      throw new Error(`Queue ${queueName} not found`);
    }

    await queue.clean(0, 'completed');
    await queue.clean(0, 'failed');
    logger.info(`Cleared queue: ${queueName}`);
  }

  // Graceful shutdown
  async shutdown(): Promise<void> {
    logger.info('Shutting down queue manager...');

    const shutdownPromises = Array.from(this.queues.values()).map(queue => {
      return queue.close();
    });

    await Promise.all(shutdownPromises);
    this.queues.clear();

    logger.info('Queue manager shutdown complete');
  }
}

// Singleton instance
export const queueManager = new QueueManager();
