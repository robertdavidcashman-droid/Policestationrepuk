# Final growth report — multi-site SEO system

**Date:** 2026-06-14  
**Workspace:** Policestationrepuk (policestationrepuk.org in-repo)

---

## A. Sites detected

| Site | In this repo? | Action taken |
|------|----------------|--------------|
| policestationrepuk.org | **Yes** | Code changes + deploy-ready |
| policestationagent.com | No | Full publish package in `seo-growth/sites/policestationagent.com/` |
| psrtrain.com | No | Full publish package in `seo-growth/sites/psrtrain.com/` |
| custodynote.com | No | Full publish package in `seo-growth/sites/custodynote.com/` |

---

## B. Changed directly (PSR UK)

- 3 net-new blog articles (`articles-batch-5.ts`) — 7 other requested titles covered by existing posts/pages (see `blog-posts/blog-publication-summary.md`)
- County SEO metadata + CTAs (Kent, London, Essex, Surrey, Sussex, Hampshire, Hertfordshire, Thames Valley/Berkshire)
- Homepage coverage links, Police Station Cover quick-answer, analytics events
- `public/llms.txt` (25 live articles)
- Blog hero WebP assets

---

## C. Blog posts created

| Site | Drafts / live | Words (min per post) | Published in repo |
|------|---------------|----------------------|-------------------|
| policestationrepuk.org | 3 new + 22 existing | 800+ (new) | **Yes** (3 new on deploy) |
| policestationagent.com | 10 | ~846 | No — `sites/.../blog/` |
| psrtrain.com | 10 | ~762 | No |
| custodynote.com | 10 | ~761 | No |

---

## D. Local landing pages

| Site | Count | Location |
|------|-------|----------|
| policestationrepuk.org | 8 county hubs (enhanced in-repo) | `lib/county-seo-pages.ts` |
| policestationagent.com | 12 Kent/Medway towns | `sites/policestationagent.com/local/` |
| psrtrain.com | 9 training pages | `sites/psrtrain.com/local/` |
| custodynote.com | 9 template/tool pages | `sites/custodynote.com/local/` |

---

## E. Buffer scheduled

- PSR UK: all 75 channel slots queued
- External promos: bulk schedule + sync; **retry in progress** via `npm run buffer:retry-failed`
- See `seo-growth/buffer/buffer-scheduled-results.json`
- Facebook: CSV only (no Facebook channel in Buffer config)

---

## F. Manual publication (external sites)

**Master checklist:** [`MANUAL_PUBLICATION_TODO.md`](MANUAL_PUBLICATION_TODO.md)

Per-site packages include `README.md`, `MANUAL_PUBLICATION_TODO.md`, `blog/`, `local/`, `public/llms.txt`, `schema/`.

---

## G. Missing credentials

- External site CMS/repos (PSA, PSR Train, CustodyNote)
- Facebook Buffer channel
- GA4 on external properties (setup guide in `analytics/ANALYTICS_SETUP.md`)

---

## H. Next 10 priority actions

1. Publish `seo-growth/sites/policestationagent.com/` content to PSA CMS
2. Publish `seo-growth/sites/psrtrain.com/` and `custodynote.com/` packages
3. Copy each site's `public/llms.txt` to live `public/`
4. Deploy PSR UK if not live; submit sitemap GSC/Bing
5. Confirm Buffer retry completed (`129/129` in results JSON)
6. Publish external blog posts **before** their Buffer social dates
7. Wire JSON-LD from each site's `schema/` folder
8. Add Facebook posts manually from `buffer/buffer-posts.csv`
9. Batch-fix remaining canonical issues from `audit/seo-fixes.md`
10. Quarterly refresh `public/llms.txt` and county copy

---

See also: `changes-made.md`, `multi-site-rollout-checklist.md`, `schema/schema-summary.md`.
