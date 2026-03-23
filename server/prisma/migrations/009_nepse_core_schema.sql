ALTER TABLE "financials"
  ADD COLUMN IF NOT EXISTS "assets" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "growth_rate" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "profit" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "revenue" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "source_document" TEXT;

CREATE TABLE IF NOT EXISTS "stocks" (
  "id" TEXT NOT NULL,
  "symbol" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "sector" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "stocks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "stocks_symbol_key" ON "stocks"("symbol");
CREATE INDEX IF NOT EXISTS "stocks_symbol_idx" ON "stocks"("symbol");

INSERT INTO "stocks" ("id", "symbol", "name", "sector", "created_at", "updated_at")
SELECT DISTINCT
  COALESCE(c."id", 'stock_' || md5(p."symbol")),
  p."symbol",
  COALESCE(c."name", p."symbol"),
  COALESCE(c."sector", 'UNKNOWN'),
  COALESCE(c."created_at", CURRENT_TIMESTAMP),
  CURRENT_TIMESTAMP
FROM "prices" p
LEFT JOIN "companies" c ON c."symbol" = p."symbol"
WHERE p."symbol" IS NOT NULL
ON CONFLICT ("symbol") DO UPDATE
SET
  "name" = EXCLUDED."name",
  "sector" = EXCLUDED."sector",
  "updated_at" = CURRENT_TIMESTAMP;

ALTER TABLE "prices"
  ADD COLUMN IF NOT EXISTS "change_value" DOUBLE PRECISION NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS "price" DOUBLE PRECISION,
  ADD COLUMN IF NOT EXISTS "stock_id" TEXT,
  ADD COLUMN IF NOT EXISTS "timestamp" TIMESTAMP(3);

UPDATE "prices" p
SET
  "stock_id" = s."id",
  "price" = COALESCE(p."close", p."open", p."high", p."low", 0),
  "timestamp" = COALESCE(p."timestamp", p."date", p."created_at", CURRENT_TIMESTAMP)
FROM "stocks" s
WHERE s."symbol" = p."symbol";

UPDATE "prices"
SET
  "price" = COALESCE("price", 0),
  "timestamp" = COALESCE("timestamp", "date", "created_at", CURRENT_TIMESTAMP)
WHERE "price" IS NULL OR "timestamp" IS NULL;

ALTER TABLE "prices"
  ALTER COLUMN "stock_id" SET NOT NULL,
  ALTER COLUMN "price" SET NOT NULL,
  ALTER COLUMN "timestamp" SET NOT NULL,
  ALTER COLUMN "symbol" DROP NOT NULL,
  ALTER COLUMN "date" DROP NOT NULL;

DROP INDEX IF EXISTS "prices_date_idx";
DROP INDEX IF EXISTS "prices_symbol_idx";
DROP INDEX IF EXISTS "prices_symbol_date_key";

CREATE INDEX IF NOT EXISTS "prices_timestamp_idx" ON "prices"("timestamp");
CREATE INDEX IF NOT EXISTS "prices_stock_id_idx" ON "prices"("stock_id");
CREATE UNIQUE INDEX IF NOT EXISTS "prices_stock_id_timestamp_key" ON "prices"("stock_id", "timestamp");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'prices_stock_id_fkey'
  ) THEN
    ALTER TABLE "prices"
      ADD CONSTRAINT "prices_stock_id_fkey"
      FOREIGN KEY ("stock_id") REFERENCES "stocks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "transactions" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "subscription_id" TEXT,
  "provider" TEXT NOT NULL,
  "plan" "SubscriptionPlan" NOT NULL,
  "amount" DOUBLE PRECISION NOT NULL,
  "currency" TEXT NOT NULL DEFAULT 'NPR',
  "status" TEXT NOT NULL DEFAULT 'PENDING',
  "local_reference" TEXT NOT NULL,
  "external_reference" TEXT,
  "gateway_transaction_id" TEXT,
  "signature_verified" BOOLEAN NOT NULL DEFAULT false,
  "fraud_flag" BOOLEAN NOT NULL DEFAULT false,
  "fraud_reason" TEXT,
  "gateway_request" JSONB,
  "gateway_response" JSONB,
  "verified_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "transactions_local_reference_key" ON "transactions"("local_reference");
CREATE UNIQUE INDEX IF NOT EXISTS "transactions_external_reference_key" ON "transactions"("external_reference");
CREATE INDEX IF NOT EXISTS "transactions_user_id_created_at_idx" ON "transactions"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "transactions_provider_status_idx" ON "transactions"("provider", "status");
CREATE INDEX IF NOT EXISTS "transactions_subscription_id_idx" ON "transactions"("subscription_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_subscription_id_fkey'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_subscription_id_fkey"
      FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id")
      ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'transactions_user_id_fkey'
  ) THEN
    ALTER TABLE "transactions"
      ADD CONSTRAINT "transactions_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "portfolios" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portfolios_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "portfolios_user_id_key" ON "portfolios"("user_id");
CREATE INDEX IF NOT EXISTS "portfolios_user_id_idx" ON "portfolios"("user_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolios_user_id_fkey'
  ) THEN
    ALTER TABLE "portfolios"
      ADD CONSTRAINT "portfolios_user_id_fkey"
      FOREIGN KEY ("user_id") REFERENCES "users"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS "portfolio_items" (
  "id" TEXT NOT NULL,
  "portfolio_id" TEXT NOT NULL,
  "stock_id" TEXT NOT NULL,
  "quantity" DOUBLE PRECISION NOT NULL,
  "buy_price" DOUBLE PRECISION NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "portfolio_items_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "portfolio_items_portfolio_id_idx" ON "portfolio_items"("portfolio_id");
CREATE INDEX IF NOT EXISTS "portfolio_items_stock_id_idx" ON "portfolio_items"("stock_id");
CREATE UNIQUE INDEX IF NOT EXISTS "portfolio_items_portfolio_id_stock_id_key" ON "portfolio_items"("portfolio_id", "stock_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_items_portfolio_id_fkey'
  ) THEN
    ALTER TABLE "portfolio_items"
      ADD CONSTRAINT "portfolio_items_portfolio_id_fkey"
      FOREIGN KEY ("portfolio_id") REFERENCES "portfolios"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'portfolio_items_stock_id_fkey'
  ) THEN
    ALTER TABLE "portfolio_items"
      ADD CONSTRAINT "portfolio_items_stock_id_fkey"
      FOREIGN KEY ("stock_id") REFERENCES "stocks"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
