#!/usr/bin/env python3
"""
🐝 Finance Bee - Revenue Intelligence Agent

Purpose: Monitor Stripe webhook events and track subscription revenue in real-time
Status: Phase 2 - Active Deployment
Author: Colony OS Team
"""

import os
import sys
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from dotenv import load_dotenv

try:
    import stripe
    from fastapi import FastAPI, Request, HTTPException, Response
    from fastapi.responses import JSONResponse
    import uvicorn
    from supabase import create_client, Client
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install -r requirements.txt")
    sys.exit(1)

# Load environment variables
load_dotenv(".env.colony")
load_dotenv("../../.env")  # Fallback to root .env

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [FINANCE_BEE] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
FINANCE_BEE_PORT = int(os.getenv("FINANCE_BEE_PORT", "8001"))

# Validate configuration
if not all([STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    logger.error("❌ Missing required environment variables")
    logger.error("Required: STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, VITE_SUPABASE_URL, SUPABASE_SERVICE_KEY")
    sys.exit(1)

# Initialize clients
stripe.api_key = STRIPE_SECRET_KEY
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# FastAPI app
app = FastAPI(title="Finance Bee", version="2.0.0")

# ═══════════════════════════════════════════════════════════════
# REVENUE TRACKING LOGIC
# ═══════════════════════════════════════════════════════════════

async def process_subscription_created(event: Dict[str, Any]) -> bool:
    """Process subscription.created event"""
    try:
        subscription = event['data']['object']
        
        subscription_data = {
            'stripe_subscription_id': subscription['id'],
            'user_id': subscription.get('metadata', {}).get('user_id'),
            'tier_name': subscription.get('metadata', {}).get('tier_name', 'premium'),
            'status': subscription['status'],
            'current_period_start': datetime.fromtimestamp(subscription['current_period_start']).isoformat(),
            'current_period_end': datetime.fromtimestamp(subscription['current_period_end']).isoformat(),
            'created_at': datetime.now().isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        # Insert into Supabase
        result = supabase.table('subscription_tiers').insert(subscription_data).execute()
        
        logger.info(f"✅ Subscription created: {subscription['id']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing subscription.created: {e}")
        return False


async def process_subscription_updated(event: Dict[str, Any]) -> bool:
    """Process subscription.updated event"""
    try:
        subscription = event['data']['object']
        
        update_data = {
            'status': subscription['status'],
            'current_period_start': datetime.fromtimestamp(subscription['current_period_start']).isoformat(),
            'current_period_end': datetime.fromtimestamp(subscription['current_period_end']).isoformat(),
            'updated_at': datetime.now().isoformat()
        }
        
        result = supabase.table('subscription_tiers').update(update_data).eq(
            'stripe_subscription_id', subscription['id']
        ).execute()
        
        logger.info(f"✅ Subscription updated: {subscription['id']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing subscription.updated: {e}")
        return False


async def process_subscription_deleted(event: Dict[str, Any]) -> bool:
    """Process subscription.deleted event"""
    try:
        subscription = event['data']['object']
        
        update_data = {
            'status': 'cancelled',
            'updated_at': datetime.now().isoformat()
        }
        
        result = supabase.table('subscription_tiers').update(update_data).eq(
            'stripe_subscription_id', subscription['id']
        ).execute()
        
        logger.info(f"✅ Subscription deleted: {subscription['id']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing subscription.deleted: {e}")
        return False


async def process_payment_succeeded(event: Dict[str, Any]) -> bool:
    """Process payment_intent.succeeded event"""
    try:
        payment_intent = event['data']['object']
        
        logger.info(f"✅ Payment succeeded: {payment_intent['id']} - ${payment_intent['amount']/100}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing payment_intent.succeeded: {e}")
        return False


async def process_payment_failed(event: Dict[str, Any]) -> bool:
    """Process payment_intent.payment_failed event"""
    try:
        payment_intent = event['data']['object']
        
        logger.warning(f"⚠️ Payment failed: {payment_intent['id']}")
        return True
        
    except Exception as e:
        logger.error(f"❌ Error processing payment_intent.payment_failed: {e}")
        return False


# Event handler mapping
EVENT_HANDLERS = {
    'customer.subscription.created': process_subscription_created,
    'customer.subscription.updated': process_subscription_updated,
    'customer.subscription.deleted': process_subscription_deleted,
    'payment_intent.succeeded': process_payment_succeeded,
    'payment_intent.payment_failed': process_payment_failed,
}

# ═══════════════════════════════════════════════════════════════
# WEBHOOK ENDPOINT
# ═══════════════════════════════════════════════════════════════

@app.post("/webhook")
async def stripe_webhook(request: Request):
    """
    Stripe webhook endpoint - receives and processes subscription events
    """
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            logger.error("❌ Missing stripe-signature header")
            raise HTTPException(status_code=400, detail="Missing signature")
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError as e:
            logger.error(f"❌ Invalid payload: {e}")
            raise HTTPException(status_code=400, detail="Invalid payload")
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"❌ Invalid signature: {e}")
            raise HTTPException(status_code=400, detail="Invalid signature")
        
        event_type = event['type']
        logger.info(f"📥 Received event: {event_type}")
        
        # Process event
        handler = EVENT_HANDLERS.get(event_type)
        if handler:
            success = await handler(event)
            if success:
                return JSONResponse(content={"status": "success"}, status_code=200)
            else:
                return JSONResponse(content={"status": "error"}, status_code=500)
        else:
            logger.info(f"ℹ️ Unhandled event type: {event_type}")
            return JSONResponse(content={"status": "ignored"}, status_code=200)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"❌ Webhook error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test Supabase connection
        supabase.table('subscription_tiers').select("count", count='exact').limit(1).execute()
        
        return JSONResponse(content={
            "status": "healthy",
            "bee": "Finance Bee",
            "version": "2.0.0",
            "supabase": "connected",
            "stripe": "configured",
            "timestamp": datetime.now().isoformat()
        })
    except Exception as e:
        logger.error(f"❌ Health check failed: {e}")
        return JSONResponse(
            content={"status": "unhealthy", "error": str(e)},
            status_code=503
        )


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "bee": "Finance Bee",
        "status": "operational",
        "version": "2.0.0",
        "description": "Revenue Intelligence Agent - Monitoring Stripe webhooks",
        "endpoints": {
            "webhook": "/webhook",
            "health": "/health"
        }
    }


# ═══════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════

def main():
    """Start the Finance Bee service"""
    logger.info("🐝 Finance Bee initializing...")
    logger.info(f"   Stripe: {'✅ Configured' if STRIPE_SECRET_KEY else '❌ Missing'}")
    logger.info(f"   Supabase: {'✅ Connected' if SUPABASE_URL else '❌ Missing'}")
    logger.info(f"   Port: {FINANCE_BEE_PORT}")
    logger.info("🚀 Finance Bee is now listening for Stripe webhooks...")
    
    uvicorn.run(
        app,
        host="0.0.0.0",
        port=FINANCE_BEE_PORT,
        log_level="info"
    )


if __name__ == "__main__":
    main()
