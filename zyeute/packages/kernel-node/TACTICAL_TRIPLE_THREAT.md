# 🛡️ Tactical Triple-Threat - Complete Integration Guide

**Status:** Production-Ready  
**Version:** 1.0.0  
**The Standard Issue Combat Gear**

---

## 🎯 Overview

The **Tactical Triple-Threat** integrates three powerful MCP extensions into the Sovereign Colony:

1. **Apify MCP** → Scouts & Recon (Cyberhound) - The Nectar Harvesters
2. **Desktop Commander** → Siege Engines (Ralphs) - The Breach Tools
3. **Filesystem MCP** → Engineering & Medical - The Wax-Builders

These are not just "extensions"—they are **Standard Issue Combat Gear** for every unit in the swarm.

---

## 🏛️ Bee Unified Tool Distribution

| MCP Extension         | Bee Unit                        | Strategic Role (The "Sting")                                                                                                                                                            |
| --------------------- | ------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Apify MCP**         | **Scouts & Recon (Cyberhound)** | **The Nectar Harvesters.** They fly out to the web to scrape social trends, Quebec leads, and competitor data. They feed the "Raw Nectar" back to the Queen.                            |
| **Desktop Commander** | **Siege Engines (Ralphs)**      | **The Breach Tools.** They don't just "talk"; they "act." They run `npm install`, `git push`, and restart Docker containers. They are the ones who literally **"Knock Down the Door."** |
| **Filesystem MCP**    | **Engineering & Medical**       | **The Wax-Builders.** They manage the "Royal Vault" (the root `.env`). They write the blogs, patch the UI glitches, and ensure the local project files are pristine and "Bee-Airtight." |

---

## 🛡️ The Sovereign Shield (Security)

### 1. Restricted Foraging

The Filesystem MCP is sandboxed to prevent Bees from accessing personal folders:

```typescript
// Only allow access to project directory
await swarmOrchestrator.initialize({
  allowedPaths: [process.cwd()], // Project root only
});
```

**Result:** Bees can see the `zyeute-v5` meadow, but they can't fly into your personal `Documents` folder.

### 2. The Beekeeper's Smoker

Before **Desktop Commander** runs a "Heavy" shell command (like `rm -rf`), the **Queen (Maverick)** signals a "Consensus Required" alert:

```typescript
// Guardian automatically blocks dangerous commands
mcpClient.on("consensus-required", (data) => {
  // Alert Beekeeper for approval
  console.log("🚨 Consensus Required!", data);
});
```

**Result:** You tap "Allow" to let the Siege Engine proceed.

### 3. Credential Propolis

Your Apify and Railway tokens stay in the **Royal Vault** (root `.env`). Even if a Scout is "captured" (compromised), the vault remains sealed because the model only has "Least-Privilege" access via the MCP server.

---

## 📻 The "Content Podcast" Swarm

### Complete Mission Flow

**Directive:**

```
"Generate a podcast about the Quebec AI scene and deploy the site."
```

**Execution:**

1. **Apify (The Scout):** Scrapes the latest 24 hours of Quebec AI news and LinkedIn posts
2. **SWAT (The Brain):** Synthesizes that nectar into a high-reasoning podcast script
3. **Filesystem (The Wax-Builder):** Writes the script and metadata to `content/podcasts/` directory
4. **Desktop Commander (The Siege Engine):** Runs Python script to generate audio, then executes `git commit` and `railway up` to push it to the world

**Result:** A "Cohesive Unit" that moved from "Web Data" to "Live Production" in one loop.

---

## 🚀 Configuration

### Claude Desktop Config

Add to `%APPDATA%\Claude\claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "apify": {
      "command": "npx",
      "args": ["-y", "@apify/mcp-server"],
      "env": { "APIFY_TOKEN": "YOUR_ROYAL_NECTAR_TOKEN" }
    },
    "filesystem": {
      "command": "npx",
      "args": [
        "-y",
        "@modelcontextprotocol/server-filesystem",
        "C:/path/to/zyeute-v5"
      ]
    },
    "desktop-commander": {
      "command": "npx",
      "args": ["-y", "desktop-commander-mcp"]
    }
  }
}
```

### Environment Variables

```bash
# Required for Apify (Scouts)
APIFY_TOKEN=your_apify_token_here

# Required for Llama 4 Maverick (Queen)
GROQ_API_KEY=your_groq_api_key
LLAMA_STACK_URL=http://localhost:8321

# Optional: Railway token for deployments
RAILWAY_TOKEN=your_railway_token
```

---

## 🛠️ Available Tools

