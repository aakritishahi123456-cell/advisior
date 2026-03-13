# NEPSE Data Auto-Collector (FinSathi AI)

This adds an automated daily collector that ingests **NEPSE listed companies**, **daily OHLCV prices**, and (when available from the daily payload) **basic financial metrics** into Postgres via Prisma.

## What gets stored

Tables (Prisma models are mapped exactly to these table names):

- `companies` (existing) — now also supports optional `listed_date`
- `prices` — daily OHLCV per `symbol` + `date`
- `financials` — daily snapshot per `symbol` + `as_of_date` (EPS/PE/market cap/dividend yield when present)

Schema changes live in:

- `server/prisma/schema.prisma`
- `server/prisma/migrations/002_nepse_collector_tables.sql` (SQL migration helper)

## How it runs automatically

The server schedules a repeatable Bull (Redis) job on startup:

- Queue: `nepse-collector`
- Default schedule: **3:20 PM** Nepal time, **Sun–Thu** (`NEPSE_COLLECTOR_CRON="20 15 * * 0-4"`)
- Timezone: `Asia/Kathmandu` (`NEPSE_COLLECTOR_TZ`)

You can disable scheduling with:

- `NEPSE_COLLECTOR_ENABLED=false`

## Manual run (one-off)

From the repo root:

```bash
npm run nepse:collect --workspace=server
```

Optional env overrides:

- `NEPSE_BUSINESS_DATE=YYYY-MM-DD` (collect for a specific date)

## Configuration

See `server/.env.example` for all variables. Key ones:

- `NEPSE_BASE_URL` (default: `https://newweb.nepalstock.com/api/nots`)
- `NEPSE_MARKET_OPEN_PATH`
- `NEPSE_SECURITY_PATH`
- `NEPSE_DAILY_TRADE_PATH`

## Notes / limitations

- NEPSE endpoints can change and may introduce auth/rate-limits; the collector is written to be **path-configurable** and to **skip** if the market-open endpoint reports closed.
- Financial metrics are collected **only if present** in the daily trade payload; otherwise `financials` rows are not inserted for that symbol/date.

