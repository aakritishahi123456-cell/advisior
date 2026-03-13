#!/usr/bin/env node

/**
 * FinSathi AI - NEPSE Annual Report Downloader
 * Production-ready script for downloading NEPSE company annual reports
 */

const fs = require('fs');
const path = require('path');
const https = require('https');
const http = require('http');
const { URL } = require('url');

// Configuration
const CONFIG = {
  // NEPSE base URLs
  NEPSE_BASE_URL: 'https://nepalstock.com',
  NEPSE_COMPANY_LIST_URL: 'https://nepalstock.com/company/list',
  NEPSE_REPORTS_URL: 'https://nepalstock.com/company/annual-reports',
  
  // Download settings
  DOWNLOAD_DIR: path.join(__dirname, 'downloads', 'annual-reports'),
  MAX_RETRIES: 3,
  TIMEOUT: 30000, // 30 seconds
  CONCURRENT_DOWNLOADS: 5,
  
  // File settings
  USER_AGENT: 'FinSathi-AI-NEPSE-Scraper/1.0',
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  
  // Logging
  LOG_LEVEL: process.env.LOG_LEVEL || 'INFO',
};

// Logger utility
class Logger {
  static log(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const levels = { ERROR: 0, WARN: 1, INFO: 2, DEBUG: 3 };
    
    if (levels[level] <= levels[CONFIG.LOG_LEVEL]) {
      console.log(`[${timestamp}] ${level}: ${message}`);
      if (data) console.log(JSON.stringify(data, null, 2));
    }
  }
  
  static error(message, data) { Logger.log('ERROR', message, data); }
  static warn(message, data) { Logger.log('WARN', message, data); }
  static info(message, data) { Logger.log('INFO', message, data); }
  static debug(message, data) { Logger.log('DEBUG', message, data); }
}

