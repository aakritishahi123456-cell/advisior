/**
 * FinSathi AI - Trading Signal Generation Examples
 * Demonstrates buy/sell/hold signal generation with reasoning
 */

const TradingSignalGenerator = require('./tradingSignalGenerator');

// Initialize the signal generator
const signalGenerator = new TradingSignalGenerator();

// Sample stock data for demonstration
const sampleStockData = [
  {
    symbol: 'NABIL',
    priceData: {
      prices: [1200, 1210, 1205, 1220, 1230, 1225, 1240, 1250, 1245, 1260, 1270, 1265, 1280, 1290, 1285, 1300, 1310, 1305, 1320, 1330, 1325, 1340, 1350, 1345, 1360, 1370, 1365, 1380, 1390, 1385, 1400, 1410, 1405, 1420, 1430, 1425, 1440, 1450, 1445, 1460, 1470, 1465, 1480, 1490, 1485, 1500, 1510, 1505, 1520, 1530, 1525],
      volumes: [150000, 180000, 160000, 200000, 220000, 190000, 250000, 280000, 210000, 300000, 320000, 260000, 350000, 380000, 290000, 400000, 420000, 330000, 450000, 480000, 360000, 500000, 520000, 390000, 550000, 580000, 420000, 600000, 620000, 460000, 650000, 680000, 510000, 700000, 720000, 540000, 750000, 780000, 570000, 800000, 820000, 610000, 850000, 880000, 650000, 900000, 920000, 690000],
      dates: Array.from({length: 50}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (49 - i));
        return date.toISOString().split('T')[0];
      })
    },
    financialData: {
      peRatio: 18.5,
      pbRatio: 2.1,
      roe: 0.22,
      debtToEquity: 0.4,
      currentRatio: 2.3,
      revenueGrowth: 0.25,
      profitMargin: 0.18
    },
    healthScore: 85,
    technicalIndicators: {
      rsi: 45,
      macd: {
        macd: [1.2, 1.5, 1.8, 2.1],
        signal: [1.0, 1.2, 1.4, 1.6],
        histogram: [0.2, 0.3, 0.4, 0.5]
      },
      maCross: {
        shortMA: 1450,
        longMA: 1380,
        cross: 'golden'
      },
      bollinger: {
        position: 'above_upper'
      }
    },
    riskMetrics: {
      volatility: 0.22,
      beta: 1.1,
      maxDrawdown: -0.08,
      sharpeRatio: 1.8
    }
  },
  {
    symbol: 'NICA',
    priceData: {
      prices: [950, 945, 940, 935, 930, 925, 920, 915, 910, 905, 900, 895, 890, 885, 880, 875, 870, 865, 860, 855, 850, 845, 840, 835, 830, 825, 820, 815, 810, 805, 800, 795, 790, 785, 780, 775, 770, 765, 760, 755, 750, 745, 740, 735, 730, 725, 720, 715, 710],
      volumes: [120000, 130000, 125000, 140000, 150000, 135000, 160000, 170000, 145000, 180000, 190000, 165000, 200000, 210000, 185000, 220000, 230000, 205000, 240000, 250000, 225000, 260000, 270000, 245000, 280000, 290000, 265000, 300000, 310000, 285000, 320000, 330000, 305000, 340000, 350000, 325000, 360000, 370000, 345000, 380000, 390000, 365000, 400000, 410000, 385000, 420000, 430000, 405000],
      dates: Array.from({length: 50}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (49 - i));
        return date.toISOString().split('T')[0];
      })
    },
    financialData: {
      peRatio: 12.5,
      pbRatio: 1.8,
      roe: 0.18,
      debtToEquity: 0.6,
      currentRatio: 1.8,
      revenueGrowth: 0.15,
      profitMargin: 0.14
    },
    healthScore: 72,
    technicalIndicators: {
      rsi: 28,
      macd: {
        macd: [-0.8, -1.0, -1.2, -1.4],
        signal: [-0.6, -0.8, -1.0, -1.2],
        histogram: [-0.2, -0.2, -0.2, -0.2]
      },
      maCross: {
        shortMA: 715,
        longMA: 820,
        cross: 'death'
      },
      bollinger: {
        position: 'below_lower'
      }
    },
    riskMetrics: {
      volatility: 0.35,
      beta: 1.4,
      maxDrawdown: -0.25,
      sharpeRatio: 0.8
    }
  },
  {
    symbol: 'UPPER',
    priceData: {
      prices: [890, 895, 900, 905, 910, 905, 900, 895, 900, 905, 910, 915, 920, 915, 910, 915, 920, 925, 930, 925, 920, 925, 930, 935, 940, 935, 930, 935, 940, 945, 950, 945, 940, 945, 950, 955, 960, 955, 950, 955, 960, 965, 970, 965, 960, 965, 970, 975, 980],
      volumes: [100000, 110000, 120000, 130000, 140000, 125000, 130000, 135000, 140000, 145000, 150000, 135000, 140000, 145000, 150000, 155000, 160000, 145000, 150000, 155000, 160000, 165000, 170000, 155000, 160000, 165000, 170000, 175000, 180000, 165000, 170000, 175000, 180000, 185000, 190000, 175000, 180000, 185000, 190000, 195000, 200000, 185000, 190000, 195000, 200000, 205000, 210000, 195000],
      dates: Array.from({length: 50}, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - (49 - i));
        return date.toISOString().split('T')[0];
      })
    },
    financialData: {
      peRatio: 22.5,
      pbRatio: 2.8,
      roe: 0.16,
      debtToEquity: 0.8,
      currentRatio: 1.6,
      revenueGrowth: 0.18,
      profitMargin: 0.12
    },
    healthScore: 68,
    technicalIndicators: {
      rsi: 55,
      macd: {
        macd: [0.2, 0.3, 0.4, 0.5],
        signal: [0.1, 0.2, 0.3, 0.4],
        histogram: [0.1, 0.1, 0.1, 0.1]
      },
      maCross: {
        shortMA: 970,
        longMA: 950,
        cross: 'neutral'
      },
      bollinger: {
        position: 'middle'
      }
    },
    riskMetrics: {
      volatility: 0.28,
      beta: 1.2,
      maxDrawdown: -0.15,
      sharpeRatio: 1.2
    }
  }
];

