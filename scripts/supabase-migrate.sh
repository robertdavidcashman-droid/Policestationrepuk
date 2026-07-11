#!/usr/bin/env bash
# Apply Supabase SQL migrations to a local Postgres instance.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DB_URL="${DATABASE_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"

echo "supabase-migrate: applying migrations to ${DB_URL}"

for file in "$ROOT"/supabase/migrations/*.sql; do
  [ -f "$file" ] || continue
  echo "  -> $(basename "$file")"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$file"
done

if [ -f "$ROOT/supabase/seed.sql" ] && [ "${APPLY_SEED:-0}" = "1" ]; then
  echo "  -> seed.sql"
  psql "$DB_URL" -v ON_ERROR_STOP=1 -f "$ROOT/supabase/seed.sql"
fi

echo "supabase-migrate: done"
