# Firm outreach — reliability architecture

This document describes the durable send pipeline introduced to stop silent
failures, duplicate sends, and “ready queue looks full but nothing sends”.

## Architecture

| Layer | Implementation |
|-------|----------------|
| App | Next.js App Router (Node runtime) |
| Hosting | Vercel (`maxDuration` 300s on send/pipeline) |
| State | Upstash Redis / Vercel KV |
| Email | Resend via `EmailProvider` abstraction |
| Scheduler | Vercel Cron (`vercel.json`) + GitHub Actions production kick |
| Campaigns | `whatsapp_invite_v1` (RepUK) + `agent_cover_kent_v1` (PSA) |

```
Cron / kick / approval
        │
        ▼
runFirmOutreachPipeline
        │
        ├─ recoverAbandonedEmailJobs()
        ├─ selectOutreachCandidates()   ← only due steps (no not-due noise)
        ├─ enqueueEmailJob()            ← durable outbox + idempotency NX
        └─ claimNextEmailJob() → provider.send() → mark accepted / retry
                │
                ▼
        FirmOutreachSend + prospect status + daily/hourly counters
                │
                ▼
        Resend webhooks → delivered / bounced / complained
```

## Durable email jobs

KV keys:

- `firmoutreach:job:{id}` — job record
- `firmoutreach:job:idem:{sha}` — uniqueness / idempotency (SET NX)
- `firmoutreach:job:status:{status}` — status indexes
- `firmoutreach:job:lease:{id}` — claim lease (SET NX + TTL)
- `firmoutreach:job:pending_z` — due-time ordering

States: `pending`, `claimed`, `processing`, `accepted`, `delivered`,
`deferred`, `bounced`, `complained`, `unsubscribed`, `suppressed`, `failed`,
`retry_scheduled`, `permanently_failed`.

Idempotency key = SHA256(`campaignId|normalisedEmail|sequenceStep`)[:40].

A recipient cannot receive the same campaign step twice: the idempotency SET NX
is the final guard (application checks run first).

## Root causes previously seen in production

1. **Candidate pool pollution** — send loop mixed hundreds of not-due `sent`
   prospects, burned the wall-clock budget on `no_step`, and sent nothing.
2. **Inflated ready counts** — status indexes used RMW JSON arrays; stale
   members made `/status` report hundreds “ready” while record-status queries
   found almost none.
3. **No durable outbox** — Resend was called before persisting a job; crashes
   after accept could duplicate after claim TTL.
4. **Daily cap TOCTOU** — count checked then incremented after send; concurrent
   workers could overshoot.
5. **`sequenceStep` undefined** — legacy rows failed `=== 0` and were stuck as
   `no_step`.

## Sending controls

| Variable | Default | Purpose |
|----------|---------|---------|
| `FIRM_OUTREACH_DRY_RUN` | prefer `1` until verified | No provider sends / no job writes |
| `FIRM_OUTREACH_SEND_ENABLED` | on | Kill switch |
| `FIRM_OUTREACH_DAILY_CAP` | 150 (prod often 45) | Per-campaign UTC day cap |
| `FIRM_OUTREACH_HOURLY_CAP` | 0 (off) | Per-campaign UTC hour cap |
| `FIRM_OUTREACH_CRON_SEND_BATCH` | 25 | Per cron tick batch |
| `FIRM_OUTREACH_RESEND_DAILY_LIMIT` / `HEADROOM` | 100 / 10 | Shared Resend budget |

Caps are **reserved before** the provider call and released on failure.

## Retries

Transient (retry with exponential backoff + jitter): 408/409/425/429/5xx,
timeouts, DNS/network errors.

Permanent (no retry): invalid recipient, hard bounce, unauthenticated API key,
unverified domain, malformed request.

Max attempts: 5 (`DEFAULT_EMAIL_JOB_MAX_ATTEMPTS`).

## Observability

- Structured JSON logs per run (`outreach.run.selection`, `outreach.run.finished`)
  with `runId`, campaign, counts, skipReasons (never logs API keys).
- `GET /api/cron/firm-outreach-status` (cron/bootstrap auth) returns:
  - config + dry-run
  - true eligibility per campaign
  - durable job counts by status
  - latest run log
- Operator alerts via `maybeNotifyOutreachSendFailure` when:
  - errors > 0
  - zero accepts while ready > 0
  - permanentlyFailed ≥ 3
  - send config unhealthy

## Safe testing

```bash
# Unit + integration (mocked KV / provider — no real email)
npm run test:firm-outreach:ci

# Dry-run selection against configured KV (no sends)
npx tsx scripts/firm-outreach-dry-run-preview.ts --limit=25

# Local apply still respects FIRM_OUTREACH_DRY_RUN
npx tsx scripts/firm-outreach-send.ts --limit=5
```

Never point tests at production Resend without a mock or sandbox redirect.

## Enabling production sending

1. Confirm `/api/cron/firm-outreach-status` shows `sendHealthy: true`,
   `eligibility.*.readyEligible > 0` (or follow-ups due), jobs pending/processing healthy.
2. Set `FIRM_OUTREACH_DRY_RUN=0` on Vercel Production only after a successful
   dry-run preview.
3. Keep `policestationagent.com` DNS (SPF/DKIM/DMARC) verified on Resend for PSA
   from-address; until then PSA falls back to the verified RepUK domain.
4. Ensure `RESEND_WEBHOOK_SECRET` is configured (`npm run firm-outreach:configure-resend`).
5. Watch the next cron tick / kick log for `accepted > 0` and job statuses.

## Rollback

1. Set `FIRM_OUTREACH_DRY_RUN=1` or `FIRM_OUTREACH_SEND_ENABLED=false`.
2. Revert the git deploy on Vercel if needed.
3. Pending jobs remain in KV and will not send while dry-run/send-disabled.
