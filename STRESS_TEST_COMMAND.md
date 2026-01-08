# Stress Test Command: Full Stack Validation

The ultimate test to verify your Cursor setup and Colony OS backend integrity.

---

## 🎯 The Stress Test

**Command** (Run in Composer with Agent Mode enabled):

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

---

## 📋 What This Tests

### ✅ Cursor Features
- **Modular Rules**: Applies bridge/debugging rules automatically
- **MCP Integration**: Queries live database
- **Agent Mode**: Autonomous multi-file editing
- **@Codebase**: Searches across entire stack
- **Cross-Language**: Understands TypeScript + Python

### ✅ Backend Components
- **Database**: Migrations applied correctly
- **Python Bridge**: Service running and responding
- **TypeScript Client**: Bridge communication working
- **Synapse Bridge**: Event system operational
- **Test Scripts**: All validations passing

---

## 🚀 How to Run

### Step 1: Enable Agent Mode
1. Press `Cmd/Ctrl + I` (Composer)
2. Select **Agent Mode**
3. Choose **Claude 3.5 Sonnet** (or o1-mini for complex reasoning)

### Step 2: Paste Stress Test Command
Copy the command above into Composer

### Step 3: Execute
Click "Generate" or press Enter

### Step 4: Monitor
Cursor will:
- Read documentation
- Query database
- Run test scripts
- Fix issues autonomously
- Update summary

---

## ✅ Expected Output

### Success Scenario
```
✅ Read SESSION_SUMMARY.md
✅ Queried Supabase via MCP - tables exist
✅ check-supabase-connection.ts - PASSED
✅ test-bridge-communication.ts - PASSED
✅ test-automation-integration.ts - PASSED
✅ All tests passing - no fixes needed
✅ Updated SESSION_SUMMARY.md with status
```

### Failure Scenario (Auto-Fixed)
```
⚠️ check-supabase-connection.ts - FAILED
   Issue: windows_automation_bees table missing
   Fix: Applied migration 0015
   Retry: PASSED

⚠️ test-bridge-communication.ts - FAILED
   Issue: Python service not responding
   Fix: Restarted Python process
   Retry: PASSED

✅ All tests passing after fixes
✅ Updated SESSION_SUMMARY.md with fixes applied
```

---

## 🔍 What Gets Fixed Automatically

### Database Issues
- Missing tables → Applies migrations
- Wrong schema → Updates Drizzle schema
- Missing indexes → Creates indexes

### Python Bridge Issues
- Service not running → Restarts service
- Type mismatches → Fixes Pydantic models
- Environment variables → Updates .env

### TypeScript Client Issues
- Type errors → Fixes interfaces
- Connection errors → Updates service URL
- Timeout issues → Adjusts timeout values

### Test Script Issues
- Import errors → Fixes imports
- Assertion failures → Updates tests
- Configuration issues → Updates config

---

## 🎯 Success Criteria

You know it worked when:

1. ✅ All validation scripts pass
2. ✅ Database tables exist and are correct
3. ✅ Python bridge responds to health checks
4. ✅ TypeScript client can execute tasks
5. ✅ SESSION_SUMMARY.md updated with current status
6. ✅ No errors in console output

---

## 🚨 Troubleshooting

### Issue: MCP Not Connecting
**Fix**: Verify `.cursor/mcp-config.json` has correct Supabase credentials

### Issue: Python Service Not Found
**Fix**: Ensure Python bridge is in `Windows-Use/` directory

### Issue: Test Scripts Not Found
**Fix**: Verify scripts are in `zyeute/scripts/` directory

### Issue: Agent Mode Not Working
**Fix**: Ensure Claude 3.5 Sonnet is selected and Agent Mode is enabled

---

## 📊 Performance Benchmarks

### Expected Duration
- **Best Case**: 2-3 minutes (all tests pass)
- **Worst Case**: 10-15 minutes (multiple fixes needed)

### Success Rate
- **First Try**: ~70% (if migrations applied)
- **After Fixes**: ~95% (if setup is correct)

---

## 🔄 Iteration Strategy

If stress test fails:

1. **First Run**: Let Agent Mode fix issues
2. **Second Run**: Verify fixes worked
3. **Manual Review**: Check any remaining issues
4. **Final Run**: Confirm all tests pass

---

## 🎉 After Success

Once stress test passes:

1. ✅ **System Verified**: All components working
2. ✅ **Setup Confirmed**: Cursor configured correctly
3. ✅ **Documentation Updated**: Current status recorded
4. ✅ **Ready for Production**: System is stable

---

**Run this stress test whenever you:**
- Complete major refactoring
- Add new features
- Update dependencies
- Before deploying to production

---

**This is your ultimate validation command!** 🚀✨
