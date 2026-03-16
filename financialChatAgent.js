require('dotenv').config();
const QueryInterpreter = require('./queryInterpreter');
const DocumentReaderAgent = require('./documentReaderAgent');
const MetricsExtractionAgent = require('./metricsExtractionAgent');
const FinancialReasoningEngine = require('./financialReasoningEngine');

class FinancialChatAgent {
    /**
     * Top-level conversational agent orchestrating the NLP understanding, 
     * multi-document retrieval, strict fact extraction, and math synthesis.
     */
    constructor() {
        this.interpreter = new QueryInterpreter();
        // Recycles standard pipeline agents built previously for DRY efficiency
        this.documentReader = new DocumentReaderAgent();
        this.metricsExtractor = new MetricsExtractionAgent();
        this.reasoningEngine = new FinancialReasoningEngine();
    }

    /**
     * Executes the conversational loop for complex comparative/calculated queries.
     * @param {string} userQuery - E.g., "Compare NABIL Bank and Standard Chartered revenue growth"
     * @returns {Promise<Object>} Fully calculated summary response.
     */
    async processChatQuery(userQuery) {
        console.log(`\n==================================================`);
        console.log(`   FinSathi AI - Conversational Research Engine   `);
        console.log(`==================================================`);
        console.log(`User: "${userQuery}"\n`);

        try {
            // Step 1: Query decomposition
            const queryPlan = await this.interpreter.interpretQuery(userQuery);
            console.log(`[Stage 1]: Intent Decomposed -> ${queryPlan.intent.toUpperCase()}`);
            console.log(`     Target Companies: ${queryPlan.target_companies.join(', ')}`);
            console.log(`     Required Metrics: ${queryPlan.metrics_required.join(', ')}`);

            // Step 2: Retrieve Documents per Company
            console.log(`\n[Stage 2]: Document Retrieval`);
            let companyDocs = {};
            for (const company of queryPlan.target_companies) {
                // Returns highly relevant chunks for the exact company
                const docs = await this.documentReader.readDocumentsForCompany(company);
                companyDocs[company] = docs;
            }

            // Step 3: Extract Facts precisely 
            // We use the metrics extraction agent from the pipeline to pull strict numbers 
            // so our reasoning agent isn't hallucinating math on raw text.
            console.log(`\n[Stage 3]: Quantitative Fact Extraction`);
            let extractedFacts = {};
            for (const company of queryPlan.target_companies) {
                // the extractor parses ROE, PE, PB, and Growth specifically from the retrieved contexts
                const metrics = await this.metricsExtractor.extractMetrics(company, companyDocs[company]);
                extractedFacts[company] = metrics;
            }

            // Step 4: Complex Financial Reasoning / Math / Comparison
            console.log(`\n[Stage 4]: Analytical Synthesis & Calculation`);
            const finalAnalysis = await this.reasoningEngine.performReasoning(
                userQuery,
                queryPlan,
                extractedFacts
            );

            console.log(`\n==================================================`);
            console.log(`                     ANSWER                       `);
            console.log(`==================================================`);
            console.log(`Verdict     : ${finalAnalysis.final_verdict}`);
            console.log(`Synthesis   : ${finalAnalysis.synthesis}`);
            console.log(`Confidence  : ${finalAnalysis.confidence}`);
            if (finalAnalysis.calculations_performed.length > 0) {
                console.log(`\nMath Steps Iterated:`);
                finalAnalysis.calculations_performed.forEach(calc => console.log(`  > ${calc}`));
            }
            console.log(`==================================================\n`);

            return finalAnalysis;

        } catch (error) {
            console.error(`\n[ERROR]: Conversational Engine failed processing query: ${error.message}`);
            return null;
        }
    }
}

module.exports = FinancialChatAgent;

// Test the execution directly if ran via node
if (require.main === module) {
    (async () => {
        const query = process.argv[2] || "Compare NABIL Bank and Standard Chartered Bank revenue growth.";
        const chatAgent = new FinancialChatAgent();
        await chatAgent.processChatQuery(query);
    })();
}
