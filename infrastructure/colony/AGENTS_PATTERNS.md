# 🎨 Colony OS Agents - Design Patterns

**Status:** Production Patterns  
**Version:** 2.0.0

---

## 📋 Common Agent Patterns

### 1. **Simple Polling Agent**

```python
# Pattern: Poll → Process → Update
async def forage():
    tasks = await get_pending_tasks()
    for task in tasks:
        result = await process_task(task)
        await update_task_status(task['id'], 'completed', result)
```

### 2. **AI-Powered Agent**

```python
# Pattern: Prompt → AI → Result
async def process_task(task):
    prompt = build_prompt(task)
    response = await call_ai_model(prompt)
    return {"result": response}
```

### 3. **Tool-Using Agent**

```python
# Pattern: Request → Tools → Execute → Result
async def process_task(task):
    tools = task['metadata'].get('tools', [])
    tool_executor = task['metadata'].get('tool_executor')
    
    # Use Llama 4 Maverick with tools
    result = await process_llama_task(task)
    return result
```

### 4. **Multi-Step Workflow Agent**

```python
# Pattern: Chain of operations
async def process_task(task):
    # Step 1: Gather data
    data = await gather_data(task)
    
    # Step 2: Process with AI
    analysis = await analyze_with_ai(data)
    
    # Step 3: Execute actions
    actions = await execute_actions(analysis)
    
    # Step 4: Report results
    return {"data": data, "analysis": analysis, "actions": actions}
```

---

## 🏗️ Architecture Patterns

### Pattern: Agent Factory

```python
# utils/agent_factory.py
def create_agent(agent_type: str, config: dict):
    if agent_type == "llm":
        return LlmAgent(config)
    elif agent_type == "tool":
        return ToolAgent(config)
    elif agent_type == "hybrid":
        return HybridAgent(config)
    raise ValueError(f"Unknown agent type: {agent_type}")
```

### Pattern: Agent Registry

```python
# core/agent_registry.py
AGENT_REGISTRY = {
    "deepseek-bee": DeepSeekBee,
    "llama-bee": LlamaBee,
    "weather-agent": WeatherAgent,
}

def get_agent(agent_id: str):
    agent_class = AGENT_REGISTRY.get(agent_id)
    if agent_class:
        return agent_class()
    raise ValueError(f"Agent {agent_id} not found")
```

### Pattern: Agent Composition

```python
# Combine multiple agents
class CompositeAgent:
    def __init__(self):
        self.llm_agent = LlmAgent()
        self.tool_agent = ToolAgent()
        self.data_agent = DataAgent()
    
    async def process_task(self, task):
        # Use appropriate agent for each step
        if task['type'] == 'reasoning':
            return await self.llm_agent.process(task)
        elif task['type'] == 'action':
            return await self.tool_agent.process(task)
        elif task['type'] == 'data':
            return await self.data_agent.process(task)
```

---

## 🔄 State Management Patterns

### Pattern: Stateless Agent

```python
# No persistent state - each task is independent
async def process_task(task):
    # Process task without storing state
    return process_independent_task(task)
```

### Pattern: Stateful Agent

```python
# Maintain state across tasks
class StatefulAgent:
    def __init__(self):
        self.state = {}
        self.load_state()
    
    async def process_task(self, task):
        # Update state
        self.state[task['id']] = task
        self.save_state()
        
        # Process with context
        return process_with_context(task, self.state)
```

### Pattern: Database-Backed State

```python
# Store state in Supabase
async def process_task(task):
    # Load previous state
    state = await supabase.table('agent_state').select('*').eq('agent_id', agent_id).single()
    
    # Process with state
    result = process_with_state(task, state)
    
    # Save new state
    await supabase.table('agent_state').upsert({
        'agent_id': agent_id,
        'state': result['new_state']
    }).execute()
```

---

## 🛠️ Tool Integration Patterns

### Pattern: Tool Registry

```python
# Register tools at startup
TOOL_REGISTRY = {
    "get_weather": get_weather_tool,
    "search_db": search_database_tool,
    "send_email": send_email_tool,
}

def execute_tool(tool_name: str, args: dict):
    tool = TOOL_REGISTRY.get(tool_name)
    if tool:
        return tool(args)
    raise ValueError(f"Tool {tool_name} not found")
```

### Pattern: Tool Chain

```python
# Chain multiple tools
async def process_with_tool_chain(task):
    # Tool 1: Get data
    data = await execute_tool("get_data", {"query": task['query']})
    
    # Tool 2: Process data
    processed = await execute_tool("process_data", {"data": data})
    
    # Tool 3: Store result
    await execute_tool("store_result", {"result": processed})
    
    return processed
```

---

## 🧠 AI Model Patterns

### Pattern: Model Selection

```python
def select_model(task_type: str, complexity: str):
    if task_type == "reasoning" and complexity == "high":
        return "llama-4-maverick"  # Sovereign reasoning
    elif task_type == "reasoning":
        return "deepseek-r1"  # Standard reasoning
    elif task_type == "vision":
        return "gemini-2.5-flash"  # Vision tasks
    else:
        return "deepseek-chat"  # Default
```

