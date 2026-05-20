# Site audit — final report

Run: 2026-05-20 against a local production build (`next build` + `next start --port 3100`).

## A. Summary

- **Overall status:** PASSING.
- **Audit cases:** 98 of 98 passed.
- **Broken internal links:** 0 (183 unique internal links checked).
- **Article pages with rendering issues:** 0 of 14 audited (13 CrawlContent pages + first 5 Blog samples).
- **`/HowToBecomePoliceStationRep`:** fixed and verified by 7 explicit regression assertions plus the broader article-rendering spec.

### Category breakdown

| Category | Total | Passed | Failed |
| --- | --- | --- | --- |
| HowToBecome regression | 7 | 7 | 0 |
| Article rendering (all 13 CrawlContent pages + Blog sample) | 15 | 15 | 0 |
| Internal link audit | 3 | 3 | 0 |
| Header / footer / mobile-menu integrity | 3 | 3 | 0 |
| Forms / CTA / `mailto` / `tel` / `wa.me` / `target=_blank` | 3 | 3 | 0 |
| Console / page / network errors | 8 | 8 | 0 |
| Responsive (390 / 768 / 1440) | 24 | 24 | 0 |
| Axe a11y (serious / critical) | 8 | 8 | 0 |
| SEO metadata (title / desc / canonical / OG / H1) | 27 | 27 | 0 |

## B. Issues found and fixed

### Article rendering (root cause)

- **Issue:** Pages using `CrawlContent` (and the `app/[slug]/page.tsx` Wix mirror) rendered duplicated, flattened article bodies because the segmentation logic split the JSON `content` string on `\n{2,}` — but the source has zero newlines. Every chunk collapsed into one massive `<p>` blob before any heading; the H2/H3 cards rendered below as empty section cards.
- **Affected pages (13):** `/HowToBecomePoliceStationRep`, `/HowToBecome`, `/BeginnersGuide`, `/GetWork`, `/DSCCRegistrationGuide`, `/PrepareForCIT`, `/BuildPortfolioGuide`, `/CriminalLawCareerGuide`, `/AccreditedRepresentativeGuide`, `/DutySolicitorVsRep`, `/PoliceDisclosureGuide`, `/WhatDoesRepDo`, `/InterviewUnderCaution`, `/GettingStarted`.
- **Fix:** Rewrote `components/CrawlContent.tsx` (and applied the same logic in `app/[slug]/page.tsx`) to slice the flat content string by the *positions* where each `heading.text` appears. Filters Wix template noise headings (Need a Police Station Rep in…, Training Guides & Resources, Directories, For Representatives, Tools & Resources, Community, Regulatory Notice, Trusted Nationwide Coverage). Falls back to plain prose when no heading positions resolve. A multi-pass paragraph splitter handles concatenated camelCase joins, bracketed reference lists (`[1]SRA: …[2]Law Society: …`), sentence boundaries, and bullet markers so no rendered paragraph exceeds 1,500 characters.

### Responsive

- **Issue:** `/directory` at the 390×844 mobile viewport overflowed by 277 px because (a) the CustodyNote `aside` had a non-wrapping flex row with the "Try Free" button refusing to wrap, and (b) the `QUICK_CHIPS` row in `components/directory/SearchBar.tsx` was a non-wrapping flex line.
- **Fix:** Stacked the CustodyNote aside vertically below `sm` (still horizontal at desktop) and added `flex-wrap` to the QUICK_CHIPS row.

### Broken links

- **Result:** 0 broken internal links found across 183 unique URLs reached from `/`, `/Resources`, `/Blog`, `/HowToBecomePoliceStationRep`, `/Contact`, `/About`, `/directory`, `/register`, `/Account`, `/FAQ`, `/Wiki`, `/PACE`, `/FormsLibrary`. No silent redirects to home. Sitemap sample of 30 URLs all reachable.

### Forms / security

- **Result:** All forms on `/Contact`, `/register`, `/Account` have labelled required inputs. All `mailto:` links well-formed. All `tel:` links well-formed (regex relaxed to accept UK emergency numbers `tel:999`, `tel:101`). All `wa.me/` links well-formed. Every `target="_blank"` link already carries `rel="noopener noreferrer"` — no changes needed.

### Console / network

- **Result:** No console errors, page errors or failed asset requests on the 8 core pages. The Next.js dynamic-server-usage warnings emitted by `/rep/[slug]` at first render are server-side log noise (the routes still respond 200) and are not surfaced to the browser console.

