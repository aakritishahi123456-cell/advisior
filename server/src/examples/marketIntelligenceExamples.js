/**
 * FinSathi AI - Market Intelligence Usage Examples
 * Demonstrates stock trend analysis and market insights generation
 */

const MarketIntelligence = require('./marketIntelligence');

// Initialize the market intelligence system
const analyzer = new MarketIntelligence();

// Example stock data (NEPSE stocks)
const sampleData = {
  NABIL: {
    symbol: 'NABIL',
    prices: [1200, 1210, 1205, 1220, 1230, 1225, 1240, 1250, 1245, 1260, 1270, 1265, 1280, 1290, 1285, 1300, 1310, 1305, 1320, 1330, 1325, 1340, 1350, 1345, 1360, 1370, 1365, 1380, 1390, 1385, 1400, 1410, 1405, 1420, 1430, 1425, 1440, 1450, 1445, 1460, 1470, 1465, 1480, 1490, 1485, 1500, 1510, 1505, 1520, 1530, 1525],
    volumes: [150000, 180000, 160000, 200000, 220000, 190000, 250000, 280000, 210000, 300000, 320000, 260000, 350000, 380000, 290000, 400000, 420000, 330000, 450000, 480000, 360000, 500000, 520000, 390000, 550000, 580000, 420000, 600000, 620000, 460000, 650000, 680000, 510000, 700000, 720000, 540000, 750000, 780000, 570000, 800000, 820000, 610000, 850000, 880000, 650000, 900000, 920000, 690000],
    highs: [1210, 1220, 1215, 1230, 1240, 1235, 1250, 1260, 1255, 1270, 1280, 1275, 1290, 1300, 1295, 1310, 1320, 1315, 1330, 1340, 1335, 1350, 1360, 1355, 1370, 1380, 1375, 1390, 1400, 1395, 1410, 1420, 1415, 1430, 1440, 1435, 1450, 1460, 1455, 1470, 1480, 1475, 1490, 1500, 1495, 1510, 1520, 1515, 1530, 1540],
    lows: [1190, 1200, 1195, 1210, 1220, 1215, 1230, 1240, 1235, 1250, 1260, 1255, 1270, 1280, 1275, 1290, 1300, 1295, 1310, 1320, 1315, 1330, 1340, 1335, 1350, 1360, 1355, 1370, 1380, 1375, 1390, 1400, 1395, 1410, 1420, 1415, 1430, 1440, 1435, 1450, 1460, 1455, 1470, 1480, 1475, 1490, 1500, 1495, 1510, 1520],
    dates: Array.from({length: 50}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (49 - i));
      return date.toISOString().split('T')[0];
    })
  },
  NICA: {
    symbol: 'NICA',
    prices: [950, 960, 955, 970, 980, 975, 990, 1000, 995, 1010, 1020, 1015, 1030, 1040, 1035, 1050, 1060, 1055, 1070, 1080, 1075, 1090, 1100, 1095, 1110, 1120, 1115, 1130, 1140, 1135, 1150, 1160, 1155, 1170, 1180, 1175, 1190, 1200, 1195, 1210, 1220, 1215, 1230, 1240, 1235, 1250, 1260, 1255, 1270, 1280],
    volumes: [120000, 140000, 130000, 160000, 180000, 150000, 200000, 220000, 170000, 240000, 260000, 200000, 280000, 300000, 230000, 320000, 340000, 260000, 360000, 380000, 280000, 400000, 420000, 320000, 440000, 460000, 340000, 480000, 500000, 380000, 520000, 540000, 400000, 560000, 580000, 420000, 600000, 620000, 460000, 640000, 660000, 480000, 680000, 700000, 520000, 720000, 740000, 540000],
    highs: [960, 970, 965, 980, 990, 985, 1000, 1010, 1005, 1020, 1030, 1025, 1040, 1050, 1045, 1060, 1070, 1065, 1080, 1090, 1085, 1100, 1110, 1105, 1120, 1130, 1125, 1140, 1150, 1145, 1160, 1170, 1165, 1180, 1190, 1185, 1200, 1210, 1205, 1220, 1230, 1225, 1240, 1250, 1245, 1260, 1270, 1265, 1280, 1290],
    lows: [940, 950, 945, 960, 970, 965, 980, 990, 985, 1000, 1010, 1005, 1020, 1030, 1025, 1040, 1050, 1045, 1060, 1070, 1065, 1080, 1090, 1085, 1100, 1110, 1105, 1120, 1130, 1125, 1140, 1150, 1145, 1160, 1170, 1165, 1180, 1190, 1185, 1200, 1210, 1205, 1220, 1230, 1225, 1240, 1250, 1245, 1260, 1270],
    dates: Array.from({length: 50}, (_, i) => {
      const date = new Date();
      date.setDate(date.getDate() - (49 - i));
      return date.toISOString().split('T')[0];
    })
  }
};

/**
 * Example 1: Basic trend analysis
 */
