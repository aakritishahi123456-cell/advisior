/**
 * FinSathi AI - Global Data Ingestion Service
 * Unified data pipeline for multi-market financial data
 */

const axios = require('axios');

class GlobalDataIngestion {
  constructor() {
    this.sources = {
      NEPSE: new NEPSEDataSource(),
      NSE: new NSEDataSource(),      // National Stock Exchange India
      BSE: new BSEDataSource(),        // Bombay Stock Exchange India
      NYSE: new NYSEDataSource(),       // New York Stock Exchange
      NASDAQ: new NASDAQDataSource()   // NASDAQ
    };
    this.standardizer = new FinancialStandardizer();
  }

  /**
   * Fetch data from specific market
   */
  async fetchMarketData(market, dataType, options = {}) {
    const source = this.sources[market];
    
    if (!source) {
      throw new Error(`Unknown market: ${market}`);
    }

    switch (dataType) {
      case 'companies':
        return source.getCompanies();
      case 'prices':
        return source.getPrices(options.symbols, options.range);
      case 'financials':
        return source.getFinancials(options.symbols, options.periods);
      case 'index':
        return source.getIndex(options.index);
      default:
        throw new Error(`Unknown data type: ${dataType}`);
    }
  }

  /**
   * Fetch and standardize data from all markets
   */
  async fetchAllMarkets(dataType, options = {}) {
    const results = {};
    
    for (const market of Object.keys(this.sources)) {
      try {
        const data = await this.fetchMarketData(market, dataType, options);
        results[market] = {
          success: true,
          data: data.map(item => this.standardizer.standardize(item, market))
        };
      } catch (error) {
        results[market] = {
          success: false,
          error: error.message
        };
      }
    }
    
    return results;
  }

  /**
   * Sync all markets
   */
  async syncAllMarkets() {
    const results = {
      timestamp: new Date().toISOString(),
      markets: {}
    };

    for (const [market, source] of Object.entries(this.sources)) {
      try {
        const start = Date.now();
        
        const companies = await source.getCompanies();
        const standardized = companies.map(c => 
          this.standardizer.standardize(c, market)
        );
        
        results.markets[market] = {
          status: 'success',
          companies: standardized.length,
          duration: Date.now() - start
        };
      } catch (error) {
        results.markets[market] = {
          status: 'failed',
          error: error.message
        };
      }
    }

    return results;
  }
}

// ============================================
// DATA SOURCES
// ============================================

class NEPSEDataSource {
  constructor() {
    this.baseUrl = 'https://www.nepalstock.com/api';
  }

  async getCompanies() {
    // Would fetch from NEPSE API
    return [
      {
        symbol: 'NABIL',
        name: 'Nabil Bank Limited',
        sector: 'BANKING',
        market: 'NEPSE',
        listingDate: '1993-01-03',
        shares: 25000000,
        faceValue: 100
      }
    ];
  }

  async getPrices(symbols, range = '1Y') {
    // Fetch historical prices
    return [];
  }

  async getFinancials(symbols, periods = ['2023']) {
    // Fetch annual/quarterly reports
    return [];
  }

  async getIndex(index = 'NEPSE') {
    return { value: 2500, change: 1.2 };
  }
}

class NSEDataSource {
  constructor() {
    this.baseUrl = 'https://api.nseindia.com';
  }

  async getCompanies() {
    return [
      {
        symbol: 'RELIANCE',
        name: 'Reliance Industries Ltd',
        sector: 'CONSUMER',
        market: 'NSE',
        listingDate: '1977-05-20',
        shares: 630000000,
        faceValue: 1
      }
    ];
  }

  async getPrices(symbols, range = '1Y') {
    return [];
  }

  async getFinancials(symbols, periods = ['2023']) {
    return [];
  }

  async getIndex(index = 'NIFTY50') {
    return { value: 19500, change: 0.5 };
  }
}

class BSEDataSource {
  constructor() {
    this.baseUrl = 'https://api.bseindia.com';
  }

  async getCompanies() {
    return [];
  }

  async getPrices(symbols, range = '1Y') {
    return [];
  }

