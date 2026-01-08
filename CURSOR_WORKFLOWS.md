# Cursor Workflow Guide: Agentic Architecture

Master the advanced Cursor workflows to maximize productivity in your Colony OS backend.

---

## 🎯 Understanding Cursor Modes

| Mode | Command | Best For | Auto-Approval |
|------|---------|----------|---------------|
| **Chat** | `Cmd/Ctrl + L` | Single-file questions, quick fixes | ✅ |
| **Composer (Agent)** | `Cmd/Ctrl + I` | Multi-file refactoring, feature implementation | ✅ |
| **Debug Mode** | `Cmd/Ctrl + Shift + .` | Fixing logic errors, troubleshooting | ⚠️ |
| **YOLO Mode** | Settings Toggle | Automated migrations, repetitive tasks | ❌ Dangerous |

---

## 🔥 Workflow 1: Multi-File Refactoring (Composer)

### When to Use
- Implementing features that touch multiple files
- Refactoring across Python + TypeScript
- Adding authentication to all routes
- Replacing `any` types with proper interfaces

### Example: Add Circuit Breaker to New AI Route

**Command** (`Cmd + I`):
```
Add a new AI route for "video_analysis" that uses Vertex AI 
with circuit breaker protection. Update:
1. routes.ts (add POST /api/ai/video-analysis)
2. vertex-service.ts (add analyzeVideo method)
3. circuit-breaker.ts (register new route)
4. model-policies.ts (add video_analysis policy)
5. Test with REST Client (.http file)
```

**What Cursor Does**:
- Edits all 5 files simultaneously
- Applies MLOps safety rules automatically
- Creates test file for REST Client
- Ensures type safety across files

---

## 🐛 Workflow 2: Debug Mode (Troubleshooting)

### When to Use
- Synapse Bridge dropping packets
- Python bridge handshake failing
- Database connection issues
- Circuit breaker not triggering

### Example: Debug Bridge Handshake

**Command** (`Cmd + Shift + .`):
```
The Python bridge is failing to respond. Debug this:
1. Check if Python process is running
2. Verify health endpoint is accessible
3. Add request/response logging
4. Check environment variables on both sides
5. Test minimal handshake payload
6. Fix any issues found
```

**What Cursor Does**:
- Reads bridge debugging rules (`005-bridge-debugging.mdc`)
- Adds debug logging automatically
- Runs diagnostic commands
- Fixes issues autonomously
- Reports findings

---

## 🚀 Workflow 3: YOLO Mode (Automated Tasks)

### When to Use
- Running test suites
- Applying database migrations
- Formatting code
- Committing changes

**⚠️ WARNING**: Never use YOLO for destructive operations!

### Example: Automated Migration Testing

**Command** (in YOLO Mode):
```
Run these in order:
1. Apply migrations from MIGRATIONS_AUTOMATION.md
2. Run check-supabase-connection.ts
3. If tests pass, commit with message "Add automation tables"
4. If tests fail, fix issues and retry
```

**What Cursor Does**:
- Runs commands without asking
- Fixes issues automatically
- Commits on success
- Loops until passing

---

## 🔍 Workflow 4: Cross-Language Search (@Codebase)

### When to Use
- Verifying TypeScript ↔ Python type matching
- Finding all bridge-related code
- Understanding feature across stack
- Refactoring cross-language code

### Example: Verify Bridge Type Matching

**Command** (in Chat):
```
Check @Codebase for:
1. TypeScript AutomationTask interface in windows-automation-bridge.ts
2. Python AutomationTask model in bridge_service.py
3. Compare field names and types
4. List any mismatches
```

**What Cursor Does**:
- Searches both TypeScript and Python files
- Finds interface/model definitions
- Compares structures
- Reports mismatches with line numbers

---

## 🗄️ Workflow 5: MCP Database Queries

### When to Use
- Checking actual database schema
- Verifying migrations applied correctly
- Optimizing queries
- Understanding table relationships

### Example: Verify Migration Applied

