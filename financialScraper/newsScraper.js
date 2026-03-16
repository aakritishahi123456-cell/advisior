const axios = require('axios');
const cheerio = require('cheerio');
const pino = require('pino');

const logger = pino({ name: 'news-scraper-agent' });

/**
 * Scrapes breaking news articles from major Nepali financial portals.
 * @param {string} portalUrl Required source endpoint page
 * @returns {Promise<Array>} Extracted raw `articles` listing
 */
async function scrapeFinancialNews(portalUrl) {
    logger.info(`Initiating news extraction cycle on: ${portalUrl}`);
    
    try {
        const response = await axios.get(portalUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/100.0.0.0 Safari/537.36'
            }
        });

        const $ = cheerio.load(response.data);
        const articles = [];

        // Note: Simulating extraction logic selecting typical container selectors:
        $('.news-list-item, article').each((_, element) => {
            const title = $(element).find('h2, .title').text().trim();
            const link = $(element).find('a').attr('href');
            const summary = $(element).find('p.excerpt, .summary').text().trim();
            const dateStr = $(element).find('.date, time').text().trim();
            
            if (!title || !link) return;

            // Generate full absolute URL if link is relative
            const fullUrl = link.startsWith('http') ? link : new URL(link, portalUrl).toString();

            articles.push({
                title,
                summary,
                sourceUrl: fullUrl,
                sourceName: new URL(portalUrl).hostname,
                publishedAt: dateStr ? new Date(dateStr) : new Date(), // Extracted or fallback to now
            });
        });

        logger.info(`Successfully parsed ${articles.length} headlines. Extracting body contents...`);

        // Enhance links by directly pulling inner body texts for better LLM precision
        const enrichedArticles = await Promise.all(
            articles.map(async (article) => {
                try {
                    const articleResponse = await axios.get(article.sourceUrl);
                    const article$ = cheerio.load(articleResponse.data);
                    
                    // Pull specific wrapper contexts
                    const contentSegments = [];
                    article$('article p, .post-content p').each((_, p) => {
                        contentSegments.push(article$(p).text().trim());
                    });

                    article.content = contentSegments.join('\n\n');
                    return article;
                } catch (innerError) {
                    logger.warn(`Failed extracting deep content for ${article.sourceUrl}. Continuing with summary...`);
                    article.content = article.summary || article.title; // Minimum viable LLM input
                    return article;
                }
            })
        );

        return enrichedArticles;
    } catch (error) {
        logger.error(`Critical fetching error in News Ingestion: ${error.message}`);
        throw error;
    }
}

module.exports = {
   scrapeFinancialNews 
};
