from __future__ import annotations

import json
import re
from dataclasses import dataclass
from typing import Iterable
from urllib.parse import unquote

EMAIL_RE = re.compile(
    r"[a-z0-9._%+\-]+@[a-z0-9.\-]+\.[a-z]{2,}",
    re.IGNORECASE,
)

MAILTO_RE = re.compile(r"mailto:([^\s\"'?]+)", re.I)

# Obfuscation patterns — only normalise when clearly visible on page
OBFUSCATION_PATTERNS = [
    (re.compile(r"([a-z0-9._%+\-]+)\s*\[at\]\s*([a-z0-9.\-]+)\s*\[dot\]\s*([a-z]{2,})", re.I), r"\1@\2.\3"),
    (re.compile(r"([a-z0-9._%+\-]+)\s*\(at\)\s*([a-z0-9.\-]+)\s*\(dot\)\s*([a-z]{2,})", re.I), r"\1@\2.\3"),
    (re.compile(r"([a-z0-9._%+\-]+)\s*@\s*([a-z0-9.\-]+)\s*\.\s*([a-z]{2,})", re.I), r"\1@\2.\3"),
]

EXCLUDED_LOCALS = {
    "complaints", "accounts", "finance", "billing", "careers", "recruitment", "jobs",
    "vacancies", "press", "media", "marketing", "privacy", "dpo", "data", "dataprotection",
    "noreply", "no-reply", "donotreply", "webmaster", "postmaster", "abuse",
}

HIGH_PRIORITY_LOCALS = {
    "crime": 50, "criminal": 48, "criminaldefence": 48, "criminal.defence": 48,
    "policestation": 45, "policestationadvice": 45, "police.station": 42,
    "police.station.advice": 42,
}

GOOD_GENERIC_LOCALS = {
    "enquiries": 35, "enquiry": 35, "info": 30, "reception": 28, "admin": 25,
    "office": 25, "contact": 28, "mail": 22, "general": 22, "law": 20, "legal": 20, "advice": 22,
}

FREE_DOMAINS = {
    "gmail.com", "googlemail.com", "hotmail.com", "hotmail.co.uk", "outlook.com",
    "yahoo.com", "yahoo.co.uk", "aol.com", "icloud.com", "proton.me", "protonmail.com",
}


@dataclass
class ExtractedEmail:
    email: str
    local_part: str
    domain: str
    email_type: str
    priority_score: int
    source_fragment: str


def normalise_email(email: str) -> str:
    return email.strip().lower()


def deobfuscate_text(text: str) -> str:
    out = text
    for pattern, repl in OBFUSCATION_PATTERNS:
        out = pattern.sub(repl, out)
    return out


def extract_json_ld_emails(html: str) -> list[str]:
    found: list[str] = []
    for block in re.findall(r'<script[^>]*type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.S | re.I):
        try:
            data = json.loads(block)
            _walk_json_ld(data, found)
        except json.JSONDecodeError:
            continue
    return found


def _walk_json_ld(node, found: list[str]) -> None:
    if isinstance(node, dict):
        for k, v in node.items():
            if k.lower() == "email" and isinstance(v, str) and "@" in v:
                found.append(v)
            else:
                _walk_json_ld(v, found)
    elif isinstance(node, list):
        for item in node:
            _walk_json_ld(item, found)


def score_email(local: str, domain: str, is_personal_pattern: bool = False) -> tuple[str, int]:
    base = local.split("+")[0]
    if base in EXCLUDED_LOCALS:
        return "excluded", 0
    if domain in FREE_DOMAINS:
        return "personal_free", 5
    if base in HIGH_PRIORITY_LOCALS:
        return "generic_business", HIGH_PRIORITY_LOCALS[base]
    if base in GOOD_GENERIC_LOCALS:
        return "generic_business", GOOD_GENERIC_LOCALS[base]
    if is_personal_pattern:
        return "individual_work", 40
    # Named local on firm domain without guessing — still individual if looks like name
    if re.match(r"^[a-z]+\.[a-z]+$", base) or re.match(r"^[a-z]{2,}\.[a-z]{2,}$", base):
        return "individual_work", 38
    return "generic_business", 15


def extract_emails_from_html(html: str, page_url: str = "") -> list[ExtractedEmail]:
    text = deobfuscate_text(html)
    candidates: set[str] = set()

    for m in MAILTO_RE.finditer(html):
        candidates.add(unquote(m.group(1)).split("?")[0].strip())

    for m in EMAIL_RE.finditer(text):
        candidates.add(m.group(0))

    for e in extract_json_ld_emails(html):
        candidates.add(e)

    results: list[ExtractedEmail] = []
    for raw in candidates:
        email = normalise_email(raw)
        if "@" not in email or len(email) > 320:
            continue
        local, _, domain = email.partition("@")
        if not local or not domain or "." not in domain:
            continue
        email_type, priority = score_email(local, domain)
        if email_type == "excluded":
            continue
        results.append(
            ExtractedEmail(
                email=email,
                local_part=local,
                domain=domain,
                email_type=email_type,
                priority_score=priority,
                source_fragment=page_url,
            )
        )

    # Dedupe by email, keep highest priority
    by_email: dict[str, ExtractedEmail] = {}
    for r in results:
        prev = by_email.get(r.email)
        if not prev or r.priority_score > prev.priority_score:
            by_email[r.email] = r
    return sorted(by_email.values(), key=lambda x: -x.priority_score)
