#!/bin/bash
set -e

echo "🚀 [Startup] Starting deployment sequence..."

# Run DB migrations directly via psql if DATABASE_URL is set
if [ -n "$DATABASE_URL" ] && [ -d "migrations" ]; then
  echo "📦 [Startup] Running SQL migrations..."
  for f in migrations/0*.sql; do
    echo "   → $f"
    psql "$DATABASE_URL" -f "$f" --single-transaction -q 2>&1 | grep -v "^NOTICE" || true
  done
  echo "✅ [Startup] Migrations complete"
else
  echo "⚠️  [Startup] No DATABASE_URL or migrations dir - skipping migrations"
fi

echo "🔥 [Startup] Starting Node Server..."
exec node dist/index.cjs

