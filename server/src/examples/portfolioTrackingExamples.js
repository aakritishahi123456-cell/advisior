/**
 * FinSathi AI - Portfolio Tracking System Examples
 * Demonstrates portfolio management and performance tracking
 */

const PortfolioTrackingService = require('../services/portfolioTrackingService');

// Initialize the portfolio service
const portfolioService = new PortfolioTrackingService();

// Sample data for demonstration
const sampleUsers = [
  {
    id: 'user-1',
    email: 'john.doe@example.com',
    name: 'John Doe'
  },
  {
    id: 'user-2',
    email: 'jane.smith@example.com',
    name: 'Jane Smith'
  }
];

const sampleCompanies = [
  {
    id: 'company-1',
    symbol: 'NABIL',
    name: 'Nabil Bank Limited',
    sector: 'Banking',
    industry: 'Commercial Banking'
  },
  {
    id: 'company-2',
    symbol: 'NICA',
    name: 'NIC Asia Bank',
    sector: 'Banking',
    industry: 'Commercial Banking'
  },
  {
    id: 'company-3',
    symbol: 'UPPER',
    name: 'Upper Tamakoshi Hydropower',
    sector: 'Energy',
    industry: 'Hydropower'
  },
  {
    id: 'company-4',
    symbol: 'SIC',
    name: 'Siddhartha Insurance',
    sector: 'Insurance',
    industry: 'Non-Life Insurance'
  },
  {
    id: 'company-5',
    symbol: 'UNILEVER',
    name: 'Unilever Nepal',
    sector: 'Consumer Goods',
    industry: 'FMCG'
  }
];

const samplePriceData = {
  'NABIL': 1525,
  'NICA': 980,
  'UPPER': 890,
  'SIC': 650,
  'UNILEVER': 2100
};

/**
 * Example 1: Create a new portfolio
 */
async function example1_CreatePortfolio() {
  console.log('=== Example 1: Create a New Portfolio ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const portfolioData = {
      name: 'My Retirement Portfolio',
      description: 'Long-term investment portfolio for retirement planning'
    };

    const portfolio = await portfolioService.createPortfolio(userId, portfolioData);
    
    console.log('Portfolio Created:');
    console.log(`ID: ${portfolio.id}`);
    console.log(`Name: ${portfolio.name}`);
    console.log(`Description: ${portfolio.description}`);
    console.log(`Created: ${portfolio.createdAt}`);
    console.log(`Assets: ${portfolio.assets.length}`);
    
    return portfolio;
  } catch (error) {
    console.error('Error creating portfolio:', error.message);
    return null;
  }
}

/**
 * Example 2: Add assets to portfolio
 */
async function example2_AddAssets() {
  console.log('\n=== Example 2: Add Assets to Portfolio ===\n');
  
  try {
    const portfolioId = 'portfolio-1'; // Assuming portfolio exists
    
    const assetsToAdd = [
      {
        companyId: sampleCompanies[0].id, // NABIL
        shares: 100,
        purchasePrice: 1450,
        purchaseDate: '2024-01-15'
      },
      {
        companyId: sampleCompanies[1].id, // NICA
        shares: 150,
        purchasePrice: 920,
        purchaseDate: '2024-01-20'
      },
      {
        companyId: sampleCompanies[2].id, // UPPER
        shares: 200,
        purchasePrice: 850,
        purchaseDate: '2024-02-01'
      }
    ];

    for (const asset of assetsToAdd) {
      const result = await portfolioService.addAsset(portfolioId, asset);
      const company = sampleCompanies.find(c => c.id === asset.companyId);
      
      console.log(`Added Asset: ${company.symbol}`);
      console.log(`  Shares: ${asset.shares}`);
      console.log(`  Purchase Price: NPR ${asset.purchasePrice}`);
      console.log(`  Total Cost: NPR ${asset.shares * asset.purchasePrice}`);
      console.log(`  Purchase Date: ${asset.purchaseDate}`);
      console.log('');
    }

    return true;
  } catch (error) {
    console.error('Error adding assets:', error.message);
    return false;
  }
}

/**
 * Example 3: Get portfolio with current values
 */
