# Four-Site SEO Cross-Site Master Strategy

> Master map for the four-site programme. Per-site detail lives in each repo's `docs/seo-content-strategy.md`. This document defines canonical ownership, the internal-linking map, top traffic/conversion targets, the first 12 articles, category structures, and the 90-day cross-site schedule. It exists (identically) in all four repos.

## Executive summary

Four Next.js sites share an audience adjacency (police-station / custody / criminal defence in England & Wales) but **distinct intents**. The risk is keyword cannibalisation and Buffer double-posting; the strategy assigns each topic a single **canonical owner** and uses cross-links + per-site Buffer to grow all four without competing.

| Site | Audience | Intent | Conversion |
| --- | --- | --- | --- |
| **policestationagent.com** | Public / accused / family (Kent) | Urgent "what now?" | Phone call / instruct cover |
| **policestationrepuk.org** | Freelance reps + defence firms | B2B sourcing / career | Directory listing + search |
| **psrtrain.com** | Trainee reps / candidates | Exam & training prep | Course / question-bank sign-up |
| **custodynote.com** | Practising note-takers | Product / note-taking | Software trial / purchase |

## Canonical ownership map (anti-cannibalisation)

For each shared concept, one site is the **canonical owner** (deep generic page); the others reference it from their own angle and **cross-link** rather than rank-compete.

