# Model Policies System

## Overview

**Model Policies** enable fine-grained control over which AI model is used for different routes and use cases. This allows you to optimize for speed, quality, or cost on a per-route basis.

## Key Concepts

### Use Cases

Each route/feature has a **use case** that determines its model policy:

- `chat` - Fast, cheap (DMs, conversations)
- `content` - Balanced (posts, captions)
- `enhancement` - High quality (media enhancement)
- `moderation` - Fast, reliable (content checks)
- `onboarding` - Fast, friendly (user setup)
- `customer_service` - Balanced, reliable (support)
- `analytics` - Quality summaries
- `studio` - Premium quality (creative work)

### Policy Structure

```typescript
interface ModelPolicy {
  primaryModel: GeminiModel;      // Preferred model
  fallbackModel: GeminiModel;      // Backup model
  requireCredits?: number;         // Min credits for primary
  priority: "speed" | "quality" | "cost" | "balanced";
  allowCircuitBreaker: boolean;   // Can circuit breaker override?
}
```

## Default Policies

| Use Case | Primary Model | Fallback | Credits | Priority |
|----------|--------------|----------|--------|----------|
| `chat` | gemini-2.0-flash | gemini-2.0-flash | 0 | speed |
| `content` | gemini-1.5-pro | gemini-2.0-flash | 10 | balanced |
| `enhancement` | gemini-1.5-pro | gemini-2.0-flash | 20 | quality |
| `moderation` | gemini-2.0-flash | gemini-2.0-flash | 0 | cost |
| `onboarding` | gemini-2.0-flash | gemini-2.0-flash | 0 | speed |
| `customer_service` | gemini-2.0-flash | gemini-2.0-flash | 0 | balanced |
| `analytics` | gemini-1.5-pro | gemini-2.0-flash | 15 | quality |
| `studio` | gemini-1.5-pro | gemini-2.0-flash | 25 | quality |

## Usage

### Automatic (Recommended)

Policies are automatically applied based on route:

```typescript
import { generateWithTIGuy } from "./vertex-service.js";

// Use case inferred from route or mode
const response = await generateWithTIGuy({
  mode: "content",
  message: "Create a caption",
}, userCredits, "content"); // Use case specified
```

### Manual Selection

```typescript
import { selectModelWithPolicy } from "./model-policies.js";

const selection = selectModelWithPolicy("enhancement", userCredits);

console.log(`Using ${selection.actualModel} for enhancement`);
console.log(`Reason: ${selection.reason}`);
```

### Route Mapping

Routes are automatically mapped to use cases:

```typescript
// These routes use "chat" policy
/api/ai/tiguy-chat
/api/tiguy/chat
/api/chat

// These routes use "enhancement" policy
/api/enhance
/api/studio/enhance
/api/video/process

// These routes use "moderation" policy
/api/moderation
/api/mod
```

## Examples

### Example 1: Chat Route (Fast & Cheap)

```typescript
// Route: /api/ai/tiguy-chat
// Policy: chat
// Result: Always uses gemini-2.0-flash (fast, free)

const response = await generateWithTIGuy({
  mode: "content",
  message: "Hey!",
}, 0, "chat");

// Uses: gemini-2.0-flash (no credits needed)
```

### Example 2: Enhancement Route (Quality)

```typescript
// Route: /api/enhance
// Policy: enhancement
// Result: Uses Pro if credits available, Flash otherwise

const response = await generateWithTIGuy({
  mode: "content",
  message: "Enhance this video",
}, 25, "enhancement");

// Uses: gemini-1.5-pro (has 25 credits, needs 20)
```

### Example 3: Insufficient Credits

```typescript
// Route: /api/studio
// Policy: studio
// User has: 10 credits
// Needs: 25 credits

const response = await generateWithTIGuy({
  mode: "content",
  message: "Create art",
}, 10, "studio");

// Uses: gemini-2.0-flash (fallback due to insufficient credits)
```

## Policy Overrides

### For Testing

```typescript
import { setPolicyOverride, clearPolicyOverride } from "./model-policies.js";

// Override policy for testing
setPolicyOverride("enhancement", {
  primaryModel: "gemini-2.0-flash", // Force Flash for testing
  requireCredits: 0,
});

// ... run tests ...

// Clear override
clearPolicyOverride("enhancement");
```

### For Admin Control

```typescript
// Admin endpoint to change policies
app.post("/api/admin/model-policy", requireAuth, (req, res) => {
  const { useCase, policy } = req.body;
  setPolicyOverride(useCase, policy);
  res.json({ success: true });
});
```

## Integration with Circuit Breaker

Policies work seamlessly with Circuit Breaker:

1. **Policy selects model** based on use case and credits
2. **Circuit Breaker protects** the selected model
3. **If Circuit Breaker trips**, falls back to policy's fallback model
4. **Metadata tracks** both policy selection and circuit breaker intervention

```typescript
{
  metadata: {
    intendedModel: "gemini-1.5-pro",      // From policy
    actualModel: "gemini-2.0-flash",      // After circuit breaker
    circuitBreakerIntervened: true,        // Circuit breaker fired
    useCase: "enhancement",                // Policy used
    reason: "Circuit breaker OPEN for gemini-1.5-pro, using gemini-2.0-flash"
  }
}
```

## Custom Policies

### Add New Use Case

```typescript
// In model-policies.ts
export const MODEL_POLICIES: Record<UseCase, ModelPolicy> = {
  // ... existing policies ...
  
  my_new_feature: {
    primaryModel: "gemini-1.5-pro",
    fallbackModel: "gemini-2.0-flash",
    requireCredits: 15,
    priority: "quality",
    allowCircuitBreaker: true,
  },
};
```

### Add Route Mapping

```typescript
// In model-policies.ts
export const ROUTE_USE_CASES: Record<string, UseCase> = {
  // ... existing routes ...
  "/api/my-feature": "my_new_feature",
};
```

## Best Practices

1. **Use appropriate use cases** - Match the use case to the route's purpose
2. **Set realistic credit requirements** - Don't block users unnecessarily
3. **Enable circuit breaker** - For premium models (Pro), always enable circuit breaker
4. **Monitor policy effectiveness** - Use admin dashboard to see which policies are used
5. **Test policy changes** - Use overrides to test before deploying

## Monitoring

### Admin Dashboard

View policy usage at `/admin/ai-dashboard`:
- See which policies are used most
- Track model selection per use case
- Monitor credit requirements vs actual usage

### API Endpoint

```bash
GET /api/admin/model-policies
```

Returns current policies and usage stats.

## Migration Guide

### Before (Manual Selection)

```typescript
// Old way - manual model selection
const model = userCredits >= 10 ? "gemini-1.5-pro" : "gemini-2.0-flash";
const result = await callModel(model, prompt);
```

### After (Policy-Based)

```typescript
// New way - policy-based selection
const response = await generateWithTIGuy({
  mode: "content",
  message: prompt,
}, userCredits, "content"); // Policy handles selection
```

## Troubleshooting

### Policy Not Applied

- Check route mapping in `ROUTE_USE_CASES`
- Verify use case is passed to `generateWithTIGuy`
- Check if override is set

### Wrong Model Selected

- Verify user credits meet `requireCredits`
- Check circuit breaker state
- Review policy configuration

### Credits Not Checked

- Ensure `userCredits` is passed to `generateWithTIGuy`
- Check auth middleware provides credits
- Verify credit calculation logic

---

**See Also**: 
- `CIRCUIT-BREAKER-IMPLEMENTATION.md` - Circuit breaker details
- `README-MULTI-MODEL.md` - Multi-model router
