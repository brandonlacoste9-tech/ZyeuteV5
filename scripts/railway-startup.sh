#!/bin/bash
# Zyeuté Resilient Startup ⚜️
set -e

echo "🚀 [Startup] Beginning Zyeuté Launch..."
echo "🌐 Environment: ${NODE_ENV:-production}"
echo "🔌 Target Port: ${PORT:-5000}"

# Debug: list files to locate the compiled entrypoint
echo "🔎 Checking directory structure..."
pwd
# List all files and highlight where index.cjs is located
ls -R . | grep -C 5 "index.cjs" || echo "⚠️ index.cjs not found"

# Verify compiled entrypoint exists (fallback path if needed)
if [ -f dist/index.cjs ]; then
  ENTRY="dist/index.cjs"
elif [ -f backend/dist/index.cjs ]; then
  ENTRY="backend/dist/index.cjs"
else
  echo "❌ ERROR: compiled entrypoint not found."
  exit 1
fi

# Run migrations in background (non‑blocking)
(echo "📦 Running DB migrations..." && npm run db:deploy) || echo "⚠️ Migrations failed, continuing..."

# Launch the API server (replace script process)
echo "🎬 Starting API server using $ENTRY..."
exec node $ENTRY