async function example3_GetPortfolio() {
  console.log('\n=== Example 3: Get Portfolio with Current Values ===\n');
  
  try {
    const portfolioId = 'portfolio-1';
    const portfolio = await portfolioService.getPortfolio(portfolioId);
    
    console.log(`Portfolio: ${portfolio.name}`);
    console.log(`Owner: ${portfolio.user.name}`);
    console.log(`Created: ${portfolio.createdAt}`);
    console.log(`Last Updated: ${portfolio.updatedAt}`);
    
    console.log('\n--- Portfolio Metrics ---');
    console.log(`Total Value: NPR ${portfolio.metrics.totalValue.toLocaleString()}`);
    console.log(`Total Cost: NPR ${portfolio.metrics.totalCost.toLocaleString()}`);
    console.log(`Total P&L: NPR ${portfolio.metrics.totalPL.toLocaleString()}`);
    console.log(`Total P&L %: ${portfolio.metrics.totalPLP.toFixed(2)}%`);
    console.log(`Asset Count: ${portfolio.metrics.assetCount}`);
    console.log(`Realized P&L: NPR ${portfolio.metrics.realizedPL.toLocaleString()}`);
    console.log(`Unrealized P&L: NPR ${portfolio.metrics.unrealizedPL.toLocaleString()}`);
    
    console.log('\n--- Asset Allocation ---');
    portfolio.metrics.assetAllocation.forEach((asset, index) => {
      console.log(`${index + 1}. ${asset.symbol} (${asset.name})`);
      console.log(`   Shares: ${asset.shares}`);
      console.log(`   Purchase Price: NPR ${asset.purchasePrice}`);
      console.log(`   Current Price: NPR ${asset.currentPrice}`);
      console.log(`   Current Value: NPR ${asset.currentValue.toLocaleString()}`);
      console.log(`   P&L: NPR ${asset.unrealizedPL.toLocaleString()} (${asset.unrealizedPLP.toFixed(2)}%)`);
      console.log(`   Allocation: ${asset.percentage.toFixed(2)}%`);
      console.log('');
    });
    
    console.log('--- Sector Allocation ---');
    Object.entries(portfolio.metrics.sectorAllocation).forEach(([sector, allocation]) => {
      console.log(`${sector}: NPR ${allocation.value.toLocaleString()} (${allocation.percentage.toFixed(2)}%)`);
    });
    
    return portfolio;
  } catch (error) {
    console.error('Error getting portfolio:', error.message);
    return null;
  }
}

/**
 * Example 4: Sell assets from portfolio
 */
async function example4_SellAssets() {
  console.log('\n=== Example 4: Sell Assets from Portfolio ===\n');
  
  try {
    const portfolioId = 'portfolio-1';
    
    const assetsToSell = [
      {
        companyId: sampleCompanies[1].id, // NICA
        shares: 50,
        sellPrice: 980,
        sellDate: '2024-03-01'
      }
    ];

    for (const asset of assetsToSell) {
      const result = await portfolioService.sellAsset(portfolioId, asset);
      const company = sampleCompanies.find(c => c.id === asset.companyId);
      
      console.log(`Sold Asset: ${company.symbol}`);
      console.log(`  Shares Sold: ${asset.shares}`);
      console.log(`  Sell Price: NPR ${asset.sellPrice}`);
      console.log(`  Sell Amount: NPR ${result.sellAmount.toLocaleString()}`);
      console.log(`  Cost Basis: NPR ${result.costBasis.toLocaleString()}`);
      console.log(`  Realized P&L: NPR ${result.realizedPL.toLocaleString()}`);
      console.log('');
    }

    return true;
  } catch (error) {
    console.error('Error selling assets:', error.message);
    return false;
  }
}

/**
 * Example 5: Get portfolio performance history
 */
