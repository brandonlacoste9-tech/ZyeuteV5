import {
  GUEST_MODE_KEY,
  GUEST_TIMESTAMP_KEY,
  GUEST_VIEWS_KEY,
} from "./constants";

/**
 * Clear all guest mode session flags from localStorage
 * Call this on successful login or signup to ensure clean auth state
 */
export function clearGuestSession(): void {
  localStorage.removeItem(GUEST_MODE_KEY);
  localStorage.removeItem(GUEST_TIMESTAMP_KEY);
  localStorage.removeItem(GUEST_VIEWS_KEY);
}

export function isUnauthorizedError(error: Error): boolean {
  return /^401: .*Unauthorized/.test(error.message);
}
