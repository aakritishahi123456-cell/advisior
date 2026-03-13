/**
 * FinSathi AI - Analytics Routes
 * Event tracking and analytics dashboard endpoints
 */

const express = require('express');
const EventTrackingService = require('../services/eventTrackingService');
const authMiddleware = require('../middleware/auth');

const router = express.Router();
const eventService = new EventTrackingService();

// Track event (client-side)
router.post('/track', async (req, res) => {
  try {
    const { eventType, action, metadata } = req.body;
    const userId = req.user?.id || req.body.userId;

    if (!userId || !eventType || !action) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        message: 'userId, eventType, and action are required'
      });
    }

    const event = await eventService.trackEvent(userId, eventType, action, metadata, req);

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error tracking event:', error);
    res.status(500).json({ success: false, error: 'Failed to track event' });
  }
});

// Track feature usage
router.post('/feature', authMiddleware, async (req, res) => {
  try {
    const { featureKey, action, metadata } = req.body;
    const userId = req.user.id;

    const event = await eventService.trackFeatureUsage(userId, featureKey, action, metadata, req);

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error tracking feature:', error);
    res.status(500).json({ success: false, error: 'Failed to track feature usage' });
  }
});

// Track loan simulation
router.post('/loan-simulation', authMiddleware, async (req, res) => {
  try {
    const { simulationData } = req.body;
    const userId = req.user.id;

    const event = await eventService.trackLoanSimulation(userId, simulationData, req);

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error tracking loan simulation:', error);
    res.status(500).json({ success: false, error: 'Failed to track simulation' });
  }
});

// Track company search
router.post('/search', authMiddleware, async (req, res) => {
  try {
    const { query, resultCount, filters } = req.body;
    const userId = req.user.id;

    const event = await eventService.trackCompanySearch(userId, query, resultCount, filters, req);

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error tracking search:', error);
    res.status(500).json({ success: false, error: 'Failed to track search' });
  }
});

// Track advisor query
router.post('/advisor', authMiddleware, async (req, res) => {
  try {
    const { queryType, query, responseTime } = req.body;
    const userId = req.user.id;

    const event = await eventService.trackAdvisorQuery(userId, queryType, query, responseTime, req);

    res.json({ success: true, data: event });
  } catch (error) {
    console.error('Error tracking advisor query:', error);
    res.status(500).json({ success: false, error: 'Failed to track query' });
  }
});

// Get user activity
router.get('/user/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit, offset, startDate, endDate, eventType } = req.query;

    const activity = await eventService.getUserActivity(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      startDate,
      endDate,
      eventType
    });

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error getting user activity:', error);
    res.status(500).json({ success: false, error: 'Failed to get activity' });
  }
});

// Get current user activity
router.get('/my-activity', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const { limit, offset, startDate, endDate, eventType } = req.query;

    const activity = await eventService.getUserActivity(userId, {
      limit: parseInt(limit) || 50,
      offset: parseInt(offset) || 0,
      startDate,
      endDate,
      eventType
    });

    res.json({ success: true, data: activity });
  } catch (error) {
    console.error('Error getting activity:', error);
    res.status(500).json({ success: false, error: 'Failed to get activity' });
  }
});

// Dashboard analytics (admin)
router.get('/dashboard', authMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    const analytics = await eventService.getDashboardAnalytics(parseInt(days) || 30);

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting dashboard:', error);
    res.status(500).json({ success: false, error: 'Failed to get dashboard' });
  }
});

// Feature analytics
router.get('/features', authMiddleware, async (req, res) => {
  try {
    const { startDate, endDate, groupBy } = req.query;
    const analytics = await eventService.getFeatureAnalytics({ startDate, endDate, groupBy });

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting feature analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get analytics' });
  }
});

// Loan simulation analytics
router.get('/loans', authMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    const analytics = await eventService.getLoanSimulationAnalytics(parseInt(days) || 30);

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting loan analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get loan analytics' });
  }
});

// Search analytics
router.get('/search', authMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    const analytics = await eventService.getSearchAnalytics(parseInt(days) || 30);

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting search analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get search analytics' });
  }
});

// Advisor analytics
router.get('/advisor', authMiddleware, async (req, res) => {
  try {
    const { days } = req.query;
    const analytics = await eventService.getAdvisorAnalytics(parseInt(days) || 30);

    res.json({ success: true, data: analytics });
  } catch (error) {
    console.error('Error getting advisor analytics:', error);
    res.status(500).json({ success: false, error: 'Failed to get advisor analytics' });
  }
});

module.exports = router;
