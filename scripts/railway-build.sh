#!/bin/bash

# Railway-specific build script to handle rollup native module issues
echo "🚀 Starting Railway build process..."

# Ensure we're in the right directory
cd /app

# Force install rollup native modules before build
echo "📦 Installing rollup native modules..."
npm install @rollup/rollup-linux-x64-gnu --no-save --force

# Verify installation
if [ -d "node_modules/@rollup/rollup-linux-x64-gnu" ]; then
    echo "✅ Rollup native module installed successfully"
else
    echo "❌ Failed to install rollup native module"
    exit 1
fi

# Now run the normal build
echo "🔨 Running vite build..."
npm run build

echo "✅ Railway build completed successfully!"