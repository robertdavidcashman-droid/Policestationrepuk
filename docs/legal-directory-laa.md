# Legal Services Directory — LAA provider refresh

Published Legal Aid Agency (LAA) crime and prison-law providers are imported as **unclaimed, source-verified stubs** in Upstash KV. They are searchable on the site but use `noindex, follow` until a firm claims the listing or enriches it beyond the auto-generated stub.

## Prerequisites

- `.env.local` with durable Upstash credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- The seed script aborts if KV is not configured (avoids writing to in-memory dev storage)

## Refresh workflow

```bash
# 1. Download latest gov.uk spreadsheet → data/laa-crime-providers.json
npm run laa:fetch

# 2. Preview seed (dry-run — no KV writes)
npm run laa:seed

# 3. Upsert stubs into production KV (idempotent by laa-{key} ids)
npx tsx scripts/seed-laa-crime-providers.ts --apply

# Or fetch + dry-run seed in one step:
npm run laa:refresh
```

**Note:** `npm run laa:refresh` does **not** pass `--apply`. Production KV writes always require an explicit `--apply` on the seed script.

## Two-sheet merge and dedupe

The gov.uk spreadsheet has two relevant sheets:

| Sheet | Fields |
|-------|--------|
| **Summary** | Provider name, town, county, postcode, phone, crime/prison flags |
| **2025 Crime Providers** | Provider name and postcode only |

The fetch script dedupes by **firm + postcode** (`laaOfficeKey`). Summary rows are processed first; Crime-sheet rows are **skipped** when a Summary row already exists for the same office. Crime-sheet rows are kept only when they supplement an office missing from Summary.

Listing ids remain stable via `laaProviderKey` (firm + town + postcode) so claimed listings are not orphaned.

## Audit and cleanup

```bash
# Audit static JSON and KV for shadow duplicates
npm run laa:audit

# Remove unclaimed shadow listings from KV (dry-run by default)
npm run laa:clean
npx tsx scripts/clean-legal-directory-duplicates.ts --apply

# Full refresh after gov.uk update
npm run laa:fetch
npx tsx scripts/seed-laa-crime-providers.ts --apply
```

Reports are written to `data/reports/legal-directory-audit.json` and `.md`.

## What the scripts do

| Script | Output |
|--------|--------|
| `scripts/fetch-laa-crime-providers.ts` | Parses **Summary** + **2025 Crime Providers** sheets; dedupes; writes `data/laa-crime-providers.json` |
| `scripts/seed-laa-crime-providers.ts` | Builds unclaimed stubs via `lib/legal-directory/laa-seed.ts` and upserts into KV |
| `scripts/audit-legal-directory.ts` | Audits JSON + KV for duplicate/shadow listings |
| `scripts/clean-legal-directory-duplicates.ts` | Removes unclaimed KV shadow duplicates |

## Indexing rules

- **Unclaimed LAA stubs:** public, excluded from sitemap, `noindex, follow`
- **Claimed listings:** indexable automatically when `ownerEmail` is set
- **Enriched unclaimed stubs:** may become indexable when contact basics (phone, town, postcode) plus extra enrichment (website, areas covered, custom description, etc.) — see `lib/legal-directory/indexing.ts`

## Suggested schedule

Re-run `npm run laa:fetch` when gov.uk publishes an updated directory (typically quarterly), then audit, clean shadows if needed, and `seed --apply`. Review admin for newly seeded firms and monitor claim notifications.

## Related

- Claim flow: `/legal-services-directory/claim/[slug]`
- Admin: `/admin/legal-directory` (filter: Unclaimed seeded)
- Official curated links (separate from claimable listings): `/legal-services-directory/resources`
