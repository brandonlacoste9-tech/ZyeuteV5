# 🎯 5-Hour "Palace" Launch Plan - Tonight

**Objective:** Launch Zyeuté V5 as the flagship application of Colony OS  
**Timeline:** 9:00 PM - 2:00 AM  
**Account:** Google Cloud Account 1 (The Palace)

---

## 🏛️ BLOCK 1: The Coronation (9:00 PM - 10:30 PM)

### Mission: Enshrine the Vault and Deploy the Queen

#### Step 1: Verify Setup

- [ ] Check `GOOGLE_CLOUD_PROJECT` is set to Account 1
- [ ] Verify credits are available ($1,778.34)
- [ ] Authenticate: `gcloud auth login`

#### Step 2: Enshrine the Royal Vault

```powershell
cd zyeute\packages\kernel-node\google-cloud
.\secret-manager-setup.ps1
```

- [ ] Verify `COLONY_NECTAR` secret created
- [ ] Confirm `.env` content is in Secret Manager
- [ ] Test secret access: `gcloud secrets versions access latest --secret=COLONY_NECTAR`

#### Step 3: Deploy Queen Bee

```powershell
.\quick-start-credits.ps1
# Choose option 7 (All-In)
```

- [ ] APIs enabled (Cloud Run, Secret Manager, BigQuery, Vertex AI)
- [ ] BigQuery dataset `colony_telemetry` created
- [ ] Cloud Run service `queen-bee` deployed
- [ ] Health endpoint returns 200: `https://queen-bee-*.a.run.app/health`

#### Success Metric

✅ **Emerald Glow:** You see the Cloud Run URL in terminal  
✅ **Health Check:** `/health` returns `{"status": "healthy"}`

---

## 🎬 BLOCK 2: Zyeuté Engine Sync (10:30 PM - 12:00 AM)

### Mission: Link Zyeuté Video Bee to Orchestrator

#### Step 1: Create Video Bee Integration

**Cursor Command:**

```
Integrate the Zyeuté V5 video generation engine with the SwarmOrchestrator.
Create a mission route where the Queen can assign a 'Video-Render' task to a
Zyeuté worker Bee. The task should:
1. Accept a prompt from the Queen
2. Call FAL API for video generation
3. Store result in Supabase
4. Log to BigQuery
5. Return video URL to Queen
```

#### Step 2: Deploy Siege Engines to GKE

```powershell
# Build and push Docker image
cd zyeute\packages\kernel-node
gcloud builds submit --tag gcr.io/YOUR_PROJECT_ID/zyeute-video-bee:latest

# Deploy to GKE Autopilot
gcloud container clusters create-auto colony-cluster `
  --region us-central1 `
  --project YOUR_PROJECT_ID

# Apply deployment
kubectl apply -f google-cloud/zyeute-siege-engines.yaml
```

- [ ] GKE Autopilot cluster created
- [ ] Video Bee deployment running (2 replicas)
- [ ] Service accessible via LoadBalancer
- [ ] HPA configured (scales 2-10 replicas)

#### Step 3: Test Video Generation

**Cursor Command:**

```
Create a test task that routes through the Queen Bee to the Zyeuté Video Bee.
Generate a 5-second video with prompt "A bee flying through a digital hive"
and verify it logs to BigQuery.
```

#### Success Metric

✅ **Video Generated:** Test API call returns video URL  
✅ **BigQuery Logged:** Activity appears in `colony_telemetry.infantry_activity`  
✅ **Scaling Works:** HPA scales up when load increases

---

## 📊 BLOCK 3: Wax Ledger & Dashboard (12:00 AM - 1:30 AM)

### Mission: Real-Time Telemetry

#### Step 1: Wire Dashboard to Telemetry

**Cursor Command:**

```
Wire the Mission Control Dashboard to the Cloud Run telemetry stream.
Ensure every 'Sting' (task completion) and 'Knock' (door opening) shows up
in the 'Infantry Log' on the UI. Use WebSocket or Server-Sent Events for
real-time updates.
```

#### Step 2: Verify BigQuery Streaming

```powershell
# Query recent activity
bq query --use_legacy_sql=false "
  SELECT
    unit,
    action,
    message,
    timestamp
  FROM \`YOUR_PROJECT_ID.colony_telemetry.infantry_activity\`
  ORDER BY timestamp DESC
  LIMIT 20
"
```

- [ ] Dashboard shows real-time telemetry
- [ ] BigQuery receives logs within 5 seconds
- [ ] All bee units are logging (Queen, SWAT, Infantry)
- [ ] Error handling works (failed tasks show in logs)

#### Step 3: Test End-to-End Flow

**Cursor Command:**

```
Create a complete mission flow:
1. Queen receives directive via /execute endpoint
2. Routes to appropriate Bee (Video Bee for video tasks)
3. Bee processes and logs to BigQuery
4. Dashboard updates in real-time
5. Verify all steps are logged
```