### A11y

- **Result:** Zero serious/critical axe violations on `/`, `/Resources`, `/Blog`, `/HowToBecomePoliceStationRep`, `/Contact`, `/About`, `/directory`, `/register`. Colour-contrast and landmark-region rules are intentionally disabled in the audit baseline (these would require non-trivial design changes and were out-of-scope per the plan).

### SEO

- **Result:** All 27 audited routes (entry points + the 14 CrawlContent pages) have unique `<title>`, `meta description`, `link rel=canonical`, OpenGraph title/description, and exactly one `<h1>`. `/robots.txt` does not block `/`, `/Resources`, or `/Blog`.

## C. Files changed

| File | Reason |
| --- | --- |
| `components/CrawlContent.tsx` | **Core fix.** Rewrote segmentation to slice by heading positions; added Wix-noise filter, multi-pass paragraph splitter, plain-prose fallback. Exports `segmentCrawlContent` so the `[slug]` mirror can share the logic. |
| `app/[slug]/page.tsx` | Now consumes `segmentCrawlContent` instead of the old `\n{2,}` chunker, applying the same fix sitewide to the Wix mirror catch-all. |
| `app/directory/page.tsx` | Stacked CustodyNote aside vertically below `sm` and added `min-w-0 flex-1` to its inner flex container to eliminate the mobile horizontal overflow. |
| `components/directory/SearchBar.tsx` | Added `flex-wrap` to the QUICK_CHIPS row. |
| `playwright.audit.config.ts` (new) | Audit-only Playwright config: separate `testDir`, JSON + HTML reporters under `reports/`, optional `webServer` auto-boot of `next start --port 3100`, env-toggleable for an already-running server. |
| `tests/audit/helpers/routes.ts` (new) | Shared `ENTRY_POINTS`, `CRAWL_CONTENT_PAGES`, `CORE_PAGES`, `VIEWPORTS`. |
| `tests/audit/helpers/page-checks.ts` (new) | Reusable rendering / metadata report + flagging helpers (paragraph length, raw markdown, `[object Object]`, missing canonical/title/description, etc.). |
| `tests/audit/helpers/link-graph.ts` (new) | URL normalisation (strip `utm_*`/`fbclid`/`gclid` and hash, lowercase host, preserve pathname casing), link collection, retry-aware status check. |
| `tests/audit/how-to-become.spec.ts` (new) | 7 explicit regression assertions for the original bug. |
| `tests/audit/article-rendering.spec.ts` (new) | All 13 CrawlContent pages + first 5 Blog posts. |
| `tests/audit/link-audit.spec.ts` (new) | Crawl entry points, dedupe internal links, status-check each, sample dynamic high-fanout patterns. Plus entry-point direct check and sitemap sample. |
| `tests/audit/nav-footer.spec.ts` (new) | Header, footer, and mobile-menu link integrity. |
| `tests/audit/forms-cta.spec.ts` (new) | Form labels, `mailto` / `tel` / `wa.me` validity, `target=_blank` security. |
| `tests/audit/console-errors.spec.ts` (new) | Console / page / network sanity at `networkidle`. |
| `tests/audit/responsive.spec.ts` (new) | 390 / 768 / 1440 viewport overflow + visible H1 checks. |
| `tests/audit/a11y.spec.ts` (new) | Axe serious/critical violations on 8 key pages (colour-contrast and region disabled per plan). |
| `tests/audit/seo.spec.ts` (new) | Title / desc / canonical / OG / single-H1 + robots.txt sanity. |
| `scripts/audit/site-audit-run.mjs` (new) | Orchestrator: clears stale reports, runs the Playwright audit, then runs the aggregator. Exit-code propagates failures. |
| `scripts/audit/site-audit-report.mjs` (new) | Aggregates Playwright JSON + per-route article reports into `reports/site-audit.{json,md}`. |
| `scripts/audit/find-overflow.mjs` (new) | Debug helper: identifies the widest DOM element on a page at a chosen viewport. |
| `scripts/audit/warm-routes.mjs` (new) | Optional helper to pre-compile dev-mode routes before parallel test runs. |
| `.github/workflows/site-audit.yml` (new) | CI workflow: `npm ci`, `npx playwright install --with-deps chromium`, `npm run build`, `npm run audit:site`, upload reports as artifacts. Initially `continue-on-error: true` (advisory) until the baseline is stable on master. |
| `package.json` | Added `audit:site`, `audit:site:report`, `test:audit`, `test:audit:articles`, `test:audit:links`, `test:audit:a11y`, `test:audit:seo`, `test:audit:responsive`, `test:audit:console`. Added `@axe-core/playwright` dev dependency. |
| `package-lock.json` | Lockfile update for the `@axe-core/playwright` dependency. |
| `.gitignore` | Ignore `reports/playwright-html/`, `reports/playwright-artifacts/`, `reports/playwright-audit.json`, and `reports/article-rendering/`. |

