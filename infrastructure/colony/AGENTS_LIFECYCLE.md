# 🔄 Colony OS Agents - Lifecycle Management

**Status:** Production Guide  
**Version:** 2.0.0

---

## 📋 Agent Lifecycle Overview

Agents in Colony OS follow a well-defined lifecycle with hooks for initialization, execution, and cleanup.

---

## 🔄 Lifecycle Stages

### 1. **Initialization** (`onStartup`)

```python
# Python Agent
async def onStartup():
    """Called once when agent starts"""
    # Initialize connections
    await connect_to_database()
    await load_configuration()
    
    # Register tools
    register_tools()
    
    logger.info("Agent initialized")

# TypeScript Agent
public async onStartup() {
    console.log(`🤖 [${this.agentId}] Initializing...`);
    await this.connectToDatabase();
    await this.loadConfiguration();
}
```

### 2. **Start** (`onStart`)

```python
async def onStart():
    """Called when agent starts polling"""
    logger.info("Agent started, beginning to poll for tasks")
    # Start background tasks if needed
    asyncio.create_task(background_health_check())
```

### 3. **Polling Loop** (`forage`)

```python
async def forage():
    """Repeatedly called to poll for tasks"""
    tasks = await get_pending_tasks()
    for task in tasks:
        await process_task(task)
```

### 4. **Task Processing** (`processTask`)

```python
async def process_task(task: dict):
    """Process individual task"""
    try:
        result = await do_work(task)
        await update_task_status(task['id'], 'completed', result)
    except Exception as e:
        await update_task_status(task['id'], 'failed', {"error": str(e)})
```

### 5. **Stop** (`onStop`)

```python
async def onStop():
    """Called when agent stops"""
    # Cleanup active tasks
    await cancel_active_tasks()
    logger.info("Agent stopped")
```

### 6. **Shutdown** (`onShutdown`)

```python
async def onShutdown():
    """Final cleanup before agent exits"""
    # Close connections
    await close_database_connection()
    await save_state()
    
    logger.info("Agent shutdown complete")
```

---

## 🏗️ Lifecycle Implementation Patterns

### Pattern: Graceful Shutdown

```python
import signal
import asyncio

class GracefulShutdown:
    def __init__(self, agent):
        self.agent = agent
        self.shutdown_requested = False
        
        # Register signal handlers
        signal.signal(signal.SIGINT, self.handle_shutdown)
        signal.signal(signal.SIGTERM, self.handle_shutdown)
    
    def handle_shutdown(self, signum, frame):
        logger.info("Shutdown signal received")
        self.shutdown_requested = True
        asyncio.create_task(self.agent.stop())
    
    async def wait_for_shutdown(self):
        while not self.shutdown_requested:
            await asyncio.sleep(1)
```

### Pattern: Health Monitoring

```python
class HealthMonitor:
    def __init__(self, agent):
        self.agent = agent
        self.last_heartbeat = time.time()
        self.is_healthy = True
    
    async def monitor(self):
        while True:
            await asyncio.sleep(30)  # Check every 30s
            
            # Check if agent is responsive
            if time.time() - self.last_heartbeat > 60:
                self.is_healthy = False
                logger.error("Agent health check failed")
            else:
                self.is_healthy = True
    
    def heartbeat(self):
        self.last_heartbeat = time.time()
```

### Pattern: State Persistence

```python
class StatefulAgent:
    def __init__(self):
        self.state = {}
        self.state_file = "agent_state.json"
    
    async def onStartup(self):
        # Load state
        if os.path.exists(self.state_file):
            with open(self.state_file, 'r') as f:
                self.state = json.load(f)
        logger.info(f"Loaded state: {len(self.state)} items")
    
    async def onShutdown(self):
        # Save state
        with open(self.state_file, 'w') as f:
            json.dump(self.state, f)
        logger.info("State saved")
    
    def update_state(self, key: str, value: any):
        self.state[key] = value
        # Optionally save immediately
        self.save_state_async()
```

---

## 🔄 Task Processing Lifecycle

### Single Task Flow

```
Task Created (Supabase)
    ↓
Agent Polls (forage)
    ↓
Task Retrieved
    ↓
Mark as Processing
    ↓
processTask()
    ├─ Validate task
    ├─ Execute logic
    └─ Generate result
    ↓
Update Task Status
    ├─ Success → 'completed'
    └─ Failure → 'failed'
    ↓
Return Result
```

### Async Task Flow

```
Task Created
    ↓
Mark as 'async_waiting'
    ↓
Submit to External Service
    ↓
Store Request ID
    ↓
Poll for Completion
    ↓
Check Status
    ├─ Pending → Continue waiting
    └─ Complete → Update task
    ↓
Mark as 'completed'
```

---

## 🛡️ Error Recovery Patterns

### Pattern: Task Retry

```python
async def process_task_with_retry(task, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await process_task(task)
        except TransientError as e:
            if attempt == max_retries - 1:
                raise
            await asyncio.sleep(2 ** attempt)  # Exponential backoff
            logger.warning(f"Retry {attempt + 1}/{max_retries}")
```

### Pattern: Dead Letter Queue

