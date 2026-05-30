# Clone all external tools & skills into external/ (Windows).
# Run: .\scripts\setup-external-tools.ps1
# Zyeute lean: also creates docs/planning and checks for local Ollama (AGENT_MODE=Hybrid).

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
$external = Join-Path $root "external"
if (-not (Test-Path $external)) { New-Item -ItemType Directory -Path $external | Out-Null }
Set-Location $external

$repos = @(
  @{ url = "https://github.com/browser-use/browser-use.git"; dir = "browser-use" },
  @{ url = "https://github.com/sickn33/antigravity-awesome-skills.git"; dir = "antigravity-awesome-skills" },
  @{ url = "https://github.com/OthmanAdi/planning-with-files.git"; dir = "planning-with-files" },
  @{ url = "https://github.com/lbjlaq/Antigravity-Manager.git"; dir = "antigravity-manager" },
  @{ url = "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git"; dir = "ui-ux-pro-max-skill-external" },
  @{ url = "https://github.com/CopilotKit/CopilotKit.git"; dir = "copilotkit" },
  @{ url = "https://github.com/study8677/antigravity-workspace-template.git"; dir = "antigravity-workspace-template" }
)

foreach ($r in $repos) {
  $path = Join-Path $external $r.dir
  if (Test-Path (Join-Path $path ".git")) {
    Write-Host "Already present: $($r.dir)"
  } else {
    Write-Host "Cloning $($r.url) -> $($r.dir)"
    git clone --depth 1 $r.url $r.dir
  }
}

Set-Location $root

# Planning dir (task_plan, brand prompt live in docs/planning/)
$planningDir = Join-Path $root "docs" "planning"
if (-not (Test-Path $planningDir)) {
  New-Item -ItemType Directory -Path $planningDir -Force | Out-Null
  Write-Host "Created docs/planning/"
}

# Optional: if Ollama is running, suggest AGENT_MODE=Hybrid to save GenAI App Builder credit
try {
  $null = Test-NetConnection -ComputerName localhost -Port 11434 -WarningAction SilentlyContinue -ErrorAction SilentlyContinue
  Write-Host "Ollama detected on port 11434. Set AGENT_MODE=Hybrid in .env to use local LLM for small tasks (saves credit)." -ForegroundColor Cyan
} catch {
  # ignore
}

Write-Host "Done. External tools are in external/"
