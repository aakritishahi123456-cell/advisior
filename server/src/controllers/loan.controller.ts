import { Request, Response } from 'express';
import { LoanService } from '../services/loan.service';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../middleware/auth.middleware';

export class LoanController {
  static createLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await LoanService.createLoan(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: loan,
      message: 'Loan application created successfully'
    });
  });

  static getUserLoans = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { page = 1, limit = 10, status } = req.query;
    const result = await LoanService.getUserLoans(
      req.user!.id, 
      Number(page), 
      Number(limit),
      status as string
    );
    res.json({
      success: true,
      data: result.loans,
      pagination: result.pagination,
      message: 'Loans retrieved successfully'
    });
  });

  static getLoanById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const loan = await LoanService.getLoanById(id, req.user!.id);
    res.json({
      success: true,
      data: loan,
      message: 'Loan retrieved successfully'
    });
  });

  static updateLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const loan = await LoanService.updateLoan(id, req.user!.id, req.body);
    res.json({
      success: true,
      data: loan,
      message: 'Loan updated successfully'
    });
  });

  static deleteLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    await LoanService.deleteLoan(id, req.user!.id);
    res.json({
      success: true,
      message: 'Loan deleted successfully'
    });
  });

  static simulateLoan = asyncHandler(async (req: AuthRequest, res: Response) => {
    const simulation = await LoanService.simulateLoan(req.body);
    res.json({
      success: true,
      data: {
        emi: simulation.emi,
        totalInterest: simulation.totalInterest,
        totalPayment: simulation.totalPayment
      },
      message: 'Loan simulation completed successfully'
    });
  });

  static simulateLoanWithSchedule = asyncHandler(async (req: AuthRequest, res: Response) => {
    const simulation = await LoanService.simulateLoan(req.body);
    res.json({
      success: true,
      data: simulation,
      message: 'Loan simulation with schedule completed successfully'
    });
  });

  static saveSimulation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await LoanService.saveSimulation(req.user!.id, req.body);
    res.status(201).json({
      success: true,
      data: loan,
      message: 'Loan simulation saved successfully'
    });
  });

  static compareLoans = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { loans } = req.body;
    const comparisons = await LoanService.compareLoans(loans);
    res.json({
      success: true,
      data: comparisons,
      message: 'Loan comparison completed successfully'
    });
  });

  static getSimulationHistory = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { limit = 10 } = req.query;
    const history = await LoanService.getSimulationHistory(req.user!.id, Number(limit));
    res.json({
      success: true,
      data: history,
      message: 'Simulation history retrieved successfully'
    });
  });

  static getLoanStatistics = asyncHandler(async (req: AuthRequest, res: Response) => {
    const statistics = await LoanService.getLoanStatistics(req.user!.id);
    res.json({
      success: true,
      data: statistics,
      message: 'Loan statistics retrieved successfully'
    });
  });

  static calculateAffordability = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { monthlyIncome, existingEMIs = 0 } = req.body;
    const affordability = LoanService.calculateAffordability(monthlyIncome, existingEMIs);
    res.json({
      success: true,
      data: affordability,
      message: 'Affordability calculation completed successfully'
    });
  });

  static quickEMICalculation = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { principal, interestRate, tenure } = req.body;
    const emi = LoanService.calculateEMIQuick(principal, interestRate, tenure);
    res.json({
      success: true,
      data: { emi },
      message: 'EMI calculation completed successfully'
    });
  });
}
