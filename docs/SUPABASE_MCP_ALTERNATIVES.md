# Supabase MCP Alternatives

**Current:** Hosted MCP requires OAuth  
**Alternatives:** Local MCP server or continue with scripts

---

## Option A: Local PostgreSQL MCP Server

**Use your existing DATABASE_URL:**

Update `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase-postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
      }
    }
  }
}
```

**Get DATABASE_URL from:**

- Your `.env` file: `DATABASE_URL`
- Or Supabase Dashboard → Settings → Database → Connection Pooling

**Pros:**

- ✅ No OAuth required
- ✅ Direct database access
- ✅ Works with existing credentials

---

## Option B: Continue with Scripts (Current)

**Your scripts already work:**

```bash
# Test connection
tsx scripts/test-supabase-mcp.ts

# Use Supabase client in scripts
# Full database access via Node.js
```

**We can enhance scripts:**

- Add more query helpers
- Create database utilities
- Build Max API endpoints that query Supabase

---

## Option C: Try OAuth First

**Check Supabase Dashboard:**

1. https://app.supabase.com/project/vuanulvyqkfefmjcikfk/settings/integrations
2. Look for "MCP" or "AI Integrations"
3. Authorize Claude Code if available

---

## My Recommendation

**For now:** Continue with scripts (Option B) - they work!

**Later:** Try OAuth (Option C) or switch to local MCP (Option A)

**Why:** Scripts give you immediate database access without waiting for OAuth setup.

---

**What would you like to do?** 🚀
