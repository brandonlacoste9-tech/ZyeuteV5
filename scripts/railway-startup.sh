#!/bin/bash
# Railway Startup Script
# Runs database migrations and seed data before starting the app

set -e

echo "🚀 Zyeuté Railway Startup Script"
echo "=================================="

# Check if DATABASE_URL is set
if [ -z "$DATABASE_URL" ]; then
  echo "⚠️  DATABASE_URL not set, skipping database setup"
  echo "🚀 Starting application..."
  exec node dist/index.cjs
  exit 0
fi

echo "📦 Database URL found, setting up database..."

# Run migrations using local tsx to avoid npx overhead/network issues
TSX_BIN="./node_modules/.bin/tsx"

if [ ! -f "$TSX_BIN" ]; then
  echo "⚠️  tsx binary not found at $TSX_BIN, trying just 'tsx' from path"
  TSX_BIN="tsx"
fi

echo "📋 Step 1: Schema check..."
$TSX_BIN scripts/run-schema-migration.ts || echo "⚠️  Schema migration skipped/failed"

echo "📋 Step 2: Ensure tables exist..."
$TSX_BIN scripts/create-publications-table.ts || echo "⚠️  Table creation failed"

echo "📋 Step 3: Test User..."
$TSX_BIN scripts/create-test-user.ts || echo "⚠️  User creation failed"

# Skipping Step 4 (Seed) to speed up boot - we already seeded the DB
# echo "📋 Step 4: Seed migration..."
# $TSX_BIN scripts/run-seed-migration.ts || echo "⚠️  Seed failed"

echo ""
echo "✅ Database setup complete!"
echo "🚀 Starting application..."
echo "🌐 Starting on port: ${PORT:-5000}"

# Run the app
exec node dist/index.cjs
