# Railway Error Patterns 🔍

**Quick reference for Railway Deploy Logs errors**

---

## 🔥 Critical Error Messages

The backend logs these exact messages before exiting. Look for them in **Deploy Logs**:

### Error 1: Missing DATABASE_URL

```
🔥 [Startup] DATABASE_URL is not set. Set it in .env or your environment.
🔥 [Startup] EXITING: Missing DATABASE_URL environment variable
```

**Fix:** Set `DATABASE_URL` in Railway Variables

---

### Error 2: Database Connection Failed

```
🔥 [Startup] EXITING: Database connection failed - [error message]
🔥 [Startup] DATABASE_URL format: postgresql://postgres.vuanulvyqkfefmjcikfk...
```

**Common causes:**

- Wrong connection string format
- Invalid credentials
- Network/firewall issue
- Database not accessible

**Fix:** Verify `DATABASE_URL` format:

```
postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:6543/postgres
```

---

### Error 3: Migration Failed

```
🔥 [Startup] EXITING: Migration failed - [error message]
```

**Common causes:**

- Database schema mismatch
- Migration script error
- Insufficient permissions

**Fix:** Check migration scripts and database permissions

---

### Error 4: Port Already in Use

```
Error: listen EADDRINUSE: address already in use :::3000
```

**Fix:** Backend should use `process.env.PORT` (Railway sets this automatically)

---

### Error 5: Uncaught Exception

```
❌ Uncaught Exception: [error]
```

**Fix:** Check the error message for details

---

### Error 6: Unhandled Rejection

```
❌ Unhandled Rejection: [reason]
```

**Fix:** Check the rejection reason

---

## ✅ Success Pattern

If backend starts successfully, you'll see:

```
🚀 Server running on port [PORT]
✅ Database connected
✅ Migrations synced
🔌 Socket.IO ready
```

Then healthcheck should pass:

- `/api/health` → `200 OK`
- `/ready` → `200 OK` with `{"status":"healthy","db":"connected"}`

---

## 🔍 How to Find These Errors

1. **Railway Dashboard** → Your Service
2. **Deploy Logs** tab (NOT Build Logs)
3. Scroll to the **end** of logs (most recent)
4. Look for `🔥 [Startup] EXITING:` messages
5. Copy the **exact error message**

---

## 📋 What to Share

When sharing Railway errors, include:

1. **Exact error message** (copy/paste)
2. **Line number** (if shown)
3. **Timestamp** (when it occurred)
4. **Environment variables status** (is `DATABASE_URL` set?)

---

## 🛠️ Quick Fixes

### If you see "Missing DATABASE_URL":

```bash
# Set in Railway Dashboard → Variables
DATABASE_URL=postgresql://YOUR_USER:YOUR_PASSWORD@YOUR_HOST:6543/postgres
```

### If you see "Database connection failed":

1. Verify `DATABASE_URL` is correct
2. Test connection locally: `npm run verify:railway-vars`
3. Check Supabase dashboard for database status

### If you see "Migration failed":

1. Check database permissions
2. Verify migration scripts are correct
3. Check if database schema is compatible

---

**Once you share the exact error message from Deploy Logs, I can provide a targeted fix!** 🎯
