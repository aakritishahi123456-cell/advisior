const { scraperQueue } = require('./queue');
const { scrapeFinancialData } = require('./scraper');
const { FinancialDataSchema } = require('./validation');
const { PrismaClient } = require('@prisma/client');
const pino = require('pino');

const prisma = new PrismaClient();
const logger = pino({ name: 'financial-scraper-worker' });

logger.info('Starting Financial Fundamentals Scraper Worker...');

// Processes the scraping jobs concurrently
scraperQueue.process(5, async (job) => {
    const { companySymbol, fiscalYear, quarter, sourceUrl, isPdf } = job.data;

    logger.info(`Processing scraping job for ${companySymbol} - ${fiscalYear} ${quarter}`);

    try {
        // 1. Scrape raw data (from PDF or HTML)
        const rawData = await scrapeFinancialData(sourceUrl, isPdf);

        // 2. Validate data format (Zod schema checking)
        const validData = FinancialDataSchema.parse(rawData);

        // 3. Upsert functionality ensures we: Add new, Update existing periods
        // This provides our idempotency and deduplication feature
        const result = await prisma.$transaction(async (tx) => {
            // Find or create fiscal period
            const fiscalPeriod = await tx.fiscalPeriod.upsert({
                where: {
                    symbol_fiscalYear_quarter: { symbol: companySymbol, fiscalYear, quarter }
                },
                update: {},
                create: {
                    symbol: companySymbol,
                    fiscalYear,
                    quarter,
                }
            });

            // Upsert financial statements for deduplication/update
            const statements = await tx.financialStatement.upsert({
                where: { periodId: fiscalPeriod.id },
                update: {
                    ...validData,
                    rawSourceUrl: sourceUrl,
                    sharesOutstanding: BigInt(validData.sharesOutstanding)
                },
                create: {
                    periodId: fiscalPeriod.id,
                    ...validData,
                    rawSourceUrl: sourceUrl,
                    sharesOutstanding: BigInt(validData.sharesOutstanding)
                }
            });

            // Optionally compute or insert financial ratios here if `validData` has them

            return statements;
        });

        logger.info(`✅ Successfully updated financials for ${companySymbol} - ${fiscalYear} ${quarter}`);
        return result;

    } catch (error) {
        logger.error(`❌ Job failed for ${companySymbol}: ${error.message}`);

        // Record failure in DB error log table for tracking issues (fallback on final attempt)
        if (job.attemptsMade === job.opts.attempts - 1) {
            logger.warn('Adding permanent error log to database');
            await prisma.scrapingErrorLog.create({
                data: {
                    companySymbol,
                    sourceUrl,
                    errorMessage: error.message,
                    errorStack: error.stack,
                    retryCount: job.attemptsMade,
                    resolved: false
                }
            });
        }

        throw error; // Let Bull retry it
    }
});

// Capture failure events locally
scraperQueue.on('failed', (job, err) => {
    logger.info(`Job ${job.id} failed logic: ${err.message}`);
});

process.on('SIGINT', async () => {
    await prisma.$disconnect();
    process.exit(0);
});
