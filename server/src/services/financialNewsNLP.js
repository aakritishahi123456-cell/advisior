/**
 * FinSathi AI - Financial News Intelligence System
 * NLP pipeline for news analysis and sentiment extraction
 */

const axios = require('axios');

class FinancialNewsNLP {
  constructor() {
    this.companyPatterns = this.loadCompanyPatterns();
    this.sentimentLexicon = this.loadSentimentLexicon();
    this.sectorKeywords = this.loadSectorKeywords();
  }

  // ============================================
  // NEWS COLLECTION
  // ============================================

  /**
   * Collect news from various sources
   */
  async collectNews(options = {}) {
    const { sources = ['nepse', 'news'], limit = 20, keywords } = options;
    
    const news = [];
    
    for (const source of sources) {
      try {
        const articles = await this.fetchFromSource(source, limit, keywords);
        news.push(...articles);
      } catch (error) {
        console.error(`Error fetching from ${source}:`, error.message);
      }
    }
    
    return news.sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt));
  }

  /**
   * Fetch news from specific source
   */
  async fetchFromSource(source, limit, keywords) {
    // In production, integrate with actual news APIs
    // For now, return mock data structure
    return [];
  }

  /**
   * Scrape news from NEPSE
   */
  async scrapeNEPSENews() {
    try {
      const response = await axios.get('https://www.nepalstock.com/api/notices', {
        timeout: 10000
      });
      
      return response.data.map(item => ({
        title: item.title || item.subject,
        summary: item.description || '',
        source: 'NEPSE',
        url: `https://www.nepalstock.com/notices/${item.id}`,
        publishedAt: new Date(item.postedDate || item.createdDate),
        type: 'market'
      }));
    } catch (error) {
      console.error('Error scraping NEPSE:', error.message);
      return [];
    }
  }

  // ============================================
  // NAMED ENTITY RECOGNITION
  // ============================================

  /**
   * Extract companies mentioned in text
   */
  extractCompanies(text) {
    const companies = new Set();
    const textLower = text.toLowerCase();
    
    // Check for company symbols
    for (const [symbol, name] of Object.entries(this.companyPatterns.symbols)) {
      const symbolRegex = new RegExp(`\\b${symbol}\\b`, 'gi');
      if (symbolRegex.test(text)) {
        companies.add({ symbol, name, type: 'symbol' });
      }
    }
    
    // Check for company names
    for (const [name, data] of Object.entries(this.companyPatterns.names)) {
      const nameRegex = new RegExp(`\\b${name}\\b`, 'gi');
      if (nameRegex.test(text)) {
        companies.add({ symbol: data.symbol, name, type: 'name' });
      }
    }
    
    return Array.from(companies);
  }

  /**
   * Extract financial metrics from text
   */
  extractMetrics(text) {
    const metrics = {};
    
    // Revenue patterns
    const revenueMatch = text.match(/revenue[:\s]*Rs\.?\s*([\d,]+(?:\.\d+)?)\s*(?:million|billion|crore)?/i);
    if (revenueMatch) {
      metrics.revenue = this.parseAmount(revenueMatch[1], revenueMatch[2]);
    }
    
    // Profit patterns
    const profitMatch = text.match(/profit[:\s]*Rs\.?\s*([\d,]+(?:\.\d+)?)\s*(?:million|billion|crore)?/i);
    if (profitMatch) {
      metrics.profit = this.parseAmount(profitMatch[1], profitMatch[2]);
    }
    
    // EPS patterns
    const epsMatch = text.match(/EPS[:\s]*Rs\.?\s*([\d,]+(?:\.\d+)?)/i);
    if (epsMatch) {
      metrics.eps = parseFloat(epsMatch[1]);
    }
    
    // P/E ratio
    const peMatch = text.match(/P\/E[:\s]*([\d,]+(?:\.\d+)?)/i);
    if (peMatch) {
      metrics.peRatio = parseFloat(peMatch[1]);
    }
    
    return metrics;
  }

  /**
   * Extract sectors from text
   */
  extractSectors(text) {
    const sectors = [];
    const textLower = text.toLowerCase();
    
    for (const [sector, keywords] of Object.entries(this.sectorKeywords)) {
      for (const keyword of keywords) {
        if (textLower.includes(keyword.toLowerCase())) {
          if (!sectors.includes(sector)) {
            sectors.push(sector);
          }
          break;
        }
      }
    }
    
    return sectors;
  }

  /**
   * Parse amount with multipliers
   */
  parseAmount(value, multiplier) {
    const num = parseFloat(value.replace(/,/g, ''));
    const mult = multiplier?.toLowerCase();
    
    if (mult === 'million' || mult === 'crore') return num * 10000000;
    if (mult === 'billion') return num * 1000000000;
    return num;
  }

  // ============================================
  // SENTIMENT ANALYSIS
  // ============================================

  /**
   * Analyze sentiment of text
   */
  analyzeSentiment(text) {
    const tokens = this.tokenize(text);
    const scores = this.calculateSentimentScores(tokens);
    
    // Determine sentiment
    let sentiment = 'NEUTRAL';
    let confidence = 0;
    
    if (scores.positive > scores.negative) {
      sentiment = 'POSITIVE';
      confidence = Math.min(scores.positive / (scores.positive + scores.negative + 1), 1);
    } else if (scores.negative > scores.positive) {
      sentiment = 'NEGATIVE';
      confidence = Math.min(scores.negative / (scores.positive + scores.negative + 1), 1);
    }
    
    // Detect intensity
    const intensity = this.detectIntensity(tokens);
    
    return {
      sentiment,
      confidence: Math.round(confidence * 100) / 100,
      intensity,
      scores,
      keywords: this.extractSentimentKeywords(tokens)
    };
  }

  /**
   * Calculate sentiment scores
   */
  calculateSentimentScores(tokens) {
    let positive = 0;
    let negative = 0;
    let neutral = 0;
    
    const bigrams = this.getBigrams(tokens);
    
    tokens.forEach(token => {
      const lower = token.toLowerCase();
      if (this.sentimentLexicon.positive[lower]) {
        positive += this.sentimentLexicon.positive[lower];
      } else if (this.sentimentLexicon.negative[lower]) {
        negative += Math.abs(this.sentimentLexicon.negative[lower]);
      } else {
        neutral += 0.1;
      }
    });
    
    // Check bigrams
    bigrams.forEach(bigram => {
      const key = bigram.join(' ');
      if (this.sentimentLexicon.positiveBigrams[key]) {
        positive += this.sentimentLexicon.positiveBigrams[key];
      } else if (this.sentimentLexicon.negativeBigrams[key]) {
        negative += Math.abs(this.sentimentLexicon.negativeBigrams[key]);
      }
    });
    
    return { positive, negative, neutral };
  }

  /**
   * Detect sentiment intensity
   */
  detectIntensity(tokens) {
    const intensifiers = ['very', 'extremely', 'significantly', 'strongly', 'massive', 'huge'];
    const downtoners = ['slightly', 'somewhat', 'marginally', 'slightly', 'barely'];
    
    let intensifierCount = 0;
    let downtonerCount = 0;
    
    tokens.forEach(token => {
      if (intensifiers.includes(token.toLowerCase())) intensifierCount++;
      if (downtoners.includes(token.toLowerCase())) downtonerCount++;
    });
    
    if (intensifierCount > downtonerCount) return 'HIGH';
    if (downtonerCount > intensifierCount) return 'LOW';
    return 'MEDIUM';
  }

  /**
   * Extract sentiment keywords
   */
  extractSentimentKeywords(tokens) {
    const positive = [];
    const negative = [];
    
    tokens.forEach(token => {
      const lower = token.toLowerCase();
      if (this.sentimentLexicon.positive[lower]) {
        positive.push({ word: token, score: this.sentimentLexicon.positive[lower] });
      }
      if (this.sentimentLexicon.negative[lower]) {
        negative.push({ word: token, score: this.sentimentLexicon.negative[lower] });
      }
    });
    
    return { positive: positive.slice(0, 10), negative: negative.slice(0, 10) };
  }

  /**
   * Tokenize text
   */
  tokenize(text) {
    return text
      .replace(/[^\w\s'-]/g, ' ')
      .split(/\s+/)
      .filter(token => token.length > 0);
  }

  /**
   * Get bigrams from tokens
   */
  getBigrams(tokens) {
    const bigrams = [];
    for (let i = 0; i < tokens.length - 1; i++) {
      bigrams.push([tokens[i], tokens[i + 1]]);
    }
    return bigrams;
  }

  // ============================================
  // MARKET SENTIMENT INDICATORS
  // ============================================

  /**
   * Calculate market sentiment from news
   */
  calculateMarketSentiment(news) {
    if (!news || news.length === 0) {
      return { sentiment: 'NEUTRAL', confidence: 0, score: 0 };
    }
    
    let totalScore = 0;
    let positiveCount = 0;
    let negativeCount = 0;
    let neutralCount = 0;
    
    const bySource = {};
    const bySector = {};
    
    news.forEach(article => {
      const sentiment = this.analyzeSentiment(article.title + ' ' + (article.summary || ''));
      
      // Weight by recency
      const hoursOld = (Date.now() - new Date(article.publishedAt).getTime()) / (1000 * 60 * 60);
      const recencyWeight = Math.max(0.5, 1 - (hoursOld / 72)); // Decay over 3 days
      
      const weightedScore = (sentiment.confidence * (sentiment.sentiment === 'POSITIVE' ? 1 : -1)) * recencyWeight;
      totalScore += weightedScore;
      
      if (sentiment.sentiment === 'POSITIVE') positiveCount++;
      else if (sentiment.sentiment === 'NEGATIVE') negativeCount++;
      else neutralCount++;
      
      // Group by source
      const source = article.source || 'unknown';
      if (!bySource[source]) bySource[source] = { positive: 0, negative: 0, total: 0 };
      bySource[source].total++;
      if (sentiment.sentiment === 'POSITIVE') bySource[source].positive++;
      else if (sentiment.sentiment === 'NEGATIVE') bySource[source].negative++;
      
      // Group by sector
      const sectors = this.extractSectors(article.title + ' ' + (article.summary || ''));
      sectors.forEach(sector => {
        if (!bySector[sector]) bySector[sector] = { positive: 0, negative: 0, total: 0 };
        bySector[sector].total++;
        if (sentiment.sentiment === 'POSITIVE') bySector[sector].positive++;
        else if (sentiment.sentiment === 'NEGATIVE') bySector[sector].negative++;
      });
    });
    
    // Normalize score to -1 to 1
    const normalizedScore = Math.max(-1, Math.min(1, totalScore / news.length));
    
    let sentiment = 'NEUTRAL';
    if (normalizedScore > 0.2) sentiment = 'POSITIVE';
    else if (normalizedScore < -0.2) sentiment = 'NEGATIVE';
    
    return {
      sentiment,
      score: Math.round(normalizedScore * 100) / 100,
      confidence: Math.round((1 - Math.abs(normalizedScore)) * 100) / 100,
      articleCount: news.length,
      breakdown: {
        positive: positiveCount,
        negative: negativeCount,
        neutral: neutralCount
      },
      bySource,
      bySector
    };
  }

  /**
   * Generate sector sentiment
   */
  generateSectorSentiment(sectors) {
    return Object.entries(sectors).map(([sector, data]) => ({
      sector,
      sentiment: data.positive > data.negative ? 'POSITIVE' : 
                 data.negative > data.positive ? 'NEGATIVE' : 'NEUTRAL',
      score: data.total > 0 ? (data.positive - data.negative) / data.total : 0,
      positive: data.positive,
      negative: data.negative,
      total: data.total
    }));
  }

  // ============================================
  // FULL ANALYSIS PIPELINE
  // ============================================

  /**
   * Process news article
   */
  async processArticle(article) {
    const text = article.title + ' ' + (article.summary || '');
    
    // Extract entities
    const companies = this.extractCompanies(text);
    const sectors = this.extractSectors(text);
    const metrics = this.extractMetrics(text);
    
    // Analyze sentiment
    const sentiment = this.analyzeSentiment(text);
    
    return {
      ...article,
      extracted: {
        companies,
        sectors,
        metrics
      },
      sentiment
    };
  }

  /**
   * Process multiple articles
   */
  async processNews(news) {
    const processed = await Promise.all(news.map(article => this.processArticle(article)));
    
    // Calculate overall market sentiment
    const marketSentiment = this.calculateMarketSentiment(news);
    
    // Generate sector sentiments
    const sectorSentiments = this.generateSectorSentiment(marketSentiment.bySector);
    
    // Get top mentioned companies
    const companyMentions = this.aggregateCompanyMentions(processed);
    
    return {
      marketSentiment,
      sectorSentiments,
      articles: processed,
      summary: {
        totalArticles: processed.length,
        positiveArticles: processed.filter(a => a.sentiment.sentiment === 'POSITIVE').length,
        negativeArticles: processed.filter(a => a.sentiment.sentiment === 'NEGATIVE').length,
        topCompanies: companyMentions.slice(0, 10)
      }
    };
  }

  /**
   * Aggregate company mentions
   */
  aggregateCompanyMentions(articles) {
    const mentions = {};
    
    articles.forEach(article => {
      article.extracted.companies.forEach(company => {
        if (!mentions[company.symbol]) {
          mentions[company.symbol] = {
            symbol: company.symbol,
            name: company.name,
            count: 0,
            sentiment: { positive: 0, negative: 0 }
          };
        }
        mentions[company.symbol].count++;
        
        if (article.sentiment.sentiment === 'POSITIVE') {
          mentions[company.symbol].sentiment.positive++;
        } else if (article.sentiment.sentiment === 'NEGATIVE') {
          mentions[company.symbol].sentiment.negative++;
        }
      });
    });
    
    return Object.values(mentions).sort((a, b) => b.count - a.count);
  }

  // ============================================
  // DATA LOADERS
  // ============================================

  loadCompanyPatterns() {
    return {
      symbols: {
        'NABIL': 'Nabil Bank',
        'NICA': 'Nic Asia Bank',
        'SCB': 'Standard Chartered Bank',
        'MBL': 'Machhapuchhre Bank',
        'KBL': 'Karnali Development Bank',
        'NMB': 'NMB Bank',
        'BOK': 'Bank of Kathmandu',
        'SBI': 'SBI Bank',
        'PRVU': 'Prabhu Bank',
        'CCBL': 'Capital Crest Bank'
      },
      names: {
        'Nabil Bank': { symbol: 'NABIL' },
        'Nic Asia': { symbol: 'NICA' },
        'Standard Chartered': { symbol: 'SCB' },
        'Machhapuchhre Bank': { symbol: 'MBL' },
        'Karnali Development Bank': { symbol: 'KBL' },
        'NMB Bank': { symbol: 'NMB' },
        'Bank of Kathmandu': { symbol: 'BOK' },
        'Prabhu Bank': { symbol: 'PRVU' }
      }
    };
  }

  loadSentimentLexicon() {
    return {
      positive: {
        'gain': 0.5, 'gains': 0.5, 'profit': 0.7, 'profits': 0.7,
        'growth': 0.8, 'increase': 0.6, 'increased': 0.6, 'rise': 0.5,
        'surge': 0.9, 'soar': 0.9, 'jump': 0.6, 'rally': 0.7,
        'bullish': 0.8, 'positive': 0.7, 'optimistic': 0.7,
        'strong': 0.6, 'strength': 0.6, 'solid': 0.5, 'stable': 0.4,
        'success': 0.8, 'successful': 0.8, 'achievement': 0.7,
        'recommend': 0.6, 'upgrade': 0.7, 'outperform': 0.8,
        'dividend': 0.5, 'bonus': 0.5, 'dividends': 0.5
      },
      negative: {
        'loss': -0.7, 'losses': -0.7, 'decline': -0.6, 'decreased': -0.6,
        'drop': -0.5, 'fell': -0.5, 'fall': -0.5, 'falling': -0.6,
        'crash': -0.9, 'crisis': -0.8, 'plunge': -0.8, 'sink': -0.7,
        'bearish': -0.7, 'negative': -0.6, 'pessimistic': -0.6,
        'weak': -0.5, 'weakness': -0.5, 'struggle': -0.6,
        'fail': -0.7, 'failure': -0.7, 'trouble': -0.5,
        'downgrade': -0.7, 'underperform': -0.6, 'risk': -0.4,
        'concern': -0.4, 'worry': -0.4, 'uncertain': -0.3
      },
      positiveBigrams: {
        'profit growth': 1.0, 'strong growth': 1.0, 'solid performance': 0.9,
        'dividend announcement': 0.8, 'beat expectations': 0.9
      },
      negativeBigrams: {
        'profit loss': -0.9, 'heavy losses': -1.0, 'sharp decline': -0.9,
        'miss expectations': -0.8, 'credit downgrade': -0.9
      }
    };
  }

  loadSectorKeywords() {
    return {
      'BANKING': ['bank', 'banking', 'lending', 'credit', 'loan', 'deposit', 'npl'],
      'HYDRO': ['hydropower', 'hydro', 'electricity', 'energy', 'dam', 'power'],
      'INSURANCE': ['insurance', 'premium', 'claim', 'coverage', 'underwriting'],
      'MUTUAL_FUND': ['mutual fund', 'scheme', 'nav', 'unit', 'aum'],
      'HOTEL': ['hotel', 'tourism', 'hospitality', 'resort'],
      'MANUFACTURING': ['manufacturing', 'production', 'factory', 'output'],
      'FINANCE': ['finance', 'financial', 'investment', 'capital'],
      'TELECOM': ['telecom', 'telecommunication', 'mobile', 'internet']
    };
  }
}

module.exports = FinancialNewsNLP;
