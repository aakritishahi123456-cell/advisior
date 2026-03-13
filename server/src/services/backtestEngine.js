/**
 * FinSathi AI - Backtesting Engine
 * Strategy simulation on historical NEPSE data
 */

const { PrismaClient } = require('@prisma/client');

class BacktestEngine {
  constructor() {
    this.prisma = new PrismaClient();
    this.results = [];
  }

  // ============================================
  // BACKTEST EXECUTION
  // ============================================

  /**
   * Run backtest for a strategy
   */
  async runBacktest(config) {
    const {
      symbol,
      startDate,
      endDate,
      initialCapital = 100000,
      strategy,
      parameters = {}
    } = config;

    // Get historical data
    const prices = await this.getHistoricalPrices(symbol, startDate, endDate);
    
    if (prices.length < 30) {
      throw new Error('Insufficient historical data');
    }

    // Initialize portfolio
    const portfolio = {
      cash: initialCapital,
      holdings: 0,
      trades: [],
      equity: [],
      capital: initialCapital
    };

    // Run simulation
    const signals = this.generateSignals(strategy, prices, parameters);
    
    for (let i = 1; i < prices.length; i++) {
      const currentPrice = prices[i];
      const prevPrice = prices[i - 1];
      const signal = signals[i] || 'HOLD';
      const date = currentPrice.date;

      // Execute trades based on signal
      if (signal === 'BUY' && portfolio.cash > currentPrice.close) {
        const shares = Math.floor(portfolio.cash / currentPrice.close);
        const cost = shares * currentPrice.close;
        
        if (shares > 0) {
          portfolio.holdings += shares;
          portfolio.cash -= cost;
          portfolio.trades.push({
            date,
            type: 'BUY',
            price: currentPrice.close,
            shares,
            value: cost,
            reason: signal
          });
        }
      } else if (signal === 'SELL' && portfolio.holdings > 0) {
        const proceeds = portfolio.holdings * currentPrice.close;
        
        portfolio.trades.push({
          date,
          type: 'SELL',
          price: currentPrice.close,
          shares: portfolio.holdings,
          value: proceeds,
          reason: signal
        });
        
        portfolio.cash += proceeds;
        portfolio.holdings = 0;
      }

      // Calculate daily equity
      const equity = portfolio.cash + (portfolio.holdings * currentPrice.close);
      portfolio.equity.push({
        date,
        equity,
        holdings: portfolio.holdings,
        cash: portfolio.cash,
        price: currentPrice.close
      });
    }

    // Calculate final results
    const results = this.calculateResults(portfolio, prices, initialCapital);
    
    return {
      symbol,
      period: { startDate, endDate },
      strategy: { type: strategy, parameters },
      initialCapital,
      results
    };
  }

  /**
   * Run backtest for multiple symbols
   */
  async runPortfolioBacktest(config) {
    const {
      symbols,
      startDate,
      endDate,
      initialCapital = 100000,
      strategy,
      parameters = {},
      allocation = 'equal' // equal, weighted, risk_parity
    } = config;

    const capitalPerSymbol = initialCapital / symbols.length;
    const results = [];

    for (const symbol of symbols) {
      try {
        const result = await this.runBacktest({
          symbol,
          startDate,
          endDate,
          initialCapital: capitalPerSymbol,
          strategy,
          parameters
        });
        results.push(result);
      } catch (error) {
        console.error(`Backtest failed for ${symbol}:`, error.message);
      }
    }

    // Combine results
    return this.combinePortfolioResults(results, initialCapital);
  }

  // ============================================
  // STRATEGY IMPLEMENTATIONS
  // ============================================

  /**
   * Generate trading signals based on strategy
   */
  generateSignals(strategy, prices, parameters) {
    switch (strategy) {
      case 'SMA_CROSSOVER':
        return this.smaCrossoverStrategy(prices, parameters.shortPeriod || 20, parameters.longPeriod || 50);
      case 'RSI':
        return this.rsiStrategy(prices, parameters.period || 14, parameters.oversold || 30, parameters.overbought || 70);
      case 'MACD':
        return this.macdStrategy(prices, parameters.fast || 12, parameters.slow || 26, parameters.signal || 9);
      case 'MOMENTUM':
        return this.momentumStrategy(prices, parameters.period || 10, parameters.threshold || 0.02);
      case 'MEAN_REVERSION':
        return this.meanReversionStrategy(prices, parameters.period || 20, parameters.stdDev || 2);
      case 'DOWNTURN':
        return this.downturnStrategy(prices, parameters.period || 5, parameters.threshold || -0.03);
      case 'BUY_AND_HOLD':
        return this.buyAndHoldStrategy(prices);
      case 'ANDOM':
        return this.randomStrategy(prices);
      default:
        return prices.map(() => 'HOLD');
    }
  }

