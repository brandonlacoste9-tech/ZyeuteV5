#!/usr/bin/env pwsh
# Quick Railway CLI Installer

Write-Host "🚂 Installing Railway CLI..." -ForegroundColor Cyan

# Check if npm is available
$npm = Get-Command npm -ErrorAction SilentlyContinue

if ($npm) {
    Write-Host "   Using npm to install Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli

    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ Railway CLI installed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "🔐 Next steps:" -ForegroundColor Cyan
        Write-Host "   1. Run: railway login" -ForegroundColor White
        Write-Host "   2. Run: cd ZyeuteV5 && railway link ad61359f-e003-47db-9feb-2434b9c266f5" -ForegroundColor White
        Write-Host "   3. Run: ./scripts/railway-diagnostic.ps1" -ForegroundColor White
    } else {
        Write-Host "   ❌ Installation failed" -ForegroundColor Red
    }
} else {
    Write-Host "   ❌ npm not found. Please install Node.js first." -ForegroundColor Red
    Write-Host ""
    Write-Host "   Alternative installation methods:" -ForegroundColor Yellow
    Write-Host "   • Scoop: scoop install railway" -ForegroundColor White
    Write-Host "   • Download: https://railway.app/cli" -ForegroundColor White
}
