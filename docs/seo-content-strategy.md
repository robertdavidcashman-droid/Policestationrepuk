# policestationrepuk.org — SEO Content Strategy

> Part of the four-site SEO + Buffer programme. See `docs/seo-cross-site-strategy.md` for the master cross-site map. This document is the site-scoped strategy.
>
> **Site intent angle:** B2B / professional — **freelance police-station representatives** and the **criminal-defence firms that instruct them**. Conversion = directory listing (reps) + directory search / cover sourcing (firms). Never speaks to the accused public (that's policestationagent.com).

## 1. Existing content inventory

Full machine-generated inventory of all 25 posts is in **`docs/seo-inventory-table.md`** (regenerate with `node ../policestationagent/scripts/generate-seo-strategy-inventory.mjs`).

| Category | Posts | Theme |
| --- | --- | --- |
| `freelance-reps` | ~13 | Career, accreditation, insurance, rates, repeat instructions, availability. |
| `law-firms` | ~13 | Instructing reps, briefs, emergency cover, directory use. |
| `best-practice` | ~17 (overlap) | Attendance craft, notes, disclosure, communication. |
| `attendance` | ~7 | Custody-record review, checklist, pre-interview consult. |

Posts carry full `BlogArticle` metadata (`metaTitle`, `metaDescription`, `primaryKeyword`, `categories`, `bodyMarkdown`). Quality is high and consistent; **no duplicate clusters found**.

## 2. Duplication & cannibalisation triage

- **Internal:** No near-duplicate slugs on REPUK. The 25 posts are distinct. **All CLEAR.**
- **Cross-site:** Topic overlaps exist with the other three sites (voluntary interview, no comment, PACE Code C, adverse inference, appropriate adult, RUI/bail). REPUK keeps the **reps/firms professional angle**; it must cross-link (not duplicate) the public (PSA), training (psrtrain), and note-taking (custodynote) canonicals. Enforced by the cross-site map.
- **Buffer cross-posting risk (CRITICAL):** `lib/buffer/feeds.ts` `DEFAULT_FEEDS` currently schedules **all four** sites' feeds from REPUK's central scheduler (`policestationrepuk` local + `custodynote`, `policestationagent`, `psrtrain` RSS). When psrtrain & custodynote get their own per-repo Buffer (Phase 3), REPUK must stop scheduling those two to avoid double-posting. See §6.

## 3. Content plan (CLEAR ideas only)

REPUK owns B2B rep/firm topics. All ideas distinct from the other three sites.

### 3.1 Priority articles

| # | Working title | Slug | Primary keyword | Audience | Funnel | Priority | Words | Risk |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| 1 | How to become a police station representative (2026 route) | `how-to-become-police-station-representative-2026` | how to become police station representative | New reps | TOFU | 9 | 1600 | Low |
| 2 | PSRAS vs the old PSR accreditation route explained | `psras-vs-old-accreditation-route` | psras accreditation | New reps | TOFU | 8 | 1200 | Low |
| 3 | Setting your freelance rep day-rate in 2026 | `freelance-rep-day-rate-2026` | police station rep day rate | Reps | MOFU | 8 | 1100 | Low |
| 4 | Building a firm panel of freelance reps (for firms) | `building-firm-panel-freelance-reps` | freelance rep panel | Firms | MOFU | 8 | 1200 | Low |
| 5 | Invoicing & Legal Aid claims for freelance reps | `invoicing-legal-aid-freelance-reps` | police station rep legal aid claim | Reps | MOFU | 7 | 1200 | Low |
| 6 | Conflict checks before accepting cover | `conflict-checks-before-accepting-cover` | conflict check police station | Reps/Firms | MOFU | 7 | 900 | Low |
| 7 | Travel, mileage & geography for cover work | `travel-geography-cover-work` | police station cover travel | Reps | MOFU | 6 | 900 | Low |
| 8 | What firms check before instructing a new rep | `what-firms-check-before-instructing-rep` | instructing police station rep | Firms | MOFU | 7 | 1000 | Low |

### 3.2 Quick wins

Add FAQ blocks + cross-links to: `freelance-police-station-representative-vs-duty-solicitor`, `police-station-rep-fee-rates-2026`, `professional-indemnity-insurance-reps`, `out-of-hours-police-station-cover-for-law-firms`, `police-station-attendance-checklist`.

### 3.3 Authority / pillar

- `police-station-representative-career-guide` (pillar linking all freelance-reps posts).
- `instructing-freelance-reps-firm-guide` (pillar linking all law-firms posts).

### 3.4 Lead magnets / tools

- **Lead magnets:** rep onboarding pack, firm brief template, attendance-note template (cross-link custodynote), day-rate calculator worksheet, conflict-check checklist.
- **Tools:** directory search (exists), day-rate calculator, coverage-by-county map (exists), availability profile builder.

## 4. 90-day publishing schedule (REPUK slice)

Cadence: **1–2 posts/week**, alternating reps / firms audience.

| Weeks | Items |
| --- | --- |
| 1–2 | Buffer feed reconciliation (Phase 3 dependency); priority 1–2 (how-to-become, psras-vs). |
| 3–5 | priority 3–5 (day-rate, firm-panel, invoicing). |
| 6–8 | priority 6–8 + 2 quick-win refreshes. |
| 9–13 | 2 pillar pages + lead magnets + day-rate calculator tool. |

## 5. Technical-SEO gap list

REPUK is mature (`validate:schema`, `audit:blog-seo`, full buffer test suite already exist).

| Area | Status | Action | Phase |
| --- | --- | --- | --- |
| Blog schema validation | ✅ `npm run validate:schema` | none | — |
| Blog SEO audit | ✅ `npm run audit:blog-seo` | none | — |
| `?cat=` filter only (no category archive pages) | ⚠️ | Optional: static category archive pages for crawl depth | 2 (low) |
| RSS (20 items) | ✅ `app/rss.xml` | none | — |
| Cross-domain link hygiene | ✅ `audit:cross-domain-links` | keep | — |

## 6. Buffer plan (REPUK — central scheduler reconciliation)

REPUK runs the mature central scheduler: `lib/buffer/*`, cron `app/api/cron/buffer-blog-posts` (05:05 UTC), KV dedup `buffer-scheduler:*`, channels Twitter/LinkedIn/GBP.

**Phase 3 reconciliation (to prevent double-posting):**
- Today `DEFAULT_FEEDS` in `lib/buffer/feeds.ts` includes `policestationagent`, `psrtrain`, `custodynote`. PSA already self-posts; psrtrain/custodynote get their own Buffer in Phase 3.
- **Action:** make the central scheduler's feed set configurable so the operator can drop `psrtrain` and `custodynote` (and optionally `policestationagent`) once per-repo schedulers are live. The override mechanism already exists: `BUFFER_CONTENT_FEEDS` env (parsed by `getContentFeeds()`), with `validateContentFeeds()` warning on missing expected IDs.
- **Chosen approach (no code churn):** set `BUFFER_CONTENT_FEEDS` in REPUK's Vercel env to `policestationrepuk` only (plus `policestationagent` only if PSA's own GH Action is paused). Documented in `.env.example`. This is reversible and needs no redeploy of logic.
- **Autotest:** `__tests__/buffer-feeds.test.ts` already validates feed parsing; add a case asserting a single-feed override (`policestationrepuk`) yields exactly one feed and logs the missing-IDs warning (expected, not an error).
- **Credentials + channel IDs:** canonical reference in `docs/buffer-cross-site-env.md`. Propagate to psrtrain/custodynote with `npm run buffer:sync-env` (reads `BUFFER_API_KEY` from this repo's `.env.local`).

## 7. Autotests (this site)

- Existing: `npm run test:buffer:ci`, `npm run validate:schema`, `npm run audit:blog-seo`.
- Added: feed-override assertion in `__tests__/buffer-feeds.test.ts` (single-feed reconciliation case).

## Sources

- SRA / Law Society — police station representative accreditation (PSRAS) guidance.
- Legal Aid Agency — Standard Crime Contract, police station fees (GOV.UK).
- PACE 1984 Codes of Practice — GOV.UK.
- schema.org — `BlogPosting`.

> _General professional information for England & Wales. Not legal advice._
