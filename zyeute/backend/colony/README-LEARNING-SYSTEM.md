# 🧠 Colony OS Learning System

## Overview

**The Learning System** is the collective brain of your Colony OS ecosystem. It enables bees to learn, remember, and share knowledge across all hives, creating a continuously improving system.

Built on **Google Cloud Vertex AI** services:

- **Model Registry** → Hive Mind catalog of all learned models
- **Experiments** → Track learning patterns and compare approaches
- **Model Monitoring** → Detect drift and performance issues
- **ML Metadata** → Knowledge provenance and lineage tracking

## Architecture

```
Bee Learns Something
    ↓
Learning System (stores knowledge)
    ↓
┌─────────────────────────────────┐
│  Vertex AI Integration         │
│  - Model Registry (catalog)    │
│  - Experiments (tracking)      │
│  - Monitoring (drift detection)│
│  - ML Metadata (lineage)       │
└─────────────────────────────────┘
    ↓
Colony OS (shares with all hives)
    ↓
Other Bees Learn From It
```

## Core Concepts

### Learning Types

1. **Pattern** - Learned patterns (e.g., "spam detection patterns")
2. **Model** - Trained models (e.g., "caption generation model v2.1")
3. **Strategy** - Successful strategies (e.g., "best prompt for Quebec content")
4. **Insight** - General insights (e.g., "users prefer shorter captions")

### Knowledge Flow

```
Bee A learns → Stores in Learning System
    ↓
Registered in Vertex AI Model Registry
    ↓
Tracked in ML Metadata (lineage)
    ↓
Shared with Colony OS
    ↓
Bee B (different hive) retrieves it
    ↓
Bee B uses it and improves it
    ↓
New learning stored (derived from Bee A's)
```

## Vertex AI Integration

### 1. Model Registry (Hive Mind)

**Purpose**: Central catalog of all learned models

```typescript
// When a bee learns a model
await learningSystem.learn(
  "ti-guy-chat",
  "model",
  "caption_model_v2",
  modelData,
  {
    modelVersion: "2.1.0",
    performance: 0.95,
  },
);

// Model automatically registered in Vertex AI Model Registry
// Other hives can discover and use it
```

**Benefits**:

- Version control for models
- Discover models from other hives
- Track model performance over time
- Reuse proven models

### 2. Experiments (Learning Patterns)

**Purpose**: Track and compare different learning approaches

```typescript
// Start experiment
const experiment = await learningSystem.startExperiment(
  "moderation",
  "Spam Detection Patterns",
  "Testing different pattern matching approaches",
  { approach: "regex", threshold: 0.8 },
);

// ... bee runs experiment ...

// Complete with results
await learningSystem.completeExperiment(experiment.id, {
  successRate: 0.92,
  falsePositives: 0.05,
  latency: 120,
});
```

**Benefits**:

- Compare different approaches systematically
- Identify what works best
- Share successful experiments with other hives
- Build on previous learnings

### 3. Model Monitoring (Drift Detection)

**Purpose**: Detect when models degrade over time

```typescript
// Evaluate model performance
const performance = await learningSystem.evaluateModel("ti-guy-chat", "2.1.0", {
  accuracy: 0.95,
  latency: 1200,
  successRate: 0.92,
  usageCount: 1500,
});

// System automatically checks for drift
// If drift detected → alerts Colony OS
// Other bees can take over if model degraded
```

**Benefits**:

- Early warning when models degrade
- Automatic failover to better models
- Continuous quality assurance
- Prevents using outdated knowledge

### 4. ML Metadata (Knowledge Provenance)

**Purpose**: Track where knowledge came from

```typescript
// Learning automatically tracked with lineage
const learning = await learningSystem.learn(
  "moderation",
  "pattern",
  "spam_pattern_2024",
  ["pattern1", "pattern2"],
  {
    performance: 0.95,
  },
);

// Lineage tracked:
// - Which bee learned it
// - Which hive it came from
// - Which experiments it came from
// - Which models it's derived from
```

**Benefits**:

- Trace knowledge back to source
- Understand what works and why
- Build on proven foundations
- Avoid repeating mistakes

## Usage Examples

### Example 1: Bee Learns a Pattern

```typescript
import { learningSystem } from "./colony/learning-system.js";

// Moderation bee learns a new spam pattern
await learningSystem.learn(
  "moderation",
  "pattern",
  "spam_pattern_quebec_2024",
  ["pattern1", "pattern2", "pattern3"],
  {
    performance: 0.95,
    successRate: 0.92,
    tags: ["spam", "quebec", "2024"],
  },
);

// Automatically:
// - Stored locally
// - Registered in Vertex AI (if model type)
// - Tracked in ML Metadata
// - Shared with Colony OS
// - Available to all other bees
```

