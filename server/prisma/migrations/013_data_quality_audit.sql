CREATE TABLE IF NOT EXISTS data_quality_anomalies (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  symbol TEXT,
  dataset TEXT NOT NULL,
  record_key TEXT,
  reason TEXT NOT NULL,
  details JSONB,
  detected_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS data_quality_anomalies_dataset_idx ON data_quality_anomalies(dataset);
CREATE INDEX IF NOT EXISTS data_quality_anomalies_symbol_idx ON data_quality_anomalies(symbol);
CREATE INDEX IF NOT EXISTS data_quality_anomalies_detected_at_idx ON data_quality_anomalies(detected_at);
CREATE INDEX IF NOT EXISTS data_quality_anomalies_company_id_idx ON data_quality_anomalies(company_id);

CREATE TABLE IF NOT EXISTS data_quality_audit_logs (
  id TEXT PRIMARY KEY,
  company_id TEXT REFERENCES companies(id) ON DELETE SET NULL,
  symbol TEXT,
  dataset TEXT NOT NULL,
  action TEXT NOT NULL,
  status TEXT NOT NULL,
  record_key TEXT,
  details JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS data_quality_audit_logs_dataset_idx ON data_quality_audit_logs(dataset);
CREATE INDEX IF NOT EXISTS data_quality_audit_logs_status_idx ON data_quality_audit_logs(status);
CREATE INDEX IF NOT EXISTS data_quality_audit_logs_symbol_idx ON data_quality_audit_logs(symbol);
CREATE INDEX IF NOT EXISTS data_quality_audit_logs_created_at_idx ON data_quality_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS data_quality_audit_logs_company_id_idx ON data_quality_audit_logs(company_id);
