-- Autonomous custody telephone discovery tables
-- Run in Supabase SQL Editor (optional mirror of KV-backed production store).

CREATE TABLE IF NOT EXISTS custody_suites (
  id TEXT PRIMARY KEY,
  force_name TEXT NOT NULL,
  force_domain TEXT NOT NULL,
  county TEXT NOT NULL DEFAULT '',
  custody_suite_name TEXT NOT NULL,
  police_station_name TEXT NOT NULL,
  address TEXT NOT NULL DEFAULT '',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_custody_suites_force ON custody_suites(force_name);
CREATE INDEX IF NOT EXISTS idx_custody_suites_county ON custody_suites(county);

CREATE TABLE IF NOT EXISTS custody_number_findings (
  id TEXT PRIMARY KEY,
  custody_suite_id TEXT NOT NULL REFERENCES custody_suites(id) ON DELETE CASCADE,
  possible_phone_number TEXT NOT NULL,
  normalized_phone_number TEXT NOT NULL,
  source_title TEXT NOT NULL DEFAULT '',
  source_url TEXT NOT NULL,
  source_domain TEXT NOT NULL DEFAULT '',
  source_type TEXT NOT NULL DEFAULT 'unknown',
  page_snippet TEXT NOT NULL DEFAULT '',
  classification TEXT NOT NULL DEFAULT 'unknown',
  confidence_score INTEGER NOT NULL DEFAULT 0,
  confidence_level TEXT NOT NULL DEFAULT 'reject',
  status TEXT NOT NULL DEFAULT 'new',
  date_found TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_checked TIMESTAMPTZ NOT NULL DEFAULT now(),
  hash_of_source_evidence TEXT NOT NULL UNIQUE,
  notes TEXT NOT NULL DEFAULT '',
  conflict_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_findings_suite ON custody_number_findings(custody_suite_id);
CREATE INDEX IF NOT EXISTS idx_findings_status ON custody_number_findings(status);
CREATE INDEX IF NOT EXISTS idx_findings_confidence ON custody_number_findings(confidence_score DESC);

CREATE TABLE IF NOT EXISTS approved_custody_numbers (
  id TEXT PRIMARY KEY,
  custody_suite_id TEXT NOT NULL UNIQUE REFERENCES custody_suites(id) ON DELETE CASCADE,
  station_slug TEXT,
  phone_number TEXT NOT NULL,
  source_finding_id TEXT NOT NULL REFERENCES custody_number_findings(id),
  source_url TEXT NOT NULL DEFAULT '',
  approved_by TEXT NOT NULL,
  approved_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  public_visible BOOLEAN NOT NULL DEFAULT true,
  notes TEXT NOT NULL DEFAULT ''
);
