# 🚀 MLOps Pipelines & Feature Store

## Overview

**Automated MLOps Pipelines** and **Centralized Feature Store** complete your Colony OS ecosystem, moving from reactive tracking to **proactive, automated self-improvement**.

Built on **Google Cloud Vertex AI**:

- **Vertex AI Pipelines** → Automated ML workflows
- **Vertex AI Feature Store** → Centralized feature management

## Architecture

```
Model Monitoring Detects Drift
    ↓
MLOps Pipeline Auto-Triggered
    ↓
┌─────────────────────────────────┐
│  Vertex AI Pipelines            │
│  1. Collect Data (Feature Store)│
│  2. Preprocess                  │
│  3. Train Model                 │
│  4. Evaluate                    │
│  5. Register (Model Registry)  │
│  6. Deploy (if better)          │
└─────────────────────────────────┘
    ↓
New Model Available
    ↓
Bees Automatically Use It
```

## MLOps Pipelines

### Automated Retraining Pipeline

**Trigger**: Model drift detected or performance drop

```typescript
// Automatically triggered when:
// - Model drift severity = "high"
// - Performance drops > 20%

// Pipeline steps:
1. Collect Data → Get features from Feature Store (last 30 days)
2. Preprocess → Clean and prepare data
3. Train Model → Train new version
4. Evaluate → Compare with current production model
5. Register → Store in Model Registry
6. Deploy → Only if performance > current
```

### Experimentation Pipeline

**Trigger**: Manual or scheduled

```typescript
// Systematically test different approaches
1. Prepare Variants → Create 3 different configurations
2. Train Variants → Train all in parallel
3. Compare Results → Side-by-side evaluation
4. Register Best → Store winning approach
```

## Feature Store

### Centralized Feature Management

**Purpose**: Ensure features used for training match online inference

```typescript
// Define feature once
featureStore.defineFeature({
  name: "user_reputation_score",
  description: "User reputation based on engagement",
  type: "number",
  source: "computed",
  computation: "sum(engagement) / account_age",
});

// Store feature value (Online Serving)
await featureStore.storeFeature("user123", "user_reputation_score", 0.85);

// Get feature value (Online Serving - Real-time)
const score = await featureStore.getFeature("user123", "user_reputation_score");

// Get features for training (Offline Serving - Time-travel)
const features = await featureStore.getFeaturesForTraining(
  ["user123", "user456"],
  ["user_reputation_score", "content_quality_score"],
  {
    snapshotTime: "2024-01-01T00:00:00Z", // Point-in-time
  },
);
```

### Benefits

1. **Consistency**: Same features for training and inference
2. **Reusability**: Compute once, use everywhere
3. **Time-Travel**: Access historical feature values
4. **Online/Offline**: Real-time serving + batch training

## Integration Flow

### Complete Automation Cycle

```
1. Bee Uses Model
    ↓
2. Model Monitoring Evaluates Performance
    ↓
3. Drift Detected (High Severity)
    ↓
4. MLOps Pipeline Auto-Triggered
    ↓
5. Pipeline Collects Features from Feature Store
    ↓
6. Pipeline Trains New Model
    ↓
7. Pipeline Evaluates New Model
    ↓
8. If Better → Registers in Model Registry
    ↓
9. If Better → Deploys to Production
    ↓
10. Bees Automatically Use New Model
    ↓
11. System Improved Automatically
```

## Usage Examples

### Example 1: Auto-Retrain on Drift

```typescript
// Model monitoring detects drift
learningSystem.on("model.evaluated", async (performance) => {
  if (performance.drift?.detected && performance.drift.severity === "high") {
    // Pipeline automatically triggered
    const run = await mlopsPipelines.triggerPipeline("auto-retrain", {
      beeId: performance.beeId,
      modelVersion: performance.modelVersion,
      driftSeverity: performance.drift.severity,
    });

    // Pipeline will:
    // 1. Get features from Feature Store
    // 2. Train new model
    // 3. Evaluate
    // 4. Deploy if better
  }
});
```

### Example 2: Feature Consistency

```typescript
// During training (Offline Serving)
const trainingFeatures = await featureStore.getFeaturesForTraining(
  userIds,
  ["user_reputation_score", "content_quality_score"],
  {
    snapshotTime: "2024-01-01T00:00:00Z", // Historical snapshot
  },
);

// Train model with these features
const model = trainModel(trainingFeatures);

// During inference (Online Serving)
const inferenceFeatures = await featureStore.getFeatures(userId, [
  "user_reputation_score",
  "content_quality_score",
]);

// Use same features for prediction
const prediction = model.predict(inferenceFeatures);
```