/**
 * Example 1: Single stock signal generation
 */
function example1_SingleStockSignal() {
  console.log('=== Example 1: Single Stock Signal Generation ===\n');
  
  const stockData = sampleStockData[0]; // NABIL
  const signal = signalGenerator.generateSignal(stockData);
  
  console.log(`Symbol: ${signal.symbol}`);
  console.log(`Signal: ${signal.signal}`);
  console.log(`Confidence: ${signal.confidence}`);
  console.log(`Score: ${(signal.score * 100).toFixed(1)}%`);
  console.log(`Timestamp: ${signal.timestamp}`);
  
  console.log('\n--- Reasoning ---');
  signal.reasoning.forEach((reason, index) => {
    console.log(`${index + 1}. ${reason}`);
  });
  
  console.log('\n--- Component Analysis ---');
  Object.entries(signal.components).forEach(([component, analysis]) => {
    console.log(`\n${component.toUpperCase()}:`);
    console.log(`  Score: ${(analysis.score * 100).toFixed(1)}%`);
    console.log(`  Weight: ${(analysis.weight * 100).toFixed(1)}%`);
    console.log(`  Weighted Score: ${(analysis.weightedScore * 100).toFixed(1)}%`);
    if (analysis.reasoning.length > 0) {
      console.log(`  Reasoning: ${analysis.reasoning.join(', ')}`);
    }
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Example 2: Batch signal generation
 */
function example2_BatchSignalGeneration() {
  console.log('=== Example 2: Batch Signal Generation ===\n');
  
  const signals = signalGenerator.generateBatchSignals(sampleStockData);
  
  console.log('Batch Signal Results:');
  console.log('Symbol\tSignal\tConfidence\tScore');
  console.log('-'.repeat(50));
  
  signals.forEach(signal => {
    console.log(`${signal.symbol}\t${signal.signal}\t${signal.confidence}\t${(signal.score * 100).toFixed(1)}%`);
  });
  
  console.log('\n--- Detailed Analysis ---');
  signals.forEach(signal => {
    console.log(`\n${signal.symbol}:`);
    console.log(`  Signal: ${signal.signal}`);
    console.log(`  Confidence: ${signal.confidence}`);
    console.log(`  Key Reasons: ${signal.reasoning.slice(0, 3).join(', ')}`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Example 3: Signal distribution analysis
 */
function example3_SignalDistribution() {
  console.log('=== Example 3: Signal Distribution Analysis ===\n');
  
  const signals = signalGenerator.generateBatchSignals(sampleStockData);
  
  // Count signals by type
  const signalCounts = {};
  signals.forEach(signal => {
    signalCounts[signal.signal] = (signalCounts[signal.signal] || 0) + 1;
  });
  
  console.log('Signal Distribution:');
  Object.entries(signalCounts).forEach(([signal, count]) => {
    const percentage = (count / signals.length * 100).toFixed(1);
    console.log(`${signal}: ${count} (${percentage}%)`);
  });
  
  // Confidence distribution
  const confidenceCounts = {};
  signals.forEach(signal => {
    confidenceCounts[signal.confidence] = (confidenceCounts[signal.confidence] || 0) + 1;
  });
  
  console.log('\nConfidence Distribution:');
  Object.entries(confidenceCounts).forEach(([confidence, count]) => {
    const percentage = (count / signals.length * 100).toFixed(1);
    console.log(`${confidence}: ${count} (${percentage}%)`);
  });
  
  // Average scores
  const avgScore = signals.reduce((sum, signal) => sum + signal.score, 0) / signals.length;
  console.log(`\nAverage Score: ${(avgScore * 100).toFixed(1)}%`);
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Example 4: Custom signal weights
 */
function example4_CustomWeights() {
  console.log('=== Example 4: Custom Signal Weights ===\n');
  
  // Update weights to emphasize financial analysis more
  signalGenerator.updateWeights({
    trend: 0.25,        // Reduced from 0.35
    financial: 0.35,    // Increased from 0.25
    health: 0.20,       // Same
    technical: 0.15,    // Same
    risk: 0.05          // Same
  });
  
  console.log('Updated Signal Weights:');
  console.log('Trend: 25%, Financial: 35%, Health: 20%, Technical: 15%, Risk: 5%');
  
  // Generate signals with new weights
  const stockData = sampleStockData[0]; // NABIL
  const originalSignal = signalGenerator.generateSignal(stockData);
  
  console.log(`\nNABIL Signal with Custom Weights:`);
  console.log(`Signal: ${originalSignal.signal}`);
  console.log(`Score: ${(originalSignal.score * 100).toFixed(1)}%`);
  
  // Reset to original weights
  signalGenerator.updateWeights({
    trend: 0.35,
    financial: 0.25,
    health: 0.20,
    technical: 0.15,
    risk: 0.05
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Example 5: Risk-based signal filtering
 */
function example5_RiskBasedFiltering() {
  console.log('=== Example 5: Risk-Based Signal Filtering ===\n');
  
  const signals = signalGenerator.generateBatchSignals(sampleStockData);
  
  // Filter signals by confidence
  const highConfidenceSignals = signals.filter(signal => signal.confidence === 'high');
  const mediumConfidenceSignals = signals.filter(signal => signal.confidence === 'medium');
  const lowConfidenceSignals = signals.filter(signal => signal.confidence === 'low');
  
  console.log('Signals by Confidence Level:');
  console.log(`High Confidence: ${highConfidenceSignals.length} stocks`);
  console.log(`Medium Confidence: ${mediumConfidenceSignals.length} stocks`);
  console.log(`Low Confidence: ${lowConfidenceSignals.length} stocks`);
  
  // Show high confidence signals
  if (highConfidenceSignals.length > 0) {
    console.log('\nHigh Confidence Signals:');
    highConfidenceSignals.forEach(signal => {
      console.log(`  ${signal.symbol}: ${signal.signal} (${(signal.score * 100).toFixed(1)}%)`);
    });
  }
  
  // Risk assessment
  console.log('\nRisk Assessment:');
  signals.forEach(signal => {
    const riskScore = signal.components.risk ? signal.components.risk.score : 0.5;
    const riskLevel = riskScore > 0.7 ? 'Low Risk' : riskScore > 0.4 ? 'Medium Risk' : 'High Risk';
    console.log(`  ${signal.symbol}: ${riskLevel} (${(riskScore * 100).toFixed(1)}%)`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Example 6: Signal performance simulation
 */
function example6_PerformanceSimulation() {
  console.log('=== Example 6: Signal Performance Simulation ===\n');
  
  const signals = signalGenerator.generateBatchSignals(sampleStockData);
  
  // Simulate portfolio based on signals
  let portfolio = [];
  let totalInvestment = 0;
  
  signals.forEach(signal => {
    const investment = 100000; // NPR 100,000 per stock
    
    if (signal.signal === 'BUY' || signal.signal === 'STRONG_BUY') {
      portfolio.push({
        symbol: signal.symbol,
        signal: signal.signal,
        confidence: signal.confidence,
        investment: investment,
        expectedReturn: signal.score > 0.6 ? 0.15 : signal.score > 0.5 ? 0.08 : 0.03
      });
      totalInvestment += investment;
    }
  });
  
  console.log(`Portfolio Summary:`);
  console.log(`Total Stocks: ${portfolio.length}`);
  console.log(`Total Investment: NPR ${totalInvestment.toLocaleString()}`);
  
  // Calculate expected portfolio return
  const expectedReturn = portfolio.reduce((sum, stock) => {
    return sum + (stock.investment * stock.expectedReturn);
  }, 0) / totalInvestment;
  
  console.log(`Expected Annual Return: ${(expectedReturn * 100).toFixed(2)}%`);
  
  // Show portfolio composition
  console.log('\nPortfolio Composition:');
  portfolio.forEach(stock => {
    console.log(`  ${stock.symbol}: ${stock.signal} (${stock.confidence}) - NPR ${stock.investment.toLocaleString()}`);
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Example 7: Signal reasoning analysis
 */
function example7_ReasoningAnalysis() {
  console.log('=== Example 7: Signal Reasoning Analysis ===\n');
  
  const signals = signalGenerator.generateBatchSignals(sampleStockData);
  
  signals.forEach(signal => {
    console.log(`\n${signal.symbol} - ${signal.signal} (${signal.confidence}):`);
    
    // Categorize reasoning by component
    const reasoningByComponent = {
      trend: [],
      financial: [],
      health: [],
      technical: [],
      risk: []
    };
    
    signal.reasoning.forEach(reason => {
      if (reason.includes('trend') || reason.includes('uptrend') || reason.includes('downtrend')) {
        reasoningByComponent.trend.push(reason);
      } else if (reason.includes('P/E') || reason.includes('P/B') || reason.includes('ROE') || reason.includes('debt')) {
        reasoningByComponent.financial.push(reason);
      } else if (reason.includes('health') || reason.includes('fundamentals')) {
        reasoningByComponent.health.push(reason);
      } else if (reason.includes('RSI') || reason.includes('MACD') || reason.includes('Bollinger')) {
        reasoningByComponent.technical.push(reason);
      } else if (reason.includes('volatility') || reason.includes('risk') || reason.includes('beta')) {
        reasoningByComponent.risk.push(reason);
      }
    });
    
    Object.entries(reasoningByComponent).forEach(([component, reasons]) => {
      if (reasons.length > 0) {
        console.log(`  ${component.toUpperCase()}:`);
        reasons.forEach(reason => {
          console.log(`    - ${reason}`);
        });
      }
    });
  });
  
  console.log('\n' + '='.repeat(60) + '\n');
}

/**
 * Run all examples
 */
function runAllExamples() {
  console.log('🚀 FinSathi AI - Trading Signal Generation Examples\n');
  console.log('Generating buy/sell/hold signals with comprehensive reasoning...\n');
  
  try {
    example1_SingleStockSignal();
    example2_BatchSignalGeneration();
    example3_SignalDistribution();
    example4_CustomWeights();
    example5_RiskBasedFiltering();
    example6_PerformanceSimulation();
    example7_ReasoningAnalysis();
    
    console.log('✅ All examples completed successfully!');
  } catch (error) {
    console.error('❌ Error running examples:', error.message);
  }
}

// Run examples if this file is executed directly
if (require.main === module) {
  runAllExamples();
}

module.exports = {
  runAllExamples,
  example1_SingleStockSignal,
  example2_BatchSignalGeneration,
  example3_SignalDistribution,
  example4_CustomWeights,
  example5_RiskBasedFiltering,
  example6_PerformanceSimulation,
  example7_ReasoningAnalysis,
  sampleStockData
};
