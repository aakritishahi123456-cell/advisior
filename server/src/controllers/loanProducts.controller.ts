import { Response } from 'express';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';
import { LoanProductsService, normalizeLoanType } from '../services/loanProducts.service';

export class LoanProductsController {
  static compare = asyncHandler(async (req: AuthRequest, res: Response) => {
    const query = req.query as any;

    let loanType: ReturnType<typeof normalizeLoanType>;
    try {
      loanType = normalizeLoanType(String(query.loan_type));
    } catch (error: any) {
      throw createError(error?.message || 'Invalid loan type', 400);
    }
    const loanAmount = query.loan_amount !== undefined ? Number(query.loan_amount) : undefined;
    const durationMonths = query.duration !== undefined ? Number(query.duration) : undefined;
    const limit = query.limit !== undefined ? Number(query.limit) : undefined;

    const results = await LoanProductsService.compare({
      loanType,
      loanAmount,
      durationMonths,
      limit,
    });

    res.json({
      success: true,
      data: results,
      message: 'Loan products compared successfully',
    });
  });
}
