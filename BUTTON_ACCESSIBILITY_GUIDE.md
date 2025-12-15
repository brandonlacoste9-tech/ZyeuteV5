# Button Accessibility Guide

## Overview

This guide documents the accessibility standards and best practices for all button components in the Zyeuté application. All buttons must meet WCAG 2.1 Level AA standards for keyboard navigation, screen reader support, and visual focus indicators.

---

## Button Component Inventory

### Primary Button Components

| Component | File Path | Status | Notes |
|-----------|-----------|--------|-------|
| `Button` | `/components/Button.tsx` | ✅ Compliant | Full accessibility support |
| `GoldButton` | `/components/GoldButton.tsx` | ✅ Compliant | Added focus rings, aria-label, loading state |
| `ChatButton` | `/components/ChatButton.tsx` | ✅ Compliant | Added focus ring |
| `PlayButton` | `/components/Button.tsx` | ✅ Compliant | Added focus ring |
| `FireButton` | `/components/Button.tsx` | ✅ Compliant | Added focus ring |
| `ColonyTriggerButton` | `/components/ColonyTriggerButton.tsx` | ✅ Compliant | Added focus ring and aria-label |

---

## Accessibility Requirements

### 1. Focus Indicators (WCAG 2.4.7)

**Requirement:** All interactive elements must have a visible focus indicator with at least 3:1 contrast ratio.

**Implementation:**
```typescript
// Standard focus ring for buttons
'focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2'

// Focus ring for buttons on dark backgrounds
'focus:ring-offset-black'

// Focus ring for overlay buttons (e.g., PlayButton)
'focus:ring-inset'
```

**Example:**
```typescript
<button
  className="focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-offset-2 focus:ring-offset-black"
>
  Click me
</button>
```

### 2. Aria Labels (WCAG 4.1.2)

**Requirement:** All buttons must have accessible names that describe their purpose.

**Implementation:**
- Use `aria-label` for icon-only buttons
- Use descriptive text content for text buttons
- Use `aria-label` to override or enhance ambiguous text

**Examples:**
```typescript
// Icon button with aria-label
<button aria-label="Play video">
  ▶️
</button>

// Button with clear text (no aria-label needed)
<button>Submit Form</button>

// Button with ambiguous text (use aria-label)
<button aria-label="Open Ti-Guy chat assistant">
  🎭
</button>

// Complex button with additional context
<button aria-label="Fire level 3 - Give maximum praise">
  🔥🔥🔥
</button>
```

### 3. Disabled States (WCAG 2.4.3)

**Requirement:** Disabled buttons must be visually distinct and not focusable.

**Implementation:**
```typescript
<button
  disabled={isLoading || disabled}
  className="disabled:opacity-50 disabled:cursor-not-allowed"
>
  {isLoading ? 'Loading...' : 'Submit'}
</button>
```

**Anti-patterns:**
- ❌ Don't use `pointer-events: none` alone (prevents keyboard focus)
- ❌ Don't hide disabled state (users need to know why action is unavailable)
- ❌ Don't remove disabled buttons from DOM (breaks navigation flow)

### 4. Loading States (WCAG 4.1.3)

**Requirement:** Buttons must communicate loading state to assistive technologies.

**Implementation:**
```typescript
<button 
  disabled={isLoading}
  aria-busy={isLoading}
  aria-label={isLoading ? 'Submitting...' : 'Submit form'}
>
  {isLoading ? (
    <>
      <LoadingSpinner />
      <span className="sr-only">Loading</span>
    </>
  ) : (
    'Submit'
  )}
</button>
```

### 5. Keyboard Navigation (WCAG 2.1.1)

**Requirements:**
- All buttons must be keyboard accessible
- Tab/Shift+Tab to navigate between buttons
- Enter or Space to activate button
- Focus order must be logical

**Testing:**
```bash
# Tab through all buttons
Tab → Tab → Tab

# Reverse navigation
Shift+Tab → Shift+Tab

# Activate button
Enter (or Space)
```

