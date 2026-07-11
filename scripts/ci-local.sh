#!/usr/bin/env bash
# Mirror .github/workflows/ci.yml locally (fail-fast).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
export LEGACY_REPS_PUBLIC="${LEGACY_REPS_PUBLIC:-1}"
export CRON_SECRET="${CRON_SECRET:-ci-smoke-placeholder-not-for-production}"

run_step() {
  echo ""
  echo "==> $1"
  shift
  "$@"
}

run_step "npm run lint" npm run lint
run_step "npx tsc --noEmit" npx tsc --noEmit
run_step "npm run build" npm run build
run_step "Vitest unit tests" npm test
run_step "Reliability gate tests" npm run test:reliability:ci
run_step "Repeat critical automation (20x)" npm run test:automation:repeat
run_step "Firm outreach approval tests" npm run test:firm-outreach:ci
run_step "Buffer scheduler + GBP probe" npm run test:buffer:ci
run_step "Custody discovery tests" npm run test:custody-discovery:ci
run_step "Directory search self-test" npm run test:directory-search
run_step "Lighthouse CI" npx lhci autorun
run_step "Blog SEO audit" npm run audit:blog-seo
run_step "Blog orphan links" npm run audit:blog-orphans
run_step "Cross-domain partner links" npm run audit:cross-domain-links
run_step "Partner UTM guard" node scripts/audit/partner-utm-guard.mjs
run_step "Blog partner UTM guard" node scripts/audit/blog-partner-utm.mjs
run_step "Blog JSON-LD validation" npm run validate:schema
run_step "Playwright smoke" npm run test:ci:smoke

export CRAWL_MAX_URLS="${CRAWL_MAX_URLS:-800}"
export CRAWL_CONCURRENCY="${CRAWL_CONCURRENCY:-10}"
export CRAWL_FAIL_THRESHOLD="${CRAWL_FAIL_THRESHOLD:-25}"
run_step "Live sitemap crawl (sample)" node scripts/audit/sitemap-crawl.mjs

echo ""
echo "ci-local: all steps passed"
