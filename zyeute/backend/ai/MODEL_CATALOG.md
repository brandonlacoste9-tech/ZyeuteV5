# 🦙 Ollama Model Catalog - Complete Reference

**Status:** Updated with 30+ cloud models  
**Last Updated:** January 2026

---

## 📊 Model Categories

### 🚀 Speed & Efficiency
- **gemini-3-flash-preview:cloud** - Fast responses, general chat
- **ministral-3:cloud** (3b/8b/14b) - Edge deployment, wide hardware support
- **gemma3:cloud** (270m-27b) - Runs on single GPU
- **rnj-1:cloud** (8b) - Code & STEM optimized

### 🧠 Reasoning & Thinking
- **gemini-3-pro-preview:cloud** ⭐ - SOTA reasoning, multimodal, agentic
- **deepseek-v3.2:cloud** - Newest version, superior reasoning
- **deepseek-v3.1:671b-cloud** - Thinking mode, advanced reasoning
- **kimi-k2-thinking:cloud** - Best open-source thinking model
- **qwen3-next:cloud** (80b) - Parameter efficient with thinking mode
- **gpt-oss:120b-cloud** - High-capacity reasoning

### 💻 Code & Engineering
- **devstral-2:cloud** (123b) ⭐ - Best for code exploration, multi-file editing
- **devstral-small-2:cloud** (24b) - Lightweight code/tool use
- **qwen3-coder:cloud** (30b/480b) - Long context for coding
- **glm-4.7:cloud** - Advancing coding capability
- **glm-4.6:cloud** - Agentic reasoning and coding
- **minimax-m2.1:cloud** - Multilingual code engineering
- **minimax-m2:cloud** - High-efficiency coding workflows

### 👁️ Vision & Multimodal
- **qwen3-vl:cloud** ⭐ (2b-235b) - Most powerful vision-language model
- **ministral-3:cloud** - Vision + tools + edge deployment
- **mistral-large-3:cloud** - Production-grade multimodal MoE

### 🤖 Agentic & Tools
- **nemotron-3-nano:cloud** (30b) ⭐ - Standard for intelligent agents
- **kimi-k2:cloud** - MoE for coding agent tasks
- **qwen3-next:cloud** - Agentic with tools support
- **glm-4.6:cloud** - Advanced agentic capabilities

### 🏢 Production & Enterprise
- **mistral-large-3:cloud** - Enterprise workloads, multimodal
- **gpt-oss:20b-cloud** - Balanced production use
- **cogito-2.1:cloud** (671b) - MIT licensed, commercial use

### 🇨🇦 Quebec & Custom
- **brandonlacoste9/zyeuteV8:latest** ⭐ - Custom Zyeuté model (local)

---

## 🎯 Use Case Matrix

| Use Case | Recommended Model | Why? |
| --- | --- | --- |
| **Quebec Content** | `brandonlacoste9/zyeuteV8` | Custom-tuned for TI-GUY |
| **Code Generation** | `devstral-2:cloud` | Best for software engineering |
| **Vision Tasks** | `qwen3-vl:cloud` | Most powerful vision model |
| **Reasoning** | `gemini-3-pro-preview:cloud` | SOTA reasoning capabilities |
| **Thinking Mode** | `kimi-k2-thinking:cloud` | Best open-source thinking |
| **Agentic Tasks** | `nemotron-3-nano:cloud` | Standard for agents |
| **Speed Priority** | `gemini-3-flash-preview:cloud` | Fastest responses |
| **Production** | `mistral-large-3:cloud` | Enterprise-grade |
| **Long Context** | `qwen3-coder:cloud` | Up to 480b for long code |

---

## 📈 Model Comparison

### By Size (Parameters)
- **Small (1b-8b):** ministral-3, rnj-1, gemma3 - Fast, efficient
- **Medium (20b-30b):** nemotron-3-nano, devstral-small-2, gpt-oss:20b - Balanced
- **Large (80b-123b):** qwen3-next, devstral-2 - Advanced capabilities
- **Extra Large (480b+):** deepseek-v3.1, qwen3-coder, cogito-2.1 - Maximum power

### By Specialization
- **Code:** devstral-2, qwen3-coder, rnj-1, glm-4.7
- **Reasoning:** gemini-3-pro, deepseek-v3.2, kimi-k2-thinking
- **Vision:** qwen3-vl, ministral-3
- **Agentic:** nemotron-3-nano, kimi-k2, glm-4.6
- **General:** gemini-3-flash, gpt-oss, gemma3

---

## 🔄 Model Selection Logic

The system automatically selects models based on:

1. **Task Type:** code, reasoning, vision, agentic, quebec
2. **Priority:** speed, quality, cost, balance
3. **Requirements:** local only, vision, tools
4. **Failover:** Auto-switches if model unavailable

---

## 🚀 Getting Started

```typescript
import { selectOllamaModel } from "./ai/ollama-service.js";

// Code task → devstral-2
const codeModel = selectOllamaModel({ task: "code" });

// Vision task → qwen3-vl
const visionModel = selectOllamaModel({ task: "vision" });

// Reasoning → gemini-3-pro
const reasoningModel = selectOllamaModel({ priority: "quality" });

// Agentic → nemotron-3-nano
const agenticModel = selectOllamaModel({ task: "agentic" });
```

---

## 📝 Notes

- All cloud models are **FREE** to use
- Models auto-failover if unavailable
- New models added regularly - check Ollama library
- Custom model `zyeuteV8` requires local installation

**Last Verified:** January 2026  
**Total Models Available:** 30+ cloud models