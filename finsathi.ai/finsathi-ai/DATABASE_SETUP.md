# FinSathi AI (Backend) — Database Setup

This backend uses **PostgreSQL + Prisma (Prisma 7 config via `prisma.config.ts`)**.

## Option A: Docker (recommended)
From `finsathi.ai/finsathi-ai`:
- Start Postgres + Redis + API + workers: `docker compose up -d --build`
- The API container runs migrations automatically (`MIGRATE_ON_START=true`).

## Option B: Local Postgres
1) Create a database (example):
- `createdb finsathi`

2) Configure env:
- Copy `finsathi.ai/finsathi-ai/.env.example` → `finsathi.ai/finsathi-ai/.env`
- Set `DATABASE_URL=postgresql://user:pass@localhost:5432/finsathi`

3) Install deps + generate Prisma client:npm run pri
- `npm install`
- `npm run prisma:generate`

4) Run migrations:
- `npm run prisma:migrate`

5) Start API:
- `npm start`

## Notes
- Prisma schema: `finsathi.ai/finsathi-ai/prisma/schema.prisma`
- Prisma config: `finsathi.ai/finsathi-ai/prisma.config.ts` (datasource URL is configured here in Prisma 7)
- If you run multiple instances, set `REDIS_URL` so rate limiting and BullMQ queues work across replicas.