  async getFinancials(symbols, periods = ['2023']) {
    return [];
  }

  async getIndex(index = 'SENSEX') {
    return { value: 65000, change: 0.3 };
  }
}

class NYSEDataSource {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com';
  }

  async getCompanies() {
    return [
      {
        symbol: 'AAPL',
        name: 'Apple Inc.',
        sector: 'TECHNOLOGY',
        market: 'NYSE',
        listingDate: '1980-12-12',
        shares: 15000000000,
        faceValue: 0.01
      }
    ];
  }

  async getPrices(symbols, range = '1Y') {
    return [];
  }

  async getFinancials(symbols, periods = ['2023']) {
    return [];
  }

  async getIndex(index = 'DJI') {
    return { value: 38000, change: 0.2 };
  }
}

class NASDAQDataSource {
  constructor() {
    this.baseUrl = 'https://query1.finance.yahoo.com';
  }

  async getCompanies() {
    return [
      {
        symbol: 'GOOGL',
        name: 'Alphabet Inc.',
        sector: 'TECHNOLOGY',
        market: 'NASDAQ',
        listingDate: '2004-08-19',
        shares: 12400000000,
        faceValue: 0.001
      }
    ];
  }

  async getPrices(symbols, range = '1Y') {
    return [];
  }

  async getFinancials(symbols, periods = ['2023']) {
    return [];
  }

  async getIndex(index = 'IXIC') {
    return { value: 15000, change: 0.4 };
  }
}

// ============================================
// FINANCIAL STANDARDIZER
// ============================================

class FinancialStandardizer {
  /**
   * Standardize financial data to unified format
   */
  standardize(data, market) {
    const standard = {
      // Identity
      id: this.generateId(data.symbol, market),
      symbol: data.symbol,
      name: data.name,
      market: market,
      exchange: this.getExchange(market),
      
      // Classification
      sector: this.standardizeSector(data.sector, market),
      industry: data.industry || null,
      
      // Capitalization
      sharesOutstanding: this.standardizeNumber(data.shares),
      marketCap: data.marketCap || this.calculateMarketCap(data),
      faceValue: this.standardizeNumber(data.faceValue),
      
      // Listing
      listingDate: this.standardizeDate(data.listingDate),
      
      // Metadata
      currency: this.getCurrency(market),
      timezone: this.getTimezone(market),
      
      // Source
      sourceData: data,
      lastUpdated: new Date().toISOString()
    };

    return standard;
  }

  /**
   * Standardize price data
   */
  standardizePrice(data, market) {
    return {
      id: this.generateId(data.symbol, market),
      symbol: data.symbol,
      market: market,
      date: this.standardizeDate(data.date),
      
      // OHLCV
      open: this.standardizeNumber(data.open),
      high: this.standardizeNumber(data.high),
      low: this.standardizeNumber(data.low),
      close: this.standardizeNumber(data.close),
      volume: this.standardizeNumber(data.volume),
      value: this.standardizeNumber(data.value),
      
      // Adjustments
      dividend: this.standardizeNumber(data.dividend),
      split: data.split || null,
      adjustedClose: this.standardizeNumber(data.adjustedClose || data.close),
      
      currency: this.getCurrency(market),
      source: market
    };
  }

