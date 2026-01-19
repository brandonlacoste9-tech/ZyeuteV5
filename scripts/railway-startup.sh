#!/bin/bash
set -e

echo "🚀 Starting Deployment Sequence..."

# 1. Run Migrations
echo "📦 Running Database Migrations..."
npm run migrate

# 2. Start the Application
echo "🟢 Starting Application..."
# Removed 'cross-env' as it is a devDependency. 
# NODE_ENV is set by Railway or Defaults.
node dist/index.cjs
