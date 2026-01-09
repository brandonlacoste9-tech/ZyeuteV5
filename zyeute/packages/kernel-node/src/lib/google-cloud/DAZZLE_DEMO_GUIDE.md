# 🎯 Dazzle Demo - Google ADK + BigQuery Integration

**Purpose:** Showcase the "Bilingual Hive" for the Tuesday meeting  
**Duration:** ~2 minutes  
**Impact:** Demonstrates native Google integration + sovereign reasoning

---

## 🎬 What This Demo Shows

1. **Google ADK** - Native GCP operations with BigQuery
2. **Hybrid Routing** - Smart agent selection (ADK vs. Llama 4 Maverick)
3. **Real-Time Telemetry** - BigQuery streaming
4. **Compute Continuum** - Local to cloud seamless scaling

---

## 🚀 Running the Demo

### Quick Start

```bash
cd zyeute/packages/kernel-node
npm install
npx tsx google-cloud/dazzle-demo.ts
```

### With Environment Variables

```bash
# Set Google Cloud credentials
export GOOGLE_CLOUD_PROJECT=zyeutev5
export GOOGLE_APPLICATION_CREDENTIALS=path/to/credentials.json

# Run demo
npx tsx google-cloud/dazzle-demo.ts
```

---

## 📊 Demo Flow

### Step 1: Google ADK - BigQuery Analysis

- **Agent:** Google ADK (Gemini 2.0 Flash)
- **Action:** Analyzes 24-hour telemetry data
- **Result:** Shows total tasks, response times, active units
- **Logs:** Streamed to BigQuery

### Step 2: Hybrid Routing

- **Task 1:** GCP operation → Routes to Google ADK
- **Task 2:** Security analysis → Routes to Llama 4 Maverick
- **Shows:** Intelligent agent selection

### Step 3: Real-Time Telemetry

- **Action:** Streams live telemetry to BigQuery
- **Events:** Queen, SWAT-Elite, Infantry activities
- **Result:** Real-time dashboard-ready data

### Step 4: Compute Continuum

- **Local:** Windows MCP (your laptop)
- **Cloud:** Google ADK (Cloud Run)
- **Shows:** Seamless scaling without code changes

---

## 💡 Key Talking Points for Tuesday

### 1. "Bilingual Hive"

> "We've built a system that speaks both 'Sovereign' (local/open-source) and 'Enterprise' (Google native). The routing is automatic—the best agent for each task."

### 2. "Compute Continuum"

> "A task can start on your laptop with Windows MCP and instantly scale to 1,000 workers on GKE without skipping a beat. No code changes required."

### 3. "Real-Time Intelligence"

> "Every action is logged to BigQuery in real-time. You can query the entire history of the Colony OS in seconds."

### 4. "Native Integration"

> "We're not just using Google Cloud—we're using Google's native agent framework (ADK) alongside our sovereign reasoning engine (Llama 4 Maverick)."

---

## 🎯 Expected Output

```
🎯 ========================================
   DAZZLE DEMO - BILINGUAL HIVE
   Google ADK + Llama 4 Maverick
========================================

📊 [DEMO 1] Google ADK - BigQuery Analysis
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
✅ Google ADK completed BigQuery analysis
   Response: [Analysis results]...

🔄 [DEMO 2] Hybrid Routing - Smart Agent Selection
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   Task 1: GCP Operation → Google ADK
   Task 2: Security Analysis → Llama 4 Maverick
✅ Hybrid routing demonstrated

📡 [DEMO 3] Real-Time Telemetry Stream to BigQuery
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   📊 Logged: QUEEN - Directive received...
   📊 Logged: SWAT-ELITE - Tool call...
   📊 Logged: INFANTRY - Task completed...
✅ Telemetry streamed to BigQuery

🚀 [DEMO 4] Compute Continuum - Local to Cloud
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
   🖥️  Local: Windows MCP
   ☁️  Cloud: Google ADK (Cloud Run)
   ✅ Seamless transition

📊 ========================================
   DEMO SUMMARY
========================================
   Duration: 2341ms
   Steps Completed: 4
   BigQuery Logs: 4
========================================
```

---

## 🛡️ Troubleshooting

### Google ADK Not Available

- **Symptom:** "Google ADK not available" warnings
- **Fix:** Install `google-adk` or demo will show graceful fallback

### BigQuery Connection Issues

- **Symptom:** "Failed to log to BigQuery"
- **Fix:** Check `GOOGLE_APPLICATION_CREDENTIALS` and project ID

### Missing Environment Variables

- **Symptom:** Demo fails with undefined errors
- **Fix:** Set `GOOGLE_CLOUD_PROJECT` in `.env`

---

## 🎬 For the Meeting

1. **Start with Demo 1** - Shows native Google integration
2. **Highlight Demo 2** - Emphasizes intelligent routing
3. **Show Demo 3** - Real-time telemetry is impressive
4. **End with Demo 4** - Compute Continuum is the "wow" factor

**Total time:** ~2 minutes  
**Impact:** Shows you're not just using Google Cloud—you're building on it.

---

**Ready to dazzle, Beekeeper.** 🎯👑🦙
