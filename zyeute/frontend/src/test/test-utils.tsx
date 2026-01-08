/**
 * Test Utilities
 * Shared test helpers that wrap components with required providers
 *
 * Usage:
 * import { renderWithProviders } from '@/test/test-utils';
 *
 * test('my test', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 */

import React, { ReactElement, ReactNode } from "react";
import { render, RenderOptions } from "@testing-library/react";
import { BrowserRouter } from "react-router-dom";
import { vi } from "vitest";

// Mock the auth context to avoid Supabase calls in tests
const MockAuthProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

// Mock the guest mode context
const MockGuestModeProvider = ({ children }: { children: ReactNode }) => {
  return <>{children}</>;
};

interface AllProvidersProps {
  children: ReactNode;
}

/**
 * Wraps components with all required providers for testing
 * - BrowserRouter for routing
 * - AuthProvider for authentication (mocked)
 * - GuestModeProvider for guest mode (mocked)
 */
export function AllProviders({ children }: AllProvidersProps) {
  return (
    <BrowserRouter>
      <MockAuthProvider>
        <MockGuestModeProvider>{children}</MockGuestModeProvider>
      </MockAuthProvider>
    </BrowserRouter>
  );
}

/**
 * Custom render function that wraps components with all providers
 * Use this instead of @testing-library/react's render in most tests
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, "wrapper">,
) {
  return render(ui, { wrapper: AllProviders, ...options });
}

/**
 * Mock Supabase client for tests
 * Returns a mock object that mimics the Supabase auth API
 */
export const createMockSupabaseClient = () => {
  const mockChain = {
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: null, error: null }),
    order: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    insert: vi.fn().mockResolvedValue({ data: null, error: null }),
    update: vi.fn().mockResolvedValue({ data: null, error: null }),
    delete: vi.fn().mockResolvedValue({ data: null, error: null }),
  };

  return {
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: { session: null },
        error: null,
      }),
      onAuthStateChange: vi.fn().mockReturnValue({
        data: { subscription: { unsubscribe: vi.fn() } },
      }),
      signOut: vi.fn().mockResolvedValue({ error: null }),
      signInWithPassword: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
      signUp: vi.fn().mockResolvedValue({
        data: { user: null, session: null },
        error: null,
      }),
    },
    from: vi.fn().mockReturnValue(mockChain),
  };
};

/**
 * Creates a mock authenticated user for testing
 */
export const createMockUser = (overrides = {}) => {
  return {
    id: "test-user-id",
    email: "test@example.com",
    username: "testuser",
    role: "citoyen",
    created_at: new Date().toISOString(),
    ...overrides,
  };
};

/**
 * Creates a mock session for testing
 */
export const createMockSession = (overrides = {}) => {
  return {
    access_token: "mock-access-token",
    refresh_token: "mock-refresh-token",
    expires_in: 3600,
    token_type: "bearer",
    user: createMockUser(),
    ...overrides,
  };
};

// Re-export commonly used testing utilities
export {
  screen,
  waitFor,
  within,
  act,
  fireEvent,
  cleanup,
  renderHook,
  waitForElementToBeRemoved,
} from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
