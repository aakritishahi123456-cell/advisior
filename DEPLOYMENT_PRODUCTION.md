# Production Deployment

## Architecture
- PostgreSQL for production data
- Redis for cache, queues, and rate limiting
- Node backend as the API service
- Next.js frontend deployed on Vercel
- Prometheus and Grafana for monitoring
- Sentry for backend error tracking
- Winston for structured logs

## Backend deployment
- Deploy the backend stack to a DigitalOcean droplet.
- Use `docker-compose.production.yml` for PostgreSQL, Redis, backend API, Nginx, Prometheus, Grafana, and exporters.
- Build the backend container from the workspace root with `server/Dockerfile`.
- Use the DigitalOcean runbook in [infra/digitalocean/README.md](/c:/Users/surkh/Desktop/advisior/infra/digitalocean/README.md).
- Expose only Nginx publicly when possible. Keep PostgreSQL, Redis, Prometheus, and Grafana private.

## Frontend deployment
- Deploy `apps/web` to Vercel.
- Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_ANON_KEY` in the Vercel project settings.
- Point backend `FRONTEND_URL` and `CORS_ORIGIN` at the final Vercel domain.
- Point `NEXT_PUBLIC_API_URL` at the DigitalOcean API domain such as `https://api.finsathi.ai`.

## Secret handling
- Never commit real `.env.production` values.
- Store `POSTGRES_PASSWORD`, `REDIS_PASSWORD`, `JWT_SECRET`, `DATABASE_URL`, `REDIS_URL`, payment gateway keys, and `SENTRY_DSN` in provider secret managers only.
- Rotate any secret immediately if it is exposed.
- Required production keys:
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `KHALTI_SECRET_KEY`
  - `ESEWA_SECRET_KEY`
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
  - `SENTRY_DSN`

## Observability
- Prometheus scrapes `/metrics` from the backend plus Redis and PostgreSQL exporters.
- Grafana uses Prometheus as its datasource.
- Sentry captures backend exceptions when `SENTRY_DSN` is set.
- Winston writes structured logs to stdout and rolling files under `LOG_DIR`.

## Security
- Global and auth-specific API rate limits are enabled through environment variables.
- Set `TRUST_PROXY=1` behind Nginx, Render, or any managed proxy so IP-based rate limiting works correctly.
- Use long random values for `JWT_SECRET`, `POSTGRES_PASSWORD`, and `REDIS_PASSWORD`.
- Terminate HTTPS in front of Nginx with DigitalOcean Load Balancer, Cloudflare, or Certbot.
- Keep the backend API on its own subdomain such as `api.finsathi.ai`.

## Launch checklist
1. Set production env values from [.env.production.example](/c:/Users/surkh/Desktop/advisior/.env.production.example).
2. Deploy backend on DigitalOcean with [deploy-backend.sh](/c:/Users/surkh/Desktop/advisior/infra/digitalocean/deploy-backend.sh).
3. Run `npx prisma migrate deploy` inside the backend container.
4. Deploy frontend to Vercel with [vercel.json](/c:/Users/surkh/Desktop/advisior/vercel.json).
5. Verify `/health`, `/metrics`, payment callbacks, and Sentry ingestion.
