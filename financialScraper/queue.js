const Queue = require('bull');
const pino = require('pino');

const logger = pino({ name: 'financial-scraper-queue' });

// Initialize the queue to manage standard scaling and background workers
// You should have a Redis instance running, e.g., on localhost:6379 natively or inside docker-compose
const scraperQueue = new Queue('financial-statements-scraper', process.env.REDIS_URL || 'redis://127.0.0.1:6379');

/**
 * Enqueues a scraping job
 * @param {Object} jobData { companySymbol, fiscalYear, quarter, sourceUrl, isPdf }
 */
async function addScrapingJob(jobData) {
    logger.info({ jobData }, 'Adding new scraping job to queue');

    return await scraperQueue.add(jobData, {
        // Retry logic specified by the prompt
        attempts: 3,
        backoff: {
            type: 'exponential',
            delay: 5000 // 5s, 10s, 20s
        },
        // Deduplication constraint (prevents duplicate jobs in the queue with the same Job ID)
        jobId: `${jobData.companySymbol}-${jobData.fiscalYear}-${jobData.quarter}`,
        removeOnComplete: true, // Auto clean up success
        removeOnFail: false // Keep failed jobs for manual inspect
    });
}

// Graceful shutdown handling
process.on('SIGINT', async () => {
    await scraperQueue.close();
    process.exit(0);
});

module.exports = {
    scraperQueue,
    addScrapingJob,
};
