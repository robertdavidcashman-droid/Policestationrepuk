from __future__ import annotations

import hashlib
from pathlib import Path
from urllib.parse import urlparse

import tldextract

from .classify_contact import classify_contact
from .classify_firm import classify_firm_text, extract_evidence_snippets
from .config import EngineConfig
from .crawler import crawl_firm_website, registrable_domain
from .database import Database, utc_now
from .extract_contacts import extract_contacts_from_html
from .extract_emails import extract_emails_from_html, normalise_email
from .jurisdiction import score_jurisdiction
from .paid_providers import get_enabled_providers, log_provider_call
from .search_discovery import discover_candidates, pick_firm_website_from_results, serper_search
from .sources import INFERRED, LAA, PAID_PROVIDER, PUBLIC_WEBSITE, SEARCH
from .suppression import is_suppressed
from .verify import verify_email


def _upsert_firm(db: Database, candidate: dict) -> int:
    now = utc_now()
    website = candidate.get("website")
    domain = registrable_domain(website) if website else None
    existing = None
    if domain:
        existing = db.fetchone("SELECT id FROM firms WHERE domain = ?", (domain,))
    if not existing:
        existing = db.fetchone(
            "SELECT id FROM firms WHERE lower(firm_name) = lower(?) LIMIT 1",
            (candidate.get("firm_name", ""),),
        )
    source_method = candidate.get("source_discovery_method", LAA)
    laa_score = 70 if source_method == LAA else None
    if source_method == "archive_law_firms":
        laa_score = candidate.get("criminal_relevance_score") or 65

    if existing:
        fid = existing["id"]
        db.execute(
            """UPDATE firms SET town=COALESCE(?,town), county=COALESCE(?,county), postcode=COALESCE(?,postcode),
               website=COALESCE(?,website), domain=COALESCE(?,domain), updated_at=?, source_discovery_method=COALESCE(?,source_discovery_method),
               criminal_relevance_score=CASE WHEN ? IS NOT NULL THEN MAX(COALESCE(criminal_relevance_score,0), ?) ELSE criminal_relevance_score END
               WHERE id=?""",
            (
                candidate.get("town"),
                candidate.get("county"),
                candidate.get("postcode"),
                website,
                domain,
                now,
                candidate.get("source_discovery_method"),
                laa_score,
                laa_score,
                fid,
            ),
        )
        return fid

    jur, jur_conf = score_jurisdiction(
        postcode=candidate.get("postcode"),
        address=candidate.get("address"),
    )
    if jur.startswith("excluded"):
        status = "excluded"
        exclusion = jur
    else:
        status = "candidate"
        exclusion = None

    crime_score = laa_score or 0
    if source_method == SEARCH and candidate.get("search_snippet"):
        cls = classify_firm_text(candidate["search_snippet"], [website] if website else [])
        crime_score = max(crime_score, cls.score)

    cur = db.execute(
        """INSERT INTO firms (firm_name, website, domain, town, county, postcode, jurisdiction, jurisdiction_confidence,
           criminal_relevance_score, practice_area_evidence, source_discovery_method, status, exclusion_reason, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            candidate.get("firm_name", "Unknown"),
            website,
            domain,
            candidate.get("town"),
            candidate.get("county"),
            candidate.get("postcode"),
            jur,
            jur_conf,
            crime_score,
            (candidate.get("practice_area_evidence") or candidate.get("search_snippet", ""))[:500]
            if source_method in (SEARCH, "archive_law_firms")
            else "LAA crime provider register",
            source_method,
            status,
            exclusion,
            now,
            now,
        ),
    )
    return cur.lastrowid


def cmd_discover(cfg: EngineConfig, db: Database) -> dict:
    candidates = discover_candidates(cfg)
    created = 0
    emails_from_archive = 0
    for c in candidates:
        fid = _upsert_firm(db, c)
        created += 1
        if c.get("email") and c.get("source_discovery_method") == "archive_law_firms":
            from .extract_emails import score_email
            email = normalise_email(c["email"])
            local, _, domain = email.partition("@")
            email_type, priority = score_email(local, domain)
            if email_type not in ("excluded",):
                emails_from_archive += _store_email(
                    db, cfg, fid, None, email, email_type, priority,
                    PUBLIC_WEBSITE, "archive_law_firms",
                    c.get("website") or f"archive:{c.get('firm_name')}",
                    c.get("firm_name", ""), None, "archive_verified",
                )
    total = db.fetchone("SELECT COUNT(*) AS c FROM firms")["c"]
    return {"candidates_processed": created, "total_firms": total, "archive_emails_stored": emails_from_archive}


def cmd_resolve_websites(cfg: EngineConfig, db: Database, limit: int = 15) -> dict:
    api_key = cfg.search.serper_api_key
    if not api_key:
        return {"resolved": 0, "message": "SERPER_API_KEY not configured"}
    rows = db.fetchall(
        """SELECT id, firm_name, town, county FROM firms
           WHERE (website IS NULL OR website = '') AND status != 'excluded'
           ORDER BY criminal_relevance_score DESC, id ASC LIMIT ?""",
        (limit,),
    )
    resolved = 0
    for row in rows:
        location = row["town"] or row["county"] or ""
        query = f'"{row["firm_name"]}" criminal solicitors {location}'.strip()
        hits = serper_search(api_key, query)
        website = pick_firm_website_from_results(row["firm_name"], hits)
        if not website:
            continue
        domain = registrable_domain(website)
        now = utc_now()
        if domain:
            owner = db.fetchone(
                "SELECT id FROM firms WHERE domain = ? AND id != ? LIMIT 1",
                (domain, row["id"]),
            )
            if owner:
                db.execute(
                    """UPDATE firms SET website=?, updated_at=?,
                       source_discovery_method=COALESCE(source_discovery_method,'search_engine') WHERE id=?""",
                    (website, now, row["id"]),
                )
                resolved += 1
                continue
        db.execute(
            """UPDATE firms SET website=?, domain=?, updated_at=?,
               source_discovery_method=COALESCE(source_discovery_method,'search_engine') WHERE id=?""",
            (website, domain, now, row["id"]),
        )
        resolved += 1
    return {"resolved": resolved, "attempted": len(rows)}


def cmd_crawl(cfg: EngineConfig, db: Database, limit: int = 50) -> dict:
    rows = db.fetchall(
        """SELECT f.id, f.firm_name, f.website
           FROM firms f
           LEFT JOIN (SELECT firm_id, COUNT(*) AS ec FROM emails GROUP BY firm_id) em ON em.firm_id = f.id
           WHERE f.website IS NOT NULL AND f.status != 'excluded'
           ORDER BY CASE WHEN f.last_checked_at IS NULL THEN 0 ELSE 1 END,
                    f.last_checked_at ASC, COALESCE(em.ec, 0) ASC
           LIMIT ?""",
        (limit,),
    )
    crawled = 0
    emails_found = 0
    for row in rows:
        if not row["website"]:
            continue
        results = crawl_firm_website(cfg, db, row["id"], row["website"])
        combined_text = " ".join(r.html[:5000] for r in results if r.success)
        urls = [r.url for r in results if r.success]
        classification = classify_firm_text(combined_text, urls)
        jur, jur_conf = score_jurisdiction(postcode=None, page_text=combined_text)
        status = "excluded" if jur.startswith("excluded") else (
            "manual_review" if classification.status == "manual_review" else "candidate"
        )
        if classification.status == "high_confidence_criminal_firm" and not jur.startswith("excluded"):
            status = "candidate"
        db.execute(
            """UPDATE firms SET criminal_relevance_score=?, practice_area_evidence=?, jurisdiction=?, jurisdiction_confidence=?,
               status=CASE WHEN status='excluded' THEN status ELSE ? END, updated_at=? WHERE id=?""",
            (
                classification.score,
                classification.practice_area_evidence,
                jur,
                jur_conf,
                status,
                utc_now(),
                row["id"],
            ),
        )
        for r in results:
            if not r.success:
                continue
            for em in extract_emails_from_html(r.html, r.url):
                emails_found += _store_email(
                    db, cfg, row["id"], None, em.email, em.email_type, em.priority_score,
                    PUBLIC_WEBSITE, None, r.url, "", None, "inferred" if em.email_type == "guessed" else "public",
                )
        crawled += 1
    return {"firms_crawled": crawled, "emails_found": emails_found}


def _store_email(
    db: Database,
    cfg: EngineConfig,
    firm_id: int,
    contact_id: int | None,
    email: str,
    email_type: str,
    priority: int,
    source_type: str,
    source_provider: str | None,
    source_url: str | None,
    source_page_title: str,
    provider_confidence: float | None,
    verification_status: str,
) -> int:
    norm = normalise_email(email)
    if is_suppressed(db, email=norm):
        return 0
    existing = db.fetchone("SELECT id FROM emails WHERE normalised_email = ?", (norm,))
    if existing:
        return 0
    now = utc_now()
    domain = norm.split("@")[-1]
    # Never store guessed as ready — type must reflect
    if email_type == "guessed":
        source_type = INFERRED
    status = "candidate"
    db.execute(
        """INSERT INTO emails (firm_id, contact_id, email, normalised_email, domain, email_type, priority_score,
           source_type, source_provider, source_url, source_page_title, provider_confidence_score,
           first_seen_at, verification_status, status)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            firm_id, contact_id, email, norm, domain, email_type, priority,
            source_type, source_provider, source_url, source_page_title, provider_confidence,
            now, verification_status, status,
        ),
    )
    return 1


