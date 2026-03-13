# Nepal Loan Database Scraper (FinSathi AI)

This adds a weekly-updated loan product database for Nepali banks and a comparison API endpoint.

## Database Schema

Migration SQL:
- `server/prisma/migrations/003_loan_products.sql`

Creates table `loan_products` with (minimum required fields):
- `bank_name`
- `loan_type` (`HOME|PERSONAL|EDUCATION|BUSINESS|AUTO`)
- `interest_rate` (minimum effective rate used for sorting)
- `loan_term` (months, nullable)
- `processing_fee` (nullable)
- `last_updated`

## Scraper

Script:
- `server/scripts/scrape-loan-products.py`

Python deps:
- `server/scripts/requirements.txt`

Run:
```bash
pip install -r server/scripts/requirements.txt
python server/scripts/scrape-loan-products.py --dry-run
python server/scripts/scrape-loan-products.py
```

Environment:
- `DATABASE_URL` (Postgres connection string)

## Cron (Weekly)

Example cron entry:
- `infra/cron/loan-scraper-weekly.cron`

## Server Scheduler (Recommended)

If you run the FinSathi backend with Redis enabled, the scraper can be scheduled and executed via the built-in Bull queue:
- Scheduler: `server/src/jobs/loanProducts/scheduler.ts`
- Worker: `server/src/workers/loan-products-scraper.worker.ts`

Env vars:
- `LOAN_PRODUCTS_SCRAPER_ENABLED` (`false` to disable)
- `LOAN_PRODUCTS_SCRAPER_CRON` (default `15 3 * * 0`)
- `LOAN_PRODUCTS_SCRAPER_TZ` (default `Asia/Kathmandu`)
- `LOAN_PRODUCTS_SCRAPER_BANKS` (default `himalayan,nicasia,globalime,nabil`)
- `PYTHON_BIN` (optional; defaults to `python3` on Linux and `python` on Windows)

## API Endpoint

Endpoint:
- `GET /loans/compare`
- Also available as `GET /api/v1/loans/compare`

Query params:
- `loan_type` (required): `HOME|PERSONAL|EDUCATION|BUSINESS|AUTO` (also accepts common synonyms like `home`, `auto`, etc.)
- `loan_amount` (optional): NPR amount
- `duration` (optional): duration in months
- `limit` (optional): max results (default 50, max 200)

Example:
```bash
curl "http://localhost:3001/loans/compare?loan_type=HOME&loan_amount=5000000&duration=240"
```

Response:
- JSON list of banks sorted by lowest `interestRate` first (ascending).
