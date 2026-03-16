const { ChatOpenAI } = require('@langchain/openai');
const { z } = require('zod');
const pino = require('pino');

const logger = pino({ name: 'news-sentiment-agent' });

// Define the structured JSON LLM output schema strictly conforming to database
const SentimentAnalysisSchema = z.object({
    summary: z.string().describe("Concise 1-2 sentence summary of the article."),
    companies: z.array(z.object({
        symbol: z.string().describe("The exact official NEPSE trading symbol for the company."),
        sentiment: z.enum(['POSITIVE', 'NEUTRAL', 'NEGATIVE']).describe("Calculated polarity for this specific company."),
        score: z.number().min(-1.0).max(1.0).describe("Fine-grained semantic score ranging between -1.0 (very negative) to 1.0 (very positive)."),
        confidenceScore: z.number().min(0.0).max(1.0).describe("The LLM's confidence level for this specific classification metric."),
        explanation: z.string().describe("Direct reasoning generated explaining the score.")
    })).describe("List of companies uniquely mentioned and impacted by the news content.")
});

/**
 * Executes zero-shot classification on raw articles passing results uniformly.
 */
async function analyzeFinancialSentiment(articleTitle, articleText) {
    logger.info(`Extracting NLP Sentiment reasoning for: "${articleTitle}"`);

    // In production, instantiate ChatOpenAI using OpenAI API Key or localized inference endpoints
    const model = new ChatOpenAI({
        modelName: 'gpt-4o-mini',
        temperature: 0.1
    });

    const structuredLlm = model.withStructuredOutput(SentimentAnalysisSchema, {
        name: "FinancialAnalysisExtractor"
    });

    try {
        const promptText = `
            You are a strictly accurate financial sentiment analyst working on the Nepal Stock Exchange (NEPSE).
            Analyze the following news article. Ignore noise and objectively compute the underlying impact.

            Title: ${articleTitle}
            Article Body:
            ---
            ${articleText}
            ---

            Provide the summary and meticulously extract every NEPSE company mentioned along with an objective sentiment assessment strictly following the supplied JSON schema format.
            `;

        const result = await structuredLlm.invoke(promptText);
        logger.info(`Successfully inferred properties for ${result.companies.length} NEPSE companies.`);
        
        return result;

    } catch (error) {
        logger.error(`LLM Analysis Error: ${error.message}`);
        throw error;
    }
}

module.exports = {
   analyzeFinancialSentiment 
};
