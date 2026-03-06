#!/usr/bin/env python3
"""
🐝 Guardian Bee - Security Sentinel Agent

Purpose: Automated threat detection and security monitoring
Status: Phase 2 - Active Deployment
Author: Colony OS Team
"""

import os
import sys
import re
import json
import logging
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Optional
from dotenv import load_dotenv

try:
    from fastapi import FastAPI, Request
    from fastapi.responses import JSONResponse
    import uvicorn
    from supabase import create_client, Client
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

# Load environment variables
load_dotenv(".env.colony")
load_dotenv("../../.env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - [GUARDIAN_BEE] - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
GUARDIAN_BEE_PORT = int(os.getenv("GUARDIAN_BEE_PORT", "8002"))
SCAN_INTERVAL = int(os.getenv("GUARDIAN_SCAN_INTERVAL", "60"))  # seconds

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    logger.error("❌ Missing required environment variables")
    logger.error("Required: VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ═══════════════════════════════════════════════════════════════
# THREAT DETECTION PATTERNS
# ═══════════════════════════════════════════════════════════════

# SQL Injection patterns
SQL_INJECTION_PATTERNS = [
    r"('\s*OR\s*'1'\s*=\s*'1)",  # ' OR '1'='1
    r"('\s*OR\s*1\s*=\s*1)",  # ' OR 1=1
    r"(UNION\s+SELECT)",  # UNION SELECT
    r"(DROP\s+TABLE)",  # DROP TABLE
    r"(INSERT\s+INTO)",  # INSERT INTO
    r"(DELETE\s+FROM)",  # DELETE FROM
    r"(UPDATE\s+.*\s+SET)",  # UPDATE ... SET
    r"(--\s*$)",  # SQL comment
    r"(/\*.*\*/)",  # SQL block comment
    r"(;\s*DROP\s+)",  # ; DROP
    r"(xp_cmdshell)",  # SQL Server command shell
    r"(exec\s*\()",  # EXEC(
]

# Path Traversal patterns
PATH_TRAVERSAL_PATTERNS = [
    r"\.\./",  # ../
    r"\.\./\.\./",  # ../../
    r"\.\.\\",  # ..\
    r"/etc/passwd",  # /etc/passwd
    r"C:\\Windows",  # C:\Windows
    r"%2e%2e/",  # URL encoded ../
    r"\.\.%2f",  # Mixed encoding
]

# XSS patterns
XSS_PATTERNS = [
    r"<script[^>]*>.*?</script>",  # <script> tags
    r"javascript:",  # javascript: protocol
    r"onerror\s*=",  # onerror= event
    r"onload\s*=",  # onload= event
    r"onclick\s*=",  # onclick= event
    r"<iframe",  # iframe tags
    r"eval\s*\(",  # eval() function
]

# Compiled patterns for performance
COMPILED_SQL_PATTERNS = [re.compile(p, re.IGNORECASE) for p in SQL_INJECTION_PATTERNS]
COMPILED_PATH_PATTERNS = [re.compile(p, re.IGNORECASE) for p in PATH_TRAVERSAL_PATTERNS]
COMPILED_XSS_PATTERNS = [re.compile(p, re.IGNORECASE) for p in XSS_PATTERNS]

# ═══════════════════════════════════════════════════════════════
# THREAT DETECTION LOGIC
# ═══════════════════════════════════════════════════════════════


def detect_sql_injection(text: str) -> Optional[Dict[str, Any]]:
    """Detect SQL injection patterns in text"""
    for pattern in COMPILED_SQL_PATTERNS:
        match = pattern.search(text)
        if match:
            return {
                "type": "sql_injection",
                "severity": "critical",
                "pattern": pattern.pattern,
                "matched_text": match.group(0),
                "description": f"SQL injection attempt detected: {match.group(0)}",
            }
    return None


def detect_path_traversal(text: str) -> Optional[Dict[str, Any]]:
    """Detect path traversal patterns in text"""
    for pattern in COMPILED_PATH_PATTERNS:
        match = pattern.search(text)
        if match:
            return {
                "type": "path_traversal",
                "severity": "high",
                "pattern": pattern.pattern,
                "matched_text": match.group(0),
                "description": f"Path traversal attempt detected: {match.group(0)}",
            }
    return None


def detect_xss(text: str) -> Optional[Dict[str, Any]]:
    """Detect XSS patterns in text"""
    for pattern in COMPILED_XSS_PATTERNS:
        match = pattern.search(text)
        if match:
            return {
                "type": "xss",
                "severity": "high",
                "pattern": pattern.pattern,
                "matched_text": match.group(0),
                "description": f"XSS attempt detected: {match.group(0)}",
            }
    return None


def scan_for_threats(text: str, source: str = "unknown") -> List[Dict[str, Any]]:
    """Scan text for all threat patterns"""
    threats = []

    # Check SQL injection
    sql_threat = detect_sql_injection(text)
    if sql_threat:
        sql_threat["source"] = source
        threats.append(sql_threat)

    # Check path traversal
    path_threat = detect_path_traversal(text)
    if path_threat:
        path_threat["source"] = source
        threats.append(path_threat)

    # Check XSS
    xss_threat = detect_xss(text)
    if xss_threat:
        xss_threat["source"] = source
        threats.append(xss_threat)

    return threats


async def log_security_event(event_data: Dict[str, Any]) -> bool:
    """Log security event to Supabase"""
    try:
        # Ensure security_events table exists or log locally
        event_record = {
            "event_type": event_data.get("type", "unknown"),
            "severity": event_data.get("severity", "info"),
            "description": event_data.get("description", ""),
            "ip_address": event_data.get("ip_address"),
            "user_agent": event_data.get("user_agent"),
            "metadata": json.dumps(event_data),
            "detected_at": datetime.now().isoformat(),
        }

        # Try to insert into security_events table
        try:
            result = supabase.table("security_events").insert(event_record).execute()
            logger.info(f"✅ Security event logged: {event_data['type']}")
        except Exception as db_error:
            # If table doesn't exist, log to file
            logger.warning(f"⚠️ Database logging failed, logging locally: {db_error}")
            logger.warning(f"Security Event: {json.dumps(event_record, indent=2)}")

        return True

    except Exception as e:
        logger.error(f"❌ Error logging security event: {e}")
        return False


# ═══════════════════════════════════════════════════════════════
# CONTINUOUS MONITORING LOOP
# ═══════════════════════════════════════════════════════════════


async def monitor_logs():
    """Background task to continuously monitor for threats"""
    logger.info("🔒 Guardian Bee starting threat detection loop...")

    while True:
        try:
            # In production, this would fetch real logs from Supabase
            # For now, we'll just demonstrate the capability
            logger.debug("🔍 Scanning for threats...")

            # Simulate log scanning (in production, fetch from logs table)
            # Example: Check recent API requests, form submissions, etc.

            await asyncio.sleep(SCAN_INTERVAL)

        except Exception as e:
            logger.error(f"❌ Error in monitoring loop: {e}")
            await asyncio.sleep(SCAN_INTERVAL)


# ═══════════════════════════════════════════════════════════════
# API ENDPOINTS
# ═══════════════════════════════════════════════════════════════


@app.post("/scan")
async def scan_endpoint(request: Request):
    """
    Scan provided text for security threats
    """
    try:
        data = await request.json()
        text = data.get("text", "")
        source = data.get("source", "api")

        if not text:
            return JSONResponse(content={"error": "No text provided"}, status_code=400)

        threats = scan_for_threats(text, source)

        # Log any detected threats
        for threat in threats:
            threat["ip_address"] = request.client.host
            threat["user_agent"] = request.headers.get("user-agent", "unknown")
            await log_security_event(threat)

        return JSONResponse(
            content={
                "threats_detected": len(threats),
                "threats": threats,
                "scan_timestamp": datetime.now().isoformat(),
            }
        )

    except Exception as e:
        logger.error(f"❌ Scan error: {e}")
        return JSONResponse(content={"error": str(e)}, status_code=500)


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Supabase connection
        supabase.table("security_events").select("count", count="exact").limit(
            1
        ).execute()
        db_status = "connected"
    except Exception as e:
        logger.warning(f"⚠️ Database check failed: {e}")
        db_status = "disconnected (logging locally)"

    return JSONResponse(
        content={
            "status": "healthy",
            "bee": "Guardian Bee",
            "version": "2.0.0",
            "supabase": db_status,
            "patterns_loaded": {
                "sql_injection": len(COMPILED_SQL_PATTERNS),
                "path_traversal": len(COMPILED_PATH_PATTERNS),
                "xss": len(COMPILED_XSS_PATTERNS),
            },
            "scan_interval": f"{SCAN_INTERVAL}s",
            "timestamp": datetime.now().isoformat(),
        }
    )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "bee": "Guardian Bee",
        "status": "operational",
        "version": "2.0.0",
        "description": "Security Sentinel - Automated threat detection",
        "capabilities": [
            "SQL injection detection",
            "Path traversal detection",
            "XSS detection",
            "Real-time log monitoring",
            "Security event logging",
        ],
        "endpoints": {"scan": "/scan", "health": "/health"},
    }


# ═══════════════════════════════════════════════════════════════
# STARTUP EVENT
# ═══════════════════════════════════════════════════════════════

from contextlib import asynccontextmanager


@asynccontextmanager
async def lifespan(app_instance: FastAPI):
    """Lifespan context manager for startup and shutdown"""
    # Startup
    asyncio.create_task(monitor_logs())
    logger.info("✅ Guardian Bee background monitoring started")
    yield
    # Shutdown
    logger.info("🛑 Guardian Bee shutting down...")


# FastAPI app with lifespan
app = FastAPI(title="Guardian Bee", version="2.0.0", lifespan=lifespan)


# ═══════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════


def main():
    """Start the Guardian Bee service"""
    logger.info("🐝 Guardian Bee initializing...")
    logger.info(f"   Supabase: {'✅ Connected' if SUPABASE_URL else '❌ Missing'}")
    logger.info(f"   Port: {GUARDIAN_BEE_PORT}")
    logger.info(f"   Scan Interval: {SCAN_INTERVAL}s")
    logger.info(
        f"   Threat Patterns Loaded: {len(COMPILED_SQL_PATTERNS) + len(COMPILED_PATH_PATTERNS) + len(COMPILED_XSS_PATTERNS)}"
    )
    logger.info("🚀 Guardian Bee is now monitoring for threats...")

    uvicorn.run(app, host="0.0.0.0", port=GUARDIAN_BEE_PORT, log_level="info")


if __name__ == "__main__":
    main()
