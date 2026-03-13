# BullMQ Job Queue System for FinSathi AI

## Overview
This guide documents the BullMQ job queue system implemented for FinSathi AI to handle heavy tasks asynchronously, including PDF report parsing and AI analysis generation.

## Architecture

### Queue System Components
- **Queue Manager**: Central queue management and configuration
- **Workers**: Background job processors
- **Redis**: Job queue storage and message broker
- **Dead Letter Queues**: Failed job handling

### Queue Types
1. **report-parsing**: PDF and document processing
2. **ai-report**: AI analysis generation
3. **notifications**: User notifications
4. **email-sending**: Email delivery
5. **data-sync**: Data synchronization tasks

## Queue Configuration

### Retry Policy
- **Max Attempts**: 3 retries per job
- **Backoff Strategy**: Exponential backoff
- **Initial Delay**: 2-5 seconds based on queue type
- **Dead Letter Queue**: Failed jobs moved to `{queue-name}-dead-letter`

### Concurrency Limits
- **Report Parsing**: 5 concurrent jobs
- **AI Reports**: 3 concurrent jobs
- **Notifications**: 10 concurrent jobs
- **Email Sending**: 2 concurrent jobs

## Job Flow

### 1. API Request
```typescript
// User uploads a financial report
POST /api/v1/reports/upload
```

### 2. Job Creation
```typescript
// Add job to queue
await queueManager.addJob(QUEUE_NAMES.REPORT_PARSING, {
  type: 'report-parsing',
  reportId: 'report_123',
  userId: 'user_456',
  fileUrl: '/uploads/report.pdf',
  reportType: 'FINANCIAL_STATEMENT'
});
```

### 3. Worker Processing
```typescript
// Report parser worker processes job
export default async function reportParserProcessor(job: Job<ReportParsingJobData>) {
  // Parse PDF content
  // Extract financial data
  // Save to database
  // Trigger AI analysis if needed
}
```

### 4. Result Storage
```typescript
// Save parsed data to database
await FinancialReportRepository.update(reportId, userId, {
  parsedData: extractedData
});
```

### 5. Next Job Trigger
```typescript
// Trigger AI analysis after successful parsing
await queueManager.addJob(QUEUE_NAMES.AI_REPORT, {
  type: 'ai-report',
  reportId,
  userId,
  analysisType: 'financial-health',
  inputData: parsedData
});
```

## Worker Implementation

### Report Parser Worker
**File**: `src/workers/report-parser.worker.ts`

**Features**:
- PDF text extraction
- Financial data parsing
- Regex-based pattern matching
- Financial ratio calculations
- Automatic AI analysis triggering

**Job Data Structure**:
```typescript
interface ReportParsingJobData {
  type: 'report-parsing';
  reportId: string;
  userId: string;
  fileUrl?: string;
  content?: string;
  reportType: string;
}
```

**Processing Steps**:
1. Validate job data
2. Retrieve financial report
3. Parse content (text or file)
4. Extract financial metrics
5. Calculate derived values
6. Save parsed data
7. Trigger AI analysis if applicable

### AI Report Worker
**File**: `src/workers/ai-report.worker.ts`

**Features**:
- Financial health analysis
- Risk assessment
- Investment opportunity analysis
- Performance analysis
- Recommendation generation

**Job Data Structure**:
```typescript
interface AIReportJobData {
  type: 'ai-report';
  reportId: string;
  userId: string;
  analysisType: string;
  inputData: any;
  priority?: 'low' | 'normal' | 'high';
}
```

**Analysis Types**:
- `financial-health`: Overall financial health assessment
- `risk-assessment`: Risk level evaluation
- `investment-opportunity`: Investment potential analysis
- `performance-analysis`: Performance metrics evaluation

## Queue Management

### Queue Manager
**File**: `src/queues/queueManager.ts`

**Features**:
- Queue initialization and configuration
- Event listeners for job lifecycle
- Dead letter queue management
- Queue statistics and monitoring
- Graceful shutdown handling

### Worker Manager
**File**: `src/workers/workerManager.ts`

**Features**:
- Worker initialization
- Concurrency control
- Worker status monitoring
- Graceful shutdown

## API Integration

### Queue Status Endpoint
```
GET /api/v1/queues/status
```

