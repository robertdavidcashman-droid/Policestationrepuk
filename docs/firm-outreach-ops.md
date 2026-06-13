# Firm outreach — operations

Automated WhatsApp invitation emails to qualified criminal defence firms. Admin dashboard: `/admin/firm-outreach`.

## Cron schedule (UTC)

| Time | Route | What runs |
|------|-------|-----------|
| `03:00` | `/api/cron/firm-outreach-pipeline/maintain` | LAA + DSCC + discovery + requalify + enrich (50 firms, max ~240s) |
| `06:00` | `/api/cron/firm-outreach-enrich` | Enrich only (50 firms) |
| `08:00` | `/api/cron/firm-outreach-enrich` | Enrich only (50 firms) |
| `09:30` | `/api/cron/firm-outreach-pipeline/full` | Send from ready queue + daily digest |
| `17:00` | `/api/cron/firm-outreach-digest` | Digest backup if morning run did not send one |

Manual re-run (one email per London day unless forced):

```bash
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/firm-outreach-digest?force=1"
```

All cron routes require `Authorization: Bearer $CRON_SECRET` (Vercel adds this automatically).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` | — | **Required** for sends and digest |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | — | **Required** for prospect storage |
| `CRON_SECRET` | — | Cron auth + unsubscribe token signing |
| `FIRM_OUTREACH_DAILY_CAP` | `50` | Max outreach sends per UTC day |
| `FIRM_OUTREACH_DIGEST_EMAIL` | `robertdavidcashman@gmail.com` | Daily digest recipient |
| `RESEND_WEBHOOK_SECRET` | — | Resend webhook signing secret (from configure script) |
| `FIRM_OUTREACH_CRON_ENRICH_BATCH` | `50` | Firms per cron enrich tick |
| `FIRM_OUTREACH_ENRICH_BATCH` | `150` | Firms per local/manual enrich run |
| `FIRM_OUTREACH_ENRICH_MAX_MS` | `240000` | Stop enrich before serverless timeout |
| `SERPER_API_KEY` | — | Google search to resolve firm websites when SRA has none |
| `HUNTER_API_KEY` | — | Paid domain email lookup after crawl fails (2nd pass) |
| `FIRM_OUTREACH_PAID_DAILY_CAP` | `100` | Max Hunter lookups per UTC day |
| `FIRM_OUTREACH_SEND_ENABLED` | enabled | Set `false` to disable automated sends |
| `FIRM_OUTREACH_PAUSED` | off | Set `true` to pause all sends |
| `FIRM_OUTREACH_ENABLED` | enabled | Set `false` to skip entire pipeline |

## Production env verification

Confirmed present on Vercel production (via env pull):

- `RESEND_API_KEY` — sends and digest
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — prospect storage
- `CRON_SECRET` — cron auth

Recommended to set explicitly (otherwise code defaults apply):

- `FIRM_OUTREACH_DIGEST_EMAIL=robertdavidcashman@gmail.com`
- `RESEND_WEBHOOK_SECRET` — set via `node scripts/resend-configure-webhook.mjs`
- `FIRM_OUTREACH_CRON_ENRICH_BATCH=50`
- `FIRM_OUTREACH_DAILY_CAP=50` (or higher if you want larger daily batches)
- `SERPER_API_KEY` — resolves firm websites via Google when SRA lookup has no URL
- `HUNTER_API_KEY` — Hunter.io fallback when website crawl finds no email
- `FIRM_OUTREACH_PAID_DAILY_CAP=100` — Hunter lookups per day (default 100)

## Resend webhook

Register automatically (idempotent):

```bash
node scripts/resend-configure-webhook.mjs
```

Or manually in the Resend dashboard:

- **URL:** `https://policestationrepuk.org/api/webhooks/resend`
- **Events:** `email.delivered`, `email.opened`, `email.clicked`, `email.bounced`, `email.complained`

Updates the admin Send log with delivery/open/click/bounce status.

## Manual commands

```bash
# Check KV queue and timing
npm run firm-outreach:admin-smoke

# Enrich locally (large batch — run 2–3× per week while backlog is large)
npx tsx scripts/firm-outreach-enrich.ts --limit=150

# Import lead_engine ready_to_send.csv into KV (after npm run lead-engine:auto)
npx tsx scripts/firm-outreach-import-lead-engine.ts --dry-run
npx tsx scripts/firm-outreach-import-lead-engine.ts

# Send locally (dry-run by default)
npx tsx scripts/firm-outreach-send.ts
npx tsx scripts/firm-outreach-send.ts --apply --limit=50

# Full pipeline locally
npm run firm-outreach:auto
npm run firm-outreach:maintain

# Requalify prospects after rule changes
npm run firm-outreach:requalify
```

## WhatsApp join workflow

1. Firm receives invitation email with **Join on WhatsApp** button.
2. Click redirects via `/go/whatsapp-firm?ref=…` → WhatsApp to **07535 494446** with pre-filled message.
3. You verify and add them to the group on WhatsApp.
4. In admin Send log, click **Mark joined** — stops follow-ups and suppresses future outreach to that address.

## Daily digest

Sent to `FIRM_OUTREACH_DIGEST_EMAIL` after the 09:30 send run (and at 17:00 if not already sent that day). Includes:

- Ready-to-send queue (firm, email, county)
- Today's send receipts
- Daily cap usage

## Email discovery pipeline

Enrichment for each firm runs in order:

1. **SRA org register** — SRA number + website (if listed)
2. **Serper search** — Google for firm homepage when SRA has no website (`SERPER_API_KEY`)
3. **Website crawl** — contact / criminal-law pages for public emails
4. **Hunter.io** — domain search when crawl finds nothing (`HUNTER_API_KEY`, daily cap)

Guessed emails (`info@domain` via MX check) are used only when crawl/Hunter fail; lead_engine import skips `guessed` rows unless `--include-guessed`.

## Reliability notes

- Enrichment cursor advances **only after** each firm is processed — timeouts no longer skip firms.
- Cron enrich uses batches of 50 (default) with a 240s wall-clock guard to stay within Vercel's 300s function limit.
- Duplicate initial sends to the same email address are blocked across automated and admin paths.
