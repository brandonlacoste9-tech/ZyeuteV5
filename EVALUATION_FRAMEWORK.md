# Evaluation Framework Documentation

## Overview

The Zyeuté V3 evaluation framework provides comprehensive tools for testing, evaluating, and monitoring AI agents, services, and components. This framework includes:

- **Testing Infrastructure**: Vitest-based testing with React Testing Library
- **Evaluation System**: Automated evaluation runner with metrics and reporting
- **Tracing System**: Distributed tracing for monitoring and debugging
- **Performance Monitoring**: Performance metrics and statistics collection

## Getting Started

### Installation

All required dependencies are already installed in the project:

```bash
npm install
```

### Running Tests

```bash
# Run all tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## Testing Infrastructure

### Basic Test Structure

Tests are written using Vitest and follow the standard testing patterns:

```typescript
import { describe, it, expect } from 'vitest';

describe('Component or Service', () => {
  it('should do something', () => {
    expect(true).toBe(true);
  });
});
```

### Testing React Components

Use the custom render utilities from `@/test/utils`:

```typescript
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render and respond to clicks', async () => {
    const user = userEvent.setup();
    render(<MyComponent />);
    
    const button = screen.getByRole('button');
    await user.click(button);
    
    expect(screen.getByText('Clicked')).toBeInTheDocument();
  });
});
```

## Evaluation System

### EvaluationRunner

The `EvaluationRunner` class provides automated evaluation of services and agents:

```typescript
import { EvaluationRunner, assertions } from '@/test/evaluation';
import { myService } from './myService';

// Create evaluation runner
const evaluator = new EvaluationRunner(myService, 'MyService');

// Define test cases
const testCases = [
  {
    name: 'Test case 1',
    input: { data: 'test' },
    validator: (output) => assertions.isDefined(output),
  },
  {
    name: 'Test case 2',
    input: { data: 'test2' },
    expectedOutput: { result: 'expected' },
    validator: (output, expected) => assertions.deepEqual(output, expected),
  },
];

// Run tests
const results = await evaluator.runTests(testCases);

// Get summary
const summary = evaluator.getSummary();
console.log(`Success rate: ${summary.successRate}%`);
console.log(`Average duration: ${summary.avgDuration}ms`);

// Get metrics
const metrics = evaluator.getMetrics();
console.log(`Accuracy: ${metrics.accuracy}`);
console.log(`Latency: ${metrics.latency}ms`);
console.log(`Throughput: ${metrics.throughput} tests/sec`);
```

### Parallel Testing

Run test cases in parallel for faster evaluation:

```typescript
const results = await evaluator.runTestsParallel(testCases);
```

### Assertions Utilities

The framework provides various assertion helpers:

```typescript
import { assertions } from '@/test/evaluation';

// Check if value is defined
assertions.isDefined(value);

// Check if string matches pattern
assertions.matchesPattern(text, /pattern/);

// Check array length
assertions.hasLength(array, 3, 5); // min 3, max 5

// Check if value is in range
assertions.inRange(number, 0, 100);

// Check if object has properties
assertions.hasProperties(obj, ['prop1', 'prop2']);

// Deep equality check
assertions.deepEqual(obj1, obj2);

// Check threshold
assertions.meetsThreshold(value, 90, 'gte'); // value >= 90
```

### Performance Monitoring

Track performance metrics across multiple calls:

```typescript
import { PerformanceMonitor } from '@/test/evaluation';

const monitor = new PerformanceMonitor();

// Start measurement
const end = monitor.start('operation-name');

// ... do work ...

// End measurement (returns duration)
const duration = end();

// Get statistics
const stats = monitor.getStats('operation-name');
console.log('Mean:', stats.mean);
console.log('Median:', stats.median);
console.log('P95:', stats.p95);
console.log('P99:', stats.p99);

// Get all statistics
const allStats = monitor.getAllStats();
```

## Tracing System

### Basic Tracing

Use the global tracer to track operations:

```typescript
import { globalTracer, traceAsync } from '@/test/tracing';

// Trace an async operation
const result = await traceAsync(
  'fetchUserData',
  async () => {
    return await api.getUser(userId);
  },
  { userId } // metadata
);

// Manual span control
const spanId = globalTracer.startSpan('complexOperation', { param: 'value' });

try {
  // ... do work ...
  globalTracer.addEvent(spanId, 'info', 'checkpoint', { progress: 50 });
  // ... more work ...
  globalTracer.endSpan(spanId, { success: true });
} catch (error) {
  globalTracer.addError(spanId, error);
  globalTracer.endSpan(spanId, { success: false });
}
```

### Decorator-Based Tracing

Use the `@trace` decorator for automatic tracing:

```typescript
import { trace } from '@/test/tracing';

class MyService {
  @trace('MyService.fetchData')
  async fetchData(id: string) {
    // Implementation
  }
}
```

### Trace Analysis

Analyze collected traces:

```typescript
import { globalTracer } from '@/test/tracing';

// Get all spans
const spans = globalTracer.getAllSpans();

// Get root spans (top-level operations)
const rootSpans = globalTracer.getRootSpans();

// Get statistics
const stats = globalTracer.getStats();
console.log('Total spans:', stats.totalSpans);
console.log('Average duration:', stats.avgDuration);
console.log('Error rate:', stats.errorRate);

// Export for analysis
const traceData = globalTracer.export();
```

### Trace Logger

Use the trace logger for integrated logging:

```typescript
import { createLogger } from '@/test/tracing';

