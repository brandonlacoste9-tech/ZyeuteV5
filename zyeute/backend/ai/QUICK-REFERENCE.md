# Circuit Breaker Quick Reference

## Core Concept

**Circuit Breaker** = Automatic failover from premium models to reliable fallback when primary fails.

```
gemini-1.5-pro (intended)
    ↓ (fails 3 times)
Circuit Breaker trips
    ↓
gemini-2.0-flash (fallback)
    ↓ (succeeds)
User gets response (never sees error!)
```

## Quick Usage

### Basic Pattern

```typescript
import { CircuitBreaker } from "./circuit-breaker.js";
import { callGeminiModel } from "./vertex-model-service.js";

// Create breaker
const breaker = new CircuitBreaker(callGeminiModel, {
  failureThreshold: 3,      // Trip after 3 failures
  resetTimeout: 10000,      // Retry after 10 seconds
  fallbackModel: "gemini-2.0-flash"
});

// Use it
const result = await breaker.callModel("gemini-1.5-pro", {
  prompt: "Your prompt here",
  temperature: 0.7,
});

// Check what happened
console.log(`Used: ${result.modelUsed}`);
console.log(`Intervened: ${result.circuitBreakerIntervened}`);
```

### With TI-Guy (Already Integrated)

```typescript
import { generateWithTIGuy } from "./vertex-service.js";

// Just call normally - Circuit Breaker is automatic!
const response = await generateWithTIGuy({
  mode: "content",
  message: "Create a Quebec meme",
});

// Metadata tells you what happened
if (response.metadata?.circuitBreakerIntervened) {
  // Circuit breaker saved the day!
}
```

## States

| State | Meaning | Behavior |
|-------|---------|----------|
| **CLOSED** | Normal | All requests go to primary model |
| **OPEN** | Tripped | All requests fail-fast to fallback |
| **HALF_OPEN** | Testing | One request allowed to test recovery |

## Configuration

### Default Settings

```typescript
{
  failureThreshold: 3,        // Failures before opening
  resetTimeout: 10000,        // 10 seconds
  fallbackModel: "gemini-2.0-flash"
}
```

### Customize

```typescript
const breaker = new CircuitBreaker(modelCallFn, {
  failureThreshold: 5,        // More tolerant
  resetTimeout: 30000,        // Longer recovery
  fallbackModel: "gemini-2.0-flash-exp" // Different fallback
});
```

## Response Format

```typescript
{
  content: "AI-generated text",
  modelUsed: "gemini-2.0-flash",        // What actually ran
  circuitBreakerIntervened: true         // Did failover occur?
}
```

## Protected Routes

- ✅ `/api/ai/tiguy-chat` - TI-Guy chat
- ✅ `/api/tiguy/chat` - Legacy TI-Guy
- ✅ Video thumbnail analysis
- ✅ Content generation

All return `metadata` field with model info.

## Testing

```bash
# Run test suite
npm run test:circuit-breaker

# Test specific scenario
npm run test:circuit-breaker -- --grep "failover"
```

## Monitoring

### Admin Dashboard
```
/admin/ai-dashboard
```

### API Endpoint
```bash
GET /api/admin/ai-metrics
```

## Common Scenarios

### Scenario 1: Normal Operation
```
Request → gemini-1.5-pro → Success → CLOSED
```

### Scenario 2: Failure & Recovery
```
Request → gemini-1.5-pro → Fail (1)
Request → gemini-1.5-pro → Fail (2)
Request → gemini-1.5-pro → Fail (3) → OPEN
Request → gemini-2.0-flash → Success (failover)
... (10 seconds pass) ...
Request → gemini-1.5-pro → HALF_OPEN → Success → CLOSED
```

### Scenario 3: Persistent Failure
```
Request → gemini-1.5-pro → Fail → OPEN
Request → gemini-2.0-flash → Success (all requests)
... (model stays OPEN, all traffic to fallback) ...
```

## Safety Features

✅ **Fallback Protection**: Fallback model never triggers circuit breaker  
✅ **No Cascading Failures**: Isolated per-model state  
✅ **Self-Healing**: Automatic recovery after timeout  
✅ **Backward Compatible**: Existing code works unchanged  

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Circuit always OPEN | Check if model is actually failing |
| No failover | Verify `failureThreshold` is reached |
| Fallback fails | Critical error - check Vertex AI status |

---

**See Also**: `CIRCUIT-BREAKER-IMPLEMENTATION.md` for full details
