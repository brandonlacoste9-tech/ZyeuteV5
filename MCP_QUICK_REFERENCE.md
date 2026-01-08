# MCP Quick Reference Card

One-page reference for using MCP servers in your Colony OS backend.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Add to `.env`
```bash
SUPABASE_HOST=vuanulvyqkfefmjcikfk.supabase.co
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_password_here
PROJECT_ROOT=C:\Users\north\ZyeuteV5
GITHUB_TOKEN=your_token_here  # Optional
```

### Step 2: Restart Cursor
Close and reopen Cursor to activate MCP servers.

### Step 3: Test
```
Using MCP Postgres, list all tables in public schema.
```

---

## 📊 MCP Servers

| Server | Purpose | Example Query |
|--------|---------|---------------|
| **Postgres** | Live database | `Using MCP Postgres, check if automation_tasks table exists` |
| **Filesystem** | Read logs | `Using MCP Filesystem, read latest bridge_service.log` |
| **GitHub** | Repo access | `Using MCP GitHub, read README.md` |

---

## 🎯 Common Commands

### Database Schema Check
```
Using MCP Postgres, query live Supabase database:
- Check if windows_automation_bees table exists
- List all columns with types
- Verify foreign keys
```

### Query Optimization
```
Using MCP Postgres, run EXPLAIN ANALYZE on:
SELECT * FROM automation_tasks WHERE bee_id = 'abc' AND status = 'running'

Suggest indexes if needed.
```

### Debug from Logs
```
Using MCP Filesystem, read Windows-Use/bridge_service.log.
Analyze errors and suggest fixes.
```

### Cross-Language Check
```
Using @Codebase, compare TypeScript AutomationTask interface 
and Python AutomationTask model. Fix any mismatches.
```

---

## 🔥 Pro Tips

1. **Always query DB first** - Don't guess schema
2. **Use EXPLAIN ANALYZE** - Get real execution plans
3. **Combine MCP servers** - Postgres + Filesystem together
4. **Document queries** - Save to Notepads for reuse

---

## 📚 Full Documentation

- **Setup**: `MCP_SETUP_COMPLETE.md`
- **Examples**: `MCP_USAGE_EXAMPLES.md`
- **Config**: `.cursor/mcp-config.json`

---

**MCP = Your Backend Superpower!** 🚀
