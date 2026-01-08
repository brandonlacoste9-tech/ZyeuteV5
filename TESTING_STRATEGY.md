# 🧪 Zyeute V5 Testing Strategy

**Status**: Repository refactored to `zyeute/` ✅ | **Current Coverage**: Baseline established | **Target**: 60%+ on critical paths

---

## 📊 Current Test Status

### ✅ What's Working
- **67 tests** running successfully (65 passing, 2 timeout issues)
- **Test infrastructure** configured with Vitest + Testing Library
- **Coverage reporting** enabled with v8 provider
- **Test timeout** increased to 10s for component tests

### ⚠️ Issues to Address
- 2 tests timing out (Button.test.tsx, PasswordManagement.test.tsx)
- Some API-dependent tests failing due to missing keys (expected in test env)
- Coverage thresholds not yet enforced

---

## 🎯 Critical User Flows (Priority Order)

### Tier 1: Core Authentication & Onboarding 🔐
**Why**: Users can't do anything without this
- ✅ Login flow (existing test)
- ✅ Signup flow
- ✅ Password reset
- ✅ Auth callback handling
- ✅ Guest mode (existing test)

**Files to Test**:
- `zyeute/frontend/src/pages/Login.tsx`
- `zyeute/frontend/src/pages/Signup.tsx`
- `zyeute/frontend/src/pages/ForgotPassword.tsx`
- `zyeute/frontend/src/pages/ResetPassword.tsx`
- `zyeute/frontend/src/pages/AuthCallback.tsx`
- `zyeute/frontend/src/contexts/AuthContext.tsx`
- `zyeute/frontend/src/contexts/GuestModeContext.tsx` ✅ (has tests)

**Target Coverage**: 80%+

---

### Tier 2: Content Consumption 📱
**Why**: Primary user experience
- Feed browsing
- Post viewing
- Video playback
- Explore/discovery
- Notifications

**Files to Test**:
- `zyeute/frontend/src/pages/Feed.tsx`
- `zyeute/frontend/src/pages/PostDetail.tsx`
- `zyeute/frontend/src/pages/Explore.tsx`
- `zyeute/frontend/src/pages/Player.tsx`
- `zyeute/frontend/src/pages/Notifications.tsx`
- `zyeute/frontend/src/components/features/VideoPlayer.tsx`

**Target Coverage**: 70%+

---

### Tier 3: Content Creation 🎬
**Why**: Creator economy foundation
- Upload flow
- Post creation
- Story creation
- Live streaming setup

**Files to Test**:
- `zyeute/frontend/src/pages/Upload.tsx`
- `zyeute/frontend/src/pages/GoLive.tsx`
- `zyeute/frontend/src/components/features/StoryCreator.tsx`
- `zyeute/frontend/src/services/videoService.ts`

**Target Coverage**: 65%+

---

### Tier 4: Social Features 👥
**Why**: Engagement and retention
- Profile viewing/editing
- Following/followers
- Comments
- Reactions (Fire system)
- Messaging

**Files to Test**:
- `zyeute/frontend/src/pages/Profile.tsx`
- `zyeute/frontend/src/components/features/CommentSection.tsx`
- `zyeute/frontend/src/components/features/FireButton.tsx` ✅ (has tests)
- `zyeute/frontend/src/services/engagementService.ts`

**Target Coverage**: 60%+

---

### Tier 5: Monetization & Premium 💎
**Why**: Revenue generation
- Premium subscription
- Creator revenue
- Virtual gifts
- Marketplace

**Files to Test**:
- `zyeute/frontend/src/pages/Premium.tsx`
- `zyeute/frontend/src/pages/CreatorRevenue.tsx`
- `zyeute/frontend/src/services/stripeService.ts`
- `zyeute/shared/billing.ts`

**Target Coverage**: 60%+

---

## 🛠️ Testing Best Practices

### Component Testing
```typescript
// ✅ Good: Test user interactions
it("should toggle password visibility", async () => {
  render(<Login />);
  const toggle = screen.getByRole("button", { name: /show password/i });
  await userEvent.click(toggle);
  expect(screen.getByPlaceholderText("••••••••")).toHaveAttribute("type", "text");
});

// ❌ Bad: Testing implementation details
it("should call setState", () => {
  const setState = jest.fn();
  // Don't test React internals
});
```

