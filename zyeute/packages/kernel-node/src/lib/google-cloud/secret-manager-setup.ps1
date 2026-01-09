# 🏛️ THE NECTAR INJECTION - PowerShell Script
# Moves root .env into the Royal Vault (Google Secret Manager)
# This script automates the process from your Windows machine

Write-Host "🏛️ [ROYAL VAULT] Nectar Injection Process" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Authenticate with the Hive's new Backbone
Write-Host "`n1️⃣ Authenticating with Google Cloud..." -ForegroundColor Cyan
gcloud auth login
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Authentication failed. Please try again." -ForegroundColor Red
    exit 1
}

# Step 2: Set project (prompt if not set)
$projectId = $env:GOOGLE_CLOUD_PROJECT
if (-not $projectId) {
    $projectId = Read-Host "Enter your Google Cloud Project ID"
    $env:GOOGLE_CLOUD_PROJECT = $projectId
}

Write-Host "`n2️⃣ Setting project to: $projectId" -ForegroundColor Cyan
gcloud config set project $projectId
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to set project." -ForegroundColor Red
    exit 1
}

# Step 3: Check if .env exists
$envPath = Join-Path $PSScriptRoot "..\..\..\..\.env"
if (-not (Test-Path $envPath)) {
    Write-Host "❌ Error: Root .env file not found at: $envPath" -ForegroundColor Red
    Write-Host "   Please ensure .env exists in the project root." -ForegroundColor Yellow
    exit 1
}

Write-Host "`n3️⃣ Found .env file at: $envPath" -ForegroundColor Green

# Step 4: Create the Royal Vault (Secret Container)
Write-Host "`n4️⃣ Creating COLONY_NECTAR secret..." -ForegroundColor Cyan
gcloud secrets create COLONY_NECTAR --replication-policy="automatic" 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Secret created successfully" -ForegroundColor Green
} else {
    Write-Host "⚠️ Secret may already exist, continuing..." -ForegroundColor Yellow
}

# Step 5: Inject the Nectar (Your root .env file)
Write-Host "`n5️⃣ Injecting Nectar into Royal Vault..." -ForegroundColor Cyan
gcloud secrets versions add COLONY_NECTAR --data-file="$envPath"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to add secret version." -ForegroundColor Red
    exit 1
}

# Step 6: Verify the Vault is Sealed
Write-Host "`n6️⃣ Verifying Vault is Sealed..." -ForegroundColor Cyan
$secretInfo = gcloud secrets versions describe latest --secret=COLONY_NECTAR --format="json" | ConvertFrom-Json
if ($secretInfo) {
    Write-Host "✅ [ROYAL VAULT] Colony Nectar enshrined successfully!" -ForegroundColor Green
    Write-Host "   Secret: COLONY_NECTAR" -ForegroundColor Cyan
    Write-Host "   Project: $projectId" -ForegroundColor Cyan
    Write-Host "   Version: $($secretInfo.name)" -ForegroundColor Cyan
    Write-Host "   Created: $($secretInfo.createTime)" -ForegroundColor Cyan
} else {
    Write-Host "⚠️ Could not verify secret, but it may have been created." -ForegroundColor Yellow
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "🏛️ [ROYAL VAULT] Nectar Injection Complete!" -ForegroundColor Green
Write-Host "   Your local machine and Google Cloud are now a Cohesive Unit." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
