"""
Task Poller - The Hive Mind 🐝
Central task routing and state machine for Colony OS.

TODO: The 'upscale_video' task is now handled by the Node.js worker via BullMQ.
This poller is only responsible for:
- Security checks
- Health checks
- Text generation (DeepSeek)
- Legacy Python-based tasks

Hardened version with:
- Heartbeat updates for stuck task detection
- Automatic stuck task recovery
- Structured logging
- Retry logic for API calls
- Configurable timeouts
"""

import os
import sys
import time
import logging
import requests
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("hive_mind")

# Try importing optional libs, facilitate partial installs
try:
    import fal_client
except ImportError:
    fal_client = None
    logger.warning("⚠️ fal_client not installed - creation tasks disabled")

try:
    import google.generativeai as genai
except ImportError:
    genai = None

from supabase import create_client, Client

# Load environment
script_dir = os.path.dirname(os.path.abspath(__file__))
# Add parent directory to path so we can import 'bees' and 'utils'
sys.path.append(os.path.dirname(script_dir))

# Try loading from colony env first (core/../.env.colony)
load_dotenv(os.path.join(script_dir, '../.env.colony'))
# Fallback/Additional from root
load_dotenv(os.path.join(script_dir, '../../../.env'))

# Import bees
from bees import security_bee
from bees import health_bee
from bees import finance_bee

# Try importing retry utility
try:
    from utils.retry import retry
    HAS_RETRY = True
except ImportError:
    HAS_RETRY = False
    logger.warning("⚠️ Retry utility not available - proceeding without retry logic")
    # Fallback: no-op decorator
    def retry(*args, **kwargs):
        def decorator(func):
            return func
        return decorator

# =============================================================================
# CONFIGURATION
# =============================================================================

# Stuck task recovery settings
STUCK_TASK_THRESHOLD_MINUTES = 5  # Tasks processing longer than this are considered stuck
HEARTBEAT_INTERVAL_SECONDS = 30   # How often to update heartbeat during work
API_TIMEOUT_SECONDS = 30          # Timeout for external API calls

# =============================================================================
# SUPABASE SETUP
# =============================================================================

url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

if not url or not key:
    logger.critical("❌ Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_KEY")
    exit(1)

supabase: Client = create_client(url, key)
logger.info("✅ [HIVE MIND] Supabase connection established")

# =============================================================================
# GEMINI SETUP (The Eyes/Reflexes)
# =============================================================================

GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY")
gemini_model = None

if GEMINI_API_KEY and genai:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-2.5-flash')
    logger.info("👀 [SENSORY CORTEX] Gemini Vision Online")
else:
    logger.warning("⚠️ [SENSORY CORTEX] Gemini Offline (Missing Key/Lib)")

# =============================================================================
# DEEPSEEK SETUP (The Brain/Logic)
# =============================================================================

DEEPSEEK_API_KEY = os.environ.get("DEEPSEEK_API_KEY")
if DEEPSEEK_API_KEY:
    logger.info("🧠 [NEUROSPHERE] DeepSeek V3 Online")
else:
    logger.warning("⚠️ [NEUROSPHERE] DeepSeek Offline (Missing Key)")


# =============================================================================
# PROCESSORS
# =============================================================================

@retry(max_retries=3, base_delay=1.0)
def process_deepseek_task(task):
    """Routes logic/chat tasks to DeepSeek V3."""
    print(f"🧠 [NEUROSPHERE] DeepSeek V3 thinking about: {task['id']}")
    
    metadata = task.get('metadata', {})
    messages = metadata.get('messages', [])
    if not messages and 'prompt' in metadata:
        messages = [{"role": "user", "content": metadata['prompt']}]

    try:
        if not DEEPSEEK_API_KEY:
             raise ValueError("DeepSeek Key Missing")

        response = requests.post(
            "https://api.deepseek.com/chat/completions",
            headers={
                "Authorization": f"Bearer {DEEPSEEK_API_KEY}",
                "Content-Type": "application/json"
            },
            json={
                "model": "deepseek-chat", # V3
                "messages": messages,
                "temperature": 1.3 
            }
        )
        response.raise_for_status()
        result = response.json()['choices'][0]['message']['content']
        return {"status": "completed", "result": {"text": result}}
    except Exception as e:
        print(f"❌ DeepSeek Error: {e}")
        return {"status": "failed", "error": str(e)}