function example1_BasicTrendAnalysis() {
  console.log('=== Example 1: Basic Trend Analysis ===\n');
  
  const data = sampleData.NABIL;
  const insights = analyzer.generateInsights(data.symbol, data);
  
  console.log(`Symbol: ${insights.symbol}`);
  console.log(`Confidence: ${insights.confidence} (${(insights.confidenceScore * 100).toFixed(1)}%)`);
  console.log(`Data Points: ${insights.dataPoints}`);
  console.log('\nInsights:');
  insights.insights.forEach((insight, index) => {
    console.log(`${index + 1}. ${insight}`);
  });
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example 2: Comprehensive stock analysis
 */
function example2_ComprehensiveAnalysis() {
  console.log('=== Example 2: Comprehensive Stock Analysis ===\n');
  
  const data = sampleData.NABIL;
  const analysis = analyzer.analyzeStock(data.symbol, data);
  
  console.log(`Symbol: ${analysis.symbol}`);
  console.log(`Last Updated: ${analysis.lastUpdated}`);
  
  // Summary insights
  console.log('\n--- Market Insights ---');
  analysis.summary.insights.forEach((insight, index) => {
    console.log(`${index + 1}. ${insight}`);
  });
  console.log(`Overall Confidence: ${analysis.summary.confidence}`);
  
  // Technical indicators
  console.log('\n--- Technical Analysis ---');
  
  // Latest trend
  if (analysis.technical.trend) {
    const latestTrend = analysis.technical.trend[analysis.technical.trend.length - 1];
    console.log(`Trend: ${latestTrend.trend} (${latestTrend.strength})`);
    console.log(`Price vs Short MA: ${latestTrend.priceAboveShortMA ? 'Above' : 'Below'}`);
    console.log(`Price vs Long MA: ${latestTrend.priceAboveLongMA ? 'Above' : 'Below'}`);
  }
  
  // Latest momentum
  if (analysis.technical.momentum) {
    const latestMomentum = analysis.technical.momentum[analysis.technical.momentum.length - 1];
    console.log(`Momentum: ${latestMomentum.toFixed(2)}%`);
  }
  
  // Latest volatility
  if (analysis.technical.volatility) {
    const latestVolatility = analysis.technical.volatility[analysis.technical.volatility.length - 1];
    console.log(`Volatility: ${(latestVolatility * 100).toFixed(2)}%`);
  }
  
  // Latest RSI
  if (analysis.technical.rsi) {
    const latestRSI = analysis.technical.rsi[analysis.technical.rsi.length - 1];
    console.log(`RSI: ${latestRSI.toFixed(2)}`);
  }
  
  // Statistics
  console.log('\n--- Statistics ---');
  console.log(`Current Price: NPR ${analysis.statistics.currentPrice.toFixed(2)}`);
  console.log(`Price Change: NPR ${analysis.statistics.priceChange.toFixed(2)} (${analysis.statistics.priceChangePercent.toFixed(2)}%)`);
  console.log(`Period High: NPR ${analysis.statistics.periodHigh.toFixed(2)}`);
  console.log(`Period Low: NPR ${analysis.statistics.periodLow.toFixed(2)}`);
  console.log(`Annualized Volatility: ${analysis.statistics.volatility.toFixed(2)}%`);
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example 3: Multiple stock comparison
 */
function example3_MultipleStockComparison() {
  console.log('=== Example 3: Multiple Stock Comparison ===\n');
  
  const symbols = Object.keys(sampleData);
  const comparisons = [];
  
  symbols.forEach(symbol => {
    const data = sampleData[symbol];
    const analysis = analyzer.analyzeStock(symbol, data);
    
    if (!analysis.error) {
      comparisons.push({
        symbol: symbol,
        currentPrice: analysis.statistics.currentPrice,
        priceChangePercent: analysis.statistics.priceChangePercent,
        trend: analysis.technical.trend ? analysis.technical.trend[analysis.technical.trend.length - 1].trend : 'unknown',
        volatility: analysis.statistics.volatility,
        confidence: analysis.summary.confidence
      });
    }
  });
  
  // Display comparison table
  console.log('Stock Comparison:');
  console.log('Symbol\tPrice\tChange\tTrend\tVolatility\tConfidence');
  console.log('-'.repeat(70));
  
  comparisons.forEach(comp => {
    console.log(`${comp.symbol}\t${comp.currentPrice.toFixed(0)}\t${comp.priceChangePercent.toFixed(2)}%\t${comp.trend}\t${comp.volatility.toFixed(2)}%\t${comp.confidence}`);
  });
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example 4: Volatility analysis
 */
function example4_VolatilityAnalysis() {
  console.log('=== Example 4: Volatility Analysis ===\n');
  
  const data = sampleData.NABIL;
  const volatility = analyzer.calculateVolatility(data.prices);
  
  if (volatility) {
    console.log('Volatility Analysis for NABIL:');
    console.log(`Latest Volatility: ${(volatility[volatility.length - 1] * 100).toFixed(2)}%`);
    
    const avgVolatility = volatility.reduce((sum, vol) => sum + vol, 0) / volatility.length;
    console.log(`Average Volatility: ${(avgVolatility * 100).toFixed(2)}%`);
    
    const latestVol = volatility[volatility.length - 1];
    if (latestVol > avgVolatility * 1.5) {
      console.log('🔴 HIGH VOLATILITY: Stock volatility is significantly elevated');
    } else if (latestVol > avgVolatility * 1.2) {
      console.log('🟡 MODERATE VOLATILITY: Stock volatility is above average');
    } else if (latestVol < avgVolatility * 0.7) {
      console.log('🟢 LOW VOLATILITY: Stock volatility is decreasing');
    } else {
      console.log('🔵 NORMAL VOLATILITY: Stock volatility is within normal range');
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example 5: Momentum analysis
 */
function example5_MomentumAnalysis() {
  console.log('=== Example 5: Momentum Analysis ===\n');
  
  const data = sampleData.NABIL;
  const momentum = analyzer.calculateMomentum(data.prices);
  
  if (momentum) {
    console.log('Momentum Analysis for NABIL:');
    const latestMomentum = momentum[momentum.length - 1];
    console.log(`Latest Momentum: ${latestMomentum.toFixed(2)}%`);
    
    if (latestMomentum > 5) {
      console.log('🚀 STRONG MOMENTUM: Stock shows strong positive momentum');
    } else if (latestMomentum > 2) {
      console.log('📈 POSITIVE MOMENTUM: Stock shows moderate positive momentum');
    } else if (latestMomentum < -5) {
      console.log('📉 STRONG NEGATIVE MOMENTUM: Stock shows strong negative momentum');
    } else if (latestMomentum < -2) {
      console.log('⬇️ NEGATIVE MOMENTUM: Stock shows moderate negative momentum');
    } else {
      console.log('➡️ NEUTRAL MOMENTUM: Stock momentum is neutral');
    }
    
    // Momentum trend
    const recentMomentum = momentum.slice(-5);
    const momentumTrend = recentMomentum[recentMomentum.length - 1] - recentMomentum[0];
    console.log(`Momentum Trend (5 periods): ${momentumTrend > 0 ? 'Increasing' : momentumTrend < 0 ? 'Decreasing' : 'Stable'} (${momentumTrend.toFixed(2)}%)`);
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Example 6: Risk assessment
 */
function example6_RiskAssessment() {
  console.log('=== Example 6: Risk Assessment ===\n');
  
  const data = sampleData.NABIL;
  const analysis = analyzer.analyzeStock(data.symbol, data);
  
  if (!analysis.error) {
    console.log('Risk Assessment for NABIL:');
    
    // Volatility risk
    const volatilityRisk = analysis.statistics.volatility;
    let volatilityRating = 'Low';
    if (volatilityRisk > 30) volatilityRating = 'High';
    else if (volatilityRisk > 20) volatilityRating = 'Medium';
    
    console.log(`Volatility Risk: ${volatilityRating} (${volatilityRisk.toFixed(2)}%)`);
    
    // Trend risk
    const trend = analysis.technical.trend ? analysis.technical.trend[analysis.technical.trend.length - 1] : null;
    let trendRisk = 'Low';
    if (trend && trend.trend === 'bearish' && trend.strength === 'strong') trendRisk = 'High';
    else if (trend && trend.trend === 'bearish') trendRisk = 'Medium';
    
    console.log(`Trend Risk: ${trendRisk}`);
    
    // Overall risk score
    const riskScore = (volatilityRisk / 40) * 50 + (trendRisk === 'High' ? 50 : trendRisk === 'Medium' ? 25 : 0);
    let riskLevel = 'Low';
    if (riskScore > 70) riskLevel = 'High';
    else if (riskScore > 40) riskLevel = 'Medium';
    
    console.log(`Overall Risk Level: ${riskLevel} (Score: ${riskScore.toFixed(1)}/100)`);
    
    // Risk recommendations
    console.log('\nRisk Recommendations:');
    if (riskLevel === 'High') {
      console.log('⚠️  Consider reducing position size or setting stop-loss');
      console.log('⚠️  Monitor closely for trend reversal signals');
    } else if (riskLevel === 'Medium') {
      console.log('⚡ Maintain position with appropriate risk management');
      console.log('⚡ Consider partial profit taking if targets are met');
    } else {
      console.log('✅ Current risk level is acceptable for holding');
      console.log('✅ Consider gradual position building on dips');
    }
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
}

/**
 * Run all examples
 */
function runAllExamples() {
  console.log('🚀 FinSathi AI - Market Intelligence System Examples\n');
  console.log('Analyzing NEPSE stock data with technical indicators...\n');
  
  try {
    example1_BasicTrendAnalysis();
    example2_ComprehensiveAnalysis();
    example3_MultipleStockComparison();
    example4_VolatilityAnalysis();
    example5_MomentumAnalysis();
    example6_RiskAssessment();
    
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
  example1_BasicTrendAnalysis,
  example2_ComprehensiveAnalysis,
  example3_MultipleStockComparison,
  example4_VolatilityAnalysis,
  example5_MomentumAnalysis,
  example6_RiskAssessment,
  sampleData
};
