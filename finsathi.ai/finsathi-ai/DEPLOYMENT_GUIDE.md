# FinSathi AI (Backend) Production Deployment

This guide deploys the backend API, Redis queues, Postgres, and BullMQ workers.

## Prerequisites
- Docker + Docker Compose v2
- A Postgres database (managed or self-hosted)
- A Redis instance (managed or self-hosted)
- `DATABASE_URL`, `REDIS_URL`, `JWT_SECRET` configured

## Local production-like run
From `finsathi.ai/finsathi-ai`:
- Build and start: `docker compose up -d --build`
- API health: `GET http://localhost:5050/health`
- Queue stats: `GET http://localhost:5050/api/v1/queues/stats`

## Environment configuration
Recommended production env vars:
- `NODE_ENV=production`
- `JWT_SECRET=<strong random secret>`
- `JWT_REFRESH_SECRET=<optional, separate secret>`
- `CORS_ORIGINS=https://your-frontend.com`
- `ENFORCE_HTTPS=true` and `TRUST_PROXY=1` (behind a load balancer / reverse proxy)
- `REDIS_URL=redis://...`
- `DATABASE_URL=postgresql://...`
- `QUEUE_ENABLED=true` (cron enqueues jobs instead of running inline)
- `AUTH_ALLOW_REGISTER=false` (enable only when you want public registration)

## Database migrations
The container supports automatic migrations:
- Set `MIGRATE_ON_START=true` on a single service (default in `docker-compose.yml` for `api`).

## Worker services
Run at least these workers in production:
- `marketWorker.js`
- `fundamentalsWorker.js`
- `newsWorker.js`
- `analysisWorker.js`

## DigitalOcean (Droplet)
1. Provision a Droplet + attach a firewall (allow 22, 80, 443).
2. Install Docker + Docker Compose.
3. Copy `finsathi.ai/finsathi-ai/docker-compose.yml` and a `.env` to the server.
4. Run: `docker compose up -d --build`
5. Put Nginx/Caddy in front for HTTPS and set `TRUST_PROXY=1` + `ENFORCE_HTTPS=true`.

## AWS (ECS/Fargate)
- Build/push the image from `finsathi.ai/finsathi-ai/Dockerfile`.
- Use RDS Postgres + ElastiCache Redis.
- Create services: `api`, `worker-market`, `worker-fundamentals`, `worker-news`, `worker-analysis`.
- Configure health checks to `/health` and set secrets via AWS Secrets Manager.

## Railway
- Deploy Postgres + Redis plugins.
- Deploy the backend as a Docker service using `finsathi.ai/finsathi-ai/Dockerfile`.
- Add separate Railway services for each worker command:
  - `node marketWorker.js`, `node fundamentalsWorker.js`, `node newsWorker.js`, `node analysisWorker.js`

