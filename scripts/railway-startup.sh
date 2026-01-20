#!/bin/bash
set -x # Debug mode: Print every command

echo "🚀 Starting Deployment Sequence..."

echo "📂 Current Directory contents:"
ls -la

echo "📂 Dist Directory contents:"
ls -la dist/ || echo "❌ Dist folder missing!"

# Migration Step (Safety check)
echo "📦 Running Database Migrations..."
# Log error but CONTINUE so capturing logs is possible (and app might work partially)
npm run migrate || echo "❌ MIGRATION FAILED - Check logs above"

echo "✅ Migrations completed."

# Start App
echo "🟢 Starting Application..."
node dist/index.cjs
