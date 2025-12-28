# Test Utilities Documentation

This directory contains shared test utilities and helpers for writing consistent and maintainable tests across the application.

## Files

### `setup.ts`
Test environment setup file that runs before all tests. It:
- Extends Vitest's `expect` with jest-dom matchers
- Mocks global browser APIs (matchMedia, IntersectionObserver, ResizeObserver)
- Mocks Supabase client to prevent real API calls during tests
- Configures automatic cleanup after each test

### `test-utils.tsx`
Shared test utilities and custom render functions. Provides:

#### `renderWithProviders(ui, options)`
A custom render function that wraps components with all required providers. Use this instead of `@testing-library/react`'s `render()` in most tests.

**Usage:**
```tsx
import { renderWithProviders, screen } from '@/test/test-utils';

test('my component test', () => {
  renderWithProviders(<MyComponent />);
  expect(screen.getByText('Hello')).toBeInTheDocument();
});
```

**What it provides:**
- `BrowserRouter` - for routing context
- `AuthProvider` - for authentication state (mocked)
- `GuestModeProvider` - for guest mode functionality (mocked)

#### Helper Functions

**`createMockSupabaseClient()`**
Creates a fully mocked Supabase client for testing.

```tsx
const mockSupabase = createMockSupabaseClient();
```

**`createMockUser(overrides)`**
Creates a mock user object for testing authenticated scenarios.

```tsx
const user = createMockUser({ username: 'testuser' });
```

**`createMockSession(overrides)`**
Creates a mock session object for testing authenticated scenarios.

```tsx
const session = createMockSession();
```

### `utils.tsx`
Legacy test utilities file. This is the actual implementation used by existing tests. It:
- Uses real `AuthProvider` and `GuestModeProvider` with mocked Supabase
- Exports `render` as an alias for `renderWithProviders`
- Provides `mockSupabase` for manual mocking

## Writing Tests

### Basic Component Test

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import MyComponent from './MyComponent';

describe('MyComponent', () => {
  it('should render correctly', () => {
    render(<MyComponent />);
    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });
});
```

### Testing User Interactions

```tsx
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import MyButton from './MyButton';

describe('MyButton', () => {
  it('should call onClick when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();
    
    render(<MyButton onClick={handleClick}>Click me</MyButton>);
    await user.click(screen.getByRole('button'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### Testing with Mocked API Calls

```tsx
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@/test/utils';

// Mock the API module
vi.mock('@/services/api', () => ({
  getUserProfile: vi.fn().mockResolvedValue({
    id: '1',
    username: 'testuser',
    email: 'test@example.com'
  })
}));

describe('UserProfile', () => {
  it('should load and display user data', async () => {
    render(<UserProfile userId="1" />);
    
    await waitFor(() => {
      expect(screen.getByText('testuser')).toBeInTheDocument();
    });
  });
});
```

### Testing Forms

```tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@/test/utils';
import userEvent from '@testing-library/user-event';
import LoginForm from './LoginForm';

describe('LoginForm', () => {
  it('should submit form with email and password', async () => {
    const user = userEvent.setup();
    
    render(<LoginForm />);
    
    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /login/i }));
    
    // Assert expected behavior after submit
  });
});
```

## Best Practices

1. **Use the custom render function**: Always import `render` from `@/test/utils` or use `renderWithProviders` from `@/test/test-utils`
2. **Mock external dependencies**: Use `vi.mock()` to mock API calls, external services, and heavy dependencies
3. **Use user-event for interactions**: Prefer `userEvent` over `fireEvent` for more realistic user interactions
4. **Wait for async updates**: Use `waitFor`, `findBy*` queries for async operations
5. **Clean up after tests**: The setup file handles this automatically with `afterEach(cleanup)`
6. **Avoid testing implementation details**: Focus on user-visible behavior, not internal state

## Common Patterns

### Testing Loading States

```tsx
it('should show loading spinner', () => {
  render(<MyComponent isLoading={true} />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

### Testing Error States

```tsx
it('should display error message', () => {
  render(<MyComponent error="Something went wrong" />);
  expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();
});
```

### Testing Conditional Rendering

```tsx
it('should render different content based on auth state', () => {
  const { rerender } = render(<MyComponent isAuthenticated={false} />);
  expect(screen.getByText('Please login')).toBeInTheDocument();
  
  rerender(<MyComponent isAuthenticated={true} />);
  expect(screen.getByText('Welcome back')).toBeInTheDocument();
});
```

## Troubleshooting

### "must be used within a provider" errors
Make sure you're using the custom `render` function from `@/test/utils`, not directly from `@testing-library/react`.

### Act warnings
Wrap state updates in `await waitFor()` or use `findBy*` queries instead of `getBy*` for async operations.

### Supabase API errors
The Supabase client is mocked in `setup.ts`. If you need custom mock behavior, use `vi.mock('@/lib/supabase')` in your test file.

### Test timeout errors
Increase the timeout for slow operations:
```tsx
it('slow test', async () => {
  // test code
}, 10000); // 10 second timeout
```

## References

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/docs/react-testing-library/intro/)
- [User Event Documentation](https://testing-library.com/docs/user-event/intro)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)
