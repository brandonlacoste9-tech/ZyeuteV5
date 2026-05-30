# 🐝 Zyeuté V3 - AI Hive Architecture

**Status:** ✅ Implemented  
**Version:** 1.0.0  
**Last Updated:** December 17, 2025

---

## 📋 Overview

The AI Hive is a modular task orchestration system that routes AI requests through specialized "bees" (workers) organized under three "cores" (supervisors).

```
┌─────────────────────────────────────────────────────────────┐
│                      STUDIO API                              │
│   /api/studio/generate-image, /generate-video, /chat, etc.  │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                   ORCHESTRATOR CORE                          │
│   Routes tasks to bees based on capability matching          │
└─────────────────────────────────────────────────────────────┘
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌─────────────────┐ ┌─────────────────┐ ┌─────────────────┐
│  WORKER BEES    │ │  GUARDIAN BEES  │ │  ARCHITECT BEES │
│  ─────────────  │ │  ─────────────  │ │  ─────────────  │
│  ti-guy-chat    │ │  moderation     │ │  analytics      │
│  studio-caption │ │  media-budget   │ │  issue-rewrite  │
│  studio-image   │ │                 │ │  dream-expansion│
│  studio-video   │ │                 │ │                 │
│  post-composer  │ │                 │ │                 │
└─────────────────┘ └─────────────────┘ └─────────────────┘
          │
          ▼
┌─────────────────────────────────────────────────────────────┐
│                     MEDIA ENGINES                            │
│   image-engine.ts (Flux)  |  video-engine.ts (Hunyuan)      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🏗️ Directory Structure

```
server/ai/
├── types.ts              # Core type definitions
├── bee-registry.ts       # Registry of all 10 bees
├── cores/
│   ├── orchestrator-core.ts  # Task routing
│   ├── guardian-core.ts      # Safety & budget
│   └── architect-core.ts     # High-level analysis
├── bees/
│   ├── ti-guy-chat.ts        # Quebec joual chatbot
│   ├── studio-caption.ts     # Caption generation
│   ├── studio-image.ts       # Image generation (Flux)
│   ├── studio-video.ts       # Video generation (Hunyuan)
│   ├── post-composer.ts      # Full post composition
│   ├── moderation.ts         # Content safety
│   ├── media-budget.ts       # Cost tracking
│   ├── analytics-summarizer.ts
│   ├── issue-rewrite.ts
│   └── dream-expansion.ts
└── media/
    ├── image-engine.ts       # Flux/FAL integration
    └── video-engine.ts       # Hunyuan integration
```

---

## 🐝 Bee Registry (10 Bees)

| Bee ID                 | Name               | Core      | Model           | Status  |
| ---------------------- | ------------------ | --------- | --------------- | ------- |
| `ti-guy-chat`          | Ti-Guy Chat        | worker    | DeepSeek        | 🟢 LIVE |
| `studio-caption`       | Caption Generator  | worker    | DeepSeek        | 🟢 LIVE |
| `studio-image`         | Image Generator    | worker    | FAL/Flux        | 🟢 LIVE |
| `studio-video`         | Video Generator    | worker    | FAL/Kling       | 🟢 LIVE |
| `post-composer`        | Post Composer      | worker    | DeepSeek + Flux | 🟢 LIVE |
| `moderation`           | Content Moderation | guardian  | DeepSeek        | 🟢 LIVE |
| `media-budget`         | Budget Tracker     | guardian  | Mistral         | 🟡 Stub |
| `analytics-summarizer` | Analytics          | architect | DeepSeek        | 🟢 LIVE |
| `issue-rewrite`        | Issue Rewrite      | architect | DeepSeek        | 🟡 Stub |
| `dream-expansion`      | Dream Expansion    | architect | DeepSeek        | 🟡 Stub |

---

## 🔌 API Endpoints

All endpoints require authentication (`Authorization: Bearer <token>`).

### Studio Routes (`/api/studio/`)

| Method | Endpoint          | Description                |
| ------ | ----------------- | -------------------------- |
| POST   | `/generate-image` | Generate image from prompt |
| POST   | `/generate-video` | Generate video from prompt |
| POST   | `/compose-post`   | Generate complete post     |
| POST   | `/chat`           | Chat with Ti-Guy           |

### Request Format

```json
{
  "prompt": "A beaver building a dam at sunset",
  "modelHint": "flux"
}
```

### Response Format

```json
{
  "url": "https://...",
  "cost": 0.05,
  "model": "flux"
}
```

---

## 🔗 Colony OS Bridge (Python Swarm)

Zyeuté communicates with Python bees (e.g., `finance-bee`, `health-bee`) via the `colony_tasks` database table.

1. **Orchestrator** detects bee has `endpoint: 'colony_tasks'`.
2. **Python Bridge** (`python-bridge.ts`) inserts task row into `colony_tasks`.
3. **Task Poller** (Python) picks up the task.
4. **Bees** execute logic and write result back to `colony_tasks`.

### Python Bees in Registry

```typescript
'finance-bee': {
    capabilities: ['analytics', 'budget'],
    endpoint: 'colony_tasks'
}
```

---

## 🔗 Colony OS Metrics Bridge

The bridge sends metrics to the external Colony OS dashboard.

### Configuration

```env
COLONY_OS_URL=http://localhost:3000
```

### Usage

```typescript
import { sendMetricsToColony } from "./server/colony/bridge";

await sendMetricsToColony({
  tasksCompleted: 10,
  averageLatency: 250,
  totalCost: 1.25,
});
```

---

## 📊 Task Flow

1. **Request** → Studio API receives request
2. **Task Creation** → Create `HiveTask` with type and payload
3. **Orchestration** → `OrchestratorCore.handleHiveTask()` routes to bee
4. **Capability Matching** → Registry finds bee by capability
5. **Execution** → Bee's `run()` function processes payload
6. **Media Engine** → If image/video, engine generates content
7. **Response** → Return result with metadata

---

## 🧪 Testing

Run the test script:

```bash
npx tsx script/test_hive_pipeline.ts
```

---

## 🚀 Next Steps

1. **Connect Real Models**: Replace stubs with FAL/DeepSeek calls
2. **Add Budget Enforcement**: Guardian Core checks before generation
3. **Expand Architect Analysis**: Real-time metrics processing
4. **Colony OS Dashboard**: Visualize Hive activity

---

**🐝 Powered by the Zyeuté AI Hive**
