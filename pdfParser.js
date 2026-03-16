const { PDFLoader } = require("@langchain/community/document_loaders/fs/pdf");

class PDFParser {
    /**
     * Parse a financial PDF document and extract text page by page.
     * This ensures we maintain accurate page numbers for proper citation.
     * 
     * @param {string} filePath - Absolute path to the PDF document.
     * @param {string} documentName - Name of the specific document to track original source.
     * @returns {Promise<Array<{pageContent: string, metadata: {source: string, loc: {pageNumber: number}}}>>}
     */
    async extractTextWithPageNumbers(filePath, documentName) {
        console.log(`PDF Parser: Extracting text from ${documentName}...`);

        // We use splitPages: true to extract text strictly by page
        const loader = new PDFLoader(filePath, { splitPages: true });
        try {
            const docs = await loader.load();

            // Enrich metadata with explicitly tracked document name and page number 
            // for rigorous source citation down the pipeline.
            return docs.map(doc => ({
                pageContent: doc.pageContent,
                metadata: {
                    ...doc.metadata,
                    source_document: documentName,
                    page_number: doc.metadata?.loc?.pageNumber || "Unknown"
                }
            }));
        } catch (error) {
            console.error(`Failed to parse PDF: ${documentName}`, error);
            throw error;
        }
    }
}

module.exports = PDFParser;
