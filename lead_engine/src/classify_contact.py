from __future__ import annotations

from dataclasses import dataclass

CONTACT_POSITIVE = [
    ("head of crime", 40),
    ("criminal defence solicitor", 35),
    ("crime solicitor", 30),
    ("duty solicitor", 35),
    ("police station representative", 30),
    ("police station accredited", 30),
    ("criminal legal aid", 25),
    ("magistrates court", 15),
    ("crown court", 15),
    ("youth court", 15),
    ("pace interview", 20),
    ("criminal advocate", 25),
    ("higher court advocate", 20),
]

CONTACT_NEGATIVE = [
    ("conveyancing", -40),
    ("family law", -30),
    ("wills", -30),
    ("probate", -30),
    ("employment", -25),
    ("immigration", -25),
    ("personal injury", -30),
    ("accounts", -50),
    ("complaints", -50),
    ("recruitment", -50),
    ("privacy", -50),
    ("data protection", -50),
    ("hr ", -40),
]


@dataclass
class ContactClassification:
    score: int
    evidence: list[str]
    status: str  # ready_to_send | manual_review | excluded

    @property
    def contact_evidence(self) -> str:
        return "; ".join(self.evidence[:10])


def classify_contact(role: str, profile_text: str, on_crime_page: bool = False) -> ContactClassification:
    blob = f"{role} {profile_text}".lower()
    score = 0
    evidence: list[str] = []

    for phrase, pts in CONTACT_POSITIVE:
        if phrase in blob:
            score += pts
            evidence.append(f"+{pts}:{phrase}")

    for phrase, pts in CONTACT_NEGATIVE:
        if phrase in blob:
            score += pts
            evidence.append(f"{pts}:{phrase}")

    if on_crime_page:
        score += 25
        evidence.append("+25:crime_team_page")

    if score >= 50:
        status = "ready_to_send"
    elif score >= 25:
        status = "manual_review"
    else:
        status = "excluded"

    return ContactClassification(score=score, evidence=evidence, status=status)