def cmd_contacts(cfg: EngineConfig, db: Database, limit: int = 50) -> dict:
    rows = db.fetchall(
        """SELECT f.id, f.website FROM firms f
           WHERE f.website IS NOT NULL AND f.status != 'excluded' LIMIT ?""",
        (limit,),
    )
    found = 0
    import requests
    for row in rows:
        try:
            res = requests.get(row["website"], headers={"User-Agent": cfg.user_agent}, timeout=12)
            html = res.text
        except requests.RequestException:
            continue
        for path in ("/team", "/our-people", "/solicitors", "/crime-team", "/people"):
            url = row["website"].rstrip("/") + path
            try:
                r2 = requests.get(url, headers={"User-Agent": cfg.user_agent}, timeout=10)
                if r2.ok:
                    html += "\n" + r2.text
            except requests.RequestException:
                pass
        on_crime = "crime" in html.lower()
        for c in extract_contacts_from_html(html, row["website"], on_crime):
            cc = classify_contact(c.contact_role, c.profile_text, c.on_crime_page)
            now = utc_now()
            cur = db.execute(
                """INSERT INTO contacts (firm_id, contact_name, contact_role, contact_profile_url,
                   contact_relevance_score, contact_evidence, source_type, status, created_at, updated_at)
                   VALUES (?,?,?,?,?,?,?,?,?,?)""",
                (
                    row["id"], c.contact_name, c.contact_role, c.profile_url,
                    cc.score, cc.contact_evidence, PUBLIC_WEBSITE, cc.status, now, now,
                ),
            )
            found += 1
            # Extract email from profile block only — not guessed
            for em in extract_emails_from_html(c.profile_text, c.profile_url or row["website"]):
                _store_email(
                    db, cfg, row["id"], cur.lastrowid, em.email, em.email_type, em.priority_score,
                    PUBLIC_WEBSITE, None, c.profile_url or row["website"],
                    c.contact_name, None, "public_found",
                )
    return {"contacts_found": found}


