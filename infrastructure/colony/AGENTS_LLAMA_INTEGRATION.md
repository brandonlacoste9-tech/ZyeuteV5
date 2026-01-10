# 🦙 Agents with Llama 4 Maverick - Integration Guide

**Status:** Production-Ready  
**Integration:** Native OpenAI-style tool calling

---

## 🎯 Overview

This guide shows how to create agents that use **Llama 4 Maverick** for sovereign high-reasoning tasks with native tool calling support.

---

## 🚀 Quick Start: Llama-Powered Agent

### Python Agent

```python
# bees/llama_agent.py
from fastapi import FastAPI
from supabase import create_client
import os
from core.task_poller import process_llama_task

app = FastAPI()
supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

# Define tools for the agent
def agent_tool_executor(tool_name: str, args: dict) -> any:
    """Tool executor for Llama agent"""
    if tool_name == "search_posts":
        query = args.get("query")
        results = supabase.table("posts")\
            .select("*")\
            .ilike("content", f"%{query}%")\
            .limit(10)\
            .execute()
        return {"count": len(results.data), "posts": results.data}
    
    elif tool_name == "get_user":
        user_id = args.get("user_id")
        user = supabase.table("users")\
            .select("*")\
            .eq("id", user_id)\
            .single()\
            .execute()
        return user.data
    
    raise ValueError(f"Unknown tool: {tool_name}")

@app.post("/process")
async def handle_task(task: dict):
    """Handle task with Llama 4 Maverick"""
    metadata = task.get('metadata', {})
    
    # Add tools and executor
    metadata['tools'] = [
        {
            "type": "function",
            "function": {
                "name": "search_posts",
                "description": "Search posts in database",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string", "description": "Search query"}
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_user",
                "description": "Get user profile",
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
    
    metadata['tool_executor'] = agent_tool_executor
    metadata['tool_choice'] = 'auto'
    metadata['sovereign'] = True  # Route to Llama 4 Maverick
    
    # Process with Llama
    result = await process_llama_task(task)
    return result
```

---

## 🔧 Tool Definition for Agents

### Complete Tool Set Example

```python
def create_agent_tools():
    """Create tool definitions for agent"""
    return [
        {
            "type": "function",
            "function": {
                "name": "search_posts",
                "description": "Search posts in the database. Returns matching posts with content, author, and engagement metrics.",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {
                            "type": "string",
                            "description": "Search query text"
                        },
                        "limit": {
                            "type": "integer",
                            "description": "Maximum results",
                            "default": 10,
                            "minimum": 1,
                            "maximum": 50
                        }
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_user_profile",
                "description": "Get user profile information including username, bio, and stats",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {
                            "type": "string",
                            "description": "User UUID"
                        }
                    },
                    "required": ["user_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "analyze_sentiment",
                "description": "Analyze sentiment of text content",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "text": {
                            "type": "string",
                            "description": "Text to analyze"
                        }
                    },
                    "required": ["text"]
                }
            }
        }
    ]
```

---

## 🎨 Agent Patterns with Llama

### Pattern: Reasoning Agent

```python
class ReasoningAgent:
    """Agent for complex reasoning tasks"""
    
    async def process_task(self, task: dict):
        metadata = task.get('metadata', {})
        
        # Use Llama for high-reasoning
        metadata['sovereign'] = True
        metadata['high_reasoning'] = True
        
        # Add reasoning tools
        metadata['tools'] = [
            {
                "type": "function",
                "function": {
                    "name": "search_knowledge_base",
                    "description": "Search knowledge base for information",
                    "parameters": {...}
                }
            }
        ]
        
        return await process_llama_task(task)
```

### Pattern: Analysis Agent

```python
class AnalysisAgent:
    """Agent for data analysis tasks"""
    
    async def process_task(self, task: dict):
        metadata = task.get('metadata', {})
        
        # Tools for analysis
        metadata['tools'] = [
            {
                "type": "function",
                "function": {
                    "name": "query_analytics",
                    "description": "Query analytics data",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "metric": {"type": "string"},
                            "time_range": {"type": "string"}
                        },
                        "required": ["metric"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "generate_chart",
                    "description": "Generate chart from data",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "data": {"type": "array"},
                            "chart_type": {"type": "string"}
                        },
                        "required": ["data"]
                    }
                }
            }
        ]
        
        metadata['tool_executor'] = self.analysis_tools
        metadata['sovereign'] = True
        
        return await process_llama_task(task)
```

### Pattern: Content Generation Agent

```python
class ContentAgent:
    """Agent for content generation with research"""
    
    async def process_task(self, task: dict):
        metadata = task.get('metadata', {})
        
        # Tools for content research
        metadata['tools'] = [
            {
                "type": "function",
                "function": {
                    "name": "web_search",
                    "description": "Search the web for information",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "query": {"type": "string"}
                        },
                        "required": ["query"]
                    }
                }
            },
            {
                "type": "function",
                "function": {
                    "name": "get_trending_topics",
                    "description": "Get trending topics",
                    "parameters": {
                        "type": "object",
                        "properties": {
                            "category": {"type": "string"}
                        }
                    }
                }
            }
        ]
        
        metadata['tool_executor'] = self.content_tools
        metadata['sovereign'] = True
        
        return await process_llama_task(task)
```

