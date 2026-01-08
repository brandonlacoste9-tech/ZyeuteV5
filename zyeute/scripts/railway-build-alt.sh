#!/bin/bash

echo "🚀 Railway Build Script v2 - Multiple fallback approaches"

# Approach 1: Try with npm ci first
echo "📦 Approach 1: Clean install with optional dependencies..."
npm ci --include=optional

# Approach 2: Force install rollup if missing
if [ ! -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then
    echo "🔧 Approach 2: Force installing rollup native module..."
    npm install @rollup/rollup-linux-x64-gnu --force --no-save
fi

# Approach 3: Verify and build
echo "🔍 Verifying rollup installation..."
if [ -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then
    echo "✅ Rollup native module ready"
    npm run build
else
    echo "❌ All approaches failed - trying direct build anyway..."
    npm run build || exit 1
fi

echo "✅ Build completed!"