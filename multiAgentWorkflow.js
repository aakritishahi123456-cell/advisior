require('dotenv').config();
const DocumentReaderAgent = require('./documentReaderAgent');
const MetricsExtractionAgent = require('./metricsExtractionAgent');
const SectorClassificationAgent = require('./sectorClassifier');
const ValuationAnalysisAgent = require('./valuationAgent');

async function runMultiAgentAnalysis(companyName) {
    console.log(`\n==================================================`);
    console.log(`    FinSathi AI - Multi-Agent Analysis Pipeline`);
    console.log(`==================================================`);

    try {
        // Instantiate the agents
        const readerAgent = new DocumentReaderAgent();
        const metricsAgent = new MetricsExtractionAgent();
        const sectorAgent = new SectorClassificationAgent();
        const valuationAgent = new ValuationAnalysisAgent();

        // Step 1: Document Reader (Retrieval)
        console.log(`\n[Stage 1]: Document Retrieval`);
        const docs = await readerAgent.readDocumentsForCompany(companyName);

        if (!docs || docs.length === 0) {
            console.log(`No documents found for ${companyName}. Please ensure documents are indexed.`);
            return;
        }

        // Step 2 & 3: Parallel Extraction and Classification
        console.log(`\n[Stage 2 & 3]: Parallel Metrics Extraction & Sector Classification`);
        const [metrics, sector] = await Promise.all([
            metricsAgent.extractMetrics(companyName, docs),
            sectorAgent.classifySector(companyName, docs)
        ]);

        // Step 4: Final Valuation Synthesis
        console.log(`\n[Stage 4]: Valuation Analysis Synthesis`);
        const verdict = await valuationAgent.analyzeValuation(companyName, sector, metrics);

        // Print Final Output
        console.log(`\n==================================================`);
        console.log(`                   FINAL REPORT                   `);
        console.log(`==================================================`);
        console.log(`Company: ${companyName}`);
        console.log(`Sector: ${sector.sector}`);
        console.log(`ROE: ${metrics.ROE}`);
        console.log(`Valuation: ${verdict.valuation}`);
        console.log(`Confidence score: ${verdict.confidence_score}`);
        console.log(`--------------------------------------------------`);
        console.log(`Reasoning: ${verdict.reasoning}`);
        console.log(`--------------------------------------------------`);
        console.log(`Primary References:`);
        // Just print the first couple of unique references to avoid spamming the console
        const allRefs = new Set([...metrics.references, ...sector.references, ...verdict.references]);
        Array.from(allRefs).slice(0, 5).forEach(ref => {
            console.log(`  - ${ref}`);
        });
        console.log(`==================================================\n`);

    } catch (error) {
        console.error(`\n[ERROR]: Pipeline failed for ${companyName}`);
        console.error(error);
    }
}

// Ensure the OPENAI_API_KEY is available
if (!process.env.OPENAI_API_KEY) {
    console.error("CRITICAL: OPENAI_API_KEY environment variable is missing.");
    process.exit(1);
}

// Allow passing company name as CLI argument, default to NABIL Bank
const targetCompany = process.argv[2] || "NABIL Bank";
runMultiAgentAnalysis(targetCompany);
