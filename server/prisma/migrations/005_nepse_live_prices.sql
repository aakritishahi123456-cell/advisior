CREATE TABLE IF NOT EXISTS nepse_prices (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  symbol TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  price NUMERIC(12,2) NOT NULL,
  change NUMERIC(8,2) NOT NULL,
  volume BIGINT,
  "timestamp" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nepse_prices_symbol_timestamp_idx
  ON nepse_prices (symbol, "timestamp" DESC);

CREATE INDEX IF NOT EXISTS nepse_prices_timestamp_idx
  ON nepse_prices ("timestamp" DESC);

CREATE TABLE IF NOT EXISTS nepse_price_anomalies (
  id TEXT PRIMARY KEY DEFAULT md5(random()::text || clock_timestamp()::text),
  symbol TEXT NOT NULL,
  incoming_price NUMERIC(12,2) NOT NULL,
  previous_price NUMERIC(12,2) NOT NULL,
  spike_percent NUMERIC(8,2) NOT NULL,
  volume BIGINT,
  "timestamp" TIMESTAMPTZ NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nepse_price_anomalies_symbol_timestamp_idx
  ON nepse_price_anomalies (symbol, "timestamp" DESC);
