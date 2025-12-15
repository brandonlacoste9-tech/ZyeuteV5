# 🔗 Issue Dependency Map Template

Visual and textual representation of issue dependencies for efficient fix ordering.

## 📊 Dependency Graph Format

### Text-Based Dependency Tree

```
ROOT ISSUES (No dependencies)
├─ Issue #10: Supabase env vars not loading
│  └─ blocks → Issue #11: Supabase client initialization
│     ├─ blocks → Issue #12: Login form submission
│     │  └─ blocks → Issue #13: User authentication
│     │     └─ blocks → Issue #14: Guest mode redirect
│     └─ blocks → Issue #15: Signup form submission
│
├─ Issue #20: Hardcoded API key (INDEPENDENT)
│
└─ Issue #21: Mobile CSS layout (INDEPENDENT)
   └─ blocks → Issue #22: Responsive navigation
```

### Priority-Based View

```
CRITICAL PATH (Must complete in order):
1. #10 (env vars) → 2. #11 (client) → 3. #12 (form) → 4. #13 (auth)

PARALLEL TRACKS (Can work simultaneously):
Track A: #10 → #11 → #12 → #13 → #14
Track B: #20 (security) [INDEPENDENT]
Track C: #21 → #22 (UI improvements)
```

---

## 🎯 Dependency Matrix

| Issue | Depends On | Blocks | Priority | Can Start When |
|-------|-----------|--------|----------|----------------|
| #10 | None | #11, #15 | CRITICAL | Immediately |
| #11 | #10 | #12, #13 | CRITICAL | After #10 |
| #12 | #11 | #13 | CRITICAL | After #11 |
| #13 | #11, #12 | #14 | CRITICAL | After #11 & #12 |
| #14 | #13 | None | CRITICAL | After #13 |
| #20 | None | None | HIGH | Immediately |
| #21 | None | #22 | MEDIUM | Immediately |
| #22 | #21 | None | MEDIUM | After #21 |

---

## 🚀 Optimal Fix Order (Critical Path Method)

### Phase 1: Foundation (Parallel start)
```
Day 1, Hour 0:
┌─────────────────────────────────┐
│ START IMMEDIATELY (Root issues) │
└─────────────────────────────────┘
  │
  ├─ Developer A: Issue #10 (30 min)
  ├─ Developer B: Issue #20 (1 hour)
  └─ Developer C: Issue #21 (2 hours)
```

### Phase 2: Dependencies Unlock
```
Day 1, Hour 1:
┌─────────────────────────────────┐
│ After #10 completes:            │
└─────────────────────────────────┘
  │
  └─ Developer A: Issue #11 (1 hour)
     Wait for merge and deploy
```

### Phase 3: Core Features
```
Day 1, Hour 2:
┌─────────────────────────────────┐
│ After #11 completes:            │
└─────────────────────────────────┘
  │
  ├─ Developer A: Issue #12 (1-2 hours)
  │
  └─ Meanwhile:
     ├─ Developer B: Finish #20
     └─ Developer C: Start #22 (after #21)
```

### Phase 4: Dependent Features
```
Day 1, Hour 4:
┌─────────────────────────────────┐
│ After #11 & #12 complete:       │
└─────────────────────────────────┘
  │
  └─ Developer A: Issue #13 (2 hours)
```

### Phase 5: Final Features
```
Day 1, Hour 6:
┌─────────────────────────────────┐
│ After #13 completes:            │
└─────────────────────────────────┘
  │
  └─ Developer A: Issue #14 (1 hour)
```

---

## 📋 Example: Login Flow Dependencies

### Scenario: Login Page Completely Broken

**Root Cause Analysis:**
```
LOGIN NOT WORKING
│
├─ Symptom 1: No API connection
│  └─ Root: #10 Env vars not loaded
│     └─ Fix: Update .env configuration
│
├─ Symptom 2: Client throws error
│  └─ Root: #11 Supabase client not initialized
│     └─ Depends on: #10 (needs env vars)
│     └─ Fix: Initialize client with env vars
│
├─ Symptom 3: Form doesn't submit
│  └─ Root: #12 onClick handler missing
│     └─ Depends on: #11 (needs working client)
│     └─ Fix: Add form submit handler
│
└─ Symptom 4: Auth fails
   └─ Root: #13 Auth logic broken
      └─ Depends on: #11, #12
      └─ Fix: Implement proper auth flow
```

**Dependency Chain:**
```
#10 (env) → #11 (client) → #12 (form) → #13 (auth)
  └─ 30m     └─ 1h          └─ 1-2h      └─ 2h

Total Sequential Time: 4.5-5.5 hours
Cannot be parallelized (strict dependency chain)
```

---

## 🔄 Circular Dependency Detection

### How to Identify Circular Dependencies

❌ **BAD - Circular Dependency:**
```
Issue #30: Auth needs Database
  └─ depends on → Issue #31: Database needs Auth
       └─ depends on → Issue #30: Auth needs Database
```

✅ **GOOD - Broken Circular Dependency:**
```
Issue #30: Auth base implementation (no DB)
  └─ enables → Issue #31: Database with auth
       └─ enables → Issue #32: Auth with DB storage
```

**Resolution Strategy:**
1. Identify the cycle
2. Find the smallest piece that can work independently
3. Split into phases (base → integration)
4. Add intermediate issues if needed

---

## 🎯 Blocker Resolution Priority

### When Multiple Issues Block Same Target

