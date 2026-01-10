# 🦙 Llama 4 Maverick Integration Guide

**Status:** Integrated into Colony OS Task Poller  
**Model:** `meta-llama/llama-4-maverick-17b-128e-instruct`  
**Provider:** Groq (via llama-stack)

---

## 🚀 Quick Start

### 1. Start Llama Stack Server

```bash
cd infrastructure/colony
llama-stack run config.yaml
```

This starts the llama-stack server on `http://localhost:8321` with Llama 4 Maverick configured.

### 2. Set Environment Variables

Add to your root `.env` file:

```bash
GROQ_API_KEY=your_groq_api_key_here
LLAMA_STACK_URL=http://localhost:8321
```

### 3. Use in Tasks

#### Option A: Explicit High-Reasoning Command

```python
task = {
    "command": "sovereign_reasoning",  # or "high_reasoning", "complex_analysis"
    "metadata": {
        "prompt": "Analyze this complex problem with deep reasoning..."
    }
}
```

#### Option B: Flag Standard Commands

```python
task = {
    "command": "chat",  # Standard command
    "metadata": {
        "prompt": "Your question here",
        "sovereign": True,  # Route to Llama 4 Maverick
        # OR
        "high_reasoning": True  # Alternative flag
    }
}
```

---

## 📋 Supported Commands

### Explicit Llama 4 Maverick Commands:
- `sovereign_reasoning` - Direct routing to Llama 4 Maverick
- `high_reasoning` - High-reasoning tasks
- `complex_analysis` - Complex analysis tasks

### Standard Commands (with flags):
- `chat` - With `sovereign: true` or `high_reasoning: true` in metadata
- `improve_text` - With `sovereign: true` flag
- `write_script` - With `sovereign: true` flag

---

## 🔄 Fallback Behavior

If Llama 4 Maverick is unavailable:
- Falls back to DeepSeek V3 automatically
- Logs warning: `⚠️ Llama 4 Maverick not available, falling back to DeepSeek`

---

## 🏗️ Architecture

```
Task Poller
    ↓
Check metadata flags (sovereign/high_reasoning)
    ↓
┌─────────────────────┬──────────────────────┐
│ Llama 4 Maverick    │ DeepSeek V3          │
│ (if available)      │ (fallback)           │
│                     │                      │
│ llama-stack server  │ Direct API call      │
│ localhost:8321      │ api.deepseek.com     │
└─────────────────────┴──────────────────────┘
```

---

## ⚙️ Configuration

### config.yaml

```yaml
inference:
  provider: groq
  config:
    groq_api_key: ${GROQ_API_KEY}
    model: meta-llama/llama-4-maverick-17b-128e-instruct

server:
  host: localhost
  port: 8321
```

### Environment Variables

- `GROQ_API_KEY` - Your Groq API key (required)
- `LLAMA_STACK_URL` - Llama stack server URL (default: `http://localhost:8321`)

---

## 🧪 Testing

### Test Llama 4 Maverick Integration

```python
# Create a test task
test_task = {
    "id": "test-001",
    "command": "sovereign_reasoning",
    "metadata": {
        "prompt": "Explain quantum computing in simple terms",
        "temperature": 0.7
    }
}

# Process through task poller
result = process_llama_task(test_task)
print(result)
```

### Verify Server is Running

```bash
curl http://localhost:8321/health
```

---

## 📊 Response Format

```json
{
  "status": "completed",
  "result": {
    "text": "Response from Llama 4 Maverick...",
    "model": "llama-4-maverick",
    "usage": {
      "prompt_tokens": 10,
      "completion_tokens": 50,
      "total_tokens": 60
    }
  }
}
```

---

## 🔍 Monitoring

The task poller logs:
- `🦙 [SOVEREIGN REASONING] Llama 4 Maverick processing: {task_id}`
- `⚠️ Llama 4 Maverick not available, falling back to DeepSeek`
- `❌ Llama 4 Maverick Error: {error}`

---

## 🚨 Troubleshooting

### Server Not Running
- **Error:** `HTTP error: Connection refused`
- **Fix:** Start llama-stack: `llama-stack run config.yaml`

### Missing API Key
- **Error:** `Llama Stack not available`
- **Fix:** Set `GROQ_API_KEY` in `.env` file

### Wrong Model Name
- **Error:** `Model not found`
- **Fix:** Verify model name in `config.yaml` matches Groq's available models

---

## 🔧 Tool Calling Support

Llama 4 Maverick supports native OpenAI-style tool calling. See `LLAMA_TOOL_CALLING.md` for details.

**Key Features:**
- Standard JSON tools array format
- `tool_choice="auto"` for automatic tool selection
- No deprecated formats (no `<|python_tag|>` or `Environment: ipython`)
- Automatic tool execution and follow-up requests

---

**Ready for sovereign high-reasoning tasks!** 🦙🧠
