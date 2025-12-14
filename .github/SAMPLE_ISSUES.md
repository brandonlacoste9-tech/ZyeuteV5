# Sample Issues for Zyeuté V3

This document contains sample bug reports and feature requests that can be created to populate the issue tracking system.

## Sample Bugs

### Bug 1: Stripe.js Loading Error in Payment Flow

**Title**: Stripe.js fails to load on checkout page causing payment failures

**Description**:
When users attempt to make a payment for virtual currency, the Stripe.js library fails to load intermittently, preventing the payment form from rendering. This results in a blank payment modal and users cannot complete purchases.

**Steps to Reproduce**:
1. Navigate to the virtual gifts section
2. Select a gift package to purchase
3. Click "Buy Now" to open the payment modal
4. Observe that sometimes the Stripe payment form doesn't render

**Expected**: Stripe payment form should always load and display properly

**Actual**: Payment form is blank approximately 20% of the time

**Environment**:
- Browser: Chrome 120, Firefox 121
- Device: Desktop and Mobile
- Network: Various (appears to happen on slower connections)

**Priority**: Critical

**Labels**: `bug`, `critical`, `payment`

**GitHub CLI Command**:
```bash
gh issue create \
  --title "[BUG] Stripe.js fails to load on checkout page causing payment failures" \
  --body "**Description:**
When users attempt to make a payment for virtual currency, the Stripe.js library fails to load intermittently, preventing the payment form from rendering.

**Steps to Reproduce:**
1. Navigate to the virtual gifts section
2. Select a gift package to purchase
3. Click \"Buy Now\" to open the payment modal
4. Observe that sometimes the Stripe payment form doesn't render

**Expected Behavior:** Stripe payment form should always load and display properly

**Actual Behavior:** Payment form is blank approximately 20% of the time

**Environment:**
- Browser: Chrome 120, Firefox 121
- Device: Desktop and Mobile
- Network: Various (appears to happen on slower connections)

**Priority:** Critical
**Impact:** Users cannot complete purchases, revenue loss" \
  --label "bug,critical"
```

---

### Bug 2: Supabase 422 Unprocessable Entity Error

**Title**: Supabase returns 422 error when creating new posts with special characters

**Description**:
When users create posts containing certain special characters (emojis, accented French characters like é, è, à), the Supabase API returns a 422 Unprocessable Entity error. This is particularly problematic for a French-language platform.

**Steps to Reproduce**:
1. Log in to the application
2. Create a new post with text: "C'est génial! 🎉 À bientôt"
3. Click "Post" button
4. Observe 422 error in network console

**Expected**: Post should be created successfully with all Unicode characters

**Actual**: Supabase rejects the request with 422 error

**Environment**:
- All browsers
- All devices
- Consistent reproduction

**Priority**: High

**Labels**: `bug`, `high`, `database`

**GitHub CLI Command**:
```bash
gh issue create \
  --title "[BUG] Supabase returns 422 error when creating posts with special characters" \
  --body "**Description:**
When users create posts containing certain special characters (emojis, accented French characters), the Supabase API returns a 422 Unprocessable Entity error.

**Steps to Reproduce:**
1. Log in to the application
2. Create a new post with text: \"C'est génial! 🎉 À bientôt\"
3. Click \"Post\" button
4. Observe 422 error in network console

**Expected Behavior:** Post should be created successfully with all Unicode characters

**Actual Behavior:** Supabase rejects the request with 422 error

**Environment:**
- All browsers
- All devices
- Consistent reproduction

**Priority:** High
**Impact:** Users cannot post content with French accents or emojis" \
  --label "bug,high"
```

---

### Bug 3: React DOM Console Warning on Feed Page

**Title**: React DOM warning "Each child in a list should have a unique key prop"

**Description**:
Console shows React warning about missing keys when rendering the post feed. While this doesn't break functionality, it causes performance issues and console spam, especially with large feeds.

**Steps to Reproduce**:
1. Navigate to main feed page
2. Open browser developer console
3. Scroll through feed
4. Observe repeated React warnings in console

**Expected**: Clean console without warnings, proper key props on all list items

**Actual**: Multiple warnings: "Warning: Each child in a list should have a unique 'key' prop"

**Console Output**:
```
Warning: Each child in a list should have a unique "key" prop.
    at PostCard (PostCard.tsx:15)
    at Feed (Feed.tsx:42)
```

**Environment**:
- All browsers with React DevTools
- Development and production builds

**Priority**: Medium

**Labels**: `bug`, `medium`, `code-quality`

**GitHub CLI Command**:
```bash
gh issue create \
  --title "[BUG] React DOM warning about missing key props in post feed" \
  --body "**Description:**
Console shows React warning about missing keys when rendering the post feed. This causes performance issues and console spam.

**Steps to Reproduce:**
1. Navigate to main feed page
2. Open browser developer console
3. Scroll through feed
4. Observe repeated React warnings in console

**Expected Behavior:** Clean console without warnings, proper key props on all list items

**Actual Behavior:** Multiple warnings about missing key props

**Console Output:**
\`\`\`
Warning: Each child in a list should have a unique 'key' prop.
    at PostCard (PostCard.tsx:15)
    at Feed (Feed.tsx:42)
\`\`\`

**Priority:** Medium
**Impact:** Performance degradation with large feeds, debugging difficulty" \
  --label "bug,medium"
```

---

## Sample Features

### Feature 1: Guest Mode / Browse Without Login

**Title**: Implement guest mode to allow browsing without account creation

**Description**:
Allow users to browse public content and explore the platform without creating an account. This will lower the barrier to entry and increase user acquisition.

