# Evaluation Framework - Quick Start Guide

## 🚀 Quick Start

Get started with the evaluation framework in 5 minutes!

### 1. Run Tests

```bash
# Run all tests once
npm test

# Watch mode (re-run on changes)
npm run test:watch

# Interactive UI
npm run test:ui

# Coverage report
npm run test:coverage
```

### 2. Write Your First Test

Create a test file `myService.test.ts`:

```typescript
import { describe, it, expect } from 'vitest';
import { EvaluationRunner, assertions } from '@/test/evaluation';

// Your service function
async function myService(input: string): Promise<{ result: string }> {
  return { result: input.toUpperCase() };
}

describe('My Service', () => {
  it('should convert to uppercase', async () => {
    const evaluator = new EvaluationRunner(myService, 'MyService');
    
    const result = await evaluator.runTest({
      name: 'Uppercase conversion',
      input: 'hello',
      validator: (output) => {
        return output.result === 'HELLO';
      },
    });

    expect(result.passed).toBe(true);
  });
});
```

### 3. Add Tracing

Monitor your service performance:

```typescript
import { traceAsync, globalTracer } from '@/test/tracing';

async function myTracedService(input: string) {
  return traceAsync(
    'myService',
    async () => {
      // Your service logic
      return { result: input.toUpperCase() };
    },
    { inputLength: input.length }
  );
}

// Later, view trace statistics
const stats = globalTracer.getStats();
console.log('Total spans:', stats.totalSpans);
console.log('Avg duration:', stats.avgDuration);
```

### 4. Evaluate with Metrics

Get comprehensive metrics:

```typescript
import { EvaluationRunner } from '@/test/evaluation';

const evaluator = new EvaluationRunner(myService, 'MyService');

// Run multiple tests
const testCases = [
  { name: 'Test 1', input: 'hello', validator: (o) => o.result === 'HELLO' },
  { name: 'Test 2', input: 'world', validator: (o) => o.result === 'WORLD' },
  { name: 'Test 3', input: 'test', validator: (o) => o.result === 'TEST' },
];

await evaluator.runTests(testCases);

// Get metrics
const metrics = evaluator.getMetrics();
console.log('Accuracy:', metrics.accuracy);      // Success rate (0-1)
console.log('Latency:', metrics.latency, 'ms');  // Avg response time
console.log('Throughput:', metrics.throughput);   // Tests per second
```

## 📋 Common Use Cases

### Testing a React Component

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { MyButton } from './MyButton';

describe('MyButton', () => {
  it('should handle clicks', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<MyButton onClick={handleClick}>Click me</MyButton>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Evaluating an AI Agent

```typescript
import { EvaluationRunner, assertions } from '@/test/evaluation';
import { myAIAgent } from './myAIAgent';

const evaluator = new EvaluationRunner(myAIAgent, 'MyAIAgent');

const testCases = [
  {
    name: 'Generate response',
    input: { prompt: 'Hello' },
    validator: (output) => {
      return (
        assertions.isDefined(output.response) &&
        output.response.length > 0
      );
    },
  },
];

await evaluator.runTests(testCases);
const summary = evaluator.getSummary();
console.log(`Success rate: ${summary.successRate}%`);
```

### Performance Testing

```typescript
import { PerformanceMonitor } from '@/test/evaluation';

const monitor = new PerformanceMonitor();

// Measure multiple operations
for (let i = 0; i < 100; i++) {
  const end = monitor.start('api-call');
  await myApiCall();
  end();
}

// Get statistics
const stats = monitor.getStats('api-call');
console.log('Mean:', stats.mean, 'ms');
console.log('Median:', stats.median, 'ms');
console.log('P95:', stats.p95, 'ms');
console.log('P99:', stats.p99, 'ms');
```

## 🔧 Useful Assertions

```typescript
import { assertions } from '@/test/evaluation';

// Check if defined
assertions.isDefined(value);

// Pattern matching
assertions.matchesPattern(text, /pattern/);

// Array length
assertions.hasLength(array, 1, 10); // min 1, max 10

// Number range
assertions.inRange(number, 0, 100);

// Object properties
assertions.hasProperties(obj, ['prop1', 'prop2']);

// Deep equality
assertions.deepEqual(obj1, obj2);

// Threshold comparison
assertions.meetsThreshold(value, 90, 'gte'); // value >= 90
```

## 📊 Viewing Results

### Console Output

Tests automatically show results:
```
✓ MyService > should convert to uppercase
✓ MyComponent > should render
✓ MyAPI > should fetch data

Test Files  3 passed (3)
     Tests  12 passed (12)
  Duration  1.23s
```

### Interactive UI

```bash
npm run test:ui
```

Opens a browser with:
- Test results visualization
- Code coverage
- Performance graphs
- Re-run individual tests

### Coverage Report

```bash
npm run test:coverage
```

Generates:
- Terminal summary
- HTML report in `coverage/`
- JSON data for CI/CD

## 🎯 Best Practices

1. **One thing per test** - Test a single behavior
2. **Descriptive names** - Clearly state what is tested
3. **Use validators** - Leverage assertion helpers
4. **Track performance** - Monitor critical services
5. **Add tracing** - Debug complex flows

## 📚 Next Steps

- Read [EVALUATION_FRAMEWORK.md](./EVALUATION_FRAMEWORK.md) for complete documentation
- Check [evaluation.example.ts](./client/src/test/evaluation.example.ts) for more examples
- See [tiGuyAgent.eval.test.ts](./client/src/services/tiGuyAgent.eval.test.ts) for real-world usage

## 🆘 Troubleshooting

**Tests not found?**
- Ensure files end with `.test.ts` or `.spec.ts`
- Check they're in the included paths

**Import errors?**
- Verify path aliases in `vitest.config.ts` match `tsconfig.json`
- Use `@/` for client/src imports

**Performance issues?**
- Use `runTestsParallel()` for independent tests
- Clear traces: `globalTracer.clear()`

## 📞 Support

For questions or issues:
1. Check this guide and [EVALUATION_FRAMEWORK.md](./EVALUATION_FRAMEWORK.md)
2. Review example files
3. Check [Vitest docs](https://vitest.dev/)
4. Create an issue in the repo

---

**Happy Testing! 🎉**
