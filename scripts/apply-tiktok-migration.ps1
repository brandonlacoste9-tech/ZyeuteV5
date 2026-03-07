# Apply TikTok Support Migration to Supabase
# PowerShell script for Windows

param(
    [Parameter(Mandatory=$true)]
    [string]$DatabaseUrl
)

Write-Host "🚀 Applying TikTok support migration..." -ForegroundColor Cyan
Write-Host ""

# Set environment variable for the Node.js script
$env:DATABASE_URL = $DatabaseUrl

# Run the TypeScript migration script
npx tsx scripts/apply-tiktok-migration.ts

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Migration failed with exit code $LASTEXITCODE" -ForegroundColor Red
    exit $LASTEXITCODE
}
