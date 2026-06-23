# Custody discovery yield review checklist

**Baseline date:** 2026-06-11  
**Baseline file:** `custody-discovery-baseline-2026-06-11.json`

Run this checklist **~2 weeks after** Phase 1 discovery improvements are deployed to production.

## 1. Queue and coverage metrics

```bash
npx tsx scripts/custody-status.ts
```

| Metric | Baseline (2026-06-11) | Review date | Target |
|--------|----------------------|-------------|--------|
| `suitesStillMissingNumber` | 850 | | Decreasing |
| `openQueue` | 15 | | Manageable (<50) |
| `approvedPublished` | 46 | | Increasing |
| `findings.rejected` | 162 | | Stable or slower growth vs created |

## 2. Crawl yield (production cron)

Trigger or inspect recent cron responses:

```bash
curl -sS -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/custody-number-discovery?limit=5" | jq \
  '{findingsCreated, findingsRejected, pageFetchesUsed, officialPagesFetched, suitesScanned}'
```

| Metric | Pre-change smoke | Review date | Target |
|--------|------------------|-------------|--------|
| `findingsCreated / suitesScanned` | 0 / 1 | | > 0 consistently |
| `pageFetchesUsed` | n/a | | > 0 when Serper snippets weak |

## 3. Manual precision audit (20 findings)

From `/admin/custody-number-review`, sample 20 recent `needs_review` findings where:

- `sourceType` is `official_police` or `police_uk`
- AI evidence `source` is `page_fetch`

Record:

- **Correct custody desk:** count / 20
- **Switchboard / 101 / wrong station:** count / 20
- **Uncertain:** count / 20

## 4. Auto-publish decision

Only proceed if **correct custody desk ≥ 14/20 (70%)** for official page_fetch findings.

If yes:

```bash
# Vercel production — RepUK project only
CUSTODY_AI_AUTO_PUBLISH=true
```

Existing gates remain (`auto-decision.ts`): official source only, `direct_custody`, score ≥ 80, no conflict, custody wording in evidence.

If no: keep manual approval; consider Phase 2 force registry expansion or Playwright weekly jobs.

## 5. Sign-off

| Reviewer | Date | Decision |
|----------|------|----------|
| | | Auto-publish ON / OFF |
