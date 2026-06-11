# Firm outreach — operations

Automated WhatsApp invitation emails to qualified criminal defence firms. Admin dashboard: `/admin/firm-outreach`.

## Cron schedule (UTC)

| Time | Route | What runs |
|------|-------|-----------|
| `03:00` | `/api/cron/firm-outreach-pipeline/maintain` | LAA + DSCC + discovery + requalify + enrich (25 firms, max ~240s) |
| `06:00` | `/api/cron/firm-outreach-enrich` | Enrich only (25 firms) |
| `08:00` | `/api/cron/firm-outreach-enrich` | Enrich only (25 firms) |
| `09:30` | `/api/cron/firm-outreach-pipeline/full` | Send from ready queue + daily digest |
| `17:00` | `/api/cron/firm-outreach-digest` | Digest backup if morning run did not send one |

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
| `FIRM_OUTREACH_CRON_ENRICH_BATCH` | `25` | Firms per cron enrich tick |
| `FIRM_OUTREACH_ENRICH_BATCH` | `150` | Firms per local/manual enrich run |
| `FIRM_OUTREACH_ENRICH_MAX_MS` | `240000` | Stop enrich before serverless timeout |
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
- `FIRM_OUTREACH_CRON_ENRICH_BATCH=25`
- `FIRM_OUTREACH_DAILY_CAP=50` (or higher if you want larger daily batches)

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

# Enrich locally (large batch)
npx tsx scripts/firm-outreach-enrich.ts --limit=150

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

## Reliability notes

- Enrichment cursor advances **only after** each firm is processed — timeouts no longer skip firms.
- Cron enrich uses small batches (25) with a 240s wall-clock guard to stay within Vercel's 300s function limit.
- Duplicate initial sends to the same email address are blocked across automated and admin paths.
