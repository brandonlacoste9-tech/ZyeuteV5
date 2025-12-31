#!/bin/bash

# Railway build script - simplified approach
echo "🚀 Starting Railway build process..."

# Clean install to ensure fresh dependencies
echo "🧹 Performing clean npm install..."
rm -rf node_modules package-lock.json
npm install

# Verify rollup installation
echo "🔍 Verifying rollup native module..."
if [ -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then
    echo "✅ Rollup native module found"
else
    echo "❌ Rollup native module missing - attempting manual install..."
    npm install @rollup/rollup-linux-x64-gnu --force
fi

# Run the build
echo "🔨 Running vite build..."
npm run build

echo "✅ Railway build completed successfully!"