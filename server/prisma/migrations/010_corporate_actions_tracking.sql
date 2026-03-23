ALTER TABLE dividends
ADD COLUMN IF NOT EXISTS dividend_type TEXT,
ADD COLUMN IF NOT EXISTS amount DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS announcement_date TIMESTAMP(3),
ADD COLUMN IF NOT EXISTS ex_date TIMESTAMP(3);

UPDATE dividends
SET
  dividend_type = CASE
    WHEN is_cash = TRUE AND is_bonus = TRUE THEN 'cash_bonus'
    WHEN is_cash = TRUE THEN 'cash'
    WHEN is_bonus = TRUE THEN 'bonus'
    ELSE dividend_type
  END,
  amount = COALESCE(amount, dividend_amount, dividend_percentage);

UPDATE dividends AS d
SET
  announcement_date = COALESCE(d.announcement_date, ca.announcement_date),
  ex_date = COALESCE(d.ex_date, ca.ex_date)
FROM corporate_actions AS ca
WHERE d.corporate_action_id = ca.id;

CREATE INDEX IF NOT EXISTS dividends_announcement_date_idx ON dividends (announcement_date);
CREATE INDEX IF NOT EXISTS dividends_ex_date_idx ON dividends (ex_date);
