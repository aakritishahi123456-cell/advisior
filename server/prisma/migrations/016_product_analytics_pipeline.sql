CREATE TABLE IF NOT EXISTS product_analytics_events (
  id TEXT PRIMARY KEY,
  user_id TEXT REFERENCES users(id) ON DELETE SET NULL,
  event_name TEXT NOT NULL,
  category TEXT NOT NULL,
  properties JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS product_analytics_events_user_id_idx
ON product_analytics_events (user_id);

CREATE INDEX IF NOT EXISTS product_analytics_events_event_name_idx
ON product_analytics_events (event_name);

CREATE INDEX IF NOT EXISTS product_analytics_events_category_idx
ON product_analytics_events (category);

CREATE INDEX IF NOT EXISTS product_analytics_events_created_at_idx
ON product_analytics_events (created_at);

CREATE INDEX IF NOT EXISTS product_analytics_events_event_name_created_at_idx
ON product_analytics_events (event_name, created_at DESC);
