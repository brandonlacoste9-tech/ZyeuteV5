# ▲ Deploy Zyeuté Frontend to Vercel

**Status:** Railway backend is live ✅  
**Next:** Deploy frontend to Vercel

---

## 🚀 Quick Deploy to Vercel

### **Method 1: GitHub Integration (Recommended)**

1. **Push code to GitHub:**
   ```bash
   git add .
   git commit -m "Ready for Vercel deployment"
   git push origin main
   ```

2. **Connect to Vercel:**
   - Go to [vercel.com](https://vercel.com)
   - Click **"Add New Project"**
   - Select **"Import Git Repository"**
   - Choose your Zyeuté repository
   - Click **"Import"**

3. **Configure Project Settings:**
   - **Project Name:** `zyeute` (or your choice)
   - **Root Directory:** `.` (root - leave blank)
   - **Framework Preset:** Vite (should auto-detect)
   - **Build Command:** `npm run build:vercel` (or `vite build`)
   - **Output Directory:** `dist/public` (based on vite.config.ts)
   - **Install Command:** `npm install`

4. **Set Environment Variables:**
   - Click **"Environment Variables"**
   - Add these variables:
     ```
     VITE_SUPABASE_URL=your-supabase-url
     VITE_SUPABASE_ANON_KEY=your-anon-key
     VITE_HIVE_AUTO_DETECT=true
     VITE_API_URL=https://YOUR-RAILWAY-URL.railway.app
     ```
   - Replace `YOUR-RAILWAY-URL` with your actual Railway URL

5. **Deploy:**
   - Click **"Deploy"**
   - Vercel will automatically build and deploy

---

### **Method 2: Vercel CLI**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel:**
   ```bash
   vercel login
   ```

3. **Deploy:**
   ```bash
   vercel --prod
   ```

   - Follow prompts to link your project
   - Vercel will detect settings from `vercel.json`

---

## 🔧 Configuration Checklist

### **1. Update vercel.json with Railway URL**

**Current vercel.json:**
```json
{
  "rewrites": [{
    "source": "/api/(.*)",
    "destination": "https://zyeute-api.railway.app/api/$1"
  }]
}
```

**Action:** Update `zyeute-api.railway.app` with your actual Railway URL

**To find your Railway URL:**
1. Go to Railway Dashboard → Your Project
2. Go to **Settings** → **Domains**
3. Copy the Railway domain (e.g., `production.up.railway.app` or custom domain)

**Updated vercel.json:**
```json
{
  "version": 2,
  "framework": "vite",
  "buildCommand": "npm run build:vercel",
  "outputDirectory": "dist/public",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "https://YOUR-ACTUAL-RAILWAY-URL.railway.app/api/$1"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "env": {
    "VITE_HIVE_AUTO_DETECT": "true"
  }
}
```

---

### **2. Verify Build Settings**

**In Vercel Dashboard → Settings → General:**

- **Build Command:** `npm run build:vercel` or `vite build`
- **Output Directory:** `dist/public`
- **Install Command:** `npm install`
- **Root Directory:** `.` (root)

---

### **3. Set Environment Variables**

**In Vercel Dashboard → Settings → Environment Variables:**

**Required:**
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
VITE_HIVE_AUTO_DETECT=true
```

**Optional (for API URL):**
```
VITE_API_URL=https://YOUR-RAILWAY-URL.railway.app
```

---

## 📋 Pre-Deployment Checklist

- [ ] Railway backend is live and accessible
- [ ] Railway URL is known (check Railway dashboard)
- [ ] `vercel.json` updated with correct Railway URL
- [ ] Environment variables ready (Supabase keys)
- [ ] Code pushed to GitHub
- [ ] Build works locally: `npm run build:vercel`

---

## ✅ Verify Deployment

After deployment:

1. **Check Vercel URL:**
   - Vercel Dashboard → Your Project → Domains
   - Should show: `zyeute.vercel.app` or custom domain

2. **Test Frontend:**
   - Visit: `https://your-app.vercel.app`
   - Should load the Zyeuté frontend

3. **Test API Proxy:**
   - Visit: `https://your-app.vercel.app/api/health`
   - Should proxy to Railway backend

4. **Check Browser Console:**
   - Open DevTools → Console
   - Should see no errors
   - Network tab should show API requests working

---

## 🐛 Troubleshooting

### **Build Fails**

**Error:** "Cannot find module" or "Path does not exist"

**Solution:**
- Check `vite.config.ts` root directory is `zyeute/frontend`
- Verify `package.json` has all dependencies
- Check output directory in Vercel settings matches `dist/public`

### **API Requests Fail**

**Error:** "Failed to fetch" or "Network error"

**Solution:**
- Verify Railway URL in `vercel.json` is correct
- Check Railway backend is accessible: `curl https://YOUR-RAILWAY-URL.railway.app/api/health`
- Check CORS settings in Railway backend

### **404 on Routes**

**Error:** Page not found on refresh or direct URL

**Solution:**
- Verify `vercel.json` has the catch-all rewrite:
  ```json
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
  ```

---

## 🎯 Next Steps After Deployment

1. **Set Custom Domain (Optional):**
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain

2. **Enable Analytics:**
   - Vercel Dashboard → Analytics
   - Enable Web Analytics

3. **Set Up Monitoring:**
   - Add error tracking (Sentry)
   - Monitor performance

4. **Test All Features:**
   - User registration/login
   - API calls
   - File uploads
   - AI features

---

**🚀 Ready to deploy! Use GitHub integration for the fastest setup.**

**Share your Railway URL and I'll update vercel.json for you!**