**Example:**
```
Issue #50: User Dashboard
  ├─ blocked by: #10 (env vars) - CRITICAL
  ├─ blocked by: #13 (auth) - CRITICAL
  └─ blocked by: #40 (API endpoint) - HIGH
```

**Resolution Order:**
1. Fix #10 first (blocks #13 also)
2. Fix #13 second (blocks dashboard)
3. Fix #40 third (now dashboard can work)

**Priority Rule:**
- Fix issues that block the MOST other issues first
- #10 blocks #11, #13, #50 → Fix first
- #13 blocks #50 only → Fix second
- #40 blocks #50 only → Fix third

---

## 📊 Dependency Metrics

### Key Metrics to Track

**Blocking Score:**
```
Issue #10: Blocks 5 other issues → Score: 5 (High priority)
Issue #20: Blocks 0 other issues → Score: 0 (Can defer)
Issue #13: Blocks 2 other issues → Score: 2 (Medium priority)
```

**Depth Score:**
```
Issue #10: 0 dependencies → Depth: 0 (Can start now)
Issue #11: 1 dependency (#10) → Depth: 1 (Start after 1)
Issue #13: 2 dependencies (#11, #12) → Depth: 2 (Start after 2)
```

**Critical Path Length:**
```
Longest chain: #10 → #11 → #12 → #13 → #14
Length: 5 issues
Total time: 5.5-7 hours
This is the MINIMUM project completion time
```

---

## 🛠️ Creating Your Dependency Map

### Step-by-Step Process

#### 1. List All Issues
```markdown
- [ ] Issue #10: Supabase env vars
- [ ] Issue #11: Supabase client init
- [ ] Issue #12: Login form submit
- [ ] Issue #13: User authentication
- [ ] Issue #14: Guest mode redirect
- [ ] Issue #20: Hardcoded API key
- [ ] Issue #21: Mobile layout
```

#### 2. Identify Dependencies
For each issue, ask:
- What must be done before this can start?
- What is waiting for this to finish?

#### 3. Create Dependency List
```markdown
Issue #10:
- Depends on: None
- Blocks: #11, #15

Issue #11:
- Depends on: #10
- Blocks: #12, #13

Issue #12:
- Depends on: #11
- Blocks: #13
```

#### 4. Draw Visual Tree
```
#10 (root)
├─ #11
│  ├─ #12
│  │  └─ #13
│  │     └─ #14
│  └─ #15
└─ (other branches)
```

#### 5. Determine Fix Order
```
1. #10 (no deps, blocks many)
2. #11 (after #10)
3. #12 (after #11)
4. #13 (after #11 & #12)
5. #14 (after #13)
```

#### 6. Update GitHub Issues
In each issue, add:
```markdown
## 🔗 Related Issues
- Depends on: #10, #11
- Blocks: #14, #15
- Related to: #20
```

#### 7. Link in GitHub
Use "Link issue" feature to create visual connections in the GitHub UI.

---

## 📋 Template for Issue Dependency Section

Copy this into each GitHub issue:

```markdown
## 🔗 Dependencies

### Blocked By (Must complete first)
- [ ] Issue #XX: [Title] - [Status]
- [ ] Issue #YY: [Title] - [Status]

### Blocks (Waiting on this)
- Issue #ZZ: [Title]
- Issue #AA: [Title]

### Related (Similar/Connected)
- Issue #BB: [Title]

### Dependency Notes
[Any special considerations about dependencies]

### Can Start When
- All blocking issues (#XX, #YY) are merged to main
- [Any other prerequisites]
```

---

## 🔍 Dependency Verification Checklist

Before starting work on an issue:

- [ ] All "Blocked By" issues are closed
- [ ] All "Blocked By" PRs are merged
- [ ] Changes deployed to staging/dev environment
- [ ] Dependencies verified working
- [ ] No circular dependencies detected
- [ ] Team notified of dependency completion

---

## 📊 Sample Complete Dependency Map

```markdown
# Zyeuté V3 Audit Findings - Dependency Map

## Critical Path (Must complete sequentially)
Time: 5.5 hours minimum

Issue #10: Env vars not loading (30m)
  └─ Issue #11: Supabase client init (1h)
     └─ Issue #12: Login form submit (1-2h)
        └─ Issue #13: User auth (2h)
           └─ Issue #14: Guest mode (1h)

## Parallel Track 1 (Security - Independent)
Time: 1 hour

Issue #20: Hardcoded API keys (1h)
  └─ No dependencies, can start immediately

## Parallel Track 2 (UI - Independent)
Time: 5 hours

Issue #21: Mobile layout (2h)
  └─ Issue #22: Responsive nav (3h)

## Bottleneck Analysis
- Issue #11 (Supabase client) blocks 4 other issues
- Priority: Fix #11 ASAP after #10
- Recommendation: Assign to senior developer

## Team Assignment Recommendation
- Developer A: Critical Path (#10 → #11 → #12 → #13 → #14)
- Developer B: Security Track (#20)
- Developer C: UI Track (#21 → #22)

Estimated parallel completion: 5.5 hours (Critical Path)
Estimated sequential completion: 11.5 hours (All issues one by one)

Time Saved: 6 hours (52% faster)
```

---

**Document Version:** 1.0  
**Created:** December 15, 2025  
**Use:** For organizing audit findings into optimal fix order

🎭⚜️ **Made for Zyeuté - L'app sociale du Québec**
