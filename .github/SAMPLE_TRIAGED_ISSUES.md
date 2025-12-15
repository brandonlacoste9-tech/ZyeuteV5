# 📋 Sample Triaged Issues

Examples of properly triaged issues from audit findings, demonstrating the complete triage system.

---

## 🔴 CRITICAL ISSUE EXAMPLE

### Issue #10: Stripe.js Loading Error in Payment Flow

**Labels:** `critical`, `blocker`, `bug`, `payment`, `audit`, `triaged`, `effort/2-4h`

**Priority:** 🔴 CRITICAL - Fix immediately (blocks revenue)

**Description:**
Stripe.js library fails to load intermittently (~20% of the time) when users attempt to make payments for virtual currency. This results in a blank payment modal and prevents purchase completion.

**Root Cause:**
```
File: /src/components/GiftModal.tsx
Line: 45-60
Root Cause: Race condition in Stripe.js loading
- Stripe script loaded asynchronously
- Component mounts before script ready
- No retry logic on failure
- Missing error boundaries

Network analysis shows:
- 3-5 second delay on slower connections
- CSP may be blocking on some configurations
- No fallback or loading states
```

**Current Behavior:**
- User clicks "Purchase" button
- Modal opens but is blank
- Console error: "Stripe is not defined"
- Payment fails silently
- User sees no error message

**Expected Behavior:**
- User clicks "Purchase" button
- Loading spinner shows while Stripe loads
- Modal opens with payment form
- Payment completes successfully
- User receives confirmation

**Acceptance Criteria:**
- [ ] Stripe.js loads 100% of the time (verified over 100 test attempts)
- [ ] Loading state displays while initializing
- [ ] Retry logic attempts 3 times on failure
- [ ] Clear error message shown if all retries fail
- [ ] Error logged to monitoring system
- [ ] Works on 3G, 4G, 5G, and WiFi
- [ ] Works on Chrome, Firefox, Safari
- [ ] Unit tests for retry logic
- [ ] Integration test for payment flow
- [ ] Performance test shows < 3s load time

**Severity:** CRITICAL - Blocks all payments

**Effort Estimate:** 2-4 hours
- Analysis: 30 min
- Implementation: 1.5 hours
- Testing: 1 hour
- Code review: 30 min

**Complexity:** Medium
- Files affected: 2-3 (GiftModal.tsx, stripeService.ts, app config)
- Refactoring needed: Moderate
- Risk level: Medium (payment system is critical)

**Risk Level:** Medium
- Changes core payment flow
- Must not break existing functionality
- Needs thorough testing before production

**Files Affected:**
```
- /src/components/GiftModal.tsx (main component)
- /src/services/stripeService.ts (loading logic)
- /client/index.html (script preload)
- /src/utils/errorBoundary.tsx (error handling)
```

**Related Issues:**
- Depends on: None (can start immediately)
- Blocks: #11 (Gift feature completion), #12 (Monetization rollout)
- Related to: #2 (Stripe env variable fix - already completed)

**Testing Instructions:**
```
Manual Testing:
1. Open https://www.zyeute.com in incognito
2. Slow down network to "Slow 3G" in DevTools
3. Navigate to any post
4. Click Gift icon
5. Select currency amount
6. Click "Purchase"
7. Verify:
   - [ ] Loading spinner appears
   - [ ] Modal opens with Stripe form
   - [ ] Can enter card details
   - [ ] Payment completes OR shows clear error

Automated Testing:
1. Run: npm test -- GiftModal.test.tsx
2. Run: npm run test:integration -- payment-flow
3. Verify all tests pass

Load Testing:
1. Run: npm run test:load -- stripe-loading
2. Verify 100% success rate over 1000 requests
```

**Proposed Fix:**
```typescript
// BEFORE (current broken code)
useEffect(() => {
  const stripe = window.Stripe(STRIPE_KEY);
  setStripeInstance(stripe);
}, []);

// AFTER (with retry logic and loading states)
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const initializeStripe = async (retries = 3) => {
  for (let i = 0; i < retries; i++) {
    try {
      if (window.Stripe) {
        const stripe = window.Stripe(STRIPE_KEY);
        setStripeInstance(stripe);
        setLoading(false);
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (err) {
      console.error(`Stripe init attempt ${i + 1} failed:`, err);
    }
  }
  setError("Payment system unavailable. Please try again later.");
  setLoading(false);
  logError("stripe_initialization_failed", { retries });
};

useEffect(() => {
  initializeStripe();
}, []);
```

**Source Audit:**
Found in: Manual testing and user reports
Referenced in: BUG_TRACKER.md as BUG-001

**Revenue Impact:**
- **Direct Revenue Loss:** $50-100/day (blocked payments)
- **Affected Users:** ~20% of payment attempts
- **Lost Transactions:** ~10-15 per day
- **Total Monthly Impact:** $1,500 - $3,000
- **Urgency:** CRITICAL - Every day costs money

