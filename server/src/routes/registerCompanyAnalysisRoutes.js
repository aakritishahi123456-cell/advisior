/**
 * FinSathi AI - Company Analysis Route Registration
 * Register company analysis routes with Express app
 */

const companyAnalysisRoutes = require('./companyAnalysisRoutes');

/**
 * Register company analysis routes
 * @param {Object} app - Express app instance
 */
const registerCompanyAnalysisRoutes = (app) => {
  // Register all company analysis routes
  companyAnalysisRoutes.forEach(route => {
    app[route.method.toLowerCase()](route.path, route.handler);
  });

  console.log('✅ Company analysis routes registered');
  console.log('   GET /v1/companies/:symbol/report');
  console.log('   GET /v1/companies/:symbol/peers');
  console.log('   GET /v1/sectors/:sector/analysis');
  console.log('   GET /v1/companies/search');
  console.log('   GET /v1/industries');
};

module.exports = { registerCompanyAnalysisRoutes };
