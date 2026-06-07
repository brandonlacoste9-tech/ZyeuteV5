# Supabase MCP Configuration for Claude Code

**Environment Variable:** `SUPABASE_ANON_KEY` or `VITE_SUPABASE_ANON_KEY`

---

## Where to Find Your Supabase Anon Key

1. **Go to Supabase Dashboard:**
   - https://app.supabase.com/project/[REF]/settings/api

2. **Find "Project API keys" section:**
   - Look for **"anon"** or **"anon public"** key
   - This is your `SUPABASE_ANON_KEY`

3. **Copy the key:**
   - It starts with `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
   - Full key is quite long (200+ characters)

---

## For Claude Code MCP Setup

**When OpenClaw asks for `SUPABASE_ANON_KEY`:**

**Option 1: Use from your `.env` file**

```bash
# Check your .env file
cat .env | grep SUPABASE_ANON_KEY
```

**Option 2: Get from Supabase Dashboard**

- Project: `[REF]`
- Settings → API → Project API keys → **anon public** key

---

## Complete MCP Configuration

**For Claude Code, use:**

```json
{
  "mcpServers": {
    "supabase": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-supabase"],
      "env": {
        "SUPABASE_URL": "https://[REF].supabase.co",
        "SUPABASE_KEY": "YOUR_SUPABASE_ANON_KEY_HERE"
      }
    }
  }
}
```

**Note:** `SUPABASE_KEY` in MCP config = `SUPABASE_ANON_KEY` from your `.env`

---

## Security Note

⚠️ **The anon key is safe to use** - it's designed to be exposed to clients (browser, mobile apps). However:

- It should still be kept private
- Don't commit it to public repos
- Use environment variables, not hardcoded values

---

**Provide the anon key from your `.env` file or Supabase Dashboard when OpenClaw asks for it!** 🔑
