# RepUK Pre-Deploy Stabilization Report

Generated: 2026-07-11  
**Target SHA:** `f89e3a2` (CI green)  
**Rollback reference:** `a249018` (last known stable pre-reliability production)

## Deployment decision

**NOT READY FOR PRODUCTION DEPLOYMENT**

CI and all local test gates pass on `f89e3a2`, but production promotion is blocked:

1. **Vercel deployments are `BLOCKED`** — builds for `f89e3a2`, `a6c3d10`, `106bd56`, and `29c4fde` all show state `BLOCKED` (not promoted to production). Likely Deployment Protection requiring manual approval in the Vercel dashboard.
2. **Production still serves pre-reliability code** — `/api/health` and `/api/ready` return **404** on `https://policestationrepuk.org` (RSC catch-all; reliability routes not live).
3. **GitHub deploy workflow** (`29144958758`) remains **in progress** on `vercel deploy --prod`, likely waiting on the blocked Vercel deployment.
4. **10× production smoke** (run 2026-07-11): `/`, `/directory`, `/Register` → **200**; `/api/health`, `/api/ready` → **404** (20 failures across 10 runs).

**Unblock path:** Approve/promote deployment `dpl_BVy2LryfcPuVTbQTJDe1NevZ89FE` (SHA `f89e3a2`) in Vercel → confirm post-deploy smoke → re-run `bash scripts/preview-smoke.sh https://policestationrepuk.org 10`.

---

## Failures found and fixed

| # | Symptom | Root cause | Fix | Regression test |
|---|---------|------------|-----|-----------------|
| 1 | CI failed (6 tests) | Partial mocks missing new exports after reliability changes | Updated mocks in 5 test files | Existing + reliability CI |
| 2 | Custody index lost ids under concurrency | `appendUniqueToIndex` was RMW not atomic | `addToIndexSet` via Redis `SADD` | `custody-storage-concurrency.test.ts` |
| 3 | Prod deploy without CI | `vercel-deploy-hook` triggered on push in parallel | `workflow_run` after CI success only | Workflow change |
| 4 | `/api/health` 404 on prod | Reliability commit not deployed; deploy ungated | Gate deploy; post-deploy requires 200 | `health-ready.test.ts` + deploy smoke |
| 5 | Automation overlap duplicates | No scheduler/digest claim in tests | Lock helpers + `cron-overlap.test.ts` | `cron-overlap.test.ts`, scheduler integration |
| 6 | CI tsc failure on `smembers` | Upstash generic typing | Remove `<string>` generic; map to String | CI tsc step |
| 7 | Lighthouse/Playwright 500 in CI | `validateEnv()` fail-fast without `CRON_SECRET` in `npm run start` | `CRON_SECRET` placeholder in CI + smoke scripts | Lighthouse + Playwright CI steps |

---

## Exact test results (CI run `29144429579`, SHA `f89e3a2`)

| Step | Result | Counts |
|------|--------|--------|
| `npx tsc --noEmit` | **PASS** | — |
| `npm run lint` | **PASS** | — |
| `npm run build` | **PASS** | — |
| `npm test` (Vitest) | **PASS** | **168** files, **1068** tests passed, **0** failed, **0** skipped |
| `npm run test:reliability:ci` | **PASS** | **9** files, **16** tests passed |
| `npm run test:automation:repeat` (20×) | **PASS** | **7** files × 20 runs = **140** test-file passes |
| `npm run test:firm-outreach:ci` | **PASS** | **26** files, **176** tests passed |
| `npm run test:buffer:ci` | **PASS** | **37** files total (8 + 29 across steps) |
| `npm run test:custody-discovery:ci` | **PASS** | **7** files, **52** tests passed |
| Lighthouse CI | **PASS** | 10 tier-1 URLs (warn-only score thresholds) |
| Blog/SEO audits | **PASS** | All audit steps green |
| `npm run test:ci:smoke` (Playwright) | **PASS** | **5** tests passed |
| Live sitemap crawl | **PASS** | Sample crawl within threshold |
| **CI overall** | **PASS** | [Run 29144429579](https://github.com/robertdavidcashman-droid/Policestationrepuk/actions/runs/29144429579) |

### Pre-deploy gate script

`scripts/predeploy-gate.sh` mirrors CI gate steps (tsc, lint, unit, reliability, outreach, buffer, custody, build, Playwright, 20× repeat). Supports `--repeat-suite 3` for 3 consecutive full runs.

```bash
bash scripts/predeploy-gate.sh --repeat-suite 3
npx tsx scripts/validate-env.ts
```

### Preview smoke

```bash
bash scripts/preview-smoke.sh https://<preview-or-prod-url> 10
# Windows:
powershell -File scripts/preview-smoke.ps1 -BaseUrl https://policestationrepuk.org -Runs 10
```

---

## Deployment and rollback plan

- **Target SHA:** `f89e3a2` (ready to promote once Vercel BLOCKED cleared)
- **Rollback:** Vercel instant rollback to `a249018` or last `READY` deployment `dpl_5ge92vJEEZWP1TxJd3a3vYTTnpFy` (SHA `f1a8f25`)
- **Env vars:** See `docs/production-reliability.md` — ensure `CRON_SECRET` is set in Vercel production
- **Post-deploy checks:**
  ```bash
  curl -sS https://policestationrepuk.org/api/health
  curl -sS https://policestationrepuk.org/api/ready
  curl -sS -o /dev/null -w "%{http_code}" https://policestationrepuk.org/api/cron/firm-outreach-bootstrap  # expect 401
  bash scripts/preview-smoke.sh https://policestationrepuk.org 10
  ```
- **Deploy trigger:** CI success → `vercel-deploy-hook.yml` workflow_run → `vercel deploy --prod`

---

## Commits in stabilization chain

| SHA | Summary |
|-----|---------|
| `a6c3d10` | Pre-deploy gate: CI mocks, atomic SADD, gated prod deploy |
| `649a1b8` | Fix `smembers` typing for tsc |
| `f89e3a2` | Fix CI prod smoke: `CRON_SECRET` for Lighthouse/Playwright |
