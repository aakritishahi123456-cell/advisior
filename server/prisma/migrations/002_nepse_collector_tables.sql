-- NEPSE data collector tables

ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS listed_date TIMESTAMPTZ;

CREATE TABLE IF NOT EXISTS prices (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  date TIMESTAMPTZ NOT NULL,
  open NUMERIC(12,2),
  close NUMERIC(12,2),
  high NUMERIC(12,2),
  low NUMERIC(12,2),
  volume BIGINT,
  source TEXT NOT NULL DEFAULT 'NEPSE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, date)
);

CREATE INDEX IF NOT EXISTS prices_symbol_idx ON prices(symbol);
CREATE INDEX IF NOT EXISTS prices_date_idx ON prices(date);

CREATE TABLE IF NOT EXISTS financials (
  id TEXT PRIMARY KEY,
  symbol TEXT NOT NULL REFERENCES companies(symbol) ON DELETE CASCADE,
  as_of_date TIMESTAMPTZ NOT NULL,
  eps NUMERIC(12,4),
  pe_ratio NUMERIC(12,4),
  market_cap BIGINT,
  dividend_yield NUMERIC(12,4),
  source TEXT NOT NULL DEFAULT 'NEPSE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(symbol, as_of_date)
);

CREATE INDEX IF NOT EXISTS financials_symbol_idx ON financials(symbol);
CREATE INDEX IF NOT EXISTS financials_as_of_date_idx ON financials(as_of_date);

