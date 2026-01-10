# 🦙 Llama 4 Maverick - Production-Ready Integration Guide

**Status:** ✅ Production-Ready  
**Format:** Modern OpenAI-style tool calling (no deprecated formats)  
**Integration:** Complete `chat_with_tool_loop()` pattern with automatic tool execution

---

## 🎯 Key Features

### ✅ Modern OpenAI Format
- **Standard JSON tool schemas** - Portable across providers
- **Native `tool_calls` in response** - No regex parsing needed
- **No deprecated formats** - No `<|python_tag|>` or `Environment: ipython`

### ✅ Automatic Tool Execution
- **Complete `chat_with_tool_loop()` function** - Handles multi-turn tool execution
- **Automatic iteration** - Loops until model returns final text
- **Proper message history** - Maintains conversation context
- **Iteration limits** - Prevents infinite loops (default: 10 iterations)

### ✅ Security & Best Practices
- **API keys from environment** - Never hard-coded
- **Error handling** - Graceful tool execution failures
- **Detailed logging** - Debug-friendly output
- **Usage tracking** - Token counts across all iterations

---

## 🚀 Quick Start

### 1. Basic Tool Calling

```python
from utils.llama_tools import chat_with_tool_loop

# Define tools (OpenAI format)
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get current weather for a location",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string", "description": "City name"}
            },
            "required": ["location"]
        }
    }
}]

# Implement tool executor
def execute_tool(tool_name: str, tool_input: dict) -> any:
    if tool_name == "get_weather":
        location = tool_input.get("location")
        # Call your weather API
        return {"temperature": 22, "condition": "sunny", "location": location}
    raise ValueError(f"Unknown tool: {tool_name}")

# Use in task
task = {
    "command": "sovereign_reasoning",
    "metadata": {
        "prompt": "What's the weather in Montreal?",
        "tools": tools,
        "tool_choice": "auto",
        "tool_executor": execute_tool
    }
}
```

### 2. Using chat_with_tool_loop Directly

```python
from utils.llama_tools import chat_with_tool_loop
import os

result = chat_with_tool_loop(
    prompt="What's the weather in Montreal and Toronto?",
    tools=tools,
    tool_executor=execute_tool,
    api_url="http://localhost:8321/v1/chat/completions",
    model="meta-llama/llama-4-maverick-17b-128e-instruct",
    tool_choice="auto",
    max_iterations=10,
    temperature=0.7,
    timeout=30
)

print(result["text"])  # Final response
print(result["iterations"])  # Number of tool execution rounds
print(result["usage"])  # Token usage
```

---

## 📋 Tool Definition Format

### Standard OpenAI Format (Required)

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "tool_name",
            "description": "What the tool does",
            "parameters": {
                "type": "object",
                "properties": {
                    "param1": {
                        "type": "string",
                        "description": "Parameter description"
                    },
                    "param2": {
                        "type": "number",
                        "description": "Another parameter"
                    }
                },
                "required": ["param1"]
            }
        }
    }
]
```

---

## 🔄 Tool Execution Flow

### Automatic Multi-Turn Loop

```
1. User Prompt
   ↓
2. Llama 4 Maverick Response
   ├─ Text Response → Done ✅
   └─ Tool Calls → Continue
      ↓
3. Execute Tools
   ↓
4. Send Tool Results Back
   ↓
5. Llama 4 Maverick Final Response
   └─ Text Response → Done ✅
```

The loop continues until:
- Model returns text (no tool calls)
- Max iterations reached (default: 10)
- Error occurs

---

## 🛠️ Tool Executor Pattern

### Recommended Implementation

```python
def execute_tool(tool_name: str, tool_input: dict) -> any:
    """
    Execute a tool and return result.
    Result will be automatically JSON-serialized.
    """
    if tool_name == "get_weather":
        location = tool_input.get("location")
        # Call weather API
        return {
            "temperature": 22,
            "condition": "sunny",
            "location": location
        }
    
    elif tool_name == "search_database":
        query = tool_input.get("query")
        # Query Supabase
        results = supabase.table("posts").select("*").ilike("content", f"%{query}%").execute()
        return {
            "count": len(results.data),
            "posts": results.data
        }
    
    elif tool_name == "calculate":
        expression = tool_input.get("expression")
        # Safe calculation (use eval with restrictions or math parser)
        try:
            result = eval(expression, {"__builtins__": {}}, {"math": __import__("math")})
            return {"result": result}
        except:
            return {"error": "Invalid expression"}
    
    else:
        raise ValueError(f"Unknown tool: {tool_name}")
