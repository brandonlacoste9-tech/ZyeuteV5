#!/usr/bin/env python3
"""
🐝 Task Poller - Colony OS Bridge Worker

Purpose: Poll Supabase for pending tasks and dispatch to bees
Status: Phase 2 - Active
Author: Colony OS Team
"""

import os
import sys
import time
import logging
import asyncio
from datetime import datetime
from dotenv import load_dotenv

try:
    from supabase import create_client, Client
except ImportError as e:
    print(f"❌ Missing dependency: {e}")
    print("Run: pip install -r ../requirements.txt")
    sys.exit(1)

# Load environment - try multiple paths
import pathlib
script_dir = pathlib.Path(__file__).parent.resolve()
colony_dir = script_dir.parent
project_root = colony_dir.parent.parent

load_dotenv(colony_dir / ".env.colony")
load_dotenv(project_root / ".env")

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - [TASK_POLLER] - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Configuration
SUPABASE_URL = os.getenv("VITE_SUPABASE_URL")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")
POLL_INTERVAL = int(os.getenv("POLL_INTERVAL", "2"))

if not all([SUPABASE_URL, SUPABASE_SERVICE_KEY]):
    logger.error("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# ═══════════════════════════════════════════════════════════════
# TASK PROCESSING
# ═══════════════════════════════════════════════════════════════

async def process_task(task: dict) -> dict:
    """
    Process a task by dispatching to the appropriate bee.
    Returns the result to be stored in the database.
    """
    task_id = task['id']
    command = task['command']
    metadata = task.get('metadata', {})
    target_bee = metadata.get('target_bee', 'general')
    
    logger.info(f"🐝 Processing task [{task_id[:8]}...]: {command}")
    logger.info(f"   Target Bee: {target_bee}")
    
    # Simulate bee work (Phase 2: placeholder for actual dispatch)
    # In Phase 3, this will route to Finance Bee, Guardian Bee, etc.
    await asyncio.sleep(2)
    
    result = {
        "status": "success",
        "processed_by": f"{target_bee}_bee",
        "message": f"Task '{command}' completed successfully",
        "timestamp": datetime.now().isoformat()
    }
    
    logger.info(f"✅ Task [{task_id[:8]}...] completed!")
    return result


async def poll_for_tasks():
    """Poll Supabase for pending tasks and process them."""
    logger.info("🔍 Polling for pending tasks...")
    
    try:
        # Fetch pending tasks (oldest first, high priority first)
        response = supabase.table('colony_tasks') \
            .select('*') \
            .eq('status', 'pending') \
            .order('priority', desc=True) \
            .order('created_at', desc=False) \
            .limit(5) \
            .execute()
        
        tasks = response.data
        
        if not tasks:
            return 0
        
        logger.info(f"📥 Found {len(tasks)} pending task(s)")
        
        for task in tasks:
            task_id = task['id']
            
            # Update status to 'processing'
            supabase.table('colony_tasks').update({
                'status': 'processing',
                'updated_at': datetime.now().isoformat()
            }).eq('id', task_id).execute()
            
            logger.info(f"🐝 Received Task [{task_id[:8]}...]: {task['command']}")
            
            try:
                # Process the task
                result = await process_task(task)
                
                # Update status to 'completed' with result
                supabase.table('colony_tasks').update({
                    'status': 'completed',
                    'result': result,
                    'completed_at': datetime.now().isoformat(),
                    'updated_at': datetime.now().isoformat()
                }).eq('id', task_id).execute()
                
            except Exception as e:
                logger.error(f"❌ Task [{task_id[:8]}...] failed: {e}")
                
                # Update status to 'failed'
                supabase.table('colony_tasks').update({
                    'status': 'failed',
                    'result': {'error': str(e)},
                    'updated_at': datetime.now().isoformat()
                }).eq('id', task_id).execute()
        
        return len(tasks)
        
    except Exception as e:
        logger.error(f"❌ Polling error: {e}")
        return 0


async def main():
    """Main polling loop."""
    logger.info("🐝 Task Poller initializing...")
    logger.info(f"   Supabase: {'✅ Connected' if SUPABASE_URL else '❌ Missing'}")
    logger.info(f"   Poll Interval: {POLL_INTERVAL}s")
    logger.info("🚀 Task Poller is now watching for tasks...")
    logger.info("=" * 60)
    
    while True:
        try:
            processed = await poll_for_tasks()
            if processed == 0:
                # No tasks - quiet polling
                pass
        except KeyboardInterrupt:
            logger.info("👋 Task Poller shutting down...")
            break
        except Exception as e:
            logger.error(f"❌ Unexpected error: {e}")
        
        await asyncio.sleep(POLL_INTERVAL)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n👋 Goodbye!")