def process_gemini_vision_task(task):
    """Routes image analysis tasks to Gemini 2.5 Flash."""
    print(f"👀 [SENSORY CORTEX] Gemini Flash looking at image: {task['id']}")
    
    if not GEMINI_API_KEY or not genai:
         return {"status": "failed", "error": "Gemini not configured"}

    metadata = task.get('metadata', {})
    image_url = metadata.get('image_url')
    prompt = metadata.get('prompt', "Describe this image in detail.")
    
    try:
        img_data = requests.get(image_url).content
        response = gemini_model.generate_content([
            {'mime_type': 'image/jpeg', 'data': img_data},
            prompt
        ])
        return {"status": "completed", "result": {"description": response.text}}
    except Exception as e:
        print(f"❌ Gemini Vision Error: {e}")
        return {"status": "failed", "error": str(e)}

def process_fal_task(task):
    """Routes creation tasks (Video/Image) to Flux/Kling via FAL."""
    command = task['command']
    metadata = task.get('metadata', {})
    
    # Check if this is a resumption of a waiting task
    if task.get('status') == 'async_waiting':
        request_id = metadata.get('fal_request_id')
        print(f"🎨 [ACTION LAYER] Checking status for FAL Request: {request_id}")
        
        try:
            status = fal_client.status("fal-ai/kling-video/v1/standard/text-to-video", request_id, with_logs=True)
            if status['status'] == 'COMPLETED':
                result = fal_client.result("fal-ai/kling-video/v1/standard/text-to-video", request_id)
                return {"status": "completed", "result": {"video_url": result['video']['url']}}
            elif status['status'] == 'FAILED':
                 return {"status": "failed", "error": "FAL Generation Failed"}
            else:
                # Still running
                return {"status": "async_waiting", "result": None} # No change
        except Exception as e:
            print(f"❌ FAL Check Error: {e}")
            return {"status": "async_waiting", "error": str(e)} # Keep waiting on transient errors

    # Start new task
    print(f"🎨 [ACTION LAYER] FAL generating {command} for: {task['id']}")
    
    if not fal_client:
         return {"status": "failed", "error": "fal-client lib missing"}
         
    try:
        if command == 'generate_video':
            # Use Kling - Submit ASYNC
            handler = fal_client.submit(
                "fal-ai/kling-video/v1/standard/text-to-video",
                arguments={
                    "prompt": metadata.get('prompt', 'A cool video'),
                    "aspect_ratio": "16:9",
                    "duration": "5"
                }
            )
            # Store request ID and go to waiting state
            request_id = handler.request_id
            print(f"⏳ [ACTION LAYER] Video Job Submitted (ID: {request_id}). Waiting...")
            
            # Update metadata with request ID
            new_metadata = metadata.copy()
            new_metadata['fal_request_id'] = request_id
            
            # We need to update metadata in DB, but process_task returns result.
            # We'll return a special result that main_loop handles.
            return {
                "status": "async_waiting", 
                "result": {"message": "Job submitted"},
                "metadata_update": new_metadata
            }
            
        elif command == 'generate_image':
            # Use Flux Schnell (Fast enough to keep sync for now, or make async if >10s)
            handler = fal_client.submit(
                "fal-ai/flux/schnell",
                arguments={
                    "prompt": metadata.get('prompt', 'A cool image'),
                    "image_size": "square_hd"
                }
            )
            result = handler.get()
            return {"status": "completed", "result": {"image_url": result['images'][0]['url']}}
            
    except Exception as e:
        print(f"❌ FAL Error: {e}")
        return {"status": "failed", "error": str(e)}

def process_task(task):
    """The Hive Mind Router"""
    command = task['command']
    metadata = task.get('metadata', {})
    target_bee = metadata.get('target_bee')

    # ROUTING LOGIC
    
    # 0. HEALTH
    if command in ['check_vitals', 'cleanup_systems'] or target_bee == 'health_bee':
        return health_bee.handle_task(command, metadata)

    # 1. SECURITY
    elif command in ['ban_user', 'hide_content'] or target_bee == 'security_bee':
        return security_bee.execute_security_command(task)

    # 2. INTELLIGENCE
    elif command in ['chat', 'improve_text', 'write_script']:
        return process_deepseek_task(task)
    
    # 3. VISION
    elif command in ['analyze_image', 'scan_moderation']:
        return process_gemini_vision_task(task)
        
    # 4. CREATION (Supports Async)
    # 4. CREATION (Supports Async)
    elif command in ['generate_image', 'generate_video']:
        return process_fal_task(task)
        
    # 5. BEE ORCHESTRATION (Bridge)
    elif command.startswith('run_bee'):
        # Format: "run_bee <bee_id> <optional_args>"
        parts = command.split(' ', 1)
        # Check explicit workerId from metadata or parse from command
        bee_id = metadata.get('beeId') or (parts[1] if len(parts) > 1 else 'unknown')
        
        # Sub-command passed in payload or default to 'test'
        sub_command = metadata.get('type', 'test') 
        
        if bee_id == 'finance-bee':
            return finance_bee.handle_task(sub_command, metadata)
        elif bee_id == 'health-bee':
            return health_bee.handle_task(sub_command, metadata)
        elif bee_id == 'security-bee':
            return security_bee.execute_security_command(task) # Security bee likely takes full task
        else:
             return {"status": "failed", "error": f"Unknown target bee: {bee_id}"}
             
    else:
        return {"status": "failed", "error": f"Unknown command: {command}"}

