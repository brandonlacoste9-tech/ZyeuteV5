# Setup Local .env File
# 
# This script helps set up your local .env file with the Service Account key path
# 
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\setup-local-env.ps1

$ServiceAccountKeyPath = "c:\Users\north\AppData\Local\Perplexity\Comet\Application\143.2.7499.37654\floguru-6fad5f1c8273.json"
$EnvFile = ".env"
$EnvExample = ".env.example"

Write-Host "🔧 Setting up local .env file..." -ForegroundColor Cyan
Write-Host ""

# Check if Service Account key file exists
if (-not (Test-Path $ServiceAccountKeyPath)) {
    Write-Host "❌ Service Account key file not found:" -ForegroundColor Red
    Write-Host "   $ServiceAccountKeyPath" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "💡 Please verify the path is correct" -ForegroundColor Yellow
    exit 1
}

Write-Host "✅ Service Account key file found" -ForegroundColor Green
Write-Host ""

# Check if .env already exists
if (Test-Path $EnvFile) {
    Write-Host "⚠️  .env file already exists" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to update GOOGLE_APPLICATION_CREDENTIALS? (y/n)"
    if ($overwrite -ne "y") {
        Write-Host "Skipping .env update" -ForegroundColor Yellow
        exit 0
    }
    
    # Update existing .env
    $content = Get-Content $EnvFile -Raw
    
    # Update or add GOOGLE_APPLICATION_CREDENTIALS
    if ($content -match "GOOGLE_APPLICATION_CREDENTIALS=") {
        $content = $content -replace "GOOGLE_APPLICATION_CREDENTIALS=.*", "GOOGLE_APPLICATION_CREDENTIALS=$ServiceAccountKeyPath"
        Write-Host "✅ Updated GOOGLE_APPLICATION_CREDENTIALS in .env" -ForegroundColor Green
    } else {
        $content += "`n# Google Cloud / Vertex AI`n"
        $content += "GOOGLE_APPLICATION_CREDENTIALS=$ServiceAccountKeyPath`n"
        Write-Host "✅ Added GOOGLE_APPLICATION_CREDENTIALS to .env" -ForegroundColor Green
    }
    
    Set-Content -Path $EnvFile -Value $content
} else {
    Write-Host "📝 Creating new .env file from .env.example..." -ForegroundColor Cyan
    
    if (Test-Path $EnvExample) {
        Copy-Item $EnvExample $EnvFile
        Write-Host "✅ Copied .env.example to .env" -ForegroundColor Green
    }
    
    # Add Service Account configuration
    Add-Content -Path $EnvFile -Value "`n# Google Cloud / Vertex AI (Local Setup)"
    Add-Content -Path $EnvFile -Value "GOOGLE_CLOUD_PROJECT=spatial-garden-483401-g8"
    Add-Content -Path $EnvFile -Value "GOOGLE_CLOUD_REGION=us-central1"
    Add-Content -Path $EnvFile -Value "GOOGLE_APPLICATION_CREDENTIALS=$ServiceAccountKeyPath"
    
    Write-Host "✅ Created .env file with Service Account configuration" -ForegroundColor Green
}

Write-Host ""
Write-Host "✅ Local .env setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Review .env file and add other required variables"
Write-Host "   2. Run: npm run verify:service-account"
Write-Host "   3. See: docs/LOCAL_ENV_SETUP.md for complete guide"
Write-Host ""