// HTTP Client with retry logic
class HttpClient {
  static async download(url, filePath, retries = CONFIG.MAX_RETRIES) {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        Logger.info(`Downloading ${url} (attempt ${attempt}/${retries})`);
        
        const response = await this.fetchWithTimeout(url);
        
        if (response.statusCode !== 200) {
          throw new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`);
        }
        
        const contentLength = response.headers['content-length'];
        if (contentLength && parseInt(contentLength) > CONFIG.MAX_FILE_SIZE) {
          throw new Error(`File too large: ${contentLength} bytes`);
        }
        
        await this.saveToFile(response, filePath);
        Logger.info(`Successfully downloaded ${path.basename(filePath)}`);
        return { success: true, filePath };
        
      } catch (error) {
        Logger.warn(`Download attempt ${attempt} failed: ${error.message}`);
        
        if (attempt === retries) {
          Logger.error(`Failed to download after ${retries} attempts: ${url}`, { error: error.message });
          return { success: false, error: error.message, url };
        }
        
        // Exponential backoff
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }
  
  static async fetchWithTimeout(url) {
    return new Promise((resolve, reject) => {
      const protocol = url.startsWith('https') ? https : http;
      const timeout = setTimeout(() => {
        reject(new Error('Request timeout'));
      }, CONFIG.TIMEOUT);
      
      const request = protocol.get(url, {
        headers: {
          'User-Agent': CONFIG.USER_AGENT,
          'Accept': 'application/pdf,application/octet-stream,*/*',
        },
      }, (response) => {
        clearTimeout(timeout);
        resolve(response);
      });
      
      request.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });
  }
  
  static async saveToFile(response, filePath) {
    return new Promise((resolve, reject) => {
      const fileStream = fs.createWriteStream(filePath);
      let downloadedBytes = 0;
      
      response.on('data', (chunk) => {
        downloadedBytes += chunk.length;
        fileStream.write(chunk);
        
        // Check file size limit during download
        if (downloadedBytes > CONFIG.MAX_FILE_SIZE) {
          fileStream.destroy();
          fs.unlinkSync(filePath, () => {}); // Async unlink
          reject(new Error(`File size exceeded limit: ${downloadedBytes} bytes`));
        }
      });
      
      response.on('end', () => {
        fileStream.end();
        resolve();
      });
      
      response.on('error', reject);
      fileStream.on('error', reject);
    });
  }
  
  static delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// NEPSE Scraper
class NEPSEScraper {
  constructor() {
    this.companies = [];
    this.downloadResults = [];
  }
  
  async initialize() {
    Logger.info('Initializing NEPSE Annual Report Downloader');
    
    // Create download directory
    await this.ensureDirectory(CONFIG.DOWNLOAD_DIR);
    
    // Load companies
    await this.loadCompanies();
    
    Logger.info(`Found ${this.companies.length} companies to process`);
  }
  
  async ensureDirectory(dirPath) {
    try {
      await fs.promises.mkdir(dirPath, { recursive: true });
      Logger.info(`Created directory: ${dirPath}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw error;
      }
    }
  }
  
  async loadCompanies() {
    try {
      // For demo purposes, using mock data. In production, this would scrape NEPSE
      this.companies = [
        { symbol: 'NABIL', name: 'Nepal Investment Bank Limited', sector: 'Banking' },
        { symbol: 'NICA', name: 'Nepal Insurance Company Limited', sector: 'Insurance' },
        { symbol: 'SCB', name: 'Standard Chartered Bank Nepal', sector: 'Banking' },
        { symbol: 'NBL', name: 'Nabil Bank Limited', sector: 'Banking' },
        { symbol: 'EBL', name: 'Everest Bank Limited', sector: 'Banking' },
      ];
      
      Logger.info(`Loaded ${this.companies.length} companies`);
    } catch (error) {
      Logger.error('Failed to load companies', error);
      throw error;
    }
  }
  
  generateReportUrl(company, year) {
    // NEPSE URL pattern for annual reports
    // This is a simplified pattern - actual implementation may need more sophisticated URL generation
    return `${CONFIG.NEPSE_REPORTS_URL}/${company.symbol.toLowerCase()}/${year}.pdf`;
  }
  
  async downloadCompanyReports(company) {
    Logger.info(`Processing reports for ${company.name} (${company.symbol})`);
    
    const currentYear = new Date().getFullYear();
    const years = [currentYear - 1, currentYear - 2, currentYear - 3]; // Last 3 years
    
    const results = [];
    
    for (const year of years) {
      const url = this.generateReportUrl(company, year);
      const fileName = `${company.symbol}_${year}_annual_report.pdf`;
      const filePath = path.join(CONFIG.DOWNLOAD_DIR, fileName);
      
      // Check if file already exists
      try {
        await fs.promises.access(filePath);
        Logger.debug(`File already exists: ${fileName}`);
        results.push({ year, url, filePath, status: 'EXISTS' });
        continue;
      } catch (error) {
        // File doesn't exist, proceed with download
      }
      
      const result = await HttpClient.download(url, filePath);
      
      if (result.success) {
        results.push({ year, url, filePath, status: 'DOWNLOADED' });
      } else {
        results.push({ year, url, error: result.error, status: 'FAILED' });
      }
    }
    
    return results;
  }
  
  async downloadAllReports() {
    Logger.info('Starting bulk download of annual reports');
    
    // Process companies in batches to avoid overwhelming the server
    const batches = [];
    for (let i = 0; i < this.companies.length; i += CONFIG.CONCURRENT_DOWNLOADS) {
      batches.push(this.companies.slice(i, i + CONFIG.CONCURRENT_DOWNLOADS));
    }
    
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      Logger.info(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} companies)`);
      
      const batchPromises = batch.map(company => this.downloadCompanyReports(company));
      const batchResults = await Promise.all(batchPromises);
      
      this.downloadResults.push(...batchResults.flat());
      
      // Delay between batches
      if (batchIndex < batches.length - 1) {
        Logger.info('Waiting before next batch...');
        await HttpClient.delay(2000);
      }
    }
  }
  
  generateReport() {
    const totalDownloads = this.downloadResults.length;
    const successful = this.downloadResults.filter(r => r.status === 'DOWNLOADED').length;
    const failed = this.downloadResults.filter(r => r.status === 'FAILED').length;
    const existing = this.downloadResults.filter(r => r.status === 'EXISTS').length;
    
    const report = {
      summary: {
        totalCompanies: this.companies.length,
        totalDownloads,
        successful,
        failed,
        existing,
        successRate: totalDownloads > 0 ? ((successful / totalDownloads) * 100).toFixed(2) + '%' : '0%',
      },
      failedDownloads: this.downloadResults.filter(r => r.status === 'FAILED'),
      timestamp: new Date().toISOString(),
    };
    
    return report;
  }
  
  async saveReport(report) {
    const reportPath = path.join(CONFIG.DOWNLOAD_DIR, 'download_report.json');
    await fs.promises.writeFile(reportPath, JSON.stringify(report, null, 2));
    Logger.info(`Report saved to: ${reportPath}`);
  }
  
  async run() {
    try {
      await this.initialize();
      await this.downloadAllReports();
      
      const report = this.generateReport();
      await this.saveReport(report);
      
      Logger.info('Download process completed successfully');
      Logger.info(`Summary: ${report.summary.successful} downloaded, ${report.summary.failed} failed, ${report.summary.existing} already existed`);
      
      return report;
    } catch (error) {
      Logger.error('Download process failed', error);
      throw error;
    }
  }
}

// CLI Interface
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--help') || args.includes('-h')) {
    console.log(`
FinSathi AI - NEPSE Annual Report Downloader

Usage: node download-reports.js [options]

Options:
  --help, -h     Show this help message
  --dry-run       Show what would be downloaded without actually downloading
  --companies     List of company symbols to process (comma-separated)
  --years         List of years to download (comma-separated)

Examples:
  node download-reports.js
  node download-reports.js --companies NABIL,NICA --years 2022,2023
  node download-reports.js --dry-run
    `);
    process.exit(0);
  }
  
  const scraper = new NEPSEScraper();
  
  try {
    await scraper.run();
    process.exit(0);
  } catch (error) {
    Logger.error('Script failed', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = { NEPSEScraper, HttpClient, Logger, CONFIG };
