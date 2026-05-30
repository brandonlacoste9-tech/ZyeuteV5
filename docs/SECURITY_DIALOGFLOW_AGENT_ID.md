# Security Guide: Dialogflow CX Agent ID

**⚠️ CRITICAL:** Your Dialogflow CX Agent ID is sensitive and should never be committed to git.

---

## Why It's Sensitive

- **Credit Access:** The Agent ID allows access to your Dialogflow CX credits ($813.16)
- **API Abuse:** If exposed, attackers could use your credits for their own purposes
- **Cost Impact:** Unauthorized usage could drain your credits before expiration

---

## Security Best Practices

### ✅ DO

1. **Store in Environment Variables Only**
   - Production: Render/Railway environment variables (encrypted)
   - Local: `.env` file (gitignored)

2. **Use Placeholders in Code**
   - `.env.example` should use `YOUR_AGENT_ID_HERE`
   - Documentation should use placeholders, not real IDs

3. **Rotate if Exposed**
   - If Agent ID is ever committed or exposed, regenerate it in Dialogflow CX Console
   - Update all environment variables immediately

4. **Restrict Access**
   - Only team members who need it should have access
   - Use secrets management (Render/Railway secrets) for production

### ❌ DON'T

1. **Never Commit Real Agent ID**
   - Don't put it in `.env` files that are committed
   - Don't put it in code comments
   - Don't put it in documentation (use placeholders)

2. **Don't Share Publicly**
   - Don't paste it in chat logs
   - Don't include it in screenshots
   - Don't share it in public repos or issues

3. **Don't Hardcode**
   - Never hardcode Agent ID in source code
   - Always use environment variables

---

## Current Security Status

### ✅ Secured Files

- `.gitignore` - Excludes `.env` files ✅
- `.env.example` - Uses placeholder `YOUR_AGENT_ID_HERE` ✅
- Documentation - Uses placeholders ✅

### 🔒 Where to Store Real Agent ID

1. **Production (Render/Railway)**

   ```
   DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_REAL_AGENT_ID
   ```

   - Set in dashboard → Environment Variables
   - Marked as "Secret" if available

2. **Local Development**
   ```
   # Create .env file (gitignored)
   DIALOGFLOW_CX_AGENT_ID=projects/spatial-garden-483401-g8/locations/us-central1/agents/YOUR_REAL_AGENT_ID
   ```

---

## Verification Checklist

- [ ] `.env` is in `.gitignore`
- [ ] `.env.example` uses placeholder
- [ ] No real Agent ID in committed files
- [ ] Production env vars are set securely
- [ ] Team members know not to commit secrets

---

## If Agent ID is Exposed

1. **Immediately:**
   - Regenerate Agent ID in Dialogflow CX Console
   - Update all environment variables
   - Review Dialogflow CX usage logs for unauthorized access

2. **Prevent Future Exposure:**
   - Review git history (use `git-secrets` or similar)
   - Rotate credentials
   - Update security practices

---

## Getting Your Agent ID Safely

1. Go to [Dialogflow CX Console](https://console.cloud.google.com/dialogflow/cx)
2. Select your agent
3. Copy Agent ID from URL or agent settings
4. **Paste directly into environment variable** (don't save to files)
5. Verify it works with test script

---

**Remember: Treat your Agent ID like a password. Keep it secret, keep it safe.** 🔒
