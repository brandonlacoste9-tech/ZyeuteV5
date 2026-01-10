# Quick Deploy Script for Railway (Windows PowerShell)
# This script helps you deploy Zyeuté to Railway with minimal setup

Write-Host "🚀 Zyeuté Quick Deploy to Railway" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""

# Check if Railway CLI is installed
if (-not (Get-Command railway -ErrorAction SilentlyContinue)) {
    Write-Host "📦 Installing Railway CLI..." -ForegroundColor Yellow
    npm install -g @railway/cli
}

# Check if logged in
try {
    railway whoami | Out-Null
    Write-Host "✅ Logged into Railway" -ForegroundColor Green
} catch {
    Write-Host "🔐 Please login to Railway..." -ForegroundColor Yellow
    railway login
}

Write-Host ""
Write-Host "📋 Pre-flight Checks..." -ForegroundColor Cyan
Write-Host ""

# Check if build works
Write-Host "1. Building application..." -ForegroundColor Yellow
if (npm run build) {
    Write-Host "   ✅ Build successful" -ForegroundColor Green
} else {
    Write-Host "   ❌ Build failed - fix errors before deploying" -ForegroundColor Red
    exit 1
}

# Check TypeScript
Write-Host ""
Write-Host "2. Checking TypeScript..." -ForegroundColor Yellow
if (npm run check) {
    Write-Host "   ✅ TypeScript checks passed" -ForegroundColor Green
} else {
    Write-Host "   ⚠️  TypeScript errors found - review before deploying" -ForegroundColor Yellow
}

# Check if DATABASE_URL is set
Write-Host ""
Write-Host "3. Checking environment variables..." -ForegroundColor Yellow
if (-not $env:DATABASE_URL) {
    Write-Host "   ⚠️  DATABASE_URL not set" -ForegroundColor Yellow
    Write-Host "   💡 Railway will set this automatically if you add a PostgreSQL service" -ForegroundColor Gray
} else {
    Write-Host "   ✅ DATABASE_URL is set" -ForegroundColor Green
}

Write-Host ""
Write-Host "🚀 Ready to deploy!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. If you haven't created a Railway project yet:"
Write-Host "   railway init" -ForegroundColor White
Write-Host ""
Write-Host "2. Link this project to Railway:"
Write-Host "   railway link" -ForegroundColor White
Write-Host ""
Write-Host "3. Add PostgreSQL database (if needed):"
Write-Host "   railway add postgresql" -ForegroundColor White
Write-Host ""
Write-Host "4. Set environment variables:"
Write-Host "   railway variables set NODE_ENV=production" -ForegroundColor White
Write-Host "   railway variables set PORT=8080" -ForegroundColor White
Write-Host "   # ... add other required variables" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Deploy:"
Write-Host "   railway up" -ForegroundColor White
Write-Host ""
Write-Host "Or deploy from GitHub by pushing to your repo!" -ForegroundColor Cyan
Write-Host "Railway will auto-detect railway.json and deploy automatically." -ForegroundColor Gray
Write-Host ""