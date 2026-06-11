from __future__ import annotations

import argparse
import json
import sys

from .config import load_config
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
    cmd_verify,
    low_yield_diagnosis,
)
from .report import generate_report
from .suppression import add_suppression
from .automation import run_automation


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="PoliceStationRepUK lead engine")
    parser.add_argument("--config", help="Path to config.yaml")
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("discover", help="Discover candidate firms")
    p_crawl = sub.add_parser("crawl", help="Crawl firm websites and extract emails")
    p_crawl.add_argument("--limit", type=int, default=50)
    p_contacts = sub.add_parser("contacts", help="Extract contacts from team pages")
    p_contacts.add_argument("--limit", type=int, default=50)
    sub.add_parser("classify", help="Classify firm criminal relevance")
    sub.add_parser("classify-contacts", help="Classify contact relevance")
    p_enrich = sub.add_parser("enrich", help="Run paid enrichment where configured")
    p_enrich.add_argument("--limit", type=int, default=30)
    sub.add_parser("verify", help="Verify emails and assign ready/manual/excluded status")
    sub.add_parser("export", help="Export CSV files")
    p_campaign = sub.add_parser("campaign", help="Run outreach campaign")
    p_campaign.add_argument("--dry-run", action="store_true", default=None, help="Force dry run")
    p_campaign.add_argument("--live", action="store_true", help="Attempt live send (requires dry_run=false in config)")
    sub.add_parser("report", help="Generate markdown report")
    p_suppress = sub.add_parser("suppress", help="Add email/domain to suppression list")
    p_suppress.add_argument("--email")
    p_suppress.add_argument("--domain")
    p_suppress.add_argument("--reason", default="manual")
    sub.add_parser("run-all", help="Run discover→verify→export→campaign dry-run")
    sub.add_parser("auto", help="Full automated pipeline (discover, resolve, crawl, verify, export, campaign, report)")

    args = parser.parse_args(argv)
    cfg = load_config(args.config)
    db = Database(cfg.database_path)
    result: dict = {}

    if args.command == "discover":
        result = cmd_discover(cfg, db)
    elif args.command == "crawl":
        result = cmd_crawl(cfg, db, limit=args.limit)
    elif args.command == "contacts":
        result = cmd_contacts(cfg, db, limit=args.limit)
    elif args.command == "classify":
        result = cmd_classify(cfg, db)
    elif args.command == "classify-contacts":
        result = cmd_classify_contacts(cfg, db)
    elif args.command == "enrich":
        result = cmd_enrich(cfg, db, limit=args.limit)
    elif args.command == "verify":
        result = cmd_verify(cfg, db)
    elif args.command == "export":
        result = export_all(cfg, db)
    elif args.command == "campaign":
        force_dry = True
        if args.live and not cfg.dry_run:
            force_dry = False
        elif args.dry_run is not None:
            force_dry = True
        else:
            force_dry = cfg.dry_run
        result = run_campaign(cfg, db, force_dry_run=force_dry)
    elif args.command == "report":
        text = generate_report(cfg, db)
        print(text)
        result = {"report": "written"}
    elif args.command == "suppress":
        add_suppression(db, email=args.email, domain=args.domain, reason=args.reason, source="cli")
        result = {"suppressed": args.email or args.domain}
    elif args.command == "auto":
        result = run_automation(cfg)
    elif args.command == "run-all":
        result = {
            "discover": cmd_discover(cfg, db),
            "crawl": cmd_crawl(cfg, db, limit=20),
            "contacts": cmd_contacts(cfg, db, limit=20),
            "classify": cmd_classify(cfg, db),
            "classify_contacts": cmd_classify_contacts(cfg, db),
            "enrich": cmd_enrich(cfg, db, limit=10),
            "verify": cmd_verify(cfg, db),
            "export": export_all(cfg, db),
            "campaign": run_campaign(cfg, db, force_dry_run=True),
            "low_yield": low_yield_diagnosis(db),
        }
        generate_report(cfg, db)

    print(json.dumps(result, indent=2, default=str))
    return 0


if __name__ == "__main__":
    sys.exit(main())
