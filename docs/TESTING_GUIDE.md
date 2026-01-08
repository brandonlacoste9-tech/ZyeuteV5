# Testing Guide for Zyeute V5

## Overview

This guide covers the comprehensive testing strategy for Zyeute V5, including unit tests, integration tests, and end-to-end testing procedures.

## Testing Philosophy

Zyeute uses a **layered testing approach**:

1. **Unit Tests**: Fast, isolated tests for individual functions/components
2. **Integration Tests**: Test interactions between modules
3. **E2E Tests**: Full system tests including video pipeline

## Running Tests

### All Tests
```bash
npm run test
```

### Unit Tests Only
```bash
npm run test:unit
```

### Integration Tests
```bash
npm run test:integration
```

### Video Pipeline E2E Test
```bash
npm run test:video-pipeline
```

### Test Coverage
```bash
npm run test:coverage
```

### Watch Mode (Development)
```bash
npm run test:watch
```

## Test Structure

```
zyeute/
├── frontend/src/
│   ├── __tests__/          # Frontend unit tests
│   └── test/               # Test utilities and setup
├── backend/
│   ├── __tests__/          # Backend unit tests
│   └── workers/
│       └── __tests__/      # Worker-specific tests
└── scripts/
    └── test-*.ts           # Integration/E2E test scripts
```

## Unit Testing

### Frontend Components

**Example: Button Component Test**
```typescript
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Button } from "@/components/Button";

describe("Button", () => {
  it("renders with correct text", () => {
    render(<Button>Click me</Button>);
    expect(screen.getByText("Click me")).toBeInTheDocument();
  });
});
```

### Backend Functions

**Example: Storage Method Test**
```typescript
import { describe, it, expect, vi } from "vitest";
import { storage } from "../storage";

describe("getPostsByAITags", () => {
  it("returns posts matching tags", async () => {
    const posts = await storage.getPostsByAITags(["poutine", "montreal"], 10, "quebec");
    expect(posts.length).toBeGreaterThan(0);
  });
});
```

## Integration Testing

Integration tests verify that multiple components work together correctly.

### Video Processing Pipeline

See [VIDEO_PIPELINE_TESTING.md](./VIDEO_PIPELINE_TESTING.md) for detailed instructions.

### API Endpoints

Test API endpoints using the test scripts in `zyeute/scripts/`:

```bash
# Test video pipeline
npm run test:video-pipeline

# Verify database indexes
npm run verify:indexes
```

## Mocking Strategies

### Supabase Client

```typescript
import { vi } from "vitest";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockResolvedValue({ data: [], error: null }),
  })),
}));
```

### BullMQ Worker

```typescript
vi.mock("bullmq", () => ({
  Worker: vi.fn().mockImplementation(() => ({
    on: vi.fn(),
  })),
}));
```

## CI/CD Integration

### GitHub Actions

Tests run automatically on:
- Pull requests
- Pushes to main branch
- Scheduled nightly runs

### Pre-commit Hooks

Run tests before committing:
```bash
npm run preflight  # Runs check, lint, build, and test
```

## Best Practices

1. **Isolation**: Each test should be independent
2. **Naming**: Use descriptive test names (`it("should return posts when tags match")`)
3. **Arrange-Act-Assert**: Structure tests clearly
4. **Mock External Services**: Don't hit real APIs in unit tests
5. **Clean Up**: Reset mocks and state between tests

## Troubleshooting

### Tests Timing Out

Increase timeout in `vitest.config.ts`:
```typescript
test: {
  timeout: 10000, // 10 seconds
}
```

### Mock Not Working

Ensure mocks are defined before imports:
```typescript
vi.mock("./module"); // Before import
import { something } from "./module";
```

### Database Connection Issues

Ensure `DATABASE_URL` is set in `.env` file for integration tests.

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [VIDEO_PIPELINE_TESTING.md](./VIDEO_PIPELINE_TESTING.md) - Video pipeline specific guide
