# Model Policies System - Summary

## What It Does

**Per-Route Model Policies** = Smart model selection based on route/use case, not just credits.

Instead of:
```typescript
// Old: Manual selection everywhere
const model = userCredits >= 10 ? "pro" : "flash";
```

Now:
```typescript
// New: Policy-based selection
const response = await generateWithTIGuy(request, credits, "enhancement");
// Policy automatically selects: Pro if credits ≥ 20, Flash otherwise
```

## Key Benefits

### 1. **Route-Optimized Selection**
- **Chat routes** → Always Flash (fast, free)
- **Enhancement routes** → Pro if credits available (quality)
- **Moderation routes** → Always Flash (cost-effective)
- **Studio routes** → Pro if credits ≥ 25 (premium)

### 2. **Automatic Route Mapping**
Routes are automatically mapped to policies:
```
/api/ai/tiguy-chat → chat policy
/api/enhance → enhancement policy
/api/moderation → moderation policy
/api/studio → studio policy
```

### 3. **Credit-Aware**
Each policy defines minimum credits:
- `chat`: 0 credits (always available)
- `content`: 10 credits
- `enhancement`: 20 credits
- `studio`: 25 credits

### 4. **Circuit Breaker Integration**
Policies work seamlessly with Circuit Breaker:
- Policy selects model
- Circuit Breaker protects it
- If Circuit Breaker trips → uses policy's fallback

## Default Policies

| Use Case | Model | Credits | Priority |
|----------|-------|---------|----------|
| `chat` | Flash | 0 | Speed |
| `content` | Pro → Flash | 10 | Balanced |
| `enhancement` | Pro → Flash | 20 | Quality |
| `moderation` | Flash | 0 | Cost |
| `studio` | Pro → Flash | 25 | Quality |

## Usage Examples

### Example 1: Chat (Fast)
```typescript
// Route: /api/ai/tiguy-chat
// Policy: chat
// Result: Always Flash (fast, free)

await generateWithTIGuy(request, 0, "chat");
// Uses: gemini-2.0-flash
```

### Example 2: Enhancement (Quality)
```typescript
// Route: /api/enhance
// Policy: enhancement
// User has: 25 credits
// Needs: 20 credits

await generateWithTIGuy(request, 25, "enhancement");
// Uses: gemini-1.5-pro (has enough credits)
```

### Example 3: Insufficient Credits
```typescript
// Route: /api/studio
// Policy: studio
// User has: 10 credits
// Needs: 25 credits

await generateWithTIGuy(request, 10, "studio");
// Uses: gemini-2.0-flash (fallback - insufficient credits)
```

## Integration

### Automatic (Recommended)
```typescript
// In routes.ts - use case inferred from route
const useCase = getUseCaseFromRoute(req.path);
const response = await generateWithTIGuy(request, userCredits, useCase);
```

### Manual
```typescript
// Explicit use case
const response = await generateWithTIGuy(request, userCredits, "enhancement");
```

## Admin Control

### View Policies
```bash
GET /api/admin/model-policies
```

Returns:
```json
{
  "policies": [
    {
      "useCase": "chat",
      "policy": {
        "primaryModel": "gemini-2.0-flash",
        "fallbackModel": "gemini-2.0-flash",
        "requireCredits": 0,
        "priority": "speed"
      },
      "isOverridden": false
    }
  ],
  "routeMappings": {
    "/api/ai/tiguy-chat": "chat",
    "/api/enhance": "enhancement"
  }
}
```

### Override Policy
```bash
POST /api/admin/model-policies/override
{
  "useCase": "enhancement",
  "policy": {
    "primaryModel": "gemini-2.0-flash",
    "requireCredits": 0
  }
}
```

### Clear Override
```bash
DELETE /api/admin/model-policies/override/enhancement
```

## Metadata

Responses include policy info:
```json
{
  "content": "...",
  "metadata": {
    "intendedModel": "gemini-1.5-pro",
    "actualModel": "gemini-2.0-flash",
    "circuitBreakerIntervened": false,
    "useCase": "enhancement",
    "reason": "Policy: enhancement fallback due to insufficient credits (10 < 20)"
  }
}
```

## Architecture

```
Route Request
    ↓
Get Use Case (from route mapping)
    ↓
Select Policy (based on use case)
    ↓
Check Credits (policy.requireCredits)
    ↓
Select Model (primary or fallback)
    ↓
Circuit Breaker Protection
    ↓
Execute & Return (with metadata)
```

## Next Steps

1. ✅ **Policies defined** - All use cases covered
2. ✅ **Route mapping** - Automatic route → use case
3. ✅ **Integration** - Works with Circuit Breaker
4. ✅ **Admin API** - View/manage policies
5. 🔄 **Monitor** - Track policy effectiveness
6. 🔄 **Optimize** - Adjust credits/priorities based on data

---

**Status**: ✅ Production-Ready
**See**: `README-MODEL-POLICIES.md` for full documentation