### Pattern: Model Fallback

```python
async def call_with_fallback(prompt, primary_model, fallback_model):
    try:
        return await call_model(prompt, primary_model)
    except Exception as e:
        logger.warning(f"Primary model failed: {e}, using fallback")
        return await call_model(prompt, fallback_model)
```

### Pattern: Multi-Model Consensus

```python
async def get_consensus(prompt):
    # Call multiple models
    results = await Promise.allSettled([
        call_model(prompt, "llama-4-maverick"),
        call_model(prompt, "deepseek-r1"),
        call_model(prompt, "gemini-3-pro")
    ])
    
    # Find consensus
    return find_consensus(results)
```

---

## 🔐 Security Patterns

### Pattern: Input Validation

```python
def validate_task(task: dict) -> bool:
    required_fields = ['id', 'command', 'metadata']
    for field in required_fields:
        if field not in task:
            return False
    
    # Validate command
    allowed_commands = ['chat', 'analyze', 'generate']
    if task['command'] not in allowed_commands:
        return False
    
    return True
```

### Pattern: Rate Limiting

```python
from collections import defaultdict
from datetime import datetime, timedelta

class RateLimiter:
    def __init__(self, max_requests: int, window_seconds: int):
        self.max_requests = max_requests
        self.window = timedelta(seconds=window_seconds)
        self.requests = defaultdict(list)
    
    def check(self, key: str) -> bool:
        now = datetime.now()
        # Clean old requests
        self.requests[key] = [
            req_time for req_time in self.requests[key]
            if now - req_time < self.window
        ]
        
        if len(self.requests[key]) >= self.max_requests:
            return False
        
        self.requests[key].append(now)
        return True
```

### Pattern: Sanitization

```python
def sanitize_input(user_input: str) -> str:
    # Remove potentially dangerous content
    import html
    sanitized = html.escape(user_input)
    # Remove script tags
    import re
    sanitized = re.sub(r'<script.*?</script>', '', sanitized, flags=re.DOTALL)
    return sanitized
```

---

## 📊 Observability Patterns

### Pattern: Structured Logging

```python
import structlog

logger = structlog.get_logger()

async def process_task(task):
    logger.info(
        "task_processing",
        task_id=task['id'],
        command=task['command'],
        agent_id=agent_id
    )
    
    try:
        result = await do_work(task)
        logger.info(
            "task_completed",
            task_id=task['id'],
            duration=time.time() - start
        )
        return result
    except Exception as e:
        logger.error(
            "task_failed",
            task_id=task['id'],
            error=str(e),
            exc_info=True
        )
        raise
```

### Pattern: Metrics Collection

```python
class MetricsCollector:
    def __init__(self):
        self.metrics = {
            'tasks_processed': 0,
            'tasks_failed': 0,
            'avg_duration': 0,
        }
    
    def record_task(self, duration: float, success: bool):
        self.metrics['tasks_processed'] += 1
        if not success:
            self.metrics['tasks_failed'] += 1
        
        # Update average
        total = self.metrics['tasks_processed']
        current_avg = self.metrics['avg_duration']
        self.metrics['avg_duration'] = (
            (current_avg * (total - 1) + duration) / total
        )
```

---

## 🔄 Error Handling Patterns

### Pattern: Retry with Exponential Backoff

```python
import asyncio

async def retry_with_backoff(func, max_retries=3):
    for attempt in range(max_retries):
        try:
            return await func()
        except Exception as e:
            if attempt == max_retries - 1:
                raise
            
            wait_time = 2 ** attempt  # Exponential backoff
            await asyncio.sleep(wait_time)
            logger.warning(f"Retry {attempt + 1}/{max_retries} after {wait_time}s")
```

### Pattern: Circuit Breaker

```python
class CircuitBreaker:
    def __init__(self, failure_threshold=5, timeout=60):
        self.failure_threshold = failure_threshold
        self.timeout = timeout
        self.failures = 0
        self.last_failure_time = None
        self.state = "CLOSED"  # CLOSED, OPEN, HALF_OPEN
    
    async def call(self, func):
        if self.state == "OPEN":
            if time.time() - self.last_failure_time > self.timeout:
                self.state = "HALF_OPEN"
            else:
                raise Exception("Circuit breaker is OPEN")
        
        try:
            result = await func()
            if self.state == "HALF_OPEN":
                self.state = "CLOSED"
                self.failures = 0
            return result
        except Exception as e:
            self.failures += 1
            self.last_failure_time = time.time()
            if self.failures >= self.failure_threshold:
                self.state = "OPEN"
            raise
```

---

## 🎯 Best Practices Summary

1. **Use appropriate pattern** for your use case
2. **Keep agents focused** - One agent, one responsibility
3. **Handle errors gracefully** - Never crash the agent
4. **Log everything** - Observability is crucial
5. **Test patterns** - Verify your patterns work
6. **Document patterns** - Help others understand

---

**Choose the right pattern for your agent!** 🎨
