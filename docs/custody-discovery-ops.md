# Custody telephone discovery — operations

Automated discovery of UK police station **custody desk** telephone numbers for [policestationrepuk.org](https://policestationrepuk.org).

**Related:** unified monitoring hub and publish gate — [station-contacts-ops.md](./station-contacts-ops.md) (automation-first, no CSV).

## Pipeline

1. **Cron** — `/api/cron/custody-number-discovery` every 6 hours (`vercel.json`)
2. **Digest cron** — `/api/cron/custody-discovery-digest` daily at 19:00 UTC (new findings from today's crawl)
3. **Outstanding digest cron** — `/api/cron/custody-discovery-outstanding` daily at 19:15 UTC (full backlog needing approve/reject)
4. **AI review cron** — `/api/cron/custody-discovery-ai-review` at 03:30, 09:30, 15:30 UTC
5. **Approved recheck cron** — `/api/cron/custody-approved-recheck` daily at 02:45 UTC (re-verifies published numbers against their source every 90 days; failures downgrade to unverified and reopen for review — never deleted)
6. **Seed** — committed `data/*-custody-numbers.json` → findings KV
6. **Crawl** — Serper search + official force pages (parallel) + optional page fetch when snippets are weak
7. **AI review** — GPT-4o-mini on new/backlog findings with page evidence
8. **Admin** — `/admin/custody-number-review` manual approve/reject
9. **Live** — approved numbers overlay onto station pages at runtime

Auto-publish is **off** by default. See [Yield review](#yield-review-deferred) below.

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `SERPER_API_KEY` | — | Google search for custody contact pages (required for best yield) |
| `CRON_SECRET` | — | Cron auth |
| `KV_REST_API_*` / `UPSTASH_*` | — | Findings + approved numbers storage |
| `CUSTODY_DISCOVERY_BATCH_LIMIT` | `10` | Suites per cron run |
| `CUSTODY_DISCOVERY_MAX_QUERIES` | `4` | Serper queries per suite |
| `CUSTODY_DISCOVERY_PAGE_FETCH_LIMIT` | `3` | Full page fetches per suite when snippet is weak |
| `CUSTODY_AI_BATCH_LIMIT` | `12` | AI reviews per cron run |
| `CUSTODY_AI_FETCH_EVIDENCE` | `true` | Fetch source pages during AI review |
| `CUSTODY_AI_AUTO_PUBLISH` | `false` | Auto-approve high-confidence official findings |
| `CUSTODY_AI_AUTO_REJECT` | `true` | Auto-reject AI reject (≥85%) and hold cross-ref rejects |
| `CUSTODY_AI_MIN_REJECT_CONFIDENCE` | `85` | Minimum AI confidence to auto-reject on AI "reject" recommendation |
| `CUSTODY_AI_LOW_REJECT_CONFIDENCE` | `40` | Lower tier: auto-reject junk/untrusted sources at this confidence |
| `CUSTODY_AI_REP_REJECT_CONFIDENCE` | `50` | (Unused — rep directories auto-reject at any AI reject confidence) |
| `CUSTODY_RECHECK_DAYS` | `90` | Re-verify published numbers against source after this many days |
| `CUSTODY_RECHECK_BATCH_LIMIT` | `20` | Approved numbers rechecked per cron run |
| `CUSTODY_CORROBORATION_MIN_SOURCES` | `2` | Independent trusted domains required for corroborated auto-publish |
| `CUSTODY_EVIDENCE_RETRY_LIMIT` | `3` | Max automatic re-reviews when the source page fetch fails |
| `CUSTODY_DISCOVERY_NOTIFY_EMAIL` | — | Daily digest of new findings |

### Auto-publish gates

`canAutoPublish` in `lib/custody-discovery/auto-decision.ts`. **Hard gates** that always apply, on every path:

1. Number range is geographic (01/02), 03, or freephone — **mobiles, premium-rate (084/087/09/070), emergency codes, and invalid formats can never auto-publish**
2. Classification is `direct_custody`
3. No conflict flagged; never overwrites a different approved number
4. Evidence came from a full page fetch (not a search snippet or unfetched PDF)
5. Exact number appears in the fetched excerpt, with custody wording
6. AI must give a substantive publish rationale

Then one of two paths must pass:

- **Path A — official source (strictest, publishes as verified-eligible):** official source type (official_police / police_uk / foi / pdf), source domain is `.police.uk` or the force's own domain, AI confidence ≥ 92, rule score ≥ 85.
- **Path B — multi-source corroboration (publishes as unverified):** the finding is from a trusted source type (official / police.uk / foi / pdf / pcc / local_authority) and ≥ 2 **independent trusted domains** (`CUSTODY_CORROBORATION_MIN_SOURCES`) report the **same landline** for the suite with **no trusted source disagreeing**. Thresholds scale: 2 domains → AI ≥ 75 & score ≥ 60; 3+ domains → AI ≥ 60 & score ≥ 45. Corroborated publishes always enter as `unverified` and are confirmed later by an official source or the 90-day recheck.

### Automatic queue clearing (on every AI review)

- **Deterministic reject** — generic/switchboard/101/emergency numbers (`isGenericCustodyNumber`, `switchboard`, `general_101` classifications) are auto-rejected immediately; no manual review needed.
- **Broad AI reject** — when AI recommends `reject` at ≥ `CUSTODY_AI_MIN_REJECT_CONFIDENCE` (default 85), auto-reject unless `conflictReason` is set. Rep/self directories (policestationreps.com, policestationrepuk.org) auto-reject at **any** AI reject confidence. Other untrusted sources auto-reject at ≥40%. Official/trusted sources below 85% stay in manual queue.
- **Hold cross-reference** — AI `hold` findings are cross-checked against sibling findings and force-wide published patterns (`lib/custody-discovery/hold-resolver.ts`):
  - 2+ trusted domains agree + page evidence → auto-publish (corroborated, unverified)
  - Rep-directory / untrusted-only → auto-reject
  - Number on ≥3 force suites → auto-reject as force switchboard
  - Trusted sources disagree → flag conflict (never auto-publish)
  - Unresolved → manual queue
- **Duplicate confirmations** — a finding matching the already-published number for its suite is closed automatically; trusted page evidence bumps `lastVerifiedAt`.
- **Unsafe numbers** — mobiles/premium-rate from non-official sources are auto-rejected.
- **Weak-evidence retries** — page-fetch failures retried up to `CUSTODY_EVIDENCE_RETRY_LIMIT` (default 3).

**Conflicts never auto-publish or auto-reject** — they always need your decision in the admin panel.

Nothing is invented: numbers only enter the pipeline via crawler extraction from fetched pages or committed official JSON, and the AI validator (`ai-review-validator.ts`) downgrades any AI approval whose excerpt does not contain the exact number.

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

# Dry-run backlog auto-decision (hold cross-ref + broad AI reject)
npx tsx scripts/custody-resolve-hold-backlog.ts --dry-run

# Apply backlog cleanup to production KV
npx tsx scripts/custody-resolve-hold-backlog.ts
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

### Force outstanding backlog digest

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/custody-discovery-outstanding?force=1" | jq
```

Sends a daily summary of **all** open findings (AI approve / hold / reject counts + priority queue), not just today's new discoveries.

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
