require('dotenv').config();
const DocumentReferenceService = require('./documentReferenceService');
const CitationExtractor = require('./citationExtractor');

class VerifiedAnswerEngine {
    constructor() {
        this.documentService = new DocumentReferenceService();
        this.extractor = new CitationExtractor();
    }

    /**
     * Completes the full query-to-answer loop ensuring strictly 
     * formatted verified citations or fallback strings.
     * @param {string} question - The user's financial question.
     * @returns {Promise<string>} The formally verified string response.
     */
    async evaluateVerifiedQuery(question) {
        try {
            // 1. Fetch official document chunks
            const rawContexts = await this.documentService.retrieveVerifiedChunks(question);

            // If completely empty database/results
            if (!rawContexts || rawContexts.length === 0) {
                return "Insufficient verified data.";
            }

            // 2. Extractor processes raw strings to strictly typed JSON
            const factObj = await this.extractor.extractVerifiedFacts(question, rawContexts);

            // 3. Formatter: Fallback logic vs Strict Format Request
            if (!factObj.hasSufficientData) {
                return "Insufficient verified data.";
            }

            // Build the exact required block formatting (Answer, Source, Page, Citation)
            const finalFormattedString = `Answer\n${factObj.answer}\n\nSource\n${factObj.sourceDocument}\n\nPage\n${factObj.pageNumber}\n\nCitation\n"${factObj.citationSnippet}"`;

            return finalFormattedString;

        } catch (error) {
            console.error("VerifiedAnswerEngine: CRITICAL PIPELINE ERROR:", error.message);

            // To be robust, even systematic errors should securely reply insufficient
            // to avoid revealing system state or confusing users.
            return "Insufficient verified data.";
        }
    }
}

module.exports = VerifiedAnswerEngine;

// Allow the file to be tested from terminal quickly:
if (require.main === module) {
    (async () => {
        const targetQuestion = process.argv[2] || "What was the revenue growth of NABIL Bank in 2023?";
        const engine = new VerifiedAnswerEngine();
        console.log(`\nQuestion: "${targetQuestion}"`);
        console.log(`\n============================`);
        const result = await engine.evaluateVerifiedQuery(targetQuestion);
        console.log(result);
        console.log(`============================\n`);
    })();
}
