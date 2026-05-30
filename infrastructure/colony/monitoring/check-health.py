#!/usr/bin/env python3
"""
🔍 Colony OS Health Check

Verifies that all bee services are operational and can communicate
with Supabase and Stripe.
"""

import os
import sys
import asyncio
from datetime import datetime
from typing import Dict, Any, List, Tuple
from dotenv import load_dotenv

try:
    import httpx
    from supabase import create_client, Client
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install -r ../requirements.txt")
    sys.exit(1)

# Load environment variables
load_dotenv("../.env.colony")
load_dotenv("../../../.env")

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

FINANCE_BEE_URL = f"http://localhost:{os.getenv('FINANCE_BEE_PORT', '8001')}"
GUARDIAN_BEE_URL = f"http://localhost:{os.getenv('GUARDIAN_BEE_PORT', '8002')}"
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")

# ═══════════════════════════════════════════════════════════════
# HEALTH CHECK FUNCTIONS
# ═══════════════════════════════════════════════════════════════


async def check_finance_bee() -> Dict[str, Any]:
    """Check if Finance Bee is operational"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{FINANCE_BEE_URL}/health", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                return {
                    "name": "Finance Bee",
                    "status": "✅ OPERATIONAL",
                    "healthy": True,
                    "details": data,
                }
            else:
                return {
                    "name": "Finance Bee",
                    "status": "⚠️ DEGRADED",
                    "healthy": False,
                    "error": f"HTTP {response.status_code}",
                }
    except httpx.ConnectError:
        return {
            "name": "Finance Bee",
            "status": "❌ DOWN",
            "healthy": False,
            "error": "Connection refused (service not running)",
        }
    except Exception as e:
        return {
            "name": "Finance Bee",
            "status": "❌ ERROR",
            "healthy": False,
            "error": str(e),
        }


async def check_guardian_bee() -> Dict[str, Any]:
    """Check if Guardian Bee is operational"""
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{GUARDIAN_BEE_URL}/health", timeout=5.0)
            if response.status_code == 200:
                data = response.json()
                return {
                    "name": "Guardian Bee",
                    "status": "✅ OPERATIONAL",
                    "healthy": True,
                    "details": data,
                }
            else:
                return {
                    "name": "Guardian Bee",
                    "status": "⚠️ DEGRADED",
                    "healthy": False,
                    "error": f"HTTP {response.status_code}",
                }
    except httpx.ConnectError:
        return {
            "name": "Guardian Bee",
            "status": "❌ DOWN",
            "healthy": False,
            "error": "Connection refused (service not running)",
        }
    except Exception as e:
        return {
            "name": "Guardian Bee",
            "status": "❌ ERROR",
            "healthy": False,
            "error": str(e),
        }


def check_supabase() -> Dict[str, Any]:
    """Check Supabase connectivity"""
    try:
        if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
            return {
                "name": "Supabase",
                "status": "❌ NOT CONFIGURED",
                "healthy": False,
                "error": "Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY",
            }

        supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

        # Try to query subscription_tiers table
        result = (
            supabase.table("subscription_tiers")
            .select("count", count="exact")
            .limit(1)
            .execute()
        )

        return {
            "name": "Supabase",
            "status": "✅ CONNECTED",
            "healthy": True,
            "details": {"url": SUPABASE_URL, "table_accessible": "subscription_tiers"},
        }

    except Exception as e:
        return {
            "name": "Supabase",
            "status": "❌ CONNECTION FAILED",
            "healthy": False,
            "error": str(e),
        }


def check_stripe() -> Dict[str, Any]:
    """Check Stripe configuration"""
    try:
        if not STRIPE_SECRET_KEY:
            return {
                "name": "Stripe",
                "status": "❌ NOT CONFIGURED",
                "healthy": False,
                "error": "Missing STRIPE_SECRET_KEY",
            }

        # Check if key format is valid
        if STRIPE_SECRET_KEY.startswith("sk_"):
            return {
                "name": "Stripe",
                "status": "✅ CONFIGURED",
                "healthy": True,
                "details": {
                    "key_type": "live"
                    if STRIPE_SECRET_KEY.startswith("sk_live_")
                    else "test",
                    "key_format": "valid",
                },
            }
        else:
            return {
                "name": "Stripe",
                "status": "⚠️ INVALID KEY",
                "healthy": False,
                "error": "Stripe key format invalid",
            }

    except Exception as e:
        return {
            "name": "Stripe",
            "status": "❌ ERROR",
            "healthy": False,
            "error": str(e),
        }


# ═══════════════════════════════════════════════════════════════
# MAIN HEALTH CHECK
# ═══════════════════════════════════════════════════════════════


async def run_health_checks() -> Tuple[List[Dict[str, Any]], int]:
    """Run all health checks"""
    print("\n" + "=" * 70)
    print("🐝 COLONY OS - HEALTH CHECK")
    print("=" * 70)
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 70 + "\n")

    # Run checks
    finance_result = await check_finance_bee()
    guardian_result = await check_guardian_bee()
    supabase_result = check_supabase()
    stripe_result = check_stripe()

    results = [finance_result, guardian_result, supabase_result, stripe_result]

    # Display results
    for result in results:
        print(f"{result['name']:20} {result['status']}")
        if "details" in result:
            for key, value in result["details"].items():
                print(f"  └─ {key}: {value}")
        if "error" in result:
            print(f"  └─ Error: {result['error']}")
        print()

    # Summary
    healthy_count = sum(1 for r in results if r["healthy"])
    total_count = len(results)

    print("=" * 70)
    print(f"SUMMARY: {healthy_count}/{total_count} services healthy")

    if healthy_count == total_count:
        print("Status: 🟢 ALL SYSTEMS OPERATIONAL")
        exit_code = 0
    elif healthy_count > 0:
        print("Status: 🟡 PARTIAL OUTAGE")
        exit_code = 1
    else:
        print("Status: 🔴 CRITICAL - ALL SERVICES DOWN")
        exit_code = 2

    print("=" * 70 + "\n")

    return results, exit_code


# ═══════════════════════════════════════════════════════════════
# STARTUP INSTRUCTIONS
# ═══════════════════════════════════════════════════════════════


def print_startup_instructions():
    """Print instructions for starting bee services"""
    print("\n" + "=" * 70)
    print("📋 HOW TO START BEE SERVICES")
    print("=" * 70)
    print("\nIf bees are not running, start them with:\n")
    print("  # Terminal 1 - Finance Bee")
    print("  cd infrastructure/colony/bees")
    print("  python3 finance_bee.py\n")
    print("  # Terminal 2 - Guardian Bee")
    print("  cd infrastructure/colony/bees")
    print("  python3 guardian.py\n")
    print("Or use Docker Compose:")
    print("  cd infrastructure/colony")
    print("  docker-compose up -d\n")
    print("=" * 70 + "\n")


# ═══════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════


def main():
    """Main execution"""
    try:
        results, exit_code = asyncio.run(run_health_checks())

        # If any bee is down, show startup instructions
        if not all(r["healthy"] for r in results if "Bee" in r["name"]):
            print_startup_instructions()

        sys.exit(exit_code)

    except KeyboardInterrupt:
        print("\n\n⚠️ Health check interrupted by user\n")
        sys.exit(130)
    except Exception as e:
        print(f"\n❌ Health check failed: {e}\n")
        sys.exit(1)


if __name__ == "__main__":
    main()