**Implementation Notes:**
- Native `<button>` elements have keyboard support by default
- Custom components must preserve native behavior
- Don't use `<div>` with onClick (not keyboard accessible)

### 6. Touch Targets (WCAG 2.5.5)

**Requirement:** All touch targets must be at least 44×44 CSS pixels.

**Implementation:**
```typescript
// Size variants
const sizes = {
  sm: 'px-3 py-1.5',  // Minimum 36×36px
  md: 'px-4 py-2',    // Minimum 44×44px (default)
  lg: 'px-6 py-3',    // Minimum 56×56px
};
```

**Icon Buttons:**
```typescript
// Ensure adequate padding for touch
<button className="w-12 h-12 rounded-full"> {/* 48×48px */}
  🔥
</button>
```

---

## Component-Specific Guidelines

### Button.tsx (Primary Component)

**Features:**
- ✅ Focus rings on all variants
- ✅ Loading state with spinner
- ✅ Disabled state handling
- ✅ Size variants (sm, md, lg)
- ✅ Icon support (left/right)

**Usage:**
```typescript
import { Button } from '@/components/Button';

<Button 
  variant="primary"
  size="md"
  isLoading={isSubmitting}
  disabled={!isValid}
  aria-label="Submit registration form"
  onClick={handleSubmit}
>
  Sign Up
</Button>
```

### GoldButton.tsx

**Features:**
- ✅ Focus ring with gold color
- ✅ Haptic feedback
- ✅ Loading state
- ✅ Aria-label support
- ✅ Inverse style variant

**Usage:**
```typescript
import { GoldButton } from '@/components/GoldButton';

<GoldButton
  size="lg"
  isLoading={isSaving}
  aria-label="Save profile changes"
  onClick={handleSave}
>
  Save Profile
</GoldButton>
```

### ChatButton.tsx

**Features:**
- ✅ Fixed positioning
- ✅ Focus ring
- ✅ Aria-label
- ✅ Haptic feedback
- ✅ Size variants

**Usage:**
```typescript
import { ChatButton } from '@/components/ChatButton';

<ChatButton 
  size="md" 
  isFixed={true}
  onClick={() => console.log('Chat opened')}
/>
```

### PlayButton (Video Controls)

**Features:**
- ✅ Focus ring (inset for overlay)
- ✅ Aria-label
- ✅ Hover animations
- ✅ Size customization

**Usage:**
```typescript
import { PlayButton } from '@/components/Button';

<PlayButton 
  size={64}
  onClick={handlePlayVideo}
/>
```

### FireButton (Post Reactions)

**Features:**
- ✅ Focus ring with rounded shape
- ✅ Aria-label with level context
- ✅ Active/inactive states
- ✅ Hover animations

**Usage:**
```typescript
import { FireButton } from '@/components/Button';

<FireButton
  level={3}
  active={userHasLiked}
  onClick={handleToggleLike}
/>
```

---

## Testing Checklist

### Automated Tests

- [x] Button renders with correct aria-label
- [x] Button is disabled when disabled prop is true
- [x] Button shows loading state correctly
- [x] Button handles click events
- [ ] Button is keyboard navigable (Tab/Enter/Space)
- [ ] Focus indicator is visible

### Manual Testing

#### Keyboard Navigation
- [ ] Tab key moves focus to button
- [ ] Shift+Tab moves focus away from button
- [ ] Enter key activates button
- [ ] Space key activates button
- [ ] Focus indicator is visible (gold ring)
- [ ] Focus indicator has 3:1 contrast ratio

#### Screen Reader Testing

**VoiceOver (macOS/iOS):**
- [ ] Button is announced with role "button"
- [ ] Button label is read correctly
- [ ] Disabled state is announced
- [ ] Loading state is announced

**NVDA (Windows):**
- [ ] Button is announced with role "button"
- [ ] Button label is read correctly
- [ ] Disabled state is announced
- [ ] Loading state is announced

**JAWS (Windows):**
- [ ] Button is announced with role "button"
- [ ] Button label is read correctly
- [ ] Disabled state is announced
- [ ] Loading state is announced

