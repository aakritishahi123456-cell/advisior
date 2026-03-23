CREATE TABLE IF NOT EXISTS filings (
  id TEXT PRIMARY KEY,
  company_id TEXT NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  type TEXT NOT NULL,
  uploaded_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  parsed_text TEXT,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS filings_company_id_idx ON filings(company_id);
CREATE INDEX IF NOT EXISTS filings_type_idx ON filings(type);
CREATE INDEX IF NOT EXISTS filings_uploaded_at_idx ON filings(uploaded_at);

CREATE TABLE IF NOT EXISTS filing_chunks (
  id TEXT PRIMARY KEY,
  filing_id TEXT NOT NULL REFERENCES filings(id) ON DELETE CASCADE,
  page_number INTEGER,
  chunk_index INTEGER NOT NULL,
  content TEXT NOT NULL,
  embedding JSONB,
  created_at TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS filing_chunks_filing_id_idx ON filing_chunks(filing_id);
CREATE INDEX IF NOT EXISTS filing_chunks_page_number_idx ON filing_chunks(page_number);
