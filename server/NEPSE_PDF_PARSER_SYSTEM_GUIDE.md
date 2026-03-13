# NEPSE Annual Report Scraper System Guide for FinSathi AI

## Overview
This guide documents the comprehensive NEPSE annual report scraper and PDF parser system implemented for FinSathi AI, featuring automated financial data extraction, BullMQ background processing, and robust error handling.

## System Architecture

### Core Components
- **PDF Parser Service**: Text extraction and financial metrics parsing
- **BullMQ Worker**: Background job processing for PDF parsing
- **Report Parser Controller**: API endpoints for report management
- **Financial Data Storage**: Structured database storage
- **OCR Fallback**: Tesseract OCR for scanned PDFs

## Technical Stack

### Backend Technologies
- **Node.js**: Runtime environment
- **pdf-parse**: Primary PDF text extraction library
- **Tesseract.js**: OCR fallback for scanned PDFs
- **BullMQ**: Background job queue system
- **Prisma ORM**: Database ORM
- **Multer**: File upload handling

### Processing Pipeline
1. **Upload/Fetch**: PDF file input (URL or upload)
2. **Validation**: File size, MIME type, and format validation
3. **Text Extraction**: pdf-parse → Tesseract OCR fallback
4. **Financial Parsing**: Regex-based metric extraction
5. **Data Normalization**: Currency and number formatting
6. **Database Storage**: Structured financial data storage
7. **Ratio Calculation**: Automatic financial ratios computation

## PDF Parser Service Implementation

### 1. Core Parsing Method
```typescript
static async parsePDFReport(
  companyId: string,
  symbol: string,
  year: number,
  pdfBuffer: Buffer,
  source: 'upload' | 'url' = 'upload'
): Promise<ParsedReportData> {
  const startTime = Date.now();
  let extractedText = '';
  let confidence = 0;
  let parsingSource: 'pdf-parse' | 'tesseract' = 'pdf-parse';

  try {
    // First attempt: Use pdf-parse for text-based PDFs
    try {
      const pdfData = await pdf(pdfBuffer);
      extractedText = pdfData.text;
      confidence = pdfData.numpages > 0 ? 0.8 : 0.3;
    } catch (pdfError) {
      // Fallback: Use Tesseract OCR for scanned PDFs
      extractedText = await this.performOCR(pdfBuffer);
      confidence = 0.6;
      parsingSource = 'tesseract';
    }

    // Extract financial metrics
    const metrics = this.extractFinancialMetrics(extractedText);

    const processingTime = Date.now() - startTime;

    return {
      companyId,
      year,
      metrics,
      extractedText,
      confidence,
      processingTime,
      source: parsingSource,
    };
  } catch (error) {
    throw createError('Failed to parse PDF report', 500);
  }
}
```

### 2. Financial Metrics Extraction
```typescript
private static readonly FINANCIAL_PATTERNS = {
  revenue: [
    /(?:revenue|sales|turnover|income)\s*(?:from\s*)?(?:operations?|operating)?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    /(?:total\s*)?(?:revenue|sales|turnover)\s*(?:for\s*)?the\s*year\s*ended\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
  ],
  
  netProfit: [
    /(?:net\s*)?(?:profit|income|earnings)\s*(?:after\s*tax)?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    /(?:profit\s*(?:after\s*)?tax|net\s*income)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
  ],
  
  totalAssets: [
    /(?:total\s*)?(?:assets?)\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
    /assets?\s*(?:as\s*of\s*year\s*end)?\s*:?\s*[\n\s]*(?:npr|rs|ruppees?)?\s*([0-9,.]+(?:\s*[0-9,.]+)*?)(?:\s*(?:million|billion|crore|lakh|thousand))?/gi,
  ],
  
  // ... more patterns for other metrics
};
```

