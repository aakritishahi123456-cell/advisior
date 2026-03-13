/**
 * FinSathi AI - Event Tracking Service
 * Track user behavior across all features
 */

const { PrismaClient } = require('@prisma/client');

class EventTrackingService {
  constructor() {
    this.prisma = new PrismaClient();
    this.eventTypes = {
      FEATURE_USAGE: 'feature_usage',
      LOAN_SIMULATION: 'loan_simulation',
      COMPANY_SEARCH: 'company_search',
      ADVISOR_QUERY: 'advisor_query',
      PAGE_VIEW: 'page_view',
      API_CALL: 'api_call',
      SUBSCRIPTION: 'subscription',
      PAYMENT: 'payment'
    };
  }

  /**
   * Track a generic event
   */
  async trackEvent(userId, eventType, action, metadata = {}, req = null) {
    try {
      const eventData = {
        userId,
        eventType,
        action,
        metadata,
        timestamp: new Date()
      };

      if (req) {
        eventData.ipAddress = req.ip || req.connection?.remoteAddress;
        eventData.userAgent = req.get('user-agent');
      }

      await this.prisma.usageAnalytics.create({
        data: {
          userId,
          featureKey: `${eventType}:${action}`,
          action,
          metadata,
          ipAddress: eventData.ipAddress,
          userAgent: eventData.userAgent
        }
      });

      return eventData;
    } catch (error) {
      console.error('Error tracking event:', error);
      return null;
    }
  }

  /**
   * Track feature usage
   */
  async trackFeatureUsage(userId, featureKey, action = 'USE', metadata = {}, req = null) {
    return this.trackEvent(userId, this.eventTypes.FEATURE_USAGE, action, {
      featureKey,
      ...metadata
    }, req);
  }

  /**
   * Track loan simulation
   */
  async trackLoanSimulation(userId, simulationData, req = null) {
    return this.trackEvent(userId, this.eventTypes.LOAN_SIMULATION, 'CREATE', {
      amount: simulationData.amount,
      rate: simulationData.rate,
      tenure: simulationData.tenure,
      emi: simulationData.emi
    }, req);
  }

  /**
   * Track company search
   */
  async trackCompanySearch(userId, query, resultCount, filters = {}, req = null) {
    return this.trackEvent(userId, this.eventTypes.COMPANY_SEARCH, 'SEARCH', {
      query,
      resultCount,
      filters,
      timestamp: new Date()
    }, req);
  }

  /**
   * Track advisor query
   */
  async trackAdvisorQuery(userId, queryType, query, responseTime, req = null) {
    return this.trackEvent(userId, this.eventTypes.ADVISOR_QUERY, 'QUERY', {
      queryType,
      query,
      responseTime,
      timestamp: new Date()
    }, req);
  }

  /**
   * Track page view
   */
  async trackPageView(userId, page, req = null) {
    return this.trackEvent(userId, this.eventTypes.PAGE_VIEW, 'VIEW', {
      page,
      timestamp: new Date()
    }, req);
  }

  /**
   * Get user activity timeline
   */
  async getUserActivity(userId, options = {}) {
    const { limit = 50, offset = 0, startDate, endDate, eventType } = options;

    try {
      const where = { userId };
      
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      if (eventType) {
        where.featureKey = { startsWith: eventType };
      }

      const events = await this.prisma.usageAnalytics.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
        skip: offset
      });

