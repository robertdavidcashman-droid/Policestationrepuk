# RepUK Pre-Deploy Stabilization Report

Generated: 2026-07-11  
**Stabilization branch:** local (uncommitted)  
**Production still serves:** `dpl_5ge92vJEEZWP1TxJd3a3vYTTnpFy` / SHA `f1a8f25`  
**Rollback reference:** same deployment above

## Deployment decision

**NOT READY FOR PRODUCTION DEPLOYMENT**

Permanent fixes and gate hardening are implemented locally, but production promotion remains blocked until:

1. **Three consecutive clean `predeploy-gate.sh --repeat-suite 3` runs** pass on Linux CI or a developer machine with Node 22.
2. **Site audit** passes on the stabilization SHA (includes Hertfordshire, `/forum`, analytics, contrast regressions).
3. **Isolated preview validation** — manual `Preview validation` workflow with 10× smoke on a non-production URL.
4. **Explicit human approval** of this report before running `Deploy to Vercel (production)` workflow.

Production deploy and outreach kick workflows are now **manual-only** with SHA + confirmation gates.

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

---

## Exact test results

| Step | Status | Notes |
|------|--------|-------|
| Local `predeploy-gate.sh` (3×) | **NOT RUN** | Node/npm unavailable in agent shell — run on CI/Linux |
| `validate-test-env.ts` | **IMPLEMENTED** | Enforced in CI + predeploy gate |
| Site audit regressions | **IMPLEMENTED** | `tests/audit/stabilization-regressions.spec.ts` |
| Preview validation (10×) | **NOT RUN** | Use `.github/workflows/preview-validation.yml` after local gate |
| Production deploy | **NOT EXECUTED** | Blocked by NOT READY decision |

---

## Promotion procedure (do not execute until READY)

1. Confirm three green `predeploy-gate.sh --repeat-suite 3` runs with artifacts retained.
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
