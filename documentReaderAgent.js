const { Chroma } = require("@langchain/community/vectorstores/chroma");
const { OpenAIEmbeddings } = require("@langchain/openai");

class DocumentReaderAgent {
    /**
     * Top-level agent responsible for retrieving relevant financial context
     * from the vector database for downstream agents.
     * @param {string} collectionName - Local vectorDB collection.
     */
    constructor(collectionName = "finsathi_nepal_stock_docs") {
        this.embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
        this.collectionName = collectionName;
    }

    /**
     * Semantically searches the official reports for key financial data
     * related to a specific company.
     * @param {string} companyName - The target company (e.g., NABIL Bank).
     * @returns {Promise<Array<Object>>} Retrieved chunks with page metadata.
     */
    async readDocumentsForCompany(companyName) {
        console.log(`Document Reader Agent: Retrieving official reports for ${companyName}...`);

        try {
            const vectorStore = await Chroma.fromExistingCollection(this.embeddings, {
                collectionName: this.collectionName,
                url: "http://localhost:8000"
            });

            // Retrieve top 10 most relevant chunks to ensure broad context for extraction
            const retriever = vectorStore.asRetriever({ k: 10 });

            // Query crafted to pull out sector info, growth, and core valuation metrics (ROE, PE, PB)
            const query = `${companyName} financial performance metrics ROE revenue profit sector industry overview P/E P/B`;
            const documents = await retriever.invoke(query);

            console.log(`Document Reader Agent: Discovered ${documents.length} highly relevant source pages.`);
            return documents;

        } catch (error) {
            console.error("Document Reader Agent: Failed to retrieve contexts. Ensure database is running.", error);
            throw error;
        }
    }
}

module.exports = DocumentReaderAgent;