### Integration Testing
```typescript
// ✅ Good: Test full user flows
it("should complete signup flow", async () => {
  renderWithProviders(<Signup />);
  await userEvent.type(screen.getByLabelText(/email/i), "test@example.com");
  await userEvent.type(screen.getByLabelText(/password/i), "password123");
  await userEvent.click(screen.getByRole("button", { name: /sign up/i }));
  await waitFor(() => {
    expect(mockNavigate).toHaveBeenCalledWith("/feed");
  });
});
```

### API Testing
```typescript
// ✅ Good: Mock API calls
vi.mock("@/services/api", () => ({
  apiCall: vi.fn().mockResolvedValue({ data: mockUser }),
}));

// ❌ Bad: Making real API calls in tests
```

---

## 📈 Coverage Goals

### Current Thresholds (vitest.config.ts)
```typescript
thresholds: {
  lines: 60,      // 60% line coverage
  functions: 60,  // 60% function coverage
  branches: 50,   // 50% branch coverage
  statements: 60,  // 60% statement coverage
}
```

### Phase 1: Critical Paths (Week 1)
- ✅ Authentication flows: 80%+
- ✅ Feed/Post viewing: 70%+
- **Total Coverage**: ~40%

### Phase 2: Core Features (Week 2)
- ✅ Upload/Creation: 65%+
- ✅ Social interactions: 60%+
- **Total Coverage**: ~55%

### Phase 3: Advanced Features (Week 3)
- ✅ Premium/Monetization: 60%+
- ✅ Admin/Moderation: 50%+
- **Total Coverage**: 60%+

---

## 🚀 Quick Start Guide

### Run Tests
```bash
# All tests
npm run test

# Watch mode
npm run test:watch

# Coverage report
npm run test:coverage

# UI mode
npm run test:ui

# Specific test file
npm run test zyeute/frontend/src/pages/Login.test.tsx
```

### Write Your First Test
```typescript
// zyeute/frontend/src/pages/__tests__/Feed.test.tsx
import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@/test/utils";
import Feed from "../Feed";

describe("Feed Page", () => {
  it("should render feed with posts", async () => {
    render(<Feed />);
    await waitFor(() => {
      expect(screen.getByText(/loading/i)).not.toBeInTheDocument();
    });
    expect(screen.getByRole("main")).toBeInTheDocument();
  });
});
```

---

## 🔧 Fixing Current Issues

### Timeout Issues
**Problem**: Button.test.tsx and PasswordManagement.test.tsx timing out

**Solution**: 
1. ✅ Increased `testTimeout` to 10s in vitest.config.ts
2. Check for async operations not being awaited
3. Mock heavy dependencies (API calls, animations)

### API Key Issues
**Problem**: Tests failing with 401 errors

**Solution**: 
- Mock API services in test setup
- Use test environment variables
- Create mock API responses

---

## 📝 Test File Naming Convention

```
Component:  ComponentName.test.tsx
Page:       PageName.test.tsx
Hook:       useHookName.test.ts
Service:    serviceName.test.ts
Utility:    utilityName.test.ts
```

---

## 🎯 Next Steps

1. **Fix timeout issues** (2 tests)
   - Investigate Button.test.tsx async behavior
   - Check PasswordManagement.test.tsx render performance

2. **Add critical path tests** (Priority order)
   - [ ] Signup flow integration test
   - [ ] Feed page component test
   - [ ] PostDetail page test
   - [ ] Upload flow test

3. **Set up CI/CD testing**
   - Add test step to GitHub Actions
   - Enforce coverage thresholds
   - Block PRs with failing tests

4. **Documentation**
   - Add test examples to CONTRIBUTING.md
   - Create test utilities guide
   - Document mocking patterns

---

## 📚 Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [React Testing Patterns](https://react-testing-library.com/docs/recipes)

---

**Last Updated**: 2026-01-06  
**Maintained By**: Zyeute V5 Development Team

---

_Made with ❤️ for Quebec | Fait avec ❤️ pour le Québec 🇨🇦⚜️_
