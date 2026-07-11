# RepUK Pre-Deploy Stabilization Report

Generated: 2026-07-11  
**Stabilization branch:** `master` @ `1e93a16` (pushed to origin)  
**Production still serves:** `dpl_5ge92vJEEZWP1TxJd3a3vYTTnpFy` / SHA `f1a8f25`  
**Rollback reference:** same deployment above

## Deployment decision

**NOT READY FOR PRODUCTION DEPLOYMENT**

Permanent fixes and gate hardening are merged on `master`, but production promotion remains blocked until:

1. **Three consecutive clean `predeploy-gate.sh --repeat-suite 3` runs** pass on Linux CI or a developer machine with Node 22 (local Windows gate blocked by `node_modules` install instability — see gate results below).
2. **Site audit** passes on the stabilization SHA — **156/156 locally** and **green on GitHub CI** for `1e93a16`.
3. **Isolated preview validation** — manual `Preview validation` workflow with 10× smoke on a non-production URL.
4. **Explicit human approval** of this report before running `Deploy to Vercel (production)` workflow.

Production deploy and outreach kick workflows remain **manual-only** with SHA + confirmation gates.

---

## Commits pushed (2026-07-11)

| SHA | Summary |
|-----|---------|
| `bb78b2c` | Harden pre-deploy stabilization: crons, gates, and regression tests |
| `b36330d` | Fix custody-discovery CI script for Windows vitest globbing |
| `0219380` | Use npx playwright in CI smoke script for Windows PATH compatibility |
| `0adc484` | Fix local audit: isolate KV/VERCEL env and tighten analytics gate |
| `7ab1b21` | Fix audit webServer startup when KV env vars are stripped |
| `6c1bc8e` | Fix remaining audit regressions and harden outreach verify checks |
| `1e93a16` | Fix predeploy gate clean step on Windows |

---

## Failures found and fixed (this stabilization pass)

| # | Symptom | Root cause | Fix | Regression test |
|---|---------|------------|-----|-----------------|
| 1 | Auto prod deploy on CI alone | `workflow_run` on CI only; Site Audit not required | Manual `workflow_dispatch` + CI + Site audit check-runs gate | `.github/workflows/vercel-deploy-hook.yml` |
| 2 | `incorrect_git_source_info` | Hardcoded `REPUK_REPO_ID` | Use `github.repository_id` | Deploy workflow |
| 3 | Auto outreach kick on CI | `firm-outreach-kick` `workflow_run` | Manual-only with `KICK` confirmation | `firm-outreach-kick.yml` |
| 4 | `/directory/hertfordshire` 404 | County missing from regenerated data + bad legacy redirect | `counties.json`, `normalize-data.mjs`, legacy redirect | `stabilization-regressions.spec.ts` |
| 5 | Buffer self-test GraphQL 500 | Offset-less `T00:00:00` day bounds | RFC3339 offsets in `selftest.ts` | `packages/buffer-engine/src/selftest.test.ts` |
| 6 | Outreach cron 300s timeout | O(N) prospect scans; batch cap = daily cap | Status-index lookups; `min(batch, dailyRemaining)` | `firm-outreach-daily-cap.test.ts` |
| 7 | Outreach overlap / duplicate sends | No run/send claims | `run-lock.ts`, `claimProspectSend` | `cron-overlap.test.ts` (existing) + pipeline locks |
| 8 | Custody cron timeout | Monolithic route + cursor advanced before work | Crawl-only default route; peek/commit cursor; deadline | `custody-cursor-completion.test.ts` |
| 9 | Registration TOCTOU | Non-atomic email uniqueness | `kv.set(nx:true)` + fail-closed 503 | register route + `saveRegistration` |
| 10 | Contact rate limits per-instance | `contactRateLimitOk` in-memory | KV `rateLimitOk` on contact/station/lead routes | reliability CI |
| 11 | Gate token double-consume | RMW without claim | `claimKey` before consume | `rep-verification.ts` |
| 12 | Preview email safety | No allowlist | `lib/email-allowlist.ts` | `email-allowlist.test.ts` |
| 13 | Incomplete predeploy gate | Missing clean install, audit, env guard | Expanded `predeploy-gate.sh` + `validate-test-env.ts` | `validate-test-env.test.ts` |
| 14 | Site audit contrast / analytics / Facebook | HelpChatButton gold-on-gold; Vercel analytics in audit; Facebook login redirect | Navy/white button; client-only analytics; `checkFacebookGroupUrl` redirect guard | `tests/audit/*`, `community-health.test.ts` |
| 15 | Outreach verify send health | Missing operator-notify from + send-health checks | `runSendHealthChecks`, `operatorNotifyFromAddress` | `firm-outreach-verify-checks.test.ts` |
| 16 | Windows gate clean failure | Git Bash `rm -rf node_modules` fails on Windows | `cmd rmdir` fallback in `predeploy-gate.sh` | Manual gate re-run pending |

