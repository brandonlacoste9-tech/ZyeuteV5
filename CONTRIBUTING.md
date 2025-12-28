# Contributing to Zyeuté V3

Thank you for your interest in contributing to Zyeuté V3! We welcome contributions from the community.

## 🌟 Welcome Contributors!

Zyeuté V3 is Quebec's premier French social media platform. Whether you're fixing bugs, proposing features, improving documentation, or helping with translations, your contributions are valued.

## 🚀 Getting Started

### 1. Understand the Project

- Read the [README.md](README.md) for project overview
- Review the [BUG_TRACKER.md](BUG_TRACKER.md) for current issues
- Check the [Project Board](.github/PROJECT_BOARD.md) for work in progress
- Explore the codebase to understand the architecture

### 2. Set Up Your Development Environment

```bash
# Fork and clone the repository
# Replace {YOUR_GITHUB_USERNAME} with your actual GitHub username
git clone https://github.com/{YOUR_GITHUB_USERNAME}/zyeute-v3.git
cd zyeute-v3

# Install dependencies (this will also set up pre-commit hooks via Husky)
npm install

# Set up environment variables (copy and configure)
cp .env.vercel.example .env

# Run development server
npm run dev
```

**Pre-commit Hooks:**
This project uses Husky and lint-staged to automatically check your code before commits:
- TypeScript type checking
- ESLint for code quality
- Prettier for code formatting

These checks run automatically when you commit. If they fail, fix the issues before committing.

### 3. Find Something to Work On

- Check [Good First Issues](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22good+first+issue%22)
- Look for [Help Wanted](../../issues?q=is%3Aissue+is%3Aopen+label%3A%22help+wanted%22) issues
- Review the [Bug Tracker](BUG_TRACKER.md) for prioritized items
- Propose your own ideas in [Discussions](../../discussions)

## 📝 How to Contribute

### Reporting Bugs

Use our bug report template to ensure all necessary information is provided:

1. Navigate to [Issues](../../issues/new/choose)
2. Select "🐛 Bug Report"
3. Fill out all required fields:
   - Clear description
   - Steps to reproduce
   - Expected vs actual behavior
   - Environment details
   - Screenshots/logs if applicable
4. Submit and wait for triage

**Before reporting**:
- Search existing issues to avoid duplicates
- Verify the bug in the latest version
- Collect all relevant information

### Requesting Features

Use our feature request template:

1. Navigate to [Issues](../../issues/new/choose)
2. Select "✨ Feature Request"
3. Fill out the template:
   - Problem statement
   - Proposed solution
   - Alternative solutions considered
   - Use cases and mockups
4. Submit for team discussion

**Before requesting**:
- Check if the feature already exists
- Search for similar requests
- Consider the project's goals and scope

### Contributing Code

#### Workflow

1. **Create a branch**
   ```bash
   git checkout -b feature/your-feature-name
   # or
   git checkout -b fix/bug-description
   ```

2. **Make your changes**
   - Write clean, readable code
   - Follow existing code style
   - Add comments for complex logic
   - Update documentation as needed

3. **Test your changes**
   ```bash
   npm run check              # TypeScript check
   npm test                   # Run unit tests
   npm run test:coverage      # Generate coverage report
   npm run build              # Build verification
   ```
   
   **Required Testing Standards:**
   - All new features must include tests
   - Maintain minimum 75% code coverage for critical paths
   - Tests must pass locally before pushing
   - Run accessibility checks for UI changes (see below)

4. **Commit your changes**
   ```bash
   git add .
   git commit -m "type: brief description"
   ```
   
   **Commit message format**:
   - `feat: Add guest mode browsing`
   - `fix: Resolve Stripe.js loading issue`
   - `docs: Update installation instructions`
   - `style: Format code with prettier`
   - `refactor: Simplify authentication logic`
   - `test: Add tests for payment flow`
   - `chore: Update dependencies`

5. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template (automatically loaded)
   - Link related issues
   - Wait for Vercel preview deployment to complete
   - Submit for review

