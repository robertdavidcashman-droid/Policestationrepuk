#!/usr/bin/env bash
# Preview (or any) deployment smoke — run critical paths N times (default 10).
set -euo pipefail

BASE_URL="${1:-}"
RUNS="${2:-10}"

if [ -z "$BASE_URL" ]; then
  echo "Usage: $0 <base-url> [runs=10]"
  echo "Example: $0 https://policestationrepuk-abc.vercel.app 10"
  exit 1
fi

BASE_URL="${BASE_URL%/}"

check() {
  local path="$1"
  local expected="$2"
  local code
  code=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}${path}" || echo "000")
  if [ "$code" != "$expected" ]; then
    echo "FAIL ${path} → HTTP ${code} (expected ${expected})"
    return 1
  fi
  echo "OK   ${path} → HTTP ${code}"
}

failures=0
for run in $(seq 1 "$RUNS"); do
  echo ""
  echo "=== smoke run ${run}/${RUNS} ==="
  check /api/health 200 || failures=$((failures + 1))
  check /api/ready 200 || failures=$((failures + 1))
  check / 200 || failures=$((failures + 1))
  check /directory 200 || failures=$((failures + 1))
  check /Register 200 || failures=$((failures + 1))
  # Cron auth probe — expect 401 without secret
  cron_code=$(curl -sS -o /dev/null -w "%{http_code}" "${BASE_URL}/api/cron/firm-outreach-bootstrap" || echo "000")
  if [ "$cron_code" != "401" ]; then
    echo "FAIL /api/cron/firm-outreach-bootstrap → HTTP ${cron_code} (expected 401)"
    failures=$((failures + 1))
  else
    echo "OK   /api/cron/firm-outreach-bootstrap → HTTP ${cron_code}"
  fi
done

echo ""
if [ "$failures" -gt 0 ]; then
  echo "preview-smoke: FAILED (${failures} check(s) across ${RUNS} run(s))"
  exit 1
fi
echo "preview-smoke: ALL PASSED (${RUNS} run(s))"