**Security Considerations:**
- Ensure Stripe key not exposed in error logs
- Validate HTTPS connection before loading
- Add CSP headers for Stripe domains

---

## 🟠 HIGH PRIORITY EXAMPLE

### Issue #21: Supabase 422 Error with French Characters

**Labels:** `high`, `bug`, `database`, `i18n`, `audit`, `triaged`, `effort/2-4h`

**Priority:** 🟠 HIGH - Fix this week (impacts UX)

**Description:**
When users create posts containing special characters (emojis, French accented characters like é, è, à, ç), Supabase API returns 422 Unprocessable Entity error. Critical issue for a French-language platform serving Quebec users.

**Root Cause:**
```
File: /server/db.ts and Supabase schema
Line: N/A (database configuration)
Root Cause: Database column encoding not set to UTF-8
- Columns using default encoding (Latin1)
- Input sanitization stripping valid Unicode
- Missing charset headers in API requests
- Client-side validation too restrictive

Database Schema:
CREATE TABLE posts (
  content TEXT NOT NULL -- Missing: CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
);
```

**Current Behavior:**
```
User types: "Bonjour! 🎉 C'est génial ça!"
API Response: 422 Unprocessable Entity
Error: Invalid character in content
Post fails to save
User sees generic error message
```

**Expected Behavior:**
```
User types: "Bonjour! 🎉 C'est génial ça!"
Post saves successfully
Content displays correctly with all characters
Emojis render properly
User sees success confirmation
```

**Acceptance Criteria:**
- [ ] Database columns use UTF-8 encoding (utf8mb4)
- [ ] All French accented characters work: é è à ç ê ô û
- [ ] Common emojis work: 🎉 😊 ❤️ 🇨🇦 ⚜️
- [ ] Mixed content (text + emoji) works
- [ ] Content displays correctly in feed
- [ ] No data corruption on save/retrieve
- [ ] Migration script for existing data
- [ ] Unit tests for Unicode handling
- [ ] Integration test with real French content
- [ ] All 422 errors related to encoding resolved

**Severity:** HIGH - Blocks core platform functionality

**Effort Estimate:** 2-4 hours
- Database migration: 1 hour
- Code updates: 1 hour
- Testing: 1 hour
- Data verification: 30 min
- Deployment: 30 min

**Complexity:** Medium
- Database schema change required
- Potential data migration needed
- Multiple components affected

**Risk Level:** Medium
- Database migration carries risk
- Must not corrupt existing data
- Requires careful testing

**Files Affected:**
```
- /server/db.ts (database connection)
- /shared/schema.ts (schema definitions)
- /server/routes/posts.ts (API endpoints)
- /migration/xxx_add_utf8_encoding.sql (new file)
- /client/src/utils/validation.ts (input validation)
```

**Related Issues:**
- Depends on: None (independent)
- Blocks: #22 (French content campaign), #23 (Emoji reactions)
- Related to: #24 (Emoji picker feature)

**Testing Instructions:**
```
1. Manual Testing:
   a. Navigate to post creation
   b. Test inputs:
      - "Québec"
      - "École française"
      - "C'est génial! 🎉"
      - "Montréal ❤️ 🇨🇦"
   c. Verify all save successfully
   d. Verify display correctly in feed

2. Automated Testing:
   npm test -- posts-unicode.test.ts
   
3. Database Testing:
   - Query saved posts
   - Verify encoding in database
   - No corrupted characters
```

**Proposed Fix:**
```sql
-- 1. Database Migration
ALTER TABLE posts 
  MODIFY COLUMN content TEXT 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;

ALTER TABLE posts 
  MODIFY COLUMN title VARCHAR(255) 
  CHARACTER SET utf8mb4 
  COLLATE utf8mb4_unicode_ci;
```

```typescript
// 2. Update Supabase Connection
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
    },
  },
});
```

```typescript
// 3. Remove overly strict validation
// BEFORE
const validateContent = (content: string) => {
  return /^[a-zA-Z0-9\s]+$/.test(content); // TOO RESTRICTIVE
};

// AFTER
const validateContent = (content: string) => {
  return content.length > 0 && content.length <= 10000; // Allow all Unicode
};
```

**Source Audit:**
Found in: User reports and BUG_TRACKER.md (BUG-002)

**Business Impact:**
- Affects 100% of French-speaking users
- Primary market is Quebec (French)
- Platform unusable for authentic French content
- Impacts brand perception
- User frustration and churn risk

---

## 🟡 MEDIUM PRIORITY EXAMPLE

### Issue #30: React DOM Key Prop Warning in Feed

**Labels:** `medium`, `bug`, `ui`, `code-quality`, `performance`, `audit`, `triaged`, `effort/1h`

