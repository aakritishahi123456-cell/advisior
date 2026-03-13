/**
 * FinSathi AI - Backtest Routes
 * API endpoints for strategy backtesting
 */

const express = require('express');
const BacktestEngine = require('../services/backtestEngine');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const backtestEngine = new BacktestEngine();

/**
 * POST /api/v1/backtest
 * Run backtest for a single symbol
 * Requires authentication
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const {
      symbol,
      startDate,
      endDate,
      initialCapital,
      strategy,
      parameters
    } = req.body;

    // Validation
    if (!symbol || !startDate || !endDate || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'symbol, startDate, endDate, and strategy are required'
      });
    }

    const validStrategies = [
      'SMA_CROSSOVER', 'RSI', 'MACD', 'MOMENTUM',
      'MEAN_REVERSION', 'DOWNTURN', 'BUY_AND_HOLD', 'RANDOM'
    ];

    if (!validStrategies.includes(strategy)) {
      return res.status(400).json({
        success: false,
        error: `Invalid strategy. Valid options: ${validStrategies.join(', ')}`
      });
    }

    const result = await backtestEngine.runBacktest({
      symbol: symbol.toUpperCase(),
      startDate,
      endDate,
      initialCapital: initialCapital || 100000,
      strategy,
      parameters: parameters || {}
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Backtest error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run backtest'
    });
  }
});

/**
 * POST /api/v1/backtest/portfolio
 * Run portfolio backtest
 * Requires authentication
 */
router.post('/portfolio', authMiddleware, async (req, res) => {
  try {
    const {
      symbols,
      startDate,
      endDate,
      initialCapital,
      strategy,
      parameters,
      allocation
    } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'symbols array is required'
      });
    }

    if (!startDate || !endDate || !strategy) {
      return res.status(400).json({
        success: false,
        error: 'startDate, endDate, and strategy are required'
      });
    }

    const result = await backtestEngine.runPortfolioBacktest({
      symbols: symbols.map(s => s.toUpperCase()),
      startDate,
      endDate,
      initialCapital: initialCapital || 100000,
      strategy,
      parameters: parameters || {},
      allocation: allocation || 'equal'
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Portfolio backtest error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to run portfolio backtest'
    });
  }
});

/**
 * GET /api/v1/backtest/strategies
 * Get available strategies
 */
router.get('/strategies', (req, res) => {
  const strategies = [
    {
      name: 'SMA_CROSSOVER',
      description: 'Buy when short SMA crosses above long SMA, sell when it crosses below',
      parameters: [
        { name: 'shortPeriod', type: 'number', default: 20, description: 'Short SMA period' },
        { name: 'longPeriod', type: 'number', default: 50, description: 'Long SMA period' }
      ]
    },
    {
      name: 'RSI',
      description: 'Buy when RSI is oversold (<30), sell when overbought (>70)',
      parameters: [
        { name: 'period', type: 'number', default: 14, description: 'RSI period' },
        { name: 'oversold', type: 'number', default: 30, description: 'Oversold threshold' },
        { name: 'overbought', type: 'number', default: 70, description: 'Overbought threshold' }
      ]
    },
    {
      name: 'MACD',
      description: 'Buy when MACD crosses above signal, sell when it crosses below',
      parameters: [
        { name: 'fast', type: 'number', default: 12, description: 'Fast EMA period' },
        { name: 'slow', type: 'number', default: 26, description: 'Slow EMA period' },
        { name: 'signal', type: 'number', default: 9, description: 'Signal line period' }
      ]
    },
    {
      name: 'MOMENTUM',
      description: 'Buy when price momentum is positive above threshold',
      parameters: [
        { name: 'period', type: 'number', default: 10, description: 'Momentum period' },
        { name: 'threshold', type: 'number', default: 0.02, description: 'Momentum threshold' }
      ]
    },
    {
      name: 'MEAN_REVERSION',
      description: 'Buy when price is below mean, sell when above',
      parameters: [
        { name: 'period', type: 'number', default: 20, description: 'Mean calculation period' },
        { name: 'stdDev', type: 'number', default: 2, description: 'Standard deviations' }
      ]
    },
    {
      name: 'DOWNTURN',
      description: 'Sell when downturn detected, buy when recovery',
      parameters: [
        { name: 'period', type: 'number', default: 5, description: 'Lookback period' },
        { name: 'threshold', type: 'number', default: -0.03, description: 'Downturn threshold' }
      ]
    },
    {
      name: 'BUY_AND_HOLD',
      description: 'Buy once and hold for entire period',
      parameters: []
    },
    {
      name: 'RANDOM',
      description: 'Random trading for baseline comparison',
      parameters: []
    }
  ];

  res.json({
    success: true,
    data: strategies
  });
});

/**
 * GET /api/v1/backtest/:symbol/signals
 * Generate signals for a symbol without executing
 * Requires authentication
 */
router.get('/:symbol/signals', authMiddleware, async (req, res) => {
  try {
    const { symbol } = req.params;
    const { strategy, parameters, startDate, endDate } = req.query;

    if (!strategy) {
      return res.status(400).json({
        success: false,
        error: 'strategy parameter is required'
      });
    }

    // Get prices
    const prices = await backtestEngine.getHistoricalPrices(
      symbol.toUpperCase(),
      startDate || '2023-01-01',
      endDate || new Date().toISOString().split('T')[0]
    );

    const signals = backtestEngine.generateSignals(
      strategy,
      prices,
      parameters ? JSON.parse(parameters) : {}
    );

    // Count signals
    const signalCounts = {
      BUY: signals.filter(s => s === 'BUY').length,
      SELL: signals.filter(s => s === 'SELL').length,
      HOLD: signals.filter(s => s === 'HOLD').length
    };

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        strategy,
        totalSignals: signals.length,
        signalCounts,
        signals: signals.map((signal, i) => ({
          date: prices[i].date,
          price: prices[i].close,
          signal
        }))
      }
    });
  } catch (error) {
    console.error('Signal generation error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to generate signals'
    });
  }
});

/**
 * GET /api/v1/backtest/compare
 * Compare multiple strategies
 * Requires authentication
 */
router.get('/compare', authMiddleware, async (req, res) => {
  try {
    const { symbol, strategies, startDate, endDate, initialCapital } = req.query;

    if (!symbol || !strategies) {
      return res.status(400).json({
        success: false,
        error: 'symbol and strategies are required'
      });
    }

    const strategyList = strategies.split(',');
    const results = [];

    for (const strategy of strategyList) {
      try {
        const result = await backtestEngine.runBacktest({
          symbol: symbol.toUpperCase(),
          startDate,
          endDate,
          initialCapital: initialCapital || 100000,
          strategy: strategy.trim()
        });
        results.push({
          strategy: strategy.trim(),
          metrics: {
            totalReturn: result.results.totalReturn,
            sharpeRatio: result.results.sharpeRatio,
            maxDrawdown: result.results.maxDrawdown,
            winRate: result.results.winRate,
            totalTrades: result.results.totalTrades
          }
        });
      } catch (error) {
        results.push({
          strategy: strategy.trim(),
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      data: {
        symbol: symbol.toUpperCase(),
        period: { startDate, endDate },
        results
      }
    });
  } catch (error) {
    console.error('Compare error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to compare strategies'
    });
  }
});

module.exports = router;
