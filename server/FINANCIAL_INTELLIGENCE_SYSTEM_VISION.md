# FinSathi AI — Unified Financial Intelligence System

This document maps the “single AI system” architecture to concrete modules in this repo, so data collection, warehousing, analysis, and recommendations run as one platform.

## End-to-End Flow

Financial Data Sources → Data Collection Agents → Financial Data Warehouse → AI Analysis Engines → Recommendation Engine → Dashboard + AI Advisor

## Data Collection Agents (Automated)

### NEPSE Market Data Agent (Daily)
- Code: `server/src/jobs/nepse/*`
- Scheduler: `server/src/jobs/nepse/scheduler.ts`
- Worker: `server/src/workers/nepse-collector.worker.ts`
- Output tables (existing): `companies`, `prices`, `financials` (see `server/prisma/schema.prisma`)

### Nepal Loan Data Agent (Weekly)
- Scraper: `server/scripts/scrape-loan-products.py`
- Scheduler: `server/src/jobs/loanProducts/scheduler.ts`
- Worker: `server/src/workers/loan-products-scraper.worker.ts`
- Output table: `loan_products` (`server/prisma/migrations/003_loan_products.sql`)
- API: `GET /loans/compare` (also `GET /api/v1/loans/compare`)

### Financial News Agent (Next)
Planned:
- Tables: `news_articles`, `news_sentiment`
- Jobs: `server/src/jobs/news/*`
- Sentiment: rule-based → ML/LLM later (store scores + rationale)

## Financial Data Warehouse

Primary store: Postgres (Prisma models + SQL migrations).

Operational logging:
- `pipeline_logs` (already in `server/prisma/schema.prisma`) is used by agents to record RUNNING/COMPLETED/FAILED executions and metrics.

## AI Analysis Engines

### Portfolio Allocation Engine
- Python engine exists at: `server/python/portfolio_engine/*`
- Planned integration: expose it as a backend service method + queue job for scheduled/triggered runs.

### Loan Recommendation Engine
- Data layer: `loan_products`
- Compare endpoint: `GET /loans/compare` sorts banks by `interest_rate` and filters by amount/duration.

### Market Intelligence Engine
- Uses NEPSE daily data to compute indicators (MA/volatility/momentum) and store signals per symbol.

## Recommendation Engine

Combines:
- Market signals
- Loan comparisons
- User financial profile

Outputs:
- Portfolio weights
- Best loan options
- “AI insights” narrative

## Platform APIs

Already present in backend:
- Loans: `server/src/routes/loan.routes.ts`
- Portfolio routes: `server/src/routes/portfolio.recommend.routes.ts`
- Advisor chat: `server/src/routes/*advisor*` and `server/src/routes/api.v1.routes.ts`

## What’s Next (Implementation Roadmap)
1. Add a `news_articles` pipeline (RSS → dedupe → store → sentiment job).
2. Add a “signals” table + daily indicator computation job.
3. Wire portfolio engine to backend via a queue worker (on-demand + scheduled).
4. Build dashboard widgets in `apps/web` driven by these APIs.

