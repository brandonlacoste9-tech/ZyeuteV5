#!/bin/bash
set -e

echo "🚀 [Startup] Starting deployment sequence..."
echo "🔥 [Startup] Starting Node Server..."
exec node --max-old-space-size=400 dist/index.cjs

