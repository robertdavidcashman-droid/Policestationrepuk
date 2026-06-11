from __future__ import annotations

import re

# Scotland, NI, RoI indicators — exclude
SCOTLAND_POSTCODE_AREAS = {
    "AB", "DD", "DG", "EH", "FK", "G", "HS", "IV", "KA", "KW", "KY", "ML", "PA", "PH", "TD", "ZE"
}
NI_PREFIX = "BT"
ROI_INDICATORS = ("ireland", "dublin", "cork", "republic of ireland", "éire", "eire")

EW_POSITIVE = (
    "england",
    "wales",
    "united kingdom",
    " uk",
    "london",
    "kent",
    "cardiff",
    "swansea",
    "wrexham",
    "newport",
    "magistrates",
    "crown court",
    "legal aid agency",
    "sra-regulated",
)


def normalise_postcode(pc: str) -> str:
    return re.sub(r"\s+", "", pc.upper())


def postcode_area(postcode: str) -> str:
    pc = normalise_postcode(postcode)
    m = re.match(r"^([A-Z]{1,2})", pc)
    return m.group(1) if m else ""


def is_scotland_postcode(postcode: str) -> bool:
    area = postcode_area(postcode)
    if area == "G" and re.match(r"^G\d", normalise_postcode(postcode)):
        return True
    if area == "GL":  # Gloucestershire
        return False
    return area in SCOTLAND_POSTCODE_AREAS


def is_ni_postcode(postcode: str) -> bool:
    return postcode_area(postcode) == NI_PREFIX


def score_jurisdiction(
    *,
    postcode: str | None = None,
    address: str | None = None,
    page_text: str | None = None,
    sra_regulated: bool = False,
) -> tuple[str, float]:
    """Return (jurisdiction, confidence 0-1)."""
    text = " ".join(filter(None, [address, page_text])).lower()

    for roi in ROI_INDICATORS:
        if roi in text and "northern ireland" not in text:
            if "republic" in roi or roi in ("dublin", "cork", "éire", "eire"):
                return "excluded_roi", 0.9

    if "scotland" in text and "england" not in text:
        return "excluded_scotland", 0.85
    if "northern ireland" in text:
        return "excluded_ni", 0.9

    if postcode:
        if is_scotland_postcode(postcode):
            return "excluded_scotland", 0.95
        if is_ni_postcode(postcode):
            return "excluded_ni", 0.95
        return "england_wales", 0.8

    ew_hits = sum(1 for t in EW_POSITIVE if t in text)
    if sra_regulated:
        ew_hits += 2
    if ew_hits >= 2:
        return "england_wales", min(0.95, 0.5 + ew_hits * 0.1)
    if ew_hits == 1:
        return "england_wales", 0.55
    return "uncertain", 0.3
