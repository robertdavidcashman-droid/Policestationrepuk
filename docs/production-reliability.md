# Production reliability — policestationrepuk.org

Operational checklist for deployments, smoke verification, and rollback.

## Required production environment

| Variable | Purpose |
|----------|---------|
| `CRON_SECRET` | Authenticates all Vercel cron routes (missing → 401 on every cron) |
| `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` (or `KV_REST_API_*`) | Auth sessions, outreach, custody, buffer state |
| `RESEND_API_KEY` | Transactional email (outreach, digests, magic codes) |
| `BUFFER_API_KEY` | Buffer scheduler |
| `BUFFER_CHANNEL_TWITTER_ID`, `BUFFER_CHANNEL_LINKEDIN_ID`, `BUFFER_CHANNEL_GOOGLEBUSINESS_ID` | Buffer channel targets (required in production — no hardcoded fallback) |
| `SERPER_API_KEY` | Custody number discovery search |
| `FIRM_OUTREACH_DIGEST_EMAIL` (or `BUFFER_SCHEDULER_NOTIFY_EMAIL` / `OWNER_EMAIL`) | Outreach daily digest recipient |
| `FIRM_OUTREACH_FROM_EMAIL` | Outreach + digest FROM address |

Optional but recommended: `RESEND_WEBHOOK_SECRET`, `NEXT_PUBLIC_SUPABASE_URL` + `NEXT_PUBLIC_SUPABASE_ANON_KEY` (pair only).

## Pre-deploy verification (local / CI)

```bash
npm install
npx tsc --noEmit
npm run lint
npm test
npm run test:custody-discovery:ci
npm run test:buffer:ci
npm run test:firm-outreach:ci
npm run build
```

Cron route inventory (catches stale `vercel.json` paths):

```bash
npx vitest run __tests__/vercel-cron-routes.test.ts
```

## Post-deploy smoke

```bash
curl -sS https://policestationrepuk.org/api/health
curl -sS https://policestationrepuk.org/api/ready
curl -sI https://policestationrepuk.org/
curl -sI https://policestationrepuk.org/directory
curl -sI https://policestationrepuk.org/Register
```

`/api/ready` returns boolean flags only — no secret values.

## Rollback

1. Revert the git commit on `master`.
2. Vercel → project `policestationrepuk-new` → Deployments → promote previous production deployment.
3. Re-run post-deploy smoke curls above.

## Cron wiring

Every path in `vercel.json` `crons` must have `app/api/cron/<path>/route.ts`. The inventory test enforces this on every CI run.

Firm outreach daily bootstrap: `/api/cron/firm-outreach-bootstrap` (replaces removed `firm-outreach-kick`).

## Observability

Structured last-run summaries are stored in KV under `cron-run:latest:<jobName>` for buffer and custody crons. Use admin/status routes or KV inspection for debugging.

## Dry-run safety

- Firm outreach: `FIRM_OUTREACH_DRY_RUN=1`
- Buffer: scheduler `dryRun` / test mode in scripts
- Never run outreach tests against production Resend without mocks
