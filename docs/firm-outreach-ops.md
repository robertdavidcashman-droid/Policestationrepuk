# Firm outreach — operations

Automated WhatsApp invitation emails to qualified criminal defence firms. Admin dashboard: `/admin/firm-outreach`.

## Cron schedule (UTC)

| Time | Route | What runs |
|------|-------|-----------|
| `03:00` | `/api/cron/firm-outreach-pipeline/maintain` | LAA + DSCC + discovery + requalify; Sunday requeues `no_email` prospects |
| `05:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `06:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `07:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `08:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `10:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `12:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `14:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `18:00` | `/api/cron/firm-outreach-enrich` | Enrich only (~60 firms, ~270s max) |
| `09:30` | `/api/cron/firm-outreach-pipeline/full` | Auto-send up to daily cap (when approval disabled) |
| `14:30` | `/api/cron/firm-outreach-send` | Send-only top-up (no digest) |
| `18:30` | `/api/cron/firm-outreach-send` | Send-only top-up (no digest) |
| `17:00` | `/api/cron/firm-outreach-digest` | **Reminder** approval email if daily cap not yet reached |
| — | `/api/cron/firm-outreach-status` | Config + queue health (monitoring) |

Manual approval email (one per London day unless `--force` or reminder cron):

```bash
npm run firm-outreach:send-approval-email
npm run firm-outreach:send-approval-email -- --force
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/firm-outreach-pipeline/full?force=1"
```

All cron routes require `Authorization: Bearer $CRON_SECRET` (Vercel adds this automatically).

## Environment variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `RESEND_API_KEY` | — | **Required** for sends and digest |
| `KV_REST_API_URL` / `KV_REST_API_TOKEN` | — | **Required** for prospect storage |
| `CRON_SECRET` | — | Cron auth + unsubscribe token signing |
| `FIRM_OUTREACH_DAILY_CAP` | `150` | Max outreach sends per UTC day |
| `FIRM_OUTREACH_DIGEST_EMAIL` | `robertdavidcashman@gmail.com` | Approval + confirmation email recipient |
| `FIRM_OUTREACH_REQUIRE_APPROVAL` | *(unset = approval required)* | Set **`false`** on Vercel for automatic sends at 09:30/14:30/18:30 UTC; set `true` for click-to-send |
| `ADMIN_DECISION_TOKEN_SECRET` | — | Signs Ready to send links (or falls back to `CRON_SECRET`) |
| `RESEND_WEBHOOK_SECRET` | — | Resend webhook signing secret (from configure script) |
| `FIRM_OUTREACH_CRON_ENRICH_BATCH` | `60` | Firms per cron enrich tick |
| `FIRM_OUTREACH_ENRICH_BATCH` | `150` | Firms per local/manual enrich run |
| `FIRM_OUTREACH_ENRICH_MAX_MS` | `270000` | Stop enrich before serverless timeout |
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
- `FIRM_OUTREACH_DAILY_CAP=150`

**Approval mode (default):** `FIRM_OUTREACH_REQUIRE_APPROVAL` unset means approval is **required** — you receive daily approval/reminder emails and must click **Ready to send**. Set `FIRM_OUTREACH_REQUIRE_APPROVAL=false` on Vercel for automatic sends at 09:30/14:30/18:30 UTC.

- `FIRM_OUTREACH_REQUIRE_APPROVAL=false` (optional — automatic sends)
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

Updates the admin Send log with delivery/open/click/bounce status. Webhook matching uses `resendMessageId` first, then falls back to the newest in-flight send for that email across **all** campaigns (`whatsapp_invite_v1` and `agent_cover_kent_v1`).

**PSA (`policestationagent.com`):** every send path must persist `resendMessageId` from Resend (`send.resendMessageId = result.messageId`). Without it, agent-cover sends stay stuck at `sent` in KV. RepUK logs a console warning when a send is saved without it.

## Resend sending domains

Outreach uses Resend. Only **verified** domains can send.

| Campaign | Preferred from | Until PSA domain verified |
|----------|----------------|---------------------------|
| `whatsapp_invite_v1` | `FIRM_OUTREACH_FROM_EMAIL` or `PoliceStationRepUK <noreply@policestationrepuk.org>` | — |
| `agent_cover_kent_v1` | `FIRM_OUTREACH_PSA_FROM_EMAIL` or `Police Station Agent <noreply@policestationagent.com>` | **Auto-fallback** to `Police Station Agent <noreply@policestationrepuk.org>` |

**Permanent auto-fix:** before each batch, the send path resolves from-address against Resend verified domains. If `policestationagent.com` is not verified, PSA emails send from the verified RepUK domain automatically (content and links remain PSA). On a Resend domain error, the send retries once with the verified fallback.

**Verify PSA domain (optional):** Resend dashboard → Domains → add `policestationagent.com` (DNS records). Then set on Vercel:

```bash
FIRM_OUTREACH_PSA_FROM_EMAIL=Police Station Agent <noreply@policestationagent.com>
```

**Health check:** `GET /api/cron/firm-outreach-status` (with `CRON_SECRET`) reports `sendHealthy`, `sendBlockers`, and `campaignSendHealth` per campaign.

## Manual commands

```bash
# Check KV queue and timing
npm run firm-outreach:admin-smoke

