#!/bin/bash
set -e  # Exit immediately if any command fails

echo "🚀 [Startup] Starting deployment sequence..."

# 1. Run Migrations (only if folder exists)
if [ -d "prisma" ] || [ -f "schema.prisma" ]; then
  echo "📦 [Startup] Running Prisma Migrations..."
  npx prisma migrate deploy || echo "⚠️ Warning: Migrations failed or not needed"
fi

# 2. Start the Backend
echo "🔥 [Startup] Starting Node Server..."

# CRITICAL: 'exec' replaces the shell process with Node.
# This ensures the app is PID 1 and receives signals correctly.
exec npm run start
