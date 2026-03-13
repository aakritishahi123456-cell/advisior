# FinSathi AI - Deployment Guide

## Architecture Overview

```
                    ┌─────────────┐
                    │    Nginx    │
                    │  (Port 80)  │
                    └──────┬──────┘
                           │
            ┌───────────────┼───────────────┐
            │               │               │
            ▼               ▼               ▼
      ┌─────────┐    ┌─────────┐    ┌───────────┐
      │   Web   │    │  Server  │    │ Prometheus│
      │ (Next)  │    │  (Node)  │    │           │
      └────┬────┘    └────┬────┘    └─────┬─────┘
           │              │               │
           │              ▼               │
           │         ┌─────────┐          │
           │         │  Redis  │◄──────────┤
           │         └────┬────┘          │
           │              │               │
           │              ▼               │
           │         ┌─────────┐          │
           │         │Postgres │          │
           │         └─────────┘          │
           │              │               │
           └──────────────┼───────────────┘
                          ▼
                   ┌─────────────┐
                   │  Grafana   │
                   │ (Dashboards)│
                   └─────────────┘
```

## Prerequisites

- Docker & Docker Compose
- Node.js 18+
- PostgreSQL 15
- Redis 7

## Quick Start

### 1. Clone and Setup
```bash
git clone https://github.com/your-org/finsathi-ai.git
cd finsathi-ai

# Copy environment file
cp .env.production.example .env.production

# Edit with your values
nano .env.production
```

### 2. Deploy with Docker Compose
```bash
# Start all services
docker-compose -f docker-compose.production.yml up -d

# Check status
docker-compose -f docker-compose.production.yml ps

# View logs
docker-compose -f docker-compose.production.yml logs -f
```

### 3. Run Database Migrations
```bash
docker exec finsathi-server npx prisma migrate deploy
```

## Services

| Service | Port | Description |
|---------|------|-------------|
| Nginx | 80, 443 | Reverse proxy |
| Server | 3001 | API backend |
| Web | 3000 | Frontend app |
| PostgreSQL | 5432 | Database |
| Redis | 6379 | Cache |
| Prometheus | 9090 | Metrics |
| Grafana | 3002 | Dashboards |

## Monitoring

### Access Grafana
- URL: http://your-server:3002
- Default credentials: admin/admin

### Pre-configured Dashboards
- Server Performance
- API Usage
- Database Metrics
- Subscription Analytics

## Backup & Restore

### Automated Backups
Backups run daily at 2 AM and are stored in `./backups/`

### Manual Backup
```bash
docker exec finsathi-db pg_dump -U finsathi -Fc finsathi > backup.psql
```

### Restore
```bash
docker exec -i finsathi-db pg_restore -U finsathi -d finsathi < backup.psql
```

## CI/CD Pipeline

The GitHub Actions workflow (`.github/workflows/ci-cd.yml`) handles:

1. **Test** - Run linting and tests
2. **Build** - Build Docker images
3. **Deploy** - Deploy to production server
4. **Backup** - Create database backup

### Required Secrets
- `PROD_HOST` - Production server IP
- `PROD_USER` - SSH username
- `PROD_SSH_KEY` - SSH private key

## Health Checks

```bash
# Check service health
curl http://localhost:3001/health

# Check all containers
docker ps

# Check container logs
docker logs finsathi-server
```

## Scaling

For horizontal scaling:
```bash
# Scale server instances
docker-compose -f docker-compose.production.yml up -d --scale server=3

# Update nginx for load balancing
# Edit nginx.conf to add more upstream servers
```

## SSL/HTTPS

1. Get SSL certificate:
```bash
certbot --nginx -d finsathi.ai -d www.finsathi.ai
```

2. Update nginx config to use SSL

## Troubleshooting

### Database Connection Issues
```bash
docker exec finsathi-db pg_isready
```

### Clear Redis Cache
```bash
docker exec finsathi-redis redis-cli FLUSHALL
```

### View Application Logs
```bash
docker logs finsathi-server --tail=100
```
