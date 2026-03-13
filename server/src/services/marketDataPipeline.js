/**
 * FinSathi AI - Market Data Pipeline
 * Automated NEPSE market data ingestion system
 */

const { PrismaClient } = require('@prisma/client');
const axios = require('axios');
const cheerio = require('cheerio');
const cron = require('node-cron');
const fs = require('fs').promises;
const path = require('path');

class MarketDataPipeline {
  constructor() {
    this.prisma = new PrismaClient();
    this.baseURL = 'https://nepsealpha.com';
    this.fallbackURL = 'https://www.nepalstock.com';
    this.logFile = path.join(__dirname, 'logs', 'market-data.log');
    this.isRunning = false;
  }

  /**
   * Initialize the pipeline
   */
  async initialize() {
    try {
      await this.ensureLogDirectory();
      console.log('Market Data Pipeline initialized');
      await this.log('INFO', 'Pipeline initialized successfully');
    } catch (error) {
      console.error('Failed to initialize pipeline:', error);
      throw error;
    }
  }

  /**
   * Ensure log directory exists
   */
  async ensureLogDirectory() {
    const logDir = path.dirname(this.logFile);
    try {
      await fs.access(logDir);
    } catch {
      await fs.mkdir(logDir, { recursive: true });
    }
  }

  /**
   * Log events to file and console
   */
  async log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level,
      message,
      data: data ? JSON.stringify(data) : null
    };
    
    const logLine = `[${timestamp}] ${level}: ${message}${data ? ` | Data: ${JSON.stringify(data)}` : ''}\n`;
    
    // Console output
    console.log(logLine.trim());
    
    // File output
    try {
      await fs.appendFile(this.logFile, logLine);
    } catch (error) {
      console.error('Failed to write to log file:', error);
    }
  }

  /**
   * Fetch market data from NEPSE Alpha API
   */
  async fetchNEPSEAlphaData() {
    try {
      await this.log('INFO', 'Fetching data from NEPSE Alpha API');
      
      const endpoints = [
        '/api/v1/market/snapshot',
        '/api/v1/market/stocks',
        '/api/v1/market/volume',
        '/api/v1/market/capitalization'
      ];

      const results = {};
      
      for (const endpoint of endpoints) {
        try {
          const response = await axios.get(`${this.baseURL}${endpoint}`, {
            headers: {
              'User-Agent': 'FinSathi-AI-Market-Pipeline/1.0'
            },
            timeout: 30000
          });
          
          const key = endpoint.split('/').pop();
          results[key] = response.data;
          
          await this.log('INFO', `Successfully fetched ${key} data`, {
            records: Array.isArray(response.data) ? response.data.length : 'object'
          });
          
        } catch (error) {
          await this.log('ERROR', `Failed to fetch ${endpoint}`, error.message);
          results[endpoint.split('/').pop()] = null;
        }
      }

      return results;
    } catch (error) {
      await this.log('ERROR', 'Failed to fetch NEPSE Alpha data', error.message);
      throw error;
    }
  }

  /**
   * Fetch market data using web scraping (fallback method)
   */
  async fetchScrapedData() {
    try {
      await this.log('INFO', 'Fetching data using web scraping');
      
      const response = await axios.get(this.fallbackURL, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      const $ = cheerio.load(response.data);
      const stocks = [];

      // Parse stock data from table
      $('.stock-table tbody tr').each((index, element) => {
        const $row = $(element);
        const cells = $row.find('td');
        
        if (cells.length >= 6) {
          stocks.push({
            symbol: $(cells[0]).text().trim(),
            company: $(cells[1]).text().trim(),
            price: parseFloat($(cells[2]).text().replace(/,/g, '')),
            change: parseFloat($(cells[3]).text().replace(/,/g, '')),
            changePercent: parseFloat($(cells[4]).text().replace(/%/g, '')),
            volume: parseInt($(cells[5]).text().replace(/,/g, '')),
            marketCap: parseFloat($(cells[6]).text().replace(/,/g, '')) || 0
          });
        }
      });

      await this.log('INFO', 'Scraped data successfully', { stocksFound: stocks.length });
      
      return {
        stocks,
        snapshot: {
          totalCompanies: stocks.length,
          timestamp: new Date().toISOString(),
          source: 'web_scraping'
        }
      };
    } catch (error) {
      await this.log('ERROR', 'Failed to scrape data', error.message);
      throw error;
    }
  }

  /**
   * Validate market data
   */
  validateData(data) {
    const validation = {
      isValid: true,
      errors: [],
      warnings: []
    };

    try {
      // Check if data exists
      if (!data || typeof data !== 'object') {
        validation.isValid = false;
        validation.errors.push('Invalid data structure');
        return validation;
      }

      // Validate stocks array
      if (data.stocks && Array.isArray(data.stocks)) {
        data.stocks.forEach((stock, index) => {
          if (!stock.symbol) {
            validation.errors.push(`Stock ${index}: Missing symbol`);
            validation.isValid = false;
          }
          
          if (stock.price && (stock.price < 0 || stock.price > 100000)) {
            validation.warnings.push(`Stock ${stock.symbol}: Unusual price ${stock.price}`);
          }
          
          if (stock.changePercent && Math.abs(stock.changePercent) > 50) {
            validation.warnings.push(`Stock ${stock.symbol}: Extreme change ${stock.changePercent}%`);
          }
        });
      }

      // Check timestamp
      if (data.snapshot && data.snapshot.timestamp) {
        const timestamp = new Date(data.snapshot.timestamp);
        const now = new Date();
        const ageHours = (now - timestamp) / (1000 * 60 * 60);
        
        if (ageHours > 24) {
          validation.warnings.push(`Data is ${ageHours.toFixed(1)} hours old`);
        }
      }

      await this.log('INFO', 'Data validation completed', {
        isValid: validation.isValid,
        errors: validation.errors.length,
        warnings: validation.warnings.length
      });

    } catch (error) {
      validation.isValid = false;
      validation.errors.push(`Validation error: ${error.message}`);
    }

    return validation;
  }

  /**
   * Store market data in database
   */
  async storeData(data) {
    try {
      await this.log('INFO', 'Starting data storage');
      
      const results = {
        stocksInserted: 0,
        stocksUpdated: 0,
        errors: []
      };

      // Store market snapshot
      if (data.snapshot) {
        await this.prisma.marketSnapshot.upsert({
          where: { date: new Date().toISOString().split('T')[0] },
          update: {
            totalCompanies: data.snapshot.totalCompanies,
            totalVolume: data.snapshot.totalVolume || 0,
            totalMarketCap: data.snapshot.totalMarketCap || 0,
            nepseIndex: data.snapshot.nepseIndex || 0,
            source: data.snapshot.source || 'api'
          },
          create: {
            date: new Date().toISOString().split('T')[0],
            totalCompanies: data.snapshot.totalCompanies || 0,
            totalVolume: data.snapshot.totalVolume || 0,
            totalMarketCap: data.snapshot.totalMarketCap || 0,
            nepseIndex: data.snapshot.nepseIndex || 0,
            source: data.snapshot.source || 'api'
          }
        });
      }

      // Store stock data
      if (data.stocks && Array.isArray(data.stocks)) {
        for (const stock of data.stocks) {
          try {
            await this.prisma.stock.upsert({
              where: { symbol: stock.symbol },
              update: {
                price: stock.price,
                change: stock.change || 0,
                changePercent: stock.changePercent || 0,
                volume: stock.volume || 0,
                marketCap: stock.marketCap || 0,
                lastUpdated: new Date()
              },
              create: {
                symbol: stock.symbol,
                name: stock.company || stock.name || stock.symbol,
                price: stock.price,
                change: stock.change || 0,
                changePercent: stock.changePercent || 0,
                volume: stock.volume || 0,
                marketCap: stock.marketCap || 0,
                lastUpdated: new Date()
              }
            });

            // Store historical data
            await this.prisma.stockPriceHistory.create({
              data: {
                symbol: stock.symbol,
                price: stock.price,
                volume: stock.volume || 0,
                marketCap: stock.marketCap || 0,
                date: new Date().toISOString().split('T')[0]
              }
            });

            results.stocksInserted++;
          } catch (error) {
            results.stocksUpdated++;
            results.errors.push(`Failed to store ${stock.symbol}: ${error.message}`);
          }
        }
      }

      await this.log('INFO', 'Data storage completed', results);
      return results;
    } catch (error) {
      await this.log('ERROR', 'Failed to store data', error.message);
      throw error;
    }
  }

  /**
   * Main pipeline execution
   */
  async executePipeline() {
    if (this.isRunning) {
      await this.log('WARNING', 'Pipeline is already running');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();

    try {
      await this.log('INFO', 'Starting market data pipeline execution');

      // Step 1: Fetch data
      let marketData;
      try {
        marketData = await this.fetchNEPSEAlphaData();
      } catch (error) {
        await this.log('WARNING', 'Primary API failed, trying fallback method');
        marketData = await this.fetchScrapedData();
      }

      // Step 2: Validate data
      const validation = this.validateData(marketData);
      if (!validation.isValid) {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }

      // Step 3: Store data
      const storageResults = await this.storeData(marketData);

      // Step 4: Log results
      const executionTime = Date.now() - startTime;
      await this.log('INFO', 'Pipeline execution completed successfully', {
        executionTime: `${executionTime}ms`,
        storageResults,
        warnings: validation.warnings
      });

      return {
        success: true,
        executionTime,
        storageResults,
        warnings: validation.warnings
      };

    } catch (error) {
      await this.log('ERROR', 'Pipeline execution failed', error.message);
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Schedule daily execution
   */
  scheduleDailyExecution() {
    // Run every day at 3:30 PM (NEPSE closing time)
    cron.schedule('30 15 * * 1-5', async () => {
      await this.log('INFO', 'Starting scheduled daily execution');
      try {
        await this.executePipeline();
      } catch (error) {
        await this.log('ERROR', 'Scheduled execution failed', error.message);
      }
    });

    // Also run at 9:30 AM (market opening)
    cron.schedule('30 9 * * 1-5', async () => {
      await this.log('INFO', 'Starting morning market update');
      try {
        await this.executePipeline();
      } catch (error) {
        await this.log('ERROR', 'Morning update failed', error.message);
      }
    });

    await this.log('INFO', 'Scheduled daily execution: 9:30 AM and 3:30 PM (weekdays)');
  }

  /**
   * Manual execution for testing
   */
  async runManually() {
    await this.log('INFO', 'Starting manual execution');
    return await this.executePipeline();
  }

  /**
   * Get pipeline status
   */
  async getStatus() {
    const status = {
      isRunning: this.isRunning,
      lastExecution: null,
      todayData: null,
      databaseStats: null
    };

    try {
      // Get last execution from logs
      const logContent = await fs.readFile(this.logFile, 'utf8');
      const lines = logContent.split('\n').filter(line => line.includes('Pipeline execution completed'));
      if (lines.length > 0) {
        const lastLine = lines[lines.length - 1];
        const timestamp = lastLine.match(/\[([^\]]+)\]/)[1];
        status.lastExecution = timestamp;
      }

      // Get today's data count
      const today = new Date().toISOString().split('T')[0];
      const todaySnapshot = await this.prisma.marketSnapshot.findUnique({
        where: { date: today }
      });
      
      if (todaySnapshot) {
        status.todayData = {
          totalCompanies: todaySnapshot.totalCompanies,
          totalVolume: todaySnapshot.totalVolume,
          nepseIndex: todaySnapshot.nepseIndex,
          source: todaySnapshot.source
        };
      }

      // Get database statistics
      const totalStocks = await this.prisma.stock.count();
      const totalHistorical = await this.prisma.stockPriceHistory.count();
      
      status.databaseStats = {
        totalStocks,
        totalHistoricalRecords: totalHistorical
      };

    } catch (error) {
      await this.log('ERROR', 'Failed to get status', error.message);
    }

    return status;
  }

  /**
   * Cleanup old data
   */
  async cleanupOldData(daysToKeep = 365) {
    try {
      await this.log('INFO', `Starting cleanup of data older than ${daysToKeep} days`);
      
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);
      
      const deleted = await this.prisma.stockPriceHistory.deleteMany({
        where: {
          date: {
            lt: cutoffDate.toISOString().split('T')[0]
          }
        }
      });

      await this.log('INFO', `Cleanup completed`, { deletedRecords: deleted.count });
      return deleted.count;
    } catch (error) {
      await this.log('ERROR', 'Cleanup failed', error.message);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    await this.log('INFO', 'Shutting down market data pipeline');
    await this.prisma.$disconnect();
  }
}

// Initialize and start the pipeline
const pipeline = new MarketDataPipeline();

// Handle process termination
process.on('SIGINT', async () => {
  await pipeline.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await pipeline.shutdown();
  process.exit(0);
});

// Export for use in other modules
module.exports = MarketDataPipeline;

// If running directly, start the pipeline
if (require.main === module) {
  (async () => {
    try {
      await pipeline.initialize();
      
      // Schedule daily execution
      pipeline.scheduleDailyExecution();
      
      // Run once on startup for testing
      console.log('Running initial pipeline execution...');
      await pipeline.runManually();
      
      // Keep process running
      console.log('Market data pipeline is running. Press Ctrl+C to stop.');
      
    } catch (error) {
      console.error('Failed to start pipeline:', error);
      process.exit(1);
    }
  })();
}
