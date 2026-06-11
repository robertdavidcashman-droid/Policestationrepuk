from __future__ import annotations

import json
from pathlib import Path

from src.config import EngineConfig
from src.search_discovery import bootstrap_archive_firms


def test_archive_bootstrap_requires_laa_corroboration(tmp_path: Path) -> None:
    laa_path = tmp_path / "laa.json"
    archive_path = tmp_path / "archive.json"
    laa_path.write_text(
        json.dumps([{"firmName": "Abraham Solicitors LTD", "category": "Crime", "postcode": "LL11 1HR"}]),
        encoding="utf-8",
    )
    archive_path.write_text(
        json.dumps(
            [
                {
                    "name": "Brachers LLP",
                    "postcode": "ME19 4UA",
                    "email": "info@brachers.co.uk",
                    "criminalLawPractice": True,
                    "region": "England",
                },
                {
                    "name": "Abraham Solicitors",
                    "postcode": "LL11 1HR",
                    "email": "info@abrahamsolicitors.co.uk",
                    "criminalLawPractice": True,
                    "region": "England",
                },
            ]
        ),
        encoding="utf-8",
    )
    cfg = EngineConfig(
        laa_providers_json=str(laa_path),
        archive_law_firms_json=str(archive_path),
    )
    firms = bootstrap_archive_firms(cfg)
    assert len(firms) == 1
    assert firms[0]["firm_name"] == "Abraham Solicitors"
