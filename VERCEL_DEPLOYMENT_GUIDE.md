# Vercel Deployment Guide

## Overview

This guide details the deployment configuration and requirements for ZyeuteV5 on Vercel.

## Deployment Configuration

### Build Settings

- **Install Command**: `npm ci --include=dev` (uses lockfile for reproducibility)
- **Build Command**: `npm run build:vercel`
- **Output Directory**: `dist/public`
- **Node Version**: 20.x (defined in `.nvmrc` or package.json engines)

### Regions

- **Primary Region**: `iad1` (US East, Washington D.C.)
- **Rationale**: Optimal latency for US-based users and Supabase US East deployment

### Serverless Functions

- **API Route**: `/api/index.ts`
- **Max Duration**: 30 seconds
- **Memory**: 1024 MB

## Environment Variables

### Required for All Environments

```bash
# Database
DATABASE_URL="postgresql://..."
DIRECT_URL="postgresql://..."

# Supabase
VITE_SUPABASE_URL="https://..."
VITE_SUPABASE_ANON_KEY="..."
SUPABASE_SERVICE_KEY="..."

# Application
VITE_API_URL="your-vercel-url.vercel.app"
NODE_ENV="production"
```

### Preview vs Production

**Preview Deployments:**

- Use preview-specific Supabase project or branch
- Set `VITE_API_URL` to preview deployment URL
- Enable debug logging if needed: `VITE_DEBUG=true`

**Production Deployments:**

- Use production Supabase project
- Set `VITE_API_URL` to production domain
- Ensure all secrets are rotated and secure

### Verification Checklist

- [ ] All required environment variables are set in Vercel dashboard
- [ ] Preview and Production have separate database connections
- [ ] No secrets are committed to git
- [ ] Environment variables match `.env.example` structure
- [ ] Service keys have appropriate permissions

## Build Optimization

### Caching Strategy

1. **Static Assets**: 1 year cache with immutable flag
2. **API Routes**: No cache (dynamic content)
3. **HTML**: No cache (for SPA routing)

### Performance Tips

1. Use `npm ci` instead of `npm install` for faster, reproducible builds
2. Enable Vercel's build cache (automatic)
3. Minimize bundle size with tree-shaking and code splitting
4. Use dynamic imports for large components

## Preview Deployments

### Automatic Preview Deployments

- Every PR automatically gets a unique preview URL
- Preview deployments include all PR changes
- Environment variables can be scoped to preview/production

### Testing Preview Deployments

```bash
# Get preview URL from GitHub PR checks
# Test the preview deployment
curl https://zyeutev5-<pr-branch>-<team>.vercel.app/api/health

# Check build logs in Vercel dashboard
```

## Troubleshooting

### Build Failures

1. Check Vercel build logs for errors
2. Verify all environment variables are set
3. Test build locally: `npm run build:vercel`
4. Check for missing dependencies in `package.json`

### Runtime Errors

1. Check Vercel function logs
2. Verify database connectivity
3. Check environment variable values (not just presence)
4. Test API routes with curl or Postman

### Common Issues

**Issue**: Build succeeds but site doesn't load

- **Solution**: Check CSP headers and allowed domains

**Issue**: API routes return 500

- **Solution**: Check function logs, verify DATABASE_URL

**Issue**: Slow cold starts

- **Solution**: Increase function memory, optimize bundle size

## Security Checklist

- [ ] CSP headers configured properly
- [ ] No secrets in client-side code
- [ ] Rate limiting configured
- [ ] CORS properly configured
- [ ] Input validation on all API routes

## Monitoring

### Key Metrics

1. **Build Time**: Target < 2 minutes
2. **Function Duration**: Target < 1 second (p95)
3. **Error Rate**: Target < 0.1%
4. **Cache Hit Rate**: Target > 80%

### Alerts

Set up alerts in Vercel for:

- Build failures
- High error rates
- Slow function execution
- High bandwidth usage

## Rollback Procedure

If a deployment causes issues:

1. Go to Vercel dashboard
2. Find previous successful deployment
3. Click "Promote to Production"
4. Verify rollback successful

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Next Steps](./DEPLOYMENT_GUIDE.md)
- [Environment Variables](./VERCEL_ENV_REQUIRED.md)

---

Last Updated: 2025-12-28
Maintainer: @brandonlacoste9-tech
