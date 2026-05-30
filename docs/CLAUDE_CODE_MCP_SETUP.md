# Claude Code MCP Setup - Supabase Integration

**Goal:** Share the Supabase MCP server configured in Cursor with Claude Code

---

## Current Setup

**Cursor MCP:**

- Server: `user-supabase`
- Location: `c:\Users\north\.cursor\projects\c-Users-north-ZyeuteV5\mcps\user-supabase\`
- Status: Requires authentication

---

## Option 1: Add Supabase MCP via Claude Code CLI (Recommended)

**If Claude Code CLI is installed:**

```bash
# Add Supabase MCP server
claude mcp add --transport http supabase <SUPABASE_MCP_URL>
```

**Or if using stdio transport:**

```bash
claude mcp add supabase npx -y @modelcontextprotocol/server-supabase
```

**With environment variables:**

```bash
claude mcp add supabase npx -y @modelcontextprotocol/server-supabase \
  --env SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co \
  --env SUPABASE_KEY=your_supabase_anon_key_here
```

---

## Option 2: Configure via Claude Code Config File

**Find Claude Code config location:**

**Windows:**

- `%APPDATA%\Claude\claude_code_config.json`
- Or: `%USERPROFILE%\.claude\claude_code_config.json`

**Create/Edit config file:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://vuanulvyqkfefmjcikfk.supabase.co",
        "SUPABASE_KEY": "your_supabase_anon_key_here"
      }
    }
  }
}
```

**Or if using HTTP transport:**

```json
{
  "mcpServers": {
    "supabase": {
      "url": "https://your-supabase-mcp-server-url.com/mcp",
      "headers": {
        "Authorization": "Bearer your-api-key"
      }
    }
  }
}
```

---

## Option 3: Use Same Supabase MCP Package as Cursor

**If Cursor is using a specific Supabase MCP package:**

1. **Check Cursor's MCP config:**
   - Cursor Settings → MCP Tools
   - Find `user-supabase` server configuration
   - Copy the command and args

2. **Apply to Claude Code:**

```bash
# Example if Cursor uses @modelcontextprotocol/server-supabase
claude mcp add supabase npx -y @modelcontextprotocol/server-supabase \
  --env SUPABASE_URL=https://vuanulvyqkfefmjcikfk.supabase.co \
  --env SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

---

## Required Environment Variables

**From your `.env.example`:**

| Variable                    | Value                                      | Source                    |
| --------------------------- | ------------------------------------------ | ------------------------- |
| `SUPABASE_URL`              | `https://vuanulvyqkfefmjcikfk.supabase.co` | Supabase Dashboard        |
| `SUPABASE_KEY`              | Your anon key                              | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Your service role key                      | Supabase → Settings → API |

---

## Verification

**After setup, verify MCP is working:**

```bash
# List configured MCP servers
claude mcp list

# Test Supabase connection
claude mcp test supabase
```

---

## Troubleshooting

### "MCP server not found"

- Verify the package name: `@modelcontextprotocol/server-supabase`
- Check if `npx` is available
- Try installing globally: `npm install -g @modelcontextprotocol/server-supabase`

### "Authentication failed"

- Verify `SUPABASE_URL` and `SUPABASE_KEY` are correct
- Check Supabase project is active
- Ensure API keys have correct permissions

### "Transport not supported"

- Claude Code may require HTTP transport
- Try: `claude mcp add --transport http supabase <URL>`

---

## Next Steps

1. **Check Cursor's exact Supabase MCP config** (Settings → MCP Tools)
2. **Copy configuration** to Claude Code
3. **Set environment variables** (SUPABASE_URL, SUPABASE_KEY)
4. **Test connection** with `claude mcp test supabase`

---

**Once configured, Claude Code will have access to the same Supabase MCP as Cursor!** 🔗
