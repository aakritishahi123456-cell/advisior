CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  subscription_id TEXT REFERENCES subscriptions(id) ON DELETE SET NULL,
  provider TEXT NOT NULL,
  plan TEXT NOT NULL,
  amount DOUBLE PRECISION NOT NULL,
  currency TEXT NOT NULL DEFAULT 'NPR',
  status TEXT NOT NULL DEFAULT 'PENDING',
  local_reference TEXT NOT NULL UNIQUE,
  external_reference TEXT UNIQUE,
  gateway_transaction_id TEXT,
  signature_verified BOOLEAN NOT NULL DEFAULT FALSE,
  fraud_flag BOOLEAN NOT NULL DEFAULT FALSE,
  fraud_reason TEXT,
  gateway_request JSONB,
  gateway_response JSONB,
  verified_at TIMESTAMP(3),
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_transactions_user_created_at
  ON transactions(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_transactions_provider_status
  ON transactions(provider, status);

CREATE INDEX IF NOT EXISTS idx_transactions_subscription_id
  ON transactions(subscription_id);