```

---

## ⚙️ Configuration Options

### Tool Choice

- **`"auto"`** (default) - Model decides when to use tools
- **`"none"`** - Disable tool calling, pure text generation
- **`{"type": "function", "function": {"name": "specific_tool"}}`** - Force specific tool

### Max Iterations

```python
metadata = {
    "max_tool_iterations": 15  # Increase for complex reasoning
}
```

### Temperature

```python
metadata = {
    "temperature": 0.7  # Default, adjust for creativity vs consistency
}
```

---

## 📊 Response Format

### Successful Response

```json
{
    "status": "completed",
    "result": {
        "text": "Final response text",
        "model": "llama-4-maverick",
        "usage": {
            "prompt_tokens": 150,
            "completion_tokens": 75,
            "total_tokens": 225
        },
        "tool_calls": [
            {
                "id": "call_abc123",
                "function": {
                    "name": "get_weather",
                    "arguments": "{\"location\": \"Montreal\"}"
                }
            }
        ],
        "iterations": 2
    }
}
```

### Max Iterations Reached

```json
{
    "status": "completed",
    "result": {
        "text": "Response text",
        "warning": "Max iterations reached",
        "iterations": 10
    }
}
```

---

## 🔍 Advanced Examples

### Multi-Tool Reasoning

```python
tools = [
    {
        "type": "function",
        "function": {
            "name": "get_weather",
            "description": "Get weather",
            "parameters": {...}
        }
    },
    {
        "type": "function",
        "function": {
            "name": "search_events",
            "description": "Search events",
            "parameters": {...}
        }
    }
]

task = {
    "command": "sovereign_reasoning",
    "metadata": {
        "prompt": "What's the weather in Montreal and are there any events this weekend?",
        "tools": tools,
        "tool_choice": "auto",
        "tool_executor": execute_tool
    }
}
```

### Database Query Tool

```python
def query_database_tool(tool_name: str, args: dict):
    if tool_name == "query_posts":
        query = args.get("query")
        results = supabase.table("posts").select("*").ilike("content", f"%{query}%").execute()
        return {
            "count": len(results.data),
            "posts": results.data[:10]  # Limit results
        }
    return {}

tools = [{
    "type": "function",
    "function": {
        "name": "query_posts",
        "description": "Search posts in database",
        "parameters": {
            "type": "object",
            "properties": {
                "query": {"type": "string", "description": "Search query"}
            },
            "required": ["query"]
        }
    }
}]
```

---

## 🚨 Error Handling

### Tool Execution Errors

```python
def execute_tool(tool_name: str, tool_input: dict) -> any:
    try:
        # Your tool logic
        return result
    except Exception as e:
        # Error is automatically wrapped in JSON
        # Model will see: {"error": "Error message"}
        raise  # Or return {"error": str(e)}
```

### API Errors

The task poller automatically:
- Retries on transient errors (3 attempts)
- Logs errors with context
- Returns error in response

---

## 📈 Migration from Old Format

### ❌ Old (Deprecated)

```python
# Old notebook format - DON'T USE
prompt = """
<|python_tag|>
def get_weather(location):
    # ...
<|python_tag|>

Environment: ipython
"""
```

### ✅ New (Production-Ready)

```python
# Modern OpenAI format
tools = [{
    "type": "function",
    "function": {
        "name": "get_weather",
        "description": "Get weather",
        "parameters": {
            "type": "object",
            "properties": {
                "location": {"type": "string"}
            },
            "required": ["location"]
        }
    }
}]
```

---

## ✅ Benefits

1. **Native Support** - Llama 4 Maverick handles tool calling natively
2. **Standard Format** - OpenAI-compatible, portable across providers
3. **Automatic Execution** - No manual tool call handling needed
4. **Multi-Turn Reasoning** - Supports complex reasoning with multiple tool calls
5. **Production-Ready** - Error handling, logging, iteration limits
6. **Sovereign** - Runs on your infrastructure via Groq API

---

## 🔗 Integration Points

- **Task Poller** - Automatic routing for `sovereign_reasoning` commands
- **Colony OS** - Part of the Hive Mind task processing
- **Tool Registry** - Can be extended with Colony OS tool system

---

**Ready for production sovereign tool use!** 🦙🔧
