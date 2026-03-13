/**
 * FinSathi AI - Company Analysis Service
 * Business logic layer for company financial analysis
 */

const { calculateFinancialRatios, calculateFinancialHealthScore } = require('../utils/financialRatios');
const { normalizeFinancialData } = require('../utils/financialNormalization');

class CompanyAnalysisService {
  constructor(repository) {
    this.repository = repository;
  }

  /**
   * Get comprehensive company analysis
   * @param {string} symbol - Company stock symbol
   * @param {Object} options - Analysis options
   * @returns {Promise<Object>} Comprehensive company analysis
   */
  async getCompanyAnalysis(symbol, options = {}) {
    const {
      includeHistoricalData = false,
      yearsOfHistory = 5,
      industry = null,
      benchmarkAgainstIndustry = true,
      weightingStrategy = 'BALANCED',
    } = options;

    try {
      // Get company data
      const company = includeHistoricalData 
        ? await this.repository.getCompanyWithHistory(symbol)
        : await this.repository.getCompanyBySymbol(symbol);

      if (!company) {
        throw new Error(`Company with symbol '${symbol}' not found`);
      }

      // Get latest financial data
      const latestReport = await this.repository.getLatestFinancialReport(company.id);
      if (!latestReport) {
        throw new Error(`No financial data available for ${symbol}`);
      }

      // Normalize financial data
      const normalizedData = normalizeFinancialData(latestReport, [
        'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'
      ]);

      // Calculate financial ratios
      const ratios = calculateFinancialRatios(normalizedData, {
        includeAdvancedRatios: true,
        industry: industry || company.sector,
        year: latestReport.year,
      });

      // Calculate financial health score
      const healthScore = calculateFinancialHealthScore({
        roe: ratios.ratios.returnOnEquity,
        debtRatio: ratios.ratios.debtToEquity,
        profitMargin: ratios.ratios.netProfitMargin,
        revenueGrowth: this.calculateRevenueGrowth(company.financialReports || []),
      }, {
        industry: industry || company.sector,
        weighting: weightingStrategy,
      });

      // Generate company summary
      const summary = this.generateCompanySummary(company, normalizedData, ratios);

      // Get industry comparison if requested
      let industryComparison = null;
      if (benchmarkAgainstIndustry && industry) {
        industryComparison = await this.getIndustryComparison(company, industry);
      }

      // Generate insights and recommendations
      const insights = this.generateInsights(ratios, healthScore, company);
      const recommendations = this.generateRecommendations(healthScore, ratios, industry);

      return {
        company: {
          id: company.id,
          symbol: company.symbol,
          name: company.name,
          sector: company.sector,
          listedYear: company.listedYear,
        },
        analysis: {
          period: {
            year: latestReport.year,
            fiscalYear: latestReport.year,
            dataDate: latestReport.createdAt,
          },
          financialData: normalizedData,
          ratios: ratios.ratios,
          healthScore,
          summary,
          insights,
          recommendations,
        },
        historicalData: includeHistoricalData ? company.financialReports : null,
        industryComparison,
        metadata: {
          analysisDate: new Date().toISOString(),
          dataQuality: this.assessDataQuality(normalizedData),
          industry: industry || company.sector,
          weightingStrategy,
        },
      };

    } catch (error) {
      throw new Error(`Company analysis failed for ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get peer comparison analysis
   * @param {string} symbol - Company symbol
   * @param {Array} peerSymbols - Array of peer company symbols
   * @returns {Promise<Object>} Peer comparison analysis
   */
  async getPeerComparison(symbol, peerSymbols) {
    try {
      // Get target company and peers
      const companies = await this.repository.getCompaniesBySymbols([symbol, ...peerSymbols]);
      
      const targetCompany = companies.find(c => c.symbol === symbol.toUpperCase());
      const peerCompanies = companies.filter(c => c.symbol !== symbol.toUpperCase());

      if (!targetCompany) {
        throw new Error(`Target company '${symbol}' not found`);
      }

      // Calculate health scores for all companies
      const analyses = companies.map(company => {
        const latestReport = company.latestFinancialData || company.financialReports[0];
        if (!latestReport) return null;

        const normalizedData = normalizeFinancialData(latestReport, [
          'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'
        ]);

        const ratios = calculateFinancialRatios(normalizedData);
        const healthScore = calculateFinancialHealthScore({
          roe: ratios.ratios.returnOnEquity,
          debtRatio: ratios.ratios.debtToEquity,
          profitMargin: ratios.ratios.netProfitMargin,
          revenueGrowth: 0, // Not available for snapshot comparison
        });

        return {
          symbol: company.symbol,
          name: company.name,
          healthScore: healthScore.score,
          category: healthScore.category,
          ratios: ratios.ratios,
        };
      }).filter(analysis => analysis !== null);

      // Rank companies by health score
      analyses.sort((a, b) => b.healthScore - a.healthScore);
      
      const targetAnalysis = analyses.find(a => a.symbol === symbol.toUpperCase());
      const rank = analyses.findIndex(a => a.symbol === symbol.toUpperCase()) + 1;
      const totalCompanies = analyses.length;

      return {
        target: targetAnalysis,
        peers: analyses.filter(a => a.symbol !== symbol.toUpperCase()),
        ranking: {
          rank,
          totalCompanies,
          percentile: ((totalCompanies - rank + 1) / totalCompanies * 100).toFixed(1),
        },
        comparison: {
          averageHealthScore: analyses.reduce((sum, a) => sum + a.healthScore, 0) / totalCompanies,
          topPerformer: analyses[0],
          bottomPerformer: analyses[analyses.length - 1],
        },
      };

    } catch (error) {
      throw new Error(`Peer comparison failed: ${error.message}`);
    }
  }

  /**
   * Get sector analysis
   * @param {string} sector - Sector name
   * @returns {Promise<Object>} Sector-wide analysis
   */
  async getSectorAnalysis(sector) {
    try {
      const companies = await this.repository.getCompaniesBySector(sector, 50);
      
      const analyses = [];
      
      for (const company of companies) {
        if (!company.latestFinancialData) continue;

        const normalizedData = normalizeFinancialData(company.latestFinancialData, [
          'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'
        ]);

        const ratios = calculateFinancialRatios(normalizedData);
        const healthScore = calculateFinancialHealthScore({
          roe: ratios.ratios.returnOnEquity,
          debtRatio: ratios.ratios.debtToEquity,
          profitMargin: ratios.ratios.netProfitMargin,
          revenueGrowth: 0,
        });

        analyses.push({
          symbol: company.symbol,
          name: company.name,
          healthScore: healthScore.score,
          category: healthScore.category,
          ratios: ratios.ratios,
        });
      }

      if (analyses.length === 0) {
        throw new Error(`No financial data available for sector: ${sector}`);
      }

      // Calculate sector statistics
      const healthScores = analyses.map(a => a.healthScore);
      const sectorStats = {
        totalCompanies: analyses.length,
        averageHealthScore: healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length,
        highestHealthScore: Math.max(...healthScores),
        lowestHealthScore: Math.min(...healthScores),
        strongCompanies: analyses.filter(a => a.category === 'STRONG').length,
        moderateCompanies: analyses.filter(a => a.category === 'MODERATE').length,
        riskyCompanies: analyses.filter(a => a.category === 'RISKY').length,
      };

      // Top and bottom performers
      analyses.sort((a, b) => b.healthScore - a.healthScore);
      
      return {
        sector,
        companies: analyses,
        statistics: sectorStats,
        topPerformers: analyses.slice(0, 5),
        bottomPerformers: analyses.slice(-5),
        analysisDate: new Date().toISOString(),
      };

    } catch (error) {
      throw new Error(`Sector analysis failed: ${error.message}`);
    }
  }

  /**
   * Calculate revenue growth from historical data
   * @param {Array} financialReports - Array of financial reports
   * @returns {number} Revenue growth percentage
   */
  calculateRevenueGrowth(financialReports) {
    if (financialReports.length < 2) return 0;

    // Sort by year
    const sortedReports = financialReports.sort((a, b) => a.year - b.year);
    
    // Get current and previous year
    const currentYear = sortedReports[0];
    const previousYear = sortedReports[1];

    if (!currentYear.revenue || !previousYear.revenue) return 0;

    const growth = ((currentYear.revenue - previousYear.revenue) / previousYear.revenue) * 100;
    return Math.round(growth * 100) / 100;
  }

  /**
   * Generate company summary
   * @param {Object} company - Company data
   * @param {Object} financialData - Normalized financial data
   * @param {Object} ratios - Calculated ratios
   * @returns {Object} Company summary
   */
  generateCompanySummary(company, financialData, ratios) {
    const { totalAssets, totalEquity, totalDebt } = financialData;
    
    return {
      marketPosition: {
        marketCap: totalEquity * 10, // Simplified market cap estimation
        bookValue: totalEquity,
        totalAssets,
        totalDebt,
        debtToAssets: totalDebt / totalAssets,
      },
      performance: {
        revenue: financialData.revenue,
        netProfit: financialData.netProfit,
        profitMargin: ratios.ratios.netProfitMargin,
        roe: ratios.ratios.returnOnEquity,
      },
      efficiency: {
        assetTurnover: ratios.ratios.assetTurnover,
        returnOnAssets: ratios.ratios.advanced?.returnOnAssets || null,
      },
    };
  }

  /**
   * Generate insights based on analysis
   * @param {Object} ratios - Calculated ratios
   * @param {Object} healthScore - Health score analysis
   * @param {Object} company - Company data
   * @returns {Array} Array of insights
   */
  generateInsights(ratios, healthScore, company) {
    const insights = [];

    // Health score insights
    if (healthScore.category === 'STRONG') {
      insights.push({
        type: 'STRENGTH',
        title: 'Strong Financial Health',
        description: `${company.name} demonstrates excellent financial stability and performance`,
        priority: 'HIGH',
      });
    } else if (healthScore.category === 'RISKY') {
      insights.push({
        type: 'CONCERN',
        title: 'Financial Health Concerns',
        description: `${company.name} shows signs of financial distress that require attention`,
        priority: 'HIGH',
      });
    }

    // Ratio-specific insights
    if (ratios.ratios.returnOnEquity > 15) {
      insights.push({
        type: 'STRENGTH',
        title: 'Exceptional Return on Equity',
        description: 'Company generates excellent returns for shareholders',
        priority: 'MEDIUM',
      });
    }

    if (ratios.ratios.debtToEquity > 2) {
      insights.push({
        type: 'CONCERN',
        title: 'High Debt Burden',
        description: 'Company may be over-leveraged, limiting financial flexibility',
        priority: 'HIGH',
      });
    }

    if (ratios.ratios.netProfitMargin > 15) {
      insights.push({
        type: 'STRENGTH',
        title: 'Strong Profit Margins',
        description: 'Company demonstrates effective cost management and pricing power',
        priority: 'MEDIUM',
      });
    }

    return insights;
  }

  /**
   * Generate recommendations based on analysis
   * @param {Object} healthScore - Health score analysis
   * @param {Object} ratios - Calculated ratios
   * @param {string} industry - Industry context
   * @returns {Array} Array of recommendations
   */
  generateRecommendations(healthScore, ratios, industry) {
    const recommendations = [];

    if (healthScore.category === 'RISKY') {
      recommendations.push({
        type: 'IMMEDIATE',
        title: 'Financial Restructuring Required',
        description: 'Consider operational review and cost optimization measures',
        priority: 'HIGH',
      });
    }

    if (ratios.ratios.debtToEquity > 1.5) {
      recommendations.push({
        type: 'FINANCIAL',
        title: 'Debt Optimization',
        description: 'Explore debt restructuring or equity infusion options',
        priority: 'MEDIUM',
      });
    }

    if (ratios.ratios.netProfitMargin < 5) {
      recommendations.push({
        type: 'OPERATIONAL',
        title: 'Margin Improvement',
        description: 'Review pricing strategy and implement cost control measures',
        priority: 'MEDIUM',
      });
    }

    // Industry-specific recommendations
    if (industry === 'BANKING' && ratios.ratios.assetTurnover < 0.1) {
      recommendations.push({
        type: 'STRATEGIC',
        title: 'Asset Utilization',
        description: 'Focus on improving loan portfolio turnover and fee income',
        priority: 'LOW',
      });
    }

    return recommendations;
  }

  /**
   * Get industry comparison data
   * @param {Object} company - Company data
   * @param {string} industry - Industry name
   * @returns {Promise<Object>} Industry comparison
   */
  async getIndustryComparison(company, industry) {
    try {
      const sectorCompanies = await this.repository.getCompaniesBySector(industry, 20);
      
      if (sectorCompanies.length < 3) {
        return null; // Not enough data for comparison
      }

      // Calculate industry averages
      const industryData = [];
      
      for (const sectorCompany of sectorCompanies) {
        if (!sectorCompany.latestFinancialData) continue;

        const normalizedData = normalizeFinancialData(sectorCompany.latestFinancialData, [
          'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'
        ]);

        const ratios = calculateFinancialRatios(normalizedData);
        
        industryData.push({
          roe: ratios.ratios.returnOnEquity,
          debtToEquity: ratios.ratios.debtToEquity,
          profitMargin: ratios.ratios.netProfitMargin,
          assetTurnover: ratios.ratios.assetTurnover,
        });
      }

      // Calculate industry averages
      const industryAverages = {
        roe: industryData.reduce((sum, d) => sum + d.roe, 0) / industryData.length,
        debtToEquity: industryData.reduce((sum, d) => sum + d.debtToEquity, 0) / industryData.length,
        profitMargin: industryData.reduce((sum, d) => sum + d.profitMargin, 0) / industryData.length,
        assetTurnover: industryData.reduce((sum, d) => sum + d.assetTurnover, 0) / industryData.length,
      };

      // Get company ratios for comparison
      const companyLatest = await this.repository.getLatestFinancialReport(company.id);
      const companyNormalized = normalizeFinancialData(companyLatest, [
        'revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'
      ]);
      const companyRatios = calculateFinancialRatios(companyNormalized);

      return {
        industry,
        companyAverages: industryAverages,
        companyPerformance: {
          roe: {
            company: companyRatios.ratios.returnOnEquity,
            industry: industryAverages.roe,
            percentile: this.calculatePercentile(companyRatios.ratios.returnOnEquity, industryData.map(d => d.roe)),
            performance: companyRatios.ratios.returnOnEquity > industryAverages.roe ? 'ABOVE_AVERAGE' : 'BELOW_AVERAGE',
          },
          debtToEquity: {
            company: companyRatios.ratios.debtToEquity,
            industry: industryAverages.debtToEquity,
            percentile: this.calculatePercentile(companyRatios.ratios.debtToEquity, industryData.map(d => d.debtToEquity)),
            performance: companyRatios.ratios.debtToEquity < industryAverages.debtToEquity ? 'ABOVE_AVERAGE' : 'BELOW_AVERAGE',
          },
          profitMargin: {
            company: companyRatios.ratios.netProfitMargin,
            industry: industryAverages.profitMargin,
            percentile: this.calculatePercentile(companyRatios.ratios.netProfitMargin, industryData.map(d => d.profitMargin)),
            performance: companyRatios.ratios.netProfitMargin > industryAverages.profitMargin ? 'ABOVE_AVERAGE' : 'BELOW_AVERAGE',
          },
        },
        totalCompanies: industryData.length,
      };

    } catch (error) {
      throw new Error(`Industry comparison failed: ${error.message}`);
    }
  }

  /**
   * Calculate percentile for a value in a dataset
   * @param {number} value - Value to calculate percentile for
   * @param {Array} dataset - Array of values to compare against
   * @returns {number} Percentile (0-100)
   */
  calculatePercentile(value, dataset) {
    const sortedDataset = dataset.sort((a, b) => a - b);
    const index = sortedDataset.indexOf(value);
    return (index / (sortedDataset.length - 1)) * 100;
  }

  /**
   * Assess data quality
   * @param {Object} financialData - Normalized financial data
   * @returns {Object} Data quality assessment
   */
  assessDataQuality(financialData) {
    const requiredFields = ['revenue', 'netProfit', 'totalAssets', 'totalEquity', 'totalDebt'];
    const availableFields = requiredFields.filter(field => 
      financialData[field] !== null && financialData[field] !== undefined
    );

    const completeness = (availableFields.length / requiredFields.length) * 100;
    
    let quality = 'EXCELLENT';
    if (completeness < 80) quality = 'POOR';
    else if (completeness < 100) quality = 'FAIR';

    return { completeness, quality };
  }
}

module.exports = CompanyAnalysisService;
