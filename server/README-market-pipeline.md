# FinSathi AI - Market Data Pipeline

An automated system for fetching, validating, and storing NEPSE market data daily for the FinSathi AI financial advisor platform.

## 🚀 Features

- **Automated Data Fetching**: Fetches stock prices, trading volume, market capitalization, and price changes from NEPSE
- **Multiple Data Sources**: Primary API integration with web scraping fallback
- **Data Validation**: Comprehensive validation with error detection and warnings
- **Database Storage**: PostgreSQL database with Prisma ORM for efficient data management
- **Scheduled Execution**: Cron jobs for daily automated execution (9:30 AM & 3:30 PM)
- **Comprehensive Logging**: Detailed logging with file output and monitoring
- **REST API**: Complete API endpoints for accessing market data
- **Health Monitoring**: Built-in health checks and status monitoring

## 📋 System Requirements

- **Node.js**: 18.0.0 or higher
- **PostgreSQL**: 12.0 or higher
- **npm**: 9.0.0 or higher
- **Operating System**: Linux (recommended), macOS, Windows

## 🛠️ Installation

### 1. Clone Repository
```bash
git clone <repository-url>
cd advisior/server
```

### 2. Install Dependencies
```bash
# Copy market pipeline package configuration
cp package-market-pipeline.json package.json

# Install dependencies
npm install
```

### 3. Setup Database
```bash
# Copy environment configuration
cp .env.market-pipeline .env

# Update DATABASE_URL in .env file
# Example: DATABASE_URL="postgresql://username:password@localhost:5432/finsathi_market_data"

# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push
```

### 4. Deploy System Service
```bash
# Make deployment script executable
chmod +x deploy-market-pipeline.sh

# Run deployment (requires sudo for systemd service)
sudo ./deploy-market-pipeline.sh deploy
```

## ⚙️ Configuration

### Environment Variables

Key environment variables in `.env`:

```bash
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/finsathi_market_data"

# API Configuration
NEPSE_ALPHA_API_URL="https://nepsealpha.com"
NEPSE_OFFICIAL_URL="https://www.nepalstock.com"
API_TIMEOUT=30000

# Pipeline Configuration
PIPELINE_SCHEDULE_ENABLED=true
PIPELINE_TIMEZONE="Asia/Kathmandu"
PIPELINE_LOG_LEVEL="INFO"

# Data Validation
MAX_PRICE_CHANGE_PERCENT=50
MAX_STOCK_PRICE=100000
MIN_STOCK_PRICE=1

# Data Retention
HISTORICAL_DATA_RETENTION_DAYS=365
LOG_RETENTION_DAYS=30
```

### Cron Schedule

The pipeline runs automatically on weekdays:
- **9:30 AM**: Market opening data fetch
- **3:30 PM**: Market closing data fetch

Schedule configuration in `marketDataPipeline.js`:
```javascript
// 9:30 AM weekdays
cron.schedule('30 9 * * 1-5', async () => { ... });

// 3:30 PM weekdays  
cron.schedule('30 15 * * 1-5', async () => { ... });
```

## 📊 Database Schema

### Core Tables

- **MarketSnapshot**: Daily market overview
- **Stock**: Current stock information
- **StockPriceHistory**: Historical price data
- **StockRecommendation**: AI-generated recommendations
- **MarketNews**: Market news and sentiment
- **PipelineLog**: Execution logs and monitoring

### Schema Diagram
```
MarketSnapshot (1) → (N) StockPriceHistory
Stock (1) → (N) StockPriceHistory
Stock (1) → (N) StockRecommendation
MarketNews (1) → (N) StockNews
```

## 🔧 API Endpoints

### Market Data (Public)

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/market/snapshot` | Current market snapshot |
| GET | `/api/v1/market/stocks` | List of all stocks |
| GET | `/api/v1/market/stocks/:symbol` | Stock details |
| GET | `/api/v1/market/stocks/:symbol/history` | Price history |
| GET | `/api/v1/market/indicators` | Market indicators |
| GET | `/api/v1/market/movers` | Top gainers/losers |
| GET | `/api/v1/market/news` | Market news |
| GET | `/api/v1/market/search` | Search stocks |
| GET | `/api/v1/market/sectors` | Sector analysis |

### Pipeline Management (Admin)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/market/pipeline/trigger` | Manual pipeline execution |
| GET | `/api/v1/market/pipeline/status` | Pipeline status |

## 🚀 Usage

### Manual Pipeline Execution
```bash
# Run pipeline manually
npm run pipeline:run

# Check pipeline status
npm run pipeline:status

# Clean old data
npm run pipeline:cleanup
```

### Health Check
```bash
# Run health check script
./health-check.sh
```

