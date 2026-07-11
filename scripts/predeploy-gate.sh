#!/usr/bin/env bash
# Mandatory pre-deployment test gate — do not deploy until this passes.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

REPEAT_SUITE="${1:-}"
SUITE_RUNS=1
if [ "${REPEAT_SUITE:-}" = "--repeat-suite" ]; then
  SUITE_RUNS="${2:-3}"
fi

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
export LEGACY_REPS_PUBLIC="${LEGACY_REPS_PUBLIC:-1}"
export FIRM_OUTREACH_DRY_RUN="${FIRM_OUTREACH_DRY_RUN:-1}"

run_step() {
  echo ""
  echo "==> $1"
  shift
  "$@"
}

echo "predeploy-gate: starting (suite_runs=${SUITE_RUNS})"

for suite in $(seq 1 "$SUITE_RUNS"); do
  if [ "$SUITE_RUNS" -gt 1 ]; then
    echo ""
    echo "========== full suite run ${suite}/${SUITE_RUNS} =========="
  fi

  if [ "$suite" -eq 1 ]; then
    run_step "clean install" npm install --no-audit --no-fund --prefer-offline
  fi

  run_step "TypeScript" npx tsc --noEmit
  run_step "lint" npm run lint
  run_step "unit tests" npm test
  run_step "reliability gate" npm run test:reliability:ci
  run_step "firm outreach CI" npm run test:firm-outreach:ci
  run_step "buffer CI" npm run test:buffer:ci
  run_step "custody discovery CI" npm run test:custody-discovery:ci
  run_step "production build" npm run build
  run_step "Playwright smoke (prod mode)" bash scripts/ci-smoke-playwright.sh
  run_step "repeat critical tests (20x)" node scripts/repeat-vitest.mjs --times 20
done

echo ""
echo "predeploy-gate: ALL PASSED (${SUITE_RUNS} suite run(s))"
