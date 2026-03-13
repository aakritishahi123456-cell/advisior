import { PrismaClient } from '@prisma/client';
import logger from '../utils/logger';
import { createError } from '../middleware/errorHandler';
import { FinancialReportRepository } from '../repositories/financialReport.repository';

const prisma = new PrismaClient();

export interface FinancialRatios {
  roe?: number;
  debtRatio?: number;
  profitMargin?: number;
  epsGrowth?: number;
  currentRatio?: number;
  quickRatio?: number;
  grossMargin?: number;
  operatingMargin?: number;
  returnOnAssets?: number;
  assetTurnover?: number;
  inventoryTurnover?: number;
  priceToBookRatio?: number;
  priceToEarningsRatio?: number;
}

export interface RatioCalculationContext {
  currentYear: number;
  previousYear?: number;
  currentMetrics: {
    revenue?: number;
    netProfit?: number;
    totalAssets?: number;
    totalLiabilities?: number;
    equity?: number;
    eps?: number;
    grossProfit?: number;
    operatingIncome?: number;
    currentAssets?: number;
    currentLiabilities?: number;
    inventory?: number;
    costOfGoodsSold?: number;
  };
  previousMetrics?: {
    revenue?: number;
    netProfit?: number;
    totalAssets?: number;
    totalLiabilities?: number;
    equity?: number;
    eps?: number;
    grossProfit?: number;
    operatingIncome?: number;
    currentAssets?: number;
    currentLiabilities?: number;
    inventory?: number;
    costOfGoodsSold?: number;
  };
  marketData?: {
    currentPrice?: number;
    bookValue?: number;
  };
}

export interface RatioAnalysis {
  ratios: FinancialRatios;
  analysis: {
    overall: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    profitability: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    liquidity: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    solvency: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
    efficiency: 'excellent' | 'good' | 'average' | 'poor' | 'critical';
  };
  recommendations: string[];
  warnings: string[];
}

