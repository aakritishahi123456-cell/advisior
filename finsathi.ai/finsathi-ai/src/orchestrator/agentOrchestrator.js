const { getPrisma } = require('../database/prismaClient');
const { MarketAgent } = require('../agents/marketAgent');
const { FinancialAgent } = require('../agents/financialAgent');
const { PortfolioAgent } = require('../agents/portfolioAgent');
const { InsightAgent } = require('../agents/insightAgent');
const { StrategyAgent } = require('../agents/strategyAgent');

function nowIso() {
  return new Date().toISOString();
}

function durationMs(startedAt) {
  return Date.now() - startedAt.getTime();
}

function normalizeAgentName(name) {
  return String(name || '')
    .trim()
    .toLowerCase()
    .replace(/[_\s-]+/g, '');
}

function isOkResult(result) {
  if (!result) return true;
  if (typeof result.ok === 'boolean') return result.ok;
  return true;
}

class AgentOrchestrator {
  constructor({ logger } = {}) {
    this.logger = logger;

    this.agents = {
      market: new MarketAgent({ logger }),
      financial: new FinancialAgent(),
      portfolio: new PortfolioAgent(),
      insight: new InsightAgent(),
      strategy: new StrategyAgent(),
    };

    this.pipeline = [
      { key: 'market', label: 'Market Data Agent' },
      { key: 'financial', label: 'Financial Analysis Agent' },
      { key: 'portfolio', label: 'Portfolio Intelligence Agent' },
      { key: 'insight', label: 'Insight Generation Agent' },
      { key: 'strategy', label: 'Strategy Simulation Agent' },
    ];
  }

  getAgentKeys() {
    return Object.keys(this.agents);
  }

  async runAgent(agentKey, { logger } = {}) {
    const key = normalizeAgentName(agentKey);
    const agent =
      this.agents[key] ||
      (key === 'marketdata' ? this.agents.market : null) ||
      (key === 'financialanalysis' ? this.agents.financial : null) ||
      (key === 'portfoliointelligence' ? this.agents.portfolio : null) ||
      (key === 'insightgeneration' ? this.agents.insight : null) ||
      (key === 'strategysimulation' ? this.agents.strategy : null);

    if (!agent) {
      const err = new Error(`Unknown agent: ${agentKey}`);
      err.statusCode = 400;
      throw err;
    }

    const startedAt = new Date();
    const log = logger || this.logger;
    log?.info?.({ agent: agent.name, orchestrator: true }, 'Agent run started');

    const result = await agent.run({ logger: log });

    log?.info?.(
      { agent: agent.name, orchestrator: true, ok: isOkResult(result), ms: durationMs(startedAt) },
      'Agent run completed'
    );

    return {
      agent: agent.name,
      key,
      ok: isOkResult(result),
      ms: durationMs(startedAt),
      result,
      timestamp: nowIso(),
    };
  }

  async runCycle({
    continueOnError = true,
    runStrategy = true,
    logger,
  } = {}) {
    const prisma = getPrisma();
    const log = logger || this.logger;
    const startedAt = new Date();

    const cycleLog = await prisma.pipelineLog.create({
      data: {
        pipelineType: 'AUTONOMOUS_AGENT_CYCLE',
        status: 'RUNNING',
        startedAt,
        details: {
          continueOnError,
          runStrategy,
          order: this.pipeline.map((s) => s.key),
        },
      },
    });

    const steps = [];
    let errors = 0;

    try {
      for (const step of this.pipeline) {
        if (!runStrategy && step.key === 'strategy') continue;

        try {
          const out = await this.runAgent(step.key, { logger: log });
          steps.push({ ...out, label: step.label });
          if (!out.ok) errors += 1;
        } catch (e) {
          errors += 1;
          steps.push({
            agent: step.label,
            key: step.key,
            ok: false,
            ms: null,
            error: e?.message || String(e),
            timestamp: nowIso(),
          });
          log?.error?.({ step: step.key, err: e?.message }, 'Cycle step failed');
          if (!continueOnError) break;
        }
      }

      const status = errors === 0 ? 'COMPLETED' : 'COMPLETED_WITH_ERRORS';
      await prisma.pipelineLog.update({
        where: { id: cycleLog.id },
        data: {
          status,
          completedAt: new Date(),
          metrics: {
            steps: steps.length,
            errors,
            ms: durationMs(startedAt),
          },
          details: {
            ...(cycleLog.details || {}),
            steps: steps.map((s) => ({
              key: s.key,
              ok: s.ok,
              ms: s.ms,
              timestamp: s.timestamp,
              ...(s.error ? { error: s.error } : {}),
            })),
          },
        },
      });

      return {
        ok: errors === 0,
        status,
        cycleId: cycleLog.id,
        steps,
        startedAt: startedAt.toISOString(),
        completedAt: new Date().toISOString(),
      };
    } catch (e) {
      await prisma.pipelineLog.update({
        where: { id: cycleLog.id },
        data: {
          status: 'FAILED',
          completedAt: new Date(),
          details: { ...(cycleLog.details || {}), error: e?.message || String(e) },
        },
      });
      throw e;
    }
  }
}

module.exports = { AgentOrchestrator };
