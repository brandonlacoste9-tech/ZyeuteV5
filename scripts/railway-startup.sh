#!/bin/bash
# Zyeuté Fast Startup Script (Demo Optimized)
set -e

echo "🚀 Starting Zyeuté API (Fast Boot Mode)..."
echo "🌐 Environment: ${NODE_ENV:-production}"
echo "🔌 Port: ${PORT:-5000}"

# Start the application immediately
exec node dist/index.cjs