async function example5_GetPerformance() {
  console.log('\n=== Example 5: Get Portfolio Performance History ===\n');
  
  try {
    const portfolioId = 'portfolio-1';
    const periods = ['1W', '1M', '3M', '6M', '1Y'];
    
    for (const period of periods) {
      const performance = await portfolioService.getPortfolioPerformance(portfolioId, period);
      
      console.log(`Performance (${period}):`);
      console.log(`  Data Points: ${performance.length}`);
      
      if (performance.length > 0) {
        const latest = performance[performance.length - 1];
        const earliest = performance[0];
        
        console.log(`  Period Return: ${((latest.totalValue / earliest.totalValue - 1) * 100).toFixed(2)}%`);
        console.log(`  Latest Value: NPR ${latest.totalValue.toLocaleString()}`);
        console.log(`  Latest P&L: NPR ${latest.totalPL.toLocaleString()}`);
        console.log(`  Latest P&L %: ${latest.totalPLP.toFixed(2)}%`);
        
        if (performance.length > 1) {
          console.log(`  Day Change: NPR ${latest.dayChange.toLocaleString()} (${latest.dayChangeP.toFixed(2)}%)`);
        }
      }
      console.log('');
    }
    
    return true;
  } catch (error) {
    console.error('Error getting performance:', error.message);
    return false;
  }
}

/**
 * Example 6: Calculate risk metrics
 */
async function example6_RiskMetrics() {
  console.log('\n=== Example 6: Calculate Portfolio Risk Metrics ===\n');
  
  try {
    const portfolioId = 'portfolio-1';
    const riskMetrics = await portfolioService.calculateRiskMetrics(portfolioId);
    
    console.log('Portfolio Risk Metrics:');
    console.log(`  Volatility: ${riskMetrics.volatility.toFixed(2)}%`);
    console.log(`  Sharpe Ratio: ${riskMetrics.sharpeRatio.toFixed(3)}`);
    console.log(`  Maximum Drawdown: ${riskMetrics.maxDrawdown.toFixed(2)}%`);
    console.log(`  Beta: ${riskMetrics.beta.toFixed(3)}`);
    console.log(`  Alpha: ${riskMetrics.alpha.toFixed(3)}%`);
    
    // Risk assessment
    console.log('\nRisk Assessment:');
    if (riskMetrics.volatility > 25) {
      console.log('  🔴 High volatility portfolio - consider diversification');
    } else if (riskMetrics.volatility > 15) {
      console.log('  🟡 Moderate volatility portfolio');
    } else {
      console.log('  🟢 Low volatility portfolio');
    }
    
    if (riskMetrics.sharpeRatio > 1.5) {
      console.log('  ✅ Excellent risk-adjusted returns');
    } else if (riskMetrics.sharpeRatio > 1.0) {
      console.log('  🟡 Good risk-adjusted returns');
    } else {
      console.log('  🔴 Poor risk-adjusted returns');
    }
    
    if (riskMetrics.maxDrawdown < -20) {
      console.log('  🔴 High maximum drawdown - significant risk');
    } else if (riskMetrics.maxDrawdown < -10) {
      console.log('  🟡 Moderate maximum drawdown');
    } else {
      console.log('  🟢 Low maximum drawdown');
    }
    
    return riskMetrics;
  } catch (error) {
    console.error('Error calculating risk metrics:', error.message);
    return null;
  }
}

/**
 * Example 7: Portfolio comparison
 */
async function example7_PortfolioComparison() {
  console.log('\n=== Example 7: Portfolio Comparison ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const portfolios = await portfolioService.getUserPortfolios(userId);
    
    console.log('Portfolio Comparison:');
    console.log('Portfolio\t\tValue\t\tP&L\t\tP&L %\t\tRisk');
    console.log('-'.repeat(70));
    
    for (const portfolio of portfolios) {
      const riskMetrics = await portfolioService.calculateRiskMetrics(portfolio.id);
      
      console.log(`${portfolio.name.padEnd(20)}\t${portfolio.metrics.totalValue.toLocaleString().padEnd(12)}\t${portfolio.metrics.totalPL.toLocaleString().padEnd(10)}\t${portfolio.metrics.totalPLP.toFixed(2)}%\t\t${riskMetrics.volatility.toFixed(1)}%`);
    }
    
    // Find best performing portfolio
    const bestPerformer = portfolios.reduce((best, current) => 
      current.metrics.totalPLP > best.metrics.totalPLP ? current : best
    );
    
    console.log(`\n🏆 Best Performing: ${bestPerformer.name} (${bestPerformer.metrics.totalPLP.toFixed(2)}%)`);
    
    return portfolios;
  } catch (error) {
    console.error('Error comparing portfolios:', error.message);
    return null;
  }
}

/**
 * Example 8: Portfolio rebalancing recommendations
 */