| Concept | Canonical owner | Angle of others (cross-link, don't duplicate) |
| --- | --- | --- |
| Voluntary interview (generic "what is") | **PSA** (`what-s-a-voluntary-police-interview`) | psrtrain = rep advice; REPUK = how firms brief; custodynote = what to record |
| No comment / silence | **PSA** (`no-comment-interview-kent`) | psrtrain = exam (`caution-and-silence-client-advice`); REPUK = adverse-inference rep guide; custodynote = notes (`no-comment-interview-notes`) |
| PACE Code C | **psrtrain** (exam canonical) + **PSA** (public `pace-code-c-kent-guide`) | REPUK = best-practice; custodynote = `pace-code-c-attendance-notes` |
| Appropriate adult | **PSA** (`appropriate-adult-kent`) public | psrtrain = `appropriate-adult-at-custody` exam; others cross-link |
| RUI / police bail | **PSA** (`police-bail-explained-kent`) | psrtrain = `bail-and-rui-police-station-outcomes`; custodynote = `police-bail-notes-what-to-record` |
| Duty solicitor | **PSA** (`what-is-a-duty-solicitor`) | REPUK = rep-vs-duty distinction |
| Attendance / handover notes | **custodynote** | REPUK best-practice notes cross-link to custodynote product |
| Becoming a rep / accreditation | **psrtrain** (training) + **REPUK** (career/business) | PSA does not cover |
| Instructing / sourcing reps | **REPUK** | others cross-link |

## Top-10 traffic opportunities (cross-site)

| # | Topic | Owner | Why |
| --- | --- | --- | --- |
| 1 | "what to do after arrest" (Kent + generic) | PSA | High-volume, urgent, converts |
| 2 | "voluntary police interview" cluster | PSA | High volume; needs consolidation first |
| 3 | "how to become a police station representative" | psrtrain/REPUK | Evergreen career volume |
| 4 | "police station attendance note template" | custodynote | Commercial, product-aligned |
| 5 | "PSRAS exam / practice questions" | psrtrain | Course-driving |
| 6 | "duty solicitor" (what is / cost) | PSA | Volume + conversion |
| 7 | "released under investigation / police bail" | PSA | Volume + anxiety-driven |
| 8 | "no comment interview" | PSA | Volume |
| 9 | "police station rep day rate / salary" | REPUK/psrtrain | B2B + career |
| 10 | "LAA audit / billing attendance notes" | custodynote | Commercial |

## Top-10 conversion opportunities (cross-site)

| # | Topic | Owner | Conversion |
| --- | --- | --- | --- |
| 1 | Out-of-hours solicitor Kent | PSA | Call |
| 2 | Private police-station solicitor cost | PSA | Call |
| 3 | Attendance note template | custodynote | Trial |
| 4 | LAA audit-proof notes | custodynote | Trial |
| 5 | Free PSRAS practice questions | psrtrain | Sign-up |
| 6 | PSRAS portfolio checklist | psrtrain | Sign-up |
| 7 | Building a firm panel of reps | REPUK | Directory search |
| 8 | How to become a rep | psrtrain/REPUK | Sign-up / listing |
| 9 | Migrating paper → Custody Note | custodynote | Trial |
| 10 | Day-rate calculator | REPUK | Listing |

## First 12 articles (Phase 4 — CLEAR only, one canonical owner each)

| # | Site | Slug | Owner concept |
| --- | --- | --- | --- |
| 1 | PSA | `first-hour-after-arrest-kent` | After-arrest |
| 2 | PSA | `out-of-hours-solicitor-kent-custody` | Out-of-hours (conversion) |
| 3 | PSA | `private-police-station-solicitor-cost-kent` | Cost (conversion) |
| 4 | psrtrain | `psras-exam-format-pass-mark-2026` | PSRAS exam |
| 5 | psrtrain | `how-to-pass-critical-incidents-test` | CIT |
| 6 | psrtrain | `free-psras-practice-questions` | Lead magnet (conversion) |
| 7 | custodynote | `attendance-note-template-guide` | Template (conversion) |
| 8 | custodynote | `laa-audit-proof-attendance-notes` | LAA audit |
| 9 | custodynote | `handwritten-vs-digital-custody-notes` | Digital notes |
| 10 | REPUK | `how-to-become-police-station-representative-2026` | Becoming a rep |
| 11 | REPUK | `freelance-rep-day-rate-2026` | Day rate |
| 12 | REPUK | `building-firm-panel-freelance-reps` | Firm sourcing |

Each first-12 article ships with: full SEO metadata (title/meta/H1/H2 outline), internal links (incl. cross-site to canonical owners), external authority links, CTA, schema type, disclaimer, and a **sources list at the bottom**. Buffer social copy (LinkedIn/Facebook/X/short) generated per article.

## 4-site internal-linking map

```
                 ┌─────────────────────────────────────────────┐
                 │  policestationagent.com  (PUBLIC / KENT)      │
                 │  owns: arrest, VI, no-comment, bail, duty sol │
                 └───────▲───────────────────────────▲──────────┘
   "need training?"      │                            │  "need a rep / firm?"
                         │                            │
   ┌─────────────────────┴───────┐        ┌───────────┴───────────────────┐
   │   psrtrain.com (TRAINING)    │◄──────►│ policestationrepuk.org (B2B)   │
   │   owns: PSRAS, CIT, PACE exam│ career │ owns: become a rep, instruct,  │
   └─────────────────────▲───────┘        │ day-rate, firm panels          │
        "record notes?"  │                └───────────▲───────────────────┘
                         │                            │ "tooling for notes"
                 ┌────────┴────────────────────────────┴──────┐
                 │  custodynote.com (PRODUCT / NOTE-TAKING)    │
                 │  owns: attendance notes, LAA audit, billing │
                 └─────────────────────────────────────────────┘
```

Linking rules:
- **PSA → psrtrain** on "want to do this professionally?"; **PSA → REPUK** on "instruct a rep / firm cover".
- **REPUK ↔ psrtrain** on career/accreditation; **REPUK → custodynote** on note-taking tooling.
- **psrtrain → custodynote** on "record your notes"; **custodynote → REPUK/psrtrain** on career/best-practice.
- All cross-site links use UTM `utm_source={site}&utm_medium=crosslink`. Existing REPUK `audit:cross-domain-links` guards link hygiene.

## Category structures (target)

| Site | Categories |
| --- | --- |
| PSA | Arrest & Custody · Interviews · After the Interview · Your Rights · Kent Locations · Offences |
| REPUK | Freelance Reps · Law Firms · Best Practice · Attendance |
| psrtrain | PSRAS Prep · PACE · CIT · Career |
| custodynote | App Features · Attendance Notes · LAA & Billing · Best Practice |

## 90-day cross-site schedule

| Weeks | PSA | REPUK | psrtrain | custodynote |
| --- | --- | --- | --- | --- |
| 1–2 | Ship 13 legacy 301s + refresh canonicals | Buffer feed reconciliation | Phase 2 tech-SEO + email capture | Phase 2 schema (BlogPosting/Product) |
| 3–4 | first-hour, out-of-hours | how-to-become, psras-vs | psras-format, CIT | template-guide, laa-audit |
| 5–6 | cost, arrested-on-bail | day-rate, firm-panel | practice-questions, portfolio | handwritten-vs-digital, disclosure |
| 7–9 | Location gaps (Ashford, Chatham, Margate, TW, Dover) | invoicing, conflict-checks | Code C exam, salary | vulnerable/juvenile, billing-fields |
| 10–13 | versus + FAQ hub + lead magnets | pillars + day-rate tool | pillars + study planner | pillar + checklist magnets |

## Buffer cross-site reconciliation (CRITICAL)

REPUK's central scheduler (`lib/buffer/feeds.ts` `DEFAULT_FEEDS`) currently posts **all four** feeds. When psrtrain & custodynote get per-repo Buffer (Phase 3):
1. Set REPUK `BUFFER_CONTENT_FEEDS=policestationrepuk` (env override; reversible, no code change) — drops psrtrain/custodynote/PSA from the central feed.
2. PSA keeps its own GitHub Actions scheduler.
3. psrtrain & custodynote run their own `app/api/buffer/schedule` route (server-side, KV/URL dedup by `campaign={slug}`).
4. One test post per new site before site-wide enable.

This guarantees each post is scheduled by exactly one owner.

## Quality gates (all sites)

UK / England & Wales accurate, plain English, E-E-A-T, no case-specific advice or guarantees, legal disclaimer where appropriate, **sources list at the bottom of every article**. No hallucinated facts; claims double-checked against cited sources. Only `CLEAR` posts proceed to draft / schedule / Buffer.

## Sources

- PACE 1984 & Codes of Practice C and D — GOV.UK.
- Legal Aid Agency — Standard Crime Contract & police-station guidance — GOV.UK.
- SRA / Law Society — PSRAS accreditation.
- schema.org — `BlogPosting`, `BreadcrumbList`, `FAQPage`, `Product`.
- Next.js App Router — `redirects()`, metadata API — nextjs.org.
