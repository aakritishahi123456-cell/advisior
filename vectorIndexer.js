const { RecursiveCharacterTextSplitter } = require("langchain/text_splitter");
const { OpenAIEmbeddings } = require("@langchain/openai");
const { Chroma } = require("@langchain/community/vectorstores/chroma");

class VectorIndexer {
    /**
     * Constructs the vector indexer to chunk PDF documents and build an embedded DB.
     * @param {string} collectionName - Unique collection for FinSathi system.
     */
    constructor(collectionName = "finsathi_nepal_stock_docs") {
        // Standardizing on small OpenAI embeddings 
        this.embeddings = new OpenAIEmbeddings({ modelName: "text-embedding-3-small" });
        this.collectionName = collectionName;

        // We utilize recursive character text splitter to respect semantic boundaries (paragraphs, sentences)
        this.textSplitter = new RecursiveCharacterTextSplitter({
            chunkSize: 1000,
            chunkOverlap: 250,
        });
    }

    /**
     * Splits texts, generates embeddings, and saves them to the backend vector store.
     * @param {Array<Object>} parsedDocs - Documents loaded by the PDF parser.
     * @returns {Promise<any>} Chroma DB vector store reference.
     */
    async indexDocuments(parsedDocs) {
        console.log("Vector Indexer: Splitting documents into semantic chunks...");

        // Split the large document texts using semantic chunking rules
        const chunks = await this.textSplitter.splitDocuments(parsedDocs);
        console.log(`Generated ${chunks.length} distinct text chunks representing semantic contexts.`);

        console.log("Vector Indexer: Generating embeddings and storing in local Chroma database...");

        try {
            // Connect to a local Chroma vector store instance at default URL.
            const vectorStore = await Chroma.fromDocuments(chunks, this.embeddings, {
                collectionName: this.collectionName,
                url: "http://localhost:8000" // Chroma local default port
            });

            console.log("Vector Indexer: Embeddings indexed successfully.");
            return vectorStore;

        } catch (e) {
            console.error("Vector Indexer: Failed to generate/store embeddings. Ensure ChromaDB is running locally.");
            throw e;
        }
    }
}

module.exports = VectorIndexer;