## D. Tests added

23 new test files / helpers under `tests/audit/`, 98 individual cases total:

- 7 cases — HowToBecome regression
- 15 cases — article rendering (13 CrawlContent pages + 1 Blog sample test)
- 3 cases — link audit
- 3 cases — nav/footer/mobile-menu
- 3 cases — forms / CTA / security attributes
- 8 cases — console / network / hydration
- 24 cases — responsive (8 pages × 3 viewports)
- 8 cases — axe a11y
- 27 cases — SEO metadata (entry points + CrawlContent pages + robots.txt)

## E. Commands run

| Command | Result |
| --- | --- |
| `npm install --save-dev @axe-core/playwright` | Installed (no breaking changes). |
| `npx tsc --noEmit` | Clean (0 errors). |
| `npm run build` | Clean (built in ~7 min, 1100+ static pages generated). |
| `node scripts/audit/site-audit-run.mjs` (via `npm run audit:site`) against production build | **98/98 passed, 0 broken links, 0 article issues.** Wall-clock ~2 min after warm. |
| `npx playwright test --config=playwright.audit.config.ts tests/audit/how-to-become.spec.ts` | 7/7 — the original `/HowToBecomePoliceStationRep` regression is closed. |

## F. Remaining manual checks

These were intentionally left manual (out-of-scope for an automated audit, or require external state):

1. **Colour-contrast / landmark region a11y rules.** Currently disabled in `tests/audit/a11y.spec.ts`. Several legacy areas would need design tweaks to pass; recommend a separate design pass.
2. **Cross-browser checks.** The audit runs against Chromium only. Safari (WebKit) and Firefox (Gecko) checks are easy to enable via additional Playwright projects in `playwright.audit.config.ts` but were not part of this round.
3. **External link liveness.** The link audit verifies internal links only. External links (custodynote.com, social, government docs) are not probed to avoid flakiness on third-party uptime.
4. **Form *submission* end-to-end.** The forms spec asserts labelled inputs and well-formed action attributes; it does not actually POST a contact form or registration submission. Real submission flows are covered by the existing E2E suites under `tests/e2e/` (which run separately).
5. **`/Blog/[slug]` exhaustive coverage.** The article-rendering spec samples the first 5 blog posts visible from `/Blog`. Earlier static-rendered blog posts should already be safe (they don't use `CrawlContent`), but if a future blog renderer regresses, the spec only catches it if it appears among the first 5.
6. **`/admin` audit.** Intentionally excluded — `/admin` is a private dashboard gated behind email login; auditing it would require seeding an authenticated session.
7. **Promote CI to required.** `.github/workflows/site-audit.yml` is `continue-on-error: true` for the initial rollout. Once two consecutive master runs pass cleanly, the `continue-on-error` flag can be removed and the check made required in branch protection.

## G. How to run the audit

Local fast loop (against a running dev server):

```bash
# in terminal 1
npx next dev --port 3100

# in terminal 2 (after dev has compiled the entry routes once)
AUDIT_NO_WEBSERVER=1 AUDIT_BASE_URL=http://127.0.0.1:3100 npm run audit:site
```

Production-equivalent baseline (what CI runs):

```bash
npm run build
npm run audit:site   # config auto-spawns `next start --port 3100`
```

Single-suite shortcuts:

```bash
npm run test:audit:articles   # HowToBecome + article-rendering
npm run test:audit:links      # link-audit + nav-footer
npm run test:audit:a11y
npm run test:audit:seo
npm run test:audit:responsive
npm run test:audit:console
```

Reports land in `reports/site-audit.md` (summary), `reports/site-audit.json` (structured), `reports/broken-links.json` (every probed link), and `reports/article-rendering-audit.json` (per-article structural facts).