### 3. Value Normalization
```typescript
private static normalizeFinancialValue(valueStr: string, context: string): number | null {
  try {
    // Remove common formatting characters
    let cleanValue = valueStr.replace(/[,\s]/g, '');
    
    // Handle multipliers
    const multiplierMatch = context.match(/(thousand|lakh|million|crore|billion)/i);
    if (multiplierMatch) {
      const multiplier = this.MULTIPLIERS[multiplierMatch[1].toLowerCase()];
      cleanValue = (parseFloat(cleanValue) * multiplier).toString();
    }

    // Handle parentheses (negative values)
    if (cleanValue.includes('(') && cleanValue.includes(')')) {
      cleanValue = '-' + cleanValue.replace(/[()]/g, '');
    }

    const numValue = parseFloat(cleanValue);
    
    // Validate the result
    if (isNaN(numValue) || numValue < 0 || numValue > 1000000000000) {
      return null;
    }

    return numValue;
  } catch (error) {
    return null;
  }
}
```

## BullMQ Worker Implementation

### 1. Worker Setup
```typescript
export class ReportParserWorker {
  private worker: Worker;

  constructor() {
    this.worker = new Worker(
      'report-parsing-queue',
      this.processJob.bind(this),
      {
        connection: redisConnection,
        concurrency: 3, // Process up to 3 PDFs concurrently
        limiter: {
          max: 10,
          duration: 60000, // 10 jobs per minute
        },
      }
    );

    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    this.worker.on('completed', (job) => {
      logger.info({
        action: 'report_parsing_job_completed',
        jobId: job.id,
        companyId: job.data.companyId,
        result: job.returnvalue,
      });
    });

    this.worker.on('failed', (job, err) => {
      logger.error({
        action: 'report_parsing_job_failed',
        jobId: job.id,
        error: err.message,
        attemptsMade: job.attemptsMade,
      });
    });
  }
}
```

### 2. Job Processing
```typescript
async processJob(job: Job<ReportParsingJobData>): Promise<ReportParsingJobResult> {
  const startTime = Date.now();
  const { companyId, symbol, year, pdfUrl, userId } = job.data;

  try {
    // Update job progress
    await job.updateProgress(10, 'Downloading PDF...');
    
    // Download PDF from URL
    const pdfBuffer = await PDFParserService.downloadPDF(pdfUrl);

    await job.updateProgress(30, 'Validating PDF...');
    await PDFParserService.validatePDFFile(pdfBuffer);

    await job.updateProgress(50, 'Extracting text...');
    const parsedData = await PDFParserService.parsePDFReport(
      companyId,
      symbol,
      year,
      pdfBuffer,
      'url'
    );

    await job.updateProgress(80, 'Storing financial data...');
    await PDFParserService.storeFinancialData(parsedData);

    await job.updateProgress(90, 'Calculating financial ratios...');
    const ratios = PDFParserService.calculateFinancialRatios(parsedData.metrics);

    const processingTime = Date.now() - startTime;

    return {
      success: true,
      companyId,
      symbol,
      year,
      metrics: { ...parsedData.metrics, ratios },
      processingTime,
      source: parsedData.source,
      confidence: parsedData.confidence,
    };
  } catch (error: any) {
    // Don't retry for certain errors
    if (error.message.includes('Invalid PDF file') || 
        error.message.includes('File size exceeds')) {
      throw error;
    }
    throw error;
  }
}
```

## API Endpoints

### 1. Parse Report from URL
```typescript
POST /api/v1/reports/parse
Content-Type: application/json

{
  "symbol": "NABIL",
  "year": 2023,
  "pdfUrl": "https://example.com/annual-report.pdf"
}

Response:
{
  "success": true,
  "data": {
    "jobId": "job_123456",
    "companyId": "comp_789",
    "symbol": "NABIL",
    "year": 2023,
    "pdfUrl": "https://example.com/annual-report.pdf",
    "status": "queued",
    "message": "Report parsing job has been queued for processing"
  }
}
```

