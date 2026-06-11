from __future__ import annotations

import re
from dataclasses import dataclass

from bs4 import BeautifulSoup

ROLE_HINTS = re.compile(
    r"(solicitor|partner|director|consultant|head of crime|duty solicitor|"
    r"criminal defence|crime department|legal executive|advocate|caseworker)",
    re.I,
)


@dataclass
class ExtractedContact:
    contact_name: str
    contact_role: str
    profile_url: str
    profile_text: str
    on_crime_page: bool


def _clean_name(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


def extract_contacts_from_html(html: str, page_url: str, on_crime_page: bool = False) -> list[ExtractedContact]:
    soup = BeautifulSoup(html, "lxml")
    contacts: list[ExtractedContact] = []
    seen: set[str] = set()

    # Cards / team members
    for card in soup.select("article, .team-member, .solicitor, .profile, .people-item, li"):
        heading = card.find(["h1", "h2", "h3", "h4", "strong"])
        if not heading:
            continue
        name = _clean_name(heading.get_text())
        if len(name) < 4 or len(name) > 80:
            continue
        if not re.search(r"[A-Za-z]", name):
            continue

        role_el = card.find(class_=re.compile(r"role|title|position|job", re.I))
        role = _clean_name(role_el.get_text()) if role_el else ""
        if not role:
            # First paragraph after name
            p = card.find("p")
            role = _clean_name(p.get_text()[:120]) if p else ""

        if not ROLE_HINTS.search(f"{name} {role}"):
            continue

        link = card.find("a", href=True)
        profile_url = ""
        if link and link.get("href", "").startswith("http"):
            profile_url = link["href"]
        elif link and link.get("href", "").startswith("/"):
            from urllib.parse import urljoin
            profile_url = urljoin(page_url, link["href"])

        key = name.lower()
        if key in seen:
            continue
        seen.add(key)

        profile_text = _clean_name(card.get_text(" ", strip=True))[:2000]
        contacts.append(
            ExtractedContact(
                contact_name=name,
                contact_role=role[:200],
                profile_url=profile_url,
                profile_text=profile_text,
                on_crime_page=on_crime_page,
            )
        )

    return contacts[:50]