def cmd_classify(cfg: EngineConfig, db: Database) -> dict:
    rows = db.fetchall("SELECT id, practice_area_evidence, criminal_relevance_score, jurisdiction FROM firms")
    updated = 0
    for r in rows:
        score = r["criminal_relevance_score"] or 0
        if r["jurisdiction"] and r["jurisdiction"].startswith("excluded"):
            db.execute("UPDATE firms SET status='excluded', exclusion_reason=? WHERE id=?", (r["jurisdiction"], r["id"]))
            updated += 1
            continue
        if score >= cfg.min_score_ready_to_send:
            new_status = "candidate"
        elif score >= cfg.manual_review_min_score:
            new_status = "manual_review"
        else:
            new_status = "excluded"
            db.execute(
                "UPDATE firms SET status=?, exclusion_reason=? WHERE id=?",
                (new_status, "low_criminal_relevance", r["id"]),
            )
            updated += 1
            continue
        db.execute("UPDATE firms SET status=? WHERE id=? AND status NOT IN ('sent','opted_out','bounced')", (new_status, r["id"]))
        updated += 1
    return {"firms_updated": updated}


def cmd_classify_contacts(cfg: EngineConfig, db: Database) -> dict:
    rows = db.fetchall("SELECT id, contact_relevance_score FROM contacts")
    for r in rows:
        s = r["contact_relevance_score"] or 0
        if s >= cfg.min_contact_score_ready_to_send:
            st = "ready_to_send"
        elif s >= cfg.manual_review_contact_min_score:
            st = "manual_review"
        else:
            st = "excluded"
        db.execute("UPDATE contacts SET status=? WHERE id=?", (st, r["id"]))
    return {"contacts_classified": len(rows)}


