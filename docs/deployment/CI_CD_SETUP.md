# 🚀 CI/CD Setup Guide

This document describes the Continuous Integration and Continuous Deployment (CI/CD) setup for Zyeuté.

## 📋 Workflows Overview

| Workflow                | Trigger                 | Purpose                    |
| ----------------------- | ----------------------- | -------------------------- |
| `ci.yml`                | Push/PR to main/develop | Run tests, lint, and build |
| `security.yml`          | Weekly + PR/push        | Security scans with CodeQL |
| `deploy-staging.yml`    | PR to main              | Deploy preview to Vercel   |
| `deploy-production.yml` | Push to main            | Deploy to Vercel + Railway |

---

## 🔐 Required Secrets

Go to **GitHub Repo Settings → Secrets and variables → Actions** and add:

### Vercel Deployment

```
VERCEL_TOKEN          # Get from https://vercel.com/account/tokens
VERCEL_ORG_ID         # From vercel.json or Vercel dashboard
VERCEL_PROJECT_ID     # From Vercel dashboard
```

### Railway Deployment

```
RAILWAY_TOKEN         # Get from https://railway.app/account/tokens
```

---

## 🧪 CI Workflow (ci.yml)

**Runs on:** Every push/PR to main or develop

**Steps:**

1. Checkout code
2. Setup Node.js 20
3. Install dependencies (`npm ci`)
4. TypeScript check (`npm run check`)
5. ESLint (`npm run lint`)
6. Run tests (`npm test`)
7. Build application
8. Upload build artifacts

**Status checks:** Non-blocking for now (continue-on-error)

---

## 🔒 Security Workflow (security.yml)

**Runs on:**

- Every push/PR to main
- Weekly (Sundays at midnight UTC)

**Scans:**

1. npm audit
2. CodeQL analysis
3. Known vulnerability database

---

## 🧪 Staging Deployment (deploy-staging.yml)

**Runs on:** Every PR to main

**Features:**

- Deploys to Vercel Preview
- Posts preview URL as PR comment
- Auto-updates on new commits

**URL:** `https://zyeute-git-<branch>-brandonlacoste9-tech.vercel.app`

---

## 🚀 Production Deployment (deploy-production.yml)

**Runs on:** Every push to main

**Deploys:**

1. Frontend → Vercel (Production)
2. Backend → Railway
3. Health check after deployment

**URLs:**

- Frontend: `https://zyeute.com`
- Backend: `https://zyeute-backend.railway.app`

---

## 📝 Manual Deployment

If CI/CD fails, deploy manually:

### Frontend (Vercel)

```bash
npm run build:vercel
vercel --prod
```

### Backend (Railway)

```bash
railway login
railway up
```

---

## 🚨 Troubleshooting

### "VERCEL_TOKEN not found"

- Add the secret in GitHub repo settings
- Ensure token has access to the project

### "RAILWAY_TOKEN not found"

- Generate token at https://railway.app/account/tokens
- Add to GitHub secrets

### Build fails in CI but works locally

- Check Node.js version (should be 20)
- Ensure all dependencies are in package.json
- Clear node_modules and package-lock.json

### Deployment hangs

- Check Vercel/Railway dashboard for logs
- Verify secrets are correctly set
- Check if service is running in dashboard

---

## 🔗 Useful Links

- [GitHub Actions Docs](https://docs.github.com/en/actions)
- [Vercel CLI Docs](https://vercel.com/docs/cli)
- [Railway Docs](https://docs.railway.app/)
