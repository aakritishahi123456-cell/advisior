/**
 * FinSathi AI - News Intelligence Routes
 * API endpoints for news analysis and sentiment
 */

const express = require('express');
const FinancialNewsNLP = require('../services/financialNewsNLP');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const nlp = new FinancialNewsNLP();

/**
 * GET /api/v1/news/sentiment
 * Get overall market sentiment from latest news
 * Requires authentication
 */
router.get('/sentiment', authMiddleware, async (req, res) => {
  try {
    const { limit = 50, sources } = req.query;
    
    // Collect news
    const news = await nlp.collectNews({
      limit: parseInt(limit),
      sources: sources ? sources.split(',') : ['nepse', 'news']
    });
    
    if (news.length === 0) {
      return res.json({
        success: true,
        data: {
          sentiment: 'NEUTRAL',
          score: 0,
          message: 'No news available'
        }
      });
    }
    
    // Process news and calculate sentiment
    const result = await nlp.processNews(news);
    
    res.json({
      success: true,
      data: result.marketSentiment
    });
  } catch (error) {
    console.error('Sentiment error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze sentiment'
    });
  }
});

/**
 * GET /api/v1/news/sector-sentiment
 * Get sentiment by sector
 * Requires authentication
 */
router.get('/sector-sentiment', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const news = await nlp.collectNews({ limit: parseInt(limit) });
    
    if (news.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const result = await nlp.processNews(news);
    
    res.json({
      success: true,
      data: result.sectorSentiments
    });
  } catch (error) {
    console.error('Sector sentiment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze sector sentiment'
    });
  }
});

/**
 * GET /api/v1/news/company/:symbol
 * Get news and sentiment for specific company
 * Requires authentication
 */
router.get('/company/:symbol', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { limit = 20 } = req.query;
    
    // Get company-specific news (would filter in production)
    const news = await nlp.collectNews({ limit: parseInt(limit) });
    
    // Filter for company mentions
    const companyNews = news.filter(article => {
      const text = (article.title + ' ' + (article.summary || '')).toLowerCase();
      return text.includes(symbol.toLowerCase());
    });
    
    if (companyNews.length === 0) {
      return res.json({
        success: true,
        data: {
          symbol,
          sentiment: 'NEUTRAL',
          score: 0,
          articleCount: 0,
          message: 'No news found for this company'
        }
      });
    }
    
    const processed = await Promise.all(companyNews.map(a => nlp.processArticle(a)));
    
    // Calculate company-specific sentiment
    let positive = 0, negative = 0, score = 0;
    processed.forEach(article => {
      if (article.sentiment.sentiment === 'POSITIVE') positive++;
      else if (article.sentiment.sentiment === 'NEGATIVE') negative++;
      score += article.sentiment.sentiment === 'POSITIVE' ? 1 : 
               article.sentiment.sentiment === 'NEGATIVE' ? -1 : 0;
    });
    
    res.json({
      success: true,
      data: {
        symbol,
        sentiment: positive > negative ? 'POSITIVE' : negative > positive ? 'NEGATIVE' : 'NEUTRAL',
        score: score / processed.length,
        articleCount: processed.length,
        articles: processed.map(a => ({
          title: a.title,
          publishedAt: a.publishedAt,
          sentiment: a.sentiment.sentiment,
          confidence: a.sentiment.confidence
        }))
      }
    });
  } catch (error) {
    console.error('Company news error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get company news'
    });
  }
});

/**
 * GET /api/v1/news/latest
 * Get latest news with analysis
 * Requires authentication
 */
router.get('/latest', authMiddleware, async (req, res) => {
  try {
    const { limit = 20 } = req.query;
    
    const news = await nlp.collectNews({ limit: parseInt(limit) });
    
    if (news.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const processed = await Promise.all(news.map(a => nlp.processArticle(a)));
    
    res.json({
      success: true,
      data: processed.map(article => ({
        title: article.title,
        summary: article.summary,
        source: article.source,
        publishedAt: article.publishedAt,
        sentiment: article.sentiment.sentiment,
        confidence: article.sentiment.confidence,
        companies: article.extracted.companies,
        sectors: article.extracted.sectors
      }))
    });
  } catch (error) {
    console.error('Latest news error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get latest news'
    });
  }
});

