#!/usr/bin/env python3
"""
🧠 Neurosphere - Colony OS Central Coordination Kernel

Purpose: Coordinate communication between all bee agents
Status: Phase 2 - Foundation (Phase 3 will expand functionality)
Author: Colony OS Team
"""

import os
import sys
import logging
from datetime import datetime
from dotenv import load_dotenv

try:
    from fastapi import FastAPI
    from fastapi.responses import JSONResponse
    import uvicorn
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install -r ../requirements.txt")
    sys.exit(1)

# Load environment
load_dotenv("../.env.colony")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [NEUROSPHERE] - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# FastAPI app
app = FastAPI(title="Neurosphere", version="2.0.0")

NEUROSPHERE_PORT = int(os.getenv("NEUROSPHERE_PORT", "8000"))

# ═══════════════════════════════════════════════════════════════
# ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "kernel": "Neurosphere",
        "version": "2.0.0",
        "status": "operational",
        "description": "Colony OS Central Coordination Kernel",
        "phase": "Phase 2 - Foundation",
        "registered_bees": [
            {"name": "Finance Bee", "port": 8001, "status": "deployed"},
            {"name": "Guardian Bee", "port": 8002, "status": "deployed"},
        ],
        "endpoints": {"health": "/health", "bees": "/bees"},
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return JSONResponse(
        content={
            "status": "healthy",
            "kernel": "Neurosphere",
            "version": "2.0.0",
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.get("/bees")
async def list_bees():
    """List all registered bees"""
    return {
        "bees": [
            {
                "id": "finance-bee",
                "name": "Finance Bee",
                "type": "revenue_intelligence",
                "port": 8001,
                "endpoint": "http://localhost:8001",
            },
            {
                "id": "guardian-bee",
                "name": "Guardian Bee",
                "type": "security_sentinel",
                "port": 8002,
                "endpoint": "http://localhost:8002",
            },
        ],
        "count": 2,
    }


# ═══════════════════════════════════════════════════════════════
# MAIN
# ═══════════════════════════════════════════════════════════════


def main():
    """Start the Neurosphere kernel"""
    logger.info("🧠 Neurosphere kernel initializing...")
    logger.info(f"   Port: {NEUROSPHERE_PORT}")
    logger.info("   Phase: 2 - Foundation")
    logger.info("🚀 Neurosphere is now operational...")

    uvicorn.run(app, host="0.0.0.0", port=NEUROSPHERE_PORT, log_level="info")


if __name__ == "__main__":
    main()
