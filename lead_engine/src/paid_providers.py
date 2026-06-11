from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from typing import Any

import requests

from .config import EngineConfig
from .database import Database, utc_now


@dataclass
class ProviderEmailResult:
    provider_name: str
    email: str
    contact_name: str | None
    role: str | None
    confidence_score: float
    verification_status: str
    source_type: str
    is_guessed: bool
    is_verified: bool
    raw_response_summary: str


class ProviderAdapter(ABC):
    name: str

    @abstractmethod
    def enrich_domain(self, domain: str) -> list[ProviderEmailResult]:
        ...

    @abstractmethod
    def enrich_contact(self, name: str, domain: str, firm_name: str | None = None) -> list[ProviderEmailResult]:
        ...

    @abstractmethod
    def verify_email(self, email: str) -> dict[str, Any]:
        ...


class HunterAdapter(ProviderAdapter):
    name = "hunter"

    def __init__(self, api_key: str):
        self.api_key = api_key

    def enrich_domain(self, domain: str) -> list[ProviderEmailResult]:
        if not self.api_key:
            return []
        url = f"https://api.hunter.io/v2/domain-search?domain={domain}&api_key={self.api_key}&limit=10"
        try:
            res = requests.get(url, timeout=15)
            if not res.ok:
                return []
            data = res.json()
            out: list[ProviderEmailResult] = []
            for item in data.get("data", {}).get("emails", []) or []:
                email = (item.get("value") or "").lower()
                if not email:
                    continue
                conf = float(item.get("confidence") or 0)
                out.append(
                    ProviderEmailResult(
                        provider_name=self.name,
                        email=email,
                        contact_name=" ".join(filter(None, [item.get("first_name"), item.get("last_name")])).strip() or None,
                        role=item.get("position"),
                        confidence_score=conf,
                        verification_status=item.get("verification", {}).get("status", "unknown"),
                        source_type="paid_provider",
                        is_guessed=conf < 50,
                        is_verified=conf >= 80 and item.get("verification", {}).get("status") == "valid",
                        raw_response_summary=f"confidence={conf}",
                    )
                )
            return out
        except requests.RequestException:
            return []

    def enrich_contact(self, name: str, domain: str, firm_name: str | None = None) -> list[ProviderEmailResult]:
        if not self.api_key:
            return []
        parts = name.split()
        first = parts[0] if parts else ""
        last = parts[-1] if len(parts) > 1 else ""
        url = (
            f"https://api.hunter.io/v2/email-finder?domain={domain}"
            f"&first_name={first}&last_name={last}&api_key={self.api_key}"
        )
        try:
            res = requests.get(url, timeout=15)
            if not res.ok:
                return []
            data = res.json().get("data") or {}
            email = (data.get("email") or "").lower()
            if not email:
                return []
            conf = float(data.get("score") or 0)
            return [
                ProviderEmailResult(
                    provider_name=self.name,
                    email=email,
                    contact_name=name,
                    role=None,
                    confidence_score=conf,
                    verification_status=data.get("verification", "unknown"),
                    source_type="paid_provider",
                    is_guessed=conf < 50,
                    is_verified=conf >= 80,
                    raw_response_summary=f"email_finder score={conf}",
                )
            ]
        except requests.RequestException:
            return []

    def verify_email(self, email: str) -> dict[str, Any]:
        if not self.api_key:
            return {"status": "not_configured"}
        url = f"https://api.hunter.io/v2/email-verifier?email={email}&api_key={self.api_key}"
        try:
            res = requests.get(url, timeout=15)
            return res.json().get("data", {}) if res.ok else {"status": "error"}
        except requests.RequestException as e:
            return {"status": "error", "message": str(e)}


class StubAdapter(ProviderAdapter):
    """Placeholder when provider not configured — never returns fabricated emails."""

    def __init__(self, name: str):
        self.name = name

    def enrich_domain(self, domain: str) -> list[ProviderEmailResult]:
        return []

    def enrich_contact(self, name: str, domain: str, firm_name: str | None = None) -> list[ProviderEmailResult]:
        return []

    def verify_email(self, email: str) -> dict[str, Any]:
        return {"status": "not_configured"}


def get_enabled_providers(cfg: EngineConfig) -> list[ProviderAdapter]:
    if not cfg.allow_paid_providers:
        return []
    providers: list[ProviderAdapter] = []
    pp = cfg.paid_providers
    if pp.hunter.enabled and pp.hunter.api_key:
        providers.append(HunterAdapter(pp.hunter.api_key))
    else:
        providers.append(StubAdapter("hunter"))
    for name in ("apollo", "snov", "zerobounce", "neverbounce"):
        providers.append(StubAdapter(name))
    return providers


def log_provider_call(
    db: Database,
    *,
    provider_name: str,
    query_type: str,
    query_value: str,
    firm_id: int | None,
    response_status: str,
    confidence_score: float | None = None,
    notes: str = "",
) -> None:
    db.execute(
        """INSERT INTO paid_provider_log
           (provider_name, query_type, query_value, firm_id, response_status, confidence_score, created_at, notes)
           VALUES (?,?,?,?,?,?,?,?)""",
        (provider_name, query_type, query_value, firm_id, response_status, confidence_score, utc_now(), notes),
    )
