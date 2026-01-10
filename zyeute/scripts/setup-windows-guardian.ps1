# Setup Windows Boot Persistence for Guardian Bee
# Run this script once in PowerShell (as Administrator) to ensure Guardian Bee starts at boot

param(
    [string]$GuardianScriptPath = "C:\Users\north\ZyeuteV5\ZyeuteV5-1\zyeute\scripts\guardian-bee.ps1"
)

# Check if running as Administrator
$IsAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)

if (-not $IsAdmin) {
    Write-Host "❌ This script must be run as Administrator" -ForegroundColor Red
    Write-Host "   Right-click PowerShell and select 'Run as Administrator'" -ForegroundColor Yellow
    exit 1
}

# Check if Guardian Bee script exists
if (-not (Test-Path $GuardianScriptPath)) {
    Write-Host "❌ Guardian Bee script not found at: $GuardianScriptPath" -ForegroundColor Red
    exit 1
}

# Create Scheduled Task Action
$Action = New-ScheduledTaskAction `
    -Execute 'PowerShell.exe' `
    -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$GuardianScriptPath`""

# Create Scheduled Task Trigger (At Startup)
$Trigger = New-ScheduledTaskTrigger -AtStartup

# Create Scheduled Task Settings
$Settings = New-ScheduledTaskSettingsSet `
    -RestartCount 3 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -AllowStartIfOnBatteries `
    -DontStopIfGoingOnBatteries `
    -StartWhenAvailable `
    -RunOnlyIfNetworkAvailable `
    -DontStopOnIdleEnd

# Create Principal (Run as SYSTEM for maximum reliability)
$Principal = New-ScheduledTaskPrincipal -UserId "SYSTEM" -LogonType ServiceAccount -RunLevel Highest

# Register Scheduled Task
try {
    # Remove existing task if it exists
    $ExistingTask = Get-ScheduledTask -TaskName "ZyeuteGuardianBee" -ErrorAction SilentlyContinue
    if ($ExistingTask) {
        Unregister-ScheduledTask -TaskName "ZyeuteGuardianBee" -Confirm:$false
        Write-Host "⚠️  Removed existing task" -ForegroundColor Yellow
    }

    Register-ScheduledTask `
        -TaskName "ZyeuteGuardianBee" `
        -Action $Action `
        -Trigger $Trigger `
        -Settings $Settings `
        -Principal $Principal `
        -Description "Zyeuté Guardian Bee - Self-Healing Production Watcher" `
        -Force

    Write-Host "✅ Guardian Bee scheduled task created successfully!" -ForegroundColor Green
    Write-Host "   Task Name: ZyeuteGuardianBee" -ForegroundColor Gray
    Write-Host "   Runs At: System Startup" -ForegroundColor Gray
    Write-Host "   Auto-Restart: 3 attempts with 1-minute interval" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To start immediately, run:" -ForegroundColor Cyan
    Write-Host "   Start-ScheduledTask -TaskName 'ZyeuteGuardianBee'" -ForegroundColor White
    Write-Host ""
    Write-Host "To check status, run:" -ForegroundColor Cyan
    Write-Host "   Get-ScheduledTask -TaskName 'ZyeuteGuardianBee' | Get-ScheduledTaskInfo" -ForegroundColor White
}
catch {
    Write-Host "❌ Failed to create scheduled task: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}