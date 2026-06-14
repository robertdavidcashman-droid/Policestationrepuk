# Buffer manual upload instructions

Automated scheduling is configured in this repo (`docs/buffer-ops.md`) when these env vars are set:

- `BUFFER_API_KEY`
- `BUFFER_ORGANIZATION_ID`
- `BUFFER_CHANNEL_TWITTER_ID`, `BUFFER_CHANNEL_LINKIN_ID`, `BUFFER_CHANNEL_GOOGLEBUSINESS_ID` (optional overrides)

## If API is not configured

1. Open `seo-growth/buffer/buffer-posts.csv` in Excel or Google Sheets.
2. Filter by `site` for the brand you are promoting.
3. For each row:
   - Create post in [Buffer](https://buffer.com) for the matching channel.
   - Paste `post_text` and add `link` as the URL.
   - Schedule at `suggested_date` + `suggested_time` (UK time).
4. Set `status` to `scheduled` in your copy of the CSV for tracking.

## policestationrepuk.org new posts

After deploy, run locally:

```bash
npm run buffer:schedule
```

Or wait for Vercel cron `/api/cron/buffer-blog-posts` (05:05 UTC daily).

## External sites

Posts will **not** auto-schedule until articles are live and RSS feeds update. After CMS publish:

1. Verify feed URL (e.g. `https://psrtrain.com/feed`).
2. Run `npm run buffer:verify-feeds`.
3. Run `npm run buffer:schedule`.

## Facebook

Not in default Buffer channel config — add posts manually from CSV rows marked `Facebook`.

## Make / Zapier

Import `buffer-posts.json` — map fields to Buffer’s “Create post” action; use `suggested_date` as trigger.
