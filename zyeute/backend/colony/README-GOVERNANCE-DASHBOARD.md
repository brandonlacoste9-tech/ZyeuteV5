# 🛡️ Governance Engine & 👑 Observability Dashboard

## Overview

**Governance Engine** = "The Queen's Decree" - Hard constraints and safety guardrails  
**Observability Dashboard** = "Queen's View" - Complete visibility into the Hive Mind

Together, they ensure your Colony OS remains **safe, visible, and compliant** as it evolves.

## Governance Engine - "The Queen's Decree"

### Purpose

Hard constraints that ML models **cannot override**. Ensures AI evolution remains aligned with human/business goals.

### Policy Types

1. **Performance Policies**
   - CPU usage limits
   - Latency thresholds
   - Resource constraints

2. **Safety Policies**
   - Minimum confidence requirements
   - Content moderation requirements
   - Critical decision safeguards

3. **Compliance Policies**
   - Data privacy (GDPR/CCPA)
   - Regulatory requirements
   - Legal compliance

4. **Ethical Policies**
   - Bias detection
   - Fairness requirements
   - Ethical guardrails

5. **Resource Policies**
   - Cost limits
   - Budget constraints
   - Resource allocation

### Policy Actions

- **Block** - Prevent deployment/execution
- **Warn** - Allow but log warning
- **Require Approval** - Human review needed
- **Rollback** - Revert to previous version

### Default Policies

```typescript
// Performance
- CPU Usage Limit: Block if > 80%
- Latency Limit: Block if > 2 seconds

// Safety
- Minimum Confidence: Block if < 90% for critical decisions
- Content Moderation: Block if not moderated

// Compliance
- Data Privacy: Block if not GDPR/CCPA compliant

// Ethical
- Bias Detection: Require approval if bias score > 0.1

// Resource
- Cost Limit: Require approval if exceeds budget
```

## Observability Dashboard - "Queen's View"

### Purpose

Complete visibility into Colony OS state, decisions, and health.

### Key Features

1. **Real-Time Metrics**
   - Bee status (active, busy, idle)
   - Hive health
   - Model counts
   - Pipeline status
   - Feature usage
   - Compliance checks

2. **Drift Visualization**
   - Drift detection timeline
   - Severity indicators
   - Metric comparisons (before/after)
   - Trend analysis

3. **Pipeline Visualizer**
   - DAG view of pipeline steps
   - Real-time progress
   - Step status (pending/running/completed)
   - Artifact tracking

4. **Feature Catalog**
   - Searchable feature list
   - Feature definitions
   - Usage statistics
   - Last accessed times

5. **Model Lineage**
   - Family tree visualization
   - Parent/child relationships
   - Experiment history
   - Performance evolution

6. **System Health**
   - Overall status (healthy/degraded/critical)
   - Issue detection
   - Recommendations

## Integration Flow

```
Model Evaluated
    ↓
Governance Engine Checks Policies
    ↓
┌─────────────────────────────┐
│  Policy Violation?          │
│  - Block → Stop Deployment  │
│  - Warn → Log & Continue    │
│  - Require Approval → Wait  │
└─────────────────────────────┘
    ↓
Observability Dashboard Updates
    ↓
- Metrics Updated
- Drift Tracked
- Compliance Logged
- Health Assessed
```

## Usage Examples

### Example 1: Policy Enforcement

```typescript
// Model evaluated
const performance = await learningSystem.evaluateModel(
  "moderation",
  "2.1.0",
  { accuracy: 0.95, confidence: 0.85 }, // Low confidence!
);

// Governance checks
const compliance = await governanceEngine.checkModelCompliance(
  "moderation",
  "2.1.0",
  performance.metrics,
);

if (compliance.blocked) {
  // Deployment blocked - confidence too low
  console.log("Deployment blocked:", compliance.checks);
}
```

### Example 2: Dashboard Metrics

