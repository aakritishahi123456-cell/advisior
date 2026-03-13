import { Router, Request, Response } from 'express';
import { enterpriseService } from '../../services/enterpriseService';
import { institutionalAnalyticsService } from '../../services/institutionalAnalyticsService';

const router = Router();

router.get('/plans', (req: Request, res: Response) => {
  const plans = enterpriseService.getPlans();
  res.json({ success: true, plans });
});

router.post('/clients', async (req: Request, res: Response) => {
  try {
    const client = await enterpriseService.createClient(req.body);
    res.json({ success: true, client });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to create client' });
  }
});

router.get('/clients/:id', (req: Request, res: Response) => {
  const client = enterpriseService.getClient(req.params.id);
  if (!client) {
    return res.status(404).json({ success: false, error: 'Client not found' });
  }
  res.json({ success: true, client });
});

router.post('/clients/:id/credentials', (req: Request, res: Response) => {
  const credentials = enterpriseService.generateAPIClientCredentials(req.params.id);
  res.json({ success: true, credentials });
});

router.post('/data-feeds', async (req: Request, res: Response) => {
  const { clientId } = req.body;
  const feed = await enterpriseService.createDataFeed(clientId, req.body);
  res.json({ success: true, feed });
});

router.post('/bulk-data', async (req: Request, res: Response) => {
  const { clientId } = req.body;
  const request = await enterpriseService.createBulkDataRequest(clientId, req.body);
  res.json({ success: true, request });
});

router.get('/bulk-data/:id/status', (req: Request, res: Response) => {
  res.json({
    success: true,
    status: 'ready',
    downloadUrl: '/downloads/bulk_data_123.csv',
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
  });
});

router.post('/dashboards', async (req: Request, res: Response) => {
  const { clientId } = req.body;
  const dashboard = await enterpriseService.createDashboard(clientId, req.body);
  res.json({ success: true, dashboard });
});

router.post('/alerts', async (req: Request, res: Response) => {
  const { clientId } = req.body;
  const alert = await enterpriseService.createAlert(clientId, req.body);
  res.json({ success: true, alert });
});

router.post('/reports', async (req: Request, res: Response) => {
  const { clientId } = req.body;
  const report = await enterpriseService.createCustomReport(clientId, req.body);
  res.json({ success: true, report });
});

router.get('/usage/:clientId', (req: Request, res: Response) => {
  const metrics = enterpriseService.getUsageMetrics(req.params.clientId);
  res.json({ success: true, metrics });
});

router.get('/analytics/portfolio/:id', (req: Request, res: Response) => {
  const analytics = institutionalAnalyticsService.calculatePortfolioAnalytics(
    { id: req.params.id },
    { id: 'benchmark' }
  );
  res.json({ success: true, analytics });
});

router.get('/analytics/returns/:id', (req: Request, res: Response) => {
  const returns = institutionalAnalyticsService.calculatePortfolioAnalytics(
    { id: req.params.id },
    {}
  ).returns;
  res.json({ success: true, returns });
});

router.get('/analytics/risk/:id', (req: Request, res: Response) => {
  const risk = institutionalAnalyticsService.calculateRiskAnalysis({ id: req.params.id });
  res.json({ success: true, risk });
});

router.get('/analytics/attribution/:id', (req: Request, res: Response) => {
  const attribution = institutionalAnalyticsService.calculatePerformanceAttribution(
    { id: req.params.id },
    { id: 'benchmark' },
    'ytd'
  );
  res.json({ success: true, attribution });
});

router.get('/analytics/exposure/:id', (req: Request, res: Response) => {
  const exposure = institutionalAnalyticsService.calculatePortfolioAnalytics(
    { id: req.params.id },
    {}
  ).exposure;
  res.json({ success: true, exposure });
});

router.post('/analytics/rebalance/:id', (req: Request, res: Response) => {
  const recommendations = institutionalAnalyticsService.generateRebalancingRecommendations({
    id: req.params.id,
  });
  res.json({ success: true, recommendations });
});

router.post('/analytics/var/:id', (req: Request, res: Response) => {
  const { method } = req.query;
  const varCalc = institutionalAnalyticsService.calculateVaR(
    { id: req.params.id },
    method as string || 'historical'
  );
  res.json({ success: true, var: varCalc });
});

router.post('/analytics/factor-model', (req: Request, res: Response) => {
  const { returns, factors } = req.body;
  const result = institutionalAnalyticsService.runFactorModel(returns, factors);
  res.json({ success: true, result });
});

router.get('/analytics/compliance/:id', (req: Request, res: Response) => {
  const report = institutionalAnalyticsService.generateComplianceReport({ id: req.params.id });
  res.json({ success: true, report });
});

router.get('/research', (req: Request, res: Response) => {
  res.json({
    success: true,
    reports: [
      {
        id: 'r1',
        title: 'Banking Sector Outlook Q1 2024',
        type: 'sector',
        publishedAt: '2024-01-15',
        authors: ['Research Team'],
        summary: 'Analysis of Nepalese banking sector performance and outlook',
        accessLevel: 'premium',
      },
      {
        id: 'r2',
        title: 'NBL Company Analysis',
        type: 'company',
        publishedAt: '2024-01-10',
        authors: ['Analyst Team'],
        summary: 'Deep dive into Nepal Bank Limited fundamentals',
        accessLevel: 'public',
      },
    ],
  });
});

export default router;
