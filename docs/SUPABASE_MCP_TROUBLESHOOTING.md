# Supabase MCP Troubleshooting

**Issue:** Supabase MCP server not showing up in Claude Code tools

---

## Current Status

✅ **Config file exists:** `C:\Users\north\ZyeuteV5\.mcp.json`  
❌ **Supabase MCP not loaded** - Not appearing in available tools

**Available MCP servers:**

- Hugging Face (`mcp__b931ac35-...`)
- Mermaid (`mcp__ee400e51-...`)
- Notion (`mcp__7b3e5901-...`)
- Vercel (`mcp__b99a4bb0-...`)
- Claude in Chrome (`mcp__Claude_in_Chrome__`)
- MCP Registry (`mcp__mcp-registry__`)

---

## Troubleshooting Steps

### Step 1: Verify .mcp.json Configuration

**Check the config file:**

```bash
cat C:\Users\north\ZyeuteV5\.mcp.json
```

**Expected Supabase entry:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://vuanulvyqkfefmjcikfk.supabase.co",
        "SUPABASE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### Step 2: Restart Claude Code

**Full restart required:**

1. **Close Claude Code completely** (not just `/resume`)
2. **Reopen Claude Code**
3. **Look for prompt:** "New MCP server 'supabase' found. Allow?"
4. **Click "Allow"** to enable it

### Step 3: Verify MCP Server Installation

**Check if the package is available:**

```bash
npx -y @modelcontextprotocol/server-supabase --version
```

**If package doesn't exist, try alternative:**

```bash
npm list -g @modelcontextprotocol/server-supabase
```

### Step 4: Check Claude Code MCP Settings

**In Claude Code:**

1. Open Settings (Ctrl+,)
2. Search for "MCP" or "Model Context Protocol"
3. Check if Supabase server is listed
4. Verify it's enabled

---

## Alternative Configuration Methods

### Option A: Use HTTP Transport

If stdio transport isn't working, try HTTP:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://your-supabase-mcp-server.com/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  }
}
```

### Option B: Use Different Package Name

Some MCP servers use different package names:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@supabase/mcp-server"],
      "env": {
        "SUPABASE_URL": "https://vuanulvyqkfefmjcikfk.supabase.co",
        "SUPABASE_KEY": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
      }
    }
  }
}
```

### Option C: Manual Installation

```bash
npm install -g @modelcontextprotocol/server-supabase
```

Then use full path in config.

---

## Expected Tools After Connection

Once Supabase MCP is connected, you should see:

- `mcp__supabase__query` - Run SQL queries
- `mcp__supabase__list_tables` - List database tables
- `mcp__supabase__describe_table` - Get table schema
- `mcp__supabase__insert` - Insert records
- `mcp__supabase__update` - Update records
- `mcp__supabase__delete` - Delete records

---

## Verification

**After restart, test connection:**

```bash
# In Claude Code, try:
# "List all tables in Supabase database"
# Or: "Query the users table from Supabase"
```

**Expected:** Claude should be able to access Supabase tools.

---

## Next Steps

1. ✅ **Check `.mcp.json`** - Verify Supabase config exists
2. ✅ **Restart Claude Code** - Full restart (not resume)
3. ✅ **Approve MCP server** - Click "Allow" when prompted
4. ✅ **Test connection** - Try querying Supabase database

---

**Once Supabase MCP is connected, Claude will have full database access!** 🔗
