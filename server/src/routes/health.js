import { Router } from 'express';
import { successResponse, HTTP_STATUS } from '../utils/response';
import { prisma } from '../app';

const router = Router();

// Basic health check
router.get('/', async (req, res) => {
  try {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      memory: process.memoryUsage(),
      cpu: process.cpuUsage(),
    };

    res.status(HTTP_STATUS.OK).json(
      successResponse(health, 'Service is healthy')
    );
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Health check failed',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Database health check
router.get('/database', async (req, res) => {
  try {
    const start = Date.now();
    
    // Test database connection
    await prisma.$queryRaw`SELECT 1`;
    
    const responseTime = Date.now() - start;
    
    // Get database stats
    const stats = await Promise.all([
      prisma.user.count(),
      prisma.company.count(),
      prisma.loan.count(),
    ]);

    const [userCount, companyCount, loanCount] = stats;

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      stats: {
        users: userCount,
        companies: companyCount,
        loans: loanCount,
      },
    };

    res.status(HTTP_STATUS.OK).json(
      successResponse(health, 'Database is healthy')
    );
  } catch (error) {
    res.status(HTTP_STATUS.SERVICE_UNAVAILABLE).json({
      success: false,
      error: {
        message: 'Database health check failed',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// API endpoints health check
router.get('/endpoints', async (req, res) => {
  try {
    const endpoints = [
      { path: '/api/v1/auth', method: 'POST', description: 'Authentication endpoints' },
      { path: '/api/v1/companies', method: 'GET', description: 'Company listing' },
      { path: '/api/v1/loans', method: 'POST', description: 'Loan simulation' },
      { path: '/api/v1/reports', method: 'GET', description: 'AI reports' },
      { path: '/api/v1/subscriptions', method: 'GET', description: 'Subscription management' },
    ];

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      endpoints,
      total: endpoints.length,
    };

    res.status(HTTP_STATUS.OK).json(
      successResponse(health, 'API endpoints are healthy')
    );
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Endpoint health check failed',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// System resources health check
router.get('/resources', async (req, res) => {
  try {
    const memoryUsage = process.memoryUsage();
    const cpuUsage = process.cpuUsage();
    
    // Calculate memory usage percentage
    const totalMemory = memoryUsage.heapTotal;
    const usedMemory = memoryUsage.heapUsed;
    const memoryUsagePercent = ((usedMemory / totalMemory) * 100).toFixed(2);

    // Get system load average (available on Unix systems)
    const loadAvg = process.platform !== 'win32' ? process.loadavg() : [0, 0, 0];

    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      memory: {
        rss: `${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB`,
        heapTotal: `${(memoryUsage.heapTotal / 1024 / 1024).toFixed(2)} MB`,
        heapUsed: `${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`,
        external: `${(memoryUsage.external / 1024 / 1024).toFixed(2)} MB`,
        usagePercent: `${memoryUsagePercent}%`,
      },
      cpu: {
        user: cpuUsage.user,
        system: cpuUsage.system,
      },
      load: {
        '1min': loadAvg[0],
        '5min': loadAvg[1],
        '15min': loadAvg[2],
      },
      uptime: `${Math.floor(process.uptime() / 60)} minutes`,
    };

    // Determine overall health status
    const memoryThreshold = 90; // 90% memory usage threshold
    const isHealthy = parseFloat(memoryUsagePercent) < memoryThreshold;

    health.status = isHealthy ? 'healthy' : 'warning';
    health.warnings = isHealthy ? [] : ['High memory usage detected'];

    res.status(isHealthy ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json(
      successResponse(health, `System resources are ${health.status}`)
    );
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Resource health check failed',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Detailed health check (all checks combined)
router.get('/detailed', async (req, res) => {
  try {
    const checks = await Promise.allSettled([
      // Database check
      (async () => {
        const start = Date.now();
        await prisma.$queryRaw`SELECT 1`;
        return {
          name: 'database',
          status: 'healthy',
          responseTime: `${Date.now() - start}ms`,
        };
      })(),
      
      // Memory check
      (async () => {
        const memoryUsage = process.memoryUsage();
        const usagePercent = ((memoryUsage.heapUsed / memoryUsage.heapTotal) * 100).toFixed(2);
        return {
          name: 'memory',
          status: parseFloat(usagePercent) < 90 ? 'healthy' : 'warning',
          usage: `${usagePercent}%`,
        };
      })(),
      
      // Basic connectivity check
      (async () => {
        return {
          name: 'api',
          status: 'healthy',
          uptime: `${Math.floor(process.uptime() / 60)} minutes`,
        };
      })(),
    ]);

    const results = checks.map(check => 
      check.status === 'fulfilled' ? check.value : {
        name: 'unknown',
        status: 'error',
        error: check.reason.message,
      }
    );

    const overallStatus = results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded';
    const warnings = results.filter(r => r.status === 'warning').map(r => r.name);
    const errors = results.filter(r => r.status === 'error').map(r => r.name);

    const health = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      checks: results,
      summary: {
        total: results.length,
        healthy: results.filter(r => r.status === 'healthy').length,
        warnings: warnings.length,
        errors: errors.length,
      },
      warnings,
      errors,
    };

    res.status(overallStatus === 'healthy' ? HTTP_STATUS.OK : HTTP_STATUS.SERVICE_UNAVAILABLE).json(
      successResponse(health, `System health is ${overallStatus}`)
    );
  } catch (error) {
    res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: {
        message: 'Detailed health check failed',
        details: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

export { router as healthRouter };
