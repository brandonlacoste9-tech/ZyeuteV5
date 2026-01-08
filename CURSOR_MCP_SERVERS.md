# Cursor MCP Servers: Your AI's External Senses

Leverage Model Context Protocol (MCP) to give Cursor access to your live infrastructure.

---

## 🎯 What is MCP?

**MCP** (Model Context Protocol) allows Cursor to interact with **external tools and services** beyond just code.

### MCP vs Standard Chat

| Feature | Standard Chat | With MCP |
|---------|---------------|----------|
| **Database** | Guesses schema | Queries actual database |
| **Performance** | Theoretical | Real execution plans |
| **Queries** | Generic SQL | Optimized for your data |
| **Migrations** | Blind changes | Validates against live DB |

---

## 🔌 MCP Servers Setup

### Server 1: Supabase/Postgres MCP

**Purpose**: Direct database access for schema queries and query optimization.

**Configuration** (`.cursor/mcp-config.json`):
```json
{
  "mcpServers": {
    "supabase-db": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "PGHOST": "${SUPABASE_HOST}",
        "PGPORT": "5432",
        "PGDATABASE": "postgres",
        "PGUSER": "${SUPABASE_USER}",
        "PGPASSWORD": "${SUPABASE_PASSWORD}",
        "PGSSLMODE": "require"
      }
    }
  }
}
```

**Usage Examples**:

1. **Check Table Schema**:
   ```
   Using MCP, query the live Supabase database. Check if the 
   windows_automation_bees table exists and list all columns 
   with their types.
   ```

2. **Verify Migrations**:
   ```
   Using MCP, check if migrations 0015 and 0016 have been applied.
   Verify the automation_tasks table has the foreign key constraint
   on bee_id.
   ```

3. **Query Optimization**:
   ```
   Using MCP, run EXPLAIN ANALYZE on this query:
   SELECT * FROM automation_tasks WHERE bee_id = 'abc123' AND status = 'running'
   
   Suggest an index if needed.
   ```

4. **Performance Analysis**:
   ```
   Using MCP, find all queries in the automation_tasks table that 
   take longer than 100ms. Suggest indexes or query optimizations.
   ```

---

### Server 2: GitHub MCP (Optional)

**Purpose**: Access repository information, PRs, and issues.

**Configuration**:
```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}"
      }
    }
  }
}
```

**Usage Examples**:
```
Using MCP, check the latest commit message on the main branch.
What files were changed in the last 5 commits?
```

---

### Server 3: Sequential Thinking MCP (Optional)

**Purpose**: Forces AI to use step-by-step reasoning for complex Colony OS logic.

**Configuration**:
```json
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```

**Usage Examples**:
```
Using Sequential Thinking MCP, explain the Colony OS task delegation 
process step-by-step:

1. How does the Hive Manager discover available bees?
2. How does the Bee System assign tasks?
3. How does the Synapse Bridge coordinate execution?
```

**Output Format**:
```
Thought 1: First, I need to check the BeeRegistry for available nodes...
Thought 2: Then, I must verify the Synapse bridge heartbeat...
Thought 3: Finally, I'll route the task to the appropriate bee...
```

---

## 🎯 MCP Best Practices

### 1. Query Actual Schema, Not Guesses

**Bad**: "Create a migration for automation_tasks table"
**Good**: "Using MCP, check the actual schema of automation_tasks and create a migration if it doesn't match"

---

### 2. Use EXPLAIN ANALYZE for Performance

**Bad**: "Add an index on bee_id"
**Good**: "Using MCP, run EXPLAIN ANALYZE on queries filtering by bee_id and suggest optimal indexes"

---

### 3. Validate Migrations Against Live DB

**Bad**: "Apply migration 0015"
**Good**: "Using MCP, verify migration 0015 hasn't been applied, then apply it"

---

### 4. Combine MCP with Debug Mode

**Example**: 
```
Using MCP, check if the automation_tasks table has proper indexes.
Then use Debug Mode to instrument the slow query and analyze it.
```

---

## 🔧 MCP + Debug Mode Workflow

