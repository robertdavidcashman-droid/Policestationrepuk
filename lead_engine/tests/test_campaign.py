from src.database import Database
from src.mailer import run_campaign
from src.config import load_config
import tempfile
import os


def test_dry_run_does_not_require_mail_provider():
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "t.db")
        cfg = load_config()
        cfg.database_path = db_path
        cfg.export_path = tmp
        cfg.dry_run = True
        db = Database(db_path)
        now = "2025-01-01T00:00:00+00:00"
        db.execute(
            """INSERT INTO firms (firm_name, website, jurisdiction, jurisdiction_confidence, criminal_relevance_score,
               source_discovery_method, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?,?)""",
            ("Crime LLP", "https://crime.example", "england_wales", 0.9, 80, "test", "ready_to_send", now, now),
        )
        fid = db.fetchone("SELECT id FROM firms")["id"]
        db.execute(
            """INSERT INTO emails (firm_id, email, normalised_email, domain, email_type, priority_score,
               source_type, source_url, first_seen_at, verification_status, status)
               VALUES (?,?,?,?,?,?,?,?,?,?,?)""",
            (fid, "crime@crime.example", "crime@crime.example", "crime.example", "generic_business", 50,
             "public_website", "https://crime.example/contact", now, "mx_valid", "ready_to_send"),
        )
        result = run_campaign(cfg, db, force_dry_run=True)
        assert result["dry_run"] is True
        assert result["would_send_count"] >= 1
        log = db.fetchone("SELECT status, dry_run FROM outreach_log")
        assert log["status"] == "dry_run"
        assert log["dry_run"] == 1
