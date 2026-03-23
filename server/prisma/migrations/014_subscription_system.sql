ALTER TABLE users
ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'FREE',
ADD COLUMN IF NOT EXISTS plan_expiry TIMESTAMP(3);

CREATE TABLE IF NOT EXISTS subscription_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  transaction_id TEXT REFERENCES transactions(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  previous_plan TEXT,
  next_plan TEXT,
  status TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS subscription_logs_user_id_created_at_idx
  ON subscription_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS subscription_logs_subscription_id_idx
  ON subscription_logs(subscription_id);
CREATE INDEX IF NOT EXISTS subscription_logs_transaction_id_idx
  ON subscription_logs(transaction_id);
CREATE INDEX IF NOT EXISTS subscription_logs_status_idx
  ON subscription_logs(status);

CREATE TABLE IF NOT EXISTS usage_tracking (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  feature_key TEXT NOT NULL,
  period TEXT NOT NULL,
  usage_count INTEGER NOT NULL DEFAULT 0,
  "limit" INTEGER,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS usage_tracking_user_id_feature_key_period_key
  ON usage_tracking(user_id, feature_key, period);
CREATE INDEX IF NOT EXISTS usage_tracking_user_id_idx ON usage_tracking(user_id);
CREATE INDEX IF NOT EXISTS usage_tracking_feature_key_idx ON usage_tracking(feature_key);
CREATE INDEX IF NOT EXISTS usage_tracking_period_idx ON usage_tracking(period);

UPDATE users u
SET
  plan = s.plan::TEXT,
  plan_expiry = s.end_date
FROM (
  SELECT DISTINCT ON (user_id)
    user_id,
    plan,
    end_date,
    updated_at
  FROM subscriptions
  ORDER BY user_id, updated_at DESC
) s
WHERE u.id = s.user_id;

UPDATE users
SET
  plan = 'FREE',
  plan_expiry = NULL
WHERE plan_expiry IS NOT NULL AND plan_expiry < CURRENT_TIMESTAMP;

INSERT INTO subscription_logs (
  id,
  user_id,
  subscription_id,
  action,
  previous_plan,
  next_plan,
  status,
  details,
  created_at
)
SELECT
  CONCAT('backfill_', s.id),
  s.user_id,
  s.id,
  'BACKFILL',
  NULL,
  s.plan::TEXT,
  s.status::TEXT,
  jsonb_build_object('source', '014_subscription_system'),
  COALESCE(s.updated_at, s.created_at)
FROM subscriptions s
WHERE NOT EXISTS (
  SELECT 1
  FROM subscription_logs l
  WHERE l.subscription_id = s.id
);