  /**
   * SMA Crossover Strategy
   */
  smaCrossoverStrategy(prices, shortPeriod, longPeriod) {
    const signals = new Array(prices.length).fill('HOLD');
    const smaShort = this.calculateSMA(prices, shortPeriod);
    const smaLong = this.calculateSMA(prices, longPeriod);
    
    const offset = longPeriod - 1;
    
    for (let i = offset + 1; i < prices.length; i++) {
      const currentIdx = i - offset;
      const prevIdx = i - offset - 1;
      
      if (smaShort[currentIdx] > smaLong[currentIdx] && 
          smaShort[prevIdx] <= smaLong[prevIdx]) {
        signals[i] = 'BUY';
      } else if (smaShort[currentIdx] < smaLong[currentIdx] && 
                 smaShort[prevIdx] >= smaLong[prevIdx]) {
        signals[i] = 'SELL';
      }
    }
    
    return signals;
  }

  /**
   * RSI Strategy
   */
  rsiStrategy(prices, period, oversold, overbought) {
    const signals = new Array(prices.length).fill('HOLD');
    const rsi = this.calculateRSI(prices, period);
    
    const offset = period + 13; // RSI calculation offset
    
    for (let i = offset; i < prices.length; i++) {
      const rsiValue = rsi[i - offset];
      
      if (rsiValue < oversold) {
        signals[i] = 'BUY';
      } else if (rsiValue > overbought) {
        signals[i] = 'SELL';
      }
    }
    
    return signals;
  }

  /**
   * MACD Strategy
   */
  macdStrategy(prices, fast, slow, signal) {
    const signals = new Array(prices.length).fill('HOLD');
    const macd = this.calculateMACD(prices, fast, slow, signal);
    
    const offset = slow + signal + 8;
    
    for (let i = offset; i < macd.histogram.length; i++) {
      const histIdx = i - offset;
      
      if (macd.histogram[histIdx] > 0 && macd.histogram[histIdx - 1] <= 0) {
        signals[i + offset] = 'BUY';
      } else if (macd.histogram[histIdx] < 0 && macd.histogram[histIdx - 1] >= 0) {
        signals[i + offset] = 'SELL';
      }
    }
    
    return signals;
  }

  /**
   * Momentum Strategy
   */
  momentumStrategy(prices, period, threshold) {
    const signals = new Array(prices.length).fill('HOLD');
    
    for (let i = period; i < prices.length; i++) {
      const currentPrice = prices[i].close;
      const pastPrice = prices[i - period].close;
      const momentum = (currentPrice - pastPrice) / pastPrice;
      
      if (momentum > threshold) {
        signals[i] = 'BUY';
      } else if (momentum < -threshold) {
        signals[i] = 'SELL';
      }
    }
    
    return signals;
  }

  /**
   * Mean Reversion Strategy
   */
  meanReversionStrategy(prices, period, stdDev) {
    const signals = new Array(prices.length).fill('HOLD');
    
    for (let i = period; i < prices.length; i++) {
      const slice = prices.slice(i - period, i).map(p => p.close);
      const mean = slice.reduce((a, b) => a + b, 0) / slice.length;
      const std = Math.sqrt(slice.reduce((sum, p) => sum + Math.pow(p - mean, 2), 0) / slice.length);
      const currentPrice = prices[i].close;
      
      if (currentPrice < mean - stdDev * std) {
        signals[i] = 'BUY';
      } else if (currentPrice > mean + stdDev * std) {
        signals[i] = 'SELL';
      }
    }
    
    return signals;
  }

  /**
   * Downturn Protection Strategy
   */
  downturnStrategy(prices, period, threshold) {
    const signals = new Array(prices.length).fill('HOLD');
    
    for (let i = period; i < prices.length; i++) {
      const slice = prices.slice(i - period, i);
      const change = (slice[i - 1].close - slice[0].close) / slice[0].close;
      
      if (change < threshold) {
        signals[i] = 'SELL';
      } else if (change > 0) {
        signals[i] = 'BUY';
      }
    }
    
    return signals;
  }

  /**
   * Buy and Hold Strategy
   */
  buyAndHoldStrategy(prices) {
    const signals = new Array(prices.length).fill('HOLD');
    signals[30] = 'BUY'; // Buy after 30 days
    return signals;
  }

