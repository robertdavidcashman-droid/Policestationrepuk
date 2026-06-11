from __future__ import annotations

import re

import dns.resolver

from .extract_emails import FREE_DOMAINS, normalise_email

RFC5322 = re.compile(
    r"^[a-z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?)+$"
)


def is_valid_syntax(email: str) -> bool:
    e = normalise_email(email)
    return len(e) <= 320 and bool(RFC5322.match(e))


def check_mx(domain: str) -> bool:
    try:
        answers = dns.resolver.resolve(domain, "MX")
        return len(answers) > 0
    except Exception:
        return False


def verify_email(email: str) -> dict:
    e = normalise_email(email)
    domain = e.split("@")[-1] if "@" in e else ""
    result = {
        "email": e,
        "syntax_ok": is_valid_syntax(e),
        "mx_ok": False,
        "is_free_domain": domain in FREE_DOMAINS,
        "verification_status": "invalid",
    }
    if not result["syntax_ok"]:
        return result
    result["mx_ok"] = check_mx(domain)
    if result["mx_ok"]:
        result["verification_status"] = "mx_valid"
    else:
        result["verification_status"] = "no_mx"
    return result
