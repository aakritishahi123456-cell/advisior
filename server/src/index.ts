import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import dotenv from 'dotenv';

import { errorHandler } from './middleware/errorHandler';
import { checkTokenBlacklist } from './middleware/tokenBlacklist.middleware';
import { generalLimiter } from './middleware/rateLimiter.middleware';
import { connectRedis } from './config/redis';
import { queueManager } from './queues/queueManager';
import { workerManager } from './workers/workerManager';
import { ensureNepseCollectorScheduled } from './jobs/nepse/scheduler';
import { ensureLoanProductsScraperScheduled } from './jobs/loanProducts/scheduler';

// Routes
import authRoutes from './routes/auth.routes';
import loanRoutes from './routes/loan.routes';
import financialReportRoutes from './routes/financialReport.routes';
import usageRoutes from './routes/usage.routes';
import reportParserRoutes from './routes/reportParser.routes';
import portfolioRecommendRoutes from './routes/portfolio.recommend.routes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Global Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(compression());
app.use(morgan('combined'));
app.use(generalLimiter);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Token blacklist check (applies to all routes)
app.use('/api/v1', checkTokenBlacklist);

// Health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    success: true,
    status: 'OK', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: '1.0.0'
  });
});

// Queue status endpoint
app.get('/api/v1/queues/status', async (req, res) => {
  try {
    const stats = await queueManager.getAllQueueStats();
    const workerStatus = workerManager.getWorkerStatus();
    
    res.json({
      success: true,
      data: {
        queues: stats,
        workers: workerStatus,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get queue status'
    });
  }
});

// API Routes with versioning
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/loans', loanRoutes);
app.use('/api/v1/reports', financialReportRoutes);
app.use('/api/v1/usage', usageRoutes);
app.use('/api/v1/reports', reportParserRoutes);
app.use('/api/v1/portfolio', portfolioRecommendRoutes);

// Backwards-compatible (non-versioned) loan comparison endpoint
// Supports: GET /loans/compare
app.use('/loans', loanRoutes);

// Error handling (must be last)
app.use(errorHandler);

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

async function startServer() {
  try {
    // Connect to Redis
    await connectRedis();
    
    // Initialize queues
    await queueManager.initialize();
    
    // Initialize workers
    await workerManager.initialize();

    // Schedule NEPSE collector repeat job
    await ensureNepseCollectorScheduled();

    // Schedule loan products scraper repeat job
    await ensureLoanProductsScraperScheduled();

    app.listen(PORT, () => {
      console.log(`🚀 FinSathi AI API Server running on port ${PORT}`);
      console.log(`📝 Environment: ${process.env.NODE_ENV}`);
      console.log(`🔗 API URL: http://localhost:${PORT}/api/v1`);
      console.log('✅ Modular API architecture initialized');
      console.log('🔄 BullMQ job queues and workers initialized');
      console.log('💳️ Freemium feature gating system active');
      console.log('📄 NEPSE PDF parser system active');
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  await queueManager.shutdown();
  await workerManager.shutdown();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Shutting down server...');
  await queueManager.shutdown();
  await workerManager.shutdown();
  process.exit(0);
});

startServer();

export default app;