  /**
   * Random Strategy (for comparison)
   */
  randomStrategy(prices) {
    const signals = new Array(prices.length).fill('HOLD');
    for (let i = 30; i < prices.length; i++) {
      const rand = Math.random();
      if (rand < 0.1) signals[i] = 'SELL';
      else if (rand < 0.2) signals[i] = 'BUY';
    }
    return signals;
  }

  // ============================================
  // TECHNICAL INDICATORS
  // ============================================

  calculateSMA(prices, period) {
    const sma = [];
    for (let i = period - 1; i < prices.length; i++) {
      const sum = prices.slice(i - period + 1, i + 1).reduce((a, b) => a + b.close, 0);
      sma.push(sum / period);
    }
    return sma;
  }

  calculateRSI(prices, period) {
    const rsi = [];
    const gains = [];
    const losses = [];

    for (let i = 1; i < prices.length; i++) {
      const change = prices[i].close - prices[i - 1].close;
      gains.push(change > 0 ? change : 0);
      losses.push(change < 0 ? Math.abs(change) : 0);
    }

    for (let i = period; i < gains.length; i++) {
      const avgGain = gains.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      const avgLoss = losses.slice(i - period, i).reduce((a, b) => a + b, 0) / period;
      
      if (avgLoss === 0) {
        rsi.push(100);
      } else {
        const rs = avgGain / avgLoss;
        rsi.push(100 - (100 / (1 + rs)));
      }
    }

    return rsi;
  }

  calculateMACD(prices, fast, slow, signal) {
    const emaFast = this.calculateEMA(prices, fast);
    const emaSlow = this.calculateEMA(prices, slow);
    
    const macdLine = emaFast.map((v, i) => v - emaSlow[i]);
    const signalLine = this.calculateSignalLine(macdLine, signal);
    
    return {
      macd: macdLine.slice(signal),
      signal: signalLine,
      histogram: macdLine.slice(signal).map((m, i) => m - signalLine[i])
    };
  }

  calculateEMA(prices, period) {
    const multiplier = 2 / (period + 1);
    const ema = [];
    let prevEma = prices.slice(0, period).reduce((a, b) => a + b.close, 0) / period;
    
    ema.push(...new Array(period - 1).fill(null));
    ema.push(prevEma);
    
    for (let i = period; i < prices.length; prevEma, i++) {
      const currentEma = (prices[i].close - prevEma) * multiplier + prevEma;
      ema.push(currentEma);
      prevEma = currentEma;
    }
    
    return ema;
  }

  calculateSignalLine(macdLine, period) {
    const signal = [];
    const multiplier = 2 / (period + 1);
    
    let prevSignal = macdLine.slice(0, period).reduce((a, b) => a + b, 0) / period;
    signal.push(...new Array(period).fill(null));
    signal.push(prevSignal);
    
    for (let i = period; i < macdLine.length; i++) {
      const currentSignal = (macdLine[i] - prevSignal) * multiplier + prevSignal;
      signal.push(currentSignal);
      prevSignal = currentSignal;
    }
    
    return signal;
  }

  // ============================================
  // RESULTS CALCULATION
  // ============================================

