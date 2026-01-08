# Monthly Maintenance Protocol: Super-AI Architect State

Complete protocol for maintaining your Super-AI Architect state and preventing context drift.

---

## 🎯 Monthly Maintenance Routine

### Week 1: System Health Check

#### Day 1: Run Super-Agent Validation

**Command** (Composer with Agent Mode):
```
Execute SUPER_AGENT_VALIDATION_COMMAND.md to perform 
complete system audit. Fix any issues found and update 
documentation.
```

**Expected Duration**: 10-15 minutes  
**Success Criteria**: All validation checks pass

---

#### Day 2: Consolidate Patterns

**Command** (Chat):
```
Review @BUG_PATTERNS.md and @POST_MORTEM.md. Tell me which 
3 rules in @rules/ need to be strengthened to eliminate 
our most frequent issues. Update those rules accordingly.
```

**Expected Duration**: 15-20 minutes  
**Success Criteria**: Rules updated based on patterns

---

#### Day 3: Update MCP Configuration

**Tasks**:
- [ ] Verify Supabase connection still works
- [ ] Check GitHub token is valid (if using)
- [ ] Test MCP queries return expected results
- [ ] Update `mcp-config.json` if needed

**Command** (Chat):
```
Using MCP Postgres, verify connection and list all tables.
Using MCP Filesystem, read a sample log file.
Report MCP server status.
```

**Expected Duration**: 5 minutes  
**Success Criteria**: All MCP servers responding

---

### Week 2: Documentation Review

#### Day 1: Review Post-Mortems

**Tasks**:
- [ ] Review all post-mortems from last month
- [ ] Identify recurring patterns
- [ ] Update prevention strategies
- [ ] Archive old post-mortems (> 3 months)

**Command** (Chat):
```
Review @POST_MORTEM.md and @BUG_PATTERNS.md. Identify 
top 3 recurring issues and suggest rule updates to prevent them.
```

---

#### Day 2: Update Documentation

**Tasks**:
- [ ] Review master documentation for accuracy
- [ ] Update examples with latest patterns
- [ ] Add new workflows if discovered
- [ ] Remove deprecated information

**Command** (Chat):
```
Review @AUTONOMOUS_ARCHITECTURE_MASTER.md. Update with 
any new patterns or capabilities discovered this month.
```

---

#### Day 3: Rule Audit

**Tasks**:
- [ ] Review all 6 modular rules
- [ ] Check if rules are still relevant
- [ ] Update rules based on learnings
- [ ] Add new rules if patterns emerge

**Command** (Chat):
```
Review all files in @rules/. Check if rules are:
1. Still relevant
2. Complete
3. Enforced correctly
4. Need updates based on recent bugs

Update any rules that need improvement.
```

---

### Week 3: Agent Training

#### Day 1: Run Simulation Test

**Command**:
```bash
cd zyeute
npx tsx scripts/simulate-bug-fix-cycle.ts
```

**Purpose**: Verify agent learning cycle works  
**Expected Duration**: 2-3 minutes  
**Success Criteria**: All 8 steps complete successfully

---

#### Day 2: Test Multi-Agent Orchestration

**Command** (Composer with Agent Mode):
```
Refactor a small feature using multi-agent orchestration.
Let 3 agents try different approaches and select the best one.
Document which approach won and why.
```

**Purpose**: Verify multi-agent capabilities  
**Expected Duration**: 10-15 minutes

---

#### Day 3: Test Debug Mode

**Command** (Debug Mode):
```
Simulate a bridge timeout issue. Use Debug Mode to:
1. Generate hypotheses
2. Add instrumentation
3. Analyze logs
4. Fix root cause

Document the debugging approach used.
```

**Purpose**: Verify hypothesis-driven debugging  
**Expected Duration**: 10-15 minutes

---

### Week 4: System Optimization

#### Day 1: Performance Analysis

**Command** (Chat with MCP):
```
Using MCP Postgres, analyze query performance:
1. Find queries taking > 100ms
2. Run EXPLAIN ANALYZE on slow queries
3. Suggest index optimizations
4. Create migrations for optimal indexes
```

