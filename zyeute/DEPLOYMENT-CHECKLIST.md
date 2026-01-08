# Production Deployment Checklist

## ✅ Pre-Deployment Verification

### 1. Environment Variables

Ensure all required environment variables are set in your production environment:

#### Vertex AI (Gemini)
```bash
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_REGION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json
# OR
GOOGLE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}'
```

#### DeepSeek R1
```bash
DEEPSEEK_API_KEY=your-deepseek-api-key
```

#### Microsoft Copilot (Azure OpenAI)
```bash
AZURE_OPENAI_API_KEY=your-azure-key
AZURE_OPENAI_ENDPOINT=https://your-resource.openai.azure.com
AZURE_OPENAI_DEPLOYMENT=gpt-4  # Optional
```

#### Colony OS (Optional)
```bash
COLONY_OS_URL=http://your-colony-os-instance:10000
COLONY_API_KEY=your-colony-api-key
```

### 2. Service Account Setup

#### Google Cloud Vertex AI
1. ✅ Service account created: `vertex-express@gen-lang-client-0092649281.iam.gserviceaccount.com`
2. ✅ Service account has "Vertex AI User" role
3. ✅ Vertex AI API enabled: https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
4. ✅ JSON key downloaded and stored securely
5. ✅ Key path set in `GOOGLE_APPLICATION_CREDENTIALS` or JSON in `GOOGLE_SERVICE_ACCOUNT_JSON`

#### Verify Setup
```bash
npm run test:vertex
```

### 3. API Keys Verification

Test all providers:
```bash
# Test Vertex AI
npm run test:vertex

# Test Circuit Breaker
npm run test:circuit-breaker

# Test Multi-Model Router
npm run test:multi-model
```

### 4. Build Verification

```bash
# Type check
npm run check

# Lint
npm run lint

# Build
npm run build

# Test
npm run test
```

## 🚀 Deployment Steps

### Vercel Deployment

1. **Set Environment Variables**
   - Go to Vercel Dashboard → Your Project → Settings → Environment Variables
   - Add all required variables from section 1 above
   - **Important**: For `GOOGLE_APPLICATION_CREDENTIALS`, use the file path OR use `GOOGLE_SERVICE_ACCOUNT_JSON` with the full JSON as a string

2. **Build Configuration**
   - Ensure `vercel.json` or `package.json` has correct build command
   - Backend: `npm run build`
   - Frontend: `vite build`

3. **Deploy**
   ```bash
   vercel --prod
   ```

### Railway Deployment

1. **Set Environment Variables**
   - Railway Dashboard → Your Project → Variables
   - Add all required variables

2. **Deploy**
   - Push to main branch (auto-deploys)
   - Or manually: `railway up`

### Docker Deployment

1. **Build Image**
   ```bash
   docker build -t zyeute-backend .
   ```

2. **Run with Environment**
   ```bash
   docker run -d \
     -p 5000:5000 \
     -e GOOGLE_CLOUD_PROJECT=your-project \
     -e DEEPSEEK_API_KEY=your-key \
     -e GOOGLE_APPLICATION_CREDENTIALS=/app/keys/vertex-key.json \
     -v /path/to/key.json:/app/keys/vertex-key.json \
     zyeute-backend
   ```

## 🔍 Post-Deployment Verification

### 1. Health Check
```bash
curl https://your-domain.com/api/health
```

### 2. AI Services Check
```bash
# Check Colony OS status
curl https://your-domain.com/api/colony/status

# Test TI-Guy endpoint
curl -X POST https://your-domain.com/api/ai/tiguy-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"message": "Test message"}'
```

### 3. Monitor Logs

Watch for:
- ✅ Circuit Breaker interventions (should be rare)
- ✅ AI provider failures (should auto-failover)
- ✅ Colony OS connection status
- ✅ Error rates (should be < 1%)

### 4. Admin Dashboard

Access admin dashboard:
```
https://your-domain.com/admin/ai-dashboard
```

Check:
- ✅ All providers showing metrics
- ✅ Circuit Breaker events (if any)
- ✅ Cost tracking
- ✅ Performance metrics

## 🛡️ Security Checklist

- [ ] Service account keys stored securely (not in git)
- [ ] API keys rotated regularly
- [ ] Environment variables encrypted in production
- [ ] Rate limiting enabled on AI endpoints
- [ ] Authentication required for admin endpoints
- [ ] CORS configured correctly
- [ ] Error messages don't leak sensitive info

## 📊 Monitoring Setup

### Sentry (Error Tracking)
- ✅ Sentry DSN configured
- ✅ Error tracking enabled
- ✅ Breadcrumbs for AI calls enabled

### Colony OS (Intelligence)
- ✅ Colony OS URL configured
- ✅ Synapse Bridge connected
- ✅ Events being published

### Custom Metrics
- ✅ AI usage tracked
- ✅ Circuit Breaker events logged
- ✅ Admin dashboard accessible

## 🧪 Testing in Production

### 1. Test Circuit Breaker
```bash
# Force a failure to test failover
# (You'd need to temporarily break Vertex AI connection)
```

### 2. Test Multi-Model Router
```bash
curl -X POST https://your-domain.com/api/ai/tiguy-chat \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "message": "Test multi-model",
    "mode": "content"
  }'
```

Check response metadata:
```json
{
  "response": "...",
  "metadata": {
    "intendedModel": "gemini-1.5-pro",
    "actualModel": "gemini-2.0-flash",
    "circuitBreakerIntervened": true
  }
}
```

## 🚨 Rollback Plan

If issues occur:

1. **Immediate**: Disable AI features via feature flag
2. **Quick Fix**: Revert to previous deployment
3. **Investigation**: Check logs and metrics dashboard

## 📝 Post-Deployment Tasks

- [ ] Monitor error rates for 24 hours
- [ ] Review Circuit Breaker interventions
- [ ] Check cost tracking accuracy
- [ ] Verify all 3 AI providers working
- [ ] Test failover scenarios
- [ ] Update documentation with production URLs

## 🎯 Success Criteria

Deployment is successful when:
- ✅ All health checks passing
- ✅ AI endpoints responding correctly
- ✅ Circuit Breaker working (tested)
- ✅ Multi-model router functional
- ✅ Admin dashboard showing metrics
- ✅ No critical errors in logs
- ✅ Cost tracking accurate

---

**Last Updated**: After Circuit Breaker + Multi-Model Router implementation
**Next Review**: After first production deployment
