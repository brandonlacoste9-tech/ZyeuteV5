# 🎯 Colony Bridge E2E Test Runner

## Prerequisites (All must be running):

### ✅ Terminal 1: Frontend Dev Server
```bash
npm run dev
```
Server should be running at http://localhost:5173

### ✅ Terminal 2: Python Task Poller
```bash
cd infrastructure/colony
.\venv\Scripts\python core/task_poller.py
```
You should see: "🐝 Task Poller initializing..." and polling logs

### ✅ Terminal 3: Playwright Test
```bash
npx playwright test client/src/test/e2e/colony-bridge.spec.ts --headed
```

---

## 🧪 Test Commands

### Run all Colony Bridge tests (with browser visible):
```bash
npx playwright test client/src/test/e2e/colony-bridge.spec.ts --headed
```

### Run in debug mode (step through):
```bash
npx playwright test client/src/test/e2e/colony-bridge.spec.ts --debug
```

### Run headless (CI/CD mode):
```bash
npx playwright test client/src/test/e2e/colony-bridge.spec.ts
```

### Run a specific test:
```bash
npx playwright test client/src/test/e2e/colony-bridge.spec.ts -g "should complete full bridge cycle"
```

---

## 📊 What Gets Tested:

### Test 1: Full Bridge Cycle
✅ React app loads  
✅ SwarmDebug button is visible  
✅ Click button submits task to Supabase  
✅ Python task_poller detects task  
✅ Python processes task (2s delay)  
✅ React receives completion notification  
✅ Status indicator shows COMPLETED  

**This is the "Grand Symphony" test** - it proves every component works together.

### Test 2: Status Transitions
✅ PENDING state appears immediately  
✅ COMPLETED state appears after processing  

### Test 3: Multiple Tasks
✅ Can submit multiple tasks sequentially  
✅ Each task completes independently  

---

## ✅ Success Criteria

When you see:
```
  3 passed (30s)
```

**You have proven:**
- ✅ React App is working
- ✅ Supabase connection is working
- ✅ Python Task Poller is working
- ✅ Database reads/writes are working
- ✅ The Colony Bridge is 100% functional

---

## 🐛 Troubleshooting

### Test timeout / "Task completed" not found:
- **Check:** Is `task_poller.py` running?
- **Check:** Python terminal shows polling logs?
- **Check:** Supabase credentials in `.env.colony` are correct?

### "Test Swarm" button not found:
- **Check:** Is the frontend dev server running?
- **Check:** Did you login (or click Guest Mode)?
- **Check:** `SwarmDebug.tsx` component exists?

### Multiple tests failing:
- **Run individually** to isolate the issue:
  ```bash
  npx playwright test -g "full bridge cycle" --headed
  ```

---

## 📹 Recording Tests

To record a video of the test:
```bash
npx playwright test client/src/test/e2e/colony-bridge.spec.ts --video=on
```

Videos are saved to `test-results/`

---

## 🚀 CI/CD Integration

To run this in GitHub Actions or similar:

```yaml
- name: Start Task Poller
  run: |
    cd infrastructure/colony
    python -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    python core/task_poller.py &

- name: Run E2E Tests
  run: npx playwright test client/src/test/e2e/colony-bridge.spec.ts
```

---

**This test suite is your proof that the AI Swarm is production-ready!** 🐝✨
