# 🧪 Testing Guide - Colony OS

**Purpose:** Verify everything works before Tuesday demo

---

## 🚀 Quick Test Sequence

### Test 1: Google Cloud Setup (5 minutes)

```powershell
cd zyeute\packages\kernel-node\google-cloud
.\test-setup.ps1
```

**What it checks:**

- ✅ gcloud CLI installed
- ✅ Authentication working
- ✅ Project access
- ✅ APIs enabled
- ✅ Secret Manager ready
- ✅ Billing linked

**Expected:** All tests pass ✅

---

### Test 2: Secret Manager (2 minutes)

```powershell
# Test if secret exists
gcloud secrets describe COLONY_NECTAR

# Test if you can read it (will show first line only)
gcloud secrets versions access latest --secret=COLONY_NECTAR | Select-Object -First 1
```

**Expected:** Secret exists and is readable ✅

---

### Test 3: Local SwarmOrchestrator (5 minutes)

```powershell
cd zyeute\packages\kernel-node
npm install
npm run build
npx tsx src/examples/test-swarm.ts
```

**What it tests:**

- ✅ SwarmOrchestrator initializes
- ✅ MCP tools are registered
- ✅ Can execute a simple directive
- ✅ Tool execution works

**Expected:** Mission completes successfully ✅

---

### Test 4: Simple Tool Execution (2 minutes)

```typescript
// Quick test: Can we list tools?
import { mcpClient } from "./lib/mcp/client-bridge.js";

const tools = await mcpClient.listAllTools();
console.log(`✅ Found ${tools.length} tools`);
```

**Expected:** 22 tools listed ✅

---

## 🎯 What to Test

### Basic Functionality

- [ ] SwarmOrchestrator initializes
- [ ] MCP tools are registered (22 tools)
- [ ] Can execute simple directive
- [ ] Tool execution works
- [ ] Telemetry is generated

### Google Cloud Integration

- [ ] APIs are enabled
- [ ] Secret Manager accessible
- [ ] Can read secrets
- [ ] BigQuery connection works (if configured)

### Security

- [ ] Restricted paths work
- [ ] Consensus alerts trigger
- [ ] No credential leaks

---

## 🐛 Troubleshooting

### Issue: "gcloud not found"

**Fix:** Install Google Cloud SDK

- Download: https://cloud.google.com/sdk/docs/install
- Or use: `winget install Google.CloudSDK`

### Issue: "APIs not enabled"

**Fix:** Run enable script

```powershell
.\enable-all-apis.ps1
```

### Issue: "Secret not found"

**Fix:** Run secret setup

```powershell
.\secret-manager-setup.ps1
```

### Issue: "Tool execution fails"

**Fix:** Check environment variables

- `GROQ_API_KEY` set?
- `LLAMA_STACK_URL` correct?
- llama-stack server running?

---

## ✅ Success Criteria

**All tests pass if:**

- ✅ Google Cloud setup verified
- ✅ Secret Manager working
- ✅ SwarmOrchestrator executes missions
- ✅ Tools are accessible
- ✅ No errors in logs

---

## 🎯 Next Steps After Tests Pass

1. **Deploy to Cloud Run:**

   ```powershell
   .\cloud-run-deploy.sh
   ```

2. **Test Cloud Run endpoint:**

   ```powershell
   curl https://queen-bee-$PROJECT_ID.a.run.app/health
   ```

3. **Execute first mission:**
   ```powershell
   curl -X POST https://queen-bee-$PROJECT_ID.a.run.app/execute `
     -H "Content-Type: application/json" `
     -d '{"directive": "List files in current directory"}'
   ```

---

**Run the tests and let's see what works!** 🧪👑🦙
