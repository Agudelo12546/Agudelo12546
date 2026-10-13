#!/usr/bin/env bash
# Crea .env.local con las llaves de la Supabase local (requiere `pnpm db:start` antes).
set -euo pipefail
eval "$(pnpm exec supabase status -o env 2>/dev/null | grep -E '^(API_URL|ANON_KEY|SERVICE_ROLE_KEY)=')"
cat > .env.local <<ENV
NEXT_PUBLIC_SUPABASE_URL=${API_URL}
NEXT_PUBLIC_SUPABASE_ANON_KEY=${ANON_KEY}
SUPABASE_SERVICE_ROLE_KEY=${SERVICE_ROLE_KEY}
NEXT_PUBLIC_SITE_URL=http://localhost:3000
ENV
echo "Listo: .env.local creado."
