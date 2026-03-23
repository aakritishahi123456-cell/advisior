ALTER TABLE financials
  ADD COLUMN IF NOT EXISTS revenue NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS profit NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS assets NUMERIC(18,2),
  ADD COLUMN IF NOT EXISTS growth_rate NUMERIC(10,4),
  ADD COLUMN IF NOT EXISTS source_document TEXT;

CREATE INDEX IF NOT EXISTS financials_symbol_as_of_date_idx
  ON financials (symbol, as_of_date DESC);