  calculateResults(portfolio, prices, initialCapital) {
    const finalEquity = portfolio.cash + (portfolio.holdings * prices[prices.length - 1].close);
    const totalReturn = ((finalEquity - initialCapital) / initialCapital) * 100;
    
    // Calculate daily returns
    const dailyReturns = [];
    for (let i = 1; i < portfolio.equity.length; i++) {
      const dailyReturn = (portfolio.equity[i].equity - portfolio.equity[i - 1].equity) / portfolio.equity[i - 1].equity;
      dailyReturns.push(dailyReturn);
    }

    // Calculate metrics
    const totalTrades = portfolio.trades.length;
    const buyTrades = portfolio.trades.filter(t => t.type === 'BUY').length;
    const sellTrades = portfolio.trades.filter(t => t.type === 'SELL').length;
    
    // Calculate win rate
    let wins = 0;
    let losses = 0;
    let totalProfit = 0;
    let totalLoss = 0;
    
    const completedTrades = this.getCompletedTrades(portfolio.trades);
    completedTrades.forEach(trade => {
      if (trade.profit > 0) {
        wins++;
        totalProfit += trade.profit;
      } else {
        losses++;
        totalLoss += Math.abs(trade.profit);
      }
    });
    
    const winRate = completedTrades.length > 0 ? (wins / completedTrades.length) * 100 : 0;
    const avgWin = wins > 0 ? totalProfit / wins : 0;
    const avgLoss = losses > 0 ? totalLoss / losses : 0;
    const profitFactor = totalLoss > 0 ? totalProfit / totalLoss : 0;

    // Risk metrics
    const avgDailyReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length;
    const stdDailyReturn = Math.sqrt(
      dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length
    );
    
    const annualReturn = avgDailyReturn * 252 * 100;
    const annualVolatility = stdDailyReturn * Math.sqrt(252) * 100;
    const sharpeRatio = annualVolatility > 0 ? (annualReturn - 5) / annualVolatility : 0; // Assuming 5% risk-free rate
    
    // Max drawdown
    let maxEquity = 0;
    let maxDrawdown = 0;
    portfolio.equity.forEach(e => {
      if (e.equity > maxEquity) maxEquity = e.equity;
      const drawdown = (maxEquity - e.equity) / maxEquity;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    });

    // Sortino ratio
    const negativeReturns = dailyReturns.filter(r => r < 0);
    const downsideDeviation = Math.sqrt(
      negativeReturns.reduce((sum, r) => sum + Math.pow(r, 2), 0) / negativeReturns.length
    ) * Math.sqrt(252);
    const sortinoRatio = downsideDeviation > 0 ? (annualReturn - 5) / downsideDeviation : 0;

    // Calmar ratio
    const years = (prices[prices.length - 1].date - prices[0].date) / (365 * 24 * 60 * 60 * 1000);
    const annualizedReturn = Math.pow(finalEquity / initialCapital, 1 / years) - 1;
    const calmarRatio = maxDrawdown > 0 ? annualizedReturn / maxDrawdown : 0;

    return {
      // Return metrics
      initialCapital,
      finalCapital: finalEquity,
      totalReturn,
      annualizedReturn: annualizedReturn * 100,
      
      // Trade metrics
      totalTrades,
      completedTrades: completedTrades.length,
      buyTrades,
      sellTrades,
      wins,
      losses,
      winRate,
      avgWin,
      avgLoss,
      profitFactor,
      
      // Risk metrics
      sharpeRatio,
      sortinoRatio,
      calmarRatio,
      maxDrawdown: maxDrawdown * 100,
      annualVolatility,
      
      // Trade details
      trades: portfolio.trades,
      equityCurve: portfolio.equity
    };
  }

  getCompletedTrades(trades) {
    const completed = [];
    let buyPrice = null;
    let buyShares = 0;
    
    trades.forEach(trade => {
      if (trade.type === 'BUY') {
        buyPrice = trade.price;
        buyShares = trade.shares;
      } else if (trade.type === 'SELL' && buyPrice) {
        const profit = (trade.price - buyPrice) * Math.min(buyShares, trade.shares);
        completed.push({
          buyPrice,
          sellPrice: trade.price,
          shares: Math.min(buyShares, trade.shares),
          profit,
          return: ((trade.price - buyPrice) / buyPrice) * 100
        });
        buyPrice = null;
        buyShares = 0;
      }
    });
    
    return completed;
  }

  combinePortfolioResults(results, totalCapital) {
    const totalReturn = results.reduce((sum, r) => sum + r.results.finalCapital, 0) - totalCapital;
    const totalTrades = results.reduce((sum, r) => sum + r.results.totalTrades, 0);
    const avgWinRate = results.reduce((sum, r) => sum + r.results.winRate, 0) / results.length;
    const avgSharpe = results.reduce((sum, r) => sum + r.results.sharpeRatio, 0) / results.length;
    const avgDrawdown = results.reduce((sum, r) => sum + r.results.maxDrawdown, 0) / results.length;
    
    return {
      portfolio: {
        initialCapital: totalCapital,
        finalCapital: results.reduce((sum, r) => sum + r.results.finalCapital, 0),
        totalReturn: (totalReturn / totalCapital) * 100
      },
      aggregateMetrics: {
        totalTrades,
        avgWinRate,
        avgSharpeRatio: avgSharpe,
        avgMaxDrawdown: avgDrawdown
      },
      individualResults: results
    };
  }

  // ============================================
  // DATA RETRIEVAL
  // ============================================

  async getHistoricalPrices(symbol, startDate, endDate) {
    const company = await this.prisma.company.findUnique({
      where: { symbol },
      include: {
        stockPrices: {
          where: {
            date: {
              gte: new Date(startDate),
              lte: new Date(endDate)
            }
          },
          orderBy: { date: 'asc' }
        }
      }
    });

    if (!company) {
      throw new Error(`Company ${symbol} not found`);
    }

    return company.stockPrices.map(p => ({
      date: p.date,
      open: parseFloat(p.open),
      high: parseFloat(p.high),
      low: parseFloat(p.low),
      close: parseFloat(p.close),
      volume: p.volume
    }));
  }
}

module.exports = BacktestEngine;
