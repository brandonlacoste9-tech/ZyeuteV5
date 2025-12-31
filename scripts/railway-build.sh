#!/bin/bash

# Railway build script - simplified approach
echo "🚀 Starting Railway build process..."

# Clean install to ensure fresh dependencies
echo "🧹 Performing clean npm install..."
rm -rf node_modules package-lock.json
npm install

# Verify native modules
echo "🔍 Verifying native modules..."

if [ -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then
    echo "✅ Rollup native module found"
else
    echo "❌ Rollup native module missing - installing..."
    npm install @rollup/rollup-linux-x64-gnu --force
fi

if [ -d "node_modules/lightningcss-linux-x64-gnu" ]; then
    echo "✅ LightningCSS native module found"
else
    echo "❌ LightningCSS native module missing - installing..."
    npm install lightningcss-linux-x64-gnu --force
fi

# Run the build
echo "🔨 Running vite build..."
npm run build

echo "✅ Railway build completed successfully!"