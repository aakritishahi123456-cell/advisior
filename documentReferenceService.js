const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAIEmbeddings } = require("@langchain/openai");

class DocumentReferenceService {
    /**
     * Service responsible for interfacing with the vector database 
     * to fetch official, verified context chunks.
     */
    constructor(collectionName = "finsathi_nepal_stock_docs") {
        this.embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
        this.collectionName = collectionName;
    }

    /**
     * Retrieves the most relevant chunks for a given query.
     * @param {string} query - The user's financial question.
     * @param {number} topK - Number of chunks to retrieve.
     * @returns {Promise<Array<Object>>} Retrieved Langchain document chunks.
     */
    async retrieveVerifiedChunks(query, topK = 4) {
        console.log(`DocumentReferenceService: Searching vector DB for relevant context to '${query}'...`);

        try {
            const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
                collectionName: this.collectionName,
                url: "http://localhost:8000"
            });

            // Can be configured to perform MMR (Maximal Marginal Relevance) for diverse hits
            const retriever = vectorStore.asRetriever({ k: topK });
            const documents = await retriever.invoke(query);

            return documents;
        } catch (error) {
            console.error("DocumentReferenceService: Data retrieval failed. Is ChromaDB running locally?", error.message);
            throw error;
        }
    }
}

module.exports = DocumentReferenceService;
