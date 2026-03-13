import { PrismaClient, FinancialReport, ReportType } from '@prisma/client';

export class FinancialReportRepository {
  private static prisma = new PrismaClient();

  static async create(reportData: {
    userId: string;
    title: string;
    reportType: ReportType;
    content?: string;
    fileUrl?: string;
    companyId?: string;
    year?: number;
    parsedData?: any;
  }): Promise<FinancialReport> {
    return this.prisma.financialReport.create({
      data: reportData,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: reportData.companyId ? {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        } : false
      }
    });
  }

  static async findMany(
    where: any,
    page: number = 1,
    limit: number = 10
  ): Promise<FinancialReport[]> {
    const skip = (page - 1) * limit;

    return this.prisma.financialReport.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
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
    return this.prisma.financialReport.count({
      where
    });
  }

  static async findById(reportId: string, userId: string): Promise<FinancialReport | null> {
    return this.prisma.financialReport.findFirst({
      where: {
        id: reportId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      }
    });
  }

  static async update(
    reportId: string,
    userId: string,
    updateData: Partial<{
      title: string;
      content: string;
      fileUrl: string;
      parsedData: any;
    }>
  ): Promise<FinancialReport> {
    return this.prisma.financialReport.update({
      where: {
        id: reportId,
        userId
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      }
    });
  }

  static async delete(reportId: string, userId: string): Promise<void> {
    await this.prisma.financialReport.delete({
      where: {
        id: reportId,
        userId
      }
    });
  }

  static async findByType(reportType: ReportType): Promise<FinancialReport[]> {
    return this.prisma.financialReport.findMany({
      where: {
        reportType
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async findByYear(year: number): Promise<FinancialReport[]> {
    return this.prisma.financialReport.findMany({
      where: {
        year
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async findByCompany(companyId: string): Promise<FinancialReport[]> {
    return this.prisma.financialReport.findMany({
      where: {
        companyId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async findRecent(userId: string, limit: number = 5): Promise<FinancialReport[]> {
    return this.prisma.financialReport.findMany({
      where: {
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
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
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<FinancialReport[]> {
    return this.prisma.financialReport.findMany({
      where: {
        userId,
        createdAt: {
          gte: startDate,
          lte: endDate
        }
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        },
        company: {
          select: {
            id: true,
            name: true,
            symbol: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
