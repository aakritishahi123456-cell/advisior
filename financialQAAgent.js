const { ChatOpenAI } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { createStuffDocumentsChain } = require("langchain/chains/combine_documents");
const { createRetrievalChain } = require("langchain/chains/retrieval");
const { PromptTemplate } = require("@langchain/core/prompts");

class FinancialQAAgent {
    /**
     * Initializes the generative QA RAG system tailored for financial research.
     * @param {string} collectionName - Local target collection where chunks are indexed.
     */
    constructor(collectionName = "finsathi_nepal_stock_docs") {
        // Utilize highly capable and deterministic gpt-4o for accurate financial extractions
        this.llm = new ChatOpenAI({
            modelName: "gpt-4o",
            temperature: 0,
        });
        this.embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
        this.collectionName = collectionName;
    }

    /**
     * Orchestrates full retrieval-augmented generation and returns an answer 
     * formatted strictly with the source citations.
     * @param {string} question - Research question posed by user.
     * @returns {Promise<Object>} Formatted string and extracted source snippets.
     */
    async answerQuestion(question) {
        console.log(`Financial QA: Connecting to vectorDB and finding relevant facts for '${question}'...`);

        // 1. Establish existing vector store reference 
        const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
            collectionName: this.collectionName,
            url: "http://localhost:8000"
        });

        // 4 most accurate semantically matched pieces of text context.
        const retriever = vectorStore.asRetriever({ k: 4 });

        // 2. Define strict prompt guaranteeing accurate non-hallucinated citations.
        const strictQAPromptTemp = `
You are a senior financial AI analyst for FinSathi AI, analyzing Nepal Stock Exchange company reports.
Use ONLY the following retrieved pieces of context to answer the user's question accurately. 
If the exact answer is not clearly present in the context, explicitly state that you do not have sufficient information. Do not hallucinate external numbers or figures.

Crucially, when you answer the question, you MUST cite the Exact "Source document", the "Page number", and provide the "Citation snippet" (short quote demonstrating the evidence) that supports your answer. 

Use the metadata properties 'source_document' and 'page_number' attached to each piece of context for exactly mapping where your info comes from.

Format your total response EXACTLY as follows:

Answer
[Provide your precise financial response based solely on context]

Source
[Document Name]

Page
[Page Number]

Citation
"[Exact quote snippet from context]"

If there are multiple facts answering multiple parts of the question, reference all their various sources below the final Answer in the above format blocks.

Context:
{context}

Question: {input}
Answer:
`;

        const promptTemplate = PromptTemplate.fromTemplate(strictQAPromptTemp);

        // Combine documents retrieved 
        const combineDocsChain = await createStuffDocumentsChain({
            llm: this.llm,
            prompt: promptTemplate,
        });

        // Wire up complete question + retrieving -> generative chain
        const retrievalChain = await createRetrievalChain({
            combineDocsChain,
            retriever,
        });

        try {
            // Execute RAG 
            const response = await retrievalChain.invoke({
                input: question
            });

            // The exact formatted string requested in deliverables is held in response.answer
            return {
                query: question,
                formattedAnswer: response.answer,
                internalRawSources: response.context
            };
        } catch (e) {
            console.error("Financial QA Error: RAG pipeline execution failed.", e);
            throw e;
        }
    }
}

module.exports = FinancialQAAgent;
