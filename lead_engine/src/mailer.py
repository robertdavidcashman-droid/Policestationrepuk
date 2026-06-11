from __future__ import annotations

import hashlib
import re
from pathlib import Path

import requests

from .config import EngineConfig, engine_root
from .database import Database, utc_now
from .suppression import is_suppressed


def load_template(name: str) -> str:
    path = engine_root() / "config" / name
    return path.read_text(encoding="utf-8")


def first_name(contact_name: str | None) -> str:
    if not contact_name:
        return "Sir/Madam"
    parts = contact_name.strip().split()
    return parts[0] if parts else "Sir/Madam"


def render_template(template: str, *, contact_name: str | None, cfg: EngineConfig) -> str:
    body = template.replace("{{contact_first_name}}", first_name(contact_name))
    body = body.replace("{{sender_name}}", cfg.sender_name)
    body = body.replace("{{website_url}}", cfg.website_url)
    return body


def body_hash(body: str) -> str:
    return hashlib.sha256(body.encode()).hexdigest()[:16]


def pick_best_email_per_firm(rows: list) -> list:
    """Prefer crime generic, then relevant individual, then other generic."""
    type_rank = {"generic_business": 0, "individual_work": 1, "paid_verified": 2}
    by_firm: dict[int, dict] = {}
    for r in rows:
        fid = r["firm_id"]
        priority = r["priority_score"] or 0
        local = (r["email"] or "").split("@")[0]
        crime_boost = 100 if local in ("crime", "criminal", "policestation", "criminaldefence") else 0
        score = crime_boost + priority + (r["contact_relevance_score"] or 0)
        prev = by_firm.get(fid)
        if not prev or score > prev["_rank"]:
            by_firm[fid] = {**dict(r), "_rank": score}
    return list(by_firm.values())


def run_campaign(cfg: EngineConfig, db: Database, *, force_dry_run: bool | None = None) -> dict:
    dry = cfg.dry_run if force_dry_run is None else force_dry_run
    generic_tpl = load_template("email_template_generic.txt")
    named_tpl = load_template("email_template_named_contact.txt")
    subject = "Police station agent cover / WhatsApp feed"

    rows = db.fetchall(
        """SELECT e.id AS email_id, e.email, e.email_type, e.priority_score, e.source_url, e.source_provider,
                  e.sent_count, f.id AS firm_id, f.firm_name, f.criminal_relevance_score, f.website,
                  c.id AS contact_id, c.contact_name, c.contact_relevance_score
           FROM emails e
           JOIN firms f ON f.id = e.firm_id
           LEFT JOIN contacts c ON c.id = e.contact_id
           WHERE e.status = 'ready_to_send' AND e.opted_out = 0 AND COALESCE(e.bounce_status,'') != 'bounced'
             AND COALESCE(e.sent_count,0) = 0
           ORDER BY e.priority_score DESC"""
    )
    selected = pick_best_email_per_firm(rows)[: cfg.daily_send_cap]

    sent = 0
    dry_rows: list[dict] = []

    for r in selected:
        if is_suppressed(db, email=r["email"]):
            dry_rows.append({
                "firm_name": r["firm_name"],
                "contact_name": r["contact_name"],
                "email": r["email"],
                "subject": subject,
                "template_used": "skipped",
                "would_send": False,
                "reason": "suppressed",
                "source_url": r["source_url"],
                "source_provider": r["source_provider"],
                "criminal_relevance_score": r["criminal_relevance_score"],
                "contact_relevance_score": r["contact_relevance_score"],
            })
            continue

        use_named = bool(r["contact_name"]) and r["email_type"] in ("individual_work", "paid_verified")
        template_used = "email_template_named_contact.txt" if use_named else "email_template_generic.txt"
        body = render_template(named_tpl if use_named else generic_tpl, contact_name=r["contact_name"], cfg=cfg)
        would_send = True
        reason = "meets ready_to_send criteria"

        dry_rows.append({
            "firm_name": r["firm_name"],
            "contact_name": r["contact_name"],
            "email": r["email"],
            "subject": subject,
            "template_used": template_used,
            "would_send": would_send,
            "reason": reason,
            "source_url": r["source_url"],
            "source_provider": r["source_provider"],
            "criminal_relevance_score": r["criminal_relevance_score"],
            "contact_relevance_score": r["contact_relevance_score"],
        })

        now = utc_now()
        db.execute(
            """INSERT INTO outreach_log (firm_id, contact_id, email_id, campaign_name, subject, body_hash, sent_at, status, dry_run)
               VALUES (?,?,?,?,?,?,?,?,?)""",
            (
                r["firm_id"], r["contact_id"], r["email_id"], cfg.campaign_name,
                subject, body_hash(body), now, "dry_run" if dry else "queued", 1 if dry else 0,
            ),
        )

        if dry:
            continue

        if cfg.mail.provider == "resend" and cfg.mail.resend_api_key and cfg.mail.from_email:
            try:
                res = requests.post(
                    "https://api.resend.com/emails",
                    headers={"Authorization": f"Bearer {cfg.mail.resend_api_key}"},
                    json={
                        "from": cfg.mail.from_email,
                        "to": [r["email"]],
                        "subject": subject,
                        "text": body,
                    },
                    timeout=20,
                )
                status = "sent" if res.ok else f"error:{res.status_code}"
            except requests.RequestException as e:
                status = f"error:{e}"
        else:
            status = "skipped_no_mail_provider"

        if status == "sent":
            sent += 1
            db.execute(
                "UPDATE emails SET sent_count = COALESCE(sent_count,0)+1, last_sent_at=? WHERE id=?",
                (now, r["email_id"]),
            )
            db.execute("UPDATE firms SET status='sent' WHERE id=?", (r["firm_id"],))

    # Export dry run CSV
    import pandas as pd
    out = Path(cfg.export_path) / "campaign_dry_run.csv"
    pd.DataFrame(dry_rows).to_csv(out, index=False)

    return {"dry_run": dry, "would_send_count": sum(1 for d in dry_rows if d["would_send"]), "live_sent": sent, "export": str(out)}
