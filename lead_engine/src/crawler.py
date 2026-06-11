from __future__ import annotations

import time
from dataclasses import dataclass
from typing import Iterable
from urllib.parse import urljoin, urlparse
from urllib.robotparser import RobotFileParser

import requests
import tldextract

from .config import EngineConfig
from .database import Database, utc_now

CRAWL_PATHS = [
    "/",
    "/contact",
    "/contact-us",
    "/about",
    "/about-us",
    "/our-people",
    "/team",
    "/people",
    "/solicitors",
    "/lawyers",
    "/partners",
    "/criminal-defence",
    "/criminal-law",
    "/crime",
    "/crime-team",
    "/police-station",
    "/police-station-advice",
    "/legal-aid",
]

CRIME_PATH_MARKERS = ("crime", "criminal", "police-station", "legal-aid", "duty")


@dataclass
class CrawlResult:
    url: str
    status_code: int
    html: str
    success: bool
    error: str | None
    on_crime_page: bool


def registrable_domain(url: str) -> str:
    ext = tldextract.extract(url)
    if ext.domain and ext.suffix:
        return f"{ext.domain}.{ext.suffix}"
    return ""


def can_fetch(rp: RobotFileParser | None, url: str, user_agent: str) -> bool:
    if rp is None:
        return True
    try:
        return rp.can_fetch(user_agent, url)
    except Exception:
        return True


def load_robots(base_url: str, user_agent: str) -> RobotFileParser | None:
    parsed = urlparse(base_url)
    robots_url = f"{parsed.scheme}://{parsed.netloc}/robots.txt"
    rp = RobotFileParser()
    try:
        rp.set_url(robots_url)
        rp.read()
        return rp
    except Exception:
        return None


def crawl_firm_website(cfg: EngineConfig, db: Database, firm_id: int, website: str) -> list[CrawlResult]:
    if not website.startswith("http"):
        website = f"https://{website}"

    domain = registrable_domain(website)
    rp = load_robots(website, cfg.user_agent)
    session = requests.Session()
    session.headers.update({"User-Agent": cfg.user_agent, "Accept": "text/html"})

    results: list[CrawlResult] = []
    visited: set[str] = set()

    def fetch_path(path: str, depth: int, on_crime: bool) -> None:
        if len(visited) >= cfg.max_pages_per_domain or depth > cfg.max_crawl_depth:
            return
        url = urljoin(website, path)
        if url in visited:
            return
        visited.add(url)

        if not can_fetch(rp, url, cfg.user_agent):
            db.execute(
                """INSERT INTO crawl_log (domain, url, status_code, crawled_at, success, error_message)
                   VALUES (?,?,?,?,?,?)""",
                (domain, url, 0, utc_now(), 0, "robots.txt disallowed"),
            )
            return

        time.sleep(cfg.crawl_delay_seconds)
        try:
            res = session.get(url, timeout=12, allow_redirects=True)
            html = res.text if "text/html" in (res.headers.get("content-type") or "") else ""
            ok = res.ok and bool(html)
            results.append(
                CrawlResult(
                    url=res.url,
                    status_code=res.status_code,
                    html=html,
                    success=ok,
                    error=None if ok else f"status {res.status_code}",
                    on_crime_page=on_crime or any(m in res.url.lower() for m in CRIME_PATH_MARKERS),
                )
            )
            db.execute(
                """INSERT INTO crawl_log (domain, url, status_code, crawled_at, success, error_message)
                   VALUES (?,?,?,?,?,?)""",
                (domain, res.url, res.status_code, utc_now(), 1 if ok else 0, None if ok else f"status {res.status_code}"),
            )
            # Depth 2: follow internal links that look like team/crime pages
            if ok and depth < cfg.max_crawl_depth:
                from bs4 import BeautifulSoup
                soup = BeautifulSoup(html, "lxml")
                for a in soup.find_all("a", href=True):
                    href = a["href"]
                    if not href.startswith("/") and domain not in href:
                        continue
                    hl = href.lower()
                    if any(m in hl for m in ("team", "people", "solicitor", "crime", "criminal", "police")):
                        fetch_path(href, depth + 1, True)
        except requests.RequestException as e:
            db.execute(
                """INSERT INTO crawl_log (domain, url, status_code, crawled_at, success, error_message)
                   VALUES (?,?,?,?,?,?)""",
                (domain, url, 0, utc_now(), 0, str(e)[:500]),
            )
            results.append(CrawlResult(url=url, status_code=0, html="", success=False, error=str(e), on_crime_page=False))

    for path in CRAWL_PATHS:
        on_crime = any(m in path for m in CRIME_PATH_MARKERS)
        fetch_path(path, 0, on_crime)

    db.execute("UPDATE firms SET last_checked_at = ? WHERE id = ?", (utc_now(), firm_id))
    return results