async function example8_Rebalancing() {
  console.log('\n=== Example 8: Portfolio Rebalancing Recommendations ===\n');
  
  try {
    const portfolioId = 'portfolio-1';
    const portfolio = await portfolioService.getPortfolio(portfolioId);
    
    // Target allocation for rebalancing
    const targetAllocation = [
      { symbol: 'NABIL', targetPercentage: 30 },
      { symbol: 'NICA', targetPercentage: 25 },
      { symbol: 'UPPER', targetPercentage: 20 },
      { symbol: 'SIC', targetPercentage: 15 },
      { symbol: 'UNILEVER', targetPercentage: 10 }
    ];
    
    const currentValue = portfolio.metrics.totalValue;
    const rebalancingActions = [];
    
    targetAllocation.forEach(target => {
      const currentAsset = portfolio.metrics.assetAllocation.find(a => a.symbol === target.symbol);
      const targetValue = (target.targetPercentage / 100) * currentValue;
      
      if (currentAsset) {
        const currentValue = currentAsset.value;
        const difference = targetValue - currentValue;
        const sharesToTrade = difference / (currentAsset.currentPrice || 0);
        
        if (Math.abs(sharesToTrade) > 0.01) {
          rebalancingActions.push({
            symbol: target.symbol,
            action: sharesToTrade > 0 ? 'BUY' : 'SELL',
            shares: Math.abs(sharesToTrade).toFixed(2),
            currentValue: currentValue,
            targetValue: targetValue,
            difference: difference
          });
        }
      }
    });
    
    console.log('Rebalancing Recommendations:');
    console.log('Symbol\tAction\tShares\t\tCurrent\t\tTarget\t\tDifference');
    console.log('-'.repeat(85));
    
    rebalancingActions.forEach(action => {
      console.log(`${action.symbol.padEnd(8)}\t${action.action.padEnd(6)}\t${action.shares.padEnd(12)}\t${action.currentValue.toLocaleString().padEnd(12)}\t${action.targetValue.toLocaleString().padEnd(12)}\t${action.difference > 0 ? '+' : ''}${action.difference.toLocaleString()}`);
    });
    
    const totalBuyCost = rebalancingActions
      .filter(a => a.action === 'BUY')
      .reduce((sum, a) => sum + a.difference, 0);
    
    const totalSellProceeds = rebalancingActions
      .filter(a => a.action === 'SELL')
      .reduce((sum, a) => sum + Math.abs(a.difference), 0);
    
    console.log(`\nTotal Buy Cost: NPR ${totalBuyCost.toLocaleString()}`);
    console.log(`Total Sell Proceeds: NPR ${totalSellProceeds.toLocaleString()}`);
    console.log(`Net Cash Flow: NPR ${totalBuyCost - totalSellProceeds > 0 ? '+' : ''}${(totalBuyCost - totalSellProceeds).toLocaleString()}`);
    
    return rebalancingActions;
  } catch (error) {
    console.error('Error generating rebalancing recommendations:', error.message);
    return null;
  }
}

/**
 * Example 9: Portfolio analytics dashboard
 */
