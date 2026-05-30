#!/bin/bash

# ═══════════════════════════════════════════════════════════════
# 🐝 Finance Bee Deployment Script
# ═══════════════════════════════════════════════════════════════

set -e

echo "════════════════════════════════════════════════════════════════"
echo "🐝 DEPLOYING FINANCE BEE - Revenue Intelligence Agent"
echo "════════════════════════════════════════════════════════════════"
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Navigate to colony directory
cd "$(dirname "$0")"

# ═══════════════════════════════════════════════════════════════
# Step 1: Check environment
# ═══════════════════════════════════════════════════════════════
echo "📋 Step 1: Checking environment..."

if [ ! -f ".env.colony" ]; then
    echo -e "${YELLOW}⚠️  .env.colony not found. Creating from example...${NC}"
    cp .env.example .env.colony
    echo -e "${YELLOW}⚠️  Please edit .env.colony with your actual keys${NC}"
    echo ""
    read -p "Press Enter after updating .env.colony to continue..."
fi

# Check if Python 3 is available
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}❌ Python 3 not found. Please install Python 3.12+${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Python 3 found: $(python3 --version)${NC}"

# ═══════════════════════════════════════════════════════════════
# Step 2: Install dependencies
# ═══════════════════════════════════════════════════════════════
echo ""
echo "📦 Step 2: Installing Python dependencies..."

if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

source venv/bin/activate

pip install -q --upgrade pip
pip install -q -r requirements.txt

echo -e "${GREEN}✅ Dependencies installed${NC}"

# ═══════════════════════════════════════════════════════════════
# Step 3: Run tests
# ═══════════════════════════════════════════════════════════════
echo ""
echo "🧪 Step 3: Running integration tests..."

cd bees/tests
python3 -m pytest test_finance_bee.py -v --tb=short || {
    echo -e "${YELLOW}⚠️  Some tests failed, but continuing deployment${NC}"
}
cd ../..

# ═══════════════════════════════════════════════════════════════
# Step 4: Start Finance Bee
# ═══════════════════════════════════════════════════════════════
echo ""
echo "🚀 Step 4: Starting Finance Bee..."

# Check if already running
if lsof -Pi :8001 -sTCP:LISTEN -t >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Finance Bee is already running on port 8001${NC}"
    read -p "Stop existing instance and restart? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        PID=$(lsof -ti:8001)
        kill $PID
        echo "Stopped existing instance (PID: $PID)"
        sleep 2
    else
        echo "Deployment cancelled"
        exit 0
    fi
fi

# Ensure logs directory exists
mkdir -p logs

# Start Finance Bee in background
echo "Starting Finance Bee on port 8001..."
nohup python3 bees/finance_bee.py > logs/finance_bee.log 2>&1 &
FINANCE_BEE_PID=$!

echo -e "${GREEN}✅ Finance Bee started (PID: $FINANCE_BEE_PID)${NC}"

# ═══════════════════════════════════════════════════════════════
# Step 5: Verify deployment
# ═══════════════════════════════════════════════════════════════
echo ""
echo "🔍 Step 5: Verifying deployment..."
sleep 3

# Check if process is still running
if ps -p $FINANCE_BEE_PID > /dev/null; then
    # Try to hit health endpoint
    if curl -s -f http://localhost:8001/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Finance Bee is healthy and responding${NC}"
        
        # Show health status
        echo ""
        echo "Health Check Response:"
        curl -s http://localhost:8001/health | python3 -m json.tool
    else
        echo -e "${YELLOW}⚠️  Finance Bee is running but health check failed${NC}"
        echo "Check logs: tail -f logs/finance_bee.log"
    fi
else
    echo -e "${RED}❌ Finance Bee failed to start${NC}"
    echo "Check logs: tail -f logs/finance_bee.log"
    exit 1
fi

# ═══════════════════════════════════════════════════════════════
# Deployment Complete
# ═══════════════════════════════════════════════════════════════
echo ""
echo "════════════════════════════════════════════════════════════════"
echo -e "${GREEN}✅ FINANCE BEE DEPLOYMENT COMPLETE${NC}"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📊 Service Information:"
echo "   Status: Running"
echo "   PID: $FINANCE_BEE_PID"
echo "   Port: 8001"
echo "   Health: http://localhost:8001/health"
echo "   Webhook: http://localhost:8001/webhook"
echo ""
echo "📝 Useful Commands:"
echo "   View logs: tail -f logs/finance_bee.log"
echo "   Stop service: kill $FINANCE_BEE_PID"
echo "   Health check: curl http://localhost:8001/health"
echo ""
echo "🔔 Next Steps:"
echo "   1. Configure Stripe webhook to point to your server's /webhook endpoint"
echo "   2. Monitor logs for incoming webhook events"
echo "   3. Verify data is being written to Supabase subscription_tiers table"
echo ""
echo "════════════════════════════════════════════════════════════════"
