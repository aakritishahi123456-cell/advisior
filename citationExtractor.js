const { ChatOpenAI } = require("@langchain/openai");
const { PromptTemplate } = require("@langchain/core/prompts");
const { StructuredOutputParser } = require("langchain/output_parsers");
const { z } = require("zod");

class CitationExtractor {
    /**
     * Logic controlling the generative layer to extract highly cited 
     * structural facts or safely abort if context is hallucinated/missing.
     */
    constructor() {
        this.llm = new ChatOpenAI({ modelName: "gpt-4o", temperature: 0 });

        // Use a strictly typed parser to isolate and verify the snippet components
        this.parser = StructuredOutputParser.fromZodSchema(z.object({
            hasSufficientData: z.boolean().describe("True if the provided context explicitly answers the user's question. False if the answer is missing or incomplete."),
            answer: z.string().describe("Direct, exact financial answer based on the context. Empty if hasSufficientData is false."),
            sourceDocument: z.string().describe("The exact source_document name from context metadata. Empty if hasSufficientData is false."),
            pageNumber: z.string().describe("The exact page_number from context metadata. Empty if hasSufficientData is false."),
            citationSnippet: z.string().describe("A direct quote from the text that proves the answer. Empty if hasSufficientData is false.")
        }));
    }

    /**
     * Processes context into a strictly parsed JSON citation object.
     * @param {string} question - Research query.
     * @param {Array<Object>} retrievedDocs - Chunks fetched by the document service.
     * @returns {Promise<Object>} The verified extracted facts.
     */
    async extractVerifiedFacts(question, retrievedDocs) {
        console.log(`CitationExtractor: Analyzing the retrieved chunks safely...`);

        const formatInstructions = this.parser.getFormatInstructions();

        const promptTemplate = new PromptTemplate({
            template: `You are FinSathi AI, an expert financial intelligence agent.
Determine the answer to the user's question solely based on the provided Contexts.

If the answer is NOT clearly contained in the details below, you MUST set 'hasSufficientData' to false and leave the rest empty.
Do NOT hallucinate or guess data.

Contexts:
{context_string}

Question: {question}

{format_instructions}`,
            inputVariables: ["question", "context_string"],
            partialVariables: { format_instructions: formatInstructions }
        });

        // Format metadata cleanly so the LLM correctly parses page numbers.
        const contextString = retrievedDocs.map(doc =>
            `---
Source: ${doc.metadata?.source_document || 'Unknown'} (Page: ${doc.metadata?.page_number || 'Unknown'})
Text: ${doc.pageContent}
---`
        ).join("\n");

        const prompt = await promptTemplate.format({
            question: question,
            context_string: contextString
        });

        const response = await this.llm.invoke(prompt);
        return await this.parser.parse(response.content);
    }
}

module.exports = CitationExtractor;