**Priority:** 🟡 MEDIUM - Fix next sprint (reduces quality)

**Description:**
React console shows warnings about missing `key` props when rendering the post feed. While not breaking functionality, this causes performance issues with large feeds and creates console spam during development.

**Root Cause:**
```
File: /src/components/Feed.tsx
Line: 67-85
Root Cause: Missing key props in mapped list items

{posts.map((post) => (
  <PostCard post={post} /> // ❌ No key prop
))}
```

**Current Behavior:**
- Console warning on every feed render
- Performance degradation with 100+ posts
- Unnecessary re-renders
- Difficult debugging due to console spam

**Expected Behavior:**
- Clean console (no warnings)
- Efficient re-renders (only changed items)
- Good performance with large feeds
- Professional code quality

**Acceptance Criteria:**
- [ ] No React key warnings in console
- [ ] All `.map()` operations have unique keys
- [ ] Keys use post IDs (not array indices)
- [ ] Nested lists have proper keys
- [ ] ESLint rule enforces key props
- [ ] Performance test shows improvement
- [ ] React DevTools profiler shows fewer re-renders

**Severity:** MEDIUM - Performance and code quality

**Effort Estimate:** 1 hour
- Find all map operations: 15 min
- Add key props: 20 min
- Testing: 15 min
- ESLint configuration: 10 min

**Complexity:** Low
- Simple prop addition
- No logic changes
- Isolated to UI components

**Risk Level:** Low
- Safe change
- Improves stability
- Easy to verify

**Files Affected:**
```
- /src/components/Feed.tsx
- /src/components/PostList.tsx
- /src/components/CommentList.tsx
- /.eslintrc.js (add rule)
```

**Related Issues:**
- Depends on: None
- Blocks: None
- Related to: #31 (Performance optimization), #32 (Code quality)

**Testing Instructions:**
```
1. Open DevTools console
2. Navigate to feed
3. Scroll through 100+ posts
4. Verify: No "key prop" warnings
5. Check React DevTools profiler:
   - Fewer component updates
   - Faster render times
```

**Proposed Fix:**
```typescript
// BEFORE
{posts.map((post) => (
  <PostCard post={post} />
))}

// AFTER
{posts.map((post) => (
  <PostCard key={post.id} post={post} />
))}
```

**Source Audit:**
Found in: BUG_TRACKER.md (BUG-003) and console warnings

---

## 🔐 SECURITY ISSUE EXAMPLE

### Issue #40: Hardcoded Stripe Key in Repository

**Labels:** `critical`, `security`, `blocker`, `audit`, `triaged`, `effort/1h`

**Priority:** 🔴 CRITICAL - Security vulnerability

**Description:**
Stripe publishable key is hardcoded in source code instead of using environment variables. While publishable keys are meant to be public, this practice exposes key rotation complexity and could leak test keys to production.

**Location:**
```
File: /src/services/stripeService.ts
Line: 8
Code: const STRIPE_KEY = "pk_live_xxxxxxxxxxxxx";
```

**Risk Assessment:**
**Potential Impact:**
- Difficulty rotating keys if compromised
- Risk of committing test keys to production
- Violates security best practices
- Fails security audits

**Affected Users:**
- All users (system-wide configuration)

**Exploitability:**
- Low (publishable keys are public)
- But: Still a security violation

**Current Vulnerable Code:**
```typescript
// BEFORE - INSECURE
const STRIPE_KEY = "pk_live_51234567890abcdef";

const stripe = window.Stripe(STRIPE_KEY);
```

**Recommended Fix:**
1. Move key to environment variables
2. Update Vercel/deployment config
3. Add validation for missing keys
4. Document environment setup

**Secure Code Example:**
```typescript
// AFTER - SECURE
const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY;

if (!STRIPE_KEY) {
  throw new Error("VITE_STRIPE_PUBLISHABLE_KEY is required");
}

const stripe = window.Stripe(STRIPE_KEY);
```

**Acceptance Criteria:**
- [ ] Stripe key moved to environment variables
- [ ] No hardcoded keys in source code
- [ ] `.env.example` updated with template
- [ ] Vercel environment variables configured
- [ ] Validation added for missing keys
- [ ] Security scan passes
- [ ] Documentation updated
- [ ] Old keys rotated (if necessary)

**Effort Estimate:** 1 hour
- Move to env vars: 15 min
- Update configs: 15 min
- Testing: 15 min
- Documentation: 15 min

**Files Affected:**
```
- /src/services/stripeService.ts
- /.env.example
- /VERCEL_ENV_REQUIRED.md
- /README.md (setup instructions)
```

**Related Issues:**
- Depends on: None
- Blocks: #41 (Security audit completion)
- Related to: #2 (Stripe env variable - COMPLETED)

