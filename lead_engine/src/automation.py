from __future__ import annotations

import json
from datetime import datetime, timezone
from pathlib import Path

from .config import EngineConfig, load_config
from .database import Database
from .exporter import export_all
from .mailer import run_campaign
from .pipeline import (
    cmd_classify,
    cmd_classify_contacts,
    cmd_contacts,
    cmd_crawl,
    cmd_discover,
    cmd_enrich,
    cmd_resolve_websites,
    cmd_verify,
    low_yield_diagnosis,
)
from .report import generate_report


def _adaptive_limits(cfg: EngineConfig, db: Database) -> dict[str, int]:
    """Increase batch sizes when yield is low and auto-broaden is enabled."""
    auto = cfg.automation
    yield_info = low_yield_diagnosis(db)
    crawl = auto.crawl_batch_size
    contacts = auto.contact_batch_size
    enrich = auto.enrich_batch_size
    resolve = auto.website_resolve_batch_size

    if auto.auto_broaden_on_low_yield and yield_info["low_yield"]:
        crawl = min(crawl * 2, auto.max_crawl_per_run)
        contacts = min(contacts * 2, auto.max_contacts_per_run)
        resolve = min(resolve * 2, auto.max_website_resolve_per_run)
        if cfg.search.serper_api_key:
            resolve = max(resolve, 20)

    return {
        "crawl": crawl,
        "contacts": contacts,
        "enrich": enrich,
        "resolve": resolve,
    }


def run_automation(cfg: EngineConfig | None = None) -> dict:
    """Run the full lead pipeline end-to-end with adaptive batching and logging."""
    cfg = cfg or load_config()
    db = Database(cfg.database_path)
    started = datetime.now(timezone.utc).isoformat()
    steps: dict = {}

    def _step(name: str, fn):
        print(f"[auto] {name}...", flush=True)
        result = fn()
        print(f"[auto] {name} done: {result}", flush=True)
        return result

    steps["discover"] = _step("discover", lambda: cmd_discover(cfg, db))
    limits = _adaptive_limits(cfg, db)
    print(f"[auto] limits: {limits}", flush=True)
    steps["resolve_websites"] = _step(
        "resolve_websites", lambda: cmd_resolve_websites(cfg, db, limit=limits["resolve"])
    )
    steps["crawl"] = _step("crawl", lambda: cmd_crawl(cfg, db, limit=limits["crawl"]))
    steps["contacts"] = _step("contacts", lambda: cmd_contacts(cfg, db, limit=limits["contacts"]))
    steps["classify"] = _step("classify", lambda: cmd_classify(cfg, db))
    steps["classify_contacts"] = _step("classify_contacts", lambda: cmd_classify_contacts(cfg, db))
    steps["enrich"] = _step("enrich", lambda: cmd_enrich(cfg, db, limit=limits["enrich"]))
    steps["verify"] = _step("verify", lambda: cmd_verify(cfg, db))
    steps["export"] = _step("export", lambda: export_all(cfg, db))

    force_dry = cfg.dry_run
    steps["campaign"] = _step("campaign", lambda: run_campaign(cfg, db, force_dry_run=force_dry))
    steps["low_yield"] = low_yield_diagnosis(db)

    report_text = generate_report(cfg, db)
    steps["report"] = {"written": True, "length": len(report_text)}

    finished = datetime.now(timezone.utc).isoformat()
    summary = {
        "started_at": started,
        "finished_at": finished,
        "dry_run": cfg.dry_run,
        "limits_used": limits,
        "total_firms": db.fetchone("SELECT COUNT(*) c FROM firms")["c"],
        "total_emails": db.fetchone("SELECT COUNT(*) c FROM emails")["c"],
        "ready_to_send": db.fetchone("SELECT COUNT(*) c FROM emails WHERE status='ready_to_send'")["c"],
        "manual_review": db.fetchone("SELECT COUNT(*) c FROM emails WHERE status='manual_review'")["c"],
        "would_send_today": steps["campaign"].get("would_send_count", 0),
        "live_sent": steps["campaign"].get("live_sent", 0),
        "steps": steps,
    }

    log_dir = Path(cfg.log_path)
    log_dir.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%d-%H%M%S")
    log_path = log_dir / f"automation-{stamp}.json"
    log_path.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    latest_path = log_dir / "automation-latest.json"
    latest_path.write_text(json.dumps(summary, indent=2, default=str), encoding="utf-8")
    summary["log_path"] = str(log_path)
    return summary
