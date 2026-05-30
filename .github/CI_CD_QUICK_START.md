# CI/CD Quick Start Guide 🚀

**5-Minute Setup for Zyeuté V3**

## ⚡ Quick Commands

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Watch mode (auto-rerun on changes)
npm run test:watch

# Generate coverage report
npm run test:coverage

# Interactive test UI
npm run test:ui

# Build Docker images locally (for testing)
docker build -f backend/Dockerfile -t brandontech/zyeute-backend:local .
docker build -f infrastructure/colony/Dockerfile -t brandontech/zyeute-colony-worker:local infrastructure/colony
```

## 🎯 What Happens on PR

When you create a pull request:

1. **Tests Run** (2-3 min)
   - All 118 tests execute
   - Build verification
   - Type checking

2. **Security Scan** (1 min)
   - npm audit check
   - Dependency review
   - License compliance

3. **Staging Deploy** (2-3 min) _(if secrets configured)_
   - Deploy to Vercel preview
   - Bot comments preview URL in PR

**Total Time**: ~5 minutes for full pipeline ⚡

## ✅ Ready to Merge When:

- ✅ All tests passing (118/118)
- ✅ Security scan passed
- ✅ Build successful
- ✅ Code review approved
- ✅ Branch up to date

## 🚀 What Happens on Merge

After merging to `main`:

1. **Full Test Suite** runs again
2. **Production Build** created
3. **Deploy to Production** (Vercel)
4. **Health Check** verifies deployment
5. **Notification** sent (if configured)

**Total Time**: ~5 minutes to production 🎉

## 🐳 Docker Image Builds

When code is merged to `main`, Docker images are automatically built and pushed to Docker Hub:

1. **Backend Image**
   - Built from `backend/Dockerfile`
   - Tagged as `brandontech/zyeute-backend:latest`
   - Also tagged with commit SHA: `brandontech/zyeute-backend:main-<sha>`

2. **Colony Worker Image**
   - Built from `infrastructure/colony/Dockerfile`
   - Tagged as `brandontech/zyeute-colony-worker:latest`
   - Also tagged with commit SHA: `brandontech/zyeute-colony-worker:main-<sha>`

**Manual Trigger**: You can also manually trigger the Docker build workflow from the GitHub Actions tab.

**Build Time**: ~3-5 minutes for both images 🐳

## 🔐 One-Time Setup (5 min)

### Required Secrets

Add these in: [GitHub Settings → Secrets](https://github.com/brandonlacoste9-tech/zyeute-v3/settings/secrets/actions)

```
VERCEL_TOKEN          # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         # In Vercel project settings
VERCEL_PROJECT_ID     # In Vercel project settings
```

### Docker Hub Secrets (for Docker image builds)

```
DOCKERHUB_USERNAME    # Your Docker Hub username
DOCKERHUB_TOKEN       # Get from https://hub.docker.com/settings/security (Access Token)
```

### Optional Secrets

```
CODECOV_TOKEN         # For test coverage reports
SLACK_WEBHOOK_URL     # For deployment notifications
```

### Docker Hub (Zyeute images)

To build and push images to Docker Hub as **brandontech** (workflow: `Docker Build & Push`):

```
<<<<<<< copilot/docker-login-implementation
DOCKERHUB_USERNAME    # Your Docker Hub username (brandontech)
DOCKERHUB_TOKEN       # Docker Hub Personal Access Token (PAT)
```

**Get Docker Hub PAT**: [Docker Hub → Account → Security → Access Tokens](https://hub.docker.com/settings/security)

**Images built**:

- `brandontech/zyeute-backend:latest` (and tagged with SHA)
- `brandontech/zyeute-colony-worker:latest` (and tagged with SHA)

**Workflow triggers**:

- Automatic: When pushing to `main` and changes are made to `backend/`, `colony.dockerfile`, or root `package.json`/`package-lock.json`
- # Manual: Go to Actions → Docker Build & Push → Run workflow
  DOCKERHUB_USERNAME # e.g. brandontech
  DOCKERHUB_TOKEN # Docker Hub PAT (Settings → Security → Access Tokens)

```

Images: `brandontech/zyeute-backend`, `brandontech/zyeute-colony-worker`. Triggered on push to `main` when backend/ or Dockerfiles change, or via **Actions → Docker Build & Push → Run workflow**.
>>>>>>> main

## 📊 Test Suite Overview

```

118 Total Tests (100% passing)
├── 58 Unit Tests
│ ├── 11 Authentication tests
│ ├── 29 Validation tests
│ └── 18 Utility tests
├── 11 Integration Tests
│ └── Login flow & API tests
└── 49 Component Tests
├── 14 Button component
├── 12 Password management
├── 5 Guest mode hook
└── 18 TiGuy agent

````

## 🔄 Typical Workflow

```bash
# 1. Create feature branch
git checkout -b feature/awesome-feature