---

## 🔄 Multi-Turn Tool Execution

### Example: Complex Workflow

```python
async def complex_workflow_agent(task: dict):
    """Agent that uses multiple tools in sequence"""
    
    metadata = task.get('metadata', {})
    
    # Llama will automatically chain tool calls
    metadata['tools'] = [
        {
            "type": "function",
            "function": {
                "name": "get_user_posts",
                "description": "Get user's recent posts",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "user_id": {"type": "string"}
                    },
                    "required": ["user_id"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "analyze_engagement",
                "description": "Analyze post engagement metrics",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "post_ids": {"type": "array", "items": {"type": "string"}}
                    },
                    "required": ["post_ids"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "generate_recommendations",
                "description": "Generate content recommendations",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "analysis": {"type": "object"}
                    },
                    "required": ["analysis"]
                }
            }
        }
    ]
    
    # Llama will automatically:
    # 1. Call get_user_posts
    # 2. Use results to call analyze_engagement
    # 3. Use analysis to call generate_recommendations
    # 4. Return final recommendations
    
    metadata['tool_executor'] = workflow_tools
    metadata['sovereign'] = True
    
    return await process_llama_task(task)
```

---

## 📊 Response Handling

### Extract Tool Results

```python
async def process_with_tool_results(task: dict):
    result = await process_llama_task(task)
    
    if result['status'] == 'completed':
        tool_calls = result['result'].get('tool_calls')
        
        if tool_calls:
            # Agent used tools
            print(f"Agent used {len(tool_calls)} tool(s)")
            for tool_call in tool_calls:
                print(f"  - {tool_call['function']['name']}")
        
        # Final response
        final_text = result['result']['text']
        return final_text
    
    return None
```

---

## 🎯 Best Practices for Llama Agents

1. **Use sovereign flag** - Route high-reasoning tasks to Llama
2. **Define clear tools** - Good descriptions help model choose tools
3. **Handle tool errors** - Return error messages, don't crash
4. **Limit iterations** - Prevent infinite loops (default: 10)
5. **Track usage** - Monitor token usage and costs
6. **Test tools** - Verify each tool works correctly
7. **Log tool calls** - Debug tool execution flow

---

## 🔗 Integration with Task Poller

The task poller automatically routes to Llama when:

```python
# Explicit command
task = {
    "command": "sovereign_reasoning",  # Direct routing
    "metadata": {...}
}

# Flag-based routing
task = {
    "command": "chat",
    "metadata": {
        "sovereign": True,  # Route to Llama
        "tools": [...],
        "tool_executor": my_tools
    }
}
```

---

## 📚 Example: Complete Agent

```python
# bees/sovereign_agent.py
from fastapi import FastAPI
from core.task_poller import process_llama_task
from supabase import create_client
import os

app = FastAPI()
supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

def sovereign_tools(tool_name: str, args: dict):
    """Tool executor for sovereign agent"""
    if tool_name == "search_posts":
        query = args.get("query")
        results = supabase.table("posts")\
            .select("*")\
            .ilike("content", f"%{query}%")\
            .limit(10)\
            .execute()
        return {"count": len(results.data), "posts": results.data}
    
    elif tool_name == "get_trending":
        results = supabase.table("posts")\
            .select("*")\
            .order("likes", desc=True)\
            .limit(10)\
            .execute()
        return {"trending": results.data}
    
    raise ValueError(f"Unknown tool: {tool_name}")

@app.post("/process")
async def handle_task(task: dict):
    metadata = task.get('metadata', {})
    
    # Configure for Llama 4 Maverick
    metadata['sovereign'] = True
    metadata['tools'] = [
        {
            "type": "function",
            "function": {
                "name": "search_posts",
                "description": "Search posts",
                "parameters": {
                    "type": "object",
                    "properties": {
                        "query": {"type": "string"}
                    },
                    "required": ["query"]
                }
            }
        },
        {
            "type": "function",
            "function": {
                "name": "get_trending",
                "description": "Get trending posts",
                "parameters": {"type": "object", "properties": {}}
            }
        }
    ]
    metadata['tool_executor'] = sovereign_tools
    metadata['tool_choice'] = 'auto'
    
    return await process_llama_task(task)

@app.get("/health")
async def health():
    return {"status": "healthy", "agent": "sovereign_agent"}
```

---

## ✅ Summary

- **Use Llama 4 Maverick** for high-reasoning tasks
- **Define tools** in OpenAI format
- **Implement tool executor** to handle tool calls
- **Set sovereign flag** to route to Llama
- **Handle multi-turn** tool execution automatically

---

**Build sovereign agents with Llama 4 Maverick!** 🦙🤖
