# Guest Mode Authentication - Implementation Guide

## Overview

Zyeuté now supports a **Guest Mode** feature that allows users to explore the app for 24 hours without creating an account. After viewing 3 pages, users see a conversion banner encouraging them to sign up.

## Features

✅ **24-Hour Guest Access** - Users can browse without authentication for 24 hours  
✅ **View Tracking** - Counts page visits to trigger conversion prompts  
✅ **Conversion Banner** - Shows after 3 views with countdown timer  
✅ **Automatic Cleanup** - Expired sessions are automatically cleared  
✅ **Seamless Transition** - Guest mode clears upon successful signup/login

## Architecture

### Components

#### 1. `useGuestMode` Hook (`client/src/hooks/useGuestMode.ts`)

Manages guest session state and view counting.

**Returns:**

```typescript
{
  isGuest: boolean;        // Is user in guest mode?
  isExpired: boolean;      // Has guest session expired?
  remainingTime: number;   // Time left in milliseconds
  viewsCount: number;      // Number of pages viewed
  incrementViews: () => void; // Increment view counter
}
```

**Usage:**

```typescript
import { useGuestMode } from "@/hooks/useGuestMode";

const { isGuest, viewsCount, incrementViews } = useGuestMode();

// Increment views on page load
useEffect(() => {
  incrementViews();
}, [incrementViews]);
```

#### 2. `GuestBanner` Component (`client/src/components/GuestBanner.tsx`)

Conversion banner that appears after 3 views.

**Features:**

- Shows remaining time (hours and minutes)
- "Create Account" button linking to `/signup`
- Dismissible with ✕ button
- Luxury Quebec-themed styling (gold gradient)

**Usage:**

```typescript
import { GuestBanner } from '@/components/GuestBanner';

// Add to layout
<MainLayout>
  <YourContent />
  <GuestBanner />
</MainLayout>
```

#### 3. Constants (`client/src/lib/constants.ts`)

Shared configuration values.

```typescript
export const GUEST_SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours
export const GUEST_MODE_KEY = "zyeute_guest_mode";
export const GUEST_TIMESTAMP_KEY = "zyeute_guest_timestamp";
export const GUEST_VIEWS_KEY = "zyeute_guest_views_count";
```

## How It Works

### 1. Guest Login Flow

**User clicks "🎭 Mode Invité" button on Login page**

```typescript
// Sets localStorage flags
localStorage.setItem(GUEST_MODE_KEY, "true");
localStorage.setItem(GUEST_TIMESTAMP_KEY, Date.now().toString());
localStorage.setItem(GUEST_VIEWS_KEY, "0");

// Redirects to feed
window.location.href = "/";
```

### 2. Authentication Check

**`ProtectedRoute` in `App.tsx` allows both authenticated users and valid guest sessions**

```typescript
// Check authenticated user
const response = await fetch("/api/auth/me", { credentials: "include" });
if (response.ok && data.user) {
  setIsAuthenticated(true);
  return;
}

// Check guest mode
const guestMode = localStorage.getItem(GUEST_MODE_KEY);
const guestTimestamp = localStorage.getItem(GUEST_TIMESTAMP_KEY);

if (guestMode === "true" && guestTimestamp) {
  const age = Date.now() - parseInt(guestTimestamp, 10);

  if (age < GUEST_SESSION_DURATION) {
    setIsAuthenticated(true); // Allow access
  } else {
    // Clear expired session
    localStorage.removeItem(GUEST_MODE_KEY);
    localStorage.removeItem(GUEST_TIMESTAMP_KEY);
    localStorage.removeItem(GUEST_VIEWS_KEY);
  }
}
```

### 3. View Counting

**Feed page increments view counter**

```typescript
const { incrementViews } = useGuestMode();

useEffect(() => {
  incrementViews(); // Tracks page visits
}, [incrementViews]);
```

### 4. Conversion Banner

**Shows after 3 views**

```typescript
// GuestBanner.tsx
if (!isGuest || isDismissed || viewsCount < 3) return null;

// Calculate remaining time
const hoursRemaining = Math.floor(remainingTime / (1000 * 60 * 60));
const minutesRemaining = Math.floor(
  (remainingTime % (1000 * 60 * 60)) / (1000 * 60),
);
```

### 5. Successful Signup/Login