export class FinancialRatioService {
  /**
   * Calculate Return on Equity (ROE)
   * Formula: Net Profit / Equity * 100
   */
  static calculateROE(netProfit: number, equity: number): number | null {
    try {
      if (equity === 0) {
        logger.warn('ROE calculation: Equity is zero');
        return null;
      }

      if (netProfit < 0) {
        logger.warn('ROE calculation: Negative net profit');
        return -((Math.abs(netProfit) / equity) * 100);
      }

      const roe = (netProfit / equity) * 100;
      
      // Validate reasonable range
      if (roe > 1000 || roe < -1000) {
        logger.warn(`ROE calculation: Unreasonable value ${roe}%`);
        return null;
      }

      return Math.round(roe * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating ROE:', error);
      return null;
    }
  }

  /**
   * Calculate Debt Ratio
   * Formula: Total Liabilities / Total Assets * 100
   */
  static calculateDebtRatio(totalLiabilities: number, totalAssets: number): number | null {
    try {
      if (totalAssets === 0) {
        logger.warn('Debt ratio calculation: Total assets is zero');
        return null;
      }

      const debtRatio = (totalLiabilities / totalAssets) * 100;
      
      // Validate reasonable range
      if (debtRatio > 100 || debtRatio < 0) {
        logger.warn(`Debt ratio calculation: Unreasonable value ${debtRatio}%`);
        return null;
      }

      return Math.round(debtRatio * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating debt ratio:', error);
      return null;
    }
  }

  /**
   * Calculate Net Profit Margin
   * Formula: Net Profit / Revenue * 100
   */
  static calculateProfitMargin(netProfit: number, revenue: number): number | null {
    try {
      if (revenue === 0) {
        logger.warn('Profit margin calculation: Revenue is zero');
        return null;
      }

      if (netProfit < 0) {
        logger.warn('Profit margin calculation: Negative net profit');
        return -((Math.abs(netProfit) / revenue) * 100);
      }

      const profitMargin = (netProfit / revenue) * 100;
      
      // Validate reasonable range
      if (profitMargin > 100 || profitMargin < -100) {
        logger.warn(`Profit margin calculation: Unreasonable value ${profitMargin}%`);
        return null;
      }

      return Math.round(profitMargin * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating profit margin:', error);
      return null;
    }
  }

  /**
   * Calculate EPS Growth
   * Formula: ((EPS_current - EPS_previous) / EPS_previous) * 100
   */
  static calculateEPSGrowth(currentEPS: number, previousEPS: number): number | null {
    try {
      if (previousEPS === 0 || previousEPS < 0) {
        logger.warn('EPS growth calculation: Previous EPS is zero or negative');
        return null;
      }

      if (currentEPS < 0 && previousEPS > 0) {
        logger.warn('EPS growth calculation: Current EPS is negative while previous is positive');
        return -((Math.abs(currentEPS - previousEPS) / previousEPS) * 100);
      }

      const epsGrowth = ((currentEPS - previousEPS) / previousEPS) * 100;
      
      // Validate reasonable range
      if (Math.abs(epsGrowth) > 1000) {
        logger.warn(`EPS growth calculation: Unreasonable value ${epsGrowth}%`);
        return null;
      }

      return Math.round(epsGrowth * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating EPS growth:', error);
      return null;
    }
  }

  /**
   * Calculate Current Ratio
   * Formula: Current Assets / Current Liabilities
   */
  static calculateCurrentRatio(currentAssets: number, currentLiabilities: number): number | null {
    try {
      if (currentLiabilities === 0) {
        logger.warn('Current ratio calculation: Current liabilities is zero');
        return null;
      }

      const currentRatio = currentAssets / currentLiabilities;
      
      // Validate reasonable range
      if (currentRatio > 100) {
        logger.warn(`Current ratio calculation: Unreasonable value ${currentRatio}`);
        return null;
      }

      return Math.round(currentRatio * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating current ratio:', error);
      return null;
    }
  }

  /**
   * Calculate Quick Ratio
   * Formula: (Current Assets - Inventory) / Current Liabilities
   */
  static calculateQuickRatio(currentAssets: number, currentLiabilities: number, inventory?: number): number | null {
    try {
      if (currentLiabilities === 0) {
        logger.warn('Quick ratio calculation: Current liabilities is zero');
        return null;
      }

      const quickAssets = inventory ? currentAssets - inventory : currentAssets;
      
      if (quickAssets < 0) {
        logger.warn('Quick ratio calculation: Quick assets are negative');
        return null;
      }

      const quickRatio = quickAssets / currentLiabilities;
      
      // Validate reasonable range
      if (quickRatio > 100) {
        logger.warn(`Quick ratio calculation: Unreasonable value ${quickRatio}`);
        return null;
      }

      return Math.round(quickRatio * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating quick ratio:', error);
      return null;
    }
  }

  /**
   * Calculate Gross Margin
   * Formula: Gross Profit / Revenue * 100
   */
  static calculateGrossMargin(grossProfit: number, revenue: number): number | null {
    try {
      if (revenue === 0) {
        logger.warn('Gross margin calculation: Revenue is zero');
        return null;
      }

      if (grossProfit < 0) {
        logger.warn('Gross margin calculation: Negative gross profit');
        return -((Math.abs(grossProfit) / revenue) * 100);
      }

      const grossMargin = (grossProfit / revenue) * 100;
      
      // Validate reasonable range
      if (grossMargin > 100 || grossMargin < -100) {
        logger.warn(`Gross margin calculation: Unreasonable value ${grossMargin}%`);
        return null;
      }

      return Math.round(grossMargin * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating gross margin:', error);
      return null;
    }
  }

  /**
   * Calculate Operating Margin
   * Formula: Operating Income / Revenue * 100
   */
  static calculateOperatingMargin(operatingIncome: number, revenue: number): number | null {
    try {
      if (revenue === 0) {
        logger.warn('Operating margin calculation: Revenue is zero');
        return null;
      }

      if (operatingIncome < 0) {
        logger.warn('Operating margin calculation: Negative operating income');
        return -((Math.abs(operatingIncome) / revenue) * 100);
      }

      const operatingMargin = (operatingIncome / revenue) * 100;
      
      // Validate reasonable range
      if (operatingMargin > 100 || operatingMargin < -100) {
        logger.warn(`Operating margin calculation: Unreasonable value ${operatingMargin}%`);
        return null;
      }

      return Math.round(operatingMargin * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating operating margin:', error);
      return null;
    }
  }

  /**
   * Calculate Return on Assets (ROA)
   * Formula: Net Profit / Total Assets * 100
   */
  static calculateReturnOnAssets(netProfit: number, totalAssets: number): number | null {
    try {
      if (totalAssets === 0) {
        logger.warn('ROA calculation: Total assets is zero');
        return null;
      }

      if (netProfit < 0) {
        logger.warn('ROA calculation: Negative net profit');
        return -((Math.abs(netProfit) / totalAssets) * 100);
      }

      const roa = (netProfit / totalAssets) * 100;
      
      // Validate reasonable range
      if (roa > 100 || roa < -100) {
        logger.warn(`ROA calculation: Unreasonable value ${roa}%`);
        return null;
      }

      return Math.round(roa * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating ROA:', error);
      return null;
    }
  }

  /**
   * Calculate Asset Turnover
   * Formula: Revenue / Total Assets
   */
  static calculateAssetTurnover(revenue: number, totalAssets: number): number | null {
    try {
      if (totalAssets === 0) {
        logger.warn('Asset turnover calculation: Total assets is zero');
        return null;
      }

      if (revenue < 0) {
        logger.warn('Asset turnover calculation: Negative revenue');
        return null;
      }

      const assetTurnover = revenue / totalAssets;
      
      // Validate reasonable range
      if (assetTurnover > 10 || assetTurnover < 0) {
        logger.warn(`Asset turnover calculation: Unreasonable value ${assetTurnover}`);
        return null;
      }

      return Math.round(assetTurnover * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating asset turnover:', error);
      return null;
    }
  }

  /**
   * Calculate Inventory Turnover
   * Formula: Cost of Goods Sold / Inventory
   */
  static calculateInventoryTurnover(costOfGoodsSold: number, inventory: number): number | null {
    try {
      if (inventory === 0) {
        logger.warn('Inventory turnover calculation: Inventory is zero');
        return null;
      }

      if (costOfGoodsSold < 0) {
        logger.warn('Inventory turnover calculation: Negative COGS');
        return null;
      }

      const inventoryTurnover = costOfGoodsSold / inventory;
      
      // Validate reasonable range
      if (inventoryTurnover > 20 || inventoryTurnover < 0) {
        logger.warn(`Inventory turnover calculation: Unreasonable value ${inventoryTurnover}`);
        return null;
      }

      return Math.round(inventoryTurnover * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating inventory turnover:', error);
      return null;
    }
  }

  /**
   * Calculate Price to Book Ratio
   * Formula: Market Price per Share / Book Value per Share
   */
  static calculatePriceToBookRatio(marketPrice: number, bookValue: number): number | null {
    try {
      if (bookValue === 0) {
        logger.warn('P/B ratio calculation: Book value is zero');
        return null;
      }

      if (marketPrice <= 0) {
        logger.warn('P/B ratio calculation: Market price is zero or negative');
        return null;
      }

      const priceToBookRatio = marketPrice / bookValue;
      
      // Validate reasonable range
      if (priceToBookRatio > 50 || priceToBookRatio < 0.1) {
        logger.warn(`P/B ratio calculation: Unreasonable value ${priceToBookRatio}`);
        return null;
      }

      return Math.round(priceToBookRatio * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating P/B ratio:', error);
      return null;
    }
  }

  /**
   * Calculate Price to Earnings Ratio
   * Formula: Market Price per Share / Earnings per Share
   */
  static calculatePriceToEarningsRatio(marketPrice: number, eps: number): number | null {
    try {
      if (eps === 0 || eps < 0) {
        logger.warn('P/E ratio calculation: EPS is zero or negative');
        return null;
      }

      if (marketPrice <= 0) {
        logger.warn('P/E ratio calculation: Market price is zero or negative');
        return null;
      }

      const priceToEarningsRatio = marketPrice / eps;
      
      // Validate reasonable range
      if (priceToEarningsRatio > 100 || priceToEarningsRatio < 1) {
        logger.warn(`P/E ratio calculation: Unreasonable value ${priceToEarningsRatio}`);
        return null;
      }

      return Math.round(priceToEarningsRatio * 100) / 100;
    } catch (error: any) {
      logger.error('Error calculating P/E ratio:', error);
      return null;
    }
  }

  /**
   * Calculate comprehensive financial ratios from financial data
   */
  static calculateAllRatios(context: RatioCalculationContext): FinancialRatios {
    const { currentMetrics, previousMetrics } = context;
    const ratios: FinancialRatios = {};

    // Current year ratios
    if (currentMetrics.netProfit && currentMetrics.equity) {
      ratios.roe = this.calculateROE(currentMetrics.netProfit, currentMetrics.equity);
    }

    if (currentMetrics.totalLiabilities && currentMetrics.totalAssets) {
      ratios.debtRatio = this.calculateDebtRatio(currentMetrics.totalLiabilities, currentMetrics.totalAssets);
    }

    if (currentMetrics.netProfit && currentMetrics.revenue) {
      ratios.profitMargin = this.calculateProfitMargin(currentMetrics.netProfit, currentMetrics.revenue);
    }

    if (currentMetrics.eps && previousMetrics?.eps) {
      ratios.epsGrowth = this.calculateEPSGrowth(currentMetrics.eps, previousMetrics.eps);
    }

    if (currentMetrics.currentAssets && currentMetrics.currentLiabilities) {
      ratios.currentRatio = this.calculateCurrentRatio(currentMetrics.currentAssets, currentMetrics.currentLiabilities);
    }

    if (currentMetrics.currentAssets && currentMetrics.currentLiabilities && currentMetrics.inventory) {
      ratios.quickRatio = this.calculateQuickRatio(currentMetrics.currentAssets, currentMetrics.currentLiabilities, currentMetrics.inventory);
    }

    if (currentMetrics.grossProfit && currentMetrics.revenue) {
      ratios.grossMargin = this.calculateGrossMargin(currentMetrics.grossProfit, currentMetrics.revenue);
    }

    if (currentMetrics.operatingIncome && currentMetrics.revenue) {
      ratios.operatingMargin = this.calculateOperatingMargin(currentMetrics.operatingIncome, currentMetrics.revenue);
    }

    if (currentMetrics.netProfit && currentMetrics.totalAssets) {
      ratios.returnOnAssets = this.calculateReturnOnAssets(currentMetrics.netProfit, currentMetrics.totalAssets);
    }

    if (currentMetrics.revenue && currentMetrics.totalAssets) {
      ratios.assetTurnover = this.calculateAssetTurnover(currentMetrics.revenue, currentMetrics.totalAssets);
    }

    if (currentMetrics.costOfGoodsSold && currentMetrics.inventory) {
      ratios.inventoryTurnover = this.calculateInventoryTurnover(currentMetrics.costOfGoodsSold, currentMetrics.inventory);
    }

    // Market ratios (if market data provided)
    if (context.marketData) {
      if (context.marketData.currentPrice && context.marketData.bookValue) {
        ratios.priceToBookRatio = this.calculatePriceToBookRatio(context.marketData.currentPrice, context.marketData.bookValue);
      }

      if (context.marketData.currentPrice && currentMetrics.eps) {
        ratios.priceToEarningsRatio = this.calculatePriceToEarningsRatio(context.marketData.currentPrice, currentMetrics.eps);
      }
    }

    logger.info({
      action: 'financial_ratios_calculated',
      companyId: context.currentYear,
      ratiosCount: Object.keys(ratios).filter(key => ratios[key as keyof FinancialRatios] !== undefined).length,
    });

    return ratios;
  }

  /**
   * Analyze financial ratios and provide recommendations
   */
  static analyzeRatios(ratios: FinancialRatios): RatioAnalysis {
    const analysis: any = {
      overall: 'average' as 'excellent' | 'good' | 'average' | 'poor' | 'critical',
      profitability: 'average' as 'excellent' | 'good' | 'average' | 'poor' | 'critical',
      liquidity: 'average' as 'excellent' | 'good' | 'average' | 'poor' | 'critical',
      solvency: 'average' as 'excellent' | 'good' | 'average' | 'poor' | 'critical',
      efficiency: 'average' as 'excellent' | 'good' | 'average' | 'poor' | 'critical',
    };

    const recommendations: string[] = [];
    const warnings: string[] = [];

    // Analyze profitability
    if (ratios.roe !== undefined) {
      if (ratios.roe >= 20) {
        analysis.profitability = 'excellent';
        recommendations.push('Excellent ROE indicates strong profitability');
      } else if (ratios.roe >= 15) {
        analysis.profitability = 'good';
        recommendations.push('Good ROE indicates solid profitability');
      } else if (ratios.roe >= 10) {
        analysis.profitability = 'average';
        recommendations.push('ROE is average, consider improving profitability');
      } else if (ratios.roe >= 5) {
        analysis.profitability = 'poor';
        recommendations.push('Low ROE indicates poor profitability');
        warnings.push('Consider improving operational efficiency');
      } else {
        analysis.profitability = 'critical';
        recommendations.push('Negative ROE indicates losses');
        warnings.push('Immediate action required to stop losses');
      }
    } else {
      analysis.profitability = 'critical';
      recommendations.push('ROE data not available');
      warnings.push('Calculate ROE to assess profitability');
    }

    // Analyze liquidity
    if (ratios.currentRatio !== undefined) {
      if (ratios.currentRatio >= 2.5) {
        analysis.liquidity = 'excellent';
        recommendations.push('Strong current ratio indicates good liquidity');
      } else if (ratios.currentRatio >= 1.5) {
        analysis.liquidity = 'good';
        recommendations.push('Adequate current ratio');
      } else if (ratios.currentRatio >= 1.0) {
        analysis.liquidity = 'average';
        recommendations.push('Current ratio is just at break-even point');
      } else if (ratios.currentRatio >= 0.5) {
        analysis.liquidity = 'poor';
        recommendations.push('Low current ratio indicates liquidity issues');
        warnings.push('Improve cash flow management');
      } else {
        analysis.liquidity = 'critical';
        recommendations.push('Current ratio below 1.0 is critical');
        warnings.push('Immediate liquidity concerns');
      }
    } else {
      analysis.liquidity = 'critical';
      recommendations.push('Current ratio data not available');
      warnings.push('Calculate current ratio to assess liquidity');
    }

    // Analyze solvency
    if (ratios.debtRatio !== undefined) {
      if (ratios.debtRatio <= 0.3) {
        analysis.solvency = 'excellent';
        recommendations.push('Very low debt ratio indicates strong solvency');
      } else if (ratios.debtRatio <= 0.5) {
        analysis.solvency = 'good';
        recommendations.push('Low debt ratio indicates good solvency');
      } else if (ratios.debtRatio <= 0.7) {
        analysis.solvency = 'average';
        recommendations.push('Debt ratio is manageable but monitor closely');
      } else if (ratios.debtRatio <= 1.0) {
        analysis.solvency = 'poor';
        recommendations.push('High debt ratio indicates solvency concerns');
        warnings.push('Consider debt restructuring');
      } else {
        analysis.solvency = 'critical';
        recommendations.push('Debt ratio above 100% is critical');
        warnings.push('Immediate debt restructuring required');
      }
    } else {
      analysis.solvency = 'critical';
      recommendations.push('Debt ratio data not available');
      warnings.push('Calculate debt ratio to assess solvency');
    }

    // Analyze efficiency
    if (ratios.assetTurnover !== undefined) {
      if (ratios.assetTurnover >= 2.0) {
        analysis.efficiency = 'excellent';
        recommendations.push('High asset turnover indicates efficient operations');
      } else if (ratios.assetTurnover >= 1.5) {
        analysis.efficiency = 'good';
        recommendations.push('Good asset turnover indicates efficient operations');
      } else if (ratios.assetTurnover >= 1.0) {
        analysis.efficiency = 'average';
        recommendations.push('Asset turnover could be improved');
      } else if (ratios.assetTurnover >= 0.5) {
        analysis.efficiency = 'poor';
        recommendations.push('Low asset turnover indicates inefficiency');
        warnings.push('Improve asset utilization');
      } else {
        analysis.efficiency = 'critical';
        recommendations.push('Asset turnover is critically low');
        warnings.push('Asset utilization requires immediate attention');
      }
    } else {
      analysis.efficiency = 'critical';
      recommendations.push('Asset turnover data not available');
      warnings.push('Calculate asset turnover to assess efficiency');
    }

    // Overall assessment
    const scores = [
      analysis.profitability === 'excellent' ? 5 : 
      analysis.profitability === 'good' ? 4 : 
      analysis.profitability === 'average' ? 3 : 
      analysis.profitability === 'poor' ? 2 : 1,
      analysis.liquidity === 'excellent' ? 5 : 
      analysis.liquidity === 'good' ? 4 : 
      analysis.liquidity === 'average' ? 3 : 
      analysis.liquidity === 'poor' ? 2 : 1,
      analysis.solvency === 'excellent' ? 5 : 
      analysis.solvency === 'good' ? 4 : 
      analysis.solvency === 'average' ? 3 : 
      analysis.solvency === 'poor' ? 2 : 1,
      analysis.efficiency === 'excellent' ? 5 : 
      analysis.efficiency === 'good' ? 4 : 
      analysis.efficiency === 'average' ? 3 : 
      analysis.efficiency === 'poor' ? 2 : 1,
    ].filter((score): score is number => score > 0);

    const averageScore = scores.length > 0 ? scores.reduce((sum, score) => sum + score) / scores.length : 0;

    if (averageScore >= 4.5) {
      analysis.overall = 'excellent';
    } else if (averageScore >= 3.5) {
      analysis.overall = 'good';
    } else if (averageScore >= 2.5) {
      analysis.overall = 'average';
    } else if (averageScore >= 1.5) {
      analysis.overall = 'poor';
    } else {
      analysis.overall = 'critical';
    }

    return {
      ratios,
      analysis,
      recommendations,
      warnings,
    };
  }

  /**
   * Calculate ratios for a company and year
   */
  static async calculateCompanyRatios(
    companyId: string,
    year: number,
    previousYear?: number
  ): Promise<FinancialRatios> {
    try {
      // Get current year financial data
      const currentReport = await prisma.financialReport.findFirst({
        where: { companyId, year },
      });

      if (!currentReport) {
        throw createError(`Financial report not found for year ${year}`, 404);
      }

      // Get previous year data if requested
      let previousReport = null;
      if (previousYear) {
        previousReport = await prisma.financialReport.findFirst({
          where: { companyId, year: previousYear },
        });
      }

      // Build calculation context
      const context: RatioCalculationContext = {
        currentYear: year,
        previousYear: previousYear,
        currentMetrics: {
          revenue: currentReport.revenue,
          netProfit: currentReport.netProfit,
          totalAssets: currentReport.totalAssets,
          totalLiabilities: currentReport.totalLiabilities,
          equity: currentReport.equity,
          eps: currentReport.eps,
          grossProfit: currentReport.grossProfit,
          operatingIncome: currentReport.operatingIncome,
          currentAssets: currentReport.currentAssets,
          currentLiabilities: currentReport.currentLiabilities,
          inventory: currentReport.inventory,
          costOfGoodsSold: currentReport.costOfGoodsSold,
        },
        previousMetrics: previousReport ? {
          revenue: previousReport.revenue,
          netProfit: previousReport.netProfit,
          totalAssets: previousReport.totalAssets,
          totalLiabilities: previousReport.totalLiabilities,
          equity: previousReport.equity,
          eps: previousReport.eps,
          grossProfit: previousReport.grossProfit,
          operatingIncome: previousReport.operatingIncome,
          currentAssets: previousReport.currentAssets,
          currentLiabilities: previousReport.currentLiabilities,
          inventory: previousReport.inventory,
          costOfGoodsSold: previousReport.costOfGoodsSold,
        } : undefined,
      };

      // Calculate all ratios
      const ratios = this.calculateAllRatios(context);

      // Store calculated ratios in database
      await this.storeRatios(currentReport.id, ratios);

      logger.info({
        action: 'financial_ratios_calculated',
        companyId,
        year,
        ratiosCount: Object.keys(ratios).filter(key => ratios[key as keyof FinancialRatios] !== undefined).length,
      });

      return ratios;
    } catch (error: any) {
      logger.error({
        action: 'calculate_company_ratios_error',
        companyId,
        year,
        error: error.message,
      });
      throw createError('Failed to calculate financial ratios', 500);
    }
  }

  /**
   * Store calculated ratios in database
   */
  private static async storeRatios(reportId: string, ratios: FinancialRatios): Promise<void> {
    try {
      await prisma.financialReport.update({
        where: { id: reportId },
        data: {
          roe: ratios.roe,
          debtRatio: ratios.debtRatio,
          profitMargin: ratios.profitMargin,
          epsGrowth: ratios.epsGrowth,
          currentRatio: ratios.currentRatio,
          quickRatio: ratios.quickRatio,
          grossMargin: ratios.grossMargin,
          operatingMargin: ratios.operatingMargin,
          returnOnAssets: ratios.returnOnAssets,
          assetTurnover: ratios.assetTurnover,
          inventoryTurnover: ratios.inventoryTurnover,
          updatedAt: new Date(),
        },
      });

      logger.info({
        action: 'financial_ratios_stored',
        reportId,
        ratiosCount: Object.keys(ratios).filter(key => ratios[key as keyof FinancialRatios] !== undefined).length,
      });
    } catch (error: any) {
      logger.error({
        action: 'store_ratios_error',
        reportId,
        error: error.message,
      });
      throw createError('Failed to store financial ratios', 500);
    }
  }

  /**
   * Get financial ratios for a company
   */
  static async getCompanyRatios(
    companyId: string,
    startYear?: number,
    endYear?: number,
    limit: number = 10
  ): Promise<Array<{ year: number; ratios: FinancialRatios }>> {
    try {
      const where: any = { companyId };
      
      if (startYear && endYear) {
        where.year = {
          gte: startYear,
          lte: endYear,
        };
      } else if (startYear) {
        where.year = { gte: startYear };
      } else if (endYear) {
        where.year = { lte: endYear };
      }

      const reports = await prisma.financialReport.findMany({
        where,
        orderBy: { year: 'desc' },
        take: limit,
        select: {
          id: true,
          year: true,
          roe: true,
          debtRatio: true,
          profitMargin: true,
          epsGrowth: true,
          currentRatio: true,
          quickRatio: true,
          grossMargin: true,
          operatingMargin: true,
          returnOnAssets: true,
          assetTurnover: true,
          inventoryTurnover: true,
          priceToBookRatio: true,
          priceToEarningsRatio: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      return reports.map((report: any) => ({
        year: report.year,
        ratios: {
          roe: report.roe,
          debtRatio: report.debtRatio,
          profitMargin: report.profitMargin,
          epsGrowth: report.epsGrowth,
          currentRatio: report.currentRatio,
          quickRatio: report.quickRatio,
          grossMargin: report.grossMargin,
          operatingMargin: report.operatingMargin,
          returnOnAssets: report.returnOnAssets,
          assetTurnover: report.assetTurnover,
          inventoryTurnover: report.inventoryTurnover,
          priceToBookRatio: report.priceToBookRatio,
          priceToEarningsRatio: report.priceToEarningsRatio,
        },
      }));
    } catch (error: any) {
      logger.error({
        action: 'get_company_ratios_error',
        companyId,
        error: error.message,
      });
      throw createError('Failed to get company ratios', 500);
    }
  }

  /**
   * Get ratio analysis for a company
   */
  static async getRatioAnalysis(
    companyId: string,
    year: number
  ): Promise<RatioAnalysis> {
    try {
      // Get ratios for the specified year
      const ratios = await this.getCompanyRatios(companyId, year, year, 1);

      if (ratios.length === 0) {
        throw createError(`No financial data found for year ${year}`, 404);
      }

      const latestRatios = ratios[0].ratios;
      
      // Analyze ratios
      const analysis = this.analyzeRatios(latestRatios);

      return {
        ratios: latestRatios,
        analysis: analysis.analysis,
        recommendations: analysis.recommendations,
        warnings: analysis.warnings,
      };
    } catch (error: any) {
      logger.error({
        action: 'get_ratio_analysis_error',
        companyId,
        year,
        error: error.message,
      });
      throw createError('Failed to get ratio analysis', 500);
    }
  }

  /**
   * Validate ratio values
   */
  static validateRatio(value: number, ratioType: string): boolean {
    const ranges: Record<string, { min: number; max: number }> = {
      roe: { min: -100, max: 1000 },
      debtRatio: { min: 0, max: 100 },
      profitMargin: { min: -100, max: 100 },
      currentRatio: { min: 0, max: 100 },
      quickRatio: { min: 0, max: 100 },
      grossMargin: { min: -100, max: 100 },
      operatingMargin: { min: -100, max: 100 },
      returnOnAssets: { min: -100, max: 100 },
      assetTurnover: { min: 0, max: 10 },
      inventoryTurnover: { min: 0, max: 20 },
      priceToBookRatio: { min: 0.1, max: 50 },
      priceToEarningsRatio: { min: 1, max: 100 },
    };

    const range = ranges[ratioType];
    return value !== null && value >= range.min && value <= range.max;
  }

  /**
   * Format ratio for display
   */
  static formatRatio(value: number, decimalPlaces: number = 2): string {
    if (value === null || value === undefined) return 'N/A';
    
    if (value === 0) return '0.00';
    
    return value.toFixed(decimalPlaces);
  }

  /**
   * Get ratio color coding for UI display
   */
  static getRatioColor(value: number, ratioType: string): string {
    if (value === null || value === undefined) return 'text-gray-500';
    
    const ranges: Record<string, { excellent: [number, number]; good: [number, number]; average: [number, number]; poor: [number, number]; critical: [number, number] }> = {
      roe: { excellent: [20, 1000], good: [15, 20], average: [10, 15], poor: [5, 10], critical: [-1000, 5] },
      debtRatio: { excellent: [0, 0.3], good: [0.3, 0.5], average: [0.5, 0.7], poor: [0.7, 1.0], critical: [1.0, 100] },
      profitMargin: { excellent: [20, 1000], good: [15, 20], average: [10, 15], poor: [5, 10], critical: [-1000, 5] },
      currentRatio: { excellent: [2.5, 1000], good: [1.5, 2.5], average: [1.0, 1.5], poor: [0.5, 1.0], critical: [0, 0.5] },
    };

    const range = ranges[ratioType];
    
    if (value === null || value === undefined) return 'text-gray-500';
    
    if (value >= range.excellent[0]) return 'text-green-600';
    if (value >= range.good[0]) return 'text-blue-600';
    if (value >= range.average[0]) return 'text-yellow-600';
    if (value >= range.poor[0]) return 'text-orange-600';
    return 'text-red-600';
  }
}

export default FinancialRatioService;
