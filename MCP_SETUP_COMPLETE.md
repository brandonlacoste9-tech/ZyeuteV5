# MCP Setup Complete: Autonomous Backend Capabilities

Complete guide to using Model Context Protocol (MCP) servers for your Colony OS backend.

---

## 🎯 What You've Configured

### MCP Servers Enabled

1. **Supabase Postgres MCP** ✅
   - Direct database queries
   - Live schema access
   - Query optimization
   - EXPLAIN ANALYZE support

2. **GitHub MCP** ✅
   - Repository access
   - PR/Issue reading
   - Documentation access

3. **Filesystem MCP** ✅
   - Enhanced file access
   - Log file reading
   - Config file parsing

---

## 🔧 Configuration File

**Location**: `.cursor/mcp-config.json`

**Status**: ✅ Configured and ready

**Next Step**: Set environment variables (see below)

---

## ⚙️ Environment Variables Setup

Add these to your `.env` file in project root:

```bash
# Supabase Database (for Postgres MCP)
SUPABASE_HOST=vuanulvyqkfefmjcikfk.supabase.co
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_database_password_here
SUPABASE_DATABASE=postgres

# GitHub (for GitHub MCP - Optional)
GITHUB_TOKEN=your_github_personal_access_token_here

# Project Root (for Filesystem MCP)
PROJECT_ROOT=C:\Users\north\ZyeuteV5
```

---

## 🚀 Quick Start: Using MCP in Cursor

### Example 1: Query Live Database Schema

**Command** (`Cmd/Ctrl + L` in Chat):
```
Using MCP Postgres, query the live Supabase database:
- Check if windows_automation_bees table exists
- List all columns and their types
- Verify foreign key constraints on automation_tasks
- Report schema status
```

**What Cursor Does**:
- Connects to Supabase via MCP
- Queries actual database schema
- Returns real table structures
- Validates constraints

---

### Example 2: Optimize Slow Query

**Command**:
```
Using MCP Postgres, run EXPLAIN ANALYZE on this query:
SELECT * FROM automation_tasks 
WHERE bee_id = 'abc123' AND status = 'running' 
ORDER BY created_at DESC 
LIMIT 10

Suggest indexes if needed and create migration.
```

**What Cursor Does**:
- Executes EXPLAIN ANALYZE on live database
- Shows actual execution plan
- Suggests optimal indexes
- Creates migration file

---

### Example 3: Read System Logs

**Command**:
```
Using MCP Filesystem, read the latest Python bridge logs from 
Windows-Use/bridge_service.log. Analyze for errors and suggest 
fixes.
```

**What Cursor Does**:
- Reads log file via MCP
- Parses error messages
- Analyzes stack traces
- Suggests fixes

---

### Example 4: Cross-Language Audit

**Command**:
```
Using @Codebase, perform a cross-language audit:
1. Find TypeScript AutomationTask interface in windows-automation-bridge.ts
2. Find Python AutomationTask model in bridge_service.py
3. Compare field names, types, and optional/required status
4. List any mismatches and fix them
```

**What Cursor Does**:
- Searches both TypeScript and Python files
- Compares interface and model definitions
- Finds mismatches
- Fixes both sides automatically

---

## 📊 MCP Server Capabilities

### Supabase Postgres MCP

**Capabilities**:
- ✅ Query live database schema
- ✅ Run EXPLAIN ANALYZE on queries
- ✅ Check index usage
- ✅ Validate foreign keys
- ✅ Analyze query performance
- ✅ Suggest optimizations

**Use Cases**:
- Schema validation
- Query optimization
- Migration verification
- Performance analysis

**Example Queries**:
```
Using MCP Postgres:
- "Check if automation_tasks table has index on (bee_id, status)"
- "Find queries on automation_tasks that scan > 1000 rows"
- "Verify all bee_id values have matching entries in windows_automation_bees"
```

---

### GitHub MCP

**Capabilities**:
- ✅ Read repository files
- ✅ Access PRs and issues
- ✅ Read project documentation
- ✅ Check commit history

**Use Cases**:
- Verify code matches PRD
- Read project requirements
- Check issue context
- Review documentation

**Example Queries**:
```
Using MCP GitHub:
- "Read the README.md to understand project structure"
- "Check PR #123 for database schema changes"
- "Review issue #456 for bug context"
```

---

### Filesystem MCP

**Capabilities**:
- ✅ Read log files
- ✅ Parse config files
- ✅ Access project files
- ✅ Read error traces

**Use Cases**:
- Debug via log analysis
- Parse configuration
- Read system files
- Analyze errors

**Example Queries**:
```
Using MCP Filesystem:
- "Read Windows-Use/bridge_service.log and find errors"
- "Parse .env file and list all environment variables"
- "Check zyeute/backend/index.ts for initialization order"
```

---

## 🎯 Advanced Usage Patterns

### Pattern 1: Database-Driven Development

**Workflow**:
1. Use MCP to query live schema
2. Generate Drizzle schema from live DB
3. Create migrations based on differences
4. Validate against live database

**Command**:
```
Using MCP Postgres, compare the live database schema with 
zyeute/shared/schema.ts. Create migrations for any differences.
```

---

### Pattern 2: Performance Optimization

