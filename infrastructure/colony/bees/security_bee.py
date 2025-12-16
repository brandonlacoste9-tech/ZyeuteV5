"""
Security Bee - The Guardian 🛡️
Handles user bans, content moderation, and security enforcement.

Hardened version with:
- Proper exception handling (no bare except)
- Input validation for all IDs
- Structured logging for audit trail
"""

import os
import re
import logging
from datetime import datetime
from supabase import create_client, Client

# Configure structured logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("security_bee")

# Initialize dedicated Security Client (Service Role)
# This requires SUPABASE_SERVICE_KEY in .env.colony
url: str = os.environ.get("VITE_SUPABASE_URL")
key: str = os.environ.get("SUPABASE_SERVICE_KEY")

_supabase: Client = None


def get_supabase() -> Client:
    """Lazy-load Supabase client with service role credentials."""
    global _supabase
    if not _supabase:
        if not url or not key:
            raise ValueError("Missing Supabase credentials for Security Bee")
        _supabase = create_client(url, key)
    return _supabase


def validate_uuid(value: str, field_name: str) -> bool:
    """Validate that a value is a valid UUID format."""
    if not value:
        logger.error(f"🛡️ [VALIDATION] Missing required field: {field_name}")
        return False
    
    uuid_pattern = re.compile(
        r'^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$',
        re.IGNORECASE
    )
    
    if not uuid_pattern.match(str(value)):
        logger.error(f"🛡️ [VALIDATION] Invalid UUID format for {field_name}: {value}")
        return False
    
    return True


def sanitize_table_name(table: str) -> str:
    """Sanitize table name to prevent injection - only allow alphanumeric and underscore."""
    if not table or not re.match(r'^[a-zA-Z_][a-zA-Z0-9_]*$', table):
        return 'posts'  # Default to safe value
    return table


def ban_user(task: dict) -> dict:
    """
    Soft-deletes a user from Auth (prevents login) and marks profile as banned.
    
    Args:
        task: Task dict with metadata containing target_id and optional reason
        
    Returns:
        Result dict with status, result/error
    """
    metadata = task.get('metadata', {})
    user_id = metadata.get('target_id')
    reason = metadata.get('reason', 'Banned by Guardian')
    task_id = task.get('id', 'unknown')
    
    # Input validation
    if not validate_uuid(user_id, 'target_id'):
        return {"status": "failed", "error": "Invalid or missing user_id"}
    
    # Audit log
    logger.info(f"🛡️ [SECURITY] BAN_USER | task={task_id} | user={user_id} | reason={reason}")
    
    client = get_supabase()

    try:
        # 1. Block Login (Soft Delete in Auth)
        client.auth.admin.delete_user(user_id)
        logger.info(f"🛡️ [SECURITY] Auth disabled for user {user_id}")
        
        # 2. Mark Profile in Public Table (for UI)
        try:
            client.table('user_profiles').update({
                'is_banned': True,
                'ban_reason': reason,
                'banned_at': datetime.now().isoformat()
            }).eq('id', user_id).execute()
            logger.info(f"🛡️ [SECURITY] Profile marked as banned for user {user_id}")
        except Exception as profile_err:
            # Log but don't fail - auth is already disabled
            logger.warning(f"🛡️ [SECURITY] Could not update user_profiles: {profile_err}")
        
        logger.info(f"✅ [SECURITY] BAN_USER completed | user={user_id}")
        return {"status": "completed", "result": {"message": f"User {user_id} banned."}}
        
    except Exception as e:
        logger.error(f"❌ [SECURITY] BAN_USER failed | user={user_id} | error={e}")
        return {"status": "failed", "error": str(e)}


def hide_content(task: dict) -> dict:
    """
    Hides a post or comment from public view.
    
    Args:
        task: Task dict with metadata containing target_id and content_type
        
    Returns:
        Result dict with status, result/error
    """
    metadata = task.get('metadata', {})
    content_id = metadata.get('target_id')
    raw_table = metadata.get('content_type', 'posts')
    task_id = task.get('id', 'unknown')
    
    # Input validation
    if not validate_uuid(content_id, 'target_id'):
        return {"status": "failed", "error": "Invalid or missing content_id"}
    
    # Sanitize table name (prevent SQL injection via table name)
    table = sanitize_table_name(raw_table)
    
    # Audit log
    logger.info(f"🛡️ [SECURITY] HIDE_CONTENT | task={task_id} | table={table} | id={content_id}")
    
    client = get_supabase()
    
    try:
        client.table(table).update({
            'visibility': 'hidden',
            'moderation_status': 'flagged_by_ai',
            'hidden_at': datetime.now().isoformat()
        }).eq('id', content_id).execute()
        
        logger.info(f"✅ [SECURITY] HIDE_CONTENT completed | {table}/{content_id}")
        return {"status": "completed", "result": {"message": f"Content {content_id} hidden."}}
        
    except Exception as e:
        logger.error(f"❌ [SECURITY] HIDE_CONTENT failed | {table}/{content_id} | error={e}")
        return {"status": "failed", "error": str(e)}


def execute_security_command(task: dict) -> dict:
    """
    Main dispatcher for security commands.
    
    Supported commands:
    - ban_user: Disable user authentication and mark profile
    - hide_content: Hide a post or comment from public view
    """
    command = task.get('command')
    task_id = task.get('id', 'unknown')
    
    logger.info(f"🛡️ [SECURITY] Executing command: {command} | task={task_id}")
    
    if command == 'ban_user':
        return ban_user(task)
    elif command == 'hide_content':
        return hide_content(task)
    else:
        logger.warning(f"🛡️ [SECURITY] Unknown command: {command}")
        return {"status": "failed", "error": f"Unknown security command: {command}"}