### Example 3: Experimentation Pipeline

```typescript
// Trigger experimentation pipeline
const run = await mlopsPipelines.triggerPipeline("experiment", {
  beeId: "ti-guy-chat",
  variants: [
    { temperature: 0.7, maxTokens: 512 },
    { temperature: 0.8, maxTokens: 1024 },
    { temperature: 0.9, maxTokens: 2048 },
  ],
});

// Pipeline will:
// 1. Train all variants
// 2. Compare side-by-side
// 3. Register best performing
```

## API Endpoints

### Pipelines

- `POST /api/mlops/pipeline/trigger` - Trigger pipeline
- `GET /api/mlops/pipeline/run/:runId` - Get run status
- `GET /api/mlops/pipeline/runs` - Get all runs

### Features

- `POST /api/mlops/features/store` - Store feature value
- `GET /api/mlops/features/:entityId/:featureName` - Get feature value
- `POST /api/mlops/features/batch` - Get multiple features (inference)
- `POST /api/mlops/features/training` - Get features for training
- `POST /api/mlops/features/define` - Define new feature

## Default Features

### User Features

- `user_reputation_score` - Reputation based on engagement
- `user_activity_level` - Activity frequency
- `user_content_quality` - Average content quality

### Content Features

- `content_quality_score` - AI-generated quality score
- `content_engagement_potential` - Predicted engagement
- `content_safety_score` - Moderation score

### Interaction Features

- `spam_probability` - Spam detection probability
- `toxicity_score` - Toxicity detection
- `engagement_rate` - Historical engagement

## Pipeline Configuration

### Auto-Retrain Pipeline

```typescript
{
  name: "auto-retrain",
  trigger: "drift",
  steps: [
    {
      id: "collect_data",
      type: "data_preprocessing",
      config: {
        source: "feature_store",
        window: "last_30_days",
      },
    },
    {
      id: "train_model",
      type: "training",
      config: {
        algorithm: "auto",
        hyperparameters: "from_best_experiment",
      },
    },
    {
      id: "evaluate_model",
      type: "evaluation",
      config: {
        compareWith: "current_production",
      },
    },
    {
      id: "register_model",
      type: "registration",
      config: {
        registry: "vertex_ai",
      },
    },
    {
      id: "deploy_if_better",
      type: "deployment",
      config: {
        condition: "performance > current",
      },
    },
  ],
}
```

## Benefits

### 1. **Automated Improvement**

- No manual intervention needed
- System improves itself automatically
- Continuous optimization

### 2. **Consistent Features**

- Same features for training and inference
- No feature drift
- Reliable predictions

### 3. **Scalable Experimentation**

- Test multiple approaches systematically
- Compare objectively
- Learn what works best

### 4. **Reduced Manual Effort**

- Automate entire ML lifecycle
- Free bees for higher-level tasks
- Focus on strategy, not execution

## Configuration

### Environment Variables

```bash
# Vertex AI (required)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json

# Feature Store
FEATURE_STORE_NAME=colony-features
FEATURE_STORE_REGION=us-central1

# Pipelines
PIPELINE_BUCKET=gs://your-pipeline-bucket
```

## Monitoring

### Pipeline Status

```typescript
// Get pipeline run status
const run = mlopsPipelines.getPipelineRun(runId);

console.log(`Status: ${run.status}`);
console.log(
  `Steps: ${run.steps.map((s) => `${s.stepId}: ${s.status}`).join(", ")}`,
);
console.log(`Artifacts: ${run.artifacts.length}`);
```

### Feature Usage

```typescript
// Track feature usage
featureStore.on("feature.accessed", (feature) => {
  console.log(`Feature accessed: ${feature.name} for ${feature.entityId}`);
});
```

## Next Steps

1. ✅ **MLOps Pipelines** - Complete
2. ✅ **Feature Store** - Complete
3. 🔄 **Pipeline Templates** - Create reusable templates
4. 🔄 **Feature Monitoring** - Monitor feature quality
5. 🔄 **A/B Testing** - Built-in A/B testing pipelines
6. 🔄 **Cost Optimization** - Track pipeline costs

---

**Status**: ✅ Complete  
**Impact**: System now self-improves automatically!
