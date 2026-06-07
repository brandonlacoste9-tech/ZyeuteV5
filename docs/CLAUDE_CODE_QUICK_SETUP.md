# Claude Code Quick Setup for ZyeutéV5 🚀

**Goal:** Get Claude Code working with your ZyeutéV5 project

---

## ✅ Current Configuration

Your project already has `.mcp.json` configured:

```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-postgres",
        "postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
      ]
    }
  }
}
```

This gives Claude Code direct PostgreSQL database access! 🎯

---

## Step 1: Open Project in Claude Code

1. **Open Claude Code** (after installation)
2. **Open Folder** → Select `c:\Users\north\ZyeuteV5`
3. Claude Code should detect `.mcp.json` automatically

---

## Step 2: Verify MCP Connection

**In Claude Code, ask:**

```
"List all tables in the Zyeuté database"
```

**Or test connection:**

```bash
# If Claude Code CLI is available
claude mcp list
```

**Expected:** Claude Code should have access to PostgreSQL MCP tools

---

## Step 3: What Claude Code Can Do

Once connected, Claude Code can:

✅ **Query Database:**

- List tables (`publications`, `users`, `regions`, etc.)
- Run SQL queries
- Understand schema structure

✅ **Work on Code:**

- Fix Railway deployment issues
- Review TypeScript errors
- Help with backend/frontend code

✅ **Project Understanding:**

- Read `CLAUDE.md` (if it exists) for project context
- Understand ZyeutéV5 architecture
- Help with Max API, Railway, Vercel setup

---

## Troubleshooting

### MCP Not Loading?

1. **Restart Claude Code** (full restart, not resume)
2. **Check `.mcp.json`** - Should be in project root
3. **Verify PostgreSQL connection** - Test DATABASE_URL locally

### Database Connection Failed?

**Test connection locally:**

```bash
npm run verify:railway-vars
```

**Check DATABASE_URL format:**

```
postgresql://postgres.[REF]:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
```

---

## Next Steps

1. **Open project in Claude Code**
2. **Test database access** - Ask Claude Code to list tables
3. **Work on Railway deployment** - Use Claude Code to diagnose issues
4. **Fix Vercel build** - Verify TypeScript fixes worked

---

## What I (Composer) Can Help With

Even though I'm not Claude Code, I can:

- ✅ Help configure Claude Code setup
- ✅ Fix code issues (Railway, Vercel, TypeScript)
- ✅ Create scripts and documentation
- ✅ Diagnose deployment problems

**Claude Code is great for:**

- Deep code analysis
- Database queries via MCP
- Complex refactoring
- Project-wide understanding

**I'm great for:**

- Quick fixes and scripts
- Immediate troubleshooting
- File editing and creation
- Terminal commands

---

**Ready to use Claude Code? Open the project and test the database connection!** 🎉
