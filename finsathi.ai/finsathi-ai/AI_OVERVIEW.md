# FinSathi AI (Backend) — AI/Agent Structure

## Core processes
- **API server**: `node src/server.js`
- **Cron scheduler** (in the API process): `finsathi.ai/finsathi-ai/src/scheduler/cronJobs.js`
- **Async queues** (optional): set `QUEUE_ENABLED=true` to enqueue jobs instead of running inline.

## Data pipelines (high level)
- **NEPSE market data**: `finsathi.ai/finsathi-ai/src/services/nepseService.js`
- **Fundamentals**: `finsathi.ai/finsathi-ai/src/pipelines/fundamentals/fundamentalsScraper.js`
- **Corporate actions**: `finsathi.ai/finsathi-ai/src/services/corporateActionsService.js`
- **News sentiment**: `finsathi.ai/finsathi-ai/src/services/newsService.js` + `finsathi.ai/finsathi-ai/src/agents/sentimentAgent.js`
- **Portfolio optimization**: `finsathi.ai/finsathi-ai/src/services/portfolioService.js`

## Workers (BullMQ)
Run as separate services for scale:
- `node marketDataWorker.js`
- `node fundamentalsWorker.js`
- `node newsWorker.js`
- `node analysisWorker.js`

## Monitoring
- Queue stats endpoint: `GET /api/v1/queues/stats`