def cmd_enrich(cfg: EngineConfig, db: Database, limit: int = 30) -> dict:
    providers = [p for p in get_enabled_providers(cfg) if p.name == "hunter" and cfg.paid_providers.hunter.enabled]
    if not providers:
        return {"enriched": 0, "message": "no paid providers configured"}
    enriched = 0
    firms = db.fetchall(
        "SELECT id, domain, firm_name FROM firms WHERE domain IS NOT NULL AND status != 'excluded' LIMIT ?",
        (limit,),
    )
    hunter = providers[0]
    for f in firms:
        results = hunter.enrich_domain(f["domain"])
        log_provider_call(db, provider_name="hunter", query_type="domain", query_value=f["domain"], firm_id=f["id"], response_status="ok", notes=f"count={len(results)}")
        for pr in results:
            if pr.is_guessed and not cfg.allow_guessed_emails_ready_to_send:
                email_type = "guessed"
                status = "candidate"
            elif pr.is_verified:
                email_type = "paid_verified"
                status = "candidate"
            else:
                email_type = "paid_verified" if pr.confidence_score >= 70 else "risky"
                status = "candidate"
            _store_email(
                db, cfg, f["id"], None, pr.email, email_type, int(pr.confidence_score),
                PAID_PROVIDER, pr.provider_name, f"https://{f['domain']}", pr.contact_name or "",
                pr.confidence_score, pr.verification_status,
            )
            enriched += 1
    return {"enriched": enriched}


