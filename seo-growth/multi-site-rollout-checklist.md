# Multi-site SEO rollout checklist

Use this when implementing the same growth system on **policestationagent.com**, **psrtrain.com**, and **custodynote.com** (separate repos).

## Per-site technical foundation

- [ ] Confirm canonical host in env (`NEXT_PUBLIC_SITE_URL`)
- [ ] Unique title + meta description on every indexable page (50–60 / 140–160 chars)
- [ ] One H1 per page; logical H2/H3 structure
- [ ] `robots.txt` allows public pages; blocks admin/test
- [ ] `sitemap.xml` includes hubs, blog, landing pages; excludes low-value duplicates
- [ ] Open Graph + Twitter card on all key templates
- [ ] JSON-LD: see `seo-growth/schema/schema-summary.md`
- [ ] `public/llms.txt` (drafts in `seo-growth/llms/`)

## policestationagent.com

- [ ] LegalService + LocalBusiness + Person (Robert Cashman) + Service schema
- [ ] 12 Kent/Medway town landing pages (`seo-growth/local-seo/policestationagent/`)
- [ ] CTAs: Call Robert Cashman · WhatsApp Now · Email Instructions · Request Police Station Cover
- [ ] 10 blog posts from `seo-growth/blog-posts/policestationagent/` — publish to CMS
- [ ] Buffer: RSS feed or manual upload from `seo-growth/buffer/buffer-posts.csv`
- [ ] GSC + Bing sitemap submit

## psrtrain.com

- [ ] Course + EducationalOrganization schema on training pages
- [ ] 9 training landing pages (`seo-growth/local-seo/psrtrain/`)
- [ ] CTAs: Register Interest · Download Training Guide · Book Training · Join Course Updates
- [ ] 10 blog posts from `seo-growth/blog-posts/psrtrain/`
- [ ] Cross-link to policestationrepuk.org for rep registration (contextual only)

## custodynote.com

- [ ] SoftwareApplication schema (if product live)
- [ ] 9 template/tool landing pages (`seo-growth/local-seo/custodynote/`)
- [ ] CTAs: Try CustodyNote · Join Waitlist · Request Demo · Download Template
- [ ] 10 blog posts from `seo-growth/blog-posts/custodynote/`
- [ ] Cross-link to psrtrain.com for training resources

## Shared automation

- [ ] `BUFFER_API_KEY` + channel IDs in Vercel (see `docs/buffer-ops.md` on PSR UK repo)
- [ ] GA4 + conversion events aligned with `seo-growth/analytics/ANALYTICS_SETUP.md`
- [ ] IndexNow key file + daily submit cron (if supported)
- [ ] Quarterly llms.txt refresh

## Compliance (all sites)

- [ ] General-information disclaimer on blog/guides — not case-specific legal advice
- [ ] No fake reviews, ratings, or unevidenced “best/leading” claims
- [ ] Privacy, cookies, terms pages current