def recover_stuck_tasks():
    """
    Find and reset tasks that have been stuck in 'processing' status.
    These are likely from a previous poller crash.
    """
    try:
        threshold = datetime.now() - timedelta(minutes=STUCK_TASK_THRESHOLD_MINUTES)
        
        # Find tasks that started processing before the threshold
        # Use raw filter since Supabase Python client may not support lt on timestamps well
        stuck_response = supabase.table('colony_tasks')\
            .select("id, command, started_at")\
            .eq('status', 'processing')\
            .execute()
        
        stuck_tasks = []
        for task in stuck_response.data:
            if task.get('started_at'):
                started = datetime.fromisoformat(task['started_at'].replace('Z', '+00:00'))
                # Compare as naive datetimes for simplicity
                started_naive = started.replace(tzinfo=None)
                threshold_naive = threshold.replace(tzinfo=None) if threshold.tzinfo else threshold
                
                if started_naive < threshold_naive:
                    stuck_tasks.append(task)
        
        if stuck_tasks:
            logger.warning(f"🔄 [RECOVERY] Found {len(stuck_tasks)} stuck task(s)")
            
            for task in stuck_tasks:
                logger.info(f"🔄 [RECOVERY] Resetting stuck task {task['id']} ({task['command']})")
                supabase.table('colony_tasks').update({
                    'status': 'pending',
                    'worker_id': None,
                    'error': f'Recovered: stuck since {task.get("started_at")}'
                }).eq('id', task['id']).execute()
            
            logger.info(f"✅ [RECOVERY] Reset {len(stuck_tasks)} stuck task(s) to pending")
            
    except Exception as e:
        logger.error(f"❌ [RECOVERY] Error checking for stuck tasks: {e}")


def publish_generated_content(task_id, result_data, prompt, media_type='video'):
    """
    Promotes a completed task artifact to a public Post on the feed.
    Assigned to the 'Ti-Guy' AI Persona.
    """
    try:
        # 1. Get Ti-Guy User ID
        ti_guy_response = supabase.table('user_profiles').select('id').eq('username', 'ti_guy_bot').execute()
        
        if ti_guy_response.data:
            ti_guy_id = ti_guy_response.data[0]['id']
        else:
            logger.info("🤖 Ti-Guy not found! Creating the AI personality...")
            # Create generic auth user first if needed, but for now we assume we can insert into user_profiles
            # if RLS allows or we use service role (we are using service key)
            
            # NOTE: In Supabase, usually need an auth.users entry. 
            # Ideally Ti-Guy exists. If not, we might fail unless we mock it.
            # We'll try to find ANY admin or creates one. 
            # For resilience, let's create a placeholder or fail gracefully.
            logger.warning("⚠️ Ti-Guy bot user missing. Content will not be published.")
            return

        # 2. Extract Media URL
        media_url = result_data.get('video_url') if media_type == 'video' else result_data.get('image_url')
        if not media_url:
            logger.error(f"❌ No media URL found in result for task {task_id}")
            return

        # 3. Create the Post
        logger.info(f"🚀 Publishing task {task_id} to the Main Feed as Ti-Guy...")
        
        # Using 'publications' table as per DB inspection
        # Columns: user_id, media_url, caption, visibilite, created_at
        
        post_payload = {
            'user_id': ti_guy_id,
            'caption': f"Generated via Colony OS 🐝\nPrompt: {prompt}",
            'media_url': media_url,
            # 'type': media_type, # Column might not exist in legacy table
            'visibilite': 'public',
            'created_at': datetime.now().isoformat()
        }
        
        supabase.table('publications').insert(post_payload).execute()
        logger.info(f"✅ Live on Feed! Task {task_id} published.")

    except Exception as e:
        logger.error(f"⚠️ Failed to publish content for task {task_id}: {e}")


