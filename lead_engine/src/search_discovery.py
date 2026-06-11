from __future__ import annotations

import json
from pathlib import Path

import requests

from .config import EngineConfig

DIRECTORY_DOMAINS = (
    "facebook.com", "linkedin.com", "twitter.com", "x.com", "wikipedia.org",
    "reviewsolicitors.co.uk", "solicitors.lawsociety.org.uk", "lawsociety.org.uk",
    "legal500.com", "chambers.com", "yell.com", "thomsonlocal.com", "find-open.co.uk",
    "gov.uk", "justice.gov.uk", "sra.org.uk", "trustpilot.com", "google.com",
    "youtube.com", "instagram.com", "companieshouse.gov.uk", "yelp.com",
    "indeed.com", "glassdoor.com", "lawdepot.com", "wixsite.com",
)


def is_directory_or_social_url(url: str) -> bool:
    ul = url.lower()
    return any(d in ul for d in DIRECTORY_DOMAINS)


def pick_firm_website_from_results(firm_name: str, hits: list[dict]) -> str | None:
    """Pick the most likely firm homepage from search hits — never fabricate."""
    tokens = [t.lower() for t in firm_name.split() if len(t) > 2 and t.lower() not in ("ltd", "limited", "llp", "solicitors", "solicitor", "the")]
    for hit in hits:
        url = hit.get("url", "")
        if not url or is_directory_or_social_url(url):
            continue
        ul = url.lower()
        if any(tok in ul for tok in tokens):
            return url
    for hit in hits:
        url = hit.get("url", "")
        if url and not is_directory_or_social_url(url):
            return url
    return None


QUERY_TEMPLATES = [
    '"criminal solicitors" "{region}" "police station"',
    '"criminal defence solicitors" "{region}" contact',
    '"duty solicitor" "{region}" "criminal defence"',
    '"police station advice" "solicitors" "{region}"',
    '"24 hour police station advice" "{region}"',
    '"head of crime" "solicitor" "{region}"',
    '"crime department" "solicitors" "{region}" email',
    '"criminal legal aid solicitors" "{region}"',
]


def serper_search(api_key: str, query: str) -> list[dict]:
    if not api_key:
        return []
    try:
        res = requests.post(
            "https://google.serper.dev/search",
            headers={"X-API-KEY": api_key, "Content-Type": "application/json"},
            json={"q": query, "gl": "uk", "hl": "en", "num": 10},
            timeout=20,
        )
        if not res.ok:
            return []
        data = res.json()
        return [
            {
                "title": o.get("title", ""),
                "url": o.get("link", ""),
                "snippet": o.get("snippet", ""),
            }
            for o in data.get("organic", [])
            if o.get("link", "").startswith("http")
        ]
    except requests.RequestException:
        return []


def _norm_firm_name(name: str) -> str:
    n = name.lower().strip()
    for suffix in (" ltd", " limited", " llp", " solicitors"):
        if n.endswith(suffix):
            n = n[: -len(suffix)]
    return n.strip()


def _load_laa_firm_names(cfg: EngineConfig) -> set[str]:
    path = Path(cfg.laa_providers_json)
    if not path.exists():
        return set()
    try:
        records = json.loads(path.read_text())
    except json.JSONDecodeError:
        return set()
    return {
        _norm_firm_name(r.get("firmName", ""))
        for r in records
        if r.get("firmName")
    }


def bootstrap_archive_firms(cfg: EngineConfig) -> list[dict]:
    path = Path(cfg.archive_law_firms_json)
    if not path.exists():
        return []
    try:
        records = json.loads(path.read_text())
    except json.JSONDecodeError:
        return []
    laa_names = _load_laa_firm_names(cfg)
    firms = []
    for r in records:
        name = (r.get("name") or "").strip()
        if not name or _norm_firm_name(name) not in laa_names:
            continue
        region = (r.get("region") or "").lower()
        if region and region not in ("england", "wales"):
            continue
        firms.append({
            "firm_name": name,
            "town": r.get("county"),
            "county": r.get("county"),
            "postcode": r.get("postcode"),
            "phone": r.get("phone"),
            "website": r.get("website"),
            "email": r.get("email"),
            "sra_id": r.get("sraNumber"),
            "source_discovery_method": "archive_law_firms",
            "criminal_relevance_score": 75 if r.get("policeStationWork") else 65,
            "practice_area_evidence": "; ".join(r.get("specialisms") or [])[:500],
        })
    return firms


def bootstrap_laa_firms(cfg: EngineConfig) -> list[dict]:
    path = Path(cfg.laa_providers_json)
    if not path.exists():
        return []
    try:
        records = json.loads(path.read_text())
    except json.JSONDecodeError:
        return []
    firms = []
    for r in records:
        firms.append({
            "firm_name": r.get("firmName", "").strip(),
            "town": r.get("town"),
            "county": r.get("county"),
            "postcode": r.get("postcode"),
            "phone": r.get("phone"),
            "source_discovery_method": "laa_directory",
            "website": None,
        })
    return firms


def generate_search_queries(cfg: EngineConfig) -> list[str]:
    queries: list[str] = []
    for region in cfg.regions:
        for tpl in QUERY_TEMPLATES:
            queries.append(tpl.format(region=region))
    return queries


def discover_candidates(cfg: EngineConfig) -> list[dict]:
    """Return candidate firm dicts from LAA bootstrap + optional Serper search."""
    seen: set[str] = set()
    candidates: list[dict] = []

    for firm in bootstrap_archive_firms(cfg) + bootstrap_laa_firms(cfg):
        key = firm["firm_name"].lower()
        if key and key not in seen:
            seen.add(key)
            candidates.append(firm)

    api_key = cfg.search.serper_api_key
    if api_key:
        for q in generate_search_queries(cfg)[:50]:  # cap per run
            for hit in serper_search(api_key, q):
                url = hit["url"]
                # Skip directories we don't own evidence for as firms
                if is_directory_or_social_url(url):
                    continue
                title = hit.get("title", "")
                if title and title.lower() not in seen:
                    seen.add(title.lower())
                    candidates.append({
                        "firm_name": title[:200],
                        "website": url,
                        "source_discovery_method": "search_engine",
                        "search_snippet": hit.get("snippet", ""),
                        "search_query": q,
                    })

    return candidates