**Expected Duration**: 20-30 minutes  
**Success Criteria**: Queries optimized, migrations created

---

#### Day 2: Validation Script Review

**Tasks**:
- [ ] Review validation scripts for completeness
- [ ] Add checks for new patterns
- [ ] Remove obsolete checks
- [ ] Optimize script performance

**Command** (Chat):
```
Review @run-final-validation.ts. Suggest improvements:
1. Additional checks needed
2. Obsolete checks to remove
3. Performance optimizations
4. Better error messages
```

---

#### Day 3: Final Health Check

**Command** (Composer with Agent Mode):
```
Run complete system health check:
1. Run SUPER_AGENT_VALIDATION_COMMAND.md
2. Review all validation results
3. Fix any issues found
4. Update SESSION_SUMMARY.md with status
5. Generate monthly report
```

**Expected Duration**: 15-20 minutes  
**Success Criteria**: System 100% healthy

---

## 📊 Monthly Report Template

After completing maintenance, create monthly report:

```markdown
# Monthly Maintenance Report: [Month Year]

## System Health
- ✅ Validation Status: [Pass/Fail]
- ✅ MCP Servers: [All Connected]
- ✅ Rules: [All Active]
- ✅ Documentation: [Up to Date]

## Bugs Fixed
- Total: [Number]
- Critical: [Number]
- Medium: [Number]
- Low: [Number]

## Patterns Identified
- [Pattern 1]: [Frequency]
- [Pattern 2]: [Frequency]
- [Pattern 3]: [Frequency]

## Rule Updates
- [Rule 1]: [Update description]
- [Rule 2]: [Update description]

## Performance Improvements
- [Improvement 1]
- [Improvement 2]

## Next Month Priorities
- [Priority 1]
- [Priority 2]
```

---

## 🔄 Quarterly Deep Dive

Every 3 months, perform:

1. **Complete Rule Rewrite**: Review and potentially rewrite rules based on learnings
2. **MCP Expansion**: Add new MCP servers if needed
3. **Documentation Overhaul**: Major documentation review and update
4. **Agent Capability Audit**: Test all agent capabilities end-to-end

---

## ✅ Maintenance Checklist

### Weekly
- [ ] Run validation scripts
- [ ] Check for new bugs
- [ ] Review post-mortems

### Monthly
- [ ] Run super-agent validation
- [ ] Consolidate patterns
- [ ] Update MCP configuration
- [ ] Review documentation
- [ ] Update rules
- [ ] Run simulation test
- [ ] Generate monthly report

### Quarterly
- [ ] Deep rule review
- [ ] MCP expansion
- [ ] Documentation overhaul
- [ ] Complete capability audit

---

## 🎯 Success Metrics

### System Health Indicators

**Green (Optimal)**:
- ✅ All validation scripts pass
- ✅ No critical bugs in last month
- ✅ Rules updated based on patterns
- ✅ MCP servers all connected
- ✅ Documentation up to date

**Yellow (Needs Attention)**:
- ⚠️ Some validation failures
- ⚠️ Recurring bugs detected
- ⚠️ Rules need updates
- ⚠️ MCP connection issues

**Red (Critical)**:
- ❌ Validation scripts failing
- ❌ Multiple critical bugs
- ❌ Rules outdated
- ❌ MCP not working

---

## 📚 Related Files

- **Super-Agent Command**: `SUPER_AGENT_VALIDATION_COMMAND.md`
- **Bug Patterns**: `zyeute/docs/BUG_PATTERNS.md`
- **Post-Mortems**: `zyeute/docs/POST_MORTEM.md`
- **Simulation Test**: `SIMULATION_TEST_GUIDE.md`
- **Autonomy Checklist**: `AGENT_AUTONOMY_CHECKLIST.md`

---

## 🔥 Pro Tips

1. **Automate Monthly Tasks**: Use VS Code tasks or scripts
2. **Document Everything**: Update post-mortems and patterns
3. **Learn from Patterns**: Update rules based on recurring issues
4. **Test Regularly**: Run simulation test monthly
5. **Stay Current**: Keep MCP configs and documentation updated

---

**Follow this protocol to maintain Super-AI Architect state!** 🚀✨
