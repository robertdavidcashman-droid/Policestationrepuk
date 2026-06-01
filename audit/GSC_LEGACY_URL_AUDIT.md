# GSC legacy URL audit

## Summary (Search Console “Why pages aren’t indexed”)

| GSC reason | Typical cause on this site | Action |
|------------|---------------------------|--------|
| **Not found (404)** | Old Wix blog URLs, removed pages, external bad links | **Fixed for blog:** unknown `/Blog/{slug}` now **301 → `/Blog` or best-match article** via `resolveLegacyBlogRedirect()` in middleware. Remaining 404s are intentional removals or URLs never mapped. |
| **Page with redirect** | `.com` → `.org`, lowercase paths, legacy blog slugs | **Correct** — should not be indexed. |
| **Excluded by noindex** | `/register`, admin, thin station pages | **Intentional** |
| **Alternative page with proper canonical** | `/Directory` vs `/directory`, duplicate hosts | **Correct** |
| **Discovered / Crawled – not indexed** | Crawl queue, thin pages | Normal for large directories |

## Sitemap vs GSC

- **Sitemap:** ~1,100 URLs at `https://policestationrepuk.org/sitemap.xml` (intended index targets).
- **GSC not-indexed total:** ~1,800+ across all reasons — includes legacy URLs Google still knows from the old Wix site (~258 blog URLs alone).

## Blog redirect coverage

Run locally:

```bash
npx tsx scripts/analyze-gsc-legacy-urls.ts
```

Logic lives in [`lib/blog/legacy-blog-slugs.ts`](../lib/blog/legacy-blog-slugs.ts):

1. Exact slug map (`LEGACY_BLOG_SLUG_TO_PATH`)
2. Topic keyword rules (voluntary interview → attendance checklist, etc.)
3. Fallback: **any unknown legacy slug → `/Blog`** (301, not 404)

## Recommended GSC steps

1. Use property **`https://policestationrepuk.org`** (apex).
2. Export a sample of **404 URLs** from GSC → filter `/Blog/` paths; after deploy they should become redirects.
3. Click **Validate fix** on the 404 report after 2–4 weeks (Google re-crawl time).
4. Ignore **Page with redirect** — working as designed.
5. Review the **6 duplicates without canonical** manually in GSC.

## Intentional 404s

Some old Wix paths have no equivalent content and correctly 404 or redirect to hub pages. Google will drop these from its index over time.