**Response**:
```json
{
  "success": true,
  "data": {
    "queues": {
      "report-parsing": {
        "waiting": 2,
        "active": 1,
        "completed": 150,
        "failed": 3,
        "total": 156
      },
      "ai-report": {
        "waiting": 0,
        "active": 2,
        "completed": 75,
        "failed": 1,
        "total": 78
      }
    },
    "workers": {
      "report-parsing": {
        "initialized": true,
        "queueName": "report-parsing"
      },
      "ai-report": {
        "initialized": true,
        "queueName": "ai-report"
      }
    },
    "timestamp": "2023-12-10T10:30:00.000Z"
  }
}
```

## Error Handling

### Retry Strategy
1. **First Attempt**: Immediate processing
2. **First Retry**: 2-5 seconds delay
3. **Second Retry**: 4-25 seconds delay
4. **Third Retry**: 8-125 seconds delay
5. **Dead Letter**: Move to failed queue

### Error Categories
- **Validation Errors**: Invalid job data
- **Processing Errors**: Parsing/analysis failures
- **System Errors**: Database/Redis issues
- **Timeout Errors**: Long-running jobs

### Dead Letter Queue
Failed jobs are moved to `{queue-name}-dead-letter` with:
- Original job data
- Error information
- Failure timestamp
- Attempt count

## Monitoring and Logging

### Job Events
- **completed**: Successful job completion
- **failed**: Job failure with error details
- **stalled**: Job processing timeout
- **progress**: Job progress updates

### Logging Format
```typescript
logger.info({
  jobId: 'job_123',
  reportId: 'report_456',
  userId: 'user_789',
  action: 'report_parsing_completed',
  processingTime: 2500
});
```

### Performance Metrics
- Job completion time
- Queue depth
- Worker utilization
- Error rates
- Retry patterns

## Configuration

### Environment Variables
```bash
REDIS_URL=redis://localhost:6379
NODE_ENV=development
LOG_LEVEL=info
```

### Queue Configuration
```typescript
const queueConfigs = {
  'report-parsing': {
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 2000 },
      removeOnComplete: 100,
      removeOnFail: 50,
    },
    settings: { maxConcurrency: 5 }
  }
};
```

## Development Workflow

### Starting Workers
```bash
# Start server with workers
npm run dev

# Workers are automatically initialized with the server
```

### Adding New Jobs
```typescript
// Add job to queue
await queueManager.addJob(QUEUE_NAMES.REPORT_PARSING, jobData);

// Monitor job status
const stats = await queueManager.getQueueStats(QUEUE_NAMES.REPORT_PARSING);
```

### Debugging Workers
```typescript
// Check worker status
const workerStatus = workerManager.getWorkerStatus();

// View queue statistics
const queueStats = await queueManager.getAllQueueStats();
```

## Production Deployment

### Scaling Considerations
- **Horizontal Scaling**: Multiple worker processes
- **Queue Priorities**: High/normal/low priority jobs
- **Resource Limits**: Memory and CPU constraints
- **Monitoring**: Queue depth and processing times

### Redis Configuration
```bash
# Redis for production
redis-server --maxmemory 2gb --maxmemory-policy allkeys-lru
```

### Worker Processes
```typescript
// Use PM2 for process management
pm2 start ecosystem.config.js
```

## Best Practices

### Job Design
- **Idempotent**: Jobs should be safe to retry
- **Atomic**: Jobs should complete fully or not at all
- **Traceable**: Include correlation IDs for tracking
- **Timeout**: Set appropriate job timeouts

### Error Handling
- **Graceful Degradation**: Handle partial failures
- **Retry Logic**: Implement exponential backoff
- **Dead Letter**: Preserve failed jobs for analysis
- **Alerting**: Monitor error rates and patterns

### Performance
- **Batch Processing**: Group similar operations
- **Caching**: Cache expensive computations
- **Connection Pooling**: Reuse database connections
- **Resource Limits**: Set memory and time constraints

## Troubleshooting

### Common Issues
1. **Redis Connection**: Check Redis connectivity
2. **Job Stalling**: Monitor job processing times
3. **Memory Leaks**: Monitor worker memory usage
4. **Queue Backlog**: Scale workers if needed

### Debug Commands
```bash
# Check Redis connection
redis-cli ping

# Monitor queue depth
redis-cli llen bull:report-parsing:waiting

# View failed jobs
redis-cli lrange bull:report-parsing:failed 0 10
```

### Health Checks
```bash
# Check queue status
curl http://localhost:3001/api/v1/queues/status

# Monitor worker logs
pm2 logs worker
```

This BullMQ implementation provides a robust, scalable job processing system for FinSathi AI, ensuring reliable handling of heavy computational tasks while maintaining system performance and reliability.
