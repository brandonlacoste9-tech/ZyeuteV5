# Railway Token Setup 🚂

**Token:** `b4f9d49a-f422-4fdf-a3ee-f2144dc088e1`

---

## Step 1: Add Token to `.env` (Local Development)

Add this line to your `.env` file:

```bash
RAILWAY_TOKEN=b4f9d49a-f422-4fdf-a3ee-f2144dc088e1
```

**⚠️ Security Note:** `.env` is gitignored, so this token won't be committed.

---

## Step 2: Install Railway CLI (if not installed)

```bash
npm install -g @railway/cli
```

**Verify installation:**

```bash
railway --version
```

---

## Step 3: Authenticate with Railway

**Railway CLI is already authenticated!** ✅

**Current Status:**

- Project: `zyeuteV5`
- Environment: `production`
- Service: `zyeute-db`

**If you need to re-authenticate:**

**Option A: Interactive Login (Recommended)**

```bash
railway login
# Opens browser for authentication
```

**Option B: Using Environment Variable**

```bash
# Set token in environment
$env:RAILWAY_TOKEN="b4f9d49a-f422-4fdf-a3ee-f2144dc088e1"

# Then login
railway login
```

**Note:** Railway CLI v4.25.3 doesn't support `--token` flag directly. Use interactive login or set `RAILWAY_TOKEN` environment variable.

---

## Step 4: Link Project to Railway

```bash
# Navigate to project directory
cd c:\Users\north\ZyeuteV5

# Link to existing Railway project
railway link

# Or create new project
railway init
```

---

## Step 5: Verify Connection

```bash
# Check current project
railway status

# List services
railway service list

# View logs
railway logs

# View environment variables
railway variables
```

---

## Common Railway CLI Commands

| Command                           | Purpose                               |
| --------------------------------- | ------------------------------------- |
| `railway login`                   | Authenticate with Railway             |
| `railway link`                    | Link local project to Railway project |
| `railway up`                      | Deploy to Railway                     |
| `railway logs`                    | View deployment logs                  |
| `railway variables`               | List environment variables            |
| `railway variables set KEY=value` | Set environment variable              |
| `railway service list`            | List all services                     |
| `railway status`                  | Show current project/service          |

---

## Setting Environment Variables via CLI

```bash
# Set single variable
railway variables set MAX_API_TOKEN=p8KXOOrrGHmOsJF5aKprjaytb8df156q

# Set multiple variables from .env file
railway variables set --file .env

# View all variables
railway variables
```

---

## Deploying to Railway

```bash
# Deploy current branch
railway up

# Deploy specific service
railway up --service backend

# View deployment status
railway status
```

---

## Railway Project URL

Based on your docs, your Railway project is:

- **URL:** `https://zyeutev5-production.up.railway.app`
- **Project ID:** `ad61359f-e003-47db-9feb-2434b9c266f5` (from RAILWAY_ENV_CHECKLIST.md)

---

## Security Best Practices

1. **Never commit Railway token to git**
   - ✅ Token is in `.env` (gitignored)
   - ❌ Don't add to `.env.example`

2. **Use Railway Dashboard for production secrets**
   - Go to Railway Dashboard → Variables tab
   - Add sensitive variables there (encrypted at rest)

3. **Rotate token if exposed**
   - Railway Dashboard → Account → Tokens
   - Revoke old token, generate new one

---

## Troubleshooting

### "Railway CLI not found"

```bash
npm install -g @railway/cli
```

### "Authentication failed"

- Verify token is correct
- Check token hasn't expired
- Try `railway login` (interactive)

### "Project not linked"

```bash
railway link
# Select your project from list
```

---

**Token configured!** Use `railway login --token` to authenticate. 🚂
