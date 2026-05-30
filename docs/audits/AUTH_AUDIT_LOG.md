# Auth Flow Audit Log

**Date**: 2025-12-15  
**Objective**: Document all authentication endpoint usages and standardization to Supabase client-side authentication  
**Strategy**: Enforce single source of truth via Supabase client, remove legacy server-proxy calls where possible

---

## Executive Summary

This audit identifies all `/api/auth/*` endpoint usages across the React frontend and tests. The goal is to:

1. **Standardize** on Supabase client-side authentication where feasible
2. **Remove** redundant server-proxy login/signup calls
3. **Ensure** guest mode flags are cleared on successful regular login/signup

---

## Current Architecture

### Authentication Endpoints (Server-Side)

| Endpoint           | Method | File                   | Purpose                            | Status                |
| ------------------ | ------ | ---------------------- | ---------------------------------- | --------------------- |
| `/api/auth/user`   | GET    | `server/routes.ts:109` | Get authenticated user via session | Legacy                |
| `/api/auth/signup` | POST   | `server/routes.ts:130` | Server-side signup (rate-limited)  | Legacy                |
| `/api/auth/login`  | POST   | `server/routes.ts:188` | Server-side login (rate-limited)   | Legacy                |
| `/api/auth/logout` | POST   | `server/routes.ts:220` | Server-side logout                 | Legacy                |
| `/api/auth/me`     | GET    | `server/routes.ts:233` | Get current user from session      | Keep for admin checks |

### Client-Side Usage Inventory

#### 1. `client/src/services/api.ts`

**Lines 41-75**

**Before:**

```typescript
export async function getCurrentUser(): Promise<User | null> {
  const { data, error } = await apiCall<{ user: User | null }>("/auth/me");
  if (error || !data) return null;
  return data.user;
}

export async function login(
  email: string,
  password: string,
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await apiCall<{ user: User }>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });

  if (error) return { user: null, error };
  return { user: data?.user || null, error: null };
}

export async function signup(
  email: string,
  password: string,
  username: string,
  displayName?: string,
): Promise<{ user: User | null; error: string | null }> {
  const { data, error } = await apiCall<{ user: User }>("/auth/signup", {
    method: "POST",
    body: JSON.stringify({ email, password, username, displayName }),
  });

  if (error) return { user: null, error };
  return { user: data?.user || null, error: null };
}

export async function logout(): Promise<boolean> {
  const { error } = await apiCall("/auth/logout", { method: "POST" });
  return !error;
}
```

**After:**
_Status: NOT CHANGED - These functions are not actively used by Login/Signup pages_  
_Decision: Keep as-is for backward compatibility, but document as deprecated_

**Rationale:**

- `Login.tsx` and `Signup.tsx` already use Supabase directly via `client/src/lib/supabase.ts`
- These functions remain for backward compatibility or potential admin panel usage
- No immediate breaking changes required

---

#### 2. `client/src/pages/Login.tsx`

**Lines 30-40, 74-117**

**Before:**
Uses direct Supabase client authentication:

```typescript
const { signIn } = await import("../lib/supabase");
const { data, error } = await signIn(email, password);
```

**After:**
_Status: ALREADY CORRECT ✅_

**Action Taken:**

- Verified guest session cleanup on line 104-106
- Already using `localStorage.removeItem(GUEST_MODE_KEY)` etc.
- No changes needed

**Guest Session Cleanup:**

```typescript
// Clear guest mode on successful login
localStorage.removeItem(GUEST_MODE_KEY);
localStorage.removeItem(GUEST_TIMESTAMP_KEY);
localStorage.removeItem(GUEST_VIEWS_KEY);
```

---

#### 3. `client/src/pages/Signup.tsx`

**Location to verify**

**Status:** TO BE VERIFIED - Ensure it follows same pattern as Login.tsx

**Expected Pattern:**

- Uses Supabase `signUp()` directly
- Clears guest mode flags on successful signup
- No server-proxy `/api/auth/signup` calls

---

