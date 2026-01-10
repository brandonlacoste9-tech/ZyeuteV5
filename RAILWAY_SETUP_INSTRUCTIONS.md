# 🚂 Railway Setup Instructions

## Step 1: Authenticate with Railway

Railway CLI requires interactive authentication. You have two options:

### Option A: Interactive Login (Recommended)

Run this command in your terminal:
```powershell
railway login
```

This will open your browser for authentication. After successful login, proceed to Step 2.

### Option B: Manual Token Setup

1. Create the Railway config directory:
   ```powershell
   New-Item -ItemType Directory -Force -Path "$env:USERPROFILE\.railway"
   ```

2. Create config file with your token:
   ```powershell
   @"
   {
     "token": "21cf53ed-f9b0-4cb5-8eb3-a1b2e306530c"
   }
   "@ | Out-File -FilePath "$env:USERPROFILE\.railway\config.json" -Encoding utf8
   ```

3. Verify authentication:
   ```powershell
   railway whoami
   ```

---

## Step 2: Run Deployment Script

After authentication, run:
```powershell
.\deploy-railway.ps1
```

This script will:
- ✅ Verify Railway CLI is installed
- ✅ Check authentication
- ✅ Link/create Railway project
- ✅ Add PostgreSQL database
- ✅ Set core environment variables

---

## Step 3: Set Required API Keys

After the script completes, set your API keys:

```powershell
railway variables set DEEPSEEK_API_KEY="your-deepseek-key"
railway variables set FAL_KEY="your-fal-key"
railway variables set JWT_SECRET="your-jwt-secret"
railway variables set QUEEN_HMAC_SECRET="your-hmac-secret"
railway variables set COLONY_NECTAR="your-encryption-key"
```

**Generate secrets:**
```powershell
# Generate random secrets
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Minimum 0 -Maximum 256 }))
```

---

## Step 4: Deploy

```powershell
railway up
```

Or push to GitHub if Railway is connected to your repo (auto-deploys).

---

## Step 5: Get Your URL

```powershell
railway domain
```

This will show your live Railway URL (e.g., `https://zyeute-api.railway.app`).

---

## Quick Reference

**Check status:**
```powershell
railway status
```

**View logs:**
```powershell
railway logs
```

**Open dashboard:**
```powershell
railway open
```

**List all variables:**
```powershell
railway variables
```

---

## Troubleshooting

**"Unauthorized" error:**
- Run `railway login` again
- Check if token is set correctly in config file

**"Project not found":**
- Run `railway link` to link to existing project
- Or `railway init` to create new project

**Build fails:**
- Check Railway logs: `railway logs`
- Verify all environment variables are set
- Ensure `npm run build` works locally

---

**Your Railway Token:** `21cf53ed-f9b0-4cb5-8eb3-a1b2e306530c`

⚠️ **Security:** Never commit this token to git. It's already in `.gitignore`.
