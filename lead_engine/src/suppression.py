from __future__ import annotations

from .database import Database, utc_now
from .extract_emails import normalise_email


def is_suppressed(db: Database, email: str | None = None, domain: str | None = None) -> bool:
    if email:
        row = db.fetchone(
            "SELECT 1 FROM suppression_list WHERE email = ? LIMIT 1",
            (normalise_email(email),),
        )
        if row:
            return True
    if domain:
        row = db.fetchone(
            "SELECT 1 FROM suppression_list WHERE domain = ? LIMIT 1",
            (domain.lower(),),
        )
        if row:
            return True
    return False


def add_suppression(
    db: Database,
    *,
    email: str | None = None,
    domain: str | None = None,
    reason: str,
    source: str = "system",
) -> None:
    now = utc_now()
    if email:
        e = normalise_email(email)
        existing = db.fetchone("SELECT id FROM suppression_list WHERE email = ?", (e,))
        if not existing:
            db.execute(
                "INSERT INTO suppression_list (email, domain, reason, created_at, source) VALUES (?,?,?,?,?)",
                (e, None, reason, now, source),
            )
    if domain:
        d = domain.lower()
        existing = db.fetchone(
            "SELECT id FROM suppression_list WHERE domain = ? AND email IS NULL",
            (d,),
        )
        if not existing:
            db.execute(
                "INSERT INTO suppression_list (email, domain, reason, created_at, source) VALUES (?,?,?,?,?)",
                (None, d, reason, now, source),
            )