### Complex Bug: Slow Database Queries

**Step 1: Use MCP to Identify Problem**
```
Using MCP, find queries on automation_tasks that take > 100ms.
Show me the execution plans.
```

**MCP Response**:
```
Query: SELECT * FROM automation_tasks WHERE bee_id = 'abc' AND status = 'running'
Execution Time: 245ms
Index Used: None (Sequential Scan)
Rows Examined: 10,000
Rows Returned: 2
```

**Step 2: Use Debug Mode to Instrument**
```
Using Debug Mode, add logging to the slow query and run it 
to see actual execution time.
```

**Step 3: Use MCP to Optimize**
```
Using MCP, create a composite index on (bee_id, status) for 
the automation_tasks table. Then re-run EXPLAIN ANALYZE.
```

**Step 4: Verify Fix**
```
Using MCP, verify the query now uses the index and takes < 10ms.
```

---

## 🎯 MCP Query Examples

### Example 1: Schema Validation
```
Using MCP, check if the windows_automation_bees table has:
- id (TEXT PRIMARY KEY)
- status (TEXT with CHECK constraint)
- last_heartbeat (TIMESTAMPTZ)

If any are missing or wrong, create a migration to fix it.
```

---

### Example 2: Index Optimization
```
Using MCP, run EXPLAIN ANALYZE on this query:
SELECT * FROM automation_tasks 
WHERE bee_id = 'abc' AND status = 'queued' 
ORDER BY created_at DESC 
LIMIT 10;

Suggest indexes if the query is slow.
```

---

### Example 3: Migration Status
```
Using MCP, check which of these tables exist:
- windows_automation_bees
- automation_tasks
- post_not_interested

Create migrations for any missing tables.
```

---

### Example 4: Data Distribution
```
Using MCP, check the distribution of status values in 
automation_tasks. How many tasks are in each state?
```

---

### Example 5: Foreign Key Validation
```
Using MCP, verify that all automation_tasks.bee_id values 
have corresponding entries in windows_automation_bees.id.
Report any orphaned tasks.
```

---

## 🚨 MCP Troubleshooting

### Issue: MCP Not Connecting

**Fix**:
1. Verify `.cursor/mcp-config.json` has correct credentials
2. Check environment variables are set
3. Ensure MCP server is installed: `npm install -g @modelcontextprotocol/server-postgres`
4. Restart Cursor

---

### Issue: MCP Queries Fail

**Fix**:
1. Check database connection string format
2. Verify SSL mode is correct (require for Supabase)
3. Test connection manually: `psql $DATABASE_URL`

---

### Issue: MCP Not Available in Chat

**Fix**:
1. Ensure MCP is enabled in Settings → Features → MCP
2. Restart Cursor after adding MCP config
3. Check MCP server logs for errors

---

## ✅ MCP Checklist

Before using MCP:
- [ ] `.cursor/mcp-config.json` exists
- [ ] Environment variables are set
- [ ] MCP server is installed
- [ ] Cursor has been restarted

Using MCP:
- [ ] Be specific about what to query
- [ ] Use EXPLAIN ANALYZE for performance
- [ ] Validate against live database
- [ ] Combine with Debug Mode when needed

After MCP:
- [ ] Verify query results make sense
- [ ] Apply suggested optimizations
- [ ] Test performance improvements
- [ ] Document findings

---

## 🔥 Pro Tips

1. **Combine MCP + Debug Mode**: Use MCP to identify problems, Debug Mode to fix them
2. **Query Before Changes**: Always verify schema before creating migrations
3. **Use EXPLAIN ANALYZE**: Real execution plans > guesses
4. **Save Common Queries**: Add useful MCP queries to Notepads

---

## 📚 Related Resources

- **MCP Config**: `.cursor/mcp-config.json`
- **Database Patterns**: `.cursor/rules/004-database-patterns.mdc`
- **Debug Mode Guide**: `CURSOR_DEBUG_MODE_GUIDE.md`

---

**Leverage MCP to give Cursor real infrastructure awareness!** 🚀
