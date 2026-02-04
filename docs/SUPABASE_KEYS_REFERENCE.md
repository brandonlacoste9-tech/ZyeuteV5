# Supabase Keys Reference

**For OpenClaw MCP Setup**

---

## Keys Summary

| Key Type             | Variable Name               | Value                                     | Usage                                     |
| -------------------- | --------------------------- | ----------------------------------------- | ----------------------------------------- |
| **Anon Key**         | `SUPABASE_ANON_KEY`         | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` | Public client-side key (safe for browser) |
| **Secret Key**       | `SUPABASE_SECRET_KEY`       | `YOUR_SUPABASE_SECRET_KEY_HERE`           | Server-side key (keep private)            |
| **Service Role Key** | `SUPABASE_SERVICE_ROLE_KEY` | (Check .env)                              | Full admin access (keep very private)     |

---

## For MCP Configuration

**Most MCP servers use the anon key (`SUPABASE_ANON_KEY`)** for client-side operations.

**If OpenClaw asks for `SUPABASE_SECRET_KEY`:**

```
YOUR_SUPABASE_SECRET_KEY_HERE
```

**If OpenClaw asks for `SUPABASE_ANON_KEY`:**

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

---

## Security Notes

⚠️ **Secret Key:**

- Has more permissions than anon key
- Should only be used server-side
- Never expose to client/browser
- Keep in environment variables only

✅ **Anon Key:**

- Safe for client-side use
- Still keep private (don't commit to public repos)
- Used for most MCP operations

---

**Provide the secret key when OpenClaw asks for `SUPABASE_SECRET_KEY`!**
