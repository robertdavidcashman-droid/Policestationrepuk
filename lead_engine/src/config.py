from __future__ import annotations

import os
from pathlib import Path
from typing import Any

import yaml
from pydantic import BaseModel, Field


class PaidProviderConfig(BaseModel):
    enabled: bool = False
    api_key: str = ""


class PaidProvidersConfig(BaseModel):
    hunter: PaidProviderConfig = Field(default_factory=PaidProviderConfig)
    apollo: PaidProviderConfig = Field(default_factory=PaidProviderConfig)
    snov: PaidProviderConfig = Field(default_factory=PaidProviderConfig)
    zerobounce: PaidProviderConfig = Field(default_factory=PaidProviderConfig)
    neverbounce: PaidProviderConfig = Field(default_factory=PaidProviderConfig)


class AutomationConfig(BaseModel):
    enabled: bool = True
    crawl_batch_size: int = 25
    contact_batch_size: int = 25
    enrich_batch_size: int = 20
    website_resolve_batch_size: int = 15
    max_crawl_per_run: int = 50
    max_contacts_per_run: int = 50
    max_website_resolve_per_run: int = 30
    auto_broaden_on_low_yield: bool = True


class SearchConfig(BaseModel):
    serper_api_key: str = ""


class MailConfig(BaseModel):
    provider: str = "none"
    resend_api_key: str = ""
    from_email: str = ""


class EngineConfig(BaseModel):
    dry_run: bool = True
    daily_send_cap: int = 20
    crawl_delay_seconds: float = 3.0
    max_pages_per_domain: int = 30
    max_crawl_depth: int = 2
    min_score_ready_to_send: int = 60
    manual_review_min_score: int = 35
    min_contact_score_ready_to_send: int = 50
    manual_review_contact_min_score: int = 25
    allow_personal_work_emails: bool = True
    allow_free_email_domains: bool = False
    allow_paid_providers: bool = True
    allow_guessed_emails_ready_to_send: bool = False
    require_manual_approval_for_guessed_emails: bool = True
    require_source_url_or_provider: bool = True
    follow_up_enabled: bool = False
    follow_up_after_days: int = 18
    campaign_name: str = "policestationrepuk_whatsapp_feed"
    sender_name: str = "Robert Cashman"
    sender_email: str = ""
    website_url: str = "https://policestationrepuk.com"
    unsubscribe_mode: str = "reply_unsubscribe"
    database_path: str = "data/leads.db"
    export_path: str = "data/exports"
    log_path: str = "data/logs"
    user_agent: str = "PoliceStationRepUK-LeadEngine/1.0"
    laa_providers_json: str = "../data/laa-crime-providers.json"
    archive_law_firms_json: str = "../data/archive/law-firms.json"
    automation: AutomationConfig = Field(default_factory=AutomationConfig)
    search: SearchConfig = Field(default_factory=SearchConfig)
    mail: MailConfig = Field(default_factory=MailConfig)
    paid_providers: PaidProvidersConfig = Field(default_factory=PaidProvidersConfig)
    regions: list[str] = Field(default_factory=list)


def engine_root() -> Path:
    return Path(__file__).resolve().parent.parent


def load_config(path: str | Path | None = None) -> EngineConfig:
    root = engine_root()
    cfg_path = Path(path) if path else root / "config" / "config.yaml"
    if not cfg_path.exists():
        example = root / "config" / "config.example.yaml"
        if example.exists():
            data: dict[str, Any] = yaml.safe_load(example.read_text()) or {}
        else:
            data = {}
    else:
        data = yaml.safe_load(cfg_path.read_text()) or {}

    cfg = EngineConfig.model_validate(data)

    # Env overrides
    if os.getenv("SERPER_API_KEY"):
        cfg.search.serper_api_key = os.environ["SERPER_API_KEY"]
    if os.getenv("HUNTER_API_KEY"):
        cfg.paid_providers.hunter.api_key = os.environ["HUNTER_API_KEY"]
        cfg.paid_providers.hunter.enabled = True
    if os.getenv("RESEND_API_KEY"):
        cfg.mail.resend_api_key = os.environ["RESEND_API_KEY"]
    if os.getenv("LEAD_ENGINE_DRY_RUN", "").lower() == "false":
        cfg.dry_run = False

    # Resolve relative paths from lead_engine root
    if not Path(cfg.database_path).is_absolute():
        cfg.database_path = str((root / cfg.database_path).resolve())
    if not Path(cfg.export_path).is_absolute():
        cfg.export_path = str((root / cfg.export_path).resolve())
    if not Path(cfg.log_path).is_absolute():
        cfg.log_path = str((root / cfg.log_path).resolve())
    if not Path(cfg.laa_providers_json).is_absolute():
        cfg.laa_providers_json = str((root / cfg.laa_providers_json).resolve())
    if not Path(cfg.archive_law_firms_json).is_absolute():
        cfg.archive_law_firms_json = str((root / cfg.archive_law_firms_json).resolve())

    Path(cfg.export_path).mkdir(parents=True, exist_ok=True)
    Path(cfg.log_path).mkdir(parents=True, exist_ok=True)
    Path(cfg.database_path).parent.mkdir(parents=True, exist_ok=True)

    return cfg
