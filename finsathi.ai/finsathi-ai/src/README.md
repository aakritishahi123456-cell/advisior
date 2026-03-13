# FinSathi Autonomous Financial Intelligence System (Backend)

Production-oriented backend layout for a **multi-agent** NEPSE intelligence platform.

## Key Concepts
- **Modules**: domain logic (market, analysis, portfolio, insights, simulation)
- **Agents**: scheduled/autonomous workers that collect + analyze and write to the warehouse
- **Warehouse**: PostgreSQL via Prisma
- **API**: Express routes under `/api/v1`
- **Scheduler**: `node-cron` triggers agents

## Entry Points
- App: `src/app.js`
- Server: `src/server.js`
- Scheduler: `src/jobs/scheduler.js`

## Folder Layout
- `src/api/` HTTP API (versioned)
- `src/agents/` autonomous agent implementations + registry
- `src/config/` env, logging, OpenAI, Prisma
- `src/db/` database client + repository helpers
- `src/jobs/` cron schedules and job runners
- `src/middleware/` auth, validation, rate-limits, error handling
- `src/modules/` domain modules (controller/service/repository)
- `src/utils/` shared helpers