**Important:** Preview deployments are automatically created for each PR via Vercel. 
Contributors must verify their changes in the preview environment before requesting review.

#### Code Style

- **TypeScript**: Use TypeScript for type safety
- **Formatting**: Code is formatted automatically (if configured)
- **Naming**: Use clear, descriptive names
  - Components: PascalCase (`UserProfile.tsx`)
  - Functions: camelCase (`getUserData`)
  - Constants: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Comments**: Use JSDoc for public APIs
- **Imports**: Organize and group imports logically

#### Testing Standards

All contributions must meet these testing requirements:

**Unit Tests**
- Write tests for all new functions and components
- Use descriptive test names: `it('should display error when login fails with invalid credentials')`
- Mock external dependencies (Supabase, APIs)
- Aim for 75%+ code coverage

**Integration Tests**
- Test user flows end-to-end for critical features
- Use realistic test data
- Test happy path and error scenarios

**E2E Tests** (for major features)
- Add E2E tests for new authentication flows
- Update `test/e2e/` with new scenarios
- Follow existing test patterns in `auth-flow.test.ts`

**Coverage Requirements**
- **Critical paths**: 75% minimum coverage
- **New features**: Must include tests before merge
- **Bug fixes**: Add regression tests

**Running Tests Locally**
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Generate coverage report
npm run test:coverage

# View coverage report
open coverage/lcov-report/index.html

# Run E2E tests (when implemented)
npm run test:e2e
```

#### Accessibility (A11y) Standards

All UI changes must meet **WCAG 2.1 Level AA** accessibility standards:

**Before Submitting UI Changes:**
1. **Keyboard Navigation**
   - All interactive elements accessible via Tab
   - Enter/Space keys activate buttons
   - Logical tab order
   - Visible focus indicators (contrast ratio ≥ 3:1)

2. **Screen Reader Support**
   - Use semantic HTML (`<button>`, `<nav>`, `<main>`)
   - Add `aria-label` for icon-only buttons
   - Use `aria-live` for dynamic content
   - Test with NVDA (Windows) or VoiceOver (Mac)

3. **Color & Contrast**
   - Text contrast ≥ 4.5:1 (normal text)
   - Large text contrast ≥ 3:1 (18pt+ or 14pt+ bold)
   - Don't rely on color alone to convey information
   - Use [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

4. **Form Accessibility**
   - Labels associated with inputs (`htmlFor` + `id`)
   - Error messages clearly indicated
   - Required fields marked with `aria-required`
   - Validation errors announced to screen readers

5. **Images & Media**
   - All images have descriptive `alt` text
   - Decorative images use `alt=""`
   - Videos have captions/transcripts (if applicable)

**Testing Tools:**
- Browser DevTools (Lighthouse Accessibility score)
- [axe DevTools](https://www.deque.com/axe/devtools/) browser extension
- [WAVE](https://wave.webaim.org/) Web Accessibility Evaluation Tool
- Screen readers: NVDA (Windows), VoiceOver (Mac)

**Audit Documents:**
- Review [BUTTON_A11Y_AUDIT.md](./BUTTON_A11Y_AUDIT.md) for button components
- Check [MEDIA_TEST_PLAYBOOK.md](./MEDIA_TEST_PLAYBOOK.md) for media features
- Follow WCAG guidelines in audit checklists

#### Pull Request Guidelines

**Do**:
- ✅ Keep PRs focused and small
- ✅ Write clear PR descriptions
- ✅ Link related issues
- ✅ Update documentation
- ✅ Add tests for new features (required)
- ✅ Ensure all checks pass (tests, coverage, build)
- ✅ Test accessibility with keyboard and screen reader
- ✅ Update audit documents if adding new components
- ✅ Respond to review feedback

**Don't**:
- ❌ Include unrelated changes
- ❌ Break existing functionality
- ❌ Ignore linting errors
- ❌ Submit without testing
- ❌ Skip accessibility checks for UI changes
- ❌ Submit with failing tests or < 75% coverage
- ❌ Force push after review

### Improving Documentation

Documentation contributions are highly valued:

- Fix typos and grammatical errors
- Clarify confusing explanations
- Add missing information
- Improve examples
- Translate to French (for Quebec users)

**Documentation files**:
- `README.md` - Project overview
- `BUG_TRACKER.md` - Issue tracking
- `.github/` - Templates and guides
- `DEPLOYMENT_FIX.md` - Deployment instructions
- `AUTH_AUDIT_LOG.md` - Authentication audit and refactoring
- `BUTTON_A11Y_AUDIT.md` - Button accessibility checklist
- `MEDIA_TEST_PLAYBOOK.md` - Media testing scenarios
- `test/README.md` - E2E testing guide
- Code comments and JSDoc

## 📋 Quality Assurance Standards

### Test Coverage Requirements

**Critical Path Coverage**: 75% minimum
- Authentication flows
- Payment processing
- User profile management
- Post creation/deletion
- Core navigation

**Feature Coverage**: 60% minimum
- Secondary features
- UI components
- Utility functions

**Coverage Enforcement**:
- CI blocks merge if critical path coverage < 75%
- Coverage report automatically posted on PRs
- Run `npm run test:coverage` to check locally

### Performance Standards

**Lighthouse CI Thresholds** (automatically checked):
- Performance: ≥ 90
- Accessibility: ≥ 90
- Best Practices: ≥ 90
- SEO: ≥ 90

**Key Metrics**:
- First Contentful Paint: < 2s
- Largest Contentful Paint: < 2.5s
- Cumulative Layout Shift: < 0.1
- Total Blocking Time: < 300ms

**Testing Performance Locally**:
```bash
# Build and test performance
npm run build
NODE_ENV=production npm start

