const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { z } = require("zod");

class FinancialReasoningEngine {
    /**
     * Handles complex quantitative analysis (calculating growth, deltas)
     * and compiles the final explanation across multiple companies/metrics.
     */
    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0.1 });

        // Zod parser enforcing a clear breakdown of the analysis with calculations
        this.parser = StructuredOutputParser.fromZodSchema(z.object({
            synthesis: z.string().describe("A conversational, clear explanation of the findings, including the results of any implicit calculations (like growth rates)."),
            calculations_performed: z.array(z.string()).describe("A list of explicit math steps performed based on the data (e.g., '(11.5 - 10.2) / 10.2 = 12.7%')."),
            confidence: z.enum(["High", "Medium", "Low"]).describe("Confidence level based on the quality and completeness of the retrieved facts."),
            final_verdict: z.string().describe("A direct one-sentence answer resolving the primary intent of the user (e.g., 'NABIL Bank grew faster than Standard Chartered.').")
        }));
    }

    /**
     * Runs multi-company metric facts through the LLM instructed to perform calculations.
     * @param {Object} queryPlan - Intent breakdown from QueryInterpreter.
     * @param {Object} extractedFacts - Raw facts grabbed from the DB. 
     * @returns {Promise<Object>} Math-verified financial insight.
     */
    async performReasoning(originalQuery, queryPlan, extractedFacts) {
        console.log(`Financial Reasoning Engine: Synthesizing facts and calculating metrics...`);

        const formatInstructions = this.parser.getFormatInstructions();

        const promptTemplate = new PromptTemplate({
            template: `You are the lead quantitative analyst for FinSathi AI specializing in NEPSE.
Your task is to answer the user's complex financial question by analyzing the provided raw facts and explicitly performing any required calculations (like growth rates, differences, or ratios).

Original Question: {original_query}
Intent: {intent}
Requires Mathematical Calculation?: {requires_math}

Raw Verified Facts (from official reports):
{raw_facts}

Synthesize these facts. If you need to calculate a percentage growth rate use: ((New - Old) / Old) * 100.
If data is missing for a direct calculation, clearly state that the comparison cannot be completed.

{format_instructions}`,
            inputVariables: ["original_query", "intent", "requires_math", "raw_facts"],
            partialVariables: { format_instructions: formatInstructions }
        });

        const prompt = await promptTemplate.format({
            original_query: originalQuery,
            intent: queryPlan.intent,
            requires_math: queryPlan.requires_calculation,
            raw_facts: JSON.stringify(extractedFacts, null, 2)
        });

        const response = await this.llm.invoke(prompt);
        return await this.parser.parse(response.content);
    }
}

module.exports = FinancialReasoningEngine;
