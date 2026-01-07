# 🐝 Colony OS Bee Ecosystem

## Overview

**Colony OS** = The central "hive" (Python kernel) that connects all your projects  
**Bees** = Individual AI agents with specific jobs  
**Hives** = Different websites/apps (like Zyeuté) that connect to Colony OS  
**Synapse Bridge** = The connection between hives and Colony OS (Socket.io)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│              Colony OS (Python Kernel)                  │
│         Central Intelligence & Orchestration            │
└───────────────┬─────────────────────────────────────────┘
                │
        ┌───────┴───────┐
        │               │
        ▼               ▼
┌──────────────┐  ┌──────────────┐
│  Zyeuté      │  │  Planexa     │  (More hives...)
│  (Hive)      │  │  (Hive)      │
│              │  │              │
│  ┌────────┐  │  │  ┌────────┐  │
│  │ Bees   │  │  │  │ Bees   │  │
│  │ - Chat │  │  │  │ - Task │  │
│  │ - Mod  │  │  │  │ - AI   │  │
│  │ - ...  │  │  │  │ - ...  │  │
│  └────────┘  │  │  └────────┘  │
└──────────────┘  └──────────────┘
```

## Core Components

### 1. Bee System (`bee-system.ts`)

- **Task Distribution**: Routes tasks to appropriate bees
- **Load Balancing**: Distributes work based on bee availability
- **Memory Management**: Stores and shares knowledge between bees
- **Status Tracking**: Monitors bee health and performance

### 2. Bee Communication (`bee-communication.ts`)

- **Inter-Bee Messaging**: Bees can talk to each other
- **Cross-Hive Communication**: Bees from different hives can communicate
- **Knowledge Sharing**: Bees share what they learn
- **Help Requests**: Bees can ask for help from others

### 3. Hive Manager (`hive-manager.ts`)

- **Hive Discovery**: Finds other hives in Colony OS
- **Cross-Hive Tasks**: Send tasks to other hives
- **Health Monitoring**: Tracks hive status
- **Capability Routing**: Finds hives with specific capabilities

### 4. Synapse Bridge (`synapse-bridge.ts`)

- **Real-Time Connection**: Socket.io connection to Colony OS
- **Event Publishing**: Sends events to Colony OS
- **Intelligence Queries**: Requests data from Colony OS
- **Reconnection Logic**: Auto-reconnects if connection drops

## Bee Types

### Worker Bees

- **ti-guy-chat**: Handles user chat
- **studio-caption**: Generates captions
- **studio-image**: Generates images
- **studio-video**: Generates videos
- **post-composer**: Composes posts

### Guardian Bees

- **moderation**: Content moderation
- **media-budget**: Budget tracking
- **security-bee**: Security monitoring
- **health-bee**: System health

### Architect Bees

- **analytics-summarizer**: Analytics summaries
- **issue-rewrite**: Issue clarification
- **dream-expansion**: Idea expansion

## Usage Examples

### Assign Task to Bee

```typescript
import { beeSystem } from "./colony/bee-system.js";

// Assign task to bee with capability
const task = await beeSystem.assignTask(
  "chat",
  {
    message: "Hello!",
    userId: "user123",
  },
  {
    priority: "high",
  },
);

// Wait for completion
beeSystem.once("task.completed", (completedTask) => {
  if (completedTask.id === task.id) {
    console.log("Result:", completedTask.result);
  }
});
```

### Send Message Between Bees

```typescript
import { beeCommunication } from "./colony/bee-communication.js";

// Send message to another bee
await beeCommunication.sendMessage(
  "ti-guy-chat",
  "moderation",
  "Check this content",
  { content: "..." },
);

// Broadcast to all bees
await beeCommunication.broadcast(
  "ti-guy-chat",
  "New feature deployed!",
  { feature: "..." },
  { scope: "colony" }, // All hives
);
```

### Share Knowledge

```typescript
// Bee learns something and shares it
await beeCommunication.shareKnowledge(
  "moderation",
  "spam_patterns",
  ["pattern1", "pattern2"],
  { scope: "colony" }, // Share with all hives
);

// Another bee learns from it
const patterns = await beeCommunication.learnFromOthers(
  "security-bee",
  "spam_patterns",
  { scope: "colony" },
);
```

### Cross-Hive Tasks

```typescript
import { hiveManager } from "./colony/hive-manager.js";

// Send task to another hive
const task = await hiveManager.sendTaskToHive(
  "planexa",
  "analytics",
  { query: "user_metrics" },
  "high",
);

console.log("Result from Planexa:", task.result);
```

## Bee Lifecycle

1. **Registration**: Bee registers with Bee System
2. **Discovery**: Bee System registers with Colony OS
3. **Task Assignment**: Tasks routed to appropriate bee
4. **Execution**: Bee processes task
5. **Learning**: Bee stores knowledge (shared or private)
6. **Communication**: Bee can message other bees
7. **Health Reporting**: Bee reports status periodically

## Multi-Hive Communication

### Same Hive

```typescript
// Direct bee-to-bee communication
beeCommunication.sendMessage("bee1", "bee2", "Hello!");
```

### Different Hives

```typescript
// Cross-hive communication via Colony OS
beeCommunication.sendMessage(
  "bee1",
  "bee2",
  "Hello!",
  {},
  { targetHive: "planexa" },
);
```

## Knowledge Sharing

### Local Memory (Private)

```typescript
// Only this bee can access
await beeSystem.storeMemory("bee1", "secret", "value", false);
```

### Shared Memory (Colony-Wide)

```typescript
// All bees in all hives can access
await beeCommunication.shareKnowledge(
  "bee1",
  "best_practices",
  { ... },
  { scope: "colony" }
);
```

## Event Flow

```
User Request
    ↓
Route Handler
    ↓
Bee System (assigns task)
    ↓
Bee (processes task)
    ↓
Store Knowledge (if learned something)
    ↓
Share with Colony OS (if shared)
    ↓
Other Hives can learn from it
```

## Configuration

### Environment Variables

```bash
# Colony OS Connection
COLONY_OS_URL=http://localhost:10000
COLONY_API_KEY=your-colony-api-key

# Hive Configuration
HIVE_ID=zyeute
HIVE_NAME=Zyeuté - Quebec Social Media
```

## Monitoring

### Bee Status

```typescript
const status = beeSystem.getBeeStatus("ti-guy-chat");
console.log(`Status: ${status.status}, Load: ${status.load}`);
```

### Hive Health

```typescript
const hives = hiveManager.getKnownHives();
hives.forEach((hive) => {
  console.log(`${hive.hiveId}: ${hive.status} (${hive.beeCount} bees)`);
});
```

## Benefits

1. **Distributed Intelligence**: Knowledge shared across all hives
2. **Load Distribution**: Tasks can be routed to any hive
3. **Fault Tolerance**: If one hive fails, others can help
4. **Learning**: Bees learn from each other's experiences
5. **Scalability**: Add new hives without changing existing code

## Next Steps

1. ✅ **Bee System** - Task distribution and memory
2. ✅ **Bee Communication** - Inter-bee messaging
3. ✅ **Hive Manager** - Multi-hive orchestration
4. ✅ **Synapse Bridge** - Colony OS connection
5. 🔄 **Bee Implementations** - Actual bee handlers
6. 🔄 **Learning System** - Advanced knowledge sharing
7. 🔄 **Bee Analytics** - Performance tracking

---

**Status**: ✅ Core System Complete  
**Next**: Implement individual bee handlers
