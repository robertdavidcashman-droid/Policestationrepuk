# Custody telephone discovery — operations

Automated discovery of UK police station **custody desk** telephone numbers for [policestationrepuk.org](https://policestationrepuk.org).

**Related:** unified monitoring hub and publish gate — [station-contacts-ops.md](./station-contacts-ops.md) (automation-first, no CSV).

## Pipeline

1. **Cron** — `/api/cron/custody-number-discovery` every 6 hours (`vercel.json`)
2. **Seed** — committed `data/*-custody-numbers.json` → findings KV
3. **Crawl** — Serper search + official force pages (parallel) + optional page fetch when snippets are weak
4. **AI review** — GPT-4o-mini on new/backlog findings with page evidence
5. **Admin** — `/admin/custody-number-review` manual approve/reject
6. **Live** — approved numbers overlay onto station pages at runtime

Auto-publish is **off** by default. See [Yield review](#yield-review-deferred) below.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SERPER_API_KEY` | — | Google search for custody contact pages (required for best yield) |
| `CRON_SECRET` | — | Cron auth |
| `KV_REST_API_*` / `UPSTASH_*` | — | Findings + approved numbers storage |
| `CUSTODY_DISCOVERY_BATCH_LIMIT` | `25` | Suites per cron run |
| `CUSTODY_DISCOVERY_MAX_QUERIES` | `4` | Serper queries per suite |
| `CUSTODY_DISCOVERY_PAGE_FETCH_LIMIT` | `3` | Full page fetches per suite when snippet is weak |
| `CUSTODY_AI_BATCH_LIMIT` | `50` | AI reviews per cron run |
| `CUSTODY_AI_FETCH_EVIDENCE` | `true` | Fetch source pages during AI review |
| `CUSTODY_AI_AUTO_PUBLISH` | `false` | Auto-approve high-confidence official findings |
| `CUSTODY_AI_AUTO_REJECT` | `true` | Auto-reject obvious junk after AI review |
| `CUSTODY_DISCOVERY_NOTIFY_EMAIL` | — | Daily digest of new findings |

**Production:** ensure `SERPER_API_KEY` is set on the RepUK Vercel project. Local `vercel env pull` may omit sensitive keys.

## NPM / scripts

```bash
# Status summary (findings, approved, missing suites)
npx tsx scripts/custody-status.ts

# Manual discovery batch
npx tsx scripts/run-custody-discovery.ts --limit=5

# Force registry audit
npx tsx scripts/audit-force-custody-coverage.ts

# Playwright fetch for Cloudflare-protected official pages (Devon & Cornwall)
npx playwright install chromium
npx tsx scripts/fetch-devon-cornwall-custody.ts --write

# Merge official JSON into stations.json
npx tsx scripts/seed-official-custody.ts --write
```

## Metrics and baseline

Pre-change baseline (2026-06-11): [`data/reports/custody-discovery-baseline-2026-06-11.json`](../data/reports/custody-discovery-baseline-2026-06-11.json)

| Metric | Command / source |
|--------|------------------|
| Findings by status | `scripts/custody-status.ts` |
| Suites still missing published number | `suitesStillMissingNumber` in status JSON |
| Per-run crawl stats | Cron JSON: `findingsCreated`, `findingsRejected`, `pageFetchesUsed`, `officialPagesFetched` |
| Open review queue | `openQueue` in status JSON |

**Phase 1 success target:** increase `findingsCreated / suitesScanned` vs baseline (0 created, 11 rejected on a 1-suite smoke).

### Production cron smoke

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/custody-number-discovery?limit=3" | jq
```

## Weekly official fetch (GitHub Actions)

Workflow: [`.github/workflows/custody-official-fetch.yml`](../.github/workflows/custody-official-fetch.yml)

- Runs Sundays 03:00 UTC (and manual `workflow_dispatch`)
- Playwright fetch for Devon & Cornwall custody listing
- Uploads `data/devon-cornwall-custody-numbers.json` as artifact
- Review artifact → commit JSON or run `seed-official-custody.ts --write`

Expand this workflow force-by-force for other Cloudflare-protected `.police.uk` custody pages.

## Force custody page registry

Verified URLs live in [`lib/custody-discovery/official-pages.ts`](../lib/custody-discovery/official-pages.ts) (`FORCE_CUSTODY_PAGES`). Run `scripts/audit-force-custody-coverage.ts` to see top forces and registry gaps.

Committed seed files: `data/*-custody-numbers.json` (ingested at cron start).

## Yield review (deferred)

**Do not enable auto-publish until ~2 weeks after Phase 1 deploy.**

Checklist ([`data/reports/custody-discovery-yield-review-checklist.md`](../data/reports/custody-discovery-yield-review-checklist.md)):

1. Run `custody-status.ts` — compare `suitesStillMissingNumber` and `openQueue` to baseline
2. Sample 20 recent `needs_review` findings — manual precision audit
3. Check cron logs for `pageFetchesUsed` and `findingsCreated` trend
4. If official + `page_fetch` findings exceed **~70% precision**, consider `CUSTODY_AI_AUTO_PUBLISH=true` (official sources only; existing gates in `auto-decision.ts`)

## Admin

- Review queue: `/admin/custody-number-review`
- Batch email links include one-click admin access token