# In another terminal
lighthouse http://localhost:3000 --view
```

### Accessibility Compliance

**WCAG 2.1 Level AA** is required for all UI components.

**Automated Checks**:
- Lighthouse accessibility score (CI)
- Color contrast validation
- Semantic HTML verification

**Manual Testing Required**:
- Keyboard navigation (Tab, Enter, Space, Escape)
- Screen reader testing (NVDA or VoiceOver)
- Focus management
- Error announcements

**Reference Documents**:
- [BUTTON_A11Y_AUDIT.md](./BUTTON_A11Y_AUDIT.md) - Button audit checklist
- [MEDIA_TEST_PLAYBOOK.md](./MEDIA_TEST_PLAYBOOK.md) - Media a11y requirements

### Best Practices Checklist

Before submitting your PR, ensure:

**Code Quality**
- [ ] TypeScript types are correct and complete
- [ ] No `any` types (use proper typing)
- [ ] Functions are pure where possible
- [ ] Complex logic has explanatory comments
- [ ] No console.log statements in production code

**Testing**
- [ ] Unit tests written for new functions
- [ ] Integration tests for user flows
- [ ] Tests are isolated and don't depend on order
- [ ] Mocks are used for external dependencies
- [ ] Coverage report shows ≥75% for new code

**Accessibility**
- [ ] Keyboard navigation tested
- [ ] Screen reader tested (NVDA/VoiceOver)
- [ ] Color contrast verified (4.5:1 min)
- [ ] Focus indicators visible
- [ ] ARIA attributes used correctly
- [ ] Semantic HTML elements used

**Performance**
- [ ] Images optimized (WebP, compression)
- [ ] Lazy loading for images/components
- [ ] No unnecessary re-renders
- [ ] Bundle size impact checked
- [ ] Lighthouse score maintained

**Documentation**
- [ ] JSDoc comments for public APIs
- [ ] README updated if needed
- [ ] CHANGELOG updated for features/fixes
- [ ] Audit documents updated for new components

## 🏷️ Labels and Project Management

### Understanding Labels

See [LABELS.md](.github/LABELS.md) for full documentation.

**Common labels**:
- `bug` - Something isn't working
- `feature` - New functionality
- `enhancement` - Improvement to existing feature
- `critical` - Urgent, needs immediate attention
- `good first issue` - Great for newcomers
- `help wanted` - Community help appreciated

### Project Board

Track work on the [Project Board](../../projects):
- **Backlog**: Ideas and future work
- **Todo**: Ready to be worked on
- **In Progress**: Currently being developed
- **Review**: In code review
- **Done**: Completed and merged
- **Blocked**: Waiting on dependencies

## 🔍 Review Process

### What to Expect

1. **Initial Review** (1-3 days)
   - Maintainer reviews your contribution
   - Provides feedback or requests changes
   - May ask questions for clarification

2. **Iteration** (as needed)
   - Address feedback and push updates
   - Discuss alternative approaches
   - Refine the implementation

3. **Approval & Merge**
   - At least one maintainer approval required
   - All checks must pass
   - PR merged into main branch

### Review Criteria

Reviewers check for:
- ✅ Code quality and readability
- ✅ Adherence to project standards
- ✅ Test coverage (≥75% for critical paths)
- ✅ Documentation updates
- ✅ No breaking changes
- ✅ Performance impact
- ✅ Accessibility compliance (WCAG 2.1 AA)
- ✅ All CI checks passing (tests, build, coverage)
- ✅ Security considerations

## 🧪 Testing Guidelines

### Overview

Zyeuté V3 uses **Vitest** for unit and integration tests, with scaffolding for **E2E tests** (Playwright/Cypress to be implemented).

### Running Tests

```bash
# Run all tests once
npm test

