# SEO audit report — policestationrepuk.org

**Generated:** 2026-06-09  
**Repository:** Policestationrepuk (Next.js App Router)  
**Canonical host:** https://policestationrepuk.org  
**Source data:** `audit/seo-fixes.md`, live routes, `lib/county-seo-pages.ts`, blog registry

## Executive summary

This repo implements **policestationrepuk.org** only. Substantial SEO infrastructure already exists (seo-layer, sitemap, IndexNow, Buffer cron, 22→25 blog articles). Prior automated audit flagged **356 critical** issues across ~1,653 URLs — mostly title/meta length and canonical alignment on legacy paths.

**This pass:** priority-page metadata fixes, 3 net-new blog posts, county hub enhancements, analytics events, `/seo-growth/` deliverables for all four brands.

---

## Priority pages

| Route | Type | Priority | Current title (approx) | Proposed / status | Main CTA |
|-------|------|----------|------------------------|-------------------|----------|
| `/` | Homepage | 10 | PoliceStationRepUK — Free Police Station Rep Directory | OK | Find a Police Station Rep |
| `/directory` | Directory | 10 | Directory hub | OK | Search reps |
| `/Register` | Conversion | 10 | Register | OK | Register as a Police Station Rep |
| `/PoliceStationCover` | Firm landing | 9 | Police Station Cover for Criminal Defence Firms | OK + quick answer added | Open directory |
| `/police-station-rep-kent` | Regional SEO | 9 | Police Station Rep Kent — Accredited Directory | OK (canonical self) | Kent directory |
| `/police-station-rep-london` | Regional SEO | 9 | Police Station Rep London — Custody Cover | OK | London search |
| `/police-station-rep-essex` | Regional SEO | 9 | Essex pillar | OK | Essex directory |
| `/directory/kent` etc. | County directory | 8 | County template | Meta trimmed in `county-seo-pages.ts` | Find a rep |
| `/Blog` | Blog index | 8 | Blog hub | OK | Read articles |
| `/StationsDirectory` | Utility | 7 | Station numbers | OK | Report updates |

## Blog — skipped duplicates (PSR UK)

| Requested post | Action |
|----------------|--------|
| How to Find a Rep Quickly | **Skip** — `how-firms-source-emergency-rep-cover` |
| Register as a Rep | **Skip** — `/Register`, `/HowToBecome` guides |
| What Solicitors Look for | **Skip** — `what-makes-a-good-police-station-representative` |
| Use directory effectively | **Skip** — `why-firms-need-rep-directory` |
| Emergency cover tips | **Skip** — `out-of-hours-police-station-cover-for-law-firms` |
| Kent/London reps blog | **Skip** — county SEO pages enhanced instead |

## Blog — published (net-new)

1. `police-station-rep-coverage-location-matters`
2. `keep-directory-profile-useful`
3. `accredited-reps-keep-availability-updated`

## Technical issues (remaining backlog)

From `audit/seo-fixes.md` — batch in future sprints:

- Legacy `[slug]` catch-all pages: verify canonical + indexability
- Long meta descriptions on older static pages
- Missing H1 on a small set of utility pages

## Schema status

- **Live:** Organization, WebSite (layout), BlogPosting (blog), county ItemList via CountySeoTemplate
- **See:** `seo-growth/schema/schema-summary.md`

## Conversion issues addressed

- Standardised CTA labels on homepage hub and county template
- GA4 `data-event` delegation via `AnalyticsEventBinder`
- Extended event names in `lib/analytics.ts`

---

*General site content is informational for legal-sector professionals — not legal advice.*