**Clears guest mode flags**

```typescript
// On successful login/signup
localStorage.removeItem(GUEST_MODE_KEY);
localStorage.removeItem(GUEST_TIMESTAMP_KEY);
localStorage.removeItem(GUEST_VIEWS_KEY);
```

## Testing

### Unit Tests

Run tests for the `useGuestMode` hook:

```bash
npm test -- useGuestMode.test.ts
```

**Test coverage includes:**

- Default state initialization
- Active guest session detection
- Expired session detection and cleanup
- View counter incrementing
- Stable function reference (useCallback)

### Manual Testing Checklist

1. **Guest Login**
   - [ ] Click "🎭 Mode Invité" on login page
   - [ ] Verify redirect to feed
   - [ ] Check localStorage has guest flags

2. **Session Persistence**
   - [ ] Close browser tab
   - [ ] Reopen application
   - [ ] Verify still in guest mode

3. **View Counting**
   - [ ] Navigate to 3+ pages (Feed, Explore, Profile)
   - [ ] Verify banner appears after 3rd view
   - [ ] Check localStorage `zyeute_guest_views_count` increments

4. **Banner Functionality**
   - [ ] Verify countdown timer shows hours/minutes
   - [ ] Click "Créer un compte" → redirects to `/signup`
   - [ ] Click ✕ → banner dismisses

5. **Session Expiry**
   - [ ] Set `zyeute_guest_timestamp` to 25 hours ago
   - [ ] Reload page
   - [ ] Verify redirect to login
   - [ ] Check localStorage cleared

6. **Signup Conversion**
   - [ ] In guest mode, click "Create Account"
   - [ ] Complete signup
   - [ ] Verify guest flags cleared
   - [ ] Verify authenticated session active

## Security Considerations

✅ **No PII Storage** - Only stores timestamps and view counts  
✅ **Automatic Cleanup** - Expired sessions self-destruct  
✅ **Client-Side Only** - No server-side guest session management needed  
✅ **CodeQL Scan Passed** - Zero vulnerabilities detected

## Configuration

To change the guest session duration:

```typescript
// client/src/lib/constants.ts
export const GUEST_SESSION_DURATION = 48 * 60 * 60 * 1000; // 48 hours
```

To change the view threshold for banner:

```typescript
// client/src/components/GuestBanner.tsx
if (viewsCount < 5) return null; // Show after 5 views
```

## Browser Compatibility

- **LocalStorage**: Supported in all modern browsers
- **Graceful Degradation**: Falls back to standard auth if localStorage unavailable

## Troubleshooting

### Banner not appearing after 3 views

- Check localStorage: `zyeute_guest_views_count` should be ≥ 3
- Verify `isGuest` is `true` in `useGuestMode` hook
- Check console for any errors

### Guest session expires immediately

- Verify `GUEST_SESSION_DURATION` constant value
- Check `zyeute_guest_timestamp` in localStorage (should be recent)
- Clear localStorage and try fresh guest login

### ProtectedRoute not allowing guest access

- Verify localStorage flags are set: `zyeute_guest_mode`, `zyeute_guest_timestamp`
- Check browser console for auth errors
- Ensure `GUEST_SESSION_DURATION` constant is imported in `App.tsx`

## Future Enhancements

- [ ] Add guest mode restrictions (e.g., can't post, like, or comment)
- [ ] Track which features guests attempt to use for analytics
- [ ] A/B test different view thresholds for banner
- [ ] Add "Remind me later" option for banner
- [ ] Show feature teaser when guests try restricted actions

## Related Files

- `client/src/hooks/useGuestMode.ts` - Guest mode hook
- `client/src/hooks/useGuestMode.test.ts` - Hook tests
- `client/src/components/GuestBanner.tsx` - Conversion banner
- `client/src/lib/constants.ts` - Shared constants
- `client/src/pages/Login.tsx` - Guest login entry point
- `client/src/pages/Signup.tsx` - Signup page (clears guest mode)
- `client/src/App.tsx` - ProtectedRoute (allows guest access)
- `client/src/components/MainLayout.tsx` - Banner integration
- `client/src/pages/Feed.tsx` - View counter integration

---

**Last Updated:** 2025-12-14  
**Author:** GitHub Copilot  
**Status:** ✅ Production Ready
