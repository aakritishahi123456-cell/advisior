const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { z } = require("zod");

class SectorClassificationAgent {
    /**
     * Agent responsible for determining the official NEPSE market sector 
     * of the company being analyzed using underlying business descriptions.
     */
    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });

        this.parser = StructuredOutputParser.fromZodSchema(z.object({
            sector: z.string().describe("The classified NEPSE sector (e.g., Commercial Banks, Hydropower, Microfinance, Insurance, Manufacturing & Processing, etc.)"),
            reasoning: z.string().describe("Detailed explanation for why the company belongs to this precise sector based on the text."),
            references: z.array(z.string()).describe("List of explicit source document names and page numbers used to prove the sector.")
        }));
    }

    /**
     * Determines sector based on the context snippets.
     * @param {string} companyName 
     * @param {Array<Object>} contexts 
     * @returns {Promise<Object>} JSON containing sector classification and source citations.
     */
    async classifySector(companyName, contexts) {
        console.log(`Sector Classification Agent: Determining NEPSE listing sector for ${companyName}...`);

        const formatInstructions = this.parser.getFormatInstructions();

        const promptTemplate = new PromptTemplate({
            template: `You are a sector classification expert for the Nepal Stock Exchange (NEPSE).
Determine the official NEPSE sector for {company_name} using ONLY the provided contexts.
Official NEPSE Sectors include: Commercial Banks, Development Banks, Finance, Microfinance, Life Insurance, Non-Life Insurance, Hydropower, Manufacturing & Processing, Hotels & Tourism, Trading, Investment, and Others.

List your sources from the provided contexts explicitly.

Contexts:
{context_string}

{format_instructions}`,
            inputVariables: ["company_name", "context_string"],
            partialVariables: { format_instructions: formatInstructions }
        });

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

module.exports = SectorClassificationAgent;