**Workflow**:
1. Identify slow query
2. Use MCP EXPLAIN ANALYZE
3. Get real execution plan
4. Suggest indexes based on actual data

**Command**:
```
Using MCP Postgres, run EXPLAIN ANALYZE on slow queries 
from automation_tasks. Suggest GIN or B-tree indexes to 
optimize them.
```

---

### Pattern 3: Debug via Logs

**Workflow**:
1. Service crashes
2. Use MCP Filesystem to read logs
3. Analyze stack trace
4. Fix root cause

**Command**:
```
Using MCP Filesystem, read the latest Python bridge error logs.
Analyze the stack trace and fix the root cause.
```

---

### Pattern 4: Context-Aware Development

**Workflow**:
1. Read GitHub issue for context
2. Query database for current state
3. Generate code that matches requirements
4. Validate against live schema

**Command**:
```
Using MCP GitHub, read issue #789. Using MCP Postgres, check 
the current schema. Implement the requested feature matching 
both the issue requirements and current database structure.
```

---

## 🔧 Setup Instructions

### Step 1: Install MCP Servers

The servers will auto-install when Cursor connects to them (using `npx -y`).

**Manual Installation** (optional):
```bash
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-github
npm install -g @modelcontextprotocol/server-filesystem
```

---

### Step 2: Configure Environment Variables

Add to `.env` file in project root:

```bash
# Supabase (required for Postgres MCP)
SUPABASE_HOST=vuanulvyqkfefmjcikfk.supabase.co
SUPABASE_USER=postgres
SUPABASE_PASSWORD=your_password_here

# GitHub (optional)
GITHUB_TOKEN=ghp_your_token_here

# Project Root (for Filesystem MCP)
PROJECT_ROOT=C:\Users\north\ZyeuteV5
```

---

### Step 3: Restart Cursor

After adding environment variables:
1. Close Cursor completely
2. Reopen Cursor
3. MCP servers will auto-connect

---

### Step 4: Verify MCP Connection

Test with this command (`Cmd/Ctrl + L`):
```
Using MCP Postgres, list all tables in the public schema.
```

**Expected**: List of actual database tables

---

## ✅ Verification Checklist

After setup, verify:

- [ ] `.cursor/mcp-config.json` exists
- [ ] Environment variables are set
- [ ] Cursor has been restarted
- [ ] MCP Postgres can query database
- [ ] MCP Filesystem can read files
- [ ] MCP GitHub can access repo (if token set)

---

## 🚨 Troubleshooting

### Issue: MCP Not Connecting

**Error**: `MCP server connection failed`

**Fix**:
1. Verify `.cursor/mcp-config.json` exists
2. Check environment variables are set
3. Restart Cursor
4. Check Cursor Settings → Features → MCP is enabled

---

### Issue: Postgres MCP Fails

**Error**: `Connection refused` or `Authentication failed`

**Fix**:
1. Verify `SUPABASE_HOST`, `SUPABASE_USER`, `SUPABASE_PASSWORD` in `.env`
2. Check Supabase connection string format
3. Ensure database is accessible
4. Verify SSL mode is correct (require for Supabase)

---

### Issue: GitHub MCP Not Working

**Error**: `GitHub token not found`

**Fix**:
1. Generate GitHub Personal Access Token
2. Add `GITHUB_TOKEN` to `.env`
3. Restart Cursor
4. Or remove GitHub MCP if not needed

---

### Issue: Filesystem MCP Permission Denied

**Error**: `Permission denied` when reading files

**Fix**:
1. Verify `PROJECT_ROOT` path is correct
2. Check file permissions
3. Ensure path uses forward slashes or escaped backslashes on Windows

---

## 🔥 Pro Tips

1. **Combine MCP Servers**: Use Postgres + Filesystem for full context
2. **Query Before Coding**: Always check live schema before writing migrations
3. **Use EXPLAIN ANALYZE**: Get real execution plans, not guesses
4. **Read Logs First**: Use Filesystem MCP before asking "why did it crash?"
5. **Document MCP Queries**: Save useful queries to Notepads

---

## 📚 Related Resources

- **MCP Config**: `.cursor/mcp-config.json`
- **Database Patterns**: `.cursor/rules/004-database-patterns.mdc`
- **Bridge Debugging**: `.cursor/rules/005-bridge-debugging.mdc`
- **MCP Servers Guide**: `CURSOR_MCP_SERVERS.md`
- **Master Guide**: `AUTONOMOUS_ARCHITECTURE_MASTER.md`

---

## 🎯 Next Steps

1. **Set Environment Variables**: Add Supabase credentials to `.env`
2. **Restart Cursor**: Let MCP servers connect
3. **Test Postgres MCP**: Query live database schema
4. **Try Filesystem MCP**: Read log files
5. **Use in Development**: Query database before writing code

---

## 🎉 Success Indicators

You know MCP is working when:

- ✅ Can query actual database schema (not guesses)
- ✅ Can run EXPLAIN ANALYZE on live queries
- ✅ Can read system logs via MCP
- ✅ Can access GitHub repo (if token set)
- ✅ Cursor provides real-world optimizations

---

**MCP is your "superpower" for backend development!** 🚀✨