### Example 2: Another Bee Learns From It

```typescript
// Security bee retrieves the pattern
const learning = await learningSystem.retrieve(
  "security-bee",
  "spam_pattern_quebec_2024",
  {
    scope: "colony", // Search all hives
    type: "pattern",
    minPerformance: 0.9, // Only high-performing patterns
  },
);

// Security bee uses it and improves it
const improvedPattern = [...learning.value, "pattern4"];

// Stores improved version (with lineage)
await learningSystem.learn(
  "security-bee",
  "pattern",
  "spam_pattern_quebec_2024_v2",
  improvedPattern,
  {
    performance: 0.97,
    lineage: {
      sourceBee: "moderation",
      sourceHive: "zyeute",
      derivedFrom: ["spam_pattern_quebec_2024"],
    },
  },
);
```

### Example 3: Experiment Tracking

```typescript
// Start experiment to find best caption strategy
const experiment = await learningSystem.startExperiment(
  "studio-caption",
  "Caption Length Optimization",
  "Testing different caption lengths for engagement",
  {
    lengths: [50, 100, 150],
    styles: ["formal", "joual", "mixed"],
  },
);

// Run experiments...
// (bee would test different combinations)

// Complete with results
await learningSystem.completeExperiment(experiment.id, {
  engagementRate: 0.85,
  bestLength: 100,
  bestStyle: "joual",
  successRate: 0.92,
});

// System automatically learns best strategy
// Available to all bees in all hives
```

### Example 4: Model Performance Monitoring

```typescript
// Evaluate model periodically
const performance = await learningSystem.evaluateModel("ti-guy-chat", "2.1.0", {
  accuracy: 0.95,
  latency: 1200,
  cost: 0.001,
  successRate: 0.92,
  usageCount: 1500,
});

// If drift detected:
if (performance.drift?.detected) {
  // System can:
  // - Alert Colony OS
  // - Switch to fallback model
  // - Trigger retraining
  // - Notify other hives
}
```

## API Endpoints

### Learning

- `POST /api/learning/learn` - Store learned knowledge
- `GET /api/learning/retrieve/:key` - Retrieve knowledge
- `GET /api/learning/best/:type` - Get best performing learning
- `GET /api/learning/bee/:beeId` - Get bee's learnings
- `GET /api/learning/all` - Get all learnings

### Experiments

- `POST /api/learning/experiment/start` - Start experiment
- `POST /api/learning/experiment/complete` - Complete experiment

### Models

- `POST /api/learning/model/evaluate` - Evaluate model
- `GET /api/learning/models/discover` - Discover models from other hives
- `GET /api/learning/lineage/:key` - Get knowledge lineage

## Integration with Bee System

### Automatic Learning

Bees automatically learn from their experiences:

```typescript
// When bee completes a task successfully
beeSystem.on("task.completed", async (task) => {
  if (task.result.successRate > 0.9) {
    // Bee learned something valuable
    await learningSystem.learn(
      task.beeId,
      "strategy",
      `task_${task.capability}_success`,
      {
        approach: task.payload,
        result: task.result,
      },
      {
        performance: task.result.successRate,
        successRate: task.result.successRate,
      },
    );
  }
});
```

### Knowledge Retrieval

Bees can retrieve knowledge before starting tasks:

```typescript
// Before processing, bee checks for learned patterns
const bestStrategy = await learningSystem.getBestLearning("strategy", 0.8);

if (bestStrategy) {
  // Use proven strategy
  task.payload = { ...task.payload, ...bestStrategy.value };
}
```

## Benefits

### 1. **Collective Intelligence**

- One bee learns → all bees benefit
- Knowledge compounds across hives
- System gets smarter over time

### 2. **Continuous Improvement**

- Track what works and what doesn't
- Systematic experimentation
- Data-driven optimization

### 3. **Fault Tolerance**

- Detect when models degrade
- Switch to better models automatically
- Learn from failures

### 4. **Knowledge Provenance**

- Trace where knowledge came from
- Build on proven foundations
- Avoid repeating mistakes

## Configuration

### Environment Variables

```bash
# Vertex AI (required for full learning system)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json

# Colony OS (for cross-hive learning)
COLONY_OS_URL=http://localhost:10000
COLONY_API_KEY=your-colony-api-key
```

## Next Steps

1. ✅ **Learning System** - Complete
2. ✅ **Vertex AI Integration** - Complete
3. 🔄 **Model Registry Setup** - Configure Vertex AI Model Registry
4. 🔄 **Experiments Dashboard** - Visualize experiments
5. 🔄 **Monitoring Alerts** - Set up drift detection alerts
6. 🔄 **Lineage Visualization** - Show knowledge flow

---

**Status**: ✅ Core System Complete  
**Next**: Configure Vertex AI services and start learning!
