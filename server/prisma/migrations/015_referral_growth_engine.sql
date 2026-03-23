ALTER TABLE users
ADD COLUMN IF NOT EXISTS referral_code TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS users_referral_code_key
ON users (referral_code)
WHERE referral_code IS NOT NULL;

CREATE TABLE IF NOT EXISTS referrals (
  id TEXT PRIMARY KEY,
  inviter_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  invitee_id TEXT NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  referral_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONVERTED',
  converted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS referrals_inviter_id_invitee_id_key
ON referrals (inviter_id, invitee_id);

CREATE INDEX IF NOT EXISTS referrals_inviter_id_idx
ON referrals (inviter_id);

CREATE INDEX IF NOT EXISTS referrals_referral_code_idx
ON referrals (referral_code);

CREATE INDEX IF NOT EXISTS referrals_status_idx
ON referrals (status);

CREATE INDEX IF NOT EXISTS referrals_converted_at_idx
ON referrals (converted_at);

CREATE TABLE IF NOT EXISTS rewards (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referral_id TEXT REFERENCES referrals(id) ON DELETE SET NULL,
  reward_type TEXT NOT NULL,
  premium_days INTEGER NOT NULL DEFAULT 0,
  trigger_count INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'GRANTED',
  granted_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP(3),
  metadata JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE UNIQUE INDEX IF NOT EXISTS rewards_user_id_reward_type_trigger_count_key
ON rewards (user_id, reward_type, trigger_count);

CREATE INDEX IF NOT EXISTS rewards_user_id_idx
ON rewards (user_id);

CREATE INDEX IF NOT EXISTS rewards_referral_id_idx
ON rewards (referral_id);

CREATE INDEX IF NOT EXISTS rewards_status_idx
ON rewards (status);

CREATE INDEX IF NOT EXISTS rewards_granted_at_idx
ON rewards (granted_at);
