# Browser-Use Test Script (PowerShell)
# Tests browser automation on local Zyeuté app

Write-Host "🧪 Testing Browser-Use with Local App" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan

# Check if browser-use is installed
$browserUseInstalled = Get-Command browser-use -ErrorAction SilentlyContinue

if (-not $browserUseInstalled) {
    Write-Host "❌ browser-use not found. Installing..." -ForegroundColor Yellow
    Set-Location ..\external\browser-use
    uv pip install -e .
    browser-use install
    Set-Location ..\..\playground
}

# Check if local server is running
Write-Host "📡 Checking if local server is running..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -TimeoutSec 2 -UseBasicParsing -ErrorAction Stop
    Write-Host "✅ Local server detected" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Local server not running. Please start it first:" -ForegroundColor Yellow
    Write-Host "   cd frontend && npm run dev" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "🌐 Opening browser..." -ForegroundColor Cyan
browser-use --headed open http://localhost:3000

Write-Host ""
Write-Host "📸 Taking screenshot..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "browser-use-tests\results" | Out-Null
browser-use screenshot browser-use-tests\results\homepage.png

Write-Host ""
Write-Host "🔍 Getting page state..." -ForegroundColor Cyan
browser-use state | Out-File -FilePath "browser-use-tests\results\page-state.json" -Encoding utf8

Write-Host ""
Write-Host "✅ Test complete! Check results in browser-use-tests\results\" -ForegroundColor Green
