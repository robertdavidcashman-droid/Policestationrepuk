# Legal Services Directory — LAA provider refresh

Published Legal Aid Agency (LAA) crime and prison-law providers are imported as **unclaimed, source-verified stubs** in Upstash KV. They are searchable on the site but use `noindex, follow` until a firm claims the listing or enriches it beyond the auto-generated stub.

## Prerequisites

- `.env.local` with durable Upstash credentials (`UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`)
- The seed script aborts if KV is not configured (avoids writing to in-memory dev storage)

## Refresh workflow

```bash
# 1. Download latest gov.uk spreadsheet → data/laa-crime-providers.json
npm run laa:fetch

# 2. Upsert stubs into production KV (idempotent by laa-{key} ids)
npm run laa:seed

# Or both in one step:
npm run laa:refresh
```

## What the scripts do

| Script | Output |
|--------|--------|
| `scripts/fetch-laa-crime-providers.ts` | Parses the **Summary** sheet from the gov.uk publication and writes `data/laa-crime-providers.json` |
| `scripts/seed-laa-crime-providers.ts` | Builds unclaimed stubs via `lib/legal-directory/laa-seed.ts` and upserts into KV |

## Indexing rules

- **Unclaimed LAA stubs:** public, excluded from sitemap, `noindex, follow`
- **Claimed listings:** indexable automatically when `ownerEmail` is set
- **Enriched unclaimed stubs:** may become indexable when contact basics (phone, town, postcode) plus extra enrichment (website, areas covered, custom description, etc.) — see `lib/legal-directory/indexing.ts`

## Suggested schedule

Re-run `npm run laa:refresh` when gov.uk publishes an updated directory (typically quarterly). Review admin for newly seeded firms and monitor claim notifications.

## Related

- Claim flow: `/legal-services-directory/claim/[slug]`
- Admin: `/admin/legal-directory` (filter: Unclaimed seeded)
- Official curated links (separate from claimable listings): `/legal-services-directory/resources`
