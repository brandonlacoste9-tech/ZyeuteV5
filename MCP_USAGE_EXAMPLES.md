# MCP Usage Examples: Real-World Commands

Practical examples of using MCP servers in your Colony OS backend development.

---

## 🗄️ Supabase Postgres MCP Examples

### Example 1: Schema Validation

**Command**:
```
Using MCP Postgres, query the live Supabase database:
1. Check if windows_automation_bees table exists
2. List all columns with their types
3. Verify CHECK constraints on status column
4. Check if foreign key on automation_tasks.bee_id exists
5. Report any missing constraints or tables
```

**Use Case**: Verify migrations applied correctly

---

### Example 2: Query Optimization

**Command**:
```
Using MCP Postgres, run EXPLAIN ANALYZE on this query:
SELECT * FROM automation_tasks 
WHERE bee_id = 'abc123' 
  AND status = 'running' 
  AND created_at > NOW() - INTERVAL '1 day'
ORDER BY created_at DESC 
LIMIT 10

Analyze the execution plan and:
- Suggest indexes if sequential scan is used
- Check if existing indexes are being used
- Recommend composite index if needed
- Create migration for optimal indexes
```

**Use Case**: Optimize slow queries with real data

---

### Example 3: Performance Analysis

**Command**:
```
Using MCP Postgres, find all queries on automation_tasks table 
that:
- Scan more than 1000 rows
- Take longer than 100ms
- Don't use indexes

For each query, suggest:
- Optimal index structure
- Query rewrite if needed
- Migration to add indexes
```

**Use Case**: Identify performance bottlenecks

---

### Example 4: Data Validation

**Command**:
```
Using MCP Postgres, check the automation_tasks table:
1. Find any orphaned records (bee_id without matching bee)
2. Count tasks in each status
3. Find tasks older than 7 days that are still 'queued'
4. Report data quality issues
```

**Use Case**: Data integrity checks

---

### Example 5: Migration Verification

**Command**:
```
Using MCP Postgres, verify migration 0016 was applied:
1. Check if automation_tasks table exists
2. Verify all columns match the schema in 0016_create_automation_tasks.sql
3. Check if all indexes are created
4. Verify RLS policies are active
5. Report any missing pieces
```

**Use Case**: Validate migrations against live database

---

## 📁 Filesystem MCP Examples

### Example 1: Debug Python Bridge Crash

**Command**:
```
Using MCP Filesystem, read Windows-Use/bridge_service.log 
from the last 100 lines. Analyze the error stack trace and:
1. Identify the root cause
2. Suggest a fix
3. Update the code to prevent recurrence
```

**Use Case**: Debug service crashes

---

### Example 2: Parse Configuration

**Command**:
```
Using MCP Filesystem, read zyeute/.env file and:
1. List all environment variables
2. Identify missing required variables
3. Check for incorrectly formatted values
4. Suggest fixes for any issues
```

**Use Case**: Validate environment configuration

---

### Example 3: Read Error Traces

**Command**:
```
Using MCP Filesystem, read the latest error logs from 
zyeute/backend/server.log. Find all errors from the last 
hour and:
1. Categorize by error type
2. Identify recurring patterns
3. Suggest fixes for each category
```

**Use Case**: Monitor production errors

---

### Example 4: Analyze Log Patterns

**Command**:
```
Using MCP Filesystem, read Windows-Use/bridge_service.log 
and analyze:
1. Average response time for /execute endpoint
2. Error rate percentage
3. Most common error types
4. Time-of-day patterns
5. Suggest optimizations
```

**Use Case**: Performance monitoring

---

## 🔄 Combined MCP Examples

### Example 1: Debug Database Query Issue

**Command**:
```
Using MCP Postgres, run EXPLAIN ANALYZE on the slow query:
SELECT * FROM automation_tasks WHERE bee_id = 'abc' AND status = 'running'

Using MCP Filesystem, check if there are any related errors 
in the backend logs mentioning 'automation_tasks' or 'bee_id'.

Combine findings to:
1. Optimize the query
2. Fix any application-level issues
3. Create migration for needed indexes
```

