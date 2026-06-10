# Buffer operations runbook

Daily social scheduling for blog content across Twitter, LinkedIn, and Google Business Profile (GBP).

## Cron jobs (Vercel)

| Schedule (UTC) | Route | Purpose |
|----------------|-------|---------|
| `5 5 * * *` | `/api/cron/buffer-blog-posts` | Schedule today's posts from all feeds |
| `0 6 * * 1` | `/api/cron/buffer-health` | Weekly GBP scheduled-image verification |

Auth: `Authorization: Bearer $CRON_SECRET` (or `x-cron-secret` locally).

## Environment variables

| Variable | Required | Notes |
|----------|----------|-------|
| `BUFFER_API_KEY` | Yes | Buffer API token |
| `BUFFER_ORGANIZATION_ID` | Yes | Buffer org ID |
| `CRON_SECRET` | Yes (cron) | Vercel cron auth |
| `RESEND_API_KEY` | Optional | Failure/skip/health emails |
| `BUFFER_SCHEDULER_NOTIFY_EMAIL` | Optional | Override notify address |
| `BUFFER_CONTENT_FEEDS` | Optional | JSON override for feed URLs |
| `BUFFER_VERIFY_GBP_ONLY` | Optional | Set `1` for GBP-only verify scripts |

## NPM scripts

```bash
npm run buffer:schedule              # Run scheduler once (manual)
npm run buffer:list-today              # List today's scheduled posts
npm run buffer:verify-feeds            # Live RSS + image ratio check
npm run buffer:verify-scheduled-images # All channels (GBP issues fatal)
npm run buffer:verify-scheduled-gbp    # GBP channel only
npm run buffer:repair-gbp              # Fix bad GBP posts in queue
npm run buffer:replace-today           # Delete + reschedule today
npm run test:buffer                    # CI suite + verify-feeds
```

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
