import { Router, Request, Response } from 'express';
import { researchSwarm, ResearchRequest, MarketIntelligenceReport } from '../../services/researchSwarmOrchestrator';

const router = Router();

router.post('/analyze', async (req: Request, res: Response) => {
  try {
    const { type, symbols, market, portfolio, constraints, period } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Analysis type is required' });
    }

    const request: ResearchRequest = {
      type,
      symbols,
      market,
      portfolio,
      constraints,
      period,
    };

    const report = await researchSwarm.executeResearch(request);

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Research swarm error:', error);
    res.status(500).json({ error: 'Failed to execute research' });
  }
});

router.post('/company', async (req: Request, res: Response) => {
  try {
    const { symbols, period } = req.body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return res.status(400).json({ error: 'Symbols array is required' });
    }

    const report = await researchSwarm.executeResearch({
      type: 'company',
      symbols,
      period,
    });

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Company analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze company' });
  }
});

router.post('/market', async (req: Request, res: Response) => {
  try {
    const { market, period } = req.body;

    const report = await researchSwarm.executeResearch({
      type: 'market',
      market: market || 'NEPSE',
      period,
    });

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Market analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze market' });
  }
});

router.post('/portfolio', async (req: Request, res: Response) => {
  try {
    const { portfolio, constraints } = req.body;

    if (!portfolio || !portfolio.holdings) {
      return res.status(400).json({ error: 'Portfolio with holdings is required' });
    }

    const report = await researchSwarm.executeResearch({
      type: 'portfolio',
      portfolio,
      constraints,
    });

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Portfolio analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze portfolio' });
  }
});

router.post('/comprehensive', async (req: Request, res: Response) => {
  try {
    const { symbols, market, portfolio, period } = req.body;

    const report = await researchSwarm.executeResearch({
      type: 'comprehensive',
      symbols,
      market,
      portfolio,
      period,
    });

    res.json({
      success: true,
      report,
    });
  } catch (error) {
    console.error('Comprehensive analysis error:', error);
    res.status(500).json({ error: 'Failed to generate comprehensive report' });
  }
});

router.get('/status', (req: Request, res: Response) => {
  const status = researchSwarm.getSwarmStatus();
  const metrics = researchSwarm.getAgentMetrics();

  res.json({
    success: true,
    status,
    metrics,
  });
});

router.get('/agents', (req: Request, res: Response) => {
  const agents = researchSwarm.getAllAgents().map(agent => ({
    id: agent.getId(),
    role: agent.getRole(),
    status: agent.getStatus(),
    metrics: agent.getMetrics(),
  }));

  res.json({
    success: true,
    agents,
  });
});

export default router;
