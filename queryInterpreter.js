const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { z } = require("zod");

class QueryInterpreter {
    /**
     * The first layer of the conversational engine.
     * Interprets free-form natural language queries into structured tasks.
     */
    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });

        // Zod schema to determine the EXACT companies, metrics, and operations required
        this.parser = StructuredOutputParser.fromZodSchema(z.object({
            intent: z.enum(["compare", "extract", "calculate_growth", "general_qa"])
                .describe("The core goal of the user's financial query."),
            target_companies: z.array(z.string())
                .describe("List of NEPSE companies mentioned (e.g., ['NABIL Bank', 'Standard Chartered Bank'])."),
            metrics_required: z.array(z.string())
                .describe("Financial metrics needed (e.g., ['revenue', 'profit', 'ROE'])."),
            timeframes: z.array(z.string())
                .describe("Any specific years or quarters mentioned (e.g., ['2023', 'Q3']). Empty if none."),
            requires_calculation: z.boolean()
                .describe("True if the query explicitly asks for a calculation like 'growth rate' or 'difference'.")
        }));
    }

    /**
     * Parses natural language into an actionable query plan.
     * @param {string} userQuery - The raw conversational string.
     * @returns {Promise<Object>} Structured query intent and entities.
     */
    async interpretQuery(userQuery) {
        console.log(`Query Interpreter: Analyzing intent for -> "${userQuery}"`);

        const formatInstructions = this.parser.getFormatInstructions();

        const promptTemplate = new PromptTemplate({
            template: `You are the Query Interpreter for FinSathi AI, analyzing Nepal Stock Exchange queries.
Your job is to break down the natural language question into actionable components for downstream agents.

User Query: {query}

{format_instructions}`,
            inputVariables: ["query"],
            partialVariables: { format_instructions: formatInstructions }
        });

        const prompt = await promptTemplate.format({ query: userQuery });
        const response = await this.llm.invoke(prompt);
        return await this.parser.parse(response.content);
    }
}

module.exports = QueryInterpreter;
