const { MarketDataAgent } = require('./marketData/marketDataAgent');
const { FinancialAnalysisAgent } = require('./financialAnalysis/financialAnalysisAgent');
const { PortfolioIntelligenceAgent } = require('./portfolio/portfolioIntelligenceAgent');
const { InsightGenerationAgent } = require('./insights/insightGenerationAgent');
const { StrategySimulationAgent } = require('./simulation/strategySimulationAgent');

const agents = {
  marketData: new MarketDataAgent(),
  financialAnalysis: new FinancialAnalysisAgent(),
  portfolioIntelligence: new PortfolioIntelligenceAgent(),
  insightGeneration: new InsightGenerationAgent(),
  strategySimulation: new StrategySimulationAgent(),
};

module.exports = { agents };

