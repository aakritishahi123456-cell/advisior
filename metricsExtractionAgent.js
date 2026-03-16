const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { z } = require("zod");

class MetricsExtractionAgent {
    /**
     * Agent responsible for precisely extracting quantitative metrics 
     * from unstructured report texts.
     */
    constructor() {
        // Temperature 0 for deterministic, factual quantitative extraction
        this.llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });

        // Define strict Zod schema enforcing source tracking for every metric
        this.parser = StructuredOutputParser.fromZodSchema(z.object({
            ROE: z.string().describe("Return on Equity percentage (e.g., '18%') or 'N/A' if missing."),
            PE_Ratio: z.string().describe("Price to Earnings ratio (e.g., '15.5') or 'N/A'."),
            PB_Ratio: z.string().describe("Price to Book ratio or 'N/A'."),
            Revenue_Growth: z.string().describe("Revenue or Operating Income growth percentage or 'N/A'."),
            reasoning: z.string().describe("Logical narrative explaining exactly where in the context these metrics were found."),
            references: z.array(z.string()).describe("List of explicit source document names and page numbers used as evidence.")
        }));
    }

    /**
     * Extracts structured metrics from raw Langchain documents.
     * @param {string} companyName - The target company.
     * @param {Array<Object>} contexts - Unstructured docs retrieved by DocumentReaderAgent.
     * @returns {Promise<Object>} JSON containing the required numerical facts and their citations.
     */
    async extractMetrics(companyName, contexts) {
        console.log(`Metrics Extraction Agent: Parsing raw text for ${companyName} metrics...`);

        const formatInstructions = this.parser.getFormatInstructions();

        const promptTemplate = new PromptTemplate({
            template: `You are an expert financial data extraction system for FinSathi AI.
Extract key quantitative financial metrics for {company_name} from the contexts below.
Ensure you use exact numbers from the context. If a metric cannot be confidently found, you must mark it as 'N/A'.
Context MUST be explicitly referenced in the 'references' array using the exact format "Document: [name], Page: [number]".

Contexts:
{context_string}

{format_instructions}`,
            inputVariables: ["company_name", "context_string"],
            partialVariables: { format_instructions: formatInstructions }
        });

        // Combine the pageContent and metadata into a readable structured string for the LLM
        const contextString = contexts.map(doc =>
            `---
Source: ${doc.metadata?.source_document || 'Unknown'} (Page: ${doc.metadata?.page_number || 'Unknown'})
Content: ${doc.pageContent}
---`
        ).join("\n");

        const prompt = await promptTemplate.format({
            company_name: companyName,
            context_string: contextString
        });

        const response = await this.llm.invoke(prompt);
        return await this.parser.parse(response.content);
    }
}

module.exports = MetricsExtractionAgent;
