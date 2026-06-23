from __future__ import annotations

import os
import tempfile
from unittest.mock import patch

from src.config import load_config
from src.database import Database
from src.pipeline import cmd_resolve_websites


def _insert_firm(db: Database, name: str, *, domain: str | None = None, website: str | None = None) -> int:
    db.execute(
        """INSERT INTO firms (firm_name, website, domain, jurisdiction, jurisdiction_confidence,
           criminal_relevance_score, source_discovery_method, status, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?)""",
        (name, website, domain, "england_wales", 0.9, 70, "test", "candidate", "t", "t"),
    )
    return db.fetchone("SELECT id FROM firms WHERE firm_name = ?", (name,))["id"]


def test_resolve_websites_skips_domain_when_already_claimed():
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "test.db")
        cfg = load_config()
        cfg.database_path = db_path
        cfg.search.serper_api_key = "test-key"
        db = Database(db_path)
        _insert_firm(db, "Owner Firm", domain="shared.co.uk", website="https://shared.co.uk")
        target_id = _insert_firm(db, "Other Office", website=None)

        hits = [{"url": "https://shared.co.uk/about"}]
        with patch("src.pipeline.serper_search", return_value=hits):
            with patch("src.pipeline.pick_firm_website_from_results", return_value="https://shared.co.uk"):
                result = cmd_resolve_websites(cfg, db, limit=15)

        row = db.fetchone("SELECT website, domain FROM firms WHERE id = ?", (target_id,))
        assert result["resolved"] == 1
        assert row["website"] == "https://shared.co.uk"
        assert row["domain"] is None