def cmd_verify(cfg: EngineConfig, db: Database) -> dict:
    rows = db.fetchall("SELECT id, email, email_type, source_type, source_url, source_provider FROM emails")
    ready = manual = excluded = 0
    for r in rows:
        v = verify_email(r["email"])
        if not v["syntax_ok"] or not v["mx_ok"]:
            db.execute("UPDATE emails SET verification_status=?, status='excluded' WHERE id=?", (v["verification_status"], r["id"]))
            excluded += 1
            continue
        db.execute("UPDATE emails SET verification_status=? WHERE id=?", (v["verification_status"], r["id"]))
        firm = db.fetchone(
            """SELECT f.criminal_relevance_score, f.jurisdiction, f.status AS firm_status, e.email_type, e.source_type,
                      e.source_url, e.source_provider, e.priority_score, c.contact_relevance_score, c.status AS contact_status
               FROM emails e JOIN firms f ON f.id=e.firm_id
               LEFT JOIN contacts c ON c.id=e.contact_id WHERE e.id=?""",
            (r["id"],),
        )
        if not firm:
            continue
        if firm["firm_status"] == "excluded" or (firm["jurisdiction"] or "").startswith("excluded"):
            db.execute("UPDATE emails SET status='excluded' WHERE id=?", (r["id"],))
            excluded += 1
            continue
        if is_suppressed(db, email=r["email"]):
            db.execute("UPDATE emails SET status='excluded', opted_out=1 WHERE id=?", (r["id"],))
            excluded += 1
            continue
        if cfg.require_source_url_or_provider and not (r["source_url"] or r["source_provider"]):
            db.execute("UPDATE emails SET status='manual_review' WHERE id=?", (r["id"],))
            manual += 1
            continue
        if r["email_type"] in ("guessed", "risky", "personal_free", "excluded"):
            if r["email_type"] == "guessed" or (r["email_type"] == "personal_free" and not cfg.allow_free_email_domains):
                db.execute("UPDATE emails SET status='manual_review' WHERE id=?", (r["id"],))
                db.execute(
                    """INSERT INTO review_queue (firm_id, email_id, reason, created_at)
                       SELECT firm_id, ?, ?, ? FROM emails WHERE id=?""",
                    (r["id"], f"email_type={r['email_type']}", utc_now(), r["id"]),
                )
                manual += 1
                continue
        firm_score = firm["criminal_relevance_score"] or 0
        contact_score = firm["contact_relevance_score"] or 0
        generic_ok = (
            firm_score >= cfg.min_score_ready_to_send
            and r["email_type"] == "generic_business"
        )
        personal_ok = (
            cfg.allow_personal_work_emails
            and firm_score >= cfg.min_score_ready_to_send
            and contact_score >= cfg.min_contact_score_ready_to_send
            and r["email_type"] == "individual_work"
        )
        paid_ok = (
            r["email_type"] == "paid_verified"
            and firm_score >= cfg.min_score_ready_to_send
            and (r["source_provider"] or r["source_url"])
        )
        if generic_ok or personal_ok or paid_ok:
            db.execute("UPDATE emails SET status='ready_to_send' WHERE id=?", (r["id"],))
            db.execute(
                "UPDATE firms SET status='ready_to_send' WHERE id=(SELECT firm_id FROM emails WHERE id=?) AND status NOT IN ('sent','opted_out')",
                (r["id"],),
            )
            ready += 1
        elif firm_score >= cfg.manual_review_min_score:
            db.execute("UPDATE emails SET status='manual_review' WHERE id=?", (r["id"],))
            manual += 1
        else:
            db.execute("UPDATE emails SET status='excluded' WHERE id=?", (r["id"],))
            excluded += 1
    return {"ready_to_send": ready, "manual_review": manual, "excluded": excluded}


def low_yield_diagnosis(db: Database) -> dict:
    firms = db.fetchone("SELECT COUNT(*) c FROM firms")["c"]
    emails = db.fetchone("SELECT COUNT(*) c FROM emails")["c"]
    diagnosis = []
    if firms < 50:
        diagnosis.append("search_discovery: fewer than 50 firms — broaden regions or enable SERPER_API_KEY")
    if emails < 100:
        diagnosis.append("email_extraction: fewer than 100 emails — crawl more firm websites")
    paid = db.fetchone("SELECT COUNT(*) c FROM emails WHERE source_type='paid_provider'")["c"]
    if emails < 100 and paid == 0:
        diagnosis.append("no_paid_provider_configured")
    return {"firms": firms, "emails": emails, "low_yield": firms < 50 or emails < 100, "diagnosis": diagnosis}
