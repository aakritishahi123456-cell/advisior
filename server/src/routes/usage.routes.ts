import { Router } from 'express';
import { generalLimiter } from '../middleware/rateLimiter.middleware';
import { authenticateToken } from '../middleware/auth.middleware';
import { requirePro, requireFeature, apiRateLimit, trackUsage } from '../middleware/freemium.middleware';
import {
  getCurrentUsage,
  getUsageHistory,
  getUsageSummary,
  getUsageAlerts,
  exportUsageData,
  getUsageForecast,
  getAdminUsageStats,
  resetUserUsage,
  trackReportUsage,
  getUsageLimits,
} from '../controllers/usage.controller';

const router = Router();

// Apply authentication to all usage routes
router.use(authenticateToken);

// Apply rate limiting to API endpoints
router.use(apiRateLimit());

// Get current usage statistics
router.get('/current', getCurrentUsage);

// Get usage history
router.get('/history', getUsageHistory);

// Get usage summary for dashboard
router.get('/summary', getUsageSummary);

// Get usage alerts
router.get('/alerts', getUsageAlerts);

// Export usage data
router.get('/export', exportUsageData);

// Get usage forecast
router.get('/forecast', getUsageForecast);

// Get usage limits for current user
router.get('/limits', getUsageLimits);

// Admin routes
router.get('/admin/stats', getAdminUsageStats);
router.post('/admin/reset', resetUserUsage);

// Internal usage tracking (not exposed to public API)
router.post('/track-report', trackReportUsage);

export default router;
