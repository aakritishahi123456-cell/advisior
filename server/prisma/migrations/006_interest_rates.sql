CREATE TABLE IF NOT EXISTS interest_rates (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  bank_name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('loan', 'fd', 'savings')),
  rate NUMERIC(8,4) NOT NULL,
  last_updated TIMESTAMPTZ NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS interest_rates_product_type_idx
  ON interest_rates (product_type);

CREATE INDEX IF NOT EXISTS interest_rates_bank_product_updated_idx
  ON interest_rates (bank_name, product_type, last_updated DESC, created_at DESC);