      return events;
    } catch (error) {
      console.error('Error getting user activity:', error);
      return [];
    }
  }

  /**
   * Get feature usage analytics
   */
  async getFeatureAnalytics(options = {}) {
    const { startDate, endDate, groupBy = 'day' } = options;

    try {
      const where = {};
      if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
      }

      const events = await this.prisma.usageAnalytics.findMany({
        where,
        select: {
          featureKey: true,
          action: true,
          timestamp: true,
          userId: true
        }
      });

      const analytics = {
        totalEvents: events.length,
        uniqueUsers: new Set(events.map(e => e.userId)).size,
        byFeature: {},
        byAction: {},
        timeline: {}
      };

      events.forEach(event => {
        const feature = event.featureKey.split(':')[0];
        
        analytics.byFeature[feature] = (analytics.byFeature[feature] || 0) + 1;
        analytics.byAction[event.action] = (analytics.byAction[event.action] || 0) + 1;

        const dateKey = this.getDateKey(event.timestamp, groupBy);
        analytics.timeline[dateKey] = (analytics.timeline[dateKey] || 0) + 1;
      });

      return analytics;
    } catch (error) {
      console.error('Error getting feature analytics:', error);
      return null;
    }
  }

  /**
   * Get dashboard data
   */
  async getDashboardAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const allEvents = await this.prisma.usageAnalytics.findMany({
        where: {
          timestamp: { gte: startDate }
        },
        select: {
          featureKey: true,
          action: true,
          timestamp: true,
          userId: true,
          metadata: true
        }
      });

      const featureUsage = {};
      const dailyUsage = {};
      const userEngagement = {};

      allEvents.forEach(event => {
        const feature = event.featureKey.split(':')[0];
        const date = event.timestamp.toISOString().split('T')[0];

        featureUsage[feature] = (featureUsage[feature] || 0) + 1;
        dailyUsage[date] = (dailyUsage[date] || 0) + 1;
        
        if (!userEngagement[event.userId]) {
          userEngagement[event.userId] = new Set();
        }
        userEngagement[event.userId].add(feature);
      });

      const topFeatures = Object.entries(featureUsage)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([feature, count]) => ({ feature, count }));

      return {
        period: `${days} days`,
        totalEvents: allEvents.length,
        uniqueUsers: Object.keys(userEngagement).length,
        avgEventsPerUser: (allEvents.length / Object.keys(userEngagement).length).toFixed(2),
        topFeatures,
        dailyUsage,
        engagementByFeature: Object.fromEntries(
          Object.entries(userEngagement).map(([user, features]) => [user, features.size])
        )
      };
    } catch (error) {
      console.error('Error getting dashboard analytics:', error);
      return null;
    }
  }

  /**
   * Get loan simulation analytics
   */
  async getLoanSimulationAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await this.prisma.usageAnalytics.findMany({
        where: {
          featureKey: { startsWith: 'loan_simulation' },
          timestamp: { gte: startDate }
        }
      });

      const analytics = {
        totalSimulations: events.length,
        uniqueUsers: new Set(events.map(e => e.userId)).size,
        avgAmount: 0,
        avgRate: 0,
        avgTenure: 0,
        byAmountRange: {},
        byTenure: {}
      };

      if (events.length > 0) {
        let totalAmount = 0, totalRate = 0, totalTenure = 0;

        events.forEach(event => {
          const metadata = event.metadata || {};
          totalAmount += metadata.amount || 0;
          totalRate += metadata.rate || 0;
          totalTenure += metadata.tenure || 0;

          const amountRange = this.getAmountRange(metadata.amount);
          analytics.byAmountRange[amountRange] = (analytics.byAmountRange[amountRange] || 0) + 1;
          analytics.byTenure[metadata.tenure] = (analytics.byTenure[metadata.tenure] || 0) + 1;
        });

        analytics.avgAmount = (totalAmount / events.length).toFixed(2);
        analytics.avgRate = (totalRate / events.length).toFixed(2);
        analytics.avgTenure = (totalTenure / events.length).toFixed(1);
      }

      return analytics;
    } catch (error) {
      console.error('Error getting loan analytics:', error);
      return null;
    }
  }

  /**
   * Get search analytics
   */
  async getSearchAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await this.prisma.usageAnalytics.findMany({
        where: {
          featureKey: { startsWith: 'company_search' },
          timestamp: { gte: startDate }
        },
        orderBy: { timestamp: 'desc' }
      });

      const searchTerms = {};
      const searchResults = {};
      const dailySearches = {};

      events.forEach(event => {
        const query = event.metadata?.query?.toLowerCase() || 'unknown';
        const resultCount = event.metadata?.resultCount || 0;
        const date = event.timestamp.toISOString().split('T')[0];

        searchTerms[query] = (searchTerms[query] || 0) + 1;
        searchResults[resultCount] = (searchResults[resultCount] || 0) + 1;
        dailySearches[date] = (dailySearches[date] || 0) + 1;
      });

      const topSearches = Object.entries(searchTerms)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([query, count]) => ({ query, count }));

      const zeroResultSearches = searchTerms['0'] || 0;

      return {
        totalSearches: events.length,
        uniqueUsers: new Set(events.map(e => e.userId)).size,
        topSearches,
        avgResultsPerSearch: (events.reduce((sum, e) => sum + (e.metadata?.resultCount || 0), 0) / events.length).toFixed(2),
        zeroResultRate: ((zeroResultSearches / events.length) * 100).toFixed(2) + '%',
        dailySearches
      };
    } catch (error) {
      console.error('Error getting search analytics:', error);
      return null;
    }
  }

  /**
   * Get advisor query analytics
   */
  async getAdvisorAnalytics(days = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const events = await this.prisma.usageAnalytics.findMany({
        where: {
          featureKey: { startsWith: 'advisor_query' },
          timestamp: { gte: startDate }
        }
      });

      const queryTypes = {};
      const responseTimes = [];
      const dailyQueries = {};

      events.forEach(event => {
        const queryType = event.metadata?.queryType || 'general';
        const responseTime = event.metadata?.responseTime || 0;

        queryTypes[queryType] = (queryTypes[queryType] || 0) + 1;
        if (responseTime > 0) responseTimes.push(responseTime);
        
        const date = event.timestamp.toISOString().split('T')[0];
        dailyQueries[date] = (dailyQueries[date] || 0) + 1;
      });

      const avgResponseTime = responseTimes.length > 0
        ? (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2)
        : 0;

      return {
        totalQueries: events.length,
        uniqueUsers: new Set(events.map(e => e.userId)).size,
        queryTypes,
        avgResponseTime,
        dailyQueries,
        popularQueryTypes: Object.entries(queryTypes)
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
      };
    } catch (error) {
      console.error('Error getting advisor analytics:', error);
      return null;
    }
  }

  /**
   * Helper: Get date key for grouping
   */
  getDateKey(date, groupBy) {
    const d = new Date(date);
    switch (groupBy) {
      case 'hour':
        return `${d.toISOString().split('T')[0]} ${d.getHours()}:00`;
      case 'month':
        return d.toISOString().slice(0, 7);
      default:
        return d.toISOString().split('T')[0];
    }
  }

  /**
   * Helper: Get amount range
   */
  getAmountRange(amount) {
    if (amount <= 100000) return '0-100K';
    if (amount <= 500000) return '100K-500K';
    if (amount <= 1000000) return '500K-1M';
    if (amount <= 5000000) return '1M-5M';
    return '5M+';
  }
}

module.exports = EventTrackingService;