# Verify repo + production HTTP (set CRON_SECRET for status route)
npm run firm-outreach:verify
npm run firm-outreach:verify -- --url=https://policestationrepuk.org

# Enrich locally (large batch — run 2–3× per week while backlog is large)
npx tsx scripts/firm-outreach-enrich.ts --limit=150

# Reset bad emails / directory websites (both campaigns)
npx tsx scripts/firm-outreach-cleanup-non-firm-emails.ts --dry-run
CAMPAIGN_ID=agent_cover_kent_v1 npx tsx scripts/firm-outreach-cleanup-non-firm-emails.ts --apply

# Import lead_engine ready_to_send.csv into KV (after npm run lead-engine:auto)
npx tsx scripts/firm-outreach-import-lead-engine.ts --dry-run
npx tsx scripts/firm-outreach-import-lead-engine.ts

# PSA agent-cover Kent campaign (policestationagent.com)
npx tsx scripts/firm-outreach-build-brochure-pdf.ts
npx tsx scripts/firm-outreach-seed-agent-cover-kent.ts --apply
npx tsx scripts/firm-outreach-enrich.ts --campaign=agent_cover_kent_v1 --limit=150
CAMPAIGN_ID=agent_cover_kent_v1 npx tsx scripts/firm-outreach-cleanup-non-firm-emails.ts --apply
npx tsx scripts/firm-outreach-send.ts --campaign=agent_cover_kent_v1 --apply --limit=5

# Send approval email locally
npm run firm-outreach:send-approval-email

# Send locally (dry-run by default) — bypasses approval flow
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

## Daily approval email (Ready to send)

When `FIRM_OUTREACH_REQUIRE_APPROVAL=true`:

1. **09:30 UTC** — email to `FIRM_OUTREACH_DIGEST_EMAIL` with a **Ready to send** button and queue summary.
2. You click the button → confirmation page → **Confirm — Ready to send** sends up to `FIRM_OUTREACH_DAILY_CAP` from the ready queue.
3. **Confirmation email** lists sent count and receipts.
4. **17:00 UTC** — reminder if you have not yet reached today's cap.

**Production default (recommended):** `FIRM_OUTREACH_REQUIRE_APPROVAL=false` on Vercel — 09:30, 14:30, and 18:30 UTC crons send automatically (no approval email). Quality gates (LAA/DSCC qualification, dedupe, suppression) still apply.

**Verify on Vercel:** Project → Settings → Environment Variables → Production → confirm `FIRM_OUTREACH_REQUIRE_APPROVAL` matches your intent (auto-send vs click-to-send).

Links are prefetch-safe: the email button only opens a preview; sends happen on POST confirm.

## Lead engine import (RepUK)

Manual import uses production KV via Vercel env pull in CI (no separate GitHub KV secrets required when `VERCEL_TOKEN` is configured).

Post-deploy kick (requalify junk + 2 enrich batches) runs automatically after green CI on `master` via [firm-outreach-kick.yml](.github/workflows/firm-outreach-kick.yml).

Manual import (e.g. from a downloaded artifact):

```bash
bash -c 'set -a; source .env.vercel.production; set +a; \
  npx tsx scripts/firm-outreach-import-lead-engine.ts --file=path/to/ready_to_send.csv'
```

Or use `scripts/firm-outreach-run-prod.mjs` after sourcing production env. Import dedupes against existing sends and skips guessed emails unless `--include-guessed`.

## Legacy daily digest

When approval is disabled, the old digest still runs after auto-send. When approval is enabled, use the confirmation email after each approved batch instead.

## Email discovery pipeline

Enrichment for each firm runs in order:

1. **SRA org register** — SRA number + website (if listed)
2. **Serper search** — Google for firm homepage when SRA has no website (`SERPER_API_KEY`)
3. **Website crawl** — contact / criminal-law pages for public emails
4. **Hunter.io** — domain search when crawl finds nothing (`HUNTER_API_KEY`, daily cap)

Guessed emails (`info@domain` via MX check) are used only when crawl/Hunter fail; lead_engine import skips `guessed` rows unless `--include-guessed`.

## Reliability notes

- Enrichment uses status indexes (`discovered` / `no_email`) and a sliding scan window — LAA firms without email are prioritised each tick.
- Enrichment cursor does not advance on timeout with zero processed firms; otherwise it rotates through the pool window.
- Cron enrich uses batches of **60** (default) with a 270s wall-clock guard to stay within Vercel's 300s function limit.
- **Eight** enrich crons per day (05/06/07/08/10/12/14/18 UTC) plus send-only top-ups at 14:30 and 18:30 UTC.
- Nightly maintain requalify downgrades `ready_to_send` rows with implausible emails or failed MX checks (batch-limited).
- Local ops: `bash -c 'set -a; source .env.vercel.production; set +a; npx tsx scripts/firm-outreach-run-prod.mjs enrich --limit=150'` (dotenv cannot parse `.env.vercel.production`; use bash `source` or inline env).
- Duplicate initial sends to the same email address are blocked across automated and admin paths.
