# 🎯 Dazzle Demo Runner - PowerShell Script
# Runs the Google ADK + BigQuery integration demo

Write-Host "`n🎯 DAZZLE DEMO - BILINGUAL HIVE" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

# Check if we're in the right directory
$currentDir = Get-Location
if (-not $currentDir.Path.EndsWith("kernel-node")) {
    Write-Host "📍 Changing to kernel-node directory..." -ForegroundColor Yellow
    Set-Location "zyeute\packages\kernel-node"
}

# Check for .env file
$envFile = Join-Path (Get-Location) "..\..\..\..\..\.env"
if (-not (Test-Path $envFile)) {
    Write-Host "⚠️  Warning: .env file not found at root" -ForegroundColor Yellow
    Write-Host "   Expected: $envFile" -ForegroundColor Gray
}

# Check for Google Cloud credentials
$gcpProject = $env:GOOGLE_CLOUD_PROJECT
if (-not $gcpProject) {
    Write-Host "⚠️  Warning: GOOGLE_CLOUD_PROJECT not set" -ForegroundColor Yellow
    Write-Host "   Set it in your .env file or environment" -ForegroundColor Gray
}

# Check if node_modules exists
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Run the demo
Write-Host "`n🚀 Starting Dazzle Demo..." -ForegroundColor Green
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host ""

npx tsx google-cloud/dazzle-demo.ts

if ($LASTEXITCODE -eq 0) {
    Write-Host "`n✅ Dazzle Demo completed successfully!" -ForegroundColor Green
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
} else {
    Write-Host "`n❌ Dazzle Demo failed. Check errors above." -ForegroundColor Red
    Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Red
    exit 1
}