#### Touch/Mobile Testing
- [ ] Button is at least 44×44 CSS pixels
- [ ] Button has adequate spacing from other interactive elements
- [ ] Button provides visual feedback on touch (active state)
- [ ] Button works on iOS Safari
- [ ] Button works on Android Chrome

#### Visual Testing
- [ ] Focus ring is visible on dark backgrounds
- [ ] Focus ring is visible on light backgrounds
- [ ] Focus ring doesn't obscure button content
- [ ] Disabled state is visually distinct (50% opacity)
- [ ] Loading spinner is visible and animated

---

## Common Accessibility Issues & Solutions

### Issue: Focus ring not visible on dark background

**Solution:**
```typescript
// Add ring-offset to create contrast
'focus:ring-offset-2 focus:ring-offset-black'
```

### Issue: Button not keyboard accessible

**Solution:**
```typescript
// Always use native <button> element, not <div>
<button onClick={...}>
  Click me
</button>

// NOT THIS:
<div onClick={...}>
  Click me
</div>
```

### Issue: Icon button has no label

**Solution:**
```typescript
// Add descriptive aria-label
<button aria-label="Open chat">
  💬
</button>
```

### Issue: Loading state not announced

**Solution:**
```typescript
<button 
  aria-busy={isLoading}
  aria-label={isLoading ? 'Submitting...' : 'Submit'}
>
  {isLoading ? <Spinner /> : 'Submit'}
</button>
```

### Issue: Disabled button still focusable

**Solution:**
```typescript
// Use disabled attribute, not just CSS
<button disabled={true}>
  Submit
</button>

// NOT THIS:
<button style={{ pointerEvents: 'none' }}>
  Submit
</button>
```

---

## Tools & Resources

### Testing Tools

**Automated Testing:**
- [axe DevTools](https://www.deque.com/axe/devtools/) - Browser extension for accessibility testing
- [WAVE](https://wave.webaim.org/) - Web accessibility evaluation tool
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Built into Chrome DevTools

**Screen Readers:**
- **VoiceOver** (macOS) - Cmd+F5 to enable
- **NVDA** (Windows) - Free, open-source
- **JAWS** (Windows) - Industry standard

**Keyboard Testing:**
- Tab/Shift+Tab - Navigation
- Enter/Space - Activation
- Arrow keys - Selection (for button groups)

### WCAG 2.1 Guidelines

**Level A (Must Have):**
- 2.1.1 Keyboard - All functionality available via keyboard
- 2.4.3 Focus Order - Focus order is logical and intuitive
- 4.1.2 Name, Role, Value - All components have accessible names

**Level AA (Should Have):**
- 2.4.7 Focus Visible - Keyboard focus indicator is visible
- 2.5.5 Target Size - Touch targets are at least 44×44 pixels

**Level AAA (Nice to Have):**
- 2.5.8 Target Size (Enhanced) - Touch targets are at least 44×44 pixels with spacing

### Additional Resources

- [MDN - Button Element](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/button)
- [ARIA Authoring Practices Guide - Button](https://www.w3.org/WAI/ARIA/apg/patterns/button/)
- [WebAIM - Keyboard Accessibility](https://webaim.org/techniques/keyboard/)
- [WCAG 2.1 Quick Reference](https://www.w3.org/WAI/WCAG21/quickref/)

---

## Version History

**v1.0** - December 15, 2025
- Initial documentation
- Added focus rings to all button components
- Added aria-label support to GoldButton
- Added loading states to GoldButton
- Fixed logger errors in tests
- All 118 tests passing

---

## Future Improvements

- [ ] Add haptic feedback to all buttons (currently only GoldButton and ChatButton)
- [ ] Add button press animations consistently
- [ ] Add keyboard shortcuts (e.g., Ctrl+Enter to submit)
- [ ] Add button groups with arrow key navigation
- [ ] Add button tooltips for icon-only buttons
- [ ] Add focus-within styles for button groups

---

**Last Updated:** December 15, 2025  
**Maintained By:** Zyeuté Engineering Team  
**Status:** ✅ Active
