#!/bin/bash

# Railway build script - simplified approach
echo "🚀 Starting Railway build process..."

# Avoid deleting package-lock.json to preserve committed overrides
echo "🧹 Cleaning node_modules..."
rm -rf node_modules
# Use npm ci if we want strict lockfile, or npm install to respect it
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