from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Iterator


SCHEMA_SQL = """
PRAGMA journal_mode=WAL;

CREATE TABLE IF NOT EXISTS firms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_name TEXT NOT NULL,
  sra_id TEXT,
  law_society_url TEXT,
  website TEXT,
  domain TEXT,
  address TEXT,
  town TEXT,
  county TEXT,
  postcode TEXT,
  jurisdiction TEXT,
  jurisdiction_confidence REAL DEFAULT 0,
  criminal_relevance_score INTEGER DEFAULT 0,
  practice_area_evidence TEXT,
  source_discovery_method TEXT,
  status TEXT DEFAULT 'candidate',
  exclusion_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  last_checked_at TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_firms_domain ON firms(domain) WHERE domain IS NOT NULL AND domain != '';
CREATE INDEX IF NOT EXISTS idx_firms_status ON firms(status);

CREATE TABLE IF NOT EXISTS contacts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER NOT NULL REFERENCES firms(id),
  contact_name TEXT,
  contact_role TEXT,
  contact_profile_url TEXT,
  contact_relevance_score INTEGER DEFAULT 0,
  contact_evidence TEXT,
  source_type TEXT,
  source_provider TEXT,
  status TEXT DEFAULT 'candidate',
  exclusion_reason TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_contacts_firm ON contacts(firm_id);

CREATE TABLE IF NOT EXISTS emails (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER NOT NULL REFERENCES firms(id),
  contact_id INTEGER REFERENCES contacts(id),
  email TEXT NOT NULL,
  normalised_email TEXT NOT NULL,
  domain TEXT,
  email_type TEXT NOT NULL,
  priority_score INTEGER DEFAULT 0,
  source_type TEXT NOT NULL,
  source_provider TEXT,
  source_url TEXT,
  source_page_title TEXT,
  provider_confidence_score REAL,
  first_seen_at TEXT NOT NULL,
  last_checked_at TEXT,
  verification_status TEXT DEFAULT 'unknown',
  opted_out INTEGER DEFAULT 0,
  bounce_status TEXT,
  sent_count INTEGER DEFAULT 0,
  last_sent_at TEXT,
  notes TEXT,
  status TEXT DEFAULT 'candidate'
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_emails_normalised ON emails(normalised_email);

CREATE TABLE IF NOT EXISTS outreach_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER,
  contact_id INTEGER,
  email_id INTEGER,
  campaign_name TEXT,
  subject TEXT,
  body_hash TEXT,
  sent_at TEXT,
  status TEXT,
  response_status TEXT,
  notes TEXT,
  dry_run INTEGER DEFAULT 1
);

CREATE TABLE IF NOT EXISTS suppression_list (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT,
  domain TEXT,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  source TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_suppression_email ON suppression_list(email) WHERE email IS NOT NULL;

CREATE TABLE IF NOT EXISTS crawl_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  domain TEXT,
  url TEXT,
  status_code INTEGER,
  crawled_at TEXT NOT NULL,
  success INTEGER DEFAULT 0,
  error_message TEXT,
  emails_found_count INTEGER DEFAULT 0,
  contacts_found_count INTEGER DEFAULT 0,
  relevance_terms_found TEXT
);

CREATE TABLE IF NOT EXISTS review_queue (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firm_id INTEGER,
  contact_id INTEGER,
  email_id INTEGER,
  reason TEXT NOT NULL,
  created_at TEXT NOT NULL,
  reviewed_at TEXT,
  review_decision TEXT,
  notes TEXT
);

CREATE TABLE IF NOT EXISTS paid_provider_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  provider_name TEXT NOT NULL,
  query_type TEXT,
  query_value TEXT,
  firm_id INTEGER,
  contact_id INTEGER,
  email_id INTEGER,
  response_status TEXT,
  confidence_score REAL,
  cost_estimate REAL,
  created_at TEXT NOT NULL,
  notes TEXT
);
"""


def utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


class Database:
    def __init__(self, path: str):
        self.path = path
        self._init()

    def _init(self) -> None:
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with self.connect() as conn:
            conn.executescript(SCHEMA_SQL)
            conn.commit()

    @contextmanager
    def connect(self) -> Iterator[sqlite3.Connection]:
        conn = sqlite3.connect(self.path)
        conn.row_factory = sqlite3.Row
        try:
            yield conn
        finally:
            conn.close()

    def execute(self, sql: str, params: tuple[Any, ...] = ()) -> sqlite3.Cursor:
        with self.connect() as conn:
            cur = conn.execute(sql, params)
            conn.commit()
            return cur

    def fetchone(self, sql: str, params: tuple[Any, ...] = ()) -> sqlite3.Row | None:
        with self.connect() as conn:
            return conn.execute(sql, params).fetchone()

    def fetchall(self, sql: str, params: tuple[Any, ...] = ()) -> list[sqlite3.Row]:
        with self.connect() as conn:
            return conn.execute(sql, params).fetchall()
