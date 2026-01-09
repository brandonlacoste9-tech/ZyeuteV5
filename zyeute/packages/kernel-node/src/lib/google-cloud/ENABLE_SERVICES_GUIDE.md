# 🏛️ Google Cloud Services - Enable All Products Guide

**Quick Setup:** Enable all required services for Colony OS in one go

---

## 🚀 Quick Enable (Recommended - Fastest)

### Option 1: Enable via gcloud CLI (Fastest)

If you have `gcloud` installed, run this single command:

```powershell
# Enable all required APIs at once
gcloud services enable \
  run.googleapis.com \
  container.googleapis.com \
  secretmanager.googleapis.com \
  bigquery.googleapis.com \
  aiplatform.googleapis.com \
  cloudbuild.googleapis.com \
  artifactregistry.googleapis.com \
  --project=YOUR_PROJECT_ID
```

**Replace `YOUR_PROJECT_ID` with your actual project ID.**

---

## 🖱️ Option 2: Enable via Google Cloud Console (Step-by-Step)

### Step 1: Navigate to APIs & Services

1. Go to: https://console.cloud.google.com
2. Select your project (top dropdown)
3. Click **"APIs & Services"** in the left menu
4. Click **"Library"** (or go directly to: https://console.cloud.google.com/apis/library)

### Step 2: Enable Each Service

Search for and enable these services one by one:

#### 1. Cloud Run API

- **Search:** "Cloud Run API"
- **Click:** "Cloud Run API"
- **Click:** "ENABLE"
- **Status:** ✅ Enabled

#### 2. Google Kubernetes Engine API

- **Search:** "Kubernetes Engine API"
- **Click:** "Kubernetes Engine API"
- **Click:** "ENABLE"
- **Status:** ✅ Enabled

#### 3. Secret Manager API

- **Search:** "Secret Manager API"
- **Click:** "Secret Manager API"
- **Click:** "ENABLE"
- **Status:** ✅ Enabled

#### 4. BigQuery API

- **Search:** "BigQuery API"
- **Click:** "BigQuery API"
- **Click:** "ENABLE"
- **Status:** ✅ Enabled

#### 5. Vertex AI API

- **Search:** "Vertex AI API"
- **Click:** "Vertex AI API"
- **Click:** "ENABLE"
- **Status:** ✅ Enabled

#### 6. Cloud Build API

- **Search:** "Cloud Build API"
- **Click:** "Cloud Build API"
- **Click:** "ENABLE"
- **Status:** ✅ Enabled

#### 7. Artifact Registry API

- **Search:** "Artifact Registry API"
- **Click:** "Artifact Registry API"
- **Click:** "ENABLE"
- **Status:** ✅ Enabled

---

## ✅ Verification

### Check Enabled APIs

1. Go to: https://console.cloud.google.com/apis/dashboard
2. You should see all 7 APIs listed as "Enabled"

### Quick Check via gcloud

```powershell
gcloud services list --enabled --project=YOUR_PROJECT_ID
```

---

## 🔧 Required Services Summary

| Service               | API Name                          | Purpose                |
| --------------------- | --------------------------------- | ---------------------- |
| **Cloud Run**         | `run.googleapis.com`              | Deploy Queen Bee       |
| **GKE**               | `container.googleapis.com`        | Deploy Siege Engines   |
| **Secret Manager**    | `secretmanager.googleapis.com`    | Store Royal Vault      |
| **BigQuery**          | `bigquery.googleapis.com`         | Wax Ledger             |
| **Vertex AI**         | `aiplatform.googleapis.com`       | SWAT Bees grounding    |
| **Cloud Build**       | `cloudbuild.googleapis.com`       | Build containers       |
| **Artifact Registry** | `artifactregistry.googleapis.com` | Store container images |

---

## 🚨 Common Issues

### Issue: "API not enabled" error

**Solution:**

1. Go to APIs & Services > Library
2. Search for the API
3. Click "ENABLE"
4. Wait 1-2 minutes for activation

### Issue: "Billing not enabled"

**Solution:**

1. Go to: https://console.cloud.google.com/billing
2. Link a billing account
3. (Free Trial provides $300 credit)

### Issue: "Permission denied"

**Solution:**

1. Make sure you're the project owner
2. Or have "Project Editor" role
3. Check IAM: https://console.cloud.google.com/iam-admin/iam

---

## 🎯 Quick Links

### Direct API Enable Links

1. **Cloud Run:** https://console.cloud.google.com/apis/library/run.googleapis.com
2. **GKE:** https://console.cloud.google.com/apis/library/container.googleapis.com
3. **Secret Manager:** https://console.cloud.google.com/apis/library/secretmanager.googleapis.com
4. **BigQuery:** https://console.cloud.google.com/apis/library/bigquery.googleapis.com
5. **Vertex AI:** https://console.cloud.google.com/apis/library/aiplatform.googleapis.com
6. **Cloud Build:** https://console.cloud.google.com/apis/library/cloudbuild.googleapis.com
7. **Artifact Registry:** https://console.cloud.google.com/apis/library/artifactregistry.googleapis.com

### Dashboard Links

- **APIs Dashboard:** https://console.cloud.google.com/apis/dashboard
- **Project Selector:** Top dropdown in Google Cloud Console
- **Billing:** https://console.cloud.google.com/billing

---

## ⚡ One-Click Enable Script

Save this as `enable-all-apis.ps1`:

```powershell
# Enable all Colony OS APIs
$PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"

Write-Host "Enabling all APIs for Colony OS..." -ForegroundColor Green

$APIS = @(
    "run.googleapis.com",
    "container.googleapis.com",
    "secretmanager.googleapis.com",
    "bigquery.googleapis.com",
    "aiplatform.googleapis.com",
    "cloudbuild.googleapis.com",
    "artifactregistry.googleapis.com"
)

foreach ($API in $APIS) {
    Write-Host "Enabling $API..." -ForegroundColor Cyan
    gcloud services enable $API --project=$PROJECT_ID
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ $API enabled" -ForegroundColor Green
    } else {
        Write-Host "❌ Failed to enable $API" -ForegroundColor Red
    }
}

Write-Host "`n✅ All APIs enabled!" -ForegroundColor Green
```

**Run it:**

```powershell
.\enable-all-apis.ps1
```

---

## 📋 After Enabling APIs

### Next Steps

1. **Set up Secret Manager:**

   ```powershell
   .\secret-manager-setup.ps1
   ```

2. **Deploy Queen Bee:**

   ```powershell
   .\cloud-run-deploy.sh
   ```

3. **Set up BigQuery:**
   ```powershell
   .\vertex-grounding-setup.ps1
   ```

---

## ✅ Success Checklist

- [ ] All 7 APIs enabled
- [ ] Billing account linked
- [ ] Project ID set
- [ ] APIs visible in dashboard
- [ ] Ready to deploy

---

**Once all APIs are enabled, you're ready to deploy the Queen Bee!** 🏛️👑🦙
