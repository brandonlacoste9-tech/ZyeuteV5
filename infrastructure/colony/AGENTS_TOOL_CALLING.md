# 🔧 Colony OS Agents - Tool Calling Guide

**Status:** Production-Ready  
**Integration:** Llama 4 Maverick + OpenAI-style tools

---

## 🎯 Overview

Agents in Colony OS can use **tools** to interact with external systems, databases, APIs, and services. This guide covers tool calling patterns for agents.

---

## 🚀 Quick Start: Agent with Tools

### Python Agent with Tools

```python
# bees/my_tool_agent.py
from fastapi import FastAPI
from supabase import create_client
import os

app = FastAPI()
supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Define your tools
def execute_tool(tool_name: str, args: dict) -> any:
    """Tool executor function"""
    if tool_name == "search_posts":
        query = args.get("query")
        results = supabase.table("posts").select("*").ilike("content", f"%{query}%").execute()
        return {"count": len(results.data), "posts": results.data}
    
    elif tool_name == "get_user":
        user_id = args.get("user_id")
        user = supabase.table("users").select("*").eq("id", user_id).single().execute()
        return user.data
    
    raise ValueError(f"Unknown tool: {tool_name}")

@app.post("/process")
async def process_task(task: dict):
    """Process task with tool calling"""
    metadata = task.get('metadata', {})
    
    # Use Llama 4 Maverick with tools
    if metadata.get('use_llama'):
        from core.task_poller import process_llama_task
        
        # Add tool executor to metadata
        metadata['tool_executor'] = execute_tool
        
        result = await process_llama_task(task)
        return result
    
    return {"status": "failed", "error": "Tool calling not configured"}
```

### TypeScript Agent with Tools

```typescript
// zyeute/packages/kernel-node/src/bees/ToolAgent.ts
import { LlmAgent } from '../lib/agents/LlmAgent.js';
import { AgentTask } from '../lib/agents/BaseAgent.js';
import { neurosphere } from '../lib/ai/deepseek.js';

export class ToolAgent extends LlmAgent {
  constructor() {
    super('tool_agent_01', neurosphere);
    
    // Register tools
    this.registerTool({
      name: "search_posts",
      description: "Search posts in database",
      inputSchema: {
        type: 'object',
        properties: {
          query: { type: 'string', description: "Search query" }
        },
        required: ['query']
      }
    });
  }

  protected async processTask(task: AgentTask) {
    // Use tools with AI reasoning
    const tools = this.tools.map(tool => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema
      }
    }));

    const response = await this.think(
      [
        { role: 'user', content: task.payload.prompt },
        { role: 'system', content: `Available tools: ${JSON.stringify(tools)}` }
      ],
      task.id
    );
    
    return response;
  }
}
```

---

## 🛠️ Tool Definition Patterns

### Pattern 1: Database Query Tool

```python
def query_database_tool(tool_name: str, args: dict):
    if tool_name == "query_posts":
        query = args.get("query")
        limit = args.get("limit", 10)
        
        results = supabase.table("posts")\
            .select("*")\
            .ilike("content", f"%{query}%")\
            .limit(limit)\
            .execute()
        
        return {
            "count": len(results.data),
            "posts": results.data
        }
    
    elif tool_name == "get_user_profile":
        user_id = args.get("user_id")
        user = supabase.table("users")\
            .select("*")\
            .eq("id", user_id)\
            .single()\
            .execute()
        
        return user.data
    
    raise ValueError(f"Unknown tool: {tool_name}")

tools = [
    {
        "type": "function",
        "function": {
            "name": "query_posts",
            "description": "Search posts in the database",
            "parameters": {
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search query"},
                    "limit": {"type": "number", "description": "Max results", "default": 10}
                },
                "required": ["query"]
            }
        }
    },
    {
        "type": "function",
        "function": {
            "name": "get_user_profile",
            "description": "Get user profile by ID",
            "parameters": {
                "type": "object",
                "properties": {
                    "user_id": {"type": "string", "description": "User UUID"}
                },
                "required": ["user_id"]
            }
        }
    }
]
```

### Pattern 2: API Integration Tool

```python
import httpx

def api_tool(tool_name: str, args: dict):
    if tool_name == "get_weather":
        location = args.get("location")
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"https://api.weather.com/v1/current",
                params={"location": location}
            )
            return response.json()
    
    elif tool_name == "send_notification":
        user_id = args.get("user_id")
        message = args.get("message")
        
        # Send via your notification service
        await send_push_notification(user_id, message)
        return {"status": "sent", "user_id": user_id}
    
    raise ValueError(f"Unknown tool: {tool_name}")
```

### Pattern 3: File System Tool

```python
import os
import json

def file_tool(tool_name: str, args: dict):
    if tool_name == "read_file":
        file_path = args.get("path")
        if not os.path.exists(file_path):
            return {"error": "File not found"}
        
        with open(file_path, 'r') as f:
            content = f.read()
        return {"content": content, "path": file_path}
    
    elif tool_name == "write_file":
        file_path = args.get("path")
        content = args.get("content")
        
        os.makedirs(os.path.dirname(file_path), exist_ok=True)
        with open(file_path, 'w') as f:
            f.write(content)
        
        return {"status": "written", "path": file_path}
    
    raise ValueError(f"Unknown tool: {tool_name}")
```

