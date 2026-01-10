#!/bin/bash
# Quick Deploy Script for Railway
# This script helps you deploy Zyeuté to Railway with minimal setup

set -e

echo "🚀 Zyeuté Quick Deploy to Railway"
echo "=================================="
echo ""

# Check if Railway CLI is installed
if ! command -v railway &> /dev/null; then
    echo "📦 Installing Railway CLI..."
    npm install -g @railway/cli
fi

# Check if logged in
if ! railway whoami &> /dev/null; then
    echo "🔐 Please login to Railway..."
    railway login
fi

echo ""
echo "📋 Pre-flight Checks..."
echo ""

# Check if build works
echo "1. Building application..."
if npm run build; then
    echo "   ✅ Build successful"
else
    echo "   ❌ Build failed - fix errors before deploying"
    exit 1
fi

# Check TypeScript
echo ""
echo "2. Checking TypeScript..."
if npm run check; then
    echo "   ✅ TypeScript checks passed"
else
    echo "   ⚠️  TypeScript errors found - review before deploying"
fi

# Check if DATABASE_URL is set
echo ""
echo "3. Checking environment variables..."
if [ -z "$DATABASE_URL" ]; then
    echo "   ⚠️  DATABASE_URL not set"
    echo "   💡 Railway will set this automatically if you add a PostgreSQL service"
else
    echo "   ✅ DATABASE_URL is set"
fi

echo ""
echo "🚀 Ready to deploy!"
echo ""
echo "Next steps:"
echo "1. If you haven't created a Railway project yet:"
echo "   railway init"
echo ""
echo "2. Link this project to Railway:"
echo "   railway link"
echo ""
echo "3. Add PostgreSQL database (if needed):"
echo "   railway add postgresql"
echo ""
echo "4. Set environment variables:"
echo "   railway variables set NODE_ENV=production"
echo "   railway variables set PORT=8080"
echo "   # ... add other required variables"
echo ""
echo "5. Deploy:"
echo "   railway up"
echo ""
echo "Or deploy from GitHub by pushing to your repo!"
echo "Railway will auto-detect railway.json and deploy automatically."
echo ""