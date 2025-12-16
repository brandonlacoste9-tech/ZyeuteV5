"""
Retry Utility - Exponential Backoff Decorator 🔄
Provides resilient API call handling with configurable retry logic.

Usage:
    @retry(max_retries=3, base_delay=1.0)
    def my_api_call():
        response = requests.post(...)
        response.raise_for_status()
        return response.json()
"""

import time
import logging
import functools
from typing import Callable, Tuple, Type

logger = logging.getLogger("colony.retry")

# HTTP status codes that should trigger a retry
RETRYABLE_STATUS_CODES = {429, 500, 502, 503, 504}


def retry(
    max_retries: int = 3,
    base_delay: float = 1.0,
    max_delay: float = 30.0,
    exponential_base: float = 2.0,
    retryable_exceptions: Tuple[Type[Exception], ...] = (Exception,),
):
    """
    Decorator that retries a function with exponential backoff.
    
    Args:
        max_retries: Maximum number of retry attempts (default: 3)
        base_delay: Initial delay in seconds (default: 1.0)
        max_delay: Maximum delay cap in seconds (default: 30.0)
        exponential_base: Multiplier for each retry (default: 2.0)
        retryable_exceptions: Tuple of exception types to catch (default: all)
    
    Returns:
        Decorated function with retry logic
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            last_exception = None
            
            for attempt in range(max_retries + 1):
                try:
                    return func(*args, **kwargs)
                    
                except retryable_exceptions as e:
                    last_exception = e
                    
                    # Check if this is a requests response with retryable status
                    if hasattr(e, 'response') and e.response is not None:
                        status_code = e.response.status_code
                        if status_code not in RETRYABLE_STATUS_CODES:
                            # Non-retryable status code (e.g., 400, 401, 403)
                            raise
                    
                    if attempt < max_retries:
                        # Calculate delay with exponential backoff
                        delay = min(
                            base_delay * (exponential_base ** attempt),
                            max_delay
                        )
                        
                        logger.warning(
                            f"🔄 [RETRY] {func.__name__} failed (attempt {attempt + 1}/{max_retries + 1}): {e}"
                            f" | Retrying in {delay:.1f}s..."
                        )
                        
                        time.sleep(delay)
                    else:
                        logger.error(
                            f"❌ [RETRY] {func.__name__} failed after {max_retries + 1} attempts: {e}"
                        )
                        raise
            
            # Should not reach here, but just in case
            if last_exception:
                raise last_exception
                
        return wrapper
    return decorator


def retry_with_result(
    max_retries: int = 3,
    base_delay: float = 1.0,
    should_retry: Callable[[any], bool] = None,
):
    """
    Decorator that retries based on return value rather than exceptions.
    Useful for functions that return status dicts instead of raising.
    
    Args:
        max_retries: Maximum number of retry attempts
        base_delay: Initial delay in seconds
        should_retry: Function that takes result and returns True if should retry
    
    Example:
        @retry_with_result(should_retry=lambda r: r.get('status') == 'failed')
        def my_task():
            return {"status": "failed", "error": "Temporary issue"}
    """
    def decorator(func: Callable) -> Callable:
        @functools.wraps(func)
        def wrapper(*args, **kwargs):
            for attempt in range(max_retries + 1):
                result = func(*args, **kwargs)
                
                if should_retry and should_retry(result) and attempt < max_retries:
                    delay = base_delay * (2 ** attempt)
                    logger.warning(
                        f"🔄 [RETRY] {func.__name__} returned retryable result "
                        f"(attempt {attempt + 1}/{max_retries + 1}) | Retrying in {delay:.1f}s..."
                    )
                    time.sleep(delay)
                else:
                    return result
            
            return result
        return wrapper
    return decorator
