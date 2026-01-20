#!/bin/bash
set -e  # Exit immediately if any command fails

echo "🚀 [Startup] Starting deployment sequence..."

# 1. Run Migrations
if [ -d "migrations" ]; then
  echo "📦 [Startup] Running Migrations..."
  # Migrations are handled by backend/index.ts using Drizzle
  # This block is kept for compatibility if explicit commands are needed later
fi

# 2. Start the Backend
echo "🔥 [Startup] Starting Node Server..."
exec node dist/index.js