# Run unit tests only
npm run test:unit

# Run integration tests only
npm run test:integration

# Run tests in watch mode (during development)
npm run test:watch

# Run tests with UI (interactive)
npm run test:ui

# Generate coverage report
npm run test:coverage
```

### Test Structure

```
client/src/
├── test/
│   ├── e2e/              # End-to-end tests (scaffolded)
│   │   ├── auth.e2e.test.ts
│   │   ├── guestMode.e2e.test.ts
│   │   └── loginFlow.e2e.test.ts
│   └── setup.ts          # Test configuration
├── components/
│   └── Button.test.tsx   # Component tests
├── hooks/
│   └── useGuestMode.test.ts  # Hook tests
└── pages/
    └── __tests__/
        └── PasswordManagement.test.tsx
```

### Writing Tests

#### Component Tests

```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import Button from './Button';

describe('Button Component', () => {
  it('renders with text', () => {
    render(<Button>Click Me</Button>);
    expect(screen.getByText('Click Me')).toBeInTheDocument();
  });

  it('handles click events', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);
    fireEvent.click(screen.getByText('Click Me'));
    expect(handleClick).toHaveBeenCalledOnce();
  });
});
```

#### Unit Tests

```typescript
import { describe, it, expect } from 'vitest';
import { validateEmail } from './validation';

describe('Email Validation', () => {
  it('accepts valid email', () => {
    expect(validateEmail('test@example.com')).toBe(true);
  });

  it('rejects invalid email', () => {
    expect(validateEmail('invalid')).toBe(false);
  });
});
```

#### E2E Tests (Scaffolded - Phase 2)

E2E tests are currently scaffolded and will be implemented in Phase 2:

```typescript
// client/src/test/e2e/auth.e2e.test.ts
describe('Authentication E2E Tests', () => {
  it('should successfully login with valid credentials', async () => {
    // To be implemented with Playwright/Cypress
    // 1. Navigate to /login
    // 2. Enter credentials
    // 3. Click submit
    // 4. Verify redirect to home
  });
});
```

See [auth.e2e.test.ts](client/src/test/e2e/auth.e2e.test.ts) for complete test plans.

### Test Requirements for PRs

When submitting a Pull Request:

#### ✅ Required
- Add tests for new features
- Update tests for modified functionality
- Ensure all existing tests pass
- Maintain or improve code coverage

#### 🎯 Coverage Goals
- **Overall:** 80%+ code coverage
- **Critical paths:** 95%+ (auth, payments, etc.)
- **New code:** 100% coverage for new files

#### 📝 Test Checklist

- [ ] Unit tests for new functions/utilities
- [ ] Component tests for new React components
- [ ] Integration tests for new API endpoints
- [ ] Update existing tests if behavior changed
- [ ] All tests pass locally (`npm test`)
- [ ] Coverage meets requirements (`npm run test:coverage`)

### Testing Best Practices

#### DO ✅
- Write tests before fixing bugs (TDD)
- Test edge cases and error handling
- Use descriptive test names
- Keep tests isolated and independent
- Mock external dependencies (API, database)
- Test user interactions, not implementation details

#### DON'T ❌
- Skip tests because "it's too simple"
- Test implementation details (CSS classes, internal state)
- Write tests that depend on other tests
- Use real API calls in tests
- Commit failing tests
- Ignore test failures in CI/CD

### Debugging Tests

```bash
# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --grep "login"

