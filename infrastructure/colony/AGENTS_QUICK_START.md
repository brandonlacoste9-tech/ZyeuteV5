# 🤖 Colony OS Agents - Quick Start Guide

**Status:** Production-Ready  
**Version:** 2.0.0  
**Last Updated:** January 9, 2026

---

## 🎯 What Are Agents?

Agents in Colony OS are **autonomous AI workers** that:
- Poll for tasks from the Supabase task queue
- Process tasks using AI models (Gemini, DeepSeek, Llama 4 Maverick)
- Execute tools and interact with external systems
- Maintain memory and context across tasks
- Report results back to the Hive Mind

---

## 🚀 Quick Start: Create Your First Agent

### Option 1: Python Agent (Colony OS)

```python
# infrastructure/colony/bees/my_agent.py
from fastapi import FastAPI
from supabase import create_client
import os
from dotenv import load_dotenv

# Load environment
load_dotenv("../../.env")

app = FastAPI()
supabase = create_client(
    os.getenv("VITE_SUPABASE_URL"),
    os.getenv("SUPABASE_SERVICE_KEY")
)

@app.get("/health")
async def health():
    return {"status": "healthy", "agent": "my_agent"}

@app.post("/process")
async def process_task(task: dict):
    """Process a task from the Hive Mind"""
    command = task.get('command')
    metadata = task.get('metadata', {})
    
    if command == "my_command":
        # Your agent logic here
        result = {"status": "completed", "result": "Task done!"}
        return result
    
    return {"status": "failed", "error": "Unknown command"}
```

### Option 2: TypeScript Agent (Kernel-Node)

```typescript
// zyeute/packages/kernel-node/src/bees/MyAgent.ts
import { LlmAgent } from '../lib/agents/LlmAgent.js';
import { AgentTask } from '../lib/agents/BaseAgent.js';
import { neurosphere } from '../lib/ai/deepseek.js';

export class MyAgent extends LlmAgent {
  protected pollInterval = 5000;

  constructor() {
    super(
      'my_agent_01',
      neurosphere,
      "You are a helpful assistant for Colony OS."
    );
  }

  public async onStartup() {
    console.log(`🤖 [${this.agentId}] Agent started`);
  }

  protected async forage() {
    // Poll for tasks from Supabase
    const tasks = await this.getPendingTasks();
    for (const task of tasks) {
      await this.processTask(task);
    }
  }

  protected async processTask(task: AgentTask) {
    const response = await this.think(task.payload.prompt, task.id);
    await this.completeTask(task.id, response);
  }
}
```

---

## 📋 Agent Types

### 1. **LLM Agents** (AI-Powered)
- Use AI models for reasoning and generation
- Examples: DeepSeekBee, LlamaBee
- Best for: Content generation, analysis, reasoning

### 2. **Tool Agents** (Action-Oriented)
- Execute specific tools and actions
- Examples: FinanceBee, GuardianBee
- Best for: Webhooks, security scanning, data processing

### 3. **Hybrid Agents** (AI + Tools)
- Combine AI reasoning with tool execution
- Best for: Complex workflows requiring both intelligence and actions

---

## 🔧 Agent Lifecycle

```
1. onStartup()     → Agent initialization
2. onStart()       → Start polling loop
3. forage()        → Poll for tasks (repeated)
4. processTask()   → Handle each task
5. onStop()        → Cleanup before stop
6. onShutdown()    → Final cleanup
```

---

## 🛠️ Registering Tools

### Python Agent

```python
def my_tool(tool_name: str, args: dict):
    if tool_name == "search":
        query = args.get("query")
        # Your search logic
        return {"results": [...]}
    return {}

# In task metadata
task = {
    "metadata": {
        "tools": [...],
        "tool_executor": my_tool
    }
}
```

### TypeScript Agent

```typescript
this.registerTool({
  name: "search",
  description: "Search the database",
  inputSchema: {
    type: 'object',
    properties: {
      query: { type: 'string' }
    },
    required: ['query']
  }
});
```

---

## 📊 Task Processing Flow

```
Task Queue (Supabase)
    ↓
Agent Polls (forage())
    ↓
Task Retrieved
    ↓
processTask()
    ├─ AI Reasoning (if LLM agent)
    ├─ Tool Execution (if needed)
    └─ Result Generation
    ↓
Update Task Status
    ↓
Return Result
```

---

## 🎨 Example: Weather Agent

```python
# bees/weather_agent.py
async def process_task(task: dict):
    command = task.get('command')
    metadata = task.get('metadata', {})
    
    if command == "get_weather":
        location = metadata.get('location')
        
        # Call weather API
        weather = await get_weather_api(location)
        
        return {
            "status": "completed",
            "result": {
                "location": location,
                "temperature": weather['temp'],
                "condition": weather['condition']
            }
        }
```

---

## 🔗 Integration with Task Poller

Agents are automatically discovered by the task poller:

```python
# In task_poller.py
elif target_bee == 'my_agent':
    return my_agent.handle_task(command, metadata)
```

---

## ✅ Best Practices

1. **Always implement health check** (`/health` endpoint)
2. **Handle errors gracefully** - Return error in result, don't crash
3. **Log important events** - Use structured logging
4. **Respect rate limits** - Don't overwhelm external APIs
5. **Use retry logic** - For transient failures
6. **Maintain state** - Use Supabase for persistent state

---

## 📚 Next Steps

- See `AGENTS_PATTERNS.md` for advanced patterns
- See `AGENTS_TOOL_CALLING.md` for tool integration
- See `AGENTS_LIFECYCLE.md` for lifecycle management

---

**Ready to build agents!** 🤖
