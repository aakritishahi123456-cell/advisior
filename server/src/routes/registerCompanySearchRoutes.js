/**
 * FinSathi AI - Company Search Route Registration
 * Register company search routes with Express app
 */

const companySearchRoutes = require('./companySearchRoutes_fixed');

/**
 * Register company search routes
 * @param {Object} app - Express app instance
 */
const registerCompanySearchRoutes = (app) => {
  // Register all company search routes
  companySearchRoutes.forEach(route => {
    app[route.method.toLowerCase()](route.path, route.handler);
  });

  console.log('✅ Company search routes registered');
  console.log('   GET /v1/companies');
  console.log('   GET /v1/companies/suggestions');
  console.log('   GET /v1/companies/popular-searches');
};

module.exports = { registerCompanySearchRoutes };
