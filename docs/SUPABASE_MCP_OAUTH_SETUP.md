# Supabase MCP OAuth Setup

**Issue:** Supabase hosted MCP (`mcp.supabase.com`) requires OAuth authentication

---

## Option 1: Authorize via Supabase Dashboard (Recommended)

### Step 1: Go to Supabase Dashboard

1. **Open:** https://app.supabase.com/project/vuanulvyqkfefmjcikfk
2. **Navigate to:** Settings → Integrations (or AI / MCP settings)
3. **Look for:** "Model Context Protocol" or "MCP" section
4. **Click:** "Authorize Claude Code" or "Connect MCP"

### Step 2: Authorize Access

- **Click "Allow"** when prompted
- **Copy the authorization token** if provided
- **Add to `.mcp.json`** if token is required

### Step 3: Update Configuration (if needed)

If Supabase provides a token, update `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://mcp.supabase.com/mcp?project_ref=vuanulvyqkfefmjcikfk",
      "headers": {
        "Authorization": "Bearer YOUR_OAUTH_TOKEN_HERE"
      }
    }
  }
}
```

---

## Option 2: Use Local MCP Server (No OAuth Required)

**Switch to local stdio-based MCP server:**

Update `.mcp.json`:

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://postgres:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres"
      }
    }
  }
}
```

**Or use Supabase-specific package:**

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

---

## Option 3: Continue Using Scripts (Current Working Solution)

**Direct database access via scripts works fine:**

```bash
# Test connection
tsx scripts/test-supabase-mcp.ts

# Run queries via Node.js scripts
# Use Supabase client library directly
```

**Pros:**

- ✅ No OAuth required
- ✅ Already working
- ✅ Full control

**Cons:**

- ❌ Not integrated with Claude Code MCP
- ❌ Need to write scripts for each query

---

## Recommendation

**Try Option 1 first** (OAuth via Supabase Dashboard):

1. Quickest path to MCP integration
2. Native Supabase MCP features
3. Better Claude Code integration

**If OAuth doesn't work, use Option 2** (Local MCP server):

1. No browser authentication needed
2. Uses your existing credentials
3. Works offline

**If both fail, continue with Option 3** (Scripts):

1. Already working
2. Can enhance scripts as needed

---

## Next Steps

1. **Check Supabase Dashboard** for MCP/OAuth settings
2. **Authorize Claude Code** if option available
3. **Restart Claude Code** after authorization
4. **Test MCP connection** with a simple query

---

**Which option would you like to try?** 🔗
