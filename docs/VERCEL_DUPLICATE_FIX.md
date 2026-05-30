# Vercel Duplicate Projects Fix 🔍

**Issue:** Two ZyeuteV5 builds in Vercel  
**Correct Repo:** `brandonlacoste9-tech/ZyeuteV5`

---

## How to Identify the Correct Project

### Step 1: Check Vercel Dashboard

**Go to:** https://vercel.com/dashboard

**For each ZyeuteV5 project, check:**

1. **Repository Connection:**
   - Settings → Git → Repository
   - ✅ **Correct:** `brandonlacoste9-tech/ZyeuteV5`
   - ❌ **Wrong:** Different repo, fork, or disconnected

2. **Recent Deployments:**
   - Deployments tab → Check latest deployment
   - ✅ **Correct:** Recent deployments matching your commits
   - ❌ **Wrong:** Old deployments or no activity

3. **Environment Variables:**
   - Settings → Environment Variables
   - ✅ **Correct:** Has `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, etc.
   - ❌ **Wrong:** Missing variables or old values

4. **Production URL:**
   - Settings → Domains
   - ✅ **Correct:** Active production URL that works
   - ❌ **Wrong:** Broken or old URL

---

## Quick Identification

**Correct Project Should Have:**

- ✅ Repository: `brandonlacoste9-tech/ZyeuteV5`
- ✅ Production Branch: `main`
- ✅ Recent deployments (last 24-48 hours if you've been pushing)
- ✅ Environment variables set correctly
- ✅ Production URL: `https://zyeute-v5.vercel.app` (or your custom domain)

**Incorrect Project Likely Has:**

- ❌ Different repository name
- ❌ No recent deployments
- ❌ Missing environment variables
- ❌ Old/broken production URL

---

## Action Plan

### Option 1: Archive the Wrong One

**If you want to keep both (for reference):**

1. Vercel Dashboard → Wrong project
2. Settings → General → Archive Project
3. This hides it but keeps history

### Option 2: Delete the Wrong One

**If you're sure it's wrong:**

1. Vercel Dashboard → Wrong project
2. Settings → General → Delete Project
3. Confirm deletion

### Option 3: Rename for Clarity

**If both might be needed:**

1. Rename one: `ZyeuteV5-Production`
2. Rename other: `ZyeuteV5-Staging` or `ZyeuteV5-Old`
3. Keep the correct one as `ZyeuteV5`

---

## Verification Checklist

**Before deleting/archiving, verify:**

- [ ] Checked repository connection (must be `brandonlacoste9-tech/ZyeuteV5`)
- [ ] Checked recent deployment activity
- [ ] Checked environment variables are set
- [ ] Tested production URL works
- [ ] Confirmed GitHub Actions are using correct `VERCEL_PROJECT_ID`

---

## GitHub Actions Integration

**Your workflows use:**

- `VERCEL_PROJECT_ID` secret
- `VERCEL_ORG_ID` secret

**Make sure these point to the CORRECT project:**

1. GitHub → Settings → Secrets and variables → Actions
2. Verify `VERCEL_PROJECT_ID` matches the correct Vercel project
3. If wrong, update the secret

---

## Quick Test

**To quickly identify which is correct:**

1. **Make a small commit** to `main` branch
2. **Push to GitHub**
3. **Check Vercel Dashboard**
4. **Which project shows new deployment?** → That's the correct one!

---

**Check Vercel Dashboard and compare the two projects - the one connected to `brandonlacoste9-tech/ZyeuteV5` with recent deployments is the correct one!** 🔍
