import { PrismaClient, Loan, LoanStatus, LoanType } from '@prisma/client';

export class LoanRepository {
  private static prisma = new PrismaClient();

  static async create(loanData: {
    userId: string;
    principal: number;
    interestRate: number;
    tenure: number;
    emi: number;
    totalPayment: number;
    type: LoanType;
    status: LoanStatus;
  }): Promise<Loan> {
    return this.prisma.loanSimulation.create({
      data: loanData,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
  }

  static async findMany(
    where: any,
    page: number = 1,
    limit: number = 10
  ): Promise<Loan[]> {
    const skip = (page - 1) * limit;

    return this.prisma.loanSimulation.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            email: true
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
    return this.prisma.loanSimulation.count({
      where
    });
  }

  static async findById(loanId: string, userId: string): Promise<Loan | null> {
    return this.prisma.loanSimulation.findFirst({
      where: {
        id: loanId,
        userId
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
  }

  static async update(
    loanId: string,
    userId: string,
    updateData: Partial<{
      principal: number;
      interestRate: number;
      tenure: number;
      emi: number;
      totalPayment: number;
      type: LoanType;
    }>
  ): Promise<Loan> {
    return this.prisma.loanSimulation.update({
      where: {
        id: loanId,
        userId
      },
      data: updateData,
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
  }

  static async delete(loanId: string, userId: string): Promise<void> {
    await this.prisma.loanSimulation.delete({
      where: {
        id: loanId,
        userId
      }
    });
  }

  static async findByStatus(status: LoanStatus): Promise<Loan[]> {
    return this.prisma.loanSimulation.findMany({
      where: {
        status
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async findByType(type: LoanType): Promise<Loan[]> {
    return this.prisma.loanSimulation.findMany({
      where: {
        type
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }

  static async updateStatus(loanId: string, status: LoanStatus): Promise<Loan> {
    return this.prisma.loanSimulation.update({
      where: {
        id: loanId
      },
      data: {
        status
      },
      include: {
        user: {
          select: {
            id: true,
            email: true
          }
        }
      }
    });
  }

  static async getLoansByDateRange(
    userId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Loan[]> {
    return this.prisma.loanSimulation.findMany({
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
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
  }
}
