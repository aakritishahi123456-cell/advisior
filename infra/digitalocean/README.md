# DigitalOcean Backend Deployment

## Target topology
- DigitalOcean Droplet runs:
  - PostgreSQL
  - Redis
  - Node API
  - Nginx reverse proxy
  - Prometheus
  - Grafana
- Vercel hosts the Next.js frontend separately.

## 1. Provision the droplet
- Ubuntu 22.04 LTS
- Minimum recommended size: 4 GB RAM / 2 vCPU
- Open inbound ports:
  - `80`
  - `443`
  - `22`
- Keep `3001`, `5432`, `6379`, `9090`, and `3002` private whenever possible.

## 2. Install Docker
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

## 3. Upload the app
```bash
sudo mkdir -p /opt/finsathi
sudo chown $USER:$USER /opt/finsathi
git clone <your-repo-url> /opt/finsathi
cd /opt/finsathi
cp .env.production.example .env.production
```

## 4. Set production secrets in `.env.production`
- `DATABASE_URL`
- `JWT_SECRET`
- `KHALTI_SECRET_KEY`
- `ESEWA_SECRET_KEY`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `SENTRY_DSN`
- `POSTGRES_PASSWORD`
- `REDIS_PASSWORD`
- `FRONTEND_URL`
- `CORS_ORIGIN`

## 5. Run the backend stack
```bash
sh infra/digitalocean/deploy-backend.sh
```

## 6. Enable HTTPS
- Point `api.finsathi.ai` to the droplet IP.
- Terminate TLS with your preferred option:
  - DigitalOcean Load Balancer with managed certificates
  - Cloudflare proxy with Full (strict)
  - Certbot on the droplet
- Keep Nginx serving the API behind the TLS terminator.

## 7. Apply database migrations
```bash
docker compose --env-file .env.production -f docker-compose.production.yml exec server \
  sh -lc "cd /app/server && npx prisma migrate deploy"
```

## 8. Verify production health
```bash
curl -I https://api.finsathi.ai/health
curl -I https://api.finsathi.ai/api/v1/auth/me
```

## 9. Monitoring
- Prometheus scrapes backend and exporters.
- Grafana is available on the internal dashboard port.
- Sentry captures production exceptions.
- Winston logs are written to stdout and `/app/logs`.
