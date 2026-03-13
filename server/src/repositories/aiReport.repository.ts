import { PrismaClient, AIReport } from '@prisma/client';

export class AIReportRepository {
  private static prisma = new PrismaClient();

  static async create(reportData: {
    companyId?: string;
    financialReportId?: string;
    year?: number;
    analysisText: string;
    riskScore: number;
    analysisData?: any;
  }): Promise<AIReport> {
    return this.prisma.aiReport.create({
      data: reportData,
      include: {
        company: reportData.companyId ? {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        } : false,
        financialReport: reportData.financialReportId ? {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        } : false
      }
    });
  }

  static async findMany(
    where: any,
    page: number = 1,
    limit: number = 10
  ): Promise<AIReport[]> {
    const skip = (page - 1) * limit;

    return this.prisma.aiReport.findMany({
      where,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });
  }

  static async count(where: any): Promise<number> {
    return this.prisma.aiReport.count({
      where
    });
  }

  static async findById(reportId: string): Promise<AIReport | null> {
    return this.prisma.aiReport.findUnique({
      where: {
        id: reportId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      }
    });
  }

  static async findByCompany(companyId: string, limit: number = 10): Promise<AIReport[]> {
    return this.prisma.aiReport.findMany({
      where: {
        companyId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  static async findByFinancialReport(financialReportId: string): Promise<AIReport[]> {
    return this.prisma.aiReport.findMany({
      where: {
        financialReportId
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async findByYear(year: number): Promise<AIReport[]> {
    return this.prisma.aiReport.findMany({
      where: {
        year
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async findByRiskScore(minRisk: number, maxRisk: number): Promise<AIReport[]> {
    return this.prisma.aiReport.findMany({
      where: {
        riskScore: {
          gte: minRisk,
          lte: maxRisk
        }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        riskScore: 'asc'
      }
    });
  }

  static async getRecentReports(limit: number = 5): Promise<AIReport[]> {
    return this.prisma.aiReport.findMany({
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      take: limit
    });
  }

  static async getReportsByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<AIReport[]> {
    return this.prisma.aiReport.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async update(
    reportId: string,
    updateData: Partial<{
      analysisText: string;
      riskScore: number;
      analysisData: any;
    }>
  ): Promise<AIReport> {
    return this.prisma.aiReport.update({
      where: {
        id: reportId
      },
      data: updateData,
      include: {
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        },
        financialReport: {
          select: {
            id: true,
            title: true,
            reportType: true,
            createdAt: true
          }
        }
      }
    });
  }

  static async delete(reportId: string): Promise<void> {
    await this.prisma.aiReport.delete({
      where: {
        id: reportId
      }
    });
  }

  static async getRiskStatistics(): Promise<any> {
    const [lowRisk, mediumRisk, highRisk, total] = await Promise.all([
      this.prisma.aiReport.count({
        where: { riskScore: { lte: 3 } }
      }),
      this.prisma.aiReport.count({
        where: { riskScore: { gt: 3, lte: 6 } }
      }),
      this.prisma.aiReport.count({
        where: { riskScore: { gt: 6 } }
      }),
      this.prisma.aiReport.count()
    ]);

    return {
      lowRisk,
      mediumRisk,
      highRisk,
      total,
      lowRiskPercentage: total > 0 ? (lowRisk / total) * 100 : 0,
      mediumRiskPercentage: total > 0 ? (mediumRisk / total) * 100 : 0,
      highRiskPercentage: total > 0 ? (highRisk / total) * 100 : 0
    };
  }
}
