# Simulation Test Guide: Post-Mortem → Fix → Rule Update Cycle

Complete guide to running the simulation test that demonstrates the full agent learning cycle.

---

## 🎯 What This Simulation Tests

This simulation demonstrates the complete **Continuous Learning Architecture**:

1. **Bug Introduction** - Controlled type mismatch bug
2. **Detection** - Validation script detects the bug
3. **Documentation** - Post-mortem entry created
4. **Fix** - Bug fixed automatically
5. **Validation** - Re-run validation confirms fix
6. **Pattern Update** - Bug patterns updated
7. **Restoration** - Original files restored

---

## 🚀 How to Run

### Quick Run (Automated)

```bash
cd zyeute
npx tsx scripts/simulate-bug-fix-cycle.ts
```

**Duration**: ~2-3 minutes  
**Result**: Complete cycle demonstration

---

## 📋 What Happens

### Step 1: Backup Original Files
- Creates `.backup` files for bridge and Python service
- Ensures we can restore after simulation

### Step 2: Introduce Controlled Bug
- Changes TypeScript field name: `timeout` → `timeoutMs`
- Python model stays the same (creates mismatch)
- Bug: TypeScript and Python don't match

### Step 3: Run Validation (Should Fail)
- Runs `run-final-validation.ts`
- Validation detects type mismatch
- Reports failure correctly

### Step 4: Document Post-Mortem
- Creates `zyeute/docs/post-mortems/2024-01-15-simulation-type-mismatch.md`
- Documents symptoms, root cause, hypothesis, evidence
- Creates prevention strategies

### Step 5: Fix the Bug
- Restores TypeScript to original
- Updates Python to accept both field names (using Pydantic alias)
- Ensures compatibility

### Step 6: Re-Run Validation (Should Pass)
- Runs validation again
- Confirms fix worked
- All checks pass

### Step 7: Update Bug Patterns
- Updates `BUG_PATTERNS.md`
- Increments Pattern 2 frequency
- Documents the occurrence

### Step 8: Restore Original Files
- Restores from backups
- Cleans up simulation changes
- System back to original state

---

## ✅ Expected Output

```
🚀 Starting Post-Mortem → Fix → Rule Update Simulation

============================================================
AGENT LEARNING CYCLE DEMONSTRATION
============================================================

📦 Step 1: Backing up original files...
✅ Step 1: Backup original files
   Backups created

🐛 Step 2: Introducing controlled bug (type mismatch)...
✅ Step 2: Introduce controlled bug
   Bug introduced: TypeScript uses 'timeoutMs', Python uses 'timeout'

🔍 Step 3: Running validation (should detect bug)...
✅ Step 3: Run validation (should fail)
   Validation correctly detected type mismatch

📝 Step 4: Documenting post-mortem...
✅ Step 4: Document post-mortem
   Post-mortem documented

🔧 Step 5: Fixing the bug...
✅ Step 5: Fix the bug
   Bug fixed: Python now accepts both 'timeout' and 'timeoutMs'

✅ Step 6: Re-running validation (should pass)...
✅ Step 6: Re-run validation (should pass)
   Validation passed after fix

📊 Step 7: Updating bug patterns...
✅ Step 7: Update bug patterns
   Bug patterns updated

🔄 Step 8: Restoring original files...
✅ Step 8: Restore original files
   Original files restored

============================================================
📊 SIMULATION REPORT
============================================================

✅ Completed: 8/8
❌ Failed: 0/8

✅ Backup original files
✅ Introduce controlled bug
✅ Run validation (should fail)
✅ Document post-mortem
✅ Fix the bug
✅ Re-run validation (should pass)
✅ Update bug patterns
✅ Restore original files

============================================================
🎉 SIMULATION SUCCESSFUL!
   Post-Mortem → Fix → Rule Update cycle demonstrated.
```

---

## 🔍 What This Proves

### Agent Learning Cycle Works

1. ✅ **Detection**: Agents can detect bugs via validation
2. ✅ **Documentation**: Post-mortem rule enforces documentation
3. ✅ **Fixing**: Agents can fix bugs automatically
4. ✅ **Validation**: Fixes are verified
5. ✅ **Learning**: Patterns are tracked and updated
6. ✅ **Prevention**: Prevention strategies are created

### Continuous Learning Architecture

1. ✅ **Bug Tracking**: Bugs are documented
2. ✅ **Pattern Recognition**: Patterns are identified
3. ✅ **Prevention**: Strategies prevent recurrence
4. ✅ **Rule Updates**: Rules improve over time

---

## 🎯 Real-World Usage

### After Running Simulation

The simulation creates:
- ✅ Post-mortem entry: `zyeute/docs/post-mortems/2024-01-15-simulation-type-mismatch.md`
- ✅ Updated patterns: `BUG_PATTERNS.md` (frequency incremented)
- ✅ Demonstration: Full cycle works end-to-end

### Use This Pattern For

- ✅ Testing agent capabilities
- ✅ Demonstrating learning cycle
- ✅ Validating post-mortem system
- ✅ Training new team members
- ✅ Verifying system health

---

## 🚨 Troubleshooting

### Issue: Validation Doesn't Detect Bug

**Fix**: Check that validation script includes type comparison logic

---

### Issue: Post-Mortem Not Created

**Fix**: Verify `zyeute/docs/post-mortems/` directory exists

---

### Issue: Files Not Restored

**Fix**: Check that backup files were created successfully

---

## 📊 Success Criteria

Simulation is successful when:

- ✅ All 8 steps complete
- ✅ Bug detected correctly
- ✅ Post-mortem documented
- ✅ Bug fixed automatically
- ✅ Validation passes after fix
- ✅ Patterns updated
- ✅ Files restored

---

## 🔄 Running Multiple Times

The simulation is **idempotent** - you can run it multiple times:

- Each run creates a new post-mortem entry
- Patterns are updated each time
- Files are restored after each run
- Safe to run repeatedly

---

## 📚 Related Files

- **Simulation Script**: `zyeute/scripts/simulate-bug-fix-cycle.ts`
- **Post-Mortem Template**: `zyeute/docs/post-mortems/TEMPLATE.md`
- **Bug Patterns**: `zyeute/docs/BUG_PATTERNS.md`
- **Post-Mortem Rule**: `.cursor/rules/006-post-mortem-documentation.mdc`

---

## 🎉 What You've Demonstrated

By running this simulation, you've proven:

1. ✅ **Agents can detect bugs** - Via validation
2. ✅ **Agents can document fixes** - Via post-mortem rule
3. ✅ **Agents can fix bugs** - Automatically
4. ✅ **Agents can learn** - Via pattern tracking
5. ✅ **Agents can prevent** - Via rule updates

**Your agents have achieved true continuous learning!** 🚀✨

---

**Run the simulation to see your agents in action!** 🎬
