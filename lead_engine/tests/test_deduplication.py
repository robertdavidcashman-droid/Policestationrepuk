from src.database import Database
from src.extract_emails import normalise_email
from src.pipeline import _store_email
from src.config import load_config
import tempfile
import os


def test_dedupe_emails():
    with tempfile.TemporaryDirectory() as tmp:
        db_path = os.path.join(tmp, "test.db")
        cfg = load_config()
        cfg.database_path = db_path
        db = Database(db_path)
        db.execute(
            """INSERT INTO firms (firm_name, jurisdiction, jurisdiction_confidence, criminal_relevance_score,
               source_discovery_method, status, created_at, updated_at) VALUES (?,?,?,?,?,?,?,?)""",
            ("Test Firm", "england_wales", 0.9, 70, "test", "candidate", "t", "t"),
        )
        fid = db.fetchone("SELECT id FROM firms")["id"]
        n1 = _store_email(db, cfg, fid, None, "crime@firm.co.uk", "generic_business", 50,
                          "public_website", None, "https://firm.co.uk", "", None, "mx_valid")
        n2 = _store_email(db, cfg, fid, None, "Crime@Firm.CO.UK", "generic_business", 50,
                          "public_website", None, "https://firm.co.uk", "", None, "mx_valid")
        assert n1 == 1
        assert n2 == 0
        count = db.fetchone("SELECT COUNT(*) c FROM emails")["c"]
        assert count == 1
        assert normalise_email("Crime@Firm.CO.UK") == "crime@firm.co.uk"
