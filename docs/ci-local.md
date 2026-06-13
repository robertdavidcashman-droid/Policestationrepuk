# Local CI verification

Reproduce GitHub Actions **CI — Next.js build** before pushing to `master`.

## Quick check (day-to-day)

```bash
npm run build && npm test
```

## Full CI mirror

Same steps as [`.github/workflows/ci.yml`](../.github/workflows/ci.yml):

```bash
npm run test:ci
```

Includes build, vitest, **firm outreach approval tests** (`test:firm-outreach:ci`), buffer tests (including daily report), Lighthouse, blog audits, UTM guards, schema validation, and live sitemap crawl sample.

## Targeted autotest suites

```bash
npm run test:firm-outreach:ci   # approval token, emails, cron routes, send flow
npm run test:buffer:ci          # scheduler + daily digest + GBP probe
```

## Autofix + verify

Runs `eslint --fix`, then the full CI mirror (one retry by default):

```bash
npm run ci:fix
npm run ci:fix -- --retry 3
```

Autofix only handles ESLint auto-fixable issues. TypeScript errors, test assertion mismatches, and audit content failures still need manual or agent fixes, then re-run.

## Site audit (separate workflow)

Playwright site audit (~25 min) is not included in `test:ci`:

```bash
npm run audit:site
```

## Environment

Scripts set `LEGACY_REPS_PUBLIC=1` and `NODE_OPTIONS=--max-old-space-size=8192` to match CI.