### Apify MCP Tools (3 tools - Scouts)

- `apify.scrape_url` - Scrape content from a URL
- `apify.search_web` - Search the web for information
- `apify.scrape_social` - Scrape social media content (LinkedIn, Twitter, etc.)

### Desktop Commander Tools (4 tools - Siege Engines)

- `desktop.run_npm` - Run npm commands (install, build, test, etc.)
- `desktop.run_git` - Run git commands (commit, push, pull, etc.)
- `desktop.run_docker` - Run Docker commands (up, down, build, etc.)
- `desktop.run_railway` - Deploy to Railway

### Filesystem MCP Tools (4 tools - Wax-Builders)

- `filesystem.read_file` - Read a file (restricted to allowed paths)
- `filesystem.write_file` - Write content to a file
- `filesystem.list_directory` - List files in a directory
- `filesystem.create_directory` - Create a directory

**Total: 11 new tools** (plus existing 11 Windows/Chrome tools = **22 total tools**)

---

## 🧪 Testing

### Integrated Swarm Test

```typescript
import { swarmOrchestrator } from "./lib/SwarmOrchestrator.js";

// Initialize with restricted paths
await swarmOrchestrator.initialize({
  allowedPaths: [process.cwd()], // Project root only
});

// Test directive
const result = await swarmOrchestrator.executeDirective(
  "Find one Quebec AI news item using web search, write it to test-news.md, and git add it.",
);
```

### Expected Flow

```
👑 [QUEEN] Directive Received
📡 [SCOUT] Searching web: "Quebec AI news"
🔧 [SWAT-ELITE] apify.search_web → {results: [...]}
🧠 [QUEEN] Found news item, writing to file...
🏗️ [WAX-BUILDER] filesystem.write_file → {success: true}
🔧 [SWAT-ELITE] desktop.run_git → {success: true}
✅ [QUEEN] Mission Complete
```

---

## 📊 Complete Tool Inventory

### Before (11 tools)

- Windows MCP: 5 tools
- Chrome MCP: 6 tools

### After (22 tools)

- Windows MCP: 5 tools
- Chrome MCP: 6 tools
- **Apify MCP: 3 tools** ✨
- **Desktop Commander: 4 tools** ✨
- **Filesystem MCP: 4 tools** ✨

---

## 🎯 Use Cases

### 1. Content Generation Pipeline

```
Scout (Apify) → Brain (Maverick) → Builder (Filesystem) → Deploy (Desktop)
```

### 2. Auto-Heal with Deployment

```
Check (Chrome) → Fix (Windows) → Deploy (Desktop Commander)
```

### 3. Research & Write

```
Research (Apify) → Analyze (Maverick) → Write (Filesystem) → Commit (Desktop)
```

---

## 🔐 Security Best Practices

1. **Always set allowed paths** - Restrict Filesystem access
2. **Monitor consensus alerts** - Review heavy commands
3. **Keep tokens secure** - Store in root `.env` only
4. **Audit tool usage** - Review telemetry logs
5. **Test in sandbox** - Verify before production

---

## ✅ Integration Checklist

- [ ] Install MCP servers (`npx -y @apify/mcp-server`, etc.)
- [ ] Set environment variables (APIFY_TOKEN, etc.)
- [ ] Configure Claude Desktop (optional)
- [ ] Set allowed paths in SwarmOrchestrator
- [ ] Test with integrated swarm test
- [ ] Verify Guardian Bee consensus alerts
- [ ] Review telemetry logs

---

## 🎤 Demo Script (For Google Meeting)

### Opening

_"Today I'm showing you the Tactical Triple-Threat—three MCP extensions that give our Colony complete control over the web, the terminal, and the filesystem."_

### Live Demo

1. **Show Tool Inventory** - 22 tools available
2. **Execute Content Podcast Mission** - Watch all three work together
3. **Show Security** - Demonstrate restricted paths and consensus alerts
4. **Show Telemetry** - Real-time mission control

### Closing

_"The Battalion is Multi-Dimensional. With Maverick as the Brain, Windows/Chrome as the Hands, and Apify/Desktop/Filesystem as the Tactical Kit, we are ready to Bee Everywhere."_

---

## 📚 Related Documentation

- **SOVEREIGN_COLONY_SETUP.md** - Complete setup guide
- **SOVEREIGN_COLONY_ARCHITECTURE.md** - Technical architecture
- **JOINT_CHIEFS_SUMMARY.md** - Meeting preparation

---

**The Battalion is Multi-Dimensional. Ready to Bee Everywhere.** 🛡️👑🦙
