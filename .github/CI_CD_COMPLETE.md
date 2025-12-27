# Complete CI/CD Documentation for Zyeuté V5

This document provides a comprehensive overview of all GitHub Actions workflows in the Zyeuté V5 repository.

## 📋 Table of Contents

- [Workflows Overview](#workflows-overview)
- [Comprehensive CI Workflow](#comprehensive-ci-workflow)
- [Test Suite Workflow](#test-suite-workflow)
- [Security Workflow](#security-workflow)
- [Deployment Workflows](#deployment-workflows)
- [Lighthouse Performance Workflow](#lighthouse-performance-workflow)
- [Local Development](#local-development)
- [Troubleshooting](#troubleshooting)

---

## Workflows Overview

### 1. **Comprehensive CI** (`ci.yml`) 🆕
**Purpose**: Main quality gate that orchestrates all checks in parallel  
**Triggers**: Pull requests, pushes to main/develop, manual dispatch  
**Jobs**:
- ✅ Code Quality (TypeScript, ESLint, Prettier)
- ✅ Test Suite (Unit & Integration tests on Node 20 & 22)
- ✅ E2E Tests (Playwright)
- ✅ Build Verification
- ✅ Security Scanning
- ✅ CI Status Summary

**Runtime**: ~8-10 minutes (parallel execution)

**Key Features**:
- Matrix testing across Node.js versions
- Parallel job execution for faster feedback
- Comprehensive status summary
- Build artifact uploads
- Code coverage reporting

### 2. **Test Suite** (`test.yml`)
**Purpose**: Focused testing with coverage reports  
**Triggers**: Pull requests, pushes to main/develop  
**Jobs**:
- Unit and integration tests
- Code coverage analysis
- Build verification
- Lint checks

**Runtime**: ~5-7 minutes

### 3. **Security Scan** (`security.yml`)
**Purpose**: Security vulnerability detection  
**Triggers**: Pull requests, pushes to main, weekly schedule  
**Jobs**:
- npm audit for dependency vulnerabilities
- Dependency review for PRs
- License compliance checks

**Runtime**: ~2-3 minutes

### 4. **Deploy to Staging** (`deploy-staging.yml`)
**Purpose**: Preview deployments for pull requests  
**Triggers**: Pull request opened/updated  
**Jobs**:
- Test execution
- Build verification
- Deploy to Vercel preview
- Post preview URL to PR

**Runtime**: ~3-5 minutes

**Requirements**: Vercel secrets configured

### 5. **Deploy to Production** (`deploy-production.yml`)
**Purpose**: Production deployment automation  
**Triggers**: Pushes to main branch  
**Jobs**:
- Full test suite
- Production build
- Deploy to Vercel
- Health check
- Slack notification (optional)

**Runtime**: ~5-7 minutes

**Requirements**: Vercel secrets configured

### 6. **Lighthouse CI** (`lighthouse.yml`)
**Purpose**: Performance, accessibility, and SEO auditing  
**Triggers**: Pull requests, pushes to main/develop, manual dispatch  
**Jobs**:
- Build application
- Start local server
- Run Lighthouse on multiple pages
- Generate performance reports

**Runtime**: ~10-15 minutes

**Thresholds**:
- Performance: ≥90
- Accessibility: ≥90
- Best Practices: ≥90
- SEO: ≥90

---

## Comprehensive CI Workflow

The new `ci.yml` workflow is the main quality gate for the repository. It runs multiple jobs in parallel to provide fast feedback.

### Architecture

```
ci.yml
├── code-quality      (TypeScript, ESLint, Prettier)
├── test              (Unit & Integration, Matrix: Node 20/22)
├── e2e               (Playwright E2E tests)
├── build             (Production build verification)
├── security          (npm audit, vulnerability scanning)
└── ci-success        (Summary of all checks)
```

### Job Details

#### Code Quality
- **TypeScript type checking**: Ensures no type errors
- **ESLint**: Code style and quality checks
- **Prettier**: Code formatting validation

#### Test Suite (Matrix)
- **Node 20.x & 22.12.0**: Tests on multiple Node versions
- **Unit tests**: Fast, isolated component tests
- **Integration tests**: API and service integration tests
- **Coverage**: Reports uploaded to Codecov (Node 22 only)

#### E2E Tests
- **Playwright**: Cross-browser end-to-end testing
- **Chromium only**: Optimized for CI speed
- **Artifacts**: Test reports uploaded on failure

#### Build
- **Production build**: Verifies the app builds correctly
- **Artifact verification**: Checks dist/ directory
- **Size reporting**: Reports build size

#### Security
- **npm audit**: Checks for vulnerable dependencies
- **High/Critical**: Only fails on serious vulnerabilities
- **JSON reporting**: Detailed vulnerability information

---

## Test Suite Workflow

### Coverage Reporting

The test workflow generates code coverage reports and comments on PRs with:
- Statement coverage
- Branch coverage
- Function coverage
- Line coverage

**Target**: 75% coverage for critical paths

### Local Testing

```bash
# Run all tests
npm test

# Run with coverage
npm run test:coverage

# Open coverage report
open coverage/lcov-report/index.html

# Watch mode for development
npm run test:watch

# Interactive test UI
npm run test:ui
```

---

## Security Workflow

### Automated Scanning

The security workflow runs:
1. **On every PR**: Dependency review for new vulnerabilities
2. **On every push to main**: Full security audit
3. **Weekly**: Scheduled scan every Sunday at midnight UTC

### Vulnerability Levels

- **Critical/High**: Fails the build, requires immediate attention
- **Moderate**: Warning, should be addressed soon
- **Low**: Informational, fix when convenient

### Local Security Check

```bash
# Run security audit
npm audit

# Get detailed report
npm audit --json

# Try to fix automatically
npm audit fix

# Fix breaking changes (use with caution)
npm audit fix --force
```

---

## Deployment Workflows

### Staging Deployment

**Trigger**: Pull request opened or updated  
**Environment**: Vercel Preview  
**URL**: Posted as comment on PR

**Process**:
1. Checkout code
2. Install dependencies
3. Run tests
4. Build application
5. Deploy to Vercel preview
6. Post preview URL to PR

### Production Deployment

**Trigger**: Push to main branch  
**Environment**: Vercel Production  
**Health Check**: Automatic verification

**Process**:
1. Checkout code
2. Install dependencies
3. Run full test suite
4. Build production version
5. Deploy to Vercel
6. Health check (5 retries)
7. Create deployment summary
8. Send Slack notification (if configured)

### Required Secrets

Add these secrets in GitHub: Settings → Secrets and variables → Actions

```
VERCEL_TOKEN          # Required: Vercel authentication token
VERCEL_ORG_ID         # Required: Your Vercel organization ID
VERCEL_PROJECT_ID     # Required: Your Vercel project ID
CODECOV_TOKEN         # Optional: For coverage reports
SLACK_WEBHOOK_URL     # Optional: For deployment notifications
```

**Getting Vercel credentials**:
1. Go to https://vercel.com/account/tokens
2. Create a new token
3. Find ORG_ID and PROJECT_ID in project settings

---

## Lighthouse Performance Workflow

### Tested Pages

The Lighthouse workflow tests performance on:
- Home page: `http://localhost:3000`
- Login page: `http://localhost:3000/login`
- Signup page: `http://localhost:3000/signup`
- Explore page: `http://localhost:3000/explore`

### Metrics

Each page is tested for:
- **Performance**: Load time, interactivity, visual stability
- **Accessibility**: ARIA labels, contrast, keyboard navigation
- **Best Practices**: HTTPS, console errors, deprecated APIs
- **SEO**: Meta tags, mobile-friendliness, structured data

### Configuration

Lighthouse settings are in `.lighthouserc.json`:
- 3 runs per page (for consistency)
- Median results used
- Desktop and mobile audits

---

## Local Development

### Quick Commands

```bash
# Install dependencies
npm ci

# Run all quality checks (like CI)
npm run preflight

# Individual checks
npm run check      # TypeScript
npm run lint       # ESLint
npm test           # Unit tests
npm run test:e2e   # E2E tests
npm run build      # Production build

# Development
npm run dev        # Start dev server
npm run test:watch # Tests in watch mode
```

### Pre-Commit Checklist

Before pushing code, ensure:
- [ ] `npm run check` passes (no TypeScript errors)
- [ ] `npm run lint` passes (no linting errors)
- [ ] `npm test` passes (all tests green)
- [ ] `npm run build` succeeds (build works)
- [ ] Code is formatted: `npx prettier --write .`

### Mimicking CI Locally

Run the same checks as CI:

```bash
# 1. Code quality
npm run check
npm run lint
npx prettier --check "**/*.{ts,tsx,js,jsx,json,md}"

# 2. Tests
npm run test:unit
npm run test:integration
npm run test:coverage

# 3. E2E
npx playwright install --with-deps chromium
npm run build
npm run test:e2e

# 4. Build
NODE_ENV=production npm run build

# 5. Security
npm audit --audit-level=high
```

---

## Troubleshooting

### Common Issues

#### 1. Workflow Failing on "Install dependencies"

**Symptom**: npm ci fails with lock file errors  
**Solution**: 
```bash
# Update lock file locally
rm package-lock.json
npm install
git add package-lock.json
git commit -m "fix: update package-lock.json"
git push
```

#### 2. TypeScript Errors in CI but not Locally

**Symptom**: Type check passes locally but fails in CI  
**Solution**:
```bash
# Clear TypeScript cache
rm -rf node_modules/.cache
npm run check
```

#### 3. E2E Tests Timing Out

**Symptom**: Playwright tests timeout in CI  
**Solution**:
- Check test timeouts in `playwright.config.ts`
- Increase timeout for CI: `timeout: process.env.CI ? 30000 : 15000`
- Ensure page.waitForLoadState() is used appropriately

#### 4. Build Artifacts Not Found

**Symptom**: "dist directory not found" error  
**Solution**:
- Check build script in `package.json`
- Verify output directory in `vite.config.ts`
- Ensure build doesn't fail silently

#### 5. Vercel Deployment Fails

**Symptom**: Deployment step fails with auth error  
**Solution**:
- Verify VERCEL_TOKEN is not expired
- Check VERCEL_ORG_ID and VERCEL_PROJECT_ID are correct
- Ensure secrets are available in the repo (not in forks)

#### 6. Coverage Reports Not Uploading

**Symptom**: Codecov step fails  
**Solution**:
- CODECOV_TOKEN is optional, set continue-on-error: true
- Check if coverage files are generated: `ls -la coverage/`
- Verify coverage format matches Codecov expectations

### Viewing Workflow Logs

1. Go to GitHub repository
2. Click "Actions" tab
3. Select the failing workflow run
4. Click on the failed job
5. Expand the failing step
6. Review detailed logs

### Re-running Failed Workflows

1. Navigate to the failed workflow run
2. Click "Re-run jobs" in the top right
3. Choose "Re-run failed jobs" or "Re-run all jobs"

### Debugging Locally

If a workflow fails in CI but works locally:

```bash
# Use exact Node version from CI
nvm install 22.12.0
nvm use 22.12.0

# Clean install (like CI)
rm -rf node_modules
npm ci

# Set CI environment variable
export CI=true
npm test
```

---

## Workflow Status Badges

Add these badges to your README or documentation:

```markdown
[![CI](https://github.com/brandonlacoste9-tech/ZyeuteV5/actions/workflows/ci.yml/badge.svg)](https://github.com/brandonlacoste9-tech/ZyeuteV5/actions/workflows/ci.yml)
[![Test Suite](https://github.com/brandonlacoste9-tech/ZyeuteV5/actions/workflows/test.yml/badge.svg)](https://github.com/brandonlacoste9-tech/ZyeuteV5/actions/workflows/test.yml)
[![Security](https://github.com/brandonlacoste9-tech/ZyeuteV5/actions/workflows/security.yml/badge.svg)](https://github.com/brandonlacoste9-tech/ZyeuteV5/actions/workflows/security.yml)
```

---

## Best Practices

### For Contributors

1. **Run tests locally** before pushing
2. **Check TypeScript** with `npm run check`
3. **Format code** with Prettier
4. **Review CI failures** and fix promptly
5. **Keep PRs focused** on single features/fixes

### For Maintainers

1. **Monitor workflow runs** regularly
2. **Update dependencies** to fix vulnerabilities
3. **Review security alerts** weekly
4. **Optimize workflow times** if they get too slow
5. **Keep secrets updated** (rotate tokens periodically)

### Performance Tips

- **Use caching**: npm cache is enabled in all workflows
- **Parallel jobs**: Independent checks run simultaneously
- **Matrix strategy**: Test multiple versions efficiently
- **Artifacts**: Upload only what's needed for debugging
- **Timeouts**: Set reasonable timeouts to prevent hanging

---

## Metrics & Monitoring

### CI Pipeline Metrics

Track these metrics over time:
- **Success rate**: Percentage of passing workflows
- **Build time**: Average time for CI to complete
- **Failure reasons**: Common causes of failures
- **Test coverage**: Trending coverage percentage
- **Security issues**: Number of vulnerabilities over time

### Goals

- **Success rate**: >95%
- **Build time**: <10 minutes for CI
- **Coverage**: >75% for critical paths
- **Security**: 0 high/critical vulnerabilities
- **Deployment time**: <5 minutes to production

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel CLI Documentation](https://vercel.com/docs/cli)
- [Playwright Documentation](https://playwright.dev)
- [Lighthouse CI Documentation](https://github.com/GoogleChrome/lighthouse-ci)
- [Codecov Documentation](https://docs.codecov.com)

---

**Last Updated**: December 2025  
**Maintained By**: Zyeuté Development Team  
**Status**: ✅ Production Ready

🎭⚜️ **Zyeuté V5 - L'app sociale du Québec**
