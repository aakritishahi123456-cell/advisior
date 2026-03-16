const fs = require('fs');
const path = require('path');

class DocumentCollector {
    /**
     * Initializes the DocumentCollector.
     * @param {string} sourceDirectory - The directory containing official company documents.
     */
    constructor(sourceDirectory) {
        this.sourceDirectory = sourceDirectory;
    }

    /**
     * Scans the source directory and collects all PDF documents (e.g., annual reports, quarterly reports).
     * @returns {Promise<Array<{filename: string, fullPath: string}>>}
     */
    async collectDocuments() {
        if (!fs.existsSync(this.sourceDirectory)) {
            throw new Error(`Directory not found: ${this.sourceDirectory}`);
        }

        const files = fs.readdirSync(this.sourceDirectory);

        // Filter only PDF files as these are the expected official documents
        const pdfFiles = files.filter(file => file.toLowerCase().endsWith('.pdf'));

        const documents = pdfFiles.map(file => ({
            filename: file,
            fullPath: path.join(this.sourceDirectory, file)
        }));

        console.log(`Document Collector: Found ${documents.length} PDF documents in ${this.sourceDirectory}`);
        return documents;
    }
}

module.exports = DocumentCollector;
