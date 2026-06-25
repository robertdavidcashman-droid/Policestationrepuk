# Buffer cross-site environment (source of truth: policestationrepuk.org)

All four sites share **one Buffer workspace** (`robertcashman@defencelegalservices.co.uk`, timezone `Europe/London`).

Secrets live in this repo's `.env.local` / Vercel production (`BUFFER_API_KEY`, `CRON_SECRET`). **Channel and org IDs are not secret** — they are listed below and in `lib/buffer/config.ts` / PSA's `schedule-buffer-posts.mjs`.

Run `npm run buffer:smoke` (loads `.env.local`) to verify the API key and list live channels.

## Organization

| Variable | Value |
| --- | --- |
| `BUFFER_ORGANIZATION_ID` | `69d26bdf0f822245c9a723c4` |

## All channels in the workspace (verified 2026-06-25)

| Service | Buffer channel ID | Buffer name | Used by |
| --- | --- | --- | --- |
| linkedin | `69d26c06031bfa423cd0c50d` | police-station-agent | REPUK central, PSA GH Action, psrtrain, custodynote |
| twitter | `69d26c3d031bfa423cd0c6b3` | Policestationag | REPUK central, PSA GH Action, psrtrain |
| googlebusiness | `69d26c8b031bfa423cd0c8b7` | Police Station Agent | REPUK central, PSA GH Action, custodynote |
| facebook | `6a304bd838b55793459b4247` | Criminal Solicitor | PSA GH Action, **custodynote** (recommended) |
| facebook | `6a304bd838b55793459b4248` | Robert Cashman | PSA GH Action, **psrtrain** (recommended) |
| facebook | `6a304bd938b55793459b4254` | Policestationrepuk | PSA GH Action, **REPUK** (when FB enabled) |
| facebook | `6a304bd938b55793459b4255` | Police Station Agent | PSA GH Action only |

REPUK's central scheduler (`lib/buffer/config.ts`) currently wires **only LinkedIn + Twitter + GBP** (no Facebook). PSA's GitHub Action uses **all seven**.

## What is present vs missing (this repo)

| Item | `.env.local` | Vercel production | Notes |
| --- | --- | --- | --- |
| `BUFFER_API_KEY` | ✅ | ✅ | Required |
| `CRON_SECRET` | — | ✅ | Cron auth |
| `BUFFER_ORGANIZATION_ID` | ❌ (code default) | ❌ | Safe to set explicitly |
| `BUFFER_CHANNEL_*_ID` | ❌ (code defaults) | ❌ | Safe to set explicitly |
| `BUFFER_CONTENT_FEEDS` | ❌ | ❌ | **Still schedules all 4 RSS/local feeds** — set when psrtrain + custodynote self-post |

### Required Vercel change (Phase 3 reconciliation)

Once `psrtrain.com` and `custodynote.com` run their own `/api/buffer/schedule` cron, set on **REPUK production**:

```bash
BUFFER_CONTENT_FEEDS=[{"id":"policestationrepuk","type":"local"}]
```

Optional: keep PSA on REPUK central feed only if PSA's GitHub Action is paused:

```bash
BUFFER_CONTENT_FEEDS=[{"id":"policestationrepuk","type":"local"},{"id":"policestationagent","type":"rss","url":"https://www.policestationagent.com/api/feeds/policestationagent"}]
```

## Per-site env blocks (for psrtrain + custodynote Vercel)

Copy `BUFFER_API_KEY` and `CRON_SECRET` from this repo (never commit). Add channel IDs from the table above.

### psrtrain.com

```env
BUFFER_API_KEY=<from REPUK>
BUFFER_ORGANIZATION_ID=69d26bdf0f822245c9a723c4
CRON_SECRET=<from REPUK or site-specific>
BUFFER_CHANNEL_LINKEDIN_ID=69d26c06031bfa423cd0c50d
BUFFER_CHANNEL_TWITTER_ID=69d26c3d031bfa423cd0c6b3
BUFFER_CHANNEL_FACEBOOK_ID=6a304bd838b55793459b4248
BUFFER_DEDUP_WINDOW_DAYS=30
```

Test post (after deploy): `GET /api/buffer/schedule?slug=first-week-psras-revision-plan&dryRun=1` then without `dryRun`.

### custodynote.com

```env
BUFFER_API_KEY=<from REPUK>
BUFFER_ORGANIZATION_ID=69d26bdf0f822245c9a723c4
CRON_SECRET=<from REPUK or site-specific>
BUFFER_CHANNEL_LINKEDIN_ID=69d26c06031bfa423cd0c50d
BUFFER_CHANNEL_FACEBOOK_ID=6a304bd838b55793459b4247
BUFFER_CHANNEL_GOOGLEBUSINESS_ID=69d26c8b031bfa423cd0c8b7
BUFFER_DEDUP_WINDOW_DAYS=30
```

Test post: `GET /api/buffer/schedule?slug=what-makes-a-good-attendance-note&dryRun=1`

## One-command automation (recommended)

From this repo (requires `npx vercel login` and `BUFFER_API_KEY` in `.env.local`):

```bash
npm run buffer:setup-cross-site:dry-run   # preview: local sync + Vercel env + crons
npm run buffer:setup-cross-site           # apply production env on REPUK + psrtrain + custodynote
npm run buffer:setup-cross-site -- --deploy --test-post   # deploy siblings + dry-run API test
npm run buffer:setup-cross-site -- --live-post            # schedule one real post per site (careful)
```

Flags: `--skip-local`, `--skip-vercel`, `--skip-crons`, `--dry-run`, `--deploy`, `--test-post`, `--live-post`.

What it does:

1. Writes Buffer env blocks to `../pstrain-rebuild/.env.local` and `../custody-note-website/.env.local`
2. Pushes Buffer vars to Vercel **production** on `policestationrepuk-new`, `pstrain-rebuild`, `custody-note-website`
3. Sets REPUK `BUFFER_CONTENT_FEEDS=[{"id":"policestationrepuk","type":"local"}]` (stops double-posting)
4. Adds `/api/buffer/schedule` crons to psrtrain (`15 6 * * *`) and custodynote (`25 6 * * *`) `vercel.json`
5. Optional `--test-post`: `GET …/api/buffer/schedule?slug=…&dryRun=1` against production

## Sync script (local dev only)

```bash
npm run buffer:sync-env
npm run buffer:sync-env:check
```

## Verify

```bash
npm run buffer:smoke          # this repo
cd ../pstrain-rebuild && npx tsx --test tests/unit/buffer-port.test.ts
cd ../custody-note-website && npx tsx --test tests/buffer-port.test.ts
```
