# 🤖 Google ADK Integration - Colony OS

**Status:** Integrated  
**Purpose:** Native Google Agent Development Kit support

---

## 🎯 Overview

Google ADK (Agent Development Kit) provides native Google agent infrastructure that integrates seamlessly with Google Cloud services. This integration allows Colony OS to use Google's native agent framework alongside Llama 4 Maverick.

---

## 🏗️ Architecture

```
Colony OS Task Poller
    ↓
Routing Decision
    ├─ Google ADK (for GCP tasks)
    ├─ Llama 4 Maverick (for sovereign reasoning)
    └─ Other Bees (specialized tasks)
```

---

## 📋 Setup

### 1. Install Google ADK

```bash
pip install google-adk
```

### 2. Configure Environment

```bash
# In root .env
GOOGLE_CLOUD_PROJECT=zyeutev5
GOOGLE_ADK_MCP_SERVER=projects/zyeutev5/locations/global/mcpServers/google-compute.googleapis.com-mcp
```

### 3. Usage

The task poller automatically routes to Google ADK when:
- Command is `google_cloud_task`, `gcp_operation`, or `vertex_ai_task`
- Metadata has `use_google_adk: true`
- Target bee is `google_adk_agent`

---

## 🔧 Code Structure

### Python (Colony OS)

```python
from core.google_adk_agent import get_google_adk_agent

agent = get_google_adk_agent()
result = agent.execute_directive("Your directive here")
```

### TypeScript (Kernel-Node)

```typescript
import { createGoogleAdkAgent } from './lib/google-cloud/adk-integration';

const agent = createGoogleAdkAgent({
  projectId: 'zyeutev5',
  model: 'gemini-2.0-flash',
  mcpServerName: 'projects/zyeutev5/locations/global/mcpServers/google-compute.googleapis.com-mcp'
});
```

---

## 🎯 Use Cases

### 1. Google Cloud Operations
- Deploy to Cloud Run
- Manage GKE clusters
- Query BigQuery
- Access Secret Manager

### 2. Vertex AI Tasks
- Agent Builder operations
- Grounded reasoning
- Model inference

### 3. Native GCP Integration
- Use Google's native tooling
- Leverage MCP servers
- Access Google Cloud APIs

---

## 🔄 Routing Logic

The task poller routes to Google ADK when:

1. **Explicit command:**
   ```python
   {
       "command": "google_cloud_task",
       "metadata": {"prompt": "Deploy to Cloud Run"}
   }
   ```

2. **Flag-based:**
   ```python
   {
       "command": "chat",
       "metadata": {
           "prompt": "Query BigQuery",
           "use_google_adk": True
       }
   }
   ```

3. **Target bee:**
   ```python
   {
       "target_bee": "google_adk_agent",
       "metadata": {"prompt": "Your task"}
   }
   ```

---

## ✅ Benefits

1. **Native Integration** - Direct access to Google Cloud services
2. **MCP Support** - Automatic tool discovery from MCP servers
3. **Gemini Models** - Access to latest Gemini models
4. **Seamless Routing** - Automatic fallback to Llama 4 Maverick

---

## 🚀 Next Steps

1. Install Google ADK: `pip install google-adk`
2. Configure MCP server name in `.env`
3. Test with a Google Cloud task
4. Verify routing works correctly

---

**Google ADK integrated. Ready for native Google Cloud operations.** 🤖👑🦙