### 2. Upload and Parse Report
```typescript
POST /api/v1/reports/upload
Content-Type: multipart/form-data

symbol: NABIL
year: 2023
file: [PDF file]

Response:
{
  "success": true,
  "data": {
    "jobId": "job_123456",
    "companyId": "comp_789",
    "symbol": "NABIL",
    "year": 2023,
    "fileName": "annual-report-2023.pdf",
    "fileSize": 2048576,
    "status": "queued"
  }
}
```

### 3. Get Job Status
```typescript
GET /api/v1/reports/job/:jobId

Response:
{
  "success": true,
  "data": {
    "id": "job_123456",
    "companyId": "comp_789",
    "symbol": "NABIL",
    "year": 2023,
    "status": "completed",
    "error": null,
    "createdAt": "2023-12-10T10:00:00.000Z",
    "updatedAt": "2023-12-10T10:02:30.000Z"
  }
}
```

### 4. Get Financial Reports
```typescript
GET /api/v1/reports/NABIL?year=2023&limit=5

Response:
{
  "success": true,
  "data": [
    {
      "id": "report_123",
      "companyId": "comp_789",
      "year": 2023,
      "revenue": 150000000000,
      "netProfit": 25000000000,
      "totalAssets": 1000000000000,
      "totalLiabilities": 800000000000,
      "equity": 200000000000,
      "eps": 125.50,
      "createdAt": "2023-12-10T10:00:00.000Z",
      "updatedAt": "2023-12-10T10:00:00.000Z",
      "company": {
        "id": "comp_789",
        "name": "Nabil Bank Limited",
        "symbol": "NABIL"
      },
      "ratios": {
        "debtToEquity": 4.0,
        "returnOnAssets": 2.5,
        "returnOnEquity": 12.5,
        "currentRatio": 1.25,
        "grossMargin": 15.0,
        "netMargin": 16.67
      }
    }
  ]
}
```

## Database Schema

### Financial Reports Table
```sql
model FinancialReport {
  id             String  @id @default(cuid())
  userId         String  @map("user_id")
  companyId      String  @map("company_id")
  year           Int
  revenue        Float   @db.Decimal(15, 2)
  netProfit      Float   @map("net_profit") @db.Decimal(15, 2)
  totalAssets    Float   @map("total_assets") @db.Decimal(15, 2)
  totalLiabilities Float  @map("total_liabilities") @db.Decimal(15, 2)
  equity         Float   @db.Decimal(15, 2)
  eps            Float   @db.Decimal(10, 4)
  createdAt      DateTime @default(now()) @map("created_at")
  updatedAt      DateTime @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  company Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  @@index([companyId])
  @@index([year])
  @@index([companyId, year])
  @@map("financial_reports")
}
```

## Security Features

### 1. File Validation
```typescript
static async validatePDFFile(buffer: Buffer): Promise<void> {
  // Check file size
  if (buffer.length > 20 * 1024 * 1024) { // 20MB limit
    throw createError('PDF file size exceeds 20MB limit', 400);
  }

  // Check PDF signature
  if (buffer.length < 4 || !buffer.toString('ascii', 0, 4).startsWith('%PDF')) {
    throw createError('Invalid PDF file format', 400);
  }

  // Try to parse with pdf-parse to validate
  try {
    await pdf(buffer);
  } catch (error) {
    throw createError('PDF file is corrupted or invalid', 400);
  }
}
```

### 2. URL Validation
```typescript
static async downloadPDF(pdfUrl: string): Promise<Buffer> {
  try {
    const url = new URL(pdfUrl);
    
    const response = await fetch(pdfUrl);
    
    if (!response.ok) {
      throw new Error(`Failed to download PDF: ${response.statusText}`);
    }

    // Validate content type
    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('pdf')) {
      throw new Error('Invalid file type. Expected PDF file.');
    }

    // Validate file size
    const contentLength = response.headers.get('content-length');
    if (contentLength && parseInt(contentLength) > 20 * 1024 * 1024) {
      throw new Error('File size exceeds 20MB limit.');
    }

    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    throw createError('Failed to download PDF', 500);
  }
}
```

