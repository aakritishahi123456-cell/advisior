CREATE TABLE IF NOT EXISTS price_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_date TIMESTAMP(3) NOT NULL,
  open DOUBLE PRECISION,
  high DOUBLE PRECISION,
  low DOUBLE PRECISION,
  close DOUBLE PRECISION NOT NULL,
  price DOUBLE PRECISION NOT NULL,
  change_value DOUBLE PRECISION,
  volume BIGINT,
  source TEXT NOT NULL DEFAULT 'NEPSE',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS price_history_company_id_trade_date_key
  ON price_history(company_id, trade_date);
CREATE INDEX IF NOT EXISTS price_history_trade_date_idx ON price_history(trade_date);
CREATE INDEX IF NOT EXISTS price_history_company_id_idx ON price_history(company_id);
CREATE INDEX IF NOT EXISTS price_history_symbol_idx ON price_history(symbol);
CREATE INDEX IF NOT EXISTS price_history_company_id_trade_date_desc_idx
  ON price_history(company_id, trade_date DESC);
CREATE INDEX IF NOT EXISTS price_history_trade_date_brin_idx
  ON price_history USING BRIN(trade_date);

CREATE TABLE IF NOT EXISTS financial_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  fiscal_year INTEGER NOT NULL,
  report_date TIMESTAMP(3) NOT NULL,
  revenue DOUBLE PRECISION,
  profit DOUBLE PRECISION,
  eps DOUBLE PRECISION,
  assets DOUBLE PRECISION,
  liabilities DOUBLE PRECISION,
  source TEXT NOT NULL DEFAULT 'INTERNAL',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS financial_history_company_id_fiscal_year_key
  ON financial_history(company_id, fiscal_year);
CREATE INDEX IF NOT EXISTS financial_history_report_date_idx ON financial_history(report_date);
CREATE INDEX IF NOT EXISTS financial_history_company_id_idx ON financial_history(company_id);
CREATE INDEX IF NOT EXISTS financial_history_symbol_idx ON financial_history(symbol);
CREATE INDEX IF NOT EXISTS financial_history_company_id_report_date_desc_idx
  ON financial_history(company_id, report_date DESC);
CREATE INDEX IF NOT EXISTS financial_history_report_date_brin_idx
  ON financial_history USING BRIN(report_date);

CREATE TABLE IF NOT EXISTS dividend_history (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  dividend_type TEXT NOT NULL,
  fiscal_year TEXT,
  amount DOUBLE PRECISION,
  percentage DOUBLE PRECISION,
  announcement_date TIMESTAMP(3),
  ex_date TIMESTAMP(3),
  payment_date TIMESTAMP(3),
  source TEXT NOT NULL DEFAULT 'INTERNAL',
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS dividend_history_announcement_date_idx ON dividend_history(announcement_date);
CREATE INDEX IF NOT EXISTS dividend_history_ex_date_idx ON dividend_history(ex_date);
CREATE INDEX IF NOT EXISTS dividend_history_payment_date_idx ON dividend_history(payment_date);
CREATE INDEX IF NOT EXISTS dividend_history_company_id_idx ON dividend_history(company_id);
CREATE INDEX IF NOT EXISTS dividend_history_symbol_idx ON dividend_history(symbol);
CREATE INDEX IF NOT EXISTS dividend_history_company_id_announcement_date_desc_idx
  ON dividend_history(company_id, announcement_date DESC);
CREATE INDEX IF NOT EXISTS dividend_history_announcement_date_brin_idx
  ON dividend_history USING BRIN(announcement_date);

INSERT INTO price_history (
  id,
  company_id,
  symbol,
  trade_date,
  open,
  high,
  low,
  close,
  price,
  change_value,
  volume,
  source,
  created_at,
  updated_at
)
SELECT
  p.id,
  c.id AS company_id,
  c.symbol,
  COALESCE(p.date, p.timestamp) AS trade_date,
  p.open,
  p.high,
  p.low,
  COALESCE(p.close, p.price) AS close,
  p.price,
  p.change_value,
  p.volume,
  COALESCE(p.source, 'NEPSE'),
  p.created_at,
  CURRENT_TIMESTAMP
FROM prices p
JOIN companies c ON c.symbol = p.symbol
WHERE COALESCE(p.date, p.timestamp) IS NOT NULL
ON CONFLICT (company_id, trade_date) DO UPDATE
SET
  open = EXCLUDED.open,
  high = EXCLUDED.high,
  low = EXCLUDED.low,
  close = EXCLUDED.close,
  price = EXCLUDED.price,
  change_value = EXCLUDED.change_value,
  volume = EXCLUDED.volume,
  source = EXCLUDED.source,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO financial_history (
  id,
  company_id,
  symbol,
  fiscal_year,
  report_date,
  revenue,
  profit,
  eps,
  assets,
  liabilities,
  source,
  created_at,
  updated_at
)
SELECT
  f.id,
  c.id AS company_id,
  c.symbol,
  EXTRACT(YEAR FROM f.as_of_date)::INTEGER AS fiscal_year,
  f.as_of_date AS report_date,
  f.revenue,
  f.profit,
  f.eps,
  f.assets,
  NULL::DOUBLE PRECISION AS liabilities,
  COALESCE(f.source, 'INTERNAL'),
  f.created_at,
  CURRENT_TIMESTAMP
FROM financials f
JOIN companies c ON c.symbol = f.symbol
ON CONFLICT (company_id, fiscal_year) DO UPDATE
SET
  report_date = EXCLUDED.report_date,
  revenue = EXCLUDED.revenue,
  profit = EXCLUDED.profit,
  eps = EXCLUDED.eps,
  assets = EXCLUDED.assets,
  liabilities = EXCLUDED.liabilities,
  source = EXCLUDED.source,
  updated_at = CURRENT_TIMESTAMP;

INSERT INTO dividend_history (
  id,
  company_id,
  symbol,
  dividend_type,
  fiscal_year,
  amount,
  percentage,
  announcement_date,
  ex_date,
  payment_date,
  source,
  created_at,
  updated_at
)
SELECT
  d.id,
  c.id AS company_id,
  c.symbol,
  COALESCE(
    d.dividend_type,
    CASE
      WHEN d.is_cash = TRUE AND d.is_bonus = TRUE THEN 'cash_bonus'
      WHEN d.is_cash = TRUE THEN 'cash'
      WHEN d.is_bonus = TRUE THEN 'bonus'
      ELSE 'unknown'
    END
  ) AS dividend_type,
  d.fiscal_year,
  COALESCE(d.amount, d.dividend_amount) AS amount,
  d.dividend_percentage AS percentage,
  d.announcement_date,
  d.ex_date,
  d.payment_date,
  'INTERNAL',
  d.created_at,
  CURRENT_TIMESTAMP
FROM dividends d
JOIN companies c ON c.id = d.company_id
ON CONFLICT DO NOTHING;
