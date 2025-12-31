#!/bin/bash
# Railway build script for Zyeuté

echo "🚀 Starting Railway Build Process..."

# 1. Install dependencies emphasizing Linux binaries
echo "📦 Installing dependencies..."
npm install @rollup/rollup-linux-x64-gnu --force
npm install lightningcss-linux-x64-gnu --force

# 2. Run the main build
echo "🔨 Running vite build..."
npm run build

echo "✅ Build completed successfully!"
