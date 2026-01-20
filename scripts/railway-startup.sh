#!/bin/bash
set -x # Debug mode: Print every command

echo "🚀 Starting Deployment Sequence..."

echo "📂 Current Directory contents:"
ls -la

echo "📂 Dist Directory contents:"
ls -la dist/ || echo "❌ Dist folder missing!"

# Migration Step (Safety check)
echo "📦 Running Database Migrations..."
# Catch error but don't exit immediately so we can see logs? 
# No, let's let it crash if it fails, but printed logs will help.
npm run migrate || { echo "❌ MIGRATION FAILED"; exit 1; }

echo "✅ Migrations completed."

# Start App
echo "🟢 Starting Application..."
node dist/index.cjs
