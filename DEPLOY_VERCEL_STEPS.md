# ▲ Deploy Zyeuté Frontend to Vercel - Step by Step

**Status:** ✅ Railway backend is live  
**Next:** Deploy frontend to Vercel

---

## 🔍 Step 1: Get Your Railway URL

1. **Go to Railway Dashboard:**
   - Visit: https://railway.app
   - Login to your account

2. **Open Your Project:**
   - Click on: **Colony OS** (or your project name)
   - Project ID: `ad61359f-e003-47db-9feb-2434b9c266f5`

3. **Find Your Service:**
   - Click on your **Node.js service** (the one that's running)

4. **Get Domain:**
   - Go to **Settings** tab
   - Scroll to **Domains** section
   - Copy the domain shown (e.g., `production.up.railway.app`)

5. **Test It:**
   - Open: `https://YOUR-RAILWAY-URL.railway.app/api/health`
   - Should see: `{"status":"healthy"}`

**📝 Write down your Railway URL: _______________________**

---

## ⚙️ Step 2: Update vercel.json (I'll do this for you)

Once you share your Railway URL, I'll update `vercel.json` with the correct URL.

**Or update manually:**
- Open `vercel.json`
- Replace `zyeute-api.railway.app` with your actual Railway URL

---

## 🚀 Step 3: Deploy to Vercel

### **Option A: GitHub Integration (Recommended - 2 minutes)**

1. **Push Code to GitHub:**
   ```bash
   git add vercel.json
   git commit -m "Update vercel.json with Railway URL"
   git push origin main
   ```

2. **Go to Vercel:**
   - Visit: https://vercel.com
   - Click **"Add New Project"** or **"Import Project"**

3. **Import Repository:**
   - Select **"Import Git Repository"**
   - Choose your Zyeuté repository
   - Click **"Import"**

4. **Configure Project:**
   - **Project Name:** `zyeute` (or your choice)
   - **Root Directory:** `.` (leave blank - deploy from root)
   - **Framework Preset:** Vite (should auto-detect)
   - **Build Command:** `npm run build:vercel` or `vite build`
   - **Output Directory:** `dist/public`
   - **Install Command:** `npm install`

5. **Set Environment Variables:**
   Click **"Environment Variables"** and add:
   ```
   VITE_SUPABASE_URL=your-supabase-url
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_HIVE_AUTO_DETECT=true
   VITE_API_URL=https://YOUR-RAILWAY-URL.railway.app
   ```
   (Replace `YOUR-RAILWAY-URL` with your actual Railway URL)

6. **Deploy:**
   - Click **"Deploy"**
   - Wait 2-3 minutes
   - ✅ Done!

---

### **Option B: Vercel CLI (5 minutes)**

1. **Install Vercel CLI:**
   ```bash
   npm i -g vercel
   ```

2. **Login:**
   ```bash
   vercel login
   ```
   (Opens browser to login)

3. **Deploy:**
   ```bash
   vercel --prod
   ```

4. **Follow Prompts:**
   - Link to existing project? **No** (first time)
   - Project name? **zyeute**
   - Directory? **.** (current directory)
   - Override settings? **No** (use vercel.json)

5. **Set Environment Variables:**
   - Go to Vercel Dashboard → Project → Settings → Environment Variables
   - Add all required variables (see above)

6. **Redeploy:**
   ```bash
   vercel --prod
   ```

---

## ✅ Step 4: Verify Deployment

1. **Check Vercel URL:**
   - Vercel Dashboard → Your Project → Domains
   - Should show: `zyeute.vercel.app` or `zyeute-<random>.vercel.app`

2. **Test Frontend:**
   - Visit: `https://your-app.vercel.app`
   - Should load the Zyeuté frontend

3. **Test API Proxy:**
   - Visit: `https://your-app.vercel.app/api/health`
   - Should proxy to Railway backend and show: `{"status":"healthy"}`

4. **Check Browser Console:**
   - Open DevTools (F12) → Console
   - Should see no errors
   - Network tab should show successful API requests

---

## 🐛 Troubleshooting

### **Build Fails**

**Check:**
- Vercel logs in dashboard
- Build command: Should be `npm run build:vercel` or `vite build`
- Output directory: Should be `dist/public`
- Test locally: `npm run build:vercel` should work

**Common Issues:**
- Missing dependencies → Check `package.json`
- Wrong output directory → Check `vite.config.ts` (should be `dist/public`)
- Build errors → Check Vercel build logs

### **API Requests Fail**

**Check:**
- Railway URL in `vercel.json` is correct
- Railway backend is accessible: `curl https://YOUR-RAILWAY-URL.railway.app/api/health`
- CORS settings in Railway backend allow Vercel domain

### **404 on Routes**

**Check:**
- `vercel.json` has catch-all rewrite:
  ```json
  {
    "source": "/(.*)",
    "destination": "/index.html"
  }
  ```

---

## 📋 Quick Checklist

- [ ] Railway backend is live
- [ ] Railway URL is known
- [ ] `vercel.json` updated with Railway URL
- [ ] Code pushed to GitHub
- [ ] Vercel project created
- [ ] Environment variables set
- [ ] Deployment successful
- [ ] Frontend loads at Vercel URL
- [ ] API proxy works

---

## 🎯 Next Steps After Deployment

1. **Set Custom Domain (Optional):**
   - Vercel Dashboard → Settings → Domains
   - Add your custom domain

2. **Enable Analytics:**
   - Vercel Dashboard → Analytics
   - Enable Web Analytics

3. **Test All Features:**
   - User registration/login
   - API calls
   - File uploads
   - AI features

---

**🚀 Ready to deploy! Use GitHub integration (Option A) for the fastest setup.**

**Share your Railway URL and I'll update vercel.json for you!**
