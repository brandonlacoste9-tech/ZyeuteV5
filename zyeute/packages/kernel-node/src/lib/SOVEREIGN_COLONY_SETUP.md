# 👑 Sovereign Colony - Complete Setup Guide

**Status:** Production-Ready  
**Version:** 1.0.0  
**The Living Digital Organism**

---

## 🎯 Overview

The **Sovereign Colony** is a living digital organism that connects:

- **👑 Queen Bee (The Brain)** - Llama 4 Maverick reasoning
- **🛠️ Windows/Chrome MCP (The Hands)** - Model Context Protocol servers
- **🔧 SwarmOrchestrator** - The high-level bridge connecting everything

---

## 🚀 50-Hour "Sovereign Launch" Sequence

### Friday Night (The Anointing)

1. **Copy environment template**

   ```bash
   cp .env.example .env
   ```

2. **Fill with "Royal Jelly" (API Keys)**

   ```bash
   # Required for Llama 4 Maverick
   GROQ_API_KEY=your_groq_api_key_here
   LLAMA_STACK_URL=http://localhost:8321

   # Required for MCP servers
   # (Windows MCP uses system commands, no key needed)
   # (Chrome MCP requires Chrome MCP server)
   ```

3. **Install dependencies**
   ```bash
   cd zyeute/packages/kernel-node
   npm install
   ```

---

### Saturday Morning (The Call to Arms)

1. **Start llama-stack server**

   ```bash
   cd infrastructure/colony
   llama-stack run config.yaml
   ```

   Server should be running on `http://localhost:8321`

2. **Build kernel-node**

   ```bash
   cd zyeute/packages/kernel-node
   npm run build
   ```

3. **Verify MCP bridge**
   ```bash
   npm run test  # If tests exist
   ```

---

### Saturday Afternoon (The Swarm Test)

1. **Launch SwarmOrchestrator**

   ```typescript
   import { swarmOrchestrator } from "./lib/SwarmOrchestrator.js";

   async function testSwarm() {
     await swarmOrchestrator.initialize();

     const result = await swarmOrchestrator.executeDirective(
       "Open Chrome and tell me if my AdGenAI landing page looks healthy.",
     );

     console.log("Mission Result:", result);
   }

   testSwarm();
   ```

2. **Expected Flow:**
   ```
   👑 [QUEEN] Directive Received
   🛠️ [QUEEN] Gathering available tools...
   ✅ [QUEEN] X tools available
   🦙 [QUEEN] Deploying Maverick Reasoning Loop...
   🔧 [SWAT-ELITE] chrome.open_url → {success: true, url: "http://localhost:3000"}
   🧠 [QUEEN] Checking page content...
   🔧 [SWAT-ELITE] chrome.get_page_content → {content: "..."}
   ✅ [QUEEN] Mission Complete
   ```

---

### Sunday (The Cleanup)

1. **Use the Zombie Reaper** (if you have one)

   ```bash
   # Kill leftover processes
   taskkill /F /IM node.exe
   taskkill /F /IM chrome.exe
   ```

2. **Shutdown orchestrator**
   ```typescript
   await swarmOrchestrator.shutdown();
   ```

---

## 🛡️ The "Armory" Sync: Claude Desktop Config

For the **Infantry (The Ralphs)** to use the **Chrome Eyes** and **Windows Hands**, configure Claude Desktop:

**File:** `%APPDATA%\Claude\claude_desktop_config.json`

```json
{
  "mcpServers": {
    "windows-mcp": {
      "command": "npx",
      "args": ["-y", "windows-mcp-server"]
    },
    "google-chrome": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-google-chrome"]
    }
  }
}
```

**Note:** The SwarmOrchestrator uses a direct implementation that doesn't require Claude Desktop, but this config enables MCP access in Claude Desktop as well.

---

## 🐝 The "Breach & Clear" Tactical Script

### Example: Zyeuté Auto-Heal

```typescript
const healDirective = `
The Zyeuté V5 preview is showing a 404. 
Open Chrome, check localhost:3000, and if the page is down, 
restart the dev server via PowerShell.
`;

const result = await swarmOrchestrator.executeDirective(healDirective);

// Expected execution:
// 1. SWAT UNIT (Maverick) thinks: "I need to check the browser."
// 2. SWAT calls 'chrome.open_url({ url: "http://localhost:3000" })'
// 3. Observation: "Page Not Found."
// 4. SWAT thinks: "Infantry-04 failed. I need to knock down the door."
// 5. SWAT calls 'windows.run_command({ cmd: "npm run dev", path: "C:/zyeute-v3" })'
// 6. Mission Control: Emerald Pulse. "Swarm Stabilized."
```