**Security Testing:**
```
1. Grep for hardcoded keys:
   grep -r "pk_live_" .
   grep -r "pk_test_" .
   
2. Verify env loading:
   console.log(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY)
   
3. Security scan:
   npm audit
   npm run security-scan
```

**References:**
- OWASP: https://owasp.org/www-community/vulnerabilities/Use_of_hard-coded_password
- Stripe Security: https://stripe.com/docs/keys
- 12-Factor App: https://12factor.net/config

**Compliance Impact:** Yes - SOC 2

---

## ✅ TEST COVERAGE EXAMPLE

### Issue #50: Missing Unit Tests for Authentication Flow

**Labels:** `high`, `testing`, `test-coverage`, `auth`, `audit`, `triaged`, `effort/4-8h`

**Priority:** 🟠 HIGH - Fix this week

**Description:**
Authentication flow lacks comprehensive unit and integration tests. This critical user flow has only 45% test coverage, leaving edge cases and error scenarios untested.

**Component / Module:**
```
Component: Authentication System
Files:
- /src/services/auth.ts
- /src/hooks/useAuth.ts
- /src/pages/LoginPage.tsx
- /src/pages/SignupPage.tsx
```

**Current Coverage:**
```
Current Coverage: 45%
Lines Covered: 120 / 267
Branches Covered: 8 / 24
Functions Covered: 12 / 20

Untested Functions:
- handlePasswordReset()
- validateToken()
- refreshSession()
- handleAuthError()
```

**Target Coverage:**
```
Target Coverage: 85%
Lines to Cover: 227 / 267
Branches to Cover: 20 / 24
Functions to Cover: 18 / 20
```

**Test Scenarios Needed:**

**Happy Path:**
- [ ] User logs in with valid credentials
- [ ] User signs up with valid data
- [ ] Session persists across page refresh
- [ ] User logs out successfully

**Edge Cases:**
- [ ] Login with empty email
- [ ] Login with invalid email format
- [ ] Login with wrong password
- [ ] Signup with existing email
- [ ] Session expires during use
- [ ] Concurrent login attempts

**Error Handling:**
- [ ] Network timeout during login
- [ ] Supabase API returns 500 error
- [ ] Invalid session token
- [ ] Expired refresh token
- [ ] Rate limiting triggered

**Acceptance Criteria:**
- [ ] All test scenarios pass
- [ ] Coverage meets 85% target
- [ ] No flaky tests (5 consecutive runs pass)
- [ ] Tests run in CI/CD pipeline
- [ ] Test execution < 30 seconds
- [ ] Documentation updated with test patterns
- [ ] Mock data fixtures created

**Effort Estimate:** 4-8 hours
- Test setup: 1 hour
- Unit tests: 3 hours
- Integration tests: 2 hours
- Documentation: 1 hour
- CI/CD integration: 1 hour

**Test Files to Create/Update:**
```
New Files:
- /src/services/__tests__/auth.test.ts
- /src/hooks/__tests__/useAuth.test.tsx
- /src/__tests__/fixtures/authFixtures.ts

Update Files:
- /src/pages/__tests__/LoginPage.test.tsx (expand)
- /src/pages/__tests__/SignupPage.test.tsx (expand)
```

**Test Dependencies:**
```
- Testing Framework: Vitest (already installed)
- Mocking: MSW for API mocks
- Testing Library: @testing-library/react
- Utilities: @testing-library/user-event
```

**Testing Approach:**
```
1. Setup test environment with MSW
2. Create auth fixtures (users, tokens, responses)
3. Write unit tests for each function
4. Write integration tests for complete flows
5. Add mocks for Supabase client
6. Verify coverage targets met
7. Add to CI/CD pipeline
```

**Related Issues:**
- Tests for: #10, #11, #12, #13 (auth bug fixes)
- Blocks: #60 (CI/CD completion)
- Related to: #51 (Test infrastructure)

---

## 📊 Summary Statistics

**Total Issues in Examples:** 5

**By Priority:**
- 🔴 CRITICAL: 2 (40%)
- 🟠 HIGH: 2 (40%)
- 🟡 MEDIUM: 1 (20%)
- 🟢 LOW: 0 (0%)

**By Type:**
- 🐛 Bugs: 3
- 🔐 Security: 1
- ✅ Testing: 1

**Total Effort:** 10-18 hours
- Critical: 3-5 hours
- High: 6-12 hours
- Medium: 1 hour

**Dependencies:**
- Independent issues: 4 (can start immediately)
- Dependent issues: 1 (blocked by others)

---

**Document Purpose:** Demonstrate proper issue triage format for audit findings

**Usage:** Copy these examples when creating real triaged issues from audit findings

**Last Updated:** December 15, 2025

🎭⚜️ **Made for Zyeuté - L'app sociale du Québec**
