#!/usr/bin/env bash
# ESLint autofix, then run full local CI mirror. Repeats up to --retry N times.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

RETRIES=1
while [[ $# -gt 0 ]]; do
  case "$1" in
    --retry)
      RETRIES="${2:-1}"
      shift 2
      ;;
    *)
      echo "Unknown argument: $1" >&2
      echo "Usage: $0 [--retry N]" >&2
      exit 2
      ;;
  esac
done

attempt=1
while [[ "$attempt" -le "$RETRIES" ]]; do
  echo ""
  echo "=== ci-autofix attempt $attempt / $RETRIES ==="

  echo "==> eslint --fix"
  npm run lint -- --fix || true

  if bash scripts/ci-local.sh; then
    echo ""
    echo "ci-autofix: passed on attempt $attempt"
    exit 0
  fi

  echo "ci-autofix: attempt $attempt failed" >&2
  attempt=$((attempt + 1))
done

echo "ci-autofix: failed after $RETRIES attempt(s)" >&2
exit 1