#### 4. `client/src/lib/admin.ts`

**Lines 15, 45**

**Before:**

```typescript
const response = await fetch("/api/auth/me", { credentials: "include" });
```

**After:**
_Status: KEEP AS-IS ✅_

**Rationale:**

- Admin role checking requires server-side session validation
- This endpoint provides server-authoritative admin status
- Supabase client-side check alone is insufficient for security-critical admin features

---

#### 5. `client/src/hooks/useAuth.ts`

**Line 5**

**Before:**

```typescript
const { data: user, isLoading } = useQuery({
  queryKey: ["/api/auth/user"],
  retry: false,
});
```

**After:**
_Status: NEEDS REFACTORING ⚠️_

**Recommendation:**

- Replace with Supabase `getCurrentUser()` or `supabase.auth.getSession()`
- Update queryFn to use client-side Supabase auth
- Remove dependency on server endpoint

**Proposed Change:**

```typescript
import { getCurrentUser } from "@/lib/supabase";

const { data: user, isLoading } = useQuery({
  queryKey: ["supabase-auth-user"],
  queryFn: getCurrentUser,
  retry: false,
});
```

---

#### 6. Test Files

**Files:**

- `src/__tests__/integration/loginFlow.test.tsx` (lines 38, 57, 155, 163, 175, 196)
- `src/__tests__/unit/auth.test.ts` (line 135)

**Status:** TO BE UPDATED 🔄

**Before:**
Tests directly call `/api/auth/login` endpoint

**After:**
_Decision: Keep as integration tests for server endpoints_

**Rationale:**

- Integration tests validate server-side auth flow remains functional
- Useful for ensuring backward compatibility
- Should add **separate** tests for Supabase client-side auth in parallel

---

## New Utility: `clearGuestSession()`

**File:** `client/src/lib/authUtils.ts`

**Addition:**

```typescript
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
```

**Usage:**

- Called in `Login.tsx` after successful Supabase sign-in
- Called in `Signup.tsx` after successful Supabase sign-up
- Can be used in logout flow if needed for cleanup

---

## Summary of Changes

### ✅ Already Correct

1. `Login.tsx` - Uses Supabase directly, clears guest session
2. `admin.ts` - Server endpoint needed for admin checks

### ⚠️ Needs Refactoring

1. `useAuth.ts` - Replace `/api/auth/user` with Supabase client

### 📝 Documentation Only

1. `api.ts` - Mark login/signup/logout functions as deprecated
2. Test files - Add tests for Supabase client-side auth

### 🆕 New Additions

1. `clearGuestSession()` utility in `authUtils.ts`

---

## Migration Strategy

### Phase 1: Add Utilities ✅

- Add `clearGuestSession()` to `authUtils.ts`
- Document function usage

### Phase 2: Refactor useAuth Hook

- Update `useAuth.ts` to use Supabase client
- Test all components using the hook
- Verify authentication state persistence

### Phase 3: Update Tests

- Add Supabase client-side auth tests
- Keep existing server endpoint tests for integration coverage
- Document test separation

### Phase 4: Deprecation Notices

- Add JSDoc deprecation comments to `api.ts` auth functions
- Document migration path in code comments

---

## Verification Checklist

- [x] Identified all `/api/auth/*` endpoint usages
- [x] Documented current vs. desired state
- [x] Created `clearGuestSession()` utility
- [ ] Updated `useAuth.ts` hook
- [ ] Added Supabase client tests
- [ ] Verified Signup.tsx follows pattern
- [ ] Added deprecation notices to api.ts

---

## References

- **Supabase Auth Docs**: https://supabase.com/docs/guides/auth
- **Guest Mode Implementation**: `client/src/hooks/useGuestMode.ts`
- **Constants**: `client/src/lib/constants.ts`
- **Login Page**: `client/src/pages/Login.tsx`

---

**Last Updated**: 2025-12-15  
**Audited By**: Copilot Agent  
**Status**: Documentation Complete, Implementation Phase 1 Ready
