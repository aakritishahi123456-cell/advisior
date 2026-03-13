/**
 * FinSathi AI - Financial Advisor Routes
 * API routes for complete financial planning
 */

const express = require('express');
const FinancialAdvisorController = require('../controllers/financialAdvisorController');

const router = express.Router();
const controller = new FinancialAdvisorController();

/**
 * @route POST /v1/advisor/plan
 * @description Generate complete financial plan
 * @access Private
 * @param {Object} req.body - User financial profile
 * @param {number} req.body.age - User age (18-100)
 * @param {number} req.body.monthlyIncome - Monthly income in NPR
 * @param {number} req.body.monthlyExpenses - Monthly expenses in NPR
 * @param {number} req.body.currentSavings - Current savings in NPR
 * @param {number} [req.body.investmentHorizonYears] - Investment horizon in years
 * @param {Array} [req.body.financialGoals] - Array of financial goals
 * @param {number} [req.body.questionnaireScore] - Risk questionnaire score (0-100)
 * @param {number} [req.body.totalDebt] - Total debt amount
 * @param {string} [req.body.employmentStability] - Employment stability (0-1)
 * @param {string} [req.body.investmentExperience] - Investment experience level
 * @returns {Object} Complete financial plan
 */
router.post('/plan', controller.generateFinancialPlan.bind(controller));

/**
 * @route POST /v1/advisor/risk-profile
 * @description Generate risk profile only
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Risk profile analysis
 */
router.post('/risk-profile', controller.getRiskProfile.bind(controller));

/**
 * @route POST /v1/advisor/investment-plans
 * @description Calculate investment plans for goals
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Investment plans and analysis
 */
router.post('/investment-plans', controller.getInvestmentPlans.bind(controller));

/**
 * @route POST /v1/advisor/portfolio-allocation
 * @description Get portfolio allocation recommendations
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Portfolio allocation analysis
 */
router.post('/portfolio-allocation', controller.getPortfolioAllocation.bind(controller));

/**
 * @route POST /v1/advisor/top-companies
 * @description Get top recommended companies
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Top companies analysis
 */
router.post('/top-companies', controller.getTopCompanies.bind(controller));

/**
 * @route POST /v1/advisor/investment-strategy
 * @description Generate AI investment strategy
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Investment strategy document
 */
router.post('/investment-strategy', controller.getInvestmentStrategy.bind(controller));

/**
 * @route POST /v1/advisor/financial-health
 * @description Calculate financial health score
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Financial health analysis
 */
router.post('/financial-health', controller.getFinancialHealth.bind(controller));

/**
 * @route POST /v1/advisor/validate
 * @description Validate user profile input
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Validation result
 */
router.post('/validate', controller.validateProfile.bind(controller));

/**
 * @route POST /v1/advisor/summary
 * @description Get lightweight plan summary
 * @access Private
 * @param {Object} req.body - User financial profile
 * @returns {Object} Plan summary
 */
router.post('/summary', controller.getPlanSummary.bind(controller));

// Middleware for request validation
router.use((req, res, next) => {
  // Add request timestamp
  req.requestTime = new Date().toISOString();
  
  // Log request (in production, use proper logging)
  if (process.env.NODE_ENV === 'development') {
    console.log(`${req.method} ${req.path} - ${req.requestTime}`);
  }
  
  next();
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Route error:', error);
  
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    code: 'ROUTE_ERROR',
    details: process.env.NODE_ENV === 'development' ? error.message : undefined,
  });
});

module.exports = router;
