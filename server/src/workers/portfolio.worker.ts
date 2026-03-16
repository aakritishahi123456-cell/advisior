import { Job } from 'bull';
import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { PortfolioOptimizationEngine, AssetData } from '../services/portfolioOptimizer';

const prisma = new PrismaClient();
const optimizer = new PortfolioOptimizationEngine();

export interface PortfolioRecalculationJob {
    userId: string;
    targetSectors?: string[];
    riskToleranceLevel?: string; // High, Medium, Low bound limits
}

/**
 * Worker executing decoupled heavy asynchronous quantitative analysis
 */
export default async function portfolioRecalculationWorker(job: Job<PortfolioRecalculationJob>) {
    const { userId, targetSectors } = job.data;
    logger.info(`Beginning Portfolio Optimization algorithm sequence for User: ${userId}`);

    try {
        // 1. Fetch relevant Historical Financial data spanning multiple scopes natively
        const validCompanies = await prisma.company.findMany({
            where: targetSectors?.length ? { sector: { in: targetSectors } } : {},
            include: {
                nepsePrices: {
                    orderBy: { date: 'desc' },
                    take: 52 // Example 52-weeks bound trailing calculation metrics
                },
                nepseFinancials: {
                    orderBy: { asOfDate: 'desc' },
                    take: 1
                }
            }
        });

        // Filter valid targets containing actual historical data to map vectors
        const assetPool: AssetData[] = validCompanies
            .filter(c => c.nepsePrices.length > 10)
            .map(c => {
                // Calculate percentage periodic returns logic natively
                const prices = c.nepsePrices.map(p => p.close || 0).reverse();
                const returns = [];
                for(let i = 1; i < prices.length; i++) {
                    if (prices[i-1] > 0) {
                        returns.push((prices[i] - prices[i-1]) / prices[i-1]);
                    }
                }

                return {
                    companyId: c.id,
                    symbol: c.symbol,
                    sector: c.sector,
                    historicalReturns: returns,
                    marketCap: Number(c.nepseFinancials[0]?.marketCap || 0),
                    dividendYield: c.nepseFinancials[0]?.dividendYield || 0
                };
            });

        if (assetPool.length === 0) {
            throw new Error('Not enough historical asset data found globally for portfolio construction.');
        }

        // 2. Invoke Quants Math Algorithm
        const result = optimizer.optimizePortfolio(userId, assetPool);

        // 3. Atomically update portfolio schema bindings
        await prisma.$transaction(async (tx) => {
            
            // Delete old optimal portfolio completely regenerating clean bindings
            await tx.optimizedPortfolio.deleteMany({
                where: { userId }
            });

            // Insert new optimization record
            const portfolio = await tx.optimizedPortfolio.create({
                data: {
                    userId,
                    expectedReturn: result.expectedReturn,
                    expectedVolatility: result.expectedVolatility,
                    sharpeRatio: result.sharpeRatio,
                    riskScore: result.riskScore,
                    diversificationScore: result.diversificationScore
                }
            });

            // Reconstruct nested allocations
            for (const alloc of result.allocations) {
                // Skip extreme 0% distributions to save space constraints
                if (alloc.weight < 0.001) continue; 
                
                await tx.portfolioAllocation.create({
                    data: {
                        portfolioId: portfolio.id,
                        companyId: alloc.companyId,
                        weight: alloc.weight,
                        sector: alloc.sector
                    }
                });
            }
        });

        logger.info(`Successfully generated Optimized Portfolio. Expected Return: ${result.expectedReturn.toFixed(2)}%, Sharpe: ${result.sharpeRatio.toFixed(3)}`);
        
        return { success: true, optimized: true };

    } catch (error: any) {
        logger.error(`Failed portfolio execution: ${error.message}`);
        throw error; // Let distributed pipeline worker backoff handle errors
    }
}