```typescript
// Get current metrics
const metrics = observabilityDashboard.getMetrics();

console.log(`Bees: ${metrics.bees.active}/${metrics.bees.total} active`);
console.log(
  `Models: ${metrics.models.total} total, ${metrics.models.driftDetected} with drift`,
);
console.log(`Pipelines: ${metrics.pipelines.running} running`);

// Get system health
const health = observabilityDashboard.getSystemHealth();
console.log(`Status: ${health.status}`);
console.log(`Issues: ${health.issues.join(", ")}`);
```

### Example 3: Drift Tracking

```typescript
// Get drift history
const driftHistory = observabilityDashboard.getDriftHistory(50);

driftHistory.forEach((drift) => {
  console.log(`${drift.beeId} v${drift.modelVersion}: ${drift.severity} drift`);
  console.log(`  Metrics delta:`, drift.metrics.delta);
});
```

### Example 4: Human Approval

```typescript
// Policy requires approval
governanceEngine.on(
  "model.requires_approval",
  async ({ performance, compliance }) => {
    // Notify admin
    await notifyAdmin({
      model: `${performance.beeId} v${performance.modelVersion}`,
      reason: "Bias detected",
      requiresApproval: true,
    });
  },
);

// Admin approves
await governanceEngine.approveDeployment(
  "moderation-2.1.0",
  "model",
  "admin@example.com",
  "Reviewed bias report, acceptable for deployment",
);
```

## API Endpoints

### Dashboard

- `GET /api/dashboard/metrics` - Get current metrics
- `GET /api/dashboard/health` - Get system health
- `GET /api/dashboard/drift` - Get drift history
- `GET /api/dashboard/pipelines` - Get pipeline statuses
- `GET /api/dashboard/features` - Get feature catalog
- `GET /api/dashboard/lineage/:beeId/:modelVersion` - Get model lineage

### Governance

- `GET /api/dashboard/governance/policies` - Get all policies
- `GET /api/dashboard/governance/compliance/:entityId` - Get compliance checks
- `GET /api/dashboard/governance/audit` - Get audit logs
- `POST /api/dashboard/governance/approve` - Approve deployment

## Audit Trail

All governance decisions are logged immutably:

```typescript
{
  id: "audit-123",
  action: "compliance_check",
  entityType: "model",
  entityId: "moderation-2.1.0",
  actor: "governance_engine",
  decision: "blocked",
  reason: "Confidence too low for critical decision",
  policies: ["safety-confidence-min"],
  timestamp: "2024-01-01T00:00:00Z",
  immutable: true
}
```

## Benefits

### Governance Engine

- **Safety**: Prevents unsafe deployments
- **Compliance**: Ensures regulatory adherence
- **Ethics**: Detects and prevents bias
- **Control**: Human oversight when needed

### Observability Dashboard

- **Visibility**: See everything happening
- **Trust**: Understand why decisions were made
- **Debugging**: Quickly identify issues
- **Optimization**: Data-driven improvements

## Configuration

### Adding Custom Policies

```typescript
governanceEngine.addPolicy({
  id: "custom-policy",
  name: "Custom Policy",
  description: "Your custom rule",
  type: "safety",
  rule: {
    condition: "custom_metric > threshold",
    action: "block",
    message: "Custom policy violation",
  },
  severity: "high",
  enabled: true,
});
```

## Monitoring

### Real-Time Updates

```typescript
// Listen for metrics updates
observabilityDashboard.on("metrics.updated", (metrics) => {
  console.log("Metrics updated:", metrics);
});

// Listen for drift
observabilityDashboard.on("drift.detected", (drift) => {
  console.log("Drift detected:", drift);
});

// Listen for governance decisions
governanceEngine.on("model.blocked", ({ performance, compliance }) => {
  console.log("Model blocked:", performance.beeId);
});
```

## Next Steps

1. ✅ **Governance Engine** - Complete
2. ✅ **Observability Dashboard** - Complete
3. 🔄 **Frontend Dashboard UI** - Build React dashboard
4. 🔄 **Alerting System** - Notifications for critical events
5. 🔄 **Policy Templates** - Reusable policy definitions
6. 🔄 **Advanced Visualizations** - Charts and graphs

---

**Status**: ✅ Complete  
**Impact**: System is now safe, visible, and compliant!