  /**
   * Standardize financial statements
   */
  standardizeFinancials(data, market) {
    const period = data.period || 'ANNUAL';
    const year = data.year || new Date().getFullYear();

    return {
      id: this.generateId(`${data.symbol}_${period}_${year}`, market),
      symbol: data.symbol,
      market: market,
      
      // Period
      period: period.toUpperCase(),
      fiscalYear: year,
      quarter: data.quarter || null,
      
      // Income Statement
      revenue: this.standardizeNumber(data.revenue),
      costOfRevenue: this.standardizeNumber(data.costOfRevenue),
      grossProfit: this.standardizeNumber(data.grossProfit),
      operatingIncome: this.standardizeNumber(data.operatingIncome),
      netIncome: this.standardizeNumber(data.netIncome),
      eps: this.standardizeNumber(data.eps),
      
      // Balance Sheet
      totalAssets: this.standardizeNumber(data.totalAssets),
      totalLiabilities: this.standardizeNumber(data.totalLiabilities),
      totalEquity: this.standardizeNumber(data.totalEquity),
      currentAssets: this.standardizeNumber(data.currentAssets),
      currentLiabilities: this.standardizeNumber(data.currentLiabilities),
      cash: this.standardizeNumber(data.cash),
      debt: this.standardizeNumber(data.debt),
      
      // Cash Flow
      operatingCashFlow: this.standardizeNumber(data.operatingCashFlow),
      investingCashFlow: this.standardizeNumber(data.investingCashFlow),
      financingCashFlow: this.standardizeNumber(data.financingCashFlow),
      
      // Ratios (pre-calculated)
      roe: this.standardizeNumber(data.roe),
      roa: this.standardizeNumber(data.roa),
      debtToEquity: this.standardizeNumber(data.debtToEquity),
      currentRatio: this.standardizeNumber(data.currentRatio),
      grossMargin: this.standardizeNumber(data.grossMargin),
      netMargin: this.standardizeNumber(data.netMargin),
      
      currency: this.getCurrency(market),
      source: market,
      sourceData: data
    };
  }

  /**
   * Standardize sector classification
   */
  standardizeSector(sector, market) {
    const sectorMap = {
      NEPSE: {
        'Bank': 'FINANCIAL',
        'Hydro': 'UTILITY',
        'Hotel': 'CONSUMER',
        'Mutual Fund': 'FINANCIAL',
        'Manufacturing': 'INDUSTRIAL'
      },
      NSE: {
        'Consumer': 'CONSUMER',
        'Technology': 'TECHNOLOGY',
        'Financial': 'FINANCIAL',
        'Energy': 'ENERGY',
        'Healthcare': 'HEALTHCARE'
      },
      NYSE: {
        'Technology': 'TECHNOLOGY',
        'Financial': 'FINANCIAL',
        'Healthcare': 'HEALTHCARE',
        'Consumer': 'CONSUMER'
      }
    };

    return sectorMap[market]?.[sector] || sector || 'OTHER';
  }

  /**
   * Standardize number formats
   */
  standardizeNumber(value) {
    if (value === null || value === undefined) return null;
    if (typeof value === 'number') return value;
    
    // Remove currency symbols, commas
    const cleaned = String(value)
      .replace(/[$,]/g, '')
      .replace(/\s+/g, '');
    
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  /**
   * Standardize dates
   */
  standardizeDate(date) {
    if (!date) return null;
    if (date instanceof Date) return date.toISOString();
    
    const parsed = new Date(date);
    return isNaN(parsed.getTime()) ? null : parsed.toISOString();
  }

  /**
   * Generate unique ID
   */
  generateId(symbol, market) {
    return `${market}_${symbol}`.toUpperCase();
  }

  /**
   * Get exchange code
   */
  getExchange(market) {
    const exchanges = {
      NEPSE: 'NEPSE',
      NSE: 'NSE',
      BSE: 'BSE',
      NYSE: 'NYSE',
      NASDAQ: 'NASDAQ'
    };
    return exchanges[market] || market;
  }

  /**
   * Get currency for market
   */
  getCurrency(market) {
    const currencies = {
      NEPSE: 'NPR',
      NSE: 'INR',
      BSE: 'INR',
      NYSE: 'USD',
      NASDAQ: 'USD'
    };
    return currencies[market] || 'USD';
  }

  /**
   * Get timezone for market
   */
  getTimezone(market) {
    const timezones = {
      NEPSE: 'Asia/Kathmandu',
      NSE: 'Asia/Kolkata',
      BSE: 'Asia/Kolkata',
      NYSE: 'America/New_York',
      NASDAQ: 'America/New_York'
    };
    return timezones[market] || 'UTC';
  }

  /**
   * Calculate market cap
   */
  calculateMarketCap(data) {
    if (data.marketCap) return data.marketCap;
    if (data.shares && data.price) {
      return data.shares * data.price;
    }
    return null;
  }
}

module.exports = GlobalDataIngestion;
