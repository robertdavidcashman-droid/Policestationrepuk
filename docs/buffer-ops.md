# Buffer operations runbook

Daily social scheduling for blog content across Twitter, LinkedIn, and Google Business Profile (GBP).

## Cron jobs (Vercel)

| Schedule (UTC) | Route | Purpose |
|----------------|-------|---------|
| `5 5 * * *` | `/api/cron/buffer-blog-posts` | Schedule today's posts from all feeds |
| `30 4 * * *` | `/api/cron/buffer-daily-report` | Daily email: verify yesterday's posts all sent |
| `0 6 * * 1` | `/api/cron/buffer-health` | Weekly GBP scheduled-image verification |

Auth: `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret` locally).

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `BUFFER_API_KEY` | Yes | Buffer API token |
| `BUFFER_ORGANIZATION_ID` | Yes | Buffer org ID |
| `CRON_SECRET` | Yes (cron) | Vercel cron auth |
| `RESEND_API_KEY` | Optional | Failure/skip/health emails |
| `BUFFER_SCHEDULER_NOTIFY_EMAIL` | Optional | Override notify address (daily report + failures) |
| `BUFFER_CONTENT_FEEDS` | Optional | JSON override for feed URLs |
| `BUFFER_SCHEDULER_POSTS_PER_FEED` | Optional | Posts per feed per day (default 5, **minimum 4**, max 15) |
| `BUFFER_VERIFY_GBP_ONLY` | Optional | Set `1` for GBP-only verify scripts |

## NPM scripts

```bash
npm run buffer:schedule              # Run scheduler once (manual)
npm run buffer:list-today              # List today's scheduled posts
npm run buffer:verify-feeds            # Live RSS + image ratio check
npm run buffer:verify-posted           # Verify yesterday's run all reached sent
npm run buffer:verify-scheduled-images # All channels (GBP issues fatal)
npm run buffer:verify-scheduled-gbp    # GBP channel only
npm run buffer:repair-gbp              # Fix bad GBP posts in queue
npm run buffer:replace-today           # Delete + reschedule today
npm run buffer:smoke                    # Verify API key + list live channels (loads .env.local)
node scripts/sync-buffer-env-to-sibling-sites.mjs   # Push Buffer env to psrtrain + custodynote .env.local
```

## Daily publish report email

At **04:30 UTC** the cron verifies **yesterday's** scheduler run (Europe/London), including night slots that publish after midnight UTC. You receive:

- **Success:** `[Buffer daily] All posts sent — YYYY-MM-DD`
- **Failure:** `[Buffer daily] Posts not all sent — YYYY-MM-DD`

One email per verify date (KV dedup). Manual re-run:

```bash
npm run buffer:verify-posted
curl -H "Authorization: Bearer $CRON_SECRET" \
  "https://policestationrepuk.org/api/cron/buffer-daily-report?date=2026-06-12&force=1"
```

Requires `RESEND_API_KEY` and `BUFFER_API_KEY`. Recipient: `BUFFER_SCHEDULER_NOTIFY_EMAIL` or your default admin email.

## Common failures

### GBP image rejected (WebP / opengraph)

GBP requires self-hosted JPEG/PNG on `policestationrepuk.org`. Preflight runs before scheduling.

1. `npm run buffer:verify-scheduled-gbp`
2. `npm run buffer:repair-gbp`
3. Confirm defaults exist: `/images/buffer/gbp/{feedId}-default.jpg`

### policestationagent RSS 403

External feed may block datacenter IPs. The site proxies RSS at:

`/api/feeds/policestationagent`

`lib/buffer/rss-fetch.ts` retries alternates and falls back to this proxy automatically.

### Cron skipped (already scheduled)

Informational email only. To re-run: `GET /api/cron/buffer-blog-posts?force=1` or `npm run buffer:replace-today`.

### Cooldown exhaustion (small RSS pools)

Feeds with few items (e.g. `psrtrain` guides) can exhaust cooldown if `postsPerDay` is too high relative to pool size.

- **Symptom:** `Feed "psrtrain" has no posts available after cooldown exclusions` (older scheduler) or warning `skipping` with other feeds still scheduled (current).
- **Math:** effective cooldown per feed = `min(BUFFER_SCHEDULER_COOLDOWN_DAYS, floor(poolSize / postsPerFeed))`.
- **Minimum:** every feed schedules at least **4 posts/day** (`MIN_SCHEDULER_POSTS_PER_FEED` in `lib/buffer/config.ts`); env values below 4 are clamped up.
- **psrtrain default:** 4 posts/day (2 day + 2 night) — tune in `lib/buffer/feeds.ts`.
- **Recovery:** `npm run buffer:replace-today` clears today’s queue and prunes related cooldown KV entries, then re-runs the scheduler.
- **Long-term:** grow the sister-site RSS pool (new guides on psrtrain.com with JPEG heroes in RSS enclosures).

### Partial feed outage

If one RSS feed fails, the scheduler continues with feeds that loaded successfully. Check logs for `Skipping feeds with no posts`.

## Feed defaults

| Feed ID | RSS URL | GBP fallback |
|---------|---------|--------------|
| `policestationrepuk` | (local blog registry) | `social-preview.jpg` |
| `custodynote` | custodynote.com/feed | `custodynote-default.jpg` |
| `policestationagent` | policestationagent.com/feed.xml (+ proxy) | `policestationagent-default.jpg` |
| `psrtrain` | psrtrain.com/feed | `psrtrain-default.jpg` |

## Deploy checklist

1. `npm run test:buffer:ci` passes
2. GBP JPEGs committed under `public/images/buffer/gbp/`
3. `CRON_SECRET` set in Vercel production
4. After deploy: `npm run buffer:verify-scheduled-gbp`
