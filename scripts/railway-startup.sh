#!/bin/bash
set -e

echo "🚀 Starting Deployment Sequence..."

# 1. Run Migrations (Use our new, sorted migration runner)
echo "📦 Running Database Migrations..."
npm run migrate

# 2. Start the Application
echo "🟢 Starting Application..."
# Start the production server using the built artifact
cross-env NODE_ENV=production node dist/index.cjs