---

## 💎 The "Mic Drop" for Google (Tuesday)

### Demo Script

1. **Open Mission Control Dashboard**
   - Real-time telemetry feed
   - Emerald pulse indicators
   - Tool execution logs

2. **Click "KNOCK DOWN DOOR"**
   - Watch Infantry Log scroll with Windows MCP commands
   - Chrome opens autonomously
   - Queen Bee reports compute savings

3. **Show the Architecture**
   ```
   👑 Queen Bee (Llama 4 Maverick)
      ↓
   🔧 SwarmOrchestrator
      ↓
   🛠️ MCP Bridge (Windows + Chrome)
      ↓
   💻 System Actions
   ```

---

## 📊 Architecture Overview

```
┌─────────────────────────────────────┐
│   👑 Queen Bee (SwarmOrchestrator)   │
│   - Receives directives              │
│   - Coordinates Maverick reasoning   │
│   - Broadcasts telemetry            │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   🦙 Llama 4 Maverick Tool Loop     │
│   - Multi-turn reasoning             │
│   - Tool call detection              │
│   - Automatic tool execution         │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   🛠️ MCP Client Bridge              │
│   - Windows MCP tools               │
│   - Chrome MCP tools                │
│   - Tool execution                  │
└──────────────┬──────────────────────┘
               │
               ↓
┌─────────────────────────────────────┐
│   💻 System Actions                  │
│   - PowerShell commands              │
│   - Chrome automation                │
│   - File operations                  │
└─────────────────────────────────────┘
```

---

## 🔧 Available Tools

### Windows MCP Tools

- `windows.run_command` - Execute PowerShell/CMD commands
- `windows.read_file` - Read files
- `windows.write_file` - Write files
- `windows.list_processes` - List running processes
- `windows.kill_process` - Terminate processes

### Chrome MCP Tools

- `chrome.open_url` - Open URL in browser
- `chrome.take_screenshot` - Screenshot current page
- `chrome.get_page_content` - Extract page content
- `chrome.click_element` - Click element by selector
- `chrome.fill_form` - Fill form fields
- `chrome.navigate` - Navigate to URL

---

## 📝 Usage Examples

### Example 1: Health Check

```typescript
const result = await swarmOrchestrator.executeDirective(
  "Check if the Zyeuté dev server is running on localhost:3000",
);
```

### Example 2: Auto-Fix

```typescript
const result = await swarmOrchestrator.executeDirective(
  "The dev server crashed. Restart it and verify it's healthy.",
);
```

### Example 3: Content Analysis

```typescript
const result = await swarmOrchestrator.executeDirective(
  "Open Chrome, navigate to localhost:3000, and analyze the page content for any errors.",
);
```

---

## 🚨 Troubleshooting

### Llama 4 Maverick Not Responding

1. Check `llama-stack` server is running:

   ```bash
   curl http://localhost:8321/health
   ```

2. Verify `GROQ_API_KEY` is set:

   ```bash
   echo $GROQ_API_KEY
   ```

3. Check server logs for errors

### MCP Tools Not Working

1. Verify Windows tools use correct paths
2. Check Chrome MCP server is installed (if using)
3. Review tool execution logs

### Mission Fails

1. Check telemetry history:

   ```typescript
   const history = swarmOrchestrator.getTelemetryHistory();
   console.log(history);
   ```

2. Review error messages in result
3. Check max iterations (default: 10)

---

## ✅ Best Practices

1. **Clear directives** - Be specific about what you want
2. **Monitor telemetry** - Watch the mission control dashboard
3. **Handle errors** - Check result.success before proceeding
4. **Limit iterations** - Adjust maxIterations for complex tasks
5. **Test tools** - Verify MCP tools work independently first

---

## 🎯 Next Steps

1. **Build Mission Control Dashboard** - Real-time telemetry visualization
2. **Add More Tools** - Extend MCP bridge with additional capabilities
3. **Optimize Reasoning** - Fine-tune Llama 4 Maverick prompts
4. **Add Persistence** - Store mission history in database

---

**The Colony is alive. The Queen has her voice.** 👑🦙