# 2. Make changes and test locally
npm test

# 3. Commit and push
git add .
git commit -m "feat: add awesome feature"
git push origin feature/awesome-feature

# 4. Create PR on GitHub
# → Workflows run automatically
# → Review staging preview
# → Get code review

# 5. Merge when ready
# → Production deployment happens automatically
# → Done! 🎉
````

## 🐛 Quick Troubleshooting

### Tests Failing?

```bash
# Clear and reinstall
rm -rf node_modules package-lock.json
npm install

# Run specific test
npm test -- src/__tests__/unit/auth.test.ts

# Check for TypeScript errors
npm run check
```

### Workflow Failing?

1. Check workflow logs in GitHub Actions tab
2. Look for red X next to workflow name
3. Click to see detailed error messages
4. Common fixes:
   - Update dependencies: `npm install`
   - Fix TypeScript errors: `npm run check`
   - Ensure tests pass locally: `npm test`

### Deployment Failing?

1. Verify secrets are configured
2. Check Vercel dashboard
3. Review deployment logs in workflow
4. Ensure build succeeds locally: `npm run build`

### Docker Build Failing?

1. **Check Docker Hub credentials**:
   - Verify `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets are set
   - Ensure token has write permissions
   - Get new token from: https://hub.docker.com/settings/security

2. **Test Docker builds locally**:

   ```bash
   # Test backend build
   docker build -f backend/Dockerfile -t test-backend .

   # Test colony worker build
   docker build -f infrastructure/colony/Dockerfile -t test-colony infrastructure/colony
   ```

3. **Common Docker issues**:
   - Build context errors: Ensure Dockerfiles have correct paths
   - Missing dependencies: Check if all required files are in context
   - Cache issues: Workflow uses GitHub Actions cache, which auto-clears

4. **View workflow logs**:
   - Go to Actions tab → "Docker Build and Push" workflow
   - Click on failed run to see detailed build logs
   - Check each step for specific error messages

## 📚 Full Documentation

- **[CI_CD_SETUP.md](../CI_CD_SETUP.md)** - Complete setup guide
- **[CI_CD_IMPLEMENTATION_SUMMARY.md](../CI_CD_IMPLEMENTATION_SUMMARY.md)** - Full details
- **[README.md](../README.md)** - Project overview

## 🎓 Best Practices

### Before Creating PR

- ✅ Run tests locally: `npm test`
- ✅ Check TypeScript: `npm run check`
- ✅ Review your changes: `git diff`
- ✅ Write clear commit messages

### During PR Review

- ✅ Check workflow status
- ✅ Test staging preview
- ✅ Respond to feedback
- ✅ Keep branch updated

### After Merge

- ✅ Monitor production deployment
- ✅ Verify health check passes
- ✅ Delete feature branch
- ✅ Celebrate! 🎉

## 🔔 Workflow Status Indicators

In your PR, you'll see:

- ✅ **Green check** = All workflows passed
- ⏳ **Yellow circle** = Workflows running
- ❌ **Red X** = Workflow failed (click for details)
- ⚪ **Gray circle** = Workflow waiting/skipped

## 💡 Pro Tips

1. **Run tests in watch mode** while developing:

   ```bash
   npm run test:watch
   ```

2. **Use test UI** for debugging:

   ```bash
   npm run test:ui
   ```

3. **Check coverage** to find untested code:

   ```bash
   npm run test:coverage
   ```

4. **Test specific files**:

   ```bash
   npm test -- auth.test.ts
   ```

5. **Clear test cache** if seeing weird behavior:

   ```bash
   npm test -- --clearCache
   ```

6. **Manually trigger Docker builds**:
   - Go to Actions tab → "Docker Build and Push"
   - Click "Run workflow" button
   - Select branch (usually `main`)
   - Click "Run workflow" to start

## 🎯 Quick Reference

| Action            | Command                    |
| ----------------- | -------------------------- |
| All tests         | `npm test`                 |
| Unit tests        | `npm run test:unit`        |
| Integration tests | `npm run test:integration` |
| Watch mode        | `npm run test:watch`       |
| Coverage          | `npm run test:coverage`    |
| Type check        | `npm run check`            |
| Build             | `npm run build`            |
| Dev server        | `npm run dev`              |

## 🆘 Need Help?

1. Check the full docs: [CI_CD_SETUP.md](../CI_CD_SETUP.md)
2. Review workflow logs in GitHub Actions
3. Ask in team chat
4. Create an issue with logs attached

---

**Updated**: December 2025  
**Team**: Zyeuté Development  
**Status**: ✅ Production Ready

🎭⚜️ **Zyeuté - L'app sociale du Québec**
