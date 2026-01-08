# Multi-Model AI Router

## Overview

The Multi-Model Router allows Zyeuté to leverage **three different AI providers** simultaneously:
- **Gemini 3 Pro** (Google Vertex AI)
- **DeepSeek R1** (DeepSeek Reasoning Model)
- **Microsoft Copilot** (Azure OpenAI)

This system can:
1. ✅ Call all 3 models in parallel
2. ✅ Compare their responses
3. ✅ Select the best one automatically
4. ✅ Aggregate responses for consensus
5. ✅ Track performance and costs

## Quick Start

### Basic Usage

```typescript
import { routeMultiModel } from "./multi-model-router.js";

const result = await routeMultiModel({
  prompt: "Create a Quebec meme caption",
  providers: ["gemini-3-pro", "deepseek-r1", "copilot"],
  strategy: "best", // or "consensus", "first", "all"
});

console.log(result.primary.content); // Best response
console.log(result.primary.provider); // Which model provided it
```

### With TI-Guy

```typescript
import { generateWithTIGuyMultiModel } from "./ti-guy-multi-model.js";

const response = await generateWithTIGuyMultiModel({
  mode: "content",
  message: "Create a fun caption",
}, {
  strategy: "best",
  compareMode: false,
});

console.log(response.content);
console.log(response.metadata?.primaryProvider); // Which model won
```

### Full Comparison Mode

```typescript
import { compareAllModels } from "./multi-model-comparison.js";

const comparison = await compareAllModels(
  "Write a Quebec social media post"
);

console.log(`Winner: ${comparison.winner}`);
console.log(`Fastest: ${comparison.insights.bestForSpeed}`);
console.log(`Best Quality: ${comparison.insights.bestForQuality}`);
```

## Configuration

### Environment Variables

```bash
# Gemini 3 Pro (Vertex AI)
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=path/to/key.json

# DeepSeek R1
DEEPSEEK_API_KEY=your-deepseek-key

# Microsoft Copilot (Azure OpenAI)
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4  # Optional, defaults to gpt-4
```

## Strategies

### 1. `"best"` (Default)
Selects the best response based on:
- Confidence score
- Latency (faster is better)
- Token efficiency

### 2. `"consensus"`
Picks the response that most agrees with others:
- Calculates word overlap between responses
- Selects response with highest agreement score

### 3. `"first"`
Returns the first successful response (fastest)

### 4. `"all"`
Returns all responses for manual comparison

### 5. `"compare"`
Full comparison mode with detailed metrics

## Response Structure

```typescript
interface MultiModelResponse {
  primary: {
    content: string;
    provider: "gemini-3-pro" | "deepseek-r1" | "copilot";
    confidence?: number;
    tokensUsed?: number;
    latency?: number;
  };
  alternatives?: AIResponse[]; // Other responses if strategy is "all"
  strategy: string;
  consensus?: {
    agreement: number; // 0-1, how much they agree
    commonThemes: string[];
  };
}
```

## Cost Comparison

| Provider | Cost per 1K tokens | Speed | Quality |
|----------|-------------------|-------|---------|
| Gemini 3 Pro | $0.001 (free tier) | Medium | ⭐⭐⭐⭐⭐ |
| DeepSeek R1 | $0.00014 | Fast | ⭐⭐⭐⭐ |
| Copilot | $0.03 | Medium | ⭐⭐⭐⭐⭐ |

## Use Cases

### 1. Content Generation
```typescript
// Get best response from all 3 models
const result = await routeMultiModel({
  prompt: "Create a Quebec meme",
  strategy: "best",
});
```

### 2. Quality Assurance
```typescript
// Compare all 3 to ensure quality
const comparison = await compareAllModels(
  "Write a customer service response"
);
// Use the winner or manually review all
```

### 3. Cost Optimization
```typescript
// Use cheapest provider
const result = await routeMultiModel({
  prompt: "Simple task",
  providers: ["deepseek-r1"], // Cheapest
  strategy: "first",
});
```

### 4. Speed Priority
```typescript
// Get fastest response
const result = await routeMultiModel({
  prompt: "Quick response needed",
  providers: ["deepseek-r1"], // Typically fastest
  strategy: "first",
});
```

## Testing

Run the comprehensive test suite:

```bash
npm run test:multi-model
```

This tests:
1. ✅ Individual provider calls
2. ✅ Multi-model routing
3. ✅ Comparison mode
4. ✅ TI-Guy integration

## Architecture

```
User Request
    ↓
Multi-Model Router
    ↓
┌──────────────┬──────────────┬──────────────┐
│ Gemini 3 Pro │ DeepSeek R1  │   Copilot    │ (Parallel calls)
└──────┬───────┴──────┬───────┴──────┬───────┘
       │              │              │
       └──────────────┴──────────────┘
                    ↓
         Strategy Selection
         (best/consensus/first/all)
                    ↓
              Best Response
```

## Error Handling

- If one provider fails, others continue
- If all providers fail, throws error
- Automatic fallback to working providers
- Detailed error logging per provider

## Monitoring

All requests are reported to Colony OS:

```typescript
{
  event: "ai.multi_model",
  data: {
    providers: ["gemini-3-pro", "deepseek-r1", "copilot"],
    primary: "gemini-3-pro",
    strategy: "best",
    consensus: 0.75,
  }
}
```

## Best Practices

1. **Use "best" strategy** for production (good balance)
2. **Use "compare" mode** for critical content (quality assurance)
3. **Use "first" strategy** for speed-critical tasks
4. **Monitor costs** via Colony OS events
5. **Configure all 3 providers** for maximum resilience

## Troubleshooting

### "All AI providers failed"
- Check environment variables are set
- Verify API keys are valid
- Check network connectivity

### "Unknown provider"
- Ensure provider name matches exactly: `"gemini-3-pro"`, `"deepseek-r1"`, `"copilot"`

### Slow responses
- Use `strategy: "first"` to get fastest response
- Or specify only fastest provider: `providers: ["deepseek-r1"]`

## Next Steps

1. ✅ Configure all 3 providers
2. ✅ Run test suite: `npm run test:multi-model`
3. ✅ Integrate into TI-Guy routes
4. ✅ Monitor performance via Colony OS
5. ✅ Tune strategies based on real-world usage
