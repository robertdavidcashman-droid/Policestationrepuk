from src.database import Database
from src.suppression import add_suppression, is_suppressed
import tempfile
import os


def test_suppression_blocks_email():
    with tempfile.TemporaryDirectory() as tmp:
        db = Database(os.path.join(tmp, "t.db"))
        add_suppression(db, email="optout@firm.co.uk", reason="unsubscribe", source="test")
        assert is_suppressed(db, email="optout@firm.co.uk")
        assert not is_suppressed(db, email="other@firm.co.uk")


def test_suppression_blocks_domain():
    with tempfile.TemporaryDirectory() as tmp:
        db = Database(os.path.join(tmp, "t.db"))
        add_suppression(db, domain="blocked.co.uk", reason="domain_optout")
        assert is_suppressed(db, domain="blocked.co.uk")