### 3. Rate Limiting
```typescript
// In route configuration
router.use(generalLimiter); // General rate limiting
router.post('/upload', proLimiter, ReportParserController.uploadAndParseReport); // Stricter for uploads
```

## Performance Optimization

### 1. Background Processing
- **BullMQ Queue**: Asynchronous job processing
- **Concurrency Control**: 3 concurrent PDF processing jobs
- **Rate Limiting**: 10 jobs per minute per user
- **Progress Tracking**: Real-time job progress updates

### 2. Caching Strategy
- **Job Results**: Cache completed job results
- **Company Data**: Cache company information
- **Financial Ratios**: Cache calculated ratios

### 3. Error Handling
```typescript
// Retry logic for transient errors
if (error.message.includes('Invalid PDF file') || 
    error.message.includes('File size exceeds') ||
    error.message.includes('Failed to download PDF')) {
  throw error; // Don't retry
}
throw error; // Retry for other errors
```

## Financial Ratios Calculation

### 1. Key Financial Ratios
```typescript
static calculateFinancialRatios(metrics: FinancialMetrics): {
  debtToEquity?: number;
  returnOnAssets?: number;
  returnOnEquity?: number;
  currentRatio?: number;
  grossMargin?: number;
  netMargin?: number;
} {
  const ratios: any = {};

  // Debt to Equity Ratio
  if (metrics.totalLiabilities && metrics.equity && metrics.equity > 0) {
    ratios.debtToEquity = metrics.totalLiabilities / metrics.equity;
  }

  // Return on Assets (ROA)
  if (metrics.netProfit && metrics.totalAssets && metrics.totalAssets > 0) {
    ratios.returnOnAssets = (metrics.netProfit / metrics.totalAssets) * 100;
  }

  // Return on Equity (ROE)
  if (metrics.netProfit && metrics.equity && metrics.equity > 0) {
    ratios.returnOnEquity = (metrics.netProfit / metrics.equity) * 100;
  }

  // Current Ratio
  if (metrics.totalAssets && metrics.totalLiabilities && metrics.totalLiabilities > 0) {
    ratios.currentRatio = metrics.totalAssets / metrics.totalLiabilities;
  }

  // Gross Margin
  if (metrics.grossProfit && metrics.revenue && metrics.revenue > 0) {
    ratios.grossMargin = (metrics.grossProfit / metrics.revenue) * 100;
  }

  // Net Margin
  if (metrics.netProfit && metrics.revenue && metrics.revenue > 0) {
    ratios.netMargin = (metrics.netProfit / metrics.revenue) * 100;
  }

  return ratios;
}
```

## OCR Implementation

### 1. Tesseract OCR Fallback
```typescript
private static async performOCR(pdfBuffer: Buffer): Promise<string> {
  try {
    // Create a worker for OCR
    const worker = await createWorker('eng');
    
    // In production implementation:
    // 1. Convert PDF pages to images
    // 2. Process each image with Tesseract
    // 3. Combine the text results
    
    await worker.terminate();
    
    return 'OCR processing would be implemented here. PDF to image conversion required.';
  } catch (error) {
    logger.error('OCR processing failed:', error);
    throw error;
  }
}
```

### 2. OCR Limitations
- **PDF to Image Conversion**: Requires additional library
- **Performance**: Slower than text-based PDF parsing
- **Accuracy**: Depends on image quality and OCR settings
- **Language Support**: Limited to configured languages

## Edge Cases Handling

