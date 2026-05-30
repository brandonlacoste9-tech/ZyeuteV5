#!/bin/bash

# Railway build script - simplified approach
echo "🚀 Starting Railway build process..."

# Standard build process
echo "📦 Installing dependencies..."
npm install --include=optional

# Run the build
echo "🔨 Running vite build..."
npm run build

echo "✅ Railway build completed successfully!"