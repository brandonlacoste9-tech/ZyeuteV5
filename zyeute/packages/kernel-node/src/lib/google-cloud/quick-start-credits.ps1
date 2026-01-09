# 🚀 Quick Start: Use Your Google Cloud Credits
# This script helps you start using your credits immediately

Write-Host "`n💰 QUICK START: USING YOUR GOOGLE CLOUD CREDITS" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if gcloud is installed
try {
    $gcloudVersion = gcloud --version 2>&1 | Select-Object -First 1
    Write-Host "✅ Google Cloud SDK found: $gcloudVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Google Cloud SDK not found. Install from: https://cloud.google.com/sdk/docs/install" -ForegroundColor Red
    exit 1
}

# Check current project
Write-Host "`n📋 Current Google Cloud Project:" -ForegroundColor Yellow
$project = gcloud config get-value project 2>&1
if ($project -and $project -ne "None") {
    Write-Host "   Project: $project" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  No project set!" -ForegroundColor Yellow
    $projectId = Read-Host "   Enter your Google Cloud Project ID"
    if ($projectId) {
        gcloud config set project $projectId
        Write-Host "   ✅ Project set to: $projectId" -ForegroundColor Green
    } else {
        Write-Host "   ❌ Project ID required. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Check authentication
Write-Host "`n🔐 Checking authentication..." -ForegroundColor Yellow
try {
    $auth = gcloud auth list --format="json" | ConvertFrom-Json
    if ($auth.Count -gt 0) {
        Write-Host "   ✅ Authenticated as: $($auth[0].account)" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  Not authenticated. Running: gcloud auth login" -ForegroundColor Yellow
        gcloud auth login
    }
} catch {
    Write-Host "   ❌ Authentication check failed" -ForegroundColor Red
}

# Show available options
Write-Host "`n🎯 What would you like to do?" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  Enable Required APIs (One-time setup)" -ForegroundColor Yellow
Write-Host "   Cost: ~$0.01-0.10 (uses credits)" -ForegroundColor Gray
Write-Host ""
Write-Host "2️⃣  Deploy Queen Bee to Cloud Run" -ForegroundColor Yellow
Write-Host "   Cost: ~$0.10-1.00/day (uses credits)" -ForegroundColor Gray
Write-Host ""
Write-Host "3️⃣  Set Up Secret Manager (Royal Vault)" -ForegroundColor Yellow
Write-Host "   Cost: ~$0.06/month (uses credits)" -ForegroundColor Gray
Write-Host ""
Write-Host "4️⃣  Create BigQuery Dataset (Wax Ledger)" -ForegroundColor Yellow
Write-Host "   Cost: ~$0.02/GB/month (uses credits)" -ForegroundColor Gray
Write-Host ""
Write-Host "5️⃣  Run Dazzle Demo (Test BigQuery)" -ForegroundColor Yellow
Write-Host "   Cost: ~$0.01-0.10 per run (uses credits)" -ForegroundColor Gray
Write-Host ""
Write-Host "6️⃣  Check Credit Usage" -ForegroundColor Yellow
Write-Host "   View your credit balance and usage" -ForegroundColor Gray
Write-Host ""
Write-Host "7️⃣  Do All of the Above (Full Setup)" -ForegroundColor Yellow
Write-Host "   Complete Colony OS deployment" -ForegroundColor Gray
Write-Host ""

$choice = Read-Host "Enter your choice (1-7)"

# Normalize input (handle "all", "all of the above", "7", etc.)
$choice = $choice.Trim().ToLower()
if ($choice -match "all|7") {
    $choice = "7"
}

switch ($choice) {
    "1" {
        Write-Host "`n🔧 Enabling Required APIs..." -ForegroundColor Cyan
        gcloud services enable run.googleapis.com
        gcloud services enable container.googleapis.com
        gcloud services enable secretmanager.googleapis.com
        gcloud services enable bigquery.googleapis.com
        gcloud services enable aiplatform.googleapis.com
        Write-Host "✅ APIs enabled! Credits will be used automatically." -ForegroundColor Green
    }
    "2" {
        Write-Host "`n🚀 Deploying Queen Bee to Cloud Run..." -ForegroundColor Cyan
        $scriptPath = Join-Path $PSScriptRoot "cloud-run-deploy.sh"
        if (Test-Path $scriptPath) {
            bash $scriptPath
        } else {
            Write-Host "⚠️  Deployment script not found. Manual deployment:" -ForegroundColor Yellow
            Write-Host "   cd zyeute\packages\kernel-node" -ForegroundColor Gray
            Write-Host "   gcloud run deploy queen-bee --source . --region us-central1" -ForegroundColor Gray
        }
    }
    "3" {
        Write-Host "`n🔐 Setting Up Secret Manager..." -ForegroundColor Cyan
        $scriptPath = Join-Path $PSScriptRoot "secret-manager-setup.ps1"
        if (Test-Path $scriptPath) {
            & $scriptPath
        } else {
            Write-Host "⚠️  Script not found. Manual setup:" -ForegroundColor Yellow
            Write-Host "   gcloud secrets create COLONY_NECTAR --replication-policy=automatic" -ForegroundColor Gray
        }
    }
    "4" {
        Write-Host "`n📊 Creating BigQuery Dataset..." -ForegroundColor Cyan
        bq mk --dataset --location=US colony_telemetry
        Write-Host "✅ BigQuery dataset created! Credits will be used for storage/queries." -ForegroundColor Green
    }
    "5" {
        Write-Host "`n🎬 Running Dazzle Demo..." -ForegroundColor Cyan
        $scriptPath = Join-Path $PSScriptRoot "run-dazzle-demo.ps1"
        if (Test-Path $scriptPath) {
            & $scriptPath
        } else {
            Write-Host "⚠️  Demo script not found." -ForegroundColor Yellow
        }
    }
    "6" {
        Write-Host "`n💰 Checking Credit Usage..." -ForegroundColor Cyan
        Write-Host "   Opening Google Cloud Console..." -ForegroundColor Yellow
        Start-Process "https://console.cloud.google.com/billing/credits"
        Write-Host "   ✅ Console opened. Check your credits there." -ForegroundColor Green
    }
    "7" {
        Write-Host "`n🚀 FULL SETUP: Deploying Complete Colony OS..." -ForegroundColor Cyan
        Write-Host "   This will:" -ForegroundColor Yellow
        Write-Host "   1. Enable all APIs" -ForegroundColor Gray
        Write-Host "   2. Set up Secret Manager" -ForegroundColor Gray
        Write-Host "   3. Create BigQuery dataset" -ForegroundColor Gray
        Write-Host "   4. Deploy Queen Bee" -ForegroundColor Gray
        Write-Host ""
        $confirm = Read-Host "   Continue? (y/n)"
        if ($confirm -eq "y") {
            # Enable APIs
            Write-Host "`n   Step 1/4: Enabling APIs..." -ForegroundColor Yellow
            gcloud services enable run.googleapis.com,container.googleapis.com,secretmanager.googleapis.com,bigquery.googleapis.com,aiplatform.googleapis.com
            
            # Secret Manager
            Write-Host "`n   Step 2/4: Setting up Secret Manager..." -ForegroundColor Yellow
            $secretScript = Join-Path $PSScriptRoot "secret-manager-setup.ps1"
            if (Test-Path $secretScript) { & $secretScript }
            
            # BigQuery
            Write-Host "`n   Step 3/4: Creating BigQuery dataset..." -ForegroundColor Yellow
            bq mk --dataset --location=US colony_telemetry 2>&1 | Out-Null
            
            # Cloud Run
            Write-Host "`n   Step 4/4: Deploying Queen Bee..." -ForegroundColor Yellow
            $deployScript = Join-Path $PSScriptRoot "cloud-run-deploy.sh"
            if (Test-Path $deployScript) {
                bash $deployScript
            }
            
            Write-Host "`n✅ Full setup complete! Your credits are now being used." -ForegroundColor Green
        }
    }
    default {
        Write-Host "`n❌ Invalid choice. Exiting." -ForegroundColor Red
    }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "💡 Tip: Check credit usage at:" -ForegroundColor Yellow
Write-Host "   https://console.cloud.google.com/billing/credits" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n" -ForegroundColor Cyan
