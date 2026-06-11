# PoliceStationRepUK Lead Engine

Compliant B2B lead discovery and outreach pipeline for criminal defence solicitors' firms in England and Wales.

**Default behaviour:** `dry_run: true` — no live emails are sent until you explicitly set `dry_run: false` in `config/config.yaml`.

## Setup

```bash
cd lead_engine
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp config/config.example.yaml config/config.yaml
```

Optional environment variables:

| Variable | Purpose |
|----------|---------|
| `SERPER_API_KEY` | Search discovery (Google via Serper) |
| `HUNTER_API_KEY` | Paid domain/contact enrichment |
| `RESEND_API_KEY` | Live email sending |
| `LEAD_ENGINE_DRY_RUN=false` | Override dry-run (still requires config review) |

Bootstrap discovery uses:

- `../data/laa-crime-providers.json` — LAA crime provider firm names (no emails/websites in source)
- `../data/archive/law-firms.json` — verified criminal-law firms with real websites and emails from the main repo archive

## Automatic mode (recommended)

One command runs the entire pipeline — discover, website resolution, crawl, contacts, classify, enrich, verify, export, campaign, and report:

```bash
# From repo root:
npm run lead-engine:auto

# Or from lead_engine/:
python -m src.main auto
```

Logs: `data/logs/automation-latest.json`

**Scheduled runs:**
- GitHub Actions: `.github/workflows/lead-engine.yml` (daily 04:00 UTC + weekdays 09:30 UTC)
- Local daemon: `python -m src.scheduler` (daily 03:00 + Monday 09:00)

Optional GitHub secrets: `SERPER_API_KEY`, `HUNTER_API_KEY`, `RESEND_API_KEY`. Set repo variable `LEAD_ENGINE_DRY_RUN=false` only when you are ready for live sends.

## Manual commands

Run from the `lead_engine` directory:

```bash
python -m src.main discover
python -m src.main crawl --limit 50
python -m src.main contacts --limit 50
python -m src.main classify
python -m src.main classify-contacts
python -m src.main enrich --limit 30
python -m src.main verify
python -m src.main export
python -m src.main campaign --dry-run
python -m src.main report
python -m src.main run-all
```

Suppress an address:

```bash
python -m src.main suppress --email someone@firm.co.uk --reason unsubscribe
```

## CSV exports

Written to `data/exports/`:

- `ready_to_send.csv`
- `manual_review.csv`
- `paid_source_candidates.csv`
- `excluded.csv`
- `campaign_dry_run.csv`

## Paid providers

Edit `config/config.yaml`:

```yaml
paid_providers:
  hunter:
    enabled: true
    api_key: "your-key"
```

Or set `HUNTER_API_KEY`. Paid results are stored with `source_type: paid_provider` and appear in `paid_source_candidates.csv`. Guessed/low-confidence paid emails stay in `manual_review` unless verified and manually approved.

## Enable live sending (later)

1. Review `data/exports/ready_to_send.csv` and `campaign_dry_run.csv`.
2. Set `sender_email` / `mail.from_email` and `RESEND_API_KEY`.
3. Set `dry_run: false` in `config/config.yaml`.
4. Run `python -m src.main campaign --live` (respects `daily_send_cap`, default 20).

## Tests

```bash
cd lead_engine
PYTHONPATH=. pytest tests/ -q
```

## Compliance

- No fabricated firms, contacts, or email addresses.
- Guessed/inferred emails are never `ready_to_send` by default.
- Personal solicitor **work** emails are allowed when publicly found or paid-verified with criminal relevance.
- Every `ready_to_send` email must have a `source_url` or `source_provider`.
- Suppression list is permanent; use `suppress` CLI or DB for opt-outs.

## Scheduler (local always-on)

```bash
python -m src.scheduler
```

Runs `auto` daily at 03:00 and Monday 09:00 (local server time).

## macOS cron (optional)

```cron
0 4 * * * cd /path/to/Policestationrepuk && ./scripts/run-lead-engine-auto.sh >> lead_engine/data/logs/cron.log 2>&1
```

## Limitations (v1)

- Law Society / SRA live API adapters are not implemented; LAA JSON bootstrap + optional Serper search + website crawl are the primary free sources.
- Website crawl is rate-limited (default 3s delay, max 30 pages/domain).
- MX verification only unless ZeroBounce/NeverBounce keys are added (stubs included).
- No web dashboard; use `report` command and CSV exports.