**Problem Statement**:
Currently, users must create an account before seeing any content. This creates friction in the onboarding process and reduces conversion rates. Potential users want to explore the platform before committing to registration.

**Proposed Solution**:
- Create a guest/public mode that allows unauthenticated users to:
  - Browse public posts (read-only)
  - View user profiles
  - See trending content
- Add "Sign up to interact" prompts on actions (like, comment, post)
- Implement session tracking for guest users (analytics)
- Show benefits of creating an account throughout the experience

**Use Cases**:
1. New visitors want to see what the platform offers
2. Shared links should be viewable without account
3. SEO and social sharing benefits
4. Marketing campaigns can link to content

**Priority**: High

**Labels**: `feature`, `high`, `ux`

**GitHub CLI Command**:
```bash
gh issue create \
  --title "[FEATURE] Implement guest mode to allow browsing without account creation" \
  --body "**Problem Statement:**
Currently, users must create an account before seeing any content. This creates friction and reduces conversion rates.

**Proposed Solution:**
- Create a guest/public mode for unauthenticated users
- Allow browsing public posts (read-only)
- View user profiles and trending content
- Add 'Sign up to interact' prompts on actions
- Implement session tracking for analytics
- Show account creation benefits

**Use Cases:**
1. New visitors want to explore before registering
2. Shared links should be viewable without account
3. SEO and social sharing benefits
4. Marketing campaigns can link to content

**Benefits:**
- Lower barrier to entry
- Increased user acquisition
- Better SEO performance
- Improved sharing capabilities

**Priority:** High" \
  --label "feature,high,enhancement"
```

---

### Feature 2: Fix Manifest 401 Unauthorized Error

**Title**: Resolve manifest.json 401 error and implement proper PWA support

**Description**:
The application currently returns a 401 Unauthorized error when requesting `/manifest.json`, preventing the app from being installable as a Progressive Web App (PWA). This impacts mobile user experience and discoverability.

**Problem Statement**:
Users cannot install Zyeuté V3 as a PWA on their devices because the manifest file is not properly configured or is being blocked by authentication middleware. This limits the app's mobile capabilities and user engagement.

**Proposed Solution**:
1. Create a proper `manifest.json` file with:
   - App name, description, icons
   - Theme colors matching Zyeuté branding
   - Display mode (standalone)
   - Start URL and scope
2. Configure Express middleware to serve manifest without authentication
3. Add service worker for offline capabilities
4. Implement app icons in multiple sizes
5. Test PWA installation on iOS and Android

**Technical Details**:
```json
{
  "name": "Zyeuté V3",
  "short_name": "Zyeuté",
  "description": "Quebec's premier French social media platform",
  "start_url": "/",
  "display": "standalone",
  "theme_color": "#your-brand-color",
  "background_color": "#ffffff",
  "icons": [...]
}
```

**Use Cases**:
1. Users want to install the app on mobile home screen
2. Offline access to cached content
3. Native-like app experience
4. Push notifications (future feature)

**Priority**: Medium

**Labels**: `feature`, `medium`, `pwa`, `mobile`

**GitHub CLI Command**:
```bash
gh issue create \
  --title "[FEATURE] Resolve manifest.json 401 error and implement PWA support" \
  --body "**Problem Statement:**
The application returns a 401 error when requesting /manifest.json, preventing PWA installation.

**Proposed Solution:**
1. Create proper manifest.json with app metadata
2. Configure Express to serve manifest without auth
3. Add service worker for offline capabilities
4. Implement app icons in multiple sizes
5. Test PWA installation on iOS and Android

**Technical Details:**
- Create manifest.json with name, icons, theme colors
- Add middleware exception for /manifest.json route
- Implement service worker registration
- Add meta tags for iOS web app

**Use Cases:**
1. Install app on mobile home screen
2. Offline access to cached content
3. Native-like app experience
4. Push notifications (future)

**Benefits:**
- Improved mobile UX
- Better user engagement
- Reduced data usage
- Native-like features

**Priority:** Medium" \
  --label "feature,medium,enhancement"
```

---

## Creating All Sample Issues

To create all sample issues at once, run:

```bash
# Navigate to repository
cd /path/to/zyeute-v3

# Create Bug Issues
gh issue create --title "[BUG] Stripe.js fails to load on checkout page causing payment failures" --body "See SAMPLE_ISSUES.md for full details" --label "bug,critical"
gh issue create --title "[BUG] Supabase returns 422 error when creating posts with special characters" --body "See SAMPLE_ISSUES.md for full details" --label "bug,high"
gh issue create --title "[BUG] React DOM warning about missing key props in post feed" --body "See SAMPLE_ISSUES.md for full details" --label "bug,medium"

# Create Feature Issues
gh issue create --title "[FEATURE] Implement guest mode to allow browsing without account creation" --body "See SAMPLE_ISSUES.md for full details" --label "feature,high,enhancement"
gh issue create --title "[FEATURE] Resolve manifest.json 401 error and implement PWA support" --body "See SAMPLE_ISSUES.md for full details" --label "feature,medium,enhancement"
```

---

## Notes for Team

- **Real Issues**: These sample issues are based on common problems in React/TypeScript applications with Stripe and Supabase
- **Customization**: Adjust priorities, assignees, and details based on actual project needs
- **Labels**: Ensure labels are created first (see LABELS.md)
- **Project Board**: Add these issues to the project board after creation
- **Tracking**: All issues are tracked in BUG_TRACKER.md

---

**Last Updated**: December 2024
**Maintained by**: Zyeuté V3 Development Team
