#!/usr/bin/env bash
# Corre las pruebas pgTAP de supabase/tests contra la base local con psql.
# Falla si alguna prueba sale "not ok", si hay errores SQL o si el plan no se cumple.
set -euo pipefail
DB_URL="${DB_URL:-postgresql://postgres:postgres@127.0.0.1:54322/postgres}"
status=0
for f in supabase/tests/*.test.sql; do
  echo "# $f"
  out=$(psql "$DB_URL" -X -q -t -A -v ON_ERROR_STOP=1 -f "$f" 2>&1) || status=1
  echo "$out"
  if grep -qE '^not ok|ERROR|Looks like you planned' <<<"$out"; then status=1; fi
done
exit $status
