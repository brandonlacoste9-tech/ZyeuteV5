# Setup Claude Code MCP - Supabase Integration
# Shares Supabase MCP configuration with Claude Code

Write-Host "🔧 Setting up Claude Code MCP for Supabase..." -ForegroundColor Cyan
Write-Host ""

# Check if Claude Code CLI is available
$claudeCodeAvailable = Get-Command claude -ErrorAction SilentlyContinue

if ($claudeCodeAvailable) {
    Write-Host "✅ Claude Code CLI found" -ForegroundColor Green
    Write-Host ""
    Write-Host "To add Supabase MCP, run:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  claude mcp add supabase npx -y @modelcontextprotocol/server-supabase" -ForegroundColor White
    Write-Host ""
    Write-Host "With environment variables:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "  claude mcp add supabase npx -y @modelcontextprotocol/server-supabase \`" -ForegroundColor White
    Write-Host "    --env SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co \`" -ForegroundColor White
    Write-Host "    --env SUPABASE_KEY=your_supabase_anon_key_here" -ForegroundColor White
    Write-Host ""
} else {
    Write-Host "⚠️  Claude Code CLI not found" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Option 1: Install Claude Code CLI" -ForegroundColor Cyan
    Write-Host "Option 2: Configure manually via config file" -ForegroundColor Cyan
    Write-Host ""
}

# Check for Claude config directories
$claudeConfigPaths = @(
    "$env:APPDATA\Claude",
    "$env:USERPROFILE\.claude",
    "$env:LOCALAPPDATA\Claude"
)

Write-Host "📁 Checking for Claude config directories..." -ForegroundColor Cyan
foreach ($path in $claudeConfigPaths) {
    if (Test-Path $path) {
        Write-Host "  ✅ Found: $path" -ForegroundColor Green
    } else {
        Write-Host "  ❌ Not found: $path" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "📋 Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Check Cursor Settings → MCP Tools for exact Supabase MCP config" -ForegroundColor White
Write-Host "  2. Copy configuration to Claude Code" -ForegroundColor White
Write-Host "  3. Set SUPABASE_URL and SUPABASE_KEY environment variables" -ForegroundColor White
Write-Host "  4. Test with: claude mcp test supabase" -ForegroundColor White
Write-Host ""
Write-Host "📖 See docs/CLAUDE_CODE_MCP_SETUP.md for detailed instructions" -ForegroundColor Cyan
Write-Host ""
