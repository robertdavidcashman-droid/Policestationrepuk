from __future__ import annotations

import re
from dataclasses import dataclass

POSITIVE = [
    ("criminal defence", 30),
    ("criminal defense", 30),
    ("criminal law", 25),
    ("crime department", 25),
    ("police station advice", 30),
    ("police station representation", 30),
    ("24 hour police station", 25),
    ("24-hour police station", 25),
    ("duty solicitor", 25),
    ("pace interview", 25),
    ("interview under caution", 20),
    ("magistrates court", 15),
    ("magistrates' court", 15),
    ("crown court", 15),
    ("youth court", 15),
    ("criminal legal aid", 25),
    ("legal aid crime", 20),
    ("police station accredited", 20),
    ("crime solicitors", 20),
    ("criminal solicitors", 20),
]

NEGATIVE = [
    ("conveyancing only", -50),
    ("family law only", -50),
    ("wills and probate only", -50),
    ("employment law only", -40),
    ("personal injury only", -50),
    ("immigration only", -40),
    ("commercial law only", -40),
    ("corporate law only", -40),
    ("recruitment", -40),
    ("claims management", -50),
]

CRIME_URL_PARTS = (
    "/crime",
    "/criminal-defence",
    "/criminal-defense",
    "/criminal-law",
    "/police-station",
    "/legal-aid",
)


@dataclass
class FirmClassification:
    score: int
    evidence: list[str]
    status: str  # high_confidence_criminal_firm | manual_review | excluded

    @property
    def practice_area_evidence(self) -> str:
        return "; ".join(self.evidence[:12])


def classify_firm_text(text: str, urls: list[str] | None = None) -> FirmClassification:
    blob = text.lower()
    score = 0
    evidence: list[str] = []

    for phrase, pts in POSITIVE:
        if phrase in blob:
            score += pts
            evidence.append(f"+{pts}:{phrase}")

    for phrase, pts in NEGATIVE:
        if phrase in blob:
            score += pts
            evidence.append(f"{pts}:{phrase}")

    for url in urls or []:
        ul = url.lower()
        for part in CRIME_URL_PARTS:
            if part in ul:
                score += 20
                evidence.append(f"+20:url{part}")
                break

    if score >= 60:
        status = "high_confidence_criminal_firm"
    elif score >= 35:
        status = "manual_review"
    else:
        status = "excluded"

    return FirmClassification(score=score, evidence=evidence, status=status)


def extract_evidence_snippets(text: str, limit: int = 3) -> list[str]:
    snippets = []
    for phrase, _ in POSITIVE:
        m = re.search(re.escape(phrase), text, re.I)
        if m:
            start = max(0, m.start() - 40)
            end = min(len(text), m.end() + 40)
            snippets.append(text[start:end].strip())
        if len(snippets) >= limit:
            break
    return snippets
