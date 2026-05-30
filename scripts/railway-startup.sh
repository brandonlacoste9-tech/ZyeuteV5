#!/bin/bash
set -e

echo "🚀 [Startup] Starting deployment sequence..."
echo "🔥 [Startup] Starting Node Server..."
exec node dist/index.cjs