**Use Case**: Full-stack debugging

---

### Example 2: Validate Feature Implementation

**Command**:
```
Using MCP Postgres, check if the new 'harvest' status was 
added to the windows_automation_bees table.

Using MCP Filesystem, read the Drizzle schema file and 
verify the TypeScript types match.

Using @Codebase, check if all code references were updated.

If any mismatches found, fix them automatically.
```

**Use Case**: Ensure feature consistency

---

### Example 3: Performance Optimization Workflow

**Command**:
```
1. Using MCP Postgres, find slowest queries (> 100ms)
2. For each query, run EXPLAIN ANALYZE
3. Using MCP Filesystem, check application logs for related errors
4. Suggest optimal indexes based on actual execution plans
5. Create migration with indexes
6. Update application code if needed
7. Document optimization in SESSION_SUMMARY.md
```

**Use Case**: Systematic performance improvement

---

## 🎯 Workflow Patterns

### Pattern 1: Before Writing Migrations

**Always query live schema first**:
```
Using MCP Postgres, check current schema of automation_tasks table.
Now create migration 0017 to add 'priority' column only if it doesn't exist.
```

---

### Pattern 2: Before Adding Indexes

**Analyze actual query patterns first**:
```
Using MCP Postgres, run EXPLAIN ANALYZE on queries that filter by 
(bee_id, status). Based on actual execution plans, create optimal 
composite index.
```

---

### Pattern 3: When Debugging Production Issues

**Combine database + logs**:
```
Using MCP Postgres, check for data anomalies.
Using MCP Filesystem, read error logs.
Combine findings to identify root cause.
```

---

### Pattern 4: When Optimizing

**Use real data, not guesses**:
```
Using MCP Postgres:
1. Find queries scanning > 1000 rows
2. Run EXPLAIN ANALYZE on each
3. Get actual row counts and execution times
4. Suggest indexes based on real data distribution
```

---

## 🔥 Advanced Usage

### Example 1: Autonomous Migration Generation

**Command** (in Composer with Agent Mode):
```
Using MCP Postgres, compare the live database schema with 
zyeute/shared/schema.ts. Generate migrations for:
1. Missing tables
2. Missing columns
3. Missing indexes
4. Missing foreign keys

Create all migrations in zyeute/migrations/ with proper 
naming and dependencies.
```

---

### Example 2: Query Optimization Pipeline

**Command** (in Composer with Agent Mode):
```
Using MCP Postgres:
1. Find all queries on automation_tasks that scan > 500 rows
2. Run EXPLAIN ANALYZE on each
3. For sequential scans, suggest optimal index
4. Create migration with all needed indexes
5. Update queries if needed
6. Document optimization results
```

---

### Example 3: Data Quality Audit

**Command**:
```
Using MCP Postgres, perform data quality audit:
1. Find orphaned automation_tasks (bee_id not in windows_automation_bees)
2. Find tasks stuck in 'running' status for > 1 hour
3. Find bees with no heartbeat in > 5 minutes but status is 'running'
4. Report all issues with suggested fixes
```

---

## ✅ Best Practices

1. **Query Before Coding**: Always check live schema first
2. **Use EXPLAIN ANALYZE**: Get real execution plans
3. **Combine MCP Servers**: Use Postgres + Filesystem together
4. **Document Findings**: Save useful queries to Notepads
5. **Validate After Changes**: Re-query to verify fixes

---

## 📚 Related Resources

- **MCP Setup**: `MCP_SETUP_COMPLETE.md`
- **MCP Servers Guide**: `CURSOR_MCP_SERVERS.md`
- **Database Patterns**: `.cursor/rules/004-database-patterns.mdc`
- **Master Guide**: `AUTONOMOUS_ARCHITECTURE_MASTER.md`

---

**Use these examples to unlock MCP's full potential!** 🚀
