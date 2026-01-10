#!/bin/bash
# Railway Startup Script
# Runs database migrations and seed data before starting the app

set -e  # Exit on error

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

# Export DATABASE_URL for Node scripts
export DATABASE_URL

# Run migrations in order (idempotent - safe to run multiple times)
echo ""
echo "📋 Step 1: Creating database schema..."
npx tsx zyeute/scripts/run-schema-migration.ts || echo "⚠️  Schema migration skipped (may already exist)"

echo ""
echo "📋 Step 2: Creating publications table..."
npx tsx zyeute/scripts/create-publications-table.ts || echo "⚠️  Publications table creation skipped (may already exist)"

echo ""
echo "📋 Step 3: Ensuring test user exists..."
npx tsx zyeute/scripts/create-test-user.ts || echo "⚠️  Test user creation skipped (may already exist)"

echo ""
echo "📋 Step 4: Running seed migration..."
npx tsx zyeute/scripts/run-seed-migration.ts || echo "⚠️  Seed migration skipped (may already exist)"

echo ""
echo "✅ Database setup complete!"
echo "🚀 Starting application..."
echo ""

# Start the application
exec node dist/index.cjs
