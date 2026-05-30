# Claude API Key Setup

**API Key:** Configured in `.env` (gitignored for security)

---

## Configuration

**Added to `.env`:**

```bash
CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY_HERE
```

---

## Usage

### For Claude Code

**Claude Code should automatically use:**

- Environment variable: `CLAUDE_API_KEY`
- Or: `ANTHROPIC_API_KEY` (alternative name)

**If needed, set explicitly:**

```bash
export CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY_HERE
```

### For Scripts/Node.js

**Access in scripts:**

```typescript
import "dotenv/config";

const apiKey = process.env.CLAUDE_API_KEY || process.env.ANTHROPIC_API_KEY;
```

---

## Security Notes

✅ **Key is stored in `.env`** (gitignored - safe)  
✅ **Not committed to repository**  
⚠️ **Keep private** - Don't share or expose publicly

---

## Verification

**Test API key:**

```bash
# Using curl
curl https://api.anthropic.com/v1/messages \
  -H "x-api-key: $CLAUDE_API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d '{"model": "claude-3-5-sonnet-20241022", "max_tokens": 1024, "messages": [{"role": "user", "content": "Hello"}]}'
```

---

## For OpenClaw/Max

**If Max needs Claude API access:**

- Key is available in `.env`
- Can be passed to Max's configuration
- Or accessed via environment variables

---

**Claude API key configured! Ready to use.**
