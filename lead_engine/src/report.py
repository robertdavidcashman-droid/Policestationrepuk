from __future__ import annotations

from pathlib import Path

from .config import EngineConfig
from .database import Database
from .pipeline import low_yield_diagnosis


def generate_report(cfg: EngineConfig, db: Database) -> str:
    stats = {
        "total_firms": db.fetchone("SELECT COUNT(*) c FROM firms")["c"],
        "high_confidence_firms": db.fetchone(
            "SELECT COUNT(*) c FROM firms WHERE criminal_relevance_score >= ?", (cfg.min_score_ready_to_send,)
        )["c"],
        "contacts": db.fetchone("SELECT COUNT(*) c FROM contacts")["c"],
        "relevant_contacts": db.fetchone(
            "SELECT COUNT(*) c FROM contacts WHERE contact_relevance_score >= ?", (cfg.min_contact_score_ready_to_send,)
        )["c"],
        "emails_total": db.fetchone("SELECT COUNT(*) c FROM emails")["c"],
        "generic_emails": db.fetchone("SELECT COUNT(*) c FROM emails WHERE email_type='generic_business'")["c"],
        "personal_work_emails": db.fetchone("SELECT COUNT(*) c FROM emails WHERE email_type='individual_work'")["c"],
        "paid_emails": db.fetchone("SELECT COUNT(*) c FROM emails WHERE source_type='paid_provider'")["c"],
        "ready_to_send": db.fetchone("SELECT COUNT(*) c FROM emails WHERE status='ready_to_send'")["c"],
        "manual_review": db.fetchone("SELECT COUNT(*) c FROM emails WHERE status='manual_review'")["c"],
        "sent": db.fetchone("SELECT COUNT(*) c FROM firms WHERE status='sent'")["c"],
        "bounced": db.fetchone("SELECT COUNT(*) c FROM emails WHERE bounce_status='bounced'")["c"],
        "opted_out": db.fetchone("SELECT COUNT(*) c FROM emails WHERE opted_out=1")["c"],
        "excluded": db.fetchone("SELECT COUNT(*) c FROM firms WHERE status='excluded'")["c"],
        "crawl_errors": db.fetchone("SELECT COUNT(*) c FROM crawl_log WHERE success=0")["c"],
    }

    top_regions = db.fetchall(
        "SELECT county, COUNT(*) c FROM firms WHERE county IS NOT NULL GROUP BY county ORDER BY c DESC LIMIT 10"
    )
    top_exclusions = db.fetchall(
        "SELECT exclusion_reason, COUNT(*) c FROM firms WHERE exclusion_reason IS NOT NULL GROUP BY exclusion_reason ORDER BY c DESC LIMIT 10"
    )
    provider_perf = db.fetchall(
        "SELECT provider_name, COUNT(*) calls, AVG(confidence_score) avg_conf FROM paid_provider_log GROUP BY provider_name"
    )

    yield_info = low_yield_diagnosis(db)

    lines = [
        "# PoliceStationRepUK Lead Engine Report",
        "",
        f"**Dry run mode:** `{cfg.dry_run}` (live sends blocked unless `dry_run: false`)",
        "",
        "## Summary",
        f"- Total firms discovered: **{stats['total_firms']}**",
        f"- High-confidence criminal firms (score ≥ {cfg.min_score_ready_to_send}): **{stats['high_confidence_firms']}**",
        f"- Contacts found: **{stats['contacts']}** (relevant: {stats['relevant_contacts']})",
        f"- Emails: **{stats['emails_total']}** (generic: {stats['generic_emails']}, personal work: {stats['personal_work_emails']}, paid: {stats['paid_emails']})",
        f"- Ready to send: **{stats['ready_to_send']}**",
        f"- Manual review: **{stats['manual_review']}**",
        f"- Sent: **{stats['sent']}** | Bounced: **{stats['bounced']}** | Opted out: **{stats['opted_out']}**",
        f"- Excluded firms: **{stats['excluded']}**",
        f"- Recent crawl errors: **{stats['crawl_errors']}**",
        "",
    ]

    if yield_info["low_yield"]:
        lines.append("## ⚠ Low-yield warning")
        lines.append(f"- Firms: {yield_info['firms']} (threshold 50)")
        lines.append(f"- Emails: {yield_info['emails']} (threshold 100)")
        for d in yield_info["diagnosis"]:
            lines.append(f"  - {d}")
        lines.append("")

    if top_regions:
        lines.append("## Top regions")
        for r in top_regions:
            lines.append(f"- {r['county']}: {r['c']}")
        lines.append("")

    if top_exclusions:
        lines.append("## Top exclusion reasons")
        for r in top_exclusions:
            lines.append(f"- {r['exclusion_reason']}: {r['c']}")
        lines.append("")

    if provider_perf:
        lines.append("## Paid provider performance")
        for p in provider_perf:
            lines.append(f"- {p['provider_name']}: {p['calls']} calls, avg confidence {p['avg_conf'] or 0:.1f}")
        lines.append("")

    lines.extend([
        "## Compliance confirmations",
        "- No email addresses are fabricated; guessed/inferred emails stay out of `ready_to_send`.",
        "- Every `ready_to_send` email requires a `source_url` or `source_provider` when `require_source_url_or_provider` is true.",
        "- Personal solicitor work emails are allowed when publicly found or paid-verified with criminal relevance.",
        "- Suppression list is permanent; opted-out and bounced addresses are not re-contacted automatically.",
        "",
        f"Exports directory: `{cfg.export_path}`",
    ])

    report_text = "\n".join(lines)
    report_path = Path(cfg.log_path) / "weekly_report.md"
    report_path.parent.mkdir(parents=True, exist_ok=True)
    report_path.write_text(report_text, encoding="utf-8")
    return report_text