const logger = createLogger('MyService');

logger.info('operation', 'Starting process', { param: 'value' });
logger.debug('operation', 'Debug info', { detail: 'info' });
logger.warn('operation', 'Warning message', { reason: 'issue' });
logger.error('operation', 'Error occurred', { error: errorDetails });
```

## Example: Evaluating an AI Agent

Here's a complete example of evaluating the TiGuy AI agent:

```typescript
import { describe, it, expect } from 'vitest';
import { EvaluationRunner, assertions } from '@/test/evaluation';
import { traceAsync } from '@/test/tracing';
import { TiGuyAgent } from './tiGuyAgent';

describe('TiGuy Agent Evaluation', () => {
  // Create evaluation runner with tracing
  const tracedAgent = async (input) => {
    return traceAsync('TiGuyAgent', () => TiGuyAgent(input), {
      intent: input.intent,
    });
  };
  
  const evaluator = new EvaluationRunner(tracedAgent, 'TiGuyAgent');

  it('should validate response structure', async () => {
    const result = await evaluator.runTest({
      name: 'Structure validation',
      input: { text: 'Test input', intent: 'joke' },
      validator: (response) => {
        return (
          assertions.isDefined(response) &&
          assertions.hasProperties(response, ['caption', 'emojis', 'tags']) &&
          assertions.hasLength(response.emojis, 3, 5)
        );
      },
    });

    expect(result.passed).toBe(true);
  });

  it('should meet performance requirements', async () => {
    const testCases = Array(10).fill(null).map((_, i) => ({
      name: `Performance test ${i}`,
      input: { text: 'Test', intent: 'joke' },
      validator: assertions.isDefined,
    }));

    await evaluator.runTests(testCases);
    const metrics = evaluator.getMetrics();

    expect(metrics.accuracy).toBeGreaterThan(0.95); // 95% success
    expect(metrics.latency).toBeLessThan(2000); // Under 2 seconds
  });
});
```

## Best Practices

### Testing Guidelines

1. **Write descriptive test names**: Use clear, descriptive names that explain what is being tested
2. **Test one thing at a time**: Each test should verify a single behavior
3. **Use appropriate validators**: Choose the right assertion helpers for your test cases
4. **Include edge cases**: Test boundary conditions, empty inputs, and error scenarios
5. **Monitor performance**: Track latency and throughput for service-level tests

### Evaluation Guidelines

1. **Define clear success criteria**: Use validators that clearly define what success means
2. **Collect metrics**: Use the evaluation runner to collect and analyze metrics
3. **Test at scale**: Run multiple test cases to ensure consistent behavior
4. **Use parallel execution**: When tests are independent, run them in parallel
5. **Export results**: Save evaluation results for historical analysis

### Tracing Guidelines

1. **Trace important operations**: Focus on critical paths and complex operations
2. **Add meaningful metadata**: Include context that helps with debugging
3. **Use appropriate log levels**: debug for detailed info, error for failures
4. **Monitor performance**: Use tracing data to identify bottlenecks
5. **Clean up traces**: Clear traces between test runs or in production

## Configuration

### Vitest Configuration

The test configuration is in `vitest.config.ts`:

```typescript
export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./client/src/test/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
    },
  },
});
```

### Environment Variables

Set `NODE_ENV=development` to enable console logging in trace logger.

## Advanced Usage

### Custom Validators

Create custom validators for your specific needs:

```typescript
const myValidator = (output, expected) => {
  // Custom validation logic
  return output.status === 'success' && output.data.length > 0;
};

const result = await evaluator.runTest({
  name: 'Custom validation',
  input: inputData,
  validator: myValidator,
});
```

### Nested Spans

Create nested trace spans for complex operations:

```typescript
const parentId = globalTracer.startSpan('parentOperation');

// Child operation
const childId = globalTracer.startSpan('childOperation', {}, parentId);
// ... do work ...
globalTracer.endSpan(childId);

globalTracer.endSpan(parentId);

// View the span tree
const rootSpans = globalTracer.getRootSpans();
rootSpans.forEach(span => {
  console.log('Root:', span.operation);
  span.childSpans.forEach(child => {
    console.log('  Child:', child.operation);
  });
});
```

### Integration Testing

Use the setup files for integration tests:

```typescript
// client/src/test/setup.integration.ts
import { beforeAll, afterAll } from 'vitest';

beforeAll(async () => {
  // Setup integration test environment
});

afterAll(async () => {
  // Cleanup
});
```

## Troubleshooting

### Tests Not Running

- Check that test files match the pattern `**/*.{test,spec}.{ts,tsx}`
- Ensure vitest is installed: `npm install --save-dev vitest`
- Verify the vitest.config.ts file exists

### Import Errors

- Check path aliases in both `tsconfig.json` and `vitest.config.ts`
- Ensure they match: `@` should resolve to `./client/src`

### Performance Issues

- Use `runTestsParallel()` for independent test cases
- Reduce the number of test iterations
- Clear traces between runs: `globalTracer.clear()`

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

## Contributing

When adding new services or agents:

1. Create evaluation tests in `*.eval.test.ts` files
2. Use the evaluation runner for comprehensive testing
3. Add tracing to monitor performance
4. Document any custom validators or helpers
5. Update this documentation with examples

## Support

For questions or issues with the evaluation framework:

1. Check the existing test files for examples
2. Review this documentation
3. Check the Vitest documentation for test-specific issues
4. Create an issue in the project repository
