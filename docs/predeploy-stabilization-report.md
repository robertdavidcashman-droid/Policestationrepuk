# RepUK Pre-Deploy Stabilization Report

Generated after stabilization implementation. Update test counts after CI run completes.

## Deployment decision

**NOT READY FOR PRODUCTION DEPLOYMENT** until CI green on target SHA and preview smoke passes 10x.

## Failures found and fixed

| # | Symptom | Root cause | Fix | Regression test |
|---|---------|------------|-----|-----------------|
| 1 | CI failed (6 tests) | Partial mocks missing new exports after reliability changes | Updated mocks in 5 test files | Existing + reliability CI |
| 2 | Custody index lost ids under concurrency | `appendUniqueToIndex` was RMW not atomic | `addToIndexSet` via Redis `SADD` | `custody-storage-concurrency.test.ts` |
| 3 | Prod deploy without CI | `vercel-deploy-hook` triggered on push in parallel | `workflow_run` after CI success only | Workflow change |
| 4 | `/api/health` 404 on prod | Reliability commit not deployed; deploy ungated | Gate deploy; post-deploy requires 200 | `health-ready.test.ts` + deploy smoke |
| 5 | Automation overlap duplicates | No scheduler/digest claim in tests | Lock helpers + `cron-overlap.test.ts` | `cron-overlap.test.ts`, scheduler integration |

## Test gate (fill from CI run)

| Step | Result |
|------|--------|
| `npx tsc --noEmit` | Pending CI |
| `npm run lint` | Pending CI |
| `npm test` | Pending CI |
| `npm run test:reliability:ci` | Pending CI |
| `npm run test:automation:repeat` (20x) | Pending CI |
| `npm run test:firm-outreach:ci` | Pending CI |
| `npm run test:buffer:ci` | Pending CI |
| `npm run test:custody-discovery:ci` | Pending CI |
| `npm run build` | Pending CI |
| `npm run test:ci:smoke` (Playwright) | Pending CI |

## Deployment and rollback plan

- **Target SHA:** (fill after push)
- **Rollback:** Vercel instant rollback to pre-reliability deployment (`a249018`) or prior green deployment
- **Env vars:** See `docs/production-reliability.md`
- **Post-deploy checks:** `/api/health` 200, `/api/ready` 200, cron auth 401 without secret
- **Preview first:** `vercel deploy` (no `--prod`) then 10x smoke before prod promotion

## Commands

```bash
bash scripts/predeploy-gate.sh --repeat-suite 3
npx tsx scripts/validate-env.ts
```
