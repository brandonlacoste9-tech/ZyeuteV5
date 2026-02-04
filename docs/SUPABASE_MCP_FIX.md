# Supabase MCP Fix - Project Reference Updated

**Issue Found:** `.mcp.json` was pointing to wrong Supabase project

---

## What Was Wrong

**Old Configuration:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=hiuemmkhwiaarpdyncgj"
    }
  }
}
```

**Problem:** Project reference `hiuemmkhwiaarpdyncgj` doesn't match your Zyeuté project

---

## Fixed Configuration

**Updated to correct project:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=vuanulvyqkfefmjcikfk"
    }
  }
}
```

**Now matches:**

- Your Zyeuté Supabase project: `vuanulvyqkfefmjcikfk`
- Your Supabase URL: `https://vuanulvyqkfefmjcikfk.supabase.co`

---

## Next Steps

1. ✅ **Config file updated** - `.mcp.json` now points to correct project
2. ⏳ **Restart Claude Code** - Full restart required (not `/resume`)
3. ⏳ **Approve MCP server** - Click "Allow" when prompted
4. ⏳ **Test connection** - Try querying Supabase database

---

## After Restart

**Claude should have access to:**

- `mcp__supabase__query` - Run SQL queries
- `mcp__supabase__list_tables` - List database tables
- `mcp__supabase__describe_table` - Get table schema
- `mcp__supabase__insert` - Insert records
- `mcp__supabase__update` - Update records
- `mcp__supabase__delete` - Delete records

---

## Verification

**Test query after restart:**

```
"List all tables in the Zyeuté Supabase database"
```

**Expected:** Claude should be able to access your Zyeuté database tables.

---

**Config fixed! Restart Claude Code to connect to the correct Supabase project.** 🔗