### Service Management
```bash
# Start service
sudo systemctl start finsathi-market-pipeline

# Check status
sudo systemctl status finsathi-market-pipeline

# View logs
sudo journalctl -u finsathi-market-pipeline -f

# Restart service
sudo systemctl restart finsathi-market-pipeline
```

## 📁 Project Structure

```
server/
├── src/
│   ├── services/
│   │   └── marketDataPipeline.js     # Main pipeline logic
│   ├── controllers/
│   │   └── marketDataController.js  # API controller
│   ├── routes/
│   │   └── marketDataRoutes.js      # API routes
│   └── middleware/
│       └── auth.js                  # Authentication middleware
├── prisma/
│   ├── market-data-schema.prisma    # Database schema
│   └── schema.prisma                # Main schema
├── logs/                            # Log files
├── data/                            # Data files
├── deploy-market-pipeline.sh        # Deployment script
├── package-market-pipeline.json     # Dependencies
├── .env.market-pipeline             # Environment template
└── README.md                        # This file
```

## 🔍 Monitoring & Logging

### Log Files
- **Location**: `logs/market-data.log`
- **Format**: `[timestamp] LEVEL: message | Data: JSON`
- **Rotation**: Daily, keep 30 days

### Log Levels
- **INFO**: Normal operation
- **WARNING**: Non-critical issues
- **ERROR**: Errors requiring attention
- **DEBUG**: Detailed debugging info

### Health Monitoring
The system includes built-in health checks for:
- Process status
- Database connectivity
- Recent data availability
- API response times

## 🛡️ Data Validation

### Validation Rules
- **Price Range**: 1 - 100,000 NPR
- **Change Limits**: ±50% daily change
- **Volume Limits**: Max 1B shares
- **Data Freshness**: < 24 hours old

### Error Handling
- **Primary API Failure**: Falls back to web scraping
- **Scraping Failure**: Logs error and retries
- **Database Errors**: Retry with exponential backoff
- **Validation Errors**: Skip invalid records, continue processing

## 🔄 Data Sources

### Primary: NEPSE Alpha API
- **Endpoint**: `https://nepsealpha.com/api/v1/market/*`
- **Data**: Real-time market data
- **Reliability**: High
- **Rate Limits**: Apply as needed

### Fallback: Web Scraping
- **Source**: `https://www.nepalstock.com`
- **Method**: Cheerio HTML parsing
- **Reliability**: Medium
- **Frequency**: When API fails

## 📈 Performance

### Benchmarks
- **Execution Time**: 30-60 seconds
- **Records Processed**: 200-300 stocks
- **Database Operations**: ~1000 writes/execution
- **Memory Usage**: ~50MB
- **CPU Usage**: Low (background process)

### Optimization
- **Batch Processing**: Groups database operations
- **Connection Pooling**: Efficient database connections
- **Caching**: Redis for frequent queries (optional)
- **Indexing**: Optimized database indexes

## 🚨 Troubleshooting

### Common Issues

#### Pipeline Not Running
```bash
# Check service status
sudo systemctl status finsathi-market-pipeline

# Check logs
sudo journalctl -u finsathi-market-pipeline -n 50

# Restart service
sudo systemctl restart finsathi-market-pipeline
```

#### Database Connection Errors
```bash
# Check DATABASE_URL in .env
echo $DATABASE_URL

# Test database connection
npx prisma db push --force-reset

# Check database status
sudo systemctl status postgresql
```

#### API Rate Limiting
- Reduce concurrent requests
- Increase timeout values
- Add API authentication
- Implement request delays

#### Data Validation Errors
```bash
# Check validation rules in pipeline
grep -n "validateData" src/services/marketDataPipeline.js

# Review recent logs
tail -n 100 logs/market-data.log | grep ERROR
```

### Debug Mode
Enable debug logging:
```bash
export PIPELINE_LOG_LEVEL=DEBUG
npm run pipeline:run
```

## 🔄 Updates & Maintenance

### Regular Tasks
- **Weekly**: Review logs for errors
- **Monthly**: Clean old data (`npm run pipeline:cleanup`)
- **Quarterly**: Update API endpoints and validation rules
- **Annually**: Review and optimize database schema

### Updates
```bash
# Update dependencies
npm update

# Update database schema
npx prisma db push

# Restart service
sudo systemctl restart finsathi-market-pipeline
```

## 🤝 Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit pull request

### Development Setup
```bash
# Install development dependencies
npm install --dev

# Run tests
npm test

# Run linting
npm run lint

# Start in development mode
npm run dev
```

## 📄 License

MIT License - see LICENSE file for details

## 🆘 Support

For issues and support:
1. Check this README
2. Review logs in `logs/market-data.log`
3. Check GitHub Issues
4. Contact development team

---

**FinSathi AI Market Data Pipeline** - Automated NEPSE market data ingestion for intelligent financial advisory.
