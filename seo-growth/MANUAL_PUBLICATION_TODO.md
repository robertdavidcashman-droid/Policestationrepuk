# Manual publication TODO — all four sites

**Repository:** Policestationrepuk (policestationrepuk.org only)  
**Last updated:** 2026-06-14

---

## policestationrepuk.org — IN REPO (deploy)

- [x] 3 net-new blog posts (`articles-batch-5.ts`)
- [x] County SEO metadata + CTAs (8 regions)
- [x] Analytics events + `public/llms.txt`
- [ ] **Deploy** to Vercel production (if not already)
- [ ] Submit sitemap in GSC + Bing
- [ ] Run IndexNow after deploy
- [ ] Confirm GA4 events in production

See [`indexing/INDEXING_CHECKLIST.md`](indexing/INDEXING_CHECKLIST.md).

---

## policestationagent.com — EXTERNAL

**Package:** [`sites/policestationagent.com/`](sites/policestationagent.com/)

1. Copy `public/llms.txt` → site `public/llms.txt`
2. Publish 10 blog posts from `blog/` (frontmatter + body)
3. Publish 12 local pages from `local/` (Kent/Medway towns)
4. Wire Article / LegalService / LocalBusiness / FAQ schema from `schema/`
5. Add CTA labels: Call Robert Cashman · WhatsApp Now · Email Instructions · Request Police Station Cover
6. Submit sitemap after publish
7. After blogs live: Buffer RSS will auto-pick new items; or import `buffer/buffer-posts.csv` rows for this domain

---

## psrtrain.com — EXTERNAL

**Package:** [`sites/psrtrain.com/`](sites/psrtrain.com/)

1. Copy `public/llms.txt`
2. Publish 10 blog posts from `blog/`
3. Publish 9 training landing pages from `local/`
4. Wire Course / Organization / Article / FAQ schema from `schema/`
5. CTAs: Register Interest · Download Training Guide · Book Training · Join Course Updates
6. Submit sitemap
7. Buffer: RSS feed or manual CSV import

---

## custodynote.com — EXTERNAL

**Package:** [`sites/custodynote.com/`](sites/custodynote.com/)

1. Copy `public/llms.txt`
2. Publish 10 blog posts from `blog/`
3. Publish 9 template/tool landing pages from `local/`
4. Wire SoftwareApplication / FAQ / HowTo schema from `schema/`
5. CTAs: Try CustodyNote · Join Waitlist · Request Demo · Download Template
6. Submit sitemap
7. Buffer: RSS feed or manual CSV import

---

## Buffer (all sites)

- [ ] Finish last 12 failed posts: `npm run buffer:sync-seo-growth && npm run buffer:retry-failed && npm run buffer:sync-seo-growth`
- [ ] Facebook rows in CSV — manual (no Facebook channel in Buffer config)
- [ ] See [`buffer/BUFFER_MANUAL_UPLOAD_INSTRUCTIONS.md`](buffer/BUFFER_MANUAL_UPLOAD_INSTRUCTIONS.md)

---

## Credentials needed (not in this repo)

| Site | Need |
|------|------|
| policestationagent.com | CMS/repo access, GSC, GA4 |
| psrtrain.com | CMS/repo access, GSC, GA4 |
| custodynote.com | CMS/repo access, GSC, GA4 |
| All | Facebook page for manual social |
