"""
Health Bee - The Doctor 🩺
System health monitoring and maintenance tasks.

Hardened version with:
- Cross-platform disk path detection (Windows/Linux/Mac)
- Error handling for systems without certain sensors
- Structured logging
"""

import os
import logging
import platform
import time
from datetime import datetime

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s | %(levelname)s | %(name)s | %(message)s'
)
logger = logging.getLogger("health_bee")

# Try importing psutil (may not be available on all systems)
try:
    import psutil
    HAS_PSUTIL = True
except ImportError:
    psutil = None
    HAS_PSUTIL = False
    logger.warning("⚠️ psutil not available - system metrics will be limited")

# Try importing requests
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    requests = None
    HAS_REQUESTS = False
    logger.warning("⚠️ requests not available - API health checks disabled")


def get_root_path() -> str:
    """Get the root path for disk usage in a cross-platform way."""
    system = platform.system()
    
    if system == "Windows":
        # Use the drive where Python is installed, or C:\ as fallback
        return os.environ.get("SystemDrive", "C:") + "\\"
    else:
        # Linux, macOS, BSD, etc.
        return "/"


def get_system_metrics() -> dict:
    """
    Safely collect system metrics with error handling.
    Returns partial data if some metrics aren't available.
    """
    metrics = {
        "platform": platform.system(),
        "platform_release": platform.release(),
        "cpu_usage_percent": None,
        "memory_usage_percent": None,
        "disk_usage_percent": None,
        "errors": []
    }
    
    if not HAS_PSUTIL:
        metrics["errors"].append("psutil not available")
        return metrics
    
    # CPU usage
    try:
        metrics["cpu_usage_percent"] = psutil.cpu_percent(interval=1)
    except Exception as e:
        metrics["errors"].append(f"cpu: {str(e)}")
        logger.warning(f"⚠️ Could not read CPU usage: {e}")
    
    # Memory usage
    try:
        memory = psutil.virtual_memory()
        metrics["memory_usage_percent"] = memory.percent
    except Exception as e:
        metrics["errors"].append(f"memory: {str(e)}")
        logger.warning(f"⚠️ Could not read memory usage: {e}")
    
    # Disk usage (with cross-platform path)
    try:
        root_path = get_root_path()
        disk = psutil.disk_usage(root_path)
        metrics["disk_usage_percent"] = disk.percent
        metrics["disk_path"] = root_path
    except Exception as e:
        metrics["errors"].append(f"disk: {str(e)}")
        logger.warning(f"⚠️ Could not read disk usage: {e}")
    
    return metrics


def check_api_health(server_url: str) -> dict:
    """Check if the API server is responding."""
    result = {
        "status": "unknown",
        "latency_ms": 0
    }
    
    if not HAS_REQUESTS:
        result["status"] = "check_disabled"
        return result
    
    try:
        start_time = time.time()
        response = requests.get(f"{server_url}/api/health", timeout=5)
        latency = (time.time() - start_time) * 1000
        
        result["latency_ms"] = round(latency, 2)
        
        if response.ok:
            result["status"] = "nominal"
        else:
            result["status"] = f"degraded: HTTP {response.status_code}"
            
    except requests.Timeout:
        result["status"] = "degraded: timeout"
    except requests.ConnectionError:
        result["status"] = "degraded: connection_failed"
    except Exception as e:
        result["status"] = f"degraded: {str(e)}"
    
    return result


def check_vitals(metadata: dict) -> dict:
    """
    Performs a comprehensive system health check.
    
    Checks:
    - CPU usage
    - Memory usage  
    - Disk usage
    - API health endpoint
    """
    logger.info("🩺 [DOCTOR] Checking system vitals...")
    
    server_url = os.getenv("VITE_API_URL", "http://localhost:5000")
    
    # Collect metrics
    system_metrics = get_system_metrics()
    api_health = check_api_health(server_url)
    
    report = {
        "timestamp": datetime.now().isoformat(),
        "system": system_metrics,
        "api": api_health
    }
    
    # Log summary
    cpu = system_metrics.get("cpu_usage_percent", "N/A")
    memory = system_metrics.get("memory_usage_percent", "N/A")
    api_status = api_health.get("status", "unknown")
    
    logger.info(f"🩺 [DOCTOR] Vitals: CPU {cpu}% | RAM {memory}% | API {api_status}")
    
    return {"status": "success", "result": report}


def cleanup_systems(metadata: dict) -> dict:
    """
    Placeholder for maintenance tasks.
    
    Future implementations:
    - Clear temporary files
    - Rotate logs
    - Vacuum database
    - Archive old records
    """
    logger.info("🧹 [DOCTOR] Running cleanup protocols...")
    
    # Simulation - in production, this would:
    # - Clear /tmp or %TEMP%
    # - Rotate log files
    # - Run VACUUM on PostgreSQL
    time.sleep(1)
    
    logger.info("✅ [DOCTOR] Cleanup complete")
    return {"status": "success", "result": "Systems cleaned and optimized."}


def handle_task(command: str, metadata: dict) -> dict:
    """
    Main dispatcher for Health Bee commands.
    
    Supported commands:
    - check_vitals: System health check
    - cleanup_systems: Maintenance tasks
    """
    logger.info(f"🩺 [DOCTOR] Handling command: {command}")
    
    if command == 'check_vitals':
        return check_vitals(metadata)
    elif command == 'cleanup_systems':
        return cleanup_systems(metadata)
    else:
        logger.warning(f"⚠️ Unknown health command: {command}")
        return {"status": "failed", "error": f"Unknown health command: {command}"}
