#!/usr/bin/env bash
# Clone all external tools & skills into external/ so the agent and build can use them.
# Run once: ./scripts/setup-external-tools.sh   or   bash scripts/setup-external-tools.sh

set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
mkdir -p "$ROOT/external"
cd "$ROOT/external"

repos=(
  "https://github.com/browser-use/browser-use.git:browser-use"
  "https://github.com/sickn33/antigravity-awesome-skills.git:antigravity-awesome-skills"
  "https://github.com/OthmanAdi/planning-with-files.git:planning-with-files"
  "https://github.com/lbjlaq/Antigravity-Manager.git:antigravity-manager"
  "https://github.com/nextlevelbuilder/ui-ux-pro-max-skill.git:ui-ux-pro-max-skill-external"
  "https://github.com/CopilotKit/CopilotKit.git:copilotkit"
  "https://github.com/study8677/antigravity-workspace-template.git:antigravity-workspace-template"
)

for entry in "${repos[@]}"; do
  url="${entry%%:*}"
  dir="${entry##*:}"
  if [ -d "$dir/.git" ]; then
    echo "Already present: $dir (pull latest? run: cd external/$dir && git pull)"
  else
    echo "Cloning $url -> $dir"
    git clone --depth 1 "$url" "$dir" || echo "Warning: clone failed for $dir"
  fi
done

echo "Done. External tools are in external/"
