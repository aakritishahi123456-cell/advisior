const { scrapeFinancialNews } = require('./newsScraper');
const { analyzeFinancialSentiment } = require('./sentimentAgent');
const { PrismaClient } = require('@prisma/client');
const pino = require('pino');

const prisma = new PrismaClient();
const logger = pino({ name: 'news-ingestion-worker' });

async function processNewsIngestion(portalUrl) {
    logger.info(`Starting Financial News polling cycle. Target: ${portalUrl}`);
    
    try {
        // 1. Scrape raw text
        const articles = await scrapeFinancialNews(portalUrl);

        for (const rawArticle of articles) {
            
            // Deduplication Check
            const existing = await prisma.newsArticle.findUnique({
                where: { sourceUrl: rawArticle.sourceUrl }
            });

            if (existing) {
                logger.info(`Skipping duplicate article processing: ${rawArticle.title}`);
                continue;
            }

            // 2. Invoke Analysis LLM Agent
            logger.info(`Routing "${rawArticle.title}" to NLP Extractor pipeline.`);
            const nlpAnalysis = await analyzeFinancialSentiment(rawArticle.title, rawArticle.content);

            // 3. Atomically Insert Data & Relations
            await prisma.$transaction(async (tx) => {
                // Insert Article Root Entity
                const dbArticle = await tx.newsArticle.create({
                    data: {
                        title: rawArticle.title,
                        content: rawArticle.content,
                        summary: nlpAnalysis.summary,
                        publishedAt: rawArticle.publishedAt,
                        sourceName: rawArticle.sourceName,
                        sourceUrl: rawArticle.sourceUrl,
                    }
                });

                // Validate matching companies and wire related links & sentiments
                for (const extraction of nlpAnalysis.companies) {
                    
                    // Fuzzy or exact matching Company logic
                    const matchCompany = await tx.company.findUnique({
                        where: { symbol: extraction.symbol.toUpperCase() }
                    });

                    if (!matchCompany) {
                        logger.warn(`Could not correlate LLM symbol ${extraction.symbol} against local DB cache... skipping sentiment assignment.`);
                        continue;
                    }

                    // Map specific article > company generic cross-link for broader tagging metrics
                    await tx.articleCompanyLink.create({
                        data: {
                            articleId: dbArticle.id,
                            companyId: matchCompany.id,
                        }
                    });

                    // Store granular Sentiment analytics
                    await tx.newsSentiment.create({
                         data: {
                            articleId: dbArticle.id,
                            companyId: matchCompany.id,
                            classification: extraction.sentiment,
                            score: extraction.score,
                            confidenceScore: extraction.confidenceScore,
                            explanation: extraction.explanation,
                         }
                    });

                    logger.info(`Integrated ${extraction.sentiment} Sentiment metrics for ${matchCompany.symbol} derived intelligently from Article [${dbArticle.id}].`);
                }
            });
            
        } // Exit Article Scope
        
    } catch (error) {
        logger.error(`Critical systemic failure running automated polling bounds: ${error.message}`);
        throw error;
    }
}

// Standalone wrapper to test module natively
if (require.main === module) {
    const url = process.argv[2] || 'https://example-breaking-business.news/nepse';
    processNewsIngestion(url)
        .then(() => {
            logger.info('NLP Polling execution finished.');
            process.exit(0);
        })
        .catch(() => process.exit(1));
}

module.exports = {
   processNewsIngestion 
};