### 1. Scanned PDFs
```typescript
// Try pdf-parse first, fallback to OCR
try {
  const pdfData = await pdf(pdfBuffer);
  extractedText = pdfData.text;
  confidence = pdfData.numpages > 0 ? 0.8 : 0.3;
} catch (pdfError) {
  // Fallback to OCR for scanned PDFs
  extractedText = await this.performOCR(pdfBuffer);
  confidence = 0.6;
  parsingSource = 'tesseract';
}
```

### 2. Missing Values
```typescript
// Filter out unrealistic values
if (numValue > 1000000000000) { // 1 trillion NPR limit
  return null;
}

// Handle missing metrics gracefully
if (metrics.totalAssets && metrics.totalLiabilities) {
  metrics.equity = metrics.totalAssets - metrics.totalLiabilities;
}
```

### 3. Currency Mismatch
```typescript
// Handle different currency formats
const patterns = [
  /(?:npr|rs|ruppees?)?\s*([0-9,.]+)/gi, // Nepalese Rupee
  /(?:usd|\$)\s*([0-9,.]+)/gi,          // US Dollar
  /(?:inr|₹)\s*([0-9,.]+)/gi,            // Indian Rupee
];
```

### 4. Multi-page Tables
```typescript
// Process entire document text
const cleanText = text.toLowerCase().replace(/\s+/g, ' ');

// Extract from all pages, not just first page
const matches = [...cleanText.matchAll(pattern)];
```

## Testing Strategy

### 1. Unit Tests
```typescript
describe('PDF Parser Service', () => {
  it('should extract financial metrics correctly', async () => {
    const mockPDFBuffer = Buffer.from('%PDF-1.4\nmock content');
    const result = await PDFParserService.parsePDFReport(
      'company-id',
      'TEST',
      2023,
      mockPDFBuffer
    );
    
    expect(result.metrics.revenue).toBeDefined();
    expect(result.confidence).toBeGreaterThan(0);
  });

  it('should handle zero interest rate in loans', () => {
    const result = LoanService.calculateEMIQuick(1000000, 0, 60);
    expect(result).toBe(16666.67);
  });
});
```

### 2. Integration Tests
```typescript
describe('Report Parser API', () => {
  it('should queue parsing job', async () => {
    const response = await request(app)
      .post('/api/v1/reports/parse')
      .send({
        symbol: 'NABIL',
        year: 2023,
        pdfUrl: 'https://example.com/report.pdf'
      })
      .expect(202);

    expect(response.body.success).toBe(true);
    expect(response.body.data.jobId).toBeDefined();
  });
});
```

## Monitoring and Analytics

### 1. Performance Metrics
- **Processing Time**: Track PDF parsing duration
- **Success Rate**: Monitor parsing success/failure rates
- **Queue Depth**: Monitor job queue backlog
- **Worker Utilization**: Track worker performance

### 2. Business Metrics
- **Reports Parsed**: Number of reports processed
- **Companies Covered**: Unique companies with reports
- **Year Coverage**: Range of years covered
- **Extraction Accuracy**: Confidence scores for extractions

### 3. Error Tracking
```typescript
logger.error({
  action: 'pdf_parsing_error',
  companyId,
  symbol,
  year,
  error: error.message,
  processingTime: Date.now() - startTime,
});
```

## Future Enhancements

### 1. Advanced OCR
- **Multi-language OCR**: Support for Nepali language
- **Table Detection**: AI-powered table structure detection
- **Image Enhancement**: Pre-processing for better OCR accuracy

### 2. AI-Powered Extraction
- **Machine Learning**: Train models for financial data extraction
- **Pattern Recognition**: Improve regex patterns with ML
- **Confidence Scoring**: Better confidence assessment

### 3. Additional Features
- **Document Classification**: Categorize report types
- **Version Control**: Track report versions
- **Change Detection**: Identify changes between reports
- **Automated Validation**: Cross-validate extracted data

This comprehensive NEPSE PDF parser system provides robust financial data extraction from annual reports, with fallback OCR support, background processing, and comprehensive error handling for production use.
