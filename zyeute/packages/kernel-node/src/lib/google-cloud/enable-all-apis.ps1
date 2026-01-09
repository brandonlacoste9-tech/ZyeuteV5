# Enable All Colony OS APIs - One-Click Script
# Enables all required Google Cloud services for Colony OS

Write-Host "🏛️ [COLONY OS] Enabling All Required APIs" -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Get project ID
$PROJECT_ID = $env:GOOGLE_CLOUD_PROJECT
if (-not $PROJECT_ID) {
    $PROJECT_ID = Read-Host "Enter your Google Cloud Project ID"
    $env:GOOGLE_CLOUD_PROJECT = $PROJECT_ID
}

Write-Host "`n📋 Project: $PROJECT_ID" -ForegroundColor Cyan
Write-Host "Enabling APIs...`n" -ForegroundColor Cyan

# List of required APIs
$APIS = @(
    @{Name="Cloud Run API"; ID="run.googleapis.com"; Purpose="Deploy Queen Bee"},
    @{Name="Kubernetes Engine API"; ID="container.googleapis.com"; Purpose="Deploy Siege Engines"},
    @{Name="Secret Manager API"; ID="secretmanager.googleapis.com"; Purpose="Royal Vault"},
    @{Name="BigQuery API"; ID="bigquery.googleapis.com"; Purpose="Wax Ledger"},
    @{Name="Vertex AI API"; ID="aiplatform.googleapis.com"; Purpose="SWAT Bees"},
    @{Name="Cloud Build API"; ID="cloudbuild.googleapis.com"; Purpose="Build containers"},
    @{Name="Artifact Registry API"; ID="artifactregistry.googleapis.com"; Purpose="Store images"}
)

$enabled = 0
$failed = 0

foreach ($API in $APIS) {
    Write-Host "🔧 Enabling: $($API.Name)..." -ForegroundColor Yellow
    Write-Host "   Purpose: $($API.Purpose)" -ForegroundColor Gray
    
    gcloud services enable $API.ID --project=$PROJECT_ID 2>&1 | Out-Null
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Enabled" -ForegroundColor Green
        $enabled++
    } else {
        Write-Host "   ❌ Failed" -ForegroundColor Red
        $failed++
    }
    Write-Host ""
}

# Summary
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Enabled: $enabled" -ForegroundColor Green
Write-Host "   ❌ Failed: $failed" -ForegroundColor $(if ($failed -gt 0) { "Red" } else { "Green" })

if ($failed -eq 0) {
    Write-Host "`n✅ All APIs enabled successfully!" -ForegroundColor Green
    Write-Host "   Next: Run .\secret-manager-setup.ps1" -ForegroundColor Cyan
} else {
    Write-Host "`n⚠️ Some APIs failed to enable." -ForegroundColor Yellow
    Write-Host "   Check: https://console.cloud.google.com/apis/dashboard" -ForegroundColor Cyan
}

Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`n"
