# 🔄 Switching to New Google Cloud Account

**Status:** New account activated with $1,778 credits  
**Old Account:** `unique-spirit-482300-s4` (suspended)  
**New Account:** [To be determined]

---

## 🎯 Quick Switch Steps

### Step 1: List All Projects

```powershell
gcloud projects list
```

### Step 2: Switch to New Project

```powershell
# Replace NEW_PROJECT_ID with your new project ID
gcloud config set project NEW_PROJECT_ID
```

### Step 3: Verify Switch

```powershell
gcloud config get-value project
```

---

## 🚀 Deployment Commands (Updated for New Project)

Once you have the new project ID, update these commands:

### 1. Enable APIs

```powershell
$newProjectId = "YOUR_NEW_PROJECT_ID"
gcloud services enable run.googleapis.com --project=$newProjectId
gcloud services enable container.googleapis.com --project=$newProjectId
gcloud services enable secretmanager.googleapis.com --project=$newProjectId
gcloud services enable bigquery.googleapis.com --project=$newProjectId
gcloud services enable aiplatform.googleapis.com --project=$newProjectId
```

### 2. Create Secret Manager Secret

```powershell
cd zyeute\packages\kernel-node
gcloud secrets create COLONY_NECTAR `
    --replication-policy="automatic" `
    --project=$newProjectId

gcloud secrets versions add COLONY_NECTAR `
    --data-file=".env" `
    --project=$newProjectId
```

### 3. Create BigQuery Dataset

```powershell
bq mk --dataset --location=US --project_id=$newProjectId colony_telemetry
```

### 4. Deploy Queen Bee

```powershell
cd zyeute\packages\kernel-node
gcloud run deploy queen-bee `
  --source . `
  --region us-central1 `
  --allow-unauthenticated `
  --set-secrets="DATABASE_URL=COLONY_NECTAR:latest,SUPABASE_SERVICE_KEY=COLONY_NECTAR:latest" `
  --project=$newProjectId
```

---

## 💰 Credit Status

- **Available:** $1,778 credits
- **Used:** $0 (0%)
- **Status:** Active and ready to use

---

**Next:** Get your new project ID and we'll update all commands!