---

## 🔄 Tool Calling Flow

### With Llama 4 Maverick

```
1. Agent receives task with tools
   ↓
2. Task routed to process_llama_task()
   ↓
3. Llama 4 Maverick receives prompt + tools
   ↓
4. Model decides to use tool
   ↓
5. Tool call detected in response
   ↓
6. execute_tool() called with tool name + args
   ↓
7. Tool result sent back to model
   ↓
8. Model generates final response
   ↓
9. Result returned to agent
```

---

## 📋 Tool Schema Best Practices

### ✅ Good Tool Schema

```python
{
    "type": "function",
    "function": {
        "name": "search_posts",
        "description": "Search posts in the database. Returns up to 10 matching posts.",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Search query text. Supports partial matches."
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return",
                    "minimum": 1,
                    "maximum": 50,
                    "default": 10
                },
                "sort_by": {
                    "type": "string",
                    "enum": ["created_at", "likes", "views"],
                    "description": "Sort order for results",
                    "default": "created_at"
                }
            },
            "required": ["query"]
        }
    }
}
```

### ❌ Bad Tool Schema

```python
{
    "name": "search",  # Missing type and function wrapper
    "params": {...}     # Wrong parameter name
}
```

---

## 🔐 Security Considerations

### Input Validation

```python
def validate_tool_args(tool_name: str, args: dict) -> bool:
    """Validate tool arguments before execution"""
    
    if tool_name == "query_posts":
        # Validate query
        query = args.get("query")
        if not query or len(query) < 2:
            return False
        
        # Validate limit
        limit = args.get("limit", 10)
        if limit > 50:  # Prevent excessive queries
            return False
        
        return True
    
    return False
```

### Sanitization

```python
def sanitize_tool_input(args: dict) -> dict:
    """Sanitize tool input to prevent injection"""
    import html
    sanitized = {}
    
    for key, value in args.items():
        if isinstance(value, str):
            # Escape HTML
            sanitized[key] = html.escape(value)
            # Remove SQL injection patterns
            sanitized[key] = sanitized[key].replace("'", "''")
        else:
            sanitized[key] = value
    
    return sanitized
```

### Rate Limiting

```python
from collections import defaultdict
from datetime import datetime, timedelta

tool_rate_limits = defaultdict(lambda: {"count": 0, "reset_time": datetime.now()})

def check_rate_limit(tool_name: str, max_calls: int = 10, window_seconds: int = 60) -> bool:
    """Check if tool can be called"""
    now = datetime.now()
    limit = tool_rate_limits[tool_name]
    
    if now > limit["reset_time"]:
        limit["count"] = 0
        limit["reset_time"] = now + timedelta(seconds=window_seconds)
    
    if limit["count"] >= max_calls:
        return False
    
    limit["count"] += 1
    return True
```

---

## 🧪 Testing Tools

### Unit Test Example

```python
import pytest

def test_query_posts_tool():
    """Test database query tool"""
    tool_executor = query_database_tool
    
    result = tool_executor("query_posts", {"query": "poutine", "limit": 5})
    
    assert "count" in result
    assert "posts" in result
    assert isinstance(result["posts"], list)
    assert len(result["posts"]) <= 5
```

### Integration Test

```python
async def test_agent_with_tools():
    """Test agent with tool calling"""
    task = {
        "command": "sovereign_reasoning",
        "metadata": {
            "prompt": "Find posts about poutine",
            "tools": [{
                "type": "function",
                "function": {
                    "name": "query_posts",
                    "description": "Search posts",
                    "parameters": {...}
                }
            }],
            "tool_executor": query_database_tool
        }
    }
    
    result = await process_llama_task(task)
    
    assert result["status"] == "completed"
    assert "text" in result["result"]
    assert result["result"].get("tool_calls") is not None
```

---

## 📊 Tool Usage Tracking

```python
class ToolUsageTracker:
    def __init__(self):
        self.usage = defaultdict(lambda: {"count": 0, "errors": 0})
    
    def record_tool_call(self, tool_name: str, success: bool):
        self.usage[tool_name]["count"] += 1
        if not success:
            self.usage[tool_name]["errors"] += 1
    
    def get_stats(self):
        return dict(self.usage)
```

---

## 🎯 Best Practices

1. **Clear descriptions** - Help model understand when to use tools
2. **Validate inputs** - Always validate tool arguments
3. **Handle errors** - Return error messages, don't crash
4. **Rate limit** - Prevent abuse of tools
5. **Log tool usage** - Track what tools are being used
6. **Test tools** - Unit test each tool function
7. **Document tools** - Clear parameter descriptions

---

## 🔗 Integration Points

- **Task Poller** - Routes tasks with tools to appropriate agents
- **Llama 4 Maverick** - Native tool calling support
- **Colony OS** - Tool registry and discovery

---

**Build powerful tool-using agents!** 🔧