#### Success Metric

✅ **Emerald Pulse:** Dashboard updates in real-time  
✅ **Audit Trail:** Every action logged to BigQuery  
✅ **Tuesday Ready:** Can query full history for demo

---

## 🛡️ BLOCK 4: Sovereign Shield (1:30 AM - 2:00 AM)

### Mission: Security and Graceful Shutdown

#### Step 1: Implement Sovereign Shield

**Cursor Command:**

```
Implement the 'Sovereign Shield' logic:
1. Ensure no worker nodes remain idle on Account 2 (Proving Grounds)
2. Scale down GKE clusters to 0 replicas when idle > 30 minutes
3. Encrypt all secrets in Secret Manager
4. Verify IAM permissions are least-privilege
5. Run final perimeter scan
```

#### Step 2: Security Audit

- [ ] All secrets in Secret Manager (no hardcoded keys)
- [ ] IAM roles are minimal (no overly permissive roles)
- [ ] Cloud Run service is authenticated (or public with rate limiting)
- [ ] BigQuery dataset has proper access controls
- [ ] GKE cluster has network policies

#### Step 3: Graceful Shutdown Script

```powershell
# Create shutdown script
.\google-cloud\graceful-shutdown.ps1
```

- [ ] Script scales down GKE to 0
- [ ] Cloud Run stays running (Queen Bee always available)
- [ ] BigQuery continues logging
- [ ] All services can be restarted cleanly

#### Step 4: Final Verification

- [ ] Health check: `curl https://queen-bee-*.a.run.app/health`
- [ ] Credit usage: Check billing dashboard
- [ ] Logs streaming: Query BigQuery for last 5 minutes
- [ ] Security scan: No exposed secrets

#### Success Metric

✅ **Secure:** All Nectar encrypted  
✅ **Efficient:** No idle resources consuming credits  
✅ **Ready:** System can run 24/7 or scale to zero

---

## 📋 FINAL CHECKLIST (Before 2:00 AM)

### Deployment Status

- [ ] Queen Bee deployed to Cloud Run
- [ ] Zyeuté Video Bee deployed to GKE Autopilot
- [ ] Secret Manager configured with COLONY_NECTAR
- [ ] BigQuery dataset created and streaming
- [ ] Dashboard connected to telemetry

### Functionality

- [ ] Health endpoints return 200
- [ ] Video generation works end-to-end
- [ ] Real-time dashboard updates
- [ ] BigQuery logging active
- [ ] Error handling works

### Security

- [ ] All secrets in Secret Manager
- [ ] IAM permissions minimal
- [ ] No hardcoded credentials
- [ ] Network policies configured
- [ ] Audit logs enabled

### Documentation

- [ ] Deployment URLs documented
- [ ] API endpoints documented
- [ ] Credit usage tracked
- [ ] Tuesday demo script ready

---

## 🚀 CURSOR COMMANDS FOR TONIGHT

### Block 1: Coronation

```
Beekeeper's Order: We are launching Zyeuté V5. Run the quick-start-credits.ps1
script for Option 7 (All-In) on Account 1. Verify the 'Royal Vault' is
enshrined and the 'Queen Bee' is seated on Cloud Run. Report every step in
the 'Infantry Log' style.
```

### Block 2: Engine Sync

```
Integrate the Zyeuté V5 video generation engine with the SwarmOrchestrator.
Create a mission route where the Queen can assign a 'Video-Render' task to a
Zyeuté worker Bee. Use the $410 Free Trial credits for the GKE Autopilot
worker node setup.
```

### Block 3: Dashboard

```
Wire the Mission Control Dashboard to the Cloud Run telemetry stream. Ensure
every 'Sting' (task completion) and 'Knock' (door opening) shows up in the
'Infantry Log' on the UI. Verify BigQuery is receiving these logs for the
Tuesday audit.
```

### Block 4: Security

```
Implement the 'Sovereign Shield' logic. Ensure no worker nodes remain idle on
Account 2 (Proving Grounds) while I sleep. Run a final perimeter scan to ensure
all 'Nectar' is encrypted.
```

---

## 💡 PRO TIPS

1. **Use Cursor's @-mentions:** Reference specific files with `@filename`
2. **Chain commands:** Ask Cursor to "deploy and then verify health"
3. **Monitor credits:** Check billing dashboard every hour
4. **Test incrementally:** Don't wait until the end to test
5. **Document as you go:** Note any issues or solutions

---

## 🎯 SUCCESS CRITERIA

By 2:00 AM, you should have:

- ✅ Zyeuté V5 live on Google Cloud
- ✅ Queen Bee orchestrating tasks
- ✅ Video generation working
- ✅ Real-time dashboard active
- ✅ BigQuery logging everything
- ✅ Security hardened
- ✅ Ready for Tuesday demo

---

**The Hive is ready to launch. Let's build the Empire, Beekeeper.** 🐝👑🚀
