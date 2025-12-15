# CI/CD Pipeline Documentation

## Overview

This document describes the automated testing and deployment pipeline for Zyeuté V3. The pipeline ensures code quality, runs comprehensive tests, and automates deployments to staging and production environments.

## 🧪 Test Suite

### Test Organization

```
src/__tests__/
├── unit/                    # Unit tests for individual functions
│   ├── auth.test.ts        # Authentication logic tests (11 tests)
│   ├── validation.test.ts  # Input validation tests (29 tests)
│   └── utils.test.ts       # Utility function tests (18 tests)
└── integration/            # Integration tests for user flows
    └── loginFlow.test.tsx  # Login flow integration tests (11 tests)

client/src/
├── components/Button.test.tsx              # Component tests (14 tests)
├── hooks/useGuestMode.test.ts             # Hook tests (5 tests)
├── pages/__tests__/PasswordManagement.test.tsx  # Page tests (12 tests)
└── services/tiGuyAgent.eval.test.ts       # Service tests (18 tests)
```

### Test Coverage

- **Total Tests**: 118 tests
- **Unit Tests**: 58 tests
- **Integration Tests**: 11 tests
- **Component Tests**: 49 tests
- **Coverage Target**: 80%+

### Running Tests

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run tests in watch mode
npm run test:watch

# Run tests with coverage report
npm run test:coverage

# Run tests with UI
npm run test:ui
```

## 🚀 GitHub Actions Workflows

### 1. Test Suite Workflow (`test.yml`)

**Triggers:**
- Pull requests to `main` or `develop` branches
- Pushes to `main` or `develop` branches

**Jobs:**
1. **Test Job**
   - Installs dependencies
   - Runs TypeScript type checking
   - Runs all tests
   - Generates coverage report
   - Uploads coverage to Codecov
   - Builds the project
   - Verifies build artifacts

2. **Lint Job**
   - Runs linting (if lint script exists)
   - Reports code style issues

**Status**: ✅ Required for merge

### 2. Security Scan Workflow (`security.yml`)

**Triggers:**
- Pull requests to `main`
- Pushes to `main`
- Weekly schedule (Sundays at midnight UTC)

**Jobs:**
1. **Security Scan**
   - Runs `npm audit` for dependency vulnerabilities
   - Checks for high/critical severity issues
   - Reports security findings

2. **Dependency Review** (PR only)
   - Reviews new dependencies added in PR
   - Checks for license compliance
   - Fails on moderate+ severity vulnerabilities

**Status**: ⚠️ Informational (warnings don't block merge)

### 3. Deploy to Staging Workflow (`deploy-staging.yml`)

**Triggers:**
- Pull requests to `main` branch (opened, synchronized, reopened)

**Requirements:**
- `VERCEL_TOKEN` secret configured
- `VERCEL_ORG_ID` secret configured
- `VERCEL_PROJECT_ID` secret configured

**Jobs:**
1. **Deploy**
   - Runs all tests first
   - Builds the project
   - Deploys to Vercel preview environment
   - Posts deployment URL as PR comment

**Status**: 🔵 Optional (only runs if Vercel is configured)

### 4. Deploy to Production Workflow (`deploy-production.yml`)

**Triggers:**
- Pushes to `main` branch (after PR merge)

**Requirements:**
- Same Vercel secrets as staging
- Optional: `SLACK_WEBHOOK_URL` for notifications

**Jobs:**
1. **Deploy**
   - Runs full test suite
   - Builds the project
   - Deploys to Vercel production
   - Performs health check on deployed URL
   - Sends Slack notification (if configured)
   - Creates deployment summary

**Status**: 🔴 Critical (production deployment)

## 🔐 Required Secrets

Configure these secrets in GitHub repository settings:
https://github.com/brandonlacoste9-tech/zyeute-v3/settings/secrets/actions

### Essential Secrets

1. **VERCEL_TOKEN**
   - Get from: https://vercel.com/account/tokens
   - Used for: Automated deployments
   - Required for: Staging and Production deployments

2. **VERCEL_ORG_ID**
   - Found in Vercel project settings
   - Used for: Project identification
   - Required for: Staging and Production deployments

3. **VERCEL_PROJECT_ID**
   - Found in Vercel project settings
   - Used for: Project identification
   - Required for: Staging and Production deployments

### Optional Secrets

4. **CODECOV_TOKEN**
   - Get from: https://codecov.io
   - Used for: Test coverage reporting
   - Optional but recommended

5. **SLACK_WEBHOOK_URL**
   - Get from: Slack App settings
   - Used for: Production deployment notifications
   - Optional

## 📋 Branch Protection Rules

Recommended settings for `main` branch:

### Required Status Checks
- ✅ Test Suite (test.yml)
- ✅ Build verification

### Pull Request Requirements
- ✅ Require at least 1 approval
- ✅ Require branches to be up to date before merging
- ✅ Dismiss stale approvals when new commits are pushed

### Additional Settings
- ✅ Require status checks to pass before merging
- ✅ Require conversation resolution before merging
- ⚠️ Optional: Require signed commits

## 🔄 Workflow Examples

### Creating a Pull Request

1. Create a feature branch
   ```bash
   git checkout -b feature/my-feature
   ```

2. Make changes and commit
   ```bash
   git add .
   git commit -m "feat: add new feature"
   ```

3. Push to GitHub
   ```bash
   git push origin feature/my-feature
   ```

4. Open PR on GitHub
   - Workflows automatically run
   - Wait for tests to pass
   - Get code review
   - Merge when approved

### Deployment Flow

```
Developer → PR → Tests Run → Code Review → Merge → Production Deploy
                    ↓
                Staging Deploy (preview)
```

## 📊 Test Coverage Requirements

- **Minimum**: 80% overall coverage
- **Target**: 85%+ for new code
- **Critical paths**: 90%+ coverage required
  - Authentication flows
  - Payment processing
  - Data validation

## 🛠️ Troubleshooting

### Tests Failing Locally

```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Run tests to see detailed errors
npm test

# Check specific test file
npx vitest run src/__tests__/unit/auth.test.ts
```

### Workflow Failures

1. **Build Failures**
   - Check TypeScript errors: `npm run check`
   - Verify dependencies: `npm install`
   - Check build script: `npm run build`

2. **Test Failures**
   - Run tests locally: `npm test`
   - Check test logs in GitHub Actions
   - Verify environment variables

3. **Deployment Failures**
   - Verify Vercel secrets are configured
   - Check Vercel project settings
   - Review deployment logs

### Common Issues

**Issue**: Tests pass locally but fail in CI
- **Solution**: Ensure all dependencies are in `package.json`
- **Solution**: Check for environment-specific code

**Issue**: Deployment fails with "no token"
- **Solution**: Verify secrets are configured in repository settings

**Issue**: Coverage below threshold
- **Solution**: Add more tests or adjust threshold in `vitest.config.ts`

## 📚 Additional Resources

- [Vitest Documentation](https://vitest.dev)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment Docs](https://vercel.com/docs)
- [Testing Library Docs](https://testing-library.com/docs/react-testing-library/intro)

## 🎯 Next Steps

1. **Configure Secrets**: Add Vercel tokens to GitHub secrets
2. **Enable Branch Protection**: Set up rules for main branch
3. **Monitor First Run**: Watch workflows on first PR
4. **Review Coverage**: Check test coverage reports
5. **Iterate**: Add more tests as needed

---

**Last Updated**: December 2025
**Maintained By**: Zyeuté Development Team
