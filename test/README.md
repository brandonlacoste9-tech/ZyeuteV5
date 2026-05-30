# E2E Test Suite

This directory contains end-to-end (E2E) tests for the Zyeuté V3 application.

## 📁 Structure

```
test/
├── e2e/
│   ├── auth-flow.test.ts      # Authentication flow tests
│   ├── profile-flow.test.ts   # Profile management tests (future)
│   ├── post-flow.test.ts      # Post creation/interaction tests (future)
│   └── ...
└── README.md                   # This file
```

## 🚀 Quick Start

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run in watch mode
npm run test:e2e:watch

# Run specific test file
npm run test:e2e -- auth-flow.test.ts
```

### Prerequisites

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Set up test environment**
   - Create `.env.test` file with test Supabase credentials
   - Ensure test database is configured
   - Never use production credentials

3. **Test data setup**
   - Tests will create and clean up their own data
   - Some tests may require pre-existing test users

## 🧪 Test Framework

We use **Vitest** with **React Testing Library** for E2E tests.

### Key Libraries
- **Vitest**: Test runner and assertion library
- **@testing-library/react**: React component testing utilities
- **@testing-library/user-event**: Simulating user interactions
- **jsdom**: Browser environment simulation

## 📝 Writing Tests

### Test Structure

```typescript
describe('Feature Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  it('should do something', async () => {
    // Arrange: Set up test data and state
    // Act: Perform the action to test
    // Assert: Verify the expected outcome
  });
});
```

### Best Practices

1. **Test User Behavior, Not Implementation**
   - Test what users see and do, not internal state
   - Use accessible selectors (roles, labels, text)
   - Avoid testing implementation details

2. **Use Async/Await for Asynchronous Operations**
   ```typescript
   await waitFor(() => {
     expect(screen.getByText('Success')).toBeInTheDocument();
   });
   ```

3. **Clean Up After Tests**
   - Remove test data from database
   - Clear localStorage/sessionStorage
   - Restore mocks

4. **Keep Tests Isolated**
   - Each test should be independent
   - Don't rely on test execution order
   - Reset state between tests

5. **Use Descriptive Test Names**
   ```typescript
   // Good
   it('should display error message when login fails with invalid credentials')
   
   // Bad
   it('test login')
   ```

## 🔧 Configuration

### vitest.config.ts

E2E tests use the same Vitest configuration as unit tests. Add E2E-specific settings if needed:

```typescript
export default defineConfig({
  test: {
    include: ['test/e2e/**/*.test.ts'],
    // E2E-specific settings
  }
});
```

## 🐛 Debugging

### Visual Debugging

```typescript
import { screen } from '@testing-library/react';

// Print current DOM
screen.debug();

// Print specific element
screen.debug(screen.getByRole('button'));
```

### Using Vitest UI

```bash
npm run test:ui
```

Opens an interactive UI for running and debugging tests.

### Console Logging

```typescript
console.log('Current state:', someVariable);
```

Logs will appear in test output.

## 📊 Coverage

Generate coverage report:

```bash
npm run test:coverage
```

View coverage report:

```bash
open coverage/lcov-report/index.html
```

## 🚦 CI/CD Integration

E2E tests run automatically in CI pipeline:

1. **On Pull Request** - Tests run before merge
2. **On Push to main/develop** - Tests run on deployment
3. **Nightly** - Full test suite runs overnight (if configured)

### Running Tests Like CI

```bash
# Run all checks like CI
npm run check && npm test && npm run test:e2e && npm run build
```

## 🔒 Test Environment Security

### Environment Variables

Create `.env.test` (NOT committed to git):

```env
VITE_SUPABASE_URL=https://test-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_test_anon_key
# Never use production credentials
```

### Test Database

- Use a separate Supabase project for testing
- Or use a dedicated test database
- Never run tests against production

## 📚 Resources

### Testing Library
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro/)
- [Testing Library Cheatsheet](https://testing-library.com/docs/react-testing-library/cheatsheet)
- [Common Mistakes](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

### Vitest
- [Vitest Docs](https://vitest.dev/)
- [Vitest API](https://vitest.dev/api/)

### Accessibility Testing
- [Testing Accessibility](https://testing-library.com/docs/queries/about/#priority)
- [jest-axe](https://github.com/nickcolley/jest-axe) for a11y assertions

## 🤝 Contributing

When adding new E2E tests:

1. Follow existing test structure
2. Add clear comments explaining test purpose
3. Ensure tests are isolated and can run independently
4. Update this README if adding new test categories
5. Run full test suite before committing

## 📞 Help & Support

If you encounter issues:

1. Check test output for error messages
2. Use `screen.debug()` to inspect rendered output
3. Review test setup and cleanup
4. Check environment variables
5. Ask in team chat or create GitHub issue

---

**Happy Testing! 🧪**
