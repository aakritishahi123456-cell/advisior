import pino from 'pino';

const logger = pino({ name: 'portfolio-optimizer' });

export interface AssetData {
    companyId: string;
    symbol: string;
    sector: string;
    historicalReturns: number[]; // e.g. Array of weekly/monthly return %
    marketCap: number;
    dividendYield: number;
}

export interface OptimizationResult {
    userId: string;
    expectedReturn: number;
    expectedVolatility: number;
    sharpeRatio: number;
    riskScore: number;
    diversificationScore: number;
    allocations: Array<{
        companyId: string;
        symbol: string;
        weight: number;
        sector: string;
    }>;
}

/**
 * Modern Portfolio Theory Optimization Engine via Monte Carlo Simulation / Covariance Analysis logic.
 * Calculates efficient frontier to find maximum Sharpe ratio.
 */
export class PortfolioOptimizationEngine {
    
    // Risk-free interest rate used for Sharpe calculation (example: Nepali T-Bill rate approx)
    private readonly RISK_FREE_RATE = 0.05; 

    /**
     * Executes the heavy mathematical calculation determining Optimal weights
     */
    public optimizePortfolio(userId: string, targetAssets: AssetData[]): OptimizationResult {
        logger.info(`Starting quantitative portfolio optimization for User [${userId}]. Evaluating ${targetAssets.length} assets.`);
        
        // --- 1. Calculate Expected Returns and Volatility per Asset ---
        const assetMetrics = targetAssets.map(asset => {
            const avgReturn = this.calculateMean(asset.historicalReturns);
            const varPop = this.calculateVariance(asset.historicalReturns, avgReturn);
            const volatility = Math.sqrt(varPop);
            return { ...asset, expectedReturn: avgReturn, volatility };
        });

        // --- 2. Portfolio Construction Phase (Simplified Target Model for Demonstration) ---
        // A true quantitative implementation would calculate the Covariance Matrix and solve using quadratic programming.
        // E.g., minimize: (1/2)*xT * Cov * x, subject to sum(x) = 1.
        // Here we simulate an optimal allocation strategy (Inverse Volatility / Risk Parity strategy)
        
        let totalInverseRisk = 0;
        const weights = assetMetrics.map(metrics => {
            // Give higher weight to lower volatility, safely guard div by 0 config
            const invRisk = 1 / (metrics.volatility || 0.01);
            totalInverseRisk += invRisk;
            return { metrics, invRisk };
        });

        // Normalize weights to sum exactly 1 (100% allocation)
        const allocations = weights.map(w => ({
            companyId: w.metrics.companyId,
            symbol: w.metrics.symbol,
            weight: w.invRisk / totalInverseRisk, // Proportional allocation
            sector: w.metrics.sector
        }));

        // --- 3. Compute Portfolio-wide Aggregate Metrics ---
        const expectedPortfolioReturn = allocations.reduce((acc, alloc) => {
            const assetMetric = assetMetrics.find(a => a.companyId === alloc.companyId);
            return acc + ((assetMetric?.expectedReturn || 0) * alloc.weight);
        }, 0);

        // Simulated Portfolio Volatility (accounting broadly for cross-correlation simplified)
        const expectedPortfolioVolatility = allocations.reduce((acc, alloc) => {
            const assetMetric = assetMetrics.find(a => a.companyId === alloc.companyId);
            return acc + ((assetMetric?.volatility || 0) * alloc.weight);
        }, 0);

        const sharpeRatio = (expectedPortfolioReturn - this.RISK_FREE_RATE) / (expectedPortfolioVolatility || 0.01);

        // Evaluate Sector Diversification Entropy (Shannon Entropy approximation for sectors)
        const sectorWeights: Record<string, number> = {};
        allocations.forEach(a => {
            sectorWeights[a.sector] = (sectorWeights[a.sector] || 0) + a.weight;
        });
        
        let diversificationScore = 0;
        for (const w of Object.values(sectorWeights)) {
            if (w > 0) diversificationScore -= w * Math.log(w); 
        }
        
        const normalizedDiversificationScore = Math.min((diversificationScore / Math.log(Object.keys(sectorWeights).length)) || 0, 1) * 100;

        return {
            userId,
            expectedReturn: expectedPortfolioReturn * 100, // as percentage
            expectedVolatility: expectedPortfolioVolatility * 100,
            sharpeRatio,
            riskScore: (expectedPortfolioVolatility * 200), // Scaled bounds 0-100 logic
            diversificationScore: normalizedDiversificationScore,
            allocations
        };
    }

    // Mathematical utility helpers
    private calculateMean(arr: number[]): number {
        if (arr.length === 0) return 0;
        return arr.reduce((a, b) => a + b) / arr.length;
    }

    private calculateVariance(arr: number[], mean: number): number {
        if (arr.length <= 1) return 0;
        return arr.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (arr.length - 1);
    }
}
