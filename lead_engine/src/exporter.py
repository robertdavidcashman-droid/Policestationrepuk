from __future__ import annotations

import sqlite3
from pathlib import Path

import pandas as pd

from .config import EngineConfig
from .database import Database


def _query_df(db_path: str, sql: str) -> pd.DataFrame:
    conn = sqlite3.connect(db_path)
    try:
        return pd.read_sql_query(sql, conn)
    finally:
        conn.close()


def _write_csv(df: pd.DataFrame, path: Path) -> str:
    path.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(path, index=False)
    return str(path)


def export_all(cfg: EngineConfig, db: Database) -> dict[str, str]:
    export_dir = Path(cfg.export_path)
    paths: dict[str, str] = {}

    ready_sql = """
        SELECT f.firm_name, c.contact_name, c.contact_role, e.email, e.email_type, e.source_type,
               e.source_provider, f.website, e.source_url, f.town, f.county,
               f.criminal_relevance_score, c.contact_relevance_score,
               f.practice_area_evidence, c.contact_evidence, e.status, e.notes
        FROM emails e
        JOIN firms f ON f.id = e.firm_id
        LEFT JOIN contacts c ON c.id = e.contact_id
        WHERE e.status = 'ready_to_send'
        ORDER BY f.criminal_relevance_score DESC, e.priority_score DESC
    """
    paths["ready_to_send"] = _write_csv(
        _query_df(cfg.database_path, ready_sql),
        export_dir / "ready_to_send.csv",
    )

    manual_sql = """
        SELECT f.firm_name, c.contact_name, c.contact_role, e.email, e.email_type, e.source_type,
               e.source_provider, f.website, e.source_url, f.town, f.county,
               f.criminal_relevance_score, c.contact_relevance_score,
               COALESCE(rq.reason, 'firm_or_email_manual_review') AS reason_for_review, e.notes
        FROM emails e
        JOIN firms f ON f.id = e.firm_id
        LEFT JOIN contacts c ON c.id = e.contact_id
        LEFT JOIN review_queue rq ON rq.email_id = e.id
        WHERE e.status = 'manual_review' OR f.status = 'manual_review'
        GROUP BY e.id
    """
    paths["manual_review"] = _write_csv(
        _query_df(cfg.database_path, manual_sql),
        export_dir / "manual_review.csv",
    )

    paid_sql = """
        SELECT f.firm_name, c.contact_name, c.contact_role, e.email, e.source_provider,
               e.provider_confidence_score, e.verification_status,
               CASE WHEN e.email_type = 'guessed' THEN 1 ELSE 0 END AS is_guessed,
               CASE WHEN e.email_type = 'paid_verified' AND e.verification_status IN ('valid','verified','high_confidence') THEN 1 ELSE 0 END AS is_verified,
               f.website, f.town, f.county, f.criminal_relevance_score, c.contact_relevance_score,
               e.status, e.notes
        FROM emails e
        JOIN firms f ON f.id = e.firm_id
        LEFT JOIN contacts c ON c.id = e.contact_id
        WHERE e.source_type = 'paid_provider'
    """
    paths["paid_source_candidates"] = _write_csv(
        _query_df(cfg.database_path, paid_sql),
        export_dir / "paid_source_candidates.csv",
    )

    excluded_sql = """
        SELECT f.firm_name, c.contact_name, e.email, f.website, e.source_url, e.source_provider,
               COALESCE(f.exclusion_reason, e.notes, 'excluded') AS exclusion_reason, e.notes
        FROM emails e
        JOIN firms f ON f.id = e.firm_id
        LEFT JOIN contacts c ON c.id = e.contact_id
        WHERE e.status = 'excluded' OR f.status = 'excluded'
        UNION ALL
        SELECT firm_name, NULL, NULL, website, NULL, NULL, exclusion_reason, NULL
        FROM firms WHERE status = 'excluded' AND id NOT IN (SELECT firm_id FROM emails)
    """
    paths["excluded"] = _write_csv(
        _query_df(cfg.database_path, excluded_sql),
        export_dir / "excluded.csv",
    )

    return paths
