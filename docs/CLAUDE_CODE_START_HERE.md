# Claude Code - Start Here! 🚀

**You have Claude Code installed - here's how to use it!**

---

## Step 1: Restart Your Terminal

**Important:** Close and reopen your terminal/PowerShell so PATH changes take effect.

---

## Step 2: Open Your Project in Claude Code

**In your terminal, run:**

```powershell
cd c:\Users\north\ZyeuteV5
claude code .
```

**Or open Claude Code directly:**

```powershell
claude code c:\Users\north\ZyeuteV5
```

**What happens:**

- Claude Code opens (like VS Code/Cursor)
- It detects your `.mcp.json` file automatically
- PostgreSQL MCP connects to your database

---

## Step 3: Start Talking to Claude Code

**In Claude Code, you can:**

### Ask Questions:

```
"What is this project about?"
"Show me the database schema"
"List all tables in the database"
```

### Get Help:

```
"Help me fix the Railway deployment healthcheck failure"
"Why is the backend not starting?"
"Check if DATABASE_URL is configured correctly"
```

### Work on Code:

```
"Review the backend/index.ts startup code"
"Find all TypeScript errors"
"Help me understand the Max API routes"
```

---

## Step 4: Test Database Access

**Try this first:**

```
"List all tables in the Zyeuté Supabase database"
```

**Expected:** Claude Code should show you:

- `publications`
- `users`
- `regions`
- `post_reactions`
- etc.

**If it works:** ✅ Database connection is working!

---

## Step 5: Use Claude Code for Your Current Issues

### Fix Railway Deployment:

```
"I need help diagnosing Railway healthcheck failures.
The build succeeds but the backend won't start.
Check the backend/index.ts file for startup errors."
```

### Check Environment Variables:

```
"Verify what environment variables the backend needs to start.
Check backend/index.ts and tell me what's required."
```

### Review Code:

```
"Review the TypeScript fixes I made for Vercel build.
Are there any remaining issues?"
```

---

## Common Commands

**In Claude Code chat:**

- `"Show me..."` - Display code/files
- `"Fix..."` - Fix code issues
- `"Explain..."` - Explain how something works
- `"Query database..."` - Run SQL queries
- `"Help me..."` - Get assistance

---

## What Makes Claude Code Special?

✅ **Database Access** - Can query your Supabase database directly  
✅ **Project Understanding** - Reads your entire codebase  
✅ **Smart Fixes** - Understands context and relationships  
✅ **MCP Integration** - Uses tools automatically when needed

---

## Quick Test

**Try this right now:**

1. Open terminal
2. Run: `claude code c:\Users\north\ZyeuteV5`
3. In Claude Code, ask: `"What is this project and what are the main issues?"`

**Claude Code should:**

- Read your project files
- Understand it's ZyeutéV5
- Know about Railway/Vercel issues
- Offer to help fix them

---

## Troubleshooting

### "claude: command not found"

**Fix:** Restart terminal (PATH needs to reload)

### "MCP server not connected"

**Fix:** Check `.mcp.json` exists in project root

### "Can't access database"

**Fix:** Verify DATABASE_URL in `.mcp.json` is correct

---

## Next Steps

1. ✅ **Restart terminal**
2. ✅ **Open project:** `claude code .`
3. ✅ **Test database:** Ask to list tables
4. ✅ **Fix Railway:** Ask for help diagnosing deployment

---

**That's it! Claude Code is ready to help you work on ZyeutéV5!** 🎉
