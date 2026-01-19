#!/bin/bash
# Zyeuté Resilient Startup ⚜️
set -e

echo "🚀 [Startup] Beginning Zyeuté Launch..."
echo "🌐 Environment: ${NODE_ENV:-production}"
echo "🔌 Target Port: ${PORT:-5000}"

# 1. Start the server in the background
echo "🎬 Step 1: Launching API server in background..."
node dist/index.cjs &
SERVER_PID=$!

# 2. Run migrations in the background (prevent blocking health check)
echo "📦 Step 2: Running database migrations (parallel)..."
(npm run db:deploy || echo "⚠️ Migrations failed, but server is running.") &

# 3. Wait for the server process (keep container alive)
echo "📡 [Startup] System active. Monitoring PID $SERVER_PID"
wait $SERVER_PID