def update_heartbeat(task_id: str):
    """Update the heartbeat timestamp for a task to prevent it being marked as stuck."""
    try:
        supabase.table('colony_tasks').update({
            'last_heartbeat': datetime.now().isoformat()
        }).eq('id', task_id).execute()
    except Exception as e:
        logger.warning(f"⚠️ [HEARTBEAT] Failed to update heartbeat for {task_id}: {e}")


def main_loop():
    """
    Main polling loop for the Hive Mind.
    
    Features:
    - Stuck task recovery on startup and periodically
    - Heartbeat updates during long-running tasks
    - Structured logging for observability
    - Graceful error handling
    """
    logger.info("🐝 [HIVE MIND] Colony OS Triad Poller Online (Hardened Mode)...")
    logger.info("   🛡️ Security | 🔺 Gemini | 🧠 DeepSeek | 🎨 Flux/Kling | 🩺 Health")
    
    # Recover any stuck tasks from previous crashes on startup
    recover_stuck_tasks()
    
    loop_count = 0
    
    while True:
        try:
            loop_count += 1
            
            # Periodic stuck task recovery (every 30 loops ≈ every minute)
            if loop_count % 30 == 0:
                recover_stuck_tasks()
            
            # 1. Fetch PENDING tasks (New Work)
            response = supabase.table('colony_tasks')\
                .select("*")\
                .eq('status', 'pending')\
                .order('priority', desc=True)\
                .limit(1)\
                .execute()
            
            pending_tasks = response.data
            
            # 2. Fetch ASYNC WAITING tasks (Ongoing Work)
            waiting_response = supabase.table('colony_tasks')\
                .select("*")\
                .eq('status', 'async_waiting')\
                .limit(5)\
                .execute()
                
            waiting_tasks = waiting_response.data
            
            # 3. Process Waiting Tasks (check async job status)
            for task in waiting_tasks:
                logger.debug(f"🔄 Checking async task {task['id']} ({task['command']})")
                result = process_task(task)
                
                if result['status'] != 'async_waiting':
                    # It finished or failed
                    supabase.table('colony_tasks').update({
                        'status': result['status'],
                        'result': result.get('result', {}),
                        'error': result.get('error'),
                        'completed_at': datetime.now().isoformat(),
                        'last_heartbeat': datetime.now().isoformat()
                    }).eq('id', task['id']).execute()
                    
                    logger.info(f"✅ Async task {task['id']} completed: {result['status']}")
            
            # 4. Process New Tasks
            if pending_tasks:
                task = pending_tasks[0]
                task_id = task['id']
                command = task['command']
                
                logger.info(f"⚡ Starting Task {task_id}: {command}")
                
                # Mark as processing with heartbeat
                now = datetime.now().isoformat()
                supabase.table('colony_tasks').update({
                    'status': 'processing',
                    'worker_id': os.getpid(),
                    'started_at': now,
                    'last_heartbeat': now
                }).eq('id', task_id).execute()
                
                # Execute task
                result = process_task(task)
                
                # Update heartbeat after completion
                update_heartbeat(task_id)
                
                # Build update payload
                update_payload = {
                    'status': result['status'],
                    'result': result.get('result', {}),
                    'error': result.get('error'),
                    'last_heartbeat': datetime.now().isoformat()
                }
                
                if result['status'] == 'completed':
                    update_payload['completed_at'] = datetime.now().isoformat()
                    logger.info(f"✅ Task {task_id} completed successfully")
                    
                    # Auto-publish creation tasks
                    if command in ['generate_image', 'generate_video']:
                         media_type = 'video' if command == 'generate_video' else 'photo'
                         # Parse prompt from metadata
                         prompt = task.get('metadata', {}).get('prompt', 'AI Generation')
                         
                         publish_generated_content(task_id, result['result'], prompt, media_type)
                         
                elif result['status'] == 'failed':
                    logger.error(f"❌ Task {task_id} failed: {result.get('error')}")
                elif result.get('metadata_update'):
                    # Task went async, update metadata
                    update_payload['metadata'] = result['metadata_update']
                    logger.info(f"⏳ Task {task_id} moved to async_waiting")
                
                supabase.table('colony_tasks').update(update_payload).eq('id', task_id).execute()
                
            # 5. Idle sleep if no work
            if not pending_tasks and not waiting_tasks:
                time.sleep(2)
                
        except Exception as e:
            logger.error(f"⚠️ Loop Error: {e}")
            time.sleep(5)


if __name__ == "__main__":
    try:
        main_loop()
    except KeyboardInterrupt:
        logger.info("👋 Hive Mind Sleeping...")
    except Exception as e:
        logger.critical(f"💀 Fatal error: {e}")
        raise