```python
async def process_task(task):
    try:
        return await do_work(task)
    except Exception as e:
        # Move to dead letter queue after max retries
        if task.get('retry_count', 0) >= MAX_RETRIES:
            await move_to_dlq(task, str(e))
        else:
            # Increment retry count and reschedule
            task['retry_count'] = task.get('retry_count', 0) + 1
            await reschedule_task(task)
        raise
```

### Pattern: Circuit Breaker

```python
class AgentCircuitBreaker:
    def __init__(self):
        self.failures = 0
        self.state = "CLOSED"
    
    async def process_with_circuit_breaker(self, task):
        if self.state == "OPEN":
            raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await process_task(task)
            self.failures = 0
            self.state = "CLOSED"
            return result
        except Exception as e:
            self.failures += 1
            if self.failures >= 5:
                self.state = "OPEN"
            raise
```

---

## 📊 Monitoring & Observability

### Pattern: Lifecycle Logging

```python
import structlog

logger = structlog.get_logger()

class LifecycleLogger:
    async def onStartup(self):
        logger.info("agent_startup", agent_id=self.agent_id)
    
    async def onStart(self):
        logger.info("agent_started", agent_id=self.agent_id)
    
    async def forage(self):
        logger.debug("agent_foraging", agent_id=self.agent_id)
    
    async def process_task(self, task):
        logger.info(
            "task_processing",
            agent_id=self.agent_id,
            task_id=task['id'],
            command=task['command']
        )
    
    async def onStop(self):
        logger.info("agent_stopped", agent_id=self.agent_id)
    
    async def onShutdown(self):
        logger.info("agent_shutdown", agent_id=self.agent_id)
```

### Pattern: Metrics Collection

```python
class AgentMetrics:
    def __init__(self):
        self.metrics = {
            'tasks_processed': 0,
            'tasks_failed': 0,
            'uptime_seconds': 0,
            'avg_processing_time': 0
        }
        self.start_time = time.time()
    
    def record_task(self, duration: float, success: bool):
        self.metrics['tasks_processed'] += 1
        if not success:
            self.metrics['tasks_failed'] += 1
        
        # Update average
        total = self.metrics['tasks_processed']
        current_avg = self.metrics['avg_processing_time']
        self.metrics['avg_processing_time'] = (
            (current_avg * (total - 1) + duration) / total
        )
    
    def get_metrics(self):
        self.metrics['uptime_seconds'] = time.time() - self.start_time
        return self.metrics
```

---

## 🔧 Configuration Management

### Pattern: Environment-Based Config

```python
class AgentConfig:
    def __init__(self):
        self.poll_interval = int(os.getenv('AGENT_POLL_INTERVAL', '5000'))
        self.max_concurrent_tasks = int(os.getenv('MAX_CONCURRENT_TASKS', '5'))
        self.timeout_seconds = int(os.getenv('TASK_TIMEOUT', '30'))
        self.retry_count = int(os.getenv('MAX_RETRIES', '3'))
```

### Pattern: Dynamic Configuration

```python
class DynamicConfig:
    def __init__(self):
        self.config = {}
        self.load_from_database()
    
    async def load_from_database(self):
        """Load config from Supabase"""
        result = supabase.table('agent_config')\
            .select('*')\
            .eq('agent_id', agent_id)\
            .single()\
            .execute()
        
        self.config = result.data
    
    async def update_config(self, key: str, value: any):
        """Update config in database"""
        await supabase.table('agent_config')\
            .upsert({
                'agent_id': agent_id,
                key: value
            })\
            .execute()
        
        self.config[key] = value
```

---

## 🚨 Failure Handling

### Pattern: Graceful Degradation

```python
async def process_task(task):
    try:
        # Try primary method
        return await primary_method(task)
    except PrimaryError:
        logger.warning("Primary method failed, using fallback")
        try:
            # Fallback method
            return await fallback_method(task)
        except FallbackError:
            # Last resort
            return {"status": "degraded", "message": "Limited functionality"}
```

### Pattern: Task Recovery

```python
async def recover_stuck_tasks():
    """Recover tasks stuck in 'processing' state"""
    stuck_tasks = await supabase.table('colony_tasks')\
        .select('*')\
        .eq('status', 'processing')\
        .lt('updated_at', datetime.now() - timedelta(minutes=5))\
        .execute()
    
    for task in stuck_tasks.data:
        logger.warning(f"Recovering stuck task: {task['id']}")
        await supabase.table('colony_tasks')\
            .update({'status': 'pending'})\
            .eq('id', task['id'])\
            .execute()
```

---

## ✅ Best Practices

1. **Always implement lifecycle hooks** - onStartup, onShutdown, etc.
2. **Handle errors gracefully** - Never crash the agent
3. **Save state on shutdown** - Preserve important data
4. **Monitor health** - Track agent status
5. **Log lifecycle events** - Observability is key
6. **Clean up resources** - Close connections, files, etc.
7. **Test lifecycle** - Verify all hooks work

---

## 🔗 Integration with Colony OS

- **Task Poller** - Manages agent lifecycle
- **Health Bee** - Monitors agent health
- **Supabase** - Stores agent state and tasks

---

**Manage agent lifecycle effectively!** 🔄
