# 🔧 Llama 4 Maverick Tool Calling Guide

**Status:** Native OpenAI-style tool calling support  
**Format:** Standard JSON tools array + `tool_choice="auto"`  
**No deprecated formats:** No `<|python_tag|>` or `Environment: ipython` needed

---

## 🚀 Quick Start

### Basic Tool Calling

```python
task = {
    "command": "sovereign_reasoning",
    "metadata": {
        "prompt": "What's the weather in Montreal?",
        "tools": [
            {
                "type": "function",
                "function": {
                    "name": "get_weather",
                    "description": "Get current weather for a location",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "location": {
                                "type": "string",
                                "description": "City name"
                            },
                            "units": {
                                "type": "string",
                                "enum": ["celsius", "fahrenheit"],
                                "description": "Temperature units"
                            }
                        },
                        "required": ["location"]
                    }
                }
            }
        ],
        "tool_choice": "auto",  # Let model decide when to use tools
        "tool_executor": my_tool_executor_function  # Function to execute tools
    }
}
```

---

## 📋 Tool Definition Format

### Standard OpenAI Format

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

### 1. Initial Request with Tools

```python
{
    "model": "meta-llama/llama-4-maverick-17b-128e-instruct",
    "messages": [{"role": "user", "content": "Your query"}],
    "tools": [...],  # Tool definitions
    "tool_choice": "auto"  # or "none" or specific tool
}
```

### 2. Model Response with Tool Calls

```json
{
    "choices": [{
        "message": {
            "role": "assistant",
            "content": null,
            "tool_calls": [
                {
                    "id": "call_abc123",
                    "type": "function",
                    "function": {
                        "name": "get_weather",
                        "arguments": "{\"location\": \"Montreal\"}"
                    }
                }
            ]
        }
    }]
}
```

### 3. Execute Tools & Follow-up

The task poller automatically:
- Executes tool calls using `tool_executor` function
- Sends follow-up request with tool results
- Returns final response

---

## 🛠️ Tool Executor Function

### Example Implementation

```python
def my_tool_executor(tool_name: str, args: dict) -> any:
    """Execute a tool call and return result."""
    
    if tool_name == "get_weather":
        location = args.get("location")
        # Call your weather API
        return {"temperature": 22, "condition": "sunny", "location": location}
    
    elif tool_name == "search_database":
        query = args.get("query")
        # Search your database
        return {"results": [...]}
    
    else:
        raise ValueError(f"Unknown tool: {tool_name}")

# Use in task metadata
task = {
    "metadata": {
        "tools": [...],
        "tool_executor": my_tool_executor
    }
}
```

---

## ⚙️ Tool Choice Options

### `tool_choice: "auto"` (Default)
- Model decides when to use tools
- Most flexible option

### `tool_choice: "none"`
- Disable tool calling
- Pure text generation

### `tool_choice: {"type": "function", "function": {"name": "specific_tool"}}`
- Force use of specific tool
- Useful for guided workflows

---

## 📊 Response Format

### With Tool Calls

```json
{
    "status": "completed",
    "result": {
        "text": "Final response after tool execution",
        "model": "llama-4-maverick",
        "usage": {
            "prompt_tokens": 100,
            "completion_tokens": 50,
            "total_tokens": 150
        },
        "tool_calls": [
            {
                "id": "call_abc123",
                "function": {
                    "name": "get_weather",
                    "arguments": "{\"location\": \"Montreal\"}"
                }
            }
        ]
    }
}
```

### Without Tool Calls

```json
{
    "status": "completed",
    "result": {
        "text": "Direct response",
        "model": "llama-4-maverick",
        "usage": {...},
        "tool_calls": null
    }
}
```

---

## 🔍 Advanced Usage

### Multiple Tools

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
            "name": "search_database",
            "description": "Search database",
            "parameters": {...}
        }
    }
]
```

### Disable Auto-Execution

```python
{
    "metadata": {
        "tools": [...],
        "auto_execute_tools": False  # Return tool calls without executing
    }
}
```

---

## 🧪 Example: Database Query Tool

```python
def query_database_tool(tool_name: str, args: dict):
    if tool_name == "query_posts":
        query = args.get("query")
        # Query Supabase
        results = supabase.table("posts").select("*").ilike("content", f"%{query}%").execute()
        return {"count": len(results.data), "posts": results.data}
    return {}

task = {
    "command": "sovereign_reasoning",
    "metadata": {
        "prompt": "Find posts about poutine",
        "tools": [{
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
        }],
        "tool_choice": "auto",
        "tool_executor": query_database_tool
    }
}
```

---

## ✅ Benefits

- **Native Support:** Llama 4 Maverick has built-in tool calling
- **Standard Format:** OpenAI-compatible, no custom formats
- **Automatic Execution:** Task poller handles tool execution and follow-up
- **Flexible:** Support multiple tools, custom executors
- **Sovereign:** Runs on your infrastructure (Groq API)

---

**Ready for sovereign tool use!** 🦙🔧
