DO $$
DECLARE
  portfolio_user_column TEXT;
  portfolio_active_column TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'portfolios'
  ) THEN
    SELECT
      CASE
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'portfolios'
            AND column_name = 'userId'
        ) THEN '"userId"'
        ELSE '"user_id"'
      END,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'portfolios'
            AND column_name = 'isActive'
        ) THEN '"isActive"'
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'portfolios'
            AND column_name = 'is_active'
        ) THEN '"is_active"'
        ELSE NULL
      END
    INTO portfolio_user_column, portfolio_active_column;

    IF portfolio_active_column IS NOT NULL THEN
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS portfolios_user_active_idx ON portfolios (%s, %s)',
        portfolio_user_column,
        portfolio_active_column
      );
    ELSE
      EXECUTE format(
        'CREATE INDEX IF NOT EXISTS portfolios_user_idx ON portfolios (%s)',
        portfolio_user_column
      );
    END IF;
  END IF;
END $$;

DO $$
DECLARE
  asset_portfolio_column TEXT;
  asset_company_column TEXT;
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'portfolio_assets'
  ) THEN
    SELECT
      CASE
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'portfolio_assets'
            AND column_name = 'portfolioId'
        ) THEN '"portfolioId"'
        ELSE '"portfolio_id"'
      END,
      CASE
        WHEN EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_schema = current_schema()
            AND table_name = 'portfolio_assets'
            AND column_name = 'companyId'
        ) THEN '"companyId"'
        ELSE '"company_id"'
      END
    INTO asset_portfolio_column, asset_company_column;

    EXECUTE format(
      'CREATE INDEX IF NOT EXISTS portfolio_assets_portfolio_company_idx ON portfolio_assets (%s, %s)',
      asset_portfolio_column,
      asset_company_column
    );
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'prices'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS prices_symbol_date_desc_close_idx ON prices ("symbol", "date" DESC) WHERE "close" IS NOT NULL';
  ELSIF EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = current_schema()
      AND table_name = 'nepse_prices'
  ) THEN
    EXECUTE 'CREATE INDEX IF NOT EXISTS nepse_prices_symbol_date_desc_close_idx ON nepse_prices ("symbol", "date" DESC) WHERE "close" IS NOT NULL';
  END IF;
END $$;