**Command** (in Chat):
```
Using MCP, query the live Supabase database:
1. Check if windows_automation_bees table exists
2. List all columns and their types
3. Check if automation_tasks table exists
4. Verify foreign key constraints
5. Report schema status
```

**What Cursor Does**:
- Connects to Supabase via MCP
- Queries actual database schema
- Returns real table structures
- Validates migration status

---

## 🧪 Workflow 6: Stress Test Command

### The Ultimate Test: Full Stack Validation

**Command** (`Cmd + I` in Composer, Agent Mode):
```
Read SESSION_SUMMARY.md, check the current state of the 
bee_registry via MCP, and run the validation scripts. 
If any tests fail, fix them across the entire stack and 
update the summary.

Steps:
1. Read SESSION_SUMMARY.md for context
2. Query Supabase via MCP to check automation tables
3. Run check-supabase-connection.ts
4. Run test-bridge-communication.ts
5. Run test-automation-integration.ts
6. Fix any failures in:
   - Database schema
   - Python bridge service
   - TypeScript bridge client
   - Test scripts
7. Re-run tests until all pass
8. Update SESSION_SUMMARY.md with status
```

**What Cursor Does**:
- Reads summary document
- Queries database via MCP
- Runs all validation scripts
- Fixes issues across entire stack
- Updates documentation
- Provides final status report

---

## 🎯 Strategic Workflow Selection

### For New Features
1. **Plan** → Chat: "How should I implement X?"
2. **Build** → Composer: Multi-file implementation
3. **Test** → YOLO: Run test suite
4. **Debug** → Debug Mode: Fix issues

### For Bug Fixes
1. **Diagnose** → Debug Mode: Find root cause
2. **Fix** → Chat/Composer: Apply fix
3. **Verify** → YOLO: Run tests

### For Refactoring
1. **Analyze** → @Codebase: Find all usages
2. **Refactor** → Composer: Multi-file changes
3. **Test** → YOLO: Verify functionality
4. **Commit** → YOLO: Git operations

---

## 🔧 Advanced Patterns

### Pattern 1: Shadow Workspace (Cross-Language)

**Problem**: Cursor loses context between TypeScript and Python

**Solution**: Use `@Codebase` with explicit paths

```
Check @src/services/windows-automation-bridge.ts and 
@Windows-Use/bridge_service.py to ensure the 
AutomationTask types match exactly.
```

### Pattern 2: Rule-Based Refactoring

**Problem**: Ensuring code follows architecture patterns

**Solution**: Edit files that trigger modular rules

- Edit `synapse-bridge.ts` → Rules 003 apply automatically
- Edit `smart-ai-router.ts` → Rules 002 apply automatically
- Edit `windows-automation-bridge.ts` → Rules 001 & 005 apply

### Pattern 3: Database-Driven Development

**Problem**: Guessing database schema

**Solution**: Use MCP to query actual schema

```
Using MCP, check if the automation_tasks table has an 
index on (bee_id, status). If not, create the migration.
```

---

## ✅ Workflow Verification

After using workflows, verify:

- [ ] Multi-file changes compile without errors
- [ ] Debug mode found and fixed root cause
- [ ] YOLO mode completed without dangerous operations
- [ ] @Codebase found all relevant files
- [ ] MCP queries returned actual database data

---

## 🚨 Best Practices

1. **Always test in Chat first** before using Composer
2. **Review YOLO changes** before committing
3. **Use Debug Mode** for complex issues
4. **Leverage @Codebase** for cross-language work
5. **Query MCP** before guessing schema
6. **Apply rules contextually** by editing relevant files

---

## 📚 Related Files

- **Modular Rules**: `.cursor/rules/*.mdc`
- **Debug Rules**: `.cursor/rules/005-bridge-debugging.mdc`
- **MCP Config**: `.cursor/mcp-config.json`
- **Session Summary**: `SESSION_SUMMARY.md`

---

**Master these workflows to achieve full agentic architecture!** 🚀
