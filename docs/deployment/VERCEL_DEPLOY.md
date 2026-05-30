# 🌐 Vercel Deployment Guide

## Quick Deploy (3 Steps)

### Step 1: Build Frontend

```bash
npm run build:vercel
```

### Step 2: Deploy to Vercel

```bash
# Install Vercel CLI if needed
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Step 3: Set Environment Variables

In Vercel Dashboard → Project Settings → Environment Variables:

```
VITE_SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
```

---

## 🔗 Connect to Railway Backend

Your `vercel.json` is already configured to proxy API calls to Railway:

```json
{
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://zyeutev5-production.up.railway.app/api/$1"
    },
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

**Update the Railway URL** in `vercel.json` if your Railway URL changed:

- Go to Railway dashboard
- Copy your backend URL
- Update in vercel.json

---

## 🖥️ One-Command Deploy

```bash
./vercel-deploy.sh
```

Or manually:

```bash
npm run build:vercel && vercel --prod
```

---

## ✅ Post-Deploy Checklist

- [ ] Frontend deployed to Vercel
- [ ] Environment variables set
- [ ] API proxy working (check `/api/health`)
- [ ] Videos loading from feed
- [ ] No console errors

---

## 🔧 Troubleshooting

### "Cannot find module"

Run: `npm install` then rebuild

### API calls failing

Check that `vercel.json` has the correct Railway backend URL

### Blank page

Check browser console for errors. Likely missing env variables.

### CORS errors

Ensure Railway backend has CORS configured for your Vercel domain
