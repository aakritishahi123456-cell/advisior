require('dotenv').config();
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const fs = require('fs');
const path = require('path');

const DocumentCollector = require('./documentCollector');
const PDFParser = require('./pdfParser');
const VectorIndexer = require('./vectorIndexer');
const FinancialQAAgent = require('./financialQAAgent');
const FinancialChatAgent = require('./financialChatAgent');

const app = express();
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// Security: Helmet HTTP headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || (NODE_ENV === 'production' ? false : '*'),
  credentials: true,
  optionsSuccessStatus: 200,
};
app.use(cors(corsOptions));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // limit each IP to 10 uploads per minute
  message: { error: 'Too many upload requests, please try again later.' },
});

app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
    res.status(200).json({ 
        success: true,
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: NODE_ENV
    });
});

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
app.post('/api/upload', uploadLimiter, upload.single('report'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'Please upload a PDF file.' });
        }
        
        // Validate file type
        if (req.file.mimetype !== 'application/pdf') {
            return res.status(400).json({ error: 'Only PDF files are allowed.' });
        }
        
        res.status(200).json({
            message: 'File uploaded successfully',
            filename: req.file.filename,
            size: req.file.size
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file.' });
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

// Start Server with error handling
const server = app.listen(PORT, () => {
    console.log(`FinSathi AI backend is running on http://localhost:${PORT}`);
    console.log(`Environment: ${NODE_ENV}`);
    console.log(`OpenAI API Key is ${process.env.OPENAI_API_KEY ? 'configured' : 'MISSING!'}`);
});

// Global error handling middleware
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: NODE_ENV === 'production' ? 'Internal server error' : err.message 
    });
});

// 404 handler
app.use('*', (req, res) => {
    res.status(404).json({ error: 'Endpoint not found' });
});

// Graceful shutdown
const gracefulShutdown = async (signal) => {
    console.log(`\n${signal} received. Starting graceful shutdown...`);
    
    server.close(async () => {
        console.log('HTTP server closed.');
        
        // Close database connections if any
        // await prisma.$disconnect();
        
        console.log('Graceful shutdown complete.');
        process.exit(0);
    });
    
    // Force exit after 30 seconds
    setTimeout(() => {
        console.error('Forced shutdown after timeout.');
        process.exit(1);
    }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
    console.error('Uncaught Exception:', err);
    process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise, 'reason:', reason);
    process.exit(1);
});
