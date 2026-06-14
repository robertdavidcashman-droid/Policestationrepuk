# Indexing checklist

## Google Search Console

- [ ] Verify property: `https://policestationrepuk.org`
- [ ] Submit sitemap: `https://policestationrepuk.org/sitemap.xml`
- [ ] URL inspection for `/`, `/directory`, `/Register`, `/Blog`, 3 new blog URLs
- [ ] Monitor Coverage report for “Excluded by canonical” regressions

## Bing Webmaster Tools

- [ ] Verify site
- [ ] Submit same sitemap
- [ ] IndexNow key: `public/{INDEXNOW_KEY}.txt` (see `lib/indexnow.ts`)
- [ ] Cron: `/api/cron/indexnow` daily backup

## On-site checks

- [ ] `robots.txt` allows public paths; blocks `/admin`, `/api`
- [ ] No accidental `noindex` on county or blog pages
- [ ] Canonical URLs use `policestationrepuk.org`
- [ ] JSON-LD validates on sample pages

## External sites (when published)

Repeat GSC/Bing steps for policestationagent.com, psrtrain.com, custodynote.com.

## Post-deploy (PSR UK)

```bash
npm run indexnow
```

After new blog deploy, confirm URLs appear in sitemap and IndexNow submission succeeds.
