-- Police Station Rep UK - Supabase Schema
-- Run this in the Supabase SQL Editor to create tables.

-- Counties
CREATE TABLE IF NOT EXISTS counties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  region TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_counties_slug ON counties(slug);

-- Police Stations
CREATE TABLE IF NOT EXISTS stations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  county TEXT NOT NULL,
  address TEXT NOT NULL,
  phone TEXT,
  custody_suite BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stations_slug ON stations(slug);
CREATE INDEX IF NOT EXISTS idx_stations_county ON stations(county);

-- Representatives (counties and stations stored as text arrays)
CREATE TABLE IF NOT EXISTS representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  counties TEXT[] NOT NULL DEFAULT '{}',
  stations TEXT[] NOT NULL DEFAULT '{}',
  availability TEXT NOT NULL CHECK (availability IN ('full-time', 'part-time', 'weekends', 'nights', 'on-call')),
  accreditation TEXT NOT NULL,
  bio TEXT,
  image TEXT,
  years_experience INT,
  languages TEXT[] DEFAULT '{}',
  specialisms TEXT[] DEFAULT '{}',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_representatives_slug ON representatives(slug);
CREATE INDEX IF NOT EXISTS idx_representatives_counties ON representatives USING GIN(counties);
CREATE INDEX IF NOT EXISTS idx_representatives_stations ON representatives USING GIN(stations);
CREATE INDEX IF NOT EXISTS idx_representatives_availability ON representatives(availability);

-- Optional: county_content for CMS-editable SEO content (can be added in Phase 2)
-- CREATE TABLE IF NOT EXISTS county_content (
--   county_slug TEXT PRIMARY KEY REFERENCES counties(slug),
--   meta_title TEXT,
--   meta_description TEXT,
--   h1 TEXT,
--   intro TEXT,
--   sections JSONB,
--   updated_at TIMESTAMPTZ DEFAULT now()
-- );

-- Form submissions (contact + registration)
CREATE TABLE IF NOT EXISTS submissions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('contact', 'registration')),
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  payload JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE INDEX IF NOT EXISTS idx_submissions_type ON submissions(type);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at DESC);

-- Autonomous custody telephone discovery (KV is primary runtime store; optional Supabase mirror)
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

-- Enable RLS if required (optional; adjust policies per your security needs)
-- ALTER TABLE counties ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE stations ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE representatives ENABLE ROW LEVEL SECURITY;

-- Example policy for public read-only access:
-- CREATE POLICY "Allow public read" ON counties FOR SELECT USING (true);
-- CREATE POLICY "Allow public read" ON stations FOR SELECT USING (true);
-- CREATE POLICY "Allow public read" ON representatives FOR SELECT USING (true);