# Run in debug mode
npm test -- --inspect-brk

# Use Vitest UI for visual debugging
npm run test:ui
```

### CI/CD Integration

Tests run automatically on:
- **Every push** to PR branches
- **Every PR** to `main` or `develop`
- **Before deployment** to production

GitHub Actions workflows:
- `.github/workflows/test.yml` - Test suite
- `.github/workflows/lighthouse-ci.yml` - Performance tests

### Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
- [AUTH_AUDIT_LOG.md](AUTH_AUDIT_LOG.md) - Authentication testing guide
- [EVALUATION_FRAMEWORK.md](EVALUATION_FRAMEWORK.md) - Evaluation system

---

## 🌐 Community Guidelines

### Code of Conduct

Be respectful, inclusive, and professional:
- Respect different opinions and experiences
- Accept constructive criticism gracefully
- Focus on what's best for the community
- Show empathy towards others
- Use welcoming and inclusive language

### Communication

- **Issues**: For bugs and features
- **Discussions**: For questions and ideas
- **Pull Requests**: For code contributions
- **Reviews**: Be constructive and kind

### French Language Support

Zyeuté V3 serves Quebec's Francophone community:
- French translations are welcome
- Comments can be in English or French
- UI text should prioritize French
- Documentation in both languages is ideal

## 🎯 Priorities

Focus areas for contributions:

### High Priority
- Bug fixes (especially critical/high)
- Performance improvements
- Security enhancements
- French language support
- Mobile responsiveness

### Medium Priority
- New features (aligned with roadmap)
- Documentation improvements
- Test coverage
- Code quality refactoring

### Low Priority
- Nice-to-have features
- Cosmetic improvements
- Tool upgrades

## 📚 Resources

### Documentation
- [GitHub Issue Templates](.github/ISSUE_TEMPLATE/)
- [Sample Issues](.github/SAMPLE_ISSUES.md)
- [Project Board Guide](.github/PROJECT_BOARD.md)
- [Changelog](CHANGELOG.md)

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Express.js Guide](https://expressjs.com/)
- [Stripe API](https://stripe.com/docs/api)
- [Supabase Docs](https://supabase.com/docs)

### Getting Help

- Search [existing issues](../../issues)
- Check [discussions](../../discussions)
- Review [closed PRs](../../pulls?q=is%3Apr+is%3Aclosed) for examples
- Ask questions in discussions

## 🏆 Recognition

Contributors are recognized in:
- Pull request acknowledgments
- Release notes
- Project README (for significant contributions)
- Community highlights

## 📞 Contact

Questions about contributing?
- Open a discussion
- Comment on related issues
- Check documentation first

---

## Thank You! 🙏

Every contribution, no matter how small, helps make Zyeuté V3 better for Quebec's Francophone community. We appreciate your time and effort!

---

**Project**: [Zyeuté V3 on GitHub](https://github.com/brandonlacoste9-tech/zyeute-v3)  
**License**: [MIT](LICENSE)

*Made with ❤️ for Quebec | Fait avec ❤️ pour le Québec 🇨🇦⚜️*
