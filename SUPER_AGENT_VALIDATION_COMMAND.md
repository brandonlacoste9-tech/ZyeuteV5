# Super-Agent Validation Command

The ultimate validation command that leverages all your agent infrastructure capabilities.

---

## 🎯 The Command

**Run in Composer (`Cmd/Ctrl + I`) with Agent Mode enabled**:

```
Using @AUTONOMOUS_ARCHITECTURE_MASTER.md and @mcp-config.json, 
run the complete validation suite for Colony OS backend:

=== PHASE 1: DATABASE VALIDATION ===

1. Using MCP Postgres, verify live database schema:
   - Check if windows_automation_bees table exists with correct structure
   - Verify automation_tasks table has all required columns
   - Validate foreign key constraint on automation_tasks.bee_id
   - Check if indexes exist on (bee_id, status) for automation_tasks
   - Report any schema mismatches

2. Using MCP Postgres, check data integrity:
   - Find any orphaned automation_tasks (bee_id without matching bee)
   - Check for tasks stuck in 'running' status for > 1 hour
   - Verify bees with no heartbeat in > 5 minutes but status is 'running'
   - Report data quality issues

=== PHASE 2: CODE VALIDATION ===

3. Run run-final-validation.ts script:
   - Execute all validation checks
   - If any tests fail, use Debug Mode to instrument logs
   - Find root causes across both TypeScript and Python services
   - Apply fixes using appropriate modular rules

4. Using @Codebase, perform cross-language audit:
   - Find TypeScript AutomationTask interface in windows-automation-bridge.ts
   - Find Python AutomationTask Pydantic model in bridge_service.py
   - Compare field names (camelCase vs snake_case)
   - Compare types (string vs str, number vs int)
   - Check optional/required status (undefined vs None)
   - Fix any type mismatches automatically

5. Using modular rules, verify code compliance:
   - Check bridge files follow 001-bridge-protocol.mdc rules
   - Check AI router follows 002-mlops-safety.mdc rules
   - Check Synapse bridge follows 003-synapse-bridge.mdc rules
   - Check database code follows 004-database-patterns.mdc rules
   - Report any rule violations

=== PHASE 3: RUNTIME VALIDATION ===

6. Using MCP Filesystem, check for errors in logs:
   - Read Windows-Use/bridge_service.log for Python bridge errors
   - Read zyeute/backend/server.log for TypeScript errors
   - Read validation script output for test failures
   - Analyze error patterns and frequencies

7. Test Python bridge service:
   - Start Python bridge service if not running
   - Verify health endpoint responds (GET /health)
   - Test minimal handshake payload
   - Check for connection errors

8. Test TypeScript bridge client:
   - Verify bridge client can connect to Python service
   - Test task execution endpoint
   - Check for timeout or serialization errors

=== PHASE 4: AUTO-FIX & VALIDATION ===

9. If any issues found in Phases 1-3:
   - Use Debug Mode to instrument problematic code
   - Form hypotheses for each issue
   - Add logging to prove root causes
   - Apply targeted fixes (not broad changes)
   - Re-run validation for each fix

10. Cross-validate fixes:
    - Verify fixes don't break other components
    - Check type safety after fixes
    - Ensure database constraints still valid
    - Confirm bridge communication still works

=== PHASE 5: DOCUMENTATION ===

11. Update documentation:
    - Update SESSION_SUMMARY.md with validation results
    - Document any fixes applied
    - List any remaining warnings
    - Record performance metrics

12. Report final status:
    - ✅ List all checks that passed
    - ⚠️  List any warnings (non-critical)
    - ❌ List any failures (if any)
    - 📊 Overall health score (pass rate)
    - 🎯 Production readiness status

=== SUCCESS CRITERIA ===

System is 100% production ready when:
- ✅ All database checks pass
- ✅ All code validation passes
- ✅ Type matching is perfect
- ✅ Bridge communication works
- ✅ No critical errors in logs
- ✅ All modular rules followed
- ✅ Documentation updated

Execute this validation and report results.
```

---

## 🚀 How to Run

### Step 1: Open Composer

Press `Cmd/Ctrl + I` to open Composer

### Step 2: Enable Agent Mode

1. Click **Agent Mode** toggle
2. Select **Claude 3.5 Sonnet** (or o1-mini for complex reasoning)

### Step 3: Paste Command

Copy the full command from above and paste into Composer

### Step 4: Execute

Click "Generate" or press Enter

### Step 5: Monitor

Watch as the agent:
1. Queries database via MCP
2. Runs validation scripts
3. Performs cross-language audits
4. Checks logs via Filesystem MCP
5. Fixes issues autonomously
6. Updates documentation

---

## 📊 Expected Output

### Success Scenario

```
=== PHASE 1: DATABASE VALIDATION ===
✅ windows_automation_bees: Table exists, structure correct
✅ automation_tasks: Table exists, all columns present
✅ Foreign key constraint: Valid
✅ Index on (bee_id, status): Exists
✅ Data integrity: No orphaned records found

=== PHASE 2: CODE VALIDATION ===
✅ run-final-validation.ts: All checks passed
✅ TypeScript AutomationTask: 5 fields
✅ Python AutomationTask: 5 fields
✅ Type matching: Perfect match (all fields compatible)
✅ Bridge protocol rules: Compliant
✅ MLOps safety rules: Compliant
✅ Synapse bridge rules: Compliant
✅ Database patterns: Compliant

=== PHASE 3: RUNTIME VALIDATION ===
✅ Python bridge: Running, health endpoint responds
✅ TypeScript client: Connected, task execution works
✅ Logs: No critical errors found
✅ Handshake: Success, latency < 100ms

=== PHASE 4: AUTO-FIX & VALIDATION ===
✅ No issues found, no fixes needed

=== PHASE 5: DOCUMENTATION ===
✅ SESSION_SUMMARY.md updated with SUCCESS status

=== FINAL STATUS ===
✅ Passed: 18 checks
⚠️  Warnings: 0
❌ Failed: 0
📊 Health Score: 100%
🎯 Production Ready: YES

🎉 SYSTEM IS 100% PRODUCTION READY!
```

---

## 🔧 What Gets Fixed Automatically

### Database Issues
- Missing tables → Applies migrations
- Schema mismatches → Updates schema
- Missing indexes → Creates indexes
- Data quality issues → Reports for cleanup

### Code Issues
- Type mismatches → Fixes both sides
- Rule violations → Applies correct patterns
- Missing validation → Adds checks
- Error handling gaps → Improves resilience

### Runtime Issues
- Service not running → Starts service
- Connection errors → Fixes configuration
- Timeout issues → Adjusts timeouts
- Log errors → Fixes root causes

---

## 🎯 Success Criteria

System is production-ready when:

- ✅ All database checks pass
- ✅ All code validation passes  
- ✅ Type matching is perfect
- ✅ Bridge communication works
- ✅ No critical errors in logs
- ✅ All modular rules followed
- ✅ Documentation updated

---

## 📚 Related Files

- **Master Guide**: `AUTONOMOUS_ARCHITECTURE_MASTER.md`
- **Agent Training**: `AGENT_TRAINING_GUIDE.md`
- **Validation Script**: `zyeute/scripts/run-final-validation.ts`
- **File Watcher**: `zyeute/scripts/watch-and-validate.ts`

---

**This is your ultimate production readiness check!** 🚀✨
