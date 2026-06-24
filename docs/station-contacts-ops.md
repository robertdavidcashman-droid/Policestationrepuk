# Station contacts — operations (automation-first)

Automated custody discovery and community corrections for [policestationrepuk.org](https://policestationrepuk.org) station contact data. **There is no CSV import, file upload, or manual URL paste workflow** — ingestion is fully automated; admin approval is required before numbers publish.

See also: [custody-discovery-ops.md](./custody-discovery-ops.md)

## End-to-end automation

```text
GitHub Actions (weekly Playwright) → data/*-custody-numbers.json
        ↓
Custody cron (every 6h) → seed JSON + Serper + official pages + AI review
        ↓
Findings KV (needs_review) + daily digest email
        ↓
Admin approve → KV overrides + verification/provenance
        ↓
finalizeStations() → public station pages + directory
```

Community forms (`/UpdateStation`, `/contribute-custody-numbers`) queue to separate admin paths with the same publish gate.

## Cron jobs

| Schedule | Route | Purpose |
|----------|-------|---------|
| Every 6 hours | `/api/cron/custody-number-discovery` | Seed official JSON, crawl suites, AI review, digest |
| Mondays 04:00 UTC | `/api/cron/station-contact-health` | Metrics snapshot only (never publishes) |

Auth: `Authorization: Bearer $CRON_SECRET`

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/custody-number-discovery?limit=3" | jq

curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/station-contact-health" | jq
```

Weekly Playwright fetch: [`.github/workflows/custody-official-fetch.yml`](../.github/workflows/custody-official-fetch.yml) — updates committed `data/*-custody-numbers.json`; cron `seedFindingsFromOfficialJson` ingests automatically.

## Admin monitoring hub

**URL:** `/admin/station-contacts`

| Tab | Purpose |
|-----|---------|
| Overview | Missing custody, open findings, pending updates, stale/low-confidence counts |
| Directory | Paginated station table with health badges |

**No upload endpoints.** Optional JSON backup: `GET /api/admin/station-contacts?format=snapshot`

### Review shortcuts

- **Custody discovery:** `/admin/custody-number-review` — approve/reject autonomous findings
- **Community updates:** `/admin/station-updates` — approve `/UpdateStation` submissions
- **Custody tips:** `/admin/custody-tips` — rep crowdsource consensus

`CUSTODY_AI_AUTO_PUBLISH` stays **`false`** — discovery is automatic; publish is manual only.

## Publish gate

Implemented in [`lib/station-contacts/publish.ts`](../lib/station-contacts/publish.ts):

1. Value must be dialable
2. Field passes [`isVerifiedStationPhoneField`](../lib/station-phone-trust.ts) or approved custody discovery overlay
3. Not `not_publicly_listed` in verification meta
4. Custody uses [`getCustodyPhoneDisplay`](../lib/custody-discovery/display.ts)

When no approved custody line exists, public pages show:

> **Custody number: Not publicly published**

Emergency reminders (999 / 101) are static — never stored as per-station CSV data.

## Health badges

Computed in [`lib/station-contacts/health.ts`](../lib/station-contacts/health.ts):

| Badge | Meaning |
|-------|---------|
| `missing-source` | Dialable phone without http source |
| `missing-custody` | Custody station without published custody line |
| `duplicate` | Same number on multiple fields |
| `low-confidence` | Unverified / low provenance |
| `stale` | Last checked > 12 months |
| `open-finding` | Custody discovery finding awaiting review |
| `pending-update` | Community correction awaiting approval |

## Approve orchestrator

[`approveStationContact()`](../lib/station-contacts/apply.ts) delegates to:

- [`approveFinding()`](../lib/custody-discovery/storage.ts) for custody discovery
- [`saveStationOverride()`](../lib/station-overrides.ts) for community updates

Conflicts (e.g. discovery vs community custody number) return HTTP 409 — never silent overwrite. Pass `force: true` only after human review.

## Environment variables

Same as custody discovery — see [custody-discovery-ops.md](./custody-discovery-ops.md). Key flags:

| Variable | Default | Notes |
|----------|---------|-------|
| `CUSTODY_AI_AUTO_PUBLISH` | `false` | Must stay off |
| `CUSTODY_AI_AUTO_REJECT` | `true` | Junk auto-rejected after AI review |
| `SERPER_API_KEY` | — | Required for best crawl yield |
| `CRON_SECRET` | — | Cron auth |

## NPM / scripts

```bash
# Custody pipeline status
npx tsx scripts/custody-status.ts

# Manual discovery batch
npx tsx scripts/run-custody-discovery.ts --limit=5

# Playwright official fetch (also runs in GH Actions)
npx tsx scripts/fetch-devon-cornwall-custody.ts --write
```

## Tests

```bash
npm test -- __tests__/station-contacts-publish.test.ts __tests__/station-contacts-health.test.ts
```

## Deliberately not built

- CSV import/export wizards
- Manual URL extraction panel
- `stationcontactimport:*` KV batches
- Auto-publish without admin approval
- Direct writes to `data/stations.json` from automated pipelines
