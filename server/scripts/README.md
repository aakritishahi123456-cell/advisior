# FinSathi AI - NEPSE Annual Report Downloader

Production-ready scripts for downloading NEPSE company annual reports with robust error handling and edge case management.

## 🚀 Features

- **Multi-language Support**: Available in both Node.js and Python
- **Concurrent Downloads**: Configurable parallel processing
- **Retry Logic**: Exponential backoff for failed downloads
- **Size Limits**: Protection against oversized files
- **Progress Tracking**: Comprehensive logging and reporting
- **Edge Case Handling**: Broken links, missing reports, network issues
- **Resume Capability**: Skips already downloaded files
- **Production Ready**: Structured logging, error handling, and monitoring

## 📋 Prerequisites

### Node.js Version
```bash
# Node.js 16+ required
node --version

# Install dependencies
npm install
```

### Python Version
```bash
# Python 3.8+ required
python --version

# Install dependencies
pip install -r requirements.txt
```

## 🛠️ Configuration

### Environment Variables
```bash
# Set log level (ERROR, WARN, INFO, DEBUG)
export LOG_LEVEL=INFO

# Optional: Custom download directory
export DOWNLOAD_DIR=/path/to/downloads
```

### Script Configuration
Both scripts include configurable constants:

- **MAX_RETRIES**: Maximum retry attempts (default: 3)
- **TIMEOUT**: Request timeout in seconds (default: 30)
- **CONCURRENT_DOWNLOADS**: Parallel downloads (default: 5)
- **MAX_FILE_SIZE**: Maximum file size in bytes (default: 50MB)
- **USER_AGENT**: Custom user agent string

## 📥 Usage

### Node.js

```bash
# Download all reports for all companies
node download-nepse-reports.js

# Download specific companies
node download-nepse-reports.js --companies NABIL,NICA,SCB

# Download specific years
node download-nepse-reports.js --years 2022,2023

# Show help
node download-nepse-reports.js --help

# Dry run (show what would be downloaded)
node download-nepse-reports.js --dry-run
```

### Python

```bash
# Download all reports for all companies
python download-nepse-reports.py

# Download specific companies
python download-nepse-reports.py --companies NABIL,NICA,SCB

# Download specific years
python download-nepse-reports.py --years 2022,2023

# Show help
python download-nepse-reports.py --help

# Dry run
python download-nepse-reports.py --dry-run
```

## Nepal Loan Products Scraper

Scrapes loan products + interest rates from selected Nepali banks and upserts into Postgres table `loan_products`.

### Prerequisites
- Create the table using `server/prisma/migrations/003_loan_products.sql`
- Set `DATABASE_URL` (Postgres connection string)

### Run
```bash
pip install -r requirements.txt
python scrape-loan-products.py --dry-run
python scrape-loan-products.py
```

### Weekly Cron
See `infra/cron/loan-scraper-weekly.cron`.

## 📁 Output Structure

```
downloads/
├── annual-reports/
│   ├── NABIL_2023_annual_report.pdf
│   ├── NABIL_2022_annual_report.pdf
│   ├── NICA_2023_annual_report.pdf
│   └── download_report.json
└── logs/
    └── download-2024-03-10.log
```

## 📊 Reports

After each run, a `download_report.json` is generated:

```json
{
  "summary": {
    "total_companies": 5,
    "total_downloads": 15,
    "successful": 12,
    "failed": 2,
    "existing": 1,
    "success_rate": "80.00%"
  },
  "failed_downloads": [
    {
      "year": 2021,
      "url": "https://nepalstock.com/company/annual-reports/nabil/2021.pdf",
      "error": "HTTP 404: Not Found",
      "status": "FAILED"
    }
  ],
  "timestamp": "2024-03-10T20:13:45.123Z"
}
```

## 🛡️ Edge Case Handling

### Broken Links
- **Detection**: HTTP 404/500 responses
- **Action**: Retry with exponential backoff, then log as failed
- **Recovery**: Continue with other downloads

