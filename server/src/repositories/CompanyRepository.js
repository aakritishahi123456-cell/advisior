import { BaseRepository } from './BaseRepository';

export class CompanyRepository extends BaseRepository {
  constructor() {
    super(prisma.company);
  }

  // Find company by symbol
  async findBySymbol(symbol, include = {}) {
    try {
      return await this.model.findUnique({
        where: { symbol: symbol.toUpperCase() },
        include,
      });
    } catch (error) {
      logger.error('Error finding company by symbol:', error);
      throw error;
    }
  }

  // Find companies by industry
  async findByIndustry(industry, options = {}) {
    return this.findMany(
      { industry },
      options
    );
  }

  // Search companies
  async searchCompanies(query, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
        include = {},
        filters = {},
      } = options;

      const where = {
        AND: [
          {
            OR: [
              { name: { contains: query, mode: 'insensitive' } },
              { symbol: { contains: query, mode: 'insensitive' } },
              { description: { contains: query, mode: 'insensitive' } },
            ],
          },
          { ...filters },
        ],
        deletedAt: null,
      };

      return this.findWithPagination(where, {
        page,
        limit,
        include,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      logger.error('Error searching companies:', error);
      throw error;
    }
  }

  // Get top companies by market cap
  async getTopCompaniesByMarketCap(limit = 10, include = {}) {
    try {
      return await this.model.findMany({
        where: { deletedAt: null },
        include,
        orderBy: { marketCap: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error getting top companies by market cap:', error);
      throw error;
    }
  }

  // Get companies with financial data
  async getCompaniesWithFinancialData(year, options = {}) {
    try {
      const {
        page = 1,
        limit = 10,
      } = options;

      return await this.model.findMany({
        where: {
          financialReports: {
            some: {
              year,
            },
          },
          deletedAt: null,
        },
        include: {
          financialReports: {
            where: { year },
            take: 1,
          },
        },
        orderBy: { name: 'asc' },
        skip: (page - 1) * limit,
        take: limit,
      });
    } catch (error) {
      logger.error('Error getting companies with financial data:', error);
      throw error;
    }
  }

  // Get company statistics
  async getCompanyStats() {
    try {
      const [
        totalCompanies,
        companiesByIndustry,
        companiesWithFinancialData,
        recentlyUpdated,
      ] = await Promise.all([
        this.count({ deletedAt: null }),
        this.model.groupBy({
          by: ['industry'],
          where: { deletedAt: null },
          _count: true,
        }),
        this.count({
          where: {
            financialReports: {
              some: {},
            },
            deletedAt: null,
          },
        }),
        this.count({
          where: {
            updatedAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
            },
            deletedAt: null,
          },
        }),
      ]);

      return {
        totalCompanies,
        companiesByIndustry,
        companiesWithFinancialData,
        recentlyUpdated,
        dataCoverage: totalCompanies > 0 ? (companiesWithFinancialData / totalCompanies) * 100 : 0,
      };
    } catch (error) {
      logger.error('Error getting company stats:', error);
      throw error;
    }
  }

  // Update company financial data
  async updateFinancialData(companyId, financialData) {
    try {
      return await this.transaction(async (tx) => {
        const company = await tx.company.findUnique({
          where: { id: companyId },
          include: { financialReports: true },
        });

        if (!company) {
          throw new Error('Company not found');
        }

        // Update or create financial report
        const existingReport = company.financialReports.find(
          report => report.year === financialData.year
        );

        if (existingReport) {
          return await tx.financialReport.update({
            where: { id: existingReport.id },
            data: financialData,
          });
        } else {
          return await tx.financialReport.create({
            data: {
              ...financialData,
              companyId,
              userId: company.userId, // Assuming userId is in company
            },
          });
        }
      });
    } catch (error) {
      logger.error('Error updating company financial data:', error);
      throw error;
    }
  }

  // Get companies by market cap range
  async getCompaniesByMarketCapRange(minCap, maxCap, options = {}) {
    try {
      return this.findMany(
        {
          marketCap: {
            gte: minCap,
            lte: maxCap,
          },
          deletedAt: null,
        },
        options
      );
    } catch (error) {
      logger.error('Error getting companies by market cap range:', error);
      throw error;
    }
  }

  // Get trending companies
  async getTrendingCompanies(limit = 10) {
    try {
      // This would typically be based on recent activity, mentions, or price changes
      // For now, return recently updated companies
      return await this.model.findMany({
        where: { deletedAt: null },
        include: {
          financialReports: {
            orderBy: { year: 'desc' },
            take: 1,
          },
        },
        orderBy: { updatedAt: 'desc' },
        take: limit,
      });
    } catch (error) {
      logger.error('Error getting trending companies:', error);
      throw error;
    }
  }

  // Get company with latest financial data
  async getCompanyWithLatestFinancialData(symbol) {
    try {
      return await this.model.findUnique({
        where: { symbol: symbol.toUpperCase() },
        include: {
          financialReports: {
            orderBy: { year: 'desc' },
            take: 1,
          },
        },
      });
    } catch (error) {
      logger.error('Error getting company with latest financial data:', error);
      throw error;
    }
  }

  // Get companies with AI reports
  async getCompaniesWithAIReports(year, options = {}) {
    try {
      return this.findMany(
        {
          aiReports: {
            some: {
              year,
            },
          },
          deletedAt: null,
        },
        {
          ...options,
          include: {
            aiReports: {
              where: { year },
              take: 1,
              orderBy: { createdAt: 'desc' },
            },
            ...options.include,
          },
        }
      );
    } catch (error) {
      logger.error('Error getting companies with AI reports:', error);
      throw error;
    }
  }

  // Check if symbol exists
  async symbolExists(symbol, excludeCompanyId = null) {
    try {
      const where = { symbol: symbol.toUpperCase() };
      if (excludeCompanyId) {
        where.id = { not: excludeCompanyId };
      }

      return await this.exists(where);
    } catch (error) {
      logger.error('Error checking symbol existence:', error);
      throw error;
    }
  }

  // Get companies by multiple symbols
  async getCompaniesBySymbols(symbols, include = {}) {
    try {
      return await this.model.findMany({
        where: {
          symbol: {
            in: symbols.map(s => s.toUpperCase()),
          },
          deletedAt: null,
        },
        include,
        orderBy: { name: 'asc' },
      });
    } catch (error) {
      logger.error('Error getting companies by symbols:', error);
      throw error;
    }
  }

  // Update company metadata
  async updateMetadata(companyId, metadata) {
    try {
      const allowedFields = ['description', 'website', 'industry', 'sector', 'marketCap', 'sharePrice'];
      const updateData = {};

      allowedFields.forEach(field => {
        if (metadata[field] !== undefined) {
          updateData[field] = metadata[field];
        }
      });

      return await this.model.update({
        where: { id: companyId },
        data: {
          ...updateData,
          updatedAt: new Date(),
        },
      });
    } catch (error) {
      logger.error('Error updating company metadata:', error);
      throw error;
    }
  }

  // Get companies with missing financial data for a year
  async getCompaniesWithMissingFinancialData(year, options = {}) {
    try {
      return this.findMany(
        {
          financialReports: {
            none: {
              year,
            },
          },
          deletedAt: null,
        },
        options
      );
    } catch (error) {
      logger.error('Error getting companies with missing financial data:', error);
      throw error;
    }
  }
}
