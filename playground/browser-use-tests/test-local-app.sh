#!/bin/bash
# Browser-Use Test Script
# Tests browser automation on local Zyeuté app

echo "🧪 Testing Browser-Use with Local App"
echo "======================================"

# Check if browser-use is installed
if ! command -v browser-use &> /dev/null; then
    echo "❌ browser-use not found. Installing..."
    cd ../external/browser-use
    uv pip install -e .
    browser-use install
    cd ../../playground
fi

# Start local server (if not running)
echo "📡 Checking if local server is running..."
if ! curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "⚠️  Local server not running. Please start it first:"
    echo "   cd frontend && npm run dev"
    exit 1
fi

echo "✅ Local server detected"
echo ""
echo "🌐 Opening browser..."
browser-use --headed open http://localhost:3000

echo ""
echo "📸 Taking screenshot..."
browser-use screenshot browser-use-tests/results/homepage.png

echo ""
echo "🔍 Getting page state..."
browser-use state > browser-use-tests/results/page-state.json

echo ""
echo "✅ Test complete! Check results in browser-use-tests/results/"
