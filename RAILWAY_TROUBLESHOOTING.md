# 🚨 Railway Deployment Troubleshooting

**Issue:** Zyeuté not deploying on Railway

---

## 🔍 Common Issues & Solutions

### **Issue 1: Wrong Root Directory**

**Problem:** Railway might be deploying from wrong directory or wrong service.

**Check:**
1. Go to Railway Dashboard → Your Project → Settings
2. Check **"Root Directory"** - should be `.` (root) or left blank
3. Verify Railway is deploying the Node.js service, not Python Colony OS

**Solution:**
- Railway Dashboard → Service Settings → Root Directory → Set to `.` (root)
- Or: Create separate Railway services:
  - Service 1: Zyeuté (Node.js) - Root: `.`
  - Service 2: Colony OS (Python) - Root: `infrastructure/colony`

---

### **Issue 2: Build Script Path Wrong**

**Problem:** `railway.json` references `scripts/railway-build.sh` but scripts are in `zyeute/scripts/`

**Current railway.json:**
```json
"buildCommand": "bash scripts/railway-build.sh"
"startCommand": "bash scripts/railway-startup.sh"
```

**But scripts are in:** `zyeute/scripts/`

**Solution:** Fix railway.json paths OR copy scripts to root

**Option A: Update railway.json (Recommended)**
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bash zyeute/scripts/railway-build.sh"
  },
  "deploy": {
    "startCommand": "bash zyeute/scripts/railway-startup.sh"
  }
}
```

**Option B: Copy scripts to root**
```bash
cp zyeute/scripts/railway-build.sh scripts/
cp zyeute/scripts/railway-startup.sh scripts/
```

---

### **Issue 3: Build Fails - Missing Dependencies**

**Problem:** Build fails because scripts can't find dependencies.

**Check Railway logs:**
- Railway Dashboard → Deployments → Latest Deployment → Logs
- Look for errors like:
  - `npm: command not found`
  - `tsx: command not found`
  - `Module not found`

**Solution:**
1. Verify `package.json` is in root
2. Ensure all dependencies are in `package.json` (not just devDependencies)
3. Check Railway is using Node.js builder (not Python)

---

### **Issue 4: Database Migration Scripts Not Found**

**Problem:** `railway-startup.sh` references scripts that don't exist:
- `scripts/run-schema-migration.ts` (should be `zyeute/scripts/`)
- `scripts/create-publications-table.ts`
- etc.

**Solution:** Update paths in `railway-startup.sh`:
```bash
npx tsx zyeute/scripts/run-schema-migration.ts
npx tsx zyeute/scripts/create-publications-table.ts
# etc.
```

---

### **Issue 5: Wrong Service Deployed**

**Problem:** Railway might be deploying Colony OS (Python) instead of Zyeuté (Node.js).

**Check:**
1. Railway Dashboard → Services
2. Which service is active?
3. What language does it detect? (Should be Node.js, not Python)

**Solution:**
1. Delete or disable Colony OS service
2. Create new service for Zyeuté
3. Set root directory to `.` (root)
4. Railway should auto-detect Node.js

---

### **Issue 6: Health Check Failing**

**Problem:** Railway health check at `/api/health` is failing.

**Check:**
1. Railway Dashboard → Service → Health Check
2. What's the health check path? (Should be `/api/health`)
3. What port is it checking? (Should be `8080` or `$PORT`)

**Solution:**
- Verify `railway.json` has: `"healthcheckPath": "/api/health"`
- Verify backend listens on `$PORT` or `8080`
- Check health endpoint works locally: `npm run start` then `curl http://localhost:5000/api/health`

---

### **Issue 7: GitHub Not Connected**

**Problem:** Railway isn't connected to GitHub, so it's not auto-deploying.

**Check:**
1. Railway Dashboard → Project → Settings → GitHub
2. Is a repository connected?
3. Is it the correct repository?

**Solution:**
1. Connect GitHub repository
2. Select correct branch (`main` or `master`)
3. Railway will auto-deploy on push

---

## 🔧 Quick Fixes

### **Fix 1: Update railway.json Script Paths**

Update `railway.json` to use correct paths:
```json
{
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "bash zyeute/scripts/railway-build.sh"
  },
  "deploy": {
    "startCommand": "bash zyeute/scripts/railway-startup.sh",
    "healthcheckPath": "/api/health"
  }
}
```

### **Fix 2: Update railway-startup.sh Script Paths**

Update paths in `zyeute/scripts/railway-startup.sh`:
```bash
npx tsx zyeute/scripts/run-schema-migration.ts
npx tsx zyeute/scripts/create-publications-table.ts
npx tsx zyeute/scripts/create-test-user.ts
npx tsx zyeute/scripts/run-seed-migration.ts
```

### **Fix 3: Verify Railway Service Settings**

1. Go to Railway Dashboard → Project
2. Check which service is active
3. Verify:
   - Root Directory: `.` (or blank)
   - Build Command: `bash zyeute/scripts/railway-build.sh`
   - Start Command: `bash zyeute/scripts/railway-startup.sh`
   - Port: `$PORT` or `8080`

---

## 📋 Verification Checklist

- [ ] Railway project exists: `ad61359f-e003-47db-9feb-2434b9c266f5`
- [ ] Service is for Zyeuté (Node.js), not Colony OS (Python)
- [ ] Root directory is set correctly (`.` or blank)
- [ ] Build command path is correct (`zyeute/scripts/railway-build.sh`)
- [ ] Start command path is correct (`zyeute/scripts/railway-startup.sh`)
- [ ] GitHub repository is connected
- [ ] Environment variables are set (at least `PORT=8080`)
- [ ] PostgreSQL database is added (if using database)
- [ ] Health check path is `/api/health`

---

## 🚨 Most Likely Issues

1. **Wrong service deployed** - Railway deploying Colony OS (Python) instead of Zyeuté (Node.js)
2. **Wrong script paths** - `railway.json` references `scripts/` but scripts are in `zyeute/scripts/`
3. **GitHub not connected** - No auto-deployment triggered

---

## 🎯 Next Steps

1. **Check Railway Dashboard:**
   - Which service is active?
   - What are the build/start commands?
   - Are there any error logs?

2. **Fix railway.json paths** (if wrong)

3. **Fix railway-startup.sh paths** (if wrong)

4. **Redeploy:**
   - Push to GitHub (if connected)
   - Or: `railway up` (if using CLI)

---

**Share Railway dashboard screenshot or logs for specific help!**
