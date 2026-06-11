from __future__ import annotations

import time

import json
import schedule

from .automation import run_automation
from .config import load_config


def run_full_pipeline() -> None:
    summary = run_automation(load_config())
    print(json.dumps(summary, indent=2, default=str))


def start_scheduler() -> None:
    schedule.every().day.at("03:00").do(run_full_pipeline)
    schedule.every().monday.at("09:00").do(run_full_pipeline)
    while True:
        schedule.run_pending()
        time.sleep(60)


if __name__ == "__main__":
    start_scheduler()