### Missing Reports
- **Detection**: 404 responses for specific years
- **Action**: Log as missing, don't retry indefinitely
- **Recovery**: Mark as "MISSING" in report

### Network Issues
- **Detection**: Timeouts, connection errors
- **Action**: Retry with exponential backoff
- **Recovery**: Continue after max retries

### Large Files
- **Detection**: Content-Length > MAX_FILE_SIZE
- **Action**: Reject download, log warning
- **Recovery**: Continue with other files

### Server Overload
- **Detection**: HTTP 429/503 responses
- **Action**: Delay between batches, reduce concurrency
- **Recovery**: Automatic retry with longer delays

## 🔧 Advanced Usage

### Custom Company List
Replace the mock data in `_load_companies()` method:

```javascript
// Node.js
this.companies = [
  { symbol: 'CUSTOM', name: 'Custom Company Ltd', sector: 'Technology' },
  // ... more companies
];
```

```python
# Python
self.companies = [
    {"symbol": "CUSTOM", "name": "Custom Company Ltd", "sector": "Technology"},
    # ... more companies
]
```

### URL Pattern Customization
Modify `_generate_report_url()` method for different URL patterns:

```javascript
// Node.js
generateReportUrl(company, year) {
  return `${CONFIG.NEPSE_REPORTS_URL}/${company.symbol}/${year}/annual-report.pdf`;
}
```

```python
# Python
def _generate_report_url(self, company: Dict, year: int) -> str:
    return f"{Config.NEPSE_REPORTS_URL}/{company['symbol']}/{year}/annual-report.pdf"
```

## 📝 Logging

### Log Levels
- **ERROR**: Critical failures
- **WARN**: Expected issues (missing files, retries)
- **INFO**: Progress and summary
- **DEBUG**: Detailed debugging info

### Log Format
```
[2024-03-10T20:13:45.123Z] INFO: Downloading https://nepalstock.com/company/annual-reports/NABIL/2023.pdf
[2024-03-10T20:13:45.456Z] INFO: Successfully downloaded NABIL_2023_annual_report.pdf
[2024-03-10T20:13:45.789Z] WARN: Download attempt 2 failed: HTTP 404: Not Found
```

## 🧪 Testing

### Node.js Tests
```bash
npm test
```

### Python Tests
```bash
pytest test_downloader.py -v
```

## 📈 Monitoring

### Metrics to Track
- **Success Rate**: Percentage of successful downloads
- **Average Download Time**: Per file performance
- **Error Categories**: Types of failures
- **File Sizes**: Detect anomalies
- **Server Response Times**: Performance monitoring

### Integration Examples
```bash
# Send metrics to monitoring system
node download-nepse-reports.js | jq '.summary' | curl -X POST -d @- monitoring-api.com/metrics

# Alert on high failure rates
python download-nepse-reports.py --monitoring-webhook https://alerts.company.com/webhook
```

## 🔒 Security Considerations

- **Rate Limiting**: Configurable delays between requests
- **User Agent**: Proper identification
- **File Validation**: Size and type checking
- **Error Handling**: No sensitive data in logs
- **Network Security**: HTTPS only, certificate validation

## 🚀 Production Deployment

### Docker Example
```dockerfile
FROM node:16-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
CMD ["node", "download-nepse-reports.js"]
```

### Cron Job
```bash
# Run daily at 2 AM
0 2 * * * cd /app && node download-nepse-reports.js >> /app/logs/download-$(date +\%Y-\%m-\%d).log 2>&1
```

### Kubernetes
```yaml
apiVersion: batch/v1
kind: CronJob
metadata:
  name: nepse-downloader
spec:
  schedule: "0 2 * * *"
  jobTemplate:
    spec:
      template:
        spec:
          containers:
          - name: downloader
            image: finsathi/nepse-downloader:latest
            command: ["node", "download-nepse-reports.js"]
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Add tests for new functionality
4. Ensure all tests pass
5. Submit pull request

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and questions:
- Create GitHub issue
- Email: support@finsathi.ai
- Check logs for detailed error information

---

**Built with ❤️ by FinSathi AI Team**
