#!/bin/bash

# Railway build script - simplified approach
echo "🚀 Starting Railway build process..."

# nuclear reset to fix npm/rollup dependency bug
echo "🧹 Performing NUCLEAR reset of dependencies..."
rm -rf node_modules package-lock.json
npm cache clean --force

echo "📦 Installing dependencies..."
npm install --include=optional

echo "🔧 Forcing platform-specific binaries..."
npm install @rollup/rollup-linux-x64-gnu @esbuild/linux-x64 lightningcss-linux-x64-gnu @tailwindcss/oxide-linux-x64-gnu --force

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

if [ -d "node_modules/@tailwindcss/oxide-linux-x64-gnu" ]; then
    echo "✅ Tailwind Oxide native module found"
else
    echo "❌ Tailwind Oxide native module missing - installing..."
    npm install @tailwindcss/oxide-linux-x64-gnu --force
fi

if [ -d "node_modules/@esbuild/linux-x64" ]; then
    echo "✅ Esbuild Linux native module found"
else
    echo "❌ Esbuild Linux native module missing - installing..."
    npm install @esbuild/linux-x64 --force
fi

# Run the build
echo "🔨 Running vite build..."
npm run build

echo "✅ Railway build completed successfully!"