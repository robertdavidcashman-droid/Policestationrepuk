#!/usr/bin/env bash
# Playwright smoke against a local production build (used in CI).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=8192}"
export LEGACY_REPS_PUBLIC="${LEGACY_REPS_PUBLIC:-1}"

npm run build
npx playwright install chromium

PORT=3000
npx next start -p "$PORT" &
SERVER_PID=$!

cleanup() {
  kill "$SERVER_PID" 2>/dev/null || true
}
trap cleanup EXIT

for i in $(seq 1 30); do
  if curl -sf "http://127.0.0.1:${PORT}/api/health" >/dev/null; then
    break
  fi
  sleep 2
done

PW_BASE_URL="http://127.0.0.1:${PORT}" playwright test --config=playwright.ci.config.ts
