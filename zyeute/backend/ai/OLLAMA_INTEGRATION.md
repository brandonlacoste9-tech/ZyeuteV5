# 🦙 Ollama Integration Guide

**Status:** ✅ Integrated  
**Model:** `gemini-3-flash-preview:cloud` (free cloud-based)  
**Provider:** Ollama Cloud

---

## 🚀 Quick Start

### 1. Ollama Setup

The Ollama model is already uploaded and available via cloud:

```bash
# Test the model directly
ollama run gemini-3-flash-preview:cloud "Hello, can you respond?"
```

### 2. Environment Variables

Add to your root `.env` file (optional - defaults shown):

```bash
# Ollama API Configuration
OLLAMA_API_BASE=http://localhost:11434  # Default Ollama API endpoint
OLLAMA_DEFAULT_MODEL=gemini-3-flash-preview:cloud  # Default model to use
```

### 3. Usage in Code

#### Direct Ollama Service

```typescript
import { ollama } from "./ai/ollama-service.js";

// Simple generation
const response = await ollama.generate(
  "Write a Quebec French social media caption about poutine",
  {
    system: "You are TI-GUY, a friendly Quebec beaver mascot.",
    temperature: 0.7,
  }
);

// Full chat completion (OpenAI-compatible interface)
const result = await ollama.chat.completions.create({
  model: "gemini-3-flash-preview:cloud",
  messages: [
    { role: "system", content: "You are a helpful assistant." },
    { role: "user", content: "Explain quantum computing simply." }
  ],
  temperature: 0.7,
  max_tokens: 500,
});

console.log(result.choices[0].message.content);
```

#### Multi-Model Router

```typescript
import { routeMultiModel } from "./ai/multi-model-router.js";

// Use Ollama as one of multiple providers
const response = await routeMultiModel({
  prompt: "Generate a creative caption",
  systemInstruction: "Be creative and engaging",
  providers: ["ollama", "gemini-3-pro"], // Compare Ollama vs Gemini
  strategy: "best", // or "consensus", "first", "all"
});

console.log(response.primary.content);
console.log("Provider:", response.primary.provider);
```

---

## 📋 Features

- ✅ **Free Cloud Models**: No API keys needed for cloud-hosted models
- ✅ **OpenAI-Compatible**: Drop-in replacement for OpenAI API
- ✅ **Multi-Model Support**: Use alongside Gemini, DeepSeek, Copilot
- ✅ **Quebec-Optimized**: Works great for French/Quebec content
- ✅ **Retry Logic**: Automatic retries with exponential backoff
- ✅ **Health Checks**: Monitor Ollama service availability

---

## 🔧 API Methods

### `ollama.generate(prompt, options?)`
Simple text generation.

### `ollama.chat.completions.create(options)`
Full chat completion API (OpenAI-compatible).

### `checkOllamaHealth()`
Check if Ollama service is available.

### `listOllamaModels()`
List all available Ollama models (from server).

### `selectOllamaModel(useCase)`
Intelligently select the best model for your use case.
Parameters:
- `priority`: "speed" | "quality" | "cost" | "balance"
- `requiresLocal`: boolean (use local models only)
- `task`: "chat" | "reasoning" | "code" | "creative" | "quebec"

---

## 🌐 Available Models

You have **7 models** available in your Ollama setup:

### Cloud Models (Free, Fast)
- **`gemini-3-flash-preview:cloud`** (Default)
  - Fast responses, general chat, content generation
  - Perfect for: High-volume, low-latency tasks

- **`gpt-oss:120b-cloud`**
  - High-capacity reasoning, complex tasks
  - Perfect for: Advanced reasoning, large context

- **`gpt-oss:20b-cloud`**
  - Balanced performance, good for most tasks
  - Perfect for: General-purpose use

- **`deepseek-v3.1:671b-cloud`**
  - Advanced reasoning, code generation, math
  - Perfect for: Code tasks, mathematical reasoning

### Local Models (Downloaded)
- **`llama3.1:8b`** (4.9 GB)
  - Local fast inference, offline use
  - Perfect for: Privacy-sensitive tasks, offline work

- **`llama3.2:latest`** (2.0 GB)
  - Latest Llama, good balance of speed/quality
  - Perfect for: Balanced local inference

- **`brandonlacoste9/zyeuteV8:latest`** (2.0 GB) ⭐ **CUSTOM**
  - Custom Zyeuté fine-tuned model
  - Perfect for: Quebec content, your specific use cases
  - **Recommended for Quebec-specific tasks!**

### Smart Model Selection

Use the helper function to automatically select the best model:

```typescript
import { selectOllamaModel } from "./ai/ollama-service.js";

// For Quebec content - uses custom model
const quebecModel = selectOllamaModel({ task: "quebec" });
// Returns: "brandonlacoste9/zyeuteV8:latest"

// For code generation - uses DeepSeek
const codeModel = selectOllamaModel({ task: "code" });
// Returns: "deepseek-v3.1:671b-cloud"

// For fast responses - uses Gemini
const fastModel = selectOllamaModel({ priority: "speed" });
// Returns: "gemini-3-flash-preview:cloud"

// For quality - uses largest model
const qualityModel = selectOllamaModel({ priority: "quality" });
// Returns: "gpt-oss:120b-cloud"

// Local only
const localModel = selectOllamaModel({ requiresLocal: true });
// Returns: "llama3.2:latest"
```

### Manual Model Selection

You can use any model by specifying it:

```typescript
await ollama.chat.completions.create({
  model: "brandonlacoste9/zyeuteV8:latest", // Your custom model!
  messages: [...],
});
```

---

## 💡 Use Cases

### 1. Cost-Effective Chat
Use Ollama for high-volume, low-cost chat operations.

### 2. Quebec Content
Great for Quebec French content generation and translations.

### 3. Fallback Provider
Use as a fallback when paid APIs are unavailable.

### 4. Multi-Model Comparison
Compare responses across Ollama, Gemini, and other providers.

---

## 🔄 Integration Points

- ✅ Multi-Model Router
- ✅ Model selection system
- ✅ Type system (already includes "ollama" as provider)
- ✅ Bee registry (can be used by any bee)

---

## 🚨 Troubleshooting

### Issue: Ollama service not responding
**Fix**: Ensure Ollama is running locally or check cloud endpoint:
```bash
curl http://localhost:11434/api/tags
```

### Issue: Model not found
**Fix**: Pull the model first:
```bash
ollama pull gemini-3-flash-preview:cloud
```

### Issue: Slow responses
**Fix**: Cloud models may be slower. Consider using local Ollama for faster responses.

---

## 📊 Performance

- **Latency**: Cloud models ~500-2000ms (depends on network)
- **Cost**: FREE (cloud-hosted models)
- **Reliability**: Good (with retry logic)
- **Confidence**: 0.8 (good for most tasks)

---

**The Ollama integration is ready! Start using free cloud models in your Colony OS. 🐝✨**