---

## Gate commands

```bash
# Mandatory local gate (3 consecutive full runs)
bash scripts/predeploy-gate.sh --repeat-suite 3

# Automation env (production ops — not for local gate)
npx tsx scripts/validate-env.ts

# Preview smoke (after local gate green — isolated preview URL only)
bash scripts/preview-smoke.sh https://<preview-url> 10
```

On Windows use Git Bash: `"C:\Program Files\Git\bin\bash.exe" scripts/predeploy-gate.sh --repeat-suite 3`

---

## Exact test results

| Step | Status | Notes |
|------|--------|-------|
| Local site audit | **PASS 156/156** | `reports/site-audit.md` @ `2026-07-11T20:00:39Z`, base `http://127.0.0.1:3100` |
| Local `predeploy-gate.sh` (3×) | **FAIL 0/3** | Suite 1/3 failed at `clean artifacts` — Windows `rm -rf node_modules` / `npm ci` TAR errors after partial delete; retry after `1e93a16` clean fix blocked by same install instability |
| Local `repeat-vitest.mjs` (20×) | **NOT RUN locally** | Broken `node_modules` after failed local clean/install |
| GitHub CI — Next.js build (`1e93a16`) | **PASS** | [Run 29167488595](https://github.com/robertdavidcashman-droid/Policestationrepuk/actions/runs/29167488595) — includes tsc, lint, build, unit, reliability, **repeat critical 20×**, firm outreach, buffer, custody, Playwright smoke |
| GitHub Site audit (`1e93a16`) | **PASS** | [Run 29167488638](https://github.com/robertdavidcashman-droid/Policestationrepuk/actions/runs/29167488638) |
| GitHub CI — Next.js build (`6c1bc8e`) | **PASS** | [Run 29166425849](https://github.com/robertdavidcashman-droid/Policestationrepuk/actions/runs/29166425849) |
| GitHub Site audit (`6c1bc8e`) | **PASS** | [Run 29166425848](https://github.com/robertdavidcashman-droid/Policestationrepuk/actions/runs/29166425848) |
| `validate-test-env.ts` | **PASS on CI** | Enforced in CI + predeploy gate |
| Preview validation (10×) | **NOT RUN** | Use `.github/workflows/preview-validation.yml` after 3× local/Linux gate |
| Production deploy | **NOT EXECUTED** | Blocked by NOT READY decision |

### Gate pass/fail summary

| Gate | Passed | Failed | Total |
|------|--------|--------|-------|
| Local 3× full suite | 0 | 1 (aborted) | 3 required |
| GitHub CI full pipeline (latest SHA) | 1 | 0 | 1 |
| GitHub repeat critical 20× (CI step 11) | 20 | 0 | 20 |
| Local site audit cases | 156 | 0 | 156 |

---

## What still blocks production deploy

1. **Three consecutive local/Linux `predeploy-gate.sh --repeat-suite 3` runs** — not yet achieved (0/3 local; CI covers one equivalent pass but not the mandated 3× consecutive full gate).
2. **Preview validation workflow** — 10× smoke on isolated preview URL not executed.
3. **Human approval** — this report still reads **NOT READY**; explicit sign-off required.
4. **No production deploy executed** — per stabilization policy.

---

## Promotion procedure (do not execute until READY)

1. Confirm three green `predeploy-gate.sh --repeat-suite 3` runs with artifacts retained (Linux/WSL or CI runner recommended).
2. Run `Preview validation` workflow against isolated preview URL (10×).
3. Approve this report (`READY FOR PRODUCTION DEPLOYMENT`).
4. Run `Deploy to Vercel (production)` with exact SHA + `PRODUCTION` confirmation.
5. Post-deploy: `bash scripts/preview-smoke.sh https://policestationrepuk.org 10`
6. Rollback if needed: Vercel instant rollback to `dpl_5ge92vJEEZWP1TxJd3a3vYTTnpFy` (`f1a8f25`).

---

## Environment checklist (preview / production)

- [ ] Dedicated preview Supabase project (not production credentials)
- [ ] Dedicated preview KV/Upstash database
- [ ] `FIRM_OUTREACH_DRY_RUN=1` in preview unless doing allowlisted email test
- [ ] `CRON_SECRET`, `RESEND_API_KEY`, Buffer, Serper, KV present per `.env.example`
- [ ] `PREVIEW_EMAIL_ALLOWLIST` enforced on preview (`robertdavidcashman@gmail.com` only)
