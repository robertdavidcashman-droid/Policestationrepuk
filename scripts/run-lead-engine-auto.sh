#!/usr/bin/env bash
# Full automated lead pipeline: discover → resolve websites → crawl → verify → export → campaign → report
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT/lead_engine"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  .venv/bin/pip install -q -r requirements.txt
fi
# shellcheck disable=SC1091
source .venv/bin/activate
exec python -m src.main auto
