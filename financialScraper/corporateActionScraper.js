const axios = require('axios');
const cheerio = require('cheerio');
const pino = require('pino');

const logger = pino({ name: 'corporate-action-scraper' });

/**
 * Scrapes NEPSE or official portal for the latest corporate actions.
 * @param {string} sourceUrl The disclosures/announcements page URL
 * @returns {Promise<Array>} Array of corporate action objects
 */
async function scrapeCorporateActions(sourceUrl) {
    logger.info(`Starting scrape for corporate actions from ${sourceUrl}`);
    
    try {
        const response = await axios.get(sourceUrl, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
            }
        });
        
        const $ = cheerio.load(response.data);
        const actions = [];
        
        // This is a simulated extraction logic using typical tabular data found in disclosures
        // Row format: [Date, Company Symbol, Action Type, Details, Book Close Date]
        $('table.disclosures-table tbody tr').each((_, element) => {
            const cells = $(element).find('td');
            if (cells.length < 5) return;
            
            const announcementDateStr = $(cells[0]).text().trim();
            const companySymbol = $(cells[1]).text().trim();
            const actionTypeName = $(cells[2]).text().trim();
            const details = $(cells[3]).text().trim();
            const recordDateStr = $(cells[4]).text().trim();
            
            // Example parsing from details: "10% Bonus Share and 5% Cash Dividend"
            let bonusPercent = 0;
            let cashPercent = 0;
            let ratio = null;

            const bonusMatch = details.match(/(\d+(?:\.\d+)?)\s*%\s*Bonus/i);
            const cashMatch = details.match(/(\d+(?:\.\d+)?)\s*%\s*Cash/i);
            const ratioMatch = details.match(/(\d+:\d+)\s*Right/i);
            
            if (bonusMatch) bonusPercent = parseFloat(bonusMatch[1]);
            if (cashMatch) cashPercent = parseFloat(cashMatch[1]);
            if (ratioMatch) ratio = ratioMatch[1];

            actions.push({
                symbol: companySymbol,
                actionTypeName: actionTypeName,
                announcementDate: new Date(announcementDateStr),
                recordDate: recordDateStr && recordDateStr !== '-' ? new Date(recordDateStr) : null,
                details: details,
                dividendData: (bonusPercent > 0 || cashPercent > 0) ? {
                    bonusPercentage: bonusPercent,
                    cashPercentage: cashPercent,
                    totalPercentage: bonusPercent + cashPercent
                } : null,
                ratio: ratio,
                sourceUrl: sourceUrl
            });
        });
        
        logger.info(`Successfully extracted ${actions.length} corporate actions`);
        return actions;
    } catch (error) {
        logger.error(`Error scraping corporate actions: ${error.message}`);
        throw error;
    }
}

/**
 * Fallback parser function for specific company announcements PDF
 */
async function parseDividendAnnouncementPdf(pdfText) {
    const bonusMatch = pdfText.match(/(\d+(?:\.\d+)?)\s*%\s*bonus\s*share/i);
    const cashMatch = pdfText.match(/(\d+(?:\.\d+)?)\s*%\s*cash\s*dividend/i);
    const fiscalYearMatch = pdfText.match(/fiscal\s*year\s*(\d{4}\/\d{2,4})/i);
    
    return {
        bonusPercentage: bonusMatch ? parseFloat(bonusMatch[1]) : 0,
        cashPercentage: cashMatch ? parseFloat(cashMatch[1]) : 0,
        fiscalYear: fiscalYearMatch ? fiscalYearMatch[1] : null
    };
}

module.exports = {
    scrapeCorporateActions,
    parseDividendAnnouncementPdf
};
