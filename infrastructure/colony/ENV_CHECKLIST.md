# 🔐 Colony OS - Environment Variables Checklist

**Status:** Ready for Railway Deployment  
**Last Updated:** January 9, 2026

---

## ✅ Required Environment Variables

### Stripe Configuration
- `STRIPE_SECRET_KEY` - Your Stripe secret key (starts with `sk_live_` or `sk_test_`)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (starts with `whsec_`)
- `STRIPE_PUBLISHABLE_KEY` - Optional, for client-side (starts with `pk_live_` or `pk_test_`)

### Supabase Configuration
- `VITE_SUPABASE_URL` - Your Supabase project URL (e.g., `https://xxxxx.supabase.co`)
- `SUPABASE_SERVICE_KEY` - Supabase service role key (for backend operations)
- `VITE_SUPABASE_ANON_KEY` - Optional, Supabase anonymous key

### Colony Settings
- `COLONY_ENV` - Environment: `production` or `development` (default: `development`)
- `COLONY_LOG_LEVEL` - Logging level: `DEBUG`, `INFO`, `WARNING`, `ERROR` (default: `INFO`)
- `NEUROSPHERE_PORT` - Port for Neurosphere kernel (default: `8000`)
- `FINANCE_BEE_PORT` - Port for Finance Bee (default: `8001`)
- `GUARDIAN_BEE_PORT` - Port for Guardian Bee (default: `8002`)
- `GUARDIAN_SCAN_INTERVAL` - Security scan interval in seconds (default: `60`)

### Optional - AI Services
- `GEMINI_API_KEY` - Google Gemini API key (for AI features)
- `DEEPSEEK_API_KEY` - DeepSeek API key (for AI features)

### Optional - Monitoring
- `HEALTH_CHECK_INTERVAL` - Health check interval in seconds (default: `60`)
- `ALERT_WEBHOOK_URL` - Webhook URL for alerts

---

## 📝 Railway Configuration

When deploying to Railway, set these variables in the Railway dashboard:

### Minimum Required (for basic operation):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
COLONY_ENV=production
```

### Recommended (for full functionality):
```
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your_service_role_key_here
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
COLONY_ENV=production
NEUROSPHERE_PORT=8000
FINANCE_BEE_PORT=8001
GUARDIAN_BEE_PORT=8002
COLONY_LOG_LEVEL=INFO
```

---

## 🔍 Verification

After setting environment variables, verify with:

```bash
# Check if variables are loaded
python3 -c "import os; from dotenv import load_dotenv; load_dotenv('../../.env'); print('SUPABASE_URL:', os.getenv('VITE_SUPABASE_URL') is not None); print('STRIPE_KEY:', os.getenv('STRIPE_SECRET_KEY') is not None)"
```

---

## ⚠️ Security Notes

- **Never commit `.env` to git** (it's in `.gitignore`)
- Use Railway's environment variables for production
- Use root `.env` file for local development
- Service role keys have full database access - keep them secret!

---

## 📚 File Locations

- **Template:** `.env.example` (in project root)
- **Local Config:** `.env` (in project root, create from .env.example)
- **Railway:** Set in Railway dashboard → Project → Variables

---

**Ready to configure!** 🔐