/**
 * POST /api/v1/news/analyze
 * Analyze custom text
 * Requires authentication
 */
router.post('/analyze', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text) {
      return res.status(400).json({
        success: false,
        error: 'text is required'
      });
    }
    
    // Extract entities
    const companies = nlp.extractCompanies(text);
    const sectors = nlp.extractSectors(text);
    const metrics = nlp.extractMetrics(text);
    
    // Analyze sentiment
    const sentiment = nlp.analyzeSentiment(text);
    
    res.json({
      success: true,
      data: {
        text: text.substring(0, 500) + (text.length > 500 ? '...' : ''),
        extracted: {
          companies,
          sectors,
          metrics
        },
        sentiment
      }
    });
  } catch (error) {
    console.error('Analyze error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze text'
    });
  }
});

/**
 * GET /api/v1/news/companies/mentioned
 * Get most mentioned companies in news
 * Requires authentication
 */
router.get('/companies/mentioned', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const news = await nlp.collectNews({ limit: 50 });
    const processed = await nlp.processNews(news);
    
    const topCompanies = processed.summary.topCompanies.slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: topCompanies.map(c => ({
        symbol: c.symbol,
        name: c.name,
        mentionCount: c.count,
        sentiment: c.sentiment.positive > c.sentiment.negative ? 'POSITIVE' :
                   c.sentiment.negative > c.sentiment.positive ? 'NEGATIVE' : 'NEUTRAL'
      }))
    });
  } catch (error) {
    console.error('Companies error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get mentioned companies'
    });
  }
});

/**
 * GET /api/v1/news/sources
 * Get news sources with sentiment breakdown
 * Requires authentication
 */
router.get('/sources', authMiddleware, async (req, res) => {
  try {
    const { limit = 50 } = req.query;
    
    const news = await nlp.collectNews({ limit: parseInt(limit) });
    
    if (news.length === 0) {
      return res.json({
        success: true,
        data: []
      });
    }
    
    const result = await nlp.processNews(news);
    
    const sources = Object.entries(result.marketSentiment.bySource).map(([source, data]) => ({
      source,
      totalArticles: data.total,
      positive: data.positive,
      negative: data.negative,
      sentiment: data.positive > data.negative ? 'POSITIVE' : 
                 data.negative > data.positive ? 'NEGATIVE' : 'NEUTRAL'
    }));
    
    res.json({
      success: true,
      data: sources
    });
  } catch (error) {
    console.error('Sources error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get sources'
    });
  }
});

/**
 * GET /api/v1/news/alerts
 * Get breaking news with high impact
 * Requires authentication
 */
router.get('/alerts', authMiddleware, async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    
    const news = await nlp.collectNews({ limit: 50 });
    const processed = await Promise.all(news.map(a => nlp.processArticle(a)));
    
    // Filter for high-impact news
    const alerts = processed
      .filter(a => a.sentiment.confidence > 0.6 || a.extracted.companies.length > 0)
      .sort((a, b) => b.sentiment.confidence - a.sentiment.confidence)
      .slice(0, parseInt(limit));
    
    res.json({
      success: true,
      data: alerts.map(alert => ({
        title: alert.title,
        summary: alert.summary,
        source: alert.source,
        publishedAt: alert.publishedAt,
        sentiment: alert.sentiment.sentiment,
        confidence: alert.sentiment.confidence,
        companies: alert.extracted.companies,
        alertReason: alert.sentiment.confidence > 0.8 ? 'HIGH_SENTIMENT' : 'COMPANY_MENTION'
      }))
    });
  } catch (error) {
    console.error('Alerts error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get alerts'
    });
  }
});

module.exports = router;
