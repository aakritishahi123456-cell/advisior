require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const fs = require('fs');
const path = require('path');

const DocumentCollector = require('./documentCollector');
const PDFParser = require('./pdfParser');
const VectorIndexer = require('./vectorIndexer');
const FinancialQAAgent = require('./financialQAAgent');
const FinancialChatAgent = require('./financialChatAgent');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Setup storage for uploaded PDFs
const uploadDir = path.join(__dirname, 'nepal_stock_reports');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});
const upload = multer({ storage });

// API Endpoint to Upload a Report
app.post('/api/upload', upload.single('report'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file.' });
        }
        res.status(200).json({
            message: 'File uploaded successfully',
            filename: req.file.filename
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// API Endpoint to Index all documents in the folder
app.post('/api/index', async (req, res) => {
    try {
        console.log("Starting indexing process...");

        // 1. Gather all reports
        const collector = new DocumentCollector(uploadDir);
        const pdfs = await collector.collectDocuments();

        if (pdfs.length === 0) {
            return res.status(404).json({ message: "No PDF documents found to index." });
        }

        // 2. Parse text with exact page tracking
        const parser = new PDFParser();
        let allExtractedPages = [];
        for (const doc of pdfs) {
            const pages = await parser.extractTextWithPageNumbers(doc.fullPath, doc.filename);
            allExtractedPages.push(...pages);
        }

        // 3. Chunk and load to vector DB
        const indexer = new VectorIndexer();
        await indexer.indexDocuments(allExtractedPages);

        res.status(200).json({
            message: "Successfully indexed documents.",
            documentCount: pdfs.length,
            totalPagesExtracted: allExtractedPages.length
        });
    } catch (error) {
        console.error("Indexing failed:", error);
        res.status(500).json({ error: error.message || "Failed to index documents" });
    }
});

// API Endpoint to Query the Agent
app.post('/api/query', async (req, res) => {
    try {
        const { question } = req.body;
        if (!question) {
            return res.status(400).json({ error: 'Question is required.' });
        }

        const agent = new FinancialQAAgent();
        const result = await agent.answerQuestion(question);

        // To extract pieces to return structured optionally, or just return formattedAnswer
        res.status(200).json({
            success: true,
            question: result.query,
            answer: result.formattedAnswer,
        });

    } catch (error) {
        console.error("Query failed:", error);
        res.status(500).json({ error: error.message || "Failed to process query." });
    }
});

// API Endpoint for Conversational Research Engine
app.post('/api/chat', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message) {
            return res.status(400).json({ error: 'Message is required.' });
        }

        const chatAgent = new FinancialChatAgent();
        const result = await chatAgent.processChatQuery(message);

        if (!result) {
            return res.status(500).json({ error: "Failed to parse or analyze chat query." });
        }

        res.status(200).json({
            success: true,
            query: message,
            verdict: result.final_verdict,
            synthesis: result.synthesis,
            confidence: result.confidence,
            calculations: result.calculations_performed
        });

    } catch (error) {
        console.error("Chat API failed:", error);
        res.status(500).json({ error: error.message || "Failed to process chat." });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`FinSathi AI backend is running on http://localhost:${PORT}`);
    console.log(`OpenAI API Key is ${process.env.OPENAI_API_KEY ? 'configured' : 'MISSING!'}`);
});
