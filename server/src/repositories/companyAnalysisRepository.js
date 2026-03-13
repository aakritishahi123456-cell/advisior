/**
 * FinSathi AI - Company Analysis Repository
 * Data access layer for company financial analysis
 */

const { PrismaClient } = require('@prisma/client');

class CompanyAnalysisRepository {
  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Get company by symbol
   * @param {string} symbol - Company stock symbol
   * @returns {Promise<Object|null>} Company data
   */
  async getCompanyBySymbol(symbol) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { symbol: symbol.toUpperCase() },
        include: {
          financialReports: {
            orderBy: { year: 'desc' },
            take: 5, // Get last 5 years of data
          },
        },
      });

      if (!company) {
        return null;
      }

      return this.transformCompanyData(company);
    } catch (error) {
      throw new Error(`Failed to fetch company ${symbol}: ${error.message}`);
    }
  }

  /**
   * Get financial reports for a company
   * @param {string} companyId - Company ID
   * @param {number} years - Number of years to look back
   * @returns {Promise<Array>} Array of financial reports
   */
  async getFinancialReports(companyId, years = 3) {
    try {
      const reports = await this.prisma.financialReport.findMany({
        where: { companyId },
        orderBy: { year: 'desc' },
        take: years,
      });

      return reports.map(report => this.transformFinancialReport(report));
    } catch (error) {
      throw new Error(`Failed to fetch financial reports: ${error.message}`);
    }
  }

  /**
   * Get latest financial report for a company
   * @param {string} companyId - Company ID
   * @returns {Promise<Object|null>} Latest financial report
   */
  async getLatestFinancialReport(companyId) {
    try {
      const report = await this.prisma.financialReport.findFirst({
        where: { companyId },
        orderBy: { year: 'desc' },
      });

      return report ? this.transformFinancialReport(report) : null;
    } catch (error) {
      throw new Error(`Failed to fetch latest financial report: ${error.message}`);
    }
  }

  /**
   * Get company with historical analysis data
   * @param {string} symbol - Company stock symbol
   * @returns {Promise<Object|null>} Company with historical data
   */
  async getCompanyWithHistory(symbol) {
    try {
      const company = await this.prisma.company.findUnique({
        where: { symbol: symbol.toUpperCase() },
        include: {
          financialReports: {
            orderBy: { year: 'desc' },
            take: 10, // Get 10 years of historical data
          },
        },
      });

      if (!company) {
        return null;
      }

      return this.transformCompanyWithHistory(company);
    } catch (error) {
      throw new Error(`Failed to fetch company history ${symbol}: ${error.message}`);
    }
  }

  /**
   * Search companies by name or symbol
   * @param {string} query - Search query
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Array of matching companies
   */
  async searchCompanies(query, limit = 10) {
    try {
      const companies = await this.prisma.company.findMany({
        where: {
          OR: [
            { symbol: { contains: query.toUpperCase() } },
            { name: { contains: query, mode: 'insensitive' } },
          ],
        },
        take: limit,
        orderBy: { name: 'asc' },
      });

      return companies.map(company => ({
        id: company.id,
        symbol: company.symbol,
        name: company.name,
        sector: company.sector,
        listedYear: company.listedYear,
      }));
    } catch (error) {
      throw new Error(`Failed to search companies: ${error.message}`);
    }
  }

  /**
   * Transform company data for API response
   * @param {Object} company - Raw company data from Prisma
   * @returns {Object} Transformed company data
   */
  transformCompanyData(company) {
    return {
      id: company.id,
      symbol: company.symbol,
      name: company.name,
      sector: company.sector,
      listedYear: company.listedYear,
      createdAt: company.createdAt,
      updatedAt: company.updatedAt,
    };
  }

  /**
   * Transform financial report for API response
   * @param {Object} report - Raw financial report from Prisma
   * @returns {Object} Transformed financial report
   */
  transformFinancialReport(report) {
    return {
      id: report.id,
      year: report.year,
      revenue: report.revenue,
      netProfit: report.netProfit,
      totalAssets: report.totalAssets,
      totalEquity: report.totalEquity,
      totalDebt: report.totalDebt,
      createdAt: report.createdAt,
      updatedAt: report.updatedAt,
    };
  }

  /**
   * Transform company with historical data
   * @param {Object} company - Raw company data with financial reports
   * @returns {Object} Company with historical analysis
   */
  transformCompanyWithHistory(company) {
    const financialReports = company.financialReports.map(report => 
      this.transformFinancialReport(report)
    );

    return {
      ...this.transformCompanyData(company),
      financialReports,
      historicalData: {
        yearsAvailable: financialReports.length,
        latestYear: financialReports[0]?.year || null,
        earliestYear: financialReports[financialReports.length - 1]?.year || null,
      },
    };
  }

  /**
   * Get multiple companies by symbols
   * @param {Array} symbols - Array of company symbols
   * @returns {Promise<Array>} Array of companies
   */
  async getCompaniesBySymbols(symbols) {
    try {
      const companies = await this.prisma.company.findMany({
        where: {
          symbol: { in: symbols.map(s => s.toUpperCase()) },
        },
        include: {
          financialReports: {
            orderBy: { year: 'desc' },
            take: 3,
          },
        },
      });

      return companies.map(company => this.transformCompanyWithHistory(company));
    } catch (error) {
      throw new Error(`Failed to fetch companies: ${error.message}`);
    }
  }

  /**
   * Get companies by sector
   * @param {string} sector - Sector name
   * @param {number} limit - Result limit
   * @returns {Promise<Array>} Array of companies in sector
   */
  async getCompaniesBySector(sector, limit = 20) {
    try {
      const companies = await this.prisma.company.findMany({
        where: { sector: { contains: sector, mode: 'insensitive' } },
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          financialReports: {
            orderBy: { year: 'desc' },
            take: 1,
          },
        },
      });

      return companies.map(company => ({
        ...this.transformCompanyData(company),
        latestFinancialData: company.financialReports[0] ? 
          this.transformFinancialReport(company.financialReports[0]) : null,
      }));
    } catch (error) {
      throw new Error(`Failed to fetch companies by sector: ${error.message}`);
    }
  }

  /**
   * Close database connection
   */
  async disconnect() {
    await this.prisma.$disconnect();
  }
}

module.exports = CompanyAnalysisRepository;