async function example9_DashboardAnalytics() {
  console.log('\n=== Example 9: Portfolio Analytics Dashboard ===\n');
  
  try {
    const userId = sampleUsers[0].id;
    const portfolios = await portfolioService.getUserPortfolios(userId);
    
    // Aggregate metrics across all portfolios
    const totalValue = portfolios.reduce((sum, p) => sum + (p.metrics?.totalValue || 0), 0);
    const totalCost = portfolios.reduce((sum, p) => sum + (p.metrics?.totalCost || 0), 0);
    const totalPL = totalValue - totalCost;
    const totalPLP = totalCost > 0 ? (totalPL / totalCost) * 100 : 0;
    
    console.log('📊 Portfolio Analytics Dashboard');
    console.log('=====================================');
    console.log(`Total Portfolios: ${portfolios.length}`);
    console.log(`Total Portfolio Value: NPR ${totalValue.toLocaleString()}`);
    console.log(`Total Cost Basis: NPR ${totalCost.toLocaleString()}`);
    console.log(`Total P&L: NPR ${totalPL.toLocaleString()}`);
    console.log(`Total Return: ${totalPLP.toFixed(2)}%`);
    
    // Best and worst performers
    const performers = portfolios.map(p => ({
      name: p.name,
      return: p.metrics?.totalPLP || 0,
      value: p.metrics?.totalValue || 0
    }));
    
    const bestPerformer = performers.reduce((best, current) => current.return > best.return ? current : best);
    const worstPerformer = performers.reduce((worst, current) => current.return < worst.return ? current : worst);
    
    console.log(`\n🏆 Best Performer: ${bestPerformer.name} (${bestPerformer.return.toFixed(2)}%)`);
    console.log(`📉 Worst Performer: ${worstPerformer.name} (${worstPerformer.return.toFixed(2)}%)`);
    
    // Asset concentration analysis
    const allAssets = portfolios.flatMap(p => p.metrics?.assetAllocation || []);
    const topHoldings = allAssets
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    
    console.log('\n🔝 Top Holdings:');
    topHoldings.forEach((holding, index) => {
      console.log(`${index + 1}. ${holding.symbol}: NPR ${holding.value.toLocaleString()} (${holding.percentage.toFixed(2)}%)`);
    });
    
    // Sector diversification
    const sectorMap = new Map();
    portfolios.forEach(portfolio => {
      Object.entries(portfolio.metrics?.sectorAllocation || {}).forEach(([sector, allocation]) => {
        sectorMap.set(sector, (sectorMap.get(sector) || 0) + allocation.value);
      });
    });
    
    const sectorAllocation = Array.from(sectorMap.entries())
      .map(([sector, value]) => ({ sector, value, percentage: (value / totalValue) * 100 }))
      .sort((a, b) => b.value - a.value);
    
    console.log('\n📈 Sector Allocation:');
    sectorAllocation.forEach((sector, index) => {
      console.log(`${index + 1}. ${sector.sector}: NPR ${sector.value.toLocaleString()} (${sector.percentage.toFixed(2)}%)`);
    });
    
    // Risk analysis
    const riskMetrics = [];
    for (const portfolio of portfolios) {
      const metrics = await portfolioService.calculateRiskMetrics(portfolio.id);
      riskMetrics.push({
        name: portfolio.name,
        volatility: metrics.volatility,
        sharpeRatio: metrics.sharpeRatio,
        maxDrawdown: metrics.maxDrawdown
      });
    }
    
    const avgVolatility = riskMetrics.reduce((sum, m) => sum + m.volatility, 0) / riskMetrics.length;
    const avgSharpeRatio = riskMetrics.reduce((sum, m) => sum + m.sharpeRatio, 0) / riskMetrics.length;
    const avgMaxDrawdown = riskMetrics.reduce((sum, m) => sum + m.maxDrawdown, 0) / riskMetrics.length;
    
    console.log('\n⚠️  Risk Analysis:');
    console.log(`Average Volatility: ${avgVolatility.toFixed(2)}%`);
    console.log(`Average Sharpe Ratio: ${avgSharpeRatio.toFixed(3)}`);
    console.log(`Average Max Drawdown: ${avgMaxDrawdown.toFixed(2)}%`);
    
    return {
      totalValue,
      totalPLP,
      bestPerformer,
      worstPerformer,
      topHoldings,
      sectorAllocation,
      riskMetrics: { avgVolatility, avgSharpeRatio, avgMaxDrawdown }
    };
  } catch (error) {
    console.error('Error generating dashboard analytics:', error.message);
    return null;
  }
}

/**
 * Run all examples
 */
async function runAllExamples() {
  console.log('🚀 FinSathi AI - Portfolio Tracking System Examples\n');
  console.log('Demonstrating comprehensive portfolio management...\n');
  
  try {
    await example1_CreatePortfolio();
    await example2_AddAssets();
    await example3_GetPortfolio();
    await example4_SellAssets();
    await example5_GetPerformance();
    await example6_RiskMetrics();
    await example7_PortfolioComparison();
    await example8_Rebalancing();
    await example9_DashboardAnalytics();
    
    console.log('\n✅ All examples completed successfully!');
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
  example1_CreatePortfolio,
  example2_AddAssets,
  example3_GetPortfolio,
  example4_SellAssets,
  example5_GetPerformance,
  example6_RiskMetrics,
  example7_PortfolioComparison,
  example8_Rebalancing,
  example9_DashboardAnalytics,
  sampleUsers,
  sampleCompanies,
  samplePriceData
};
