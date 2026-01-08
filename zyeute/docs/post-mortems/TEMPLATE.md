# Post-Mortem Template

Use this template for documenting bug fixes and root cause analysis.

---

## Post-Mortem: [Bug Name]

**Date**: [YYYY-MM-DD]  
**Severity**: Low | Medium | High | Critical  
**Status**: Fixed | Mitigated | Investigation  
**Component**: Bridge | Database | AI Router | Synapse | Other

---

## SYMPTOMS

[Describe observable symptoms]
- [Symptom 1]
- [Symptom 2]
- [Symptom 3]

---

## ROOT CAUSE

[Primary cause identified]

### Technical Root Cause
[Specific technical issue]

### Contributing Factors
[Additional factors that contributed]

---

## HYPOTHESIS

[Initial hypotheses generated]
- Hypothesis 1: [Description]
- Hypothesis 2: [Description]
- Hypothesis 3: [Description]

### Hypothesis Validation
[How hypothesis was validated]
- [Validation method 1]
- [Validation method 2]

---

## EVIDENCE

[Data that proved hypothesis]

### Logs
```
[Relevant log entries]
```

### Metrics
- [Metric 1]: [Value]
- [Metric 2]: [Value]

### Stack Traces
```
[Relevant stack trace]
```

---

## FIX

[Specific fix applied]

### Changes Made
- [File 1]: [Change description]
- [File 2]: [Change description]

### Code Changes
```typescript
// Before:
[Original code]

// After:
[Fixed code]
```

### Lines Changed
- Total lines: [Number]
- Files changed: [Number]
- Targeted fix: Yes | No

---

## PREVENTION

[How to prevent recurrence]

### Immediate Prevention
- [Prevention 1]
- [Prevention 2]

### Long-term Prevention
- [Prevention 1]
- [Prevention 2]

### Rule Updates
- [Update to rule file 1]
- [Update to rule file 2]

### Test Coverage
- [Test 1 added]
- [Test 2 added]

---

## RELATED PATTERNS

[Link to related bugs or patterns]

### Related Bugs
- [Bug reference 1]
- [Bug reference 2]

### Related Patterns
- [Pattern reference 1]
- [Pattern reference 2]

### Relevant Rules
- [Rule file 1]: [Why relevant]
- [Rule file 2]: [Why relevant]

---

## LESSONS LEARNED

[Key insights]

### Technical Lessons
- [Lesson 1]
- [Lesson 2]

### Process Lessons
- [Lesson 1]
- [Lesson 2]

### Documentation Lessons
- [Lesson 1]
- [Lesson 2]

---

## DEBUGGING APPROACH

[Which debugging approach worked]

### Approach Used
- Debug Mode: Yes | No
- MCP Filesystem: Yes | No
- MCP Postgres: Yes | No
- @Codebase: Yes | No
- Other: [Description]

### Steps Taken
1. [Step 1]
2. [Step 2]
3. [Step 3]

### Time to Resolution
- [Duration] minutes/hours

---

## FOLLOW-UP ACTIONS

[Actions to take after fix]

- [ ] Update relevant rule file
- [ ] Add test coverage
- [ ] Update documentation
- [ ] Create prevention strategy
- [ ] Update BUG_PATTERNS.md

---

## METADATA

**Fixed By**: [Agent Mode | Debug Mode | Manual]  
**Fixed On**: [YYYY-MM-DD]  
**Review Date**: [YYYY-MM-DD]  
**Tags**: [tag1] [tag2] [tag3]

---

**This template ensures consistent post-mortem documentation!** 📊✨
