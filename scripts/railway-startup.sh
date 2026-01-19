#!/bin/bash
# Zyeuté Resilient Startup ⚜️
set -e

echo "🚀 [Startup] Beginning Zyeuté Launch..."
echo "🌐 Environment: ${NODE_ENV:-production}"
echo "🔌 Target Port: ${PORT:-5000}"

# Verify compiled entrypoint exists
if [ ! -f dist/index.cjs ]; then
  echo "❌ ERROR: dist/index.cjs not found – build may have failed."
  exit 1
fi

# Run migrations in background (non‑blocking)
(echo "📦 Running DB migrations..." && npm run db:deploy) || echo "⚠️ Migrations failed, continuing..."

# Launch the API server (replace script process)
echo "🎬 Starting API server..."
exec node dist/index.cjs
