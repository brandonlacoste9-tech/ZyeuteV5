# Circuit Breaker for Vertex AI Models

## Overview

The Circuit Breaker provides **automatic failover** from premium models (like `gemini-1.5-pro`) to reliable fallback models (like `gemini-2.0-flash`) when the primary model fails, times out, or starts hallucinating.

This ensures **zero-downtime AI responses** and prevents cascading failures.

## How It Works

### States

1. **CLOSED** (Normal): Model is healthy, requests flow through normally
2. **OPEN** (Tripped): Model has failed too many times, requests fail-fast to fallback
3. **HALF_OPEN** (Testing): After timeout, one request is allowed to test if model recovered

### Automatic Failover

```
User Request → gemini-1.5-pro (intended)
                ↓ (fails)
              Circuit Breaker detects failure
                ↓
              gemini-2.0-flash (fallback)
                ↓ (succeeds)
              User gets response (never sees error!)
```

## Usage

### Basic Example

```typescript
import { CircuitBreaker } from "./circuit-breaker.js";
import { callGeminiModel } from "./vertex-model-service.js";

// Create circuit breaker
const breaker = new CircuitBreaker(callGeminiModel, {
  failureThreshold: 3,      // Trip after 3 failures
  resetTimeout: 10000,      // Try again after 10 seconds
  fallbackModel: "gemini-2.0-flash"
});

// Call with protection
const result = await breaker.callModel("gemini-1.5-pro", {
  prompt: "Say hello",
  temperature: 0.7,
});

// Check which model was actually used
console.log(`Intended: gemini-1.5-pro`);
console.log(`Actual: ${result.modelUsed}`);
console.log(`Circuit Breaker Intervened: ${result.circuitBreakerIntervened}`);
```

### With TI-Guy (Automatic Integration)

The `generateWithTIGuy` function now automatically uses the Circuit Breaker:

```typescript
import { generateWithTIGuy } from "./vertex-service.js";

const response = await generateWithTIGuy({
  mode: "content",
  message: "Create a Quebec meme",
  context: "Social media post",
}, userCredits); // Optional: credits determine model selection

// Response includes metadata
console.log(response.metadata);
// {
//   intendedModel: "gemini-1.5-pro",
//   actualModel: "gemini-2.0-flash",
//   circuitBreakerIntervened: true
// }
```

## Configuration

### Environment Variables

```bash
# Vertex AI Configuration
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/service-account.json

# Circuit Breaker Settings (optional)
CIRCUIT_BREAKER_FAILURE_THRESHOLD=3
CIRCUIT_BREAKER_RESET_TIMEOUT=10000
```

### Options

- `failureThreshold`: Number of failures before opening circuit (default: 3)
- `resetTimeout`: Milliseconds to wait before trying again (default: 10000)
- `fallbackModel`: Model to use when primary fails (default: "gemini-2.0-flash")

## Monitoring

### Check Circuit State

```typescript
const breaker = getCircuitBreaker();
const state = breaker.getModelState("gemini-1.5-pro");

console.log(`State: ${state.state}`); // CLOSED, OPEN, or HALF_OPEN
console.log(`Failures: ${state.failureCount}`);
console.log(`Last Error: ${state.lastError}`);
```

### Get All States

```typescript
const allStates = breaker.getAllStates();
for (const [model, state] of allStates.entries()) {
  console.log(`${model}: ${state.state} (${state.failureCount} failures)`);
}
```

### Manual Reset (Admin)

```typescript
breaker.resetModel("gemini-1.5-pro"); // Force reset for testing
```

## Testing

Run the verification test:

```bash
npm run test:circuit-breaker
```

This test:
1. ✅ Simulates model failures
2. ✅ Verifies automatic failover
3. ✅ Tests circuit tripping
4. ✅ Tests recovery after timeout
5. ✅ Ensures fallback model never fails

## Production Benefits

1. **Zero Downtime**: Users never see errors, even when premium models fail
2. **Self-Healing**: Automatically recovers when models come back online
3. **Cost Optimization**: Uses free credits (flash) when pro models are unstable
4. **Observability**: Track which models are actually used via metadata
5. **Resilience**: Prevents cascading failures across your system

## Best Practices

1. **Always use Circuit Breaker** for production AI calls
2. **Monitor circuit states** in your observability dashboard
3. **Set appropriate thresholds** based on your error tolerance
4. **Never fail the fallback model** (it bypasses circuit breaker)
5. **Log circuit breaker interventions** for debugging

## Architecture

```
┌─────────────────┐
│  User Request   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Smart Router    │ (Selects model based on credits)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Circuit Breaker │ (Protects against failures)
└────────┬────────┘
         │
    ┌────┴────┐
    │         │
    ▼         ▼
┌────────┐ ┌────────┐
│  Pro   │ │ Flash  │ (Fallback)
└────────┘ └────────┘
```

## Troubleshooting

### Circuit Always Open

- Check if model is actually failing (not just slow)
- Increase `resetTimeout` if model needs more recovery time
- Verify Vertex AI API is enabled and credentials are valid

### Fallback Model Also Failing

- This is a critical error - check Vertex AI service status
- Verify `GOOGLE_APPLICATION_CREDENTIALS` is correct
- Check Google Cloud quotas and billing

### No Failover Happening

- Ensure `fallbackModel` is different from primary model
- Check that `failureThreshold` is being reached
- Verify error is being thrown (not just returning empty response)
