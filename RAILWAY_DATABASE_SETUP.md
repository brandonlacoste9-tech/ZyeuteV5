# 🚂 Railway Database Auto-Setup

## ✅ **What Was Implemented**

Automatic database setup that runs **every time Railway starts** your application. This ensures your production database is always properly configured with:

1. ✅ Database schema (all tables)
2. ✅ Publications table (for posts)
3. ✅ Test user account (if none exists)
4. ✅ 15 Quebec seed posts (if none exist)

## 🔧 **How It Works**

### Startup Flow

When Railway starts your application:

1. **Railway runs:** `bash scripts/railway-startup.sh`
2. **Startup script:**
   - Checks if `DATABASE_URL` is set
   - Runs schema migration (idempotent)
   - Creates publications table (if needed)
   - Creates test user (if none exist)
   - Runs seed migration (if no posts exist)
3. **Then starts:** `node dist/index.cjs`

### Idempotent Design

All scripts are **idempotent** - safe to run multiple times:
- ✅ Checks for existing data before creating
- ✅ Skips steps that are already complete
- ✅ Won't duplicate data
- ✅ Won't crash if run multiple times

## 📋 **Files Created**

### `scripts/railway-startup.sh`
- Main startup script that Railway executes
- Runs all database setup steps in order
- Then starts the application

### `scripts/railway-setup-db.ts`
- Comprehensive database setup script
- Can be run standalone: `npm run db:setup`
- Handles all database initialization

### Updated `railway.json`
- Changed `startCommand` from `node dist/index.cjs`
- To: `bash scripts/railway-startup.sh`
- This ensures migrations run before app starts

## 🚀 **Deployment Status**

**Current Status:** ✅ **Pushed to GitHub**

Railway will automatically:
1. Pull the latest code
2. Build the application
3. Run the startup script (which sets up the database)
4. Start the application

**Next Railway deployment will:**
- ✅ Automatically create schema if missing
- ✅ Automatically create publications table if missing
- ✅ Automatically create test user if none exist
- ✅ Automatically insert 15 Quebec posts if none exist

## 🧪 **Manual Testing**

You can test the setup script locally:

```bash
# Set your Railway DATABASE_URL
export DATABASE_URL="postgresql://..."

# Run the setup script
npm run db:setup

# Or run the full startup script
bash scripts/railway-startup.sh
```

## 📊 **What Gets Created**

### Database Schema
- All 11 base tables from `migrations/0000_misty_namorita.sql`
- Includes: `user_profiles`, `posts`, `comments`, `notifications`, etc.

### Publications Table
- Table: `publications`
- Columns: `id`, `user_id`, `content`, `caption`, `media_url`, `visibilite`, `hive_id`, `region_id`, etc.
- Indexes for performance

### Test User
- Username: `test_user_quebec`
- Email: `test@zyeute.quebec`
- Only created if no users exist

### Seed Posts
- 15 Quebec-themed posts
- Only inserted if no Quebec posts exist
- Includes hashtags, images, engagement metrics

## 🔍 **Verification**

After Railway deploys, check:

1. **Railway Logs:**
   ```
   Railway Dashboard → Your Service → Logs
   ```
   Look for:
   - "✅ Connected to Railway database"
   - "✅ Database setup complete!"
   - "📊 Status: X user(s), Y Quebec post(s)"

2. **API Endpoint:**
   ```bash
   curl https://zyeute-api.railway.app/api/feed
   ```
   Should return posts array with 15 items

3. **Frontend:**
   - Visit: https://www.zyeute.com/feed
   - Should see 15 Quebec posts

## 🚨 **Troubleshooting**

### If database setup fails:
- Check Railway logs for error messages
- Verify `DATABASE_URL` is set in Railway environment variables
- Check database connection string is correct

### If posts don't appear:
- Check Railway logs for seed migration output
- Verify publications table exists: `SELECT COUNT(*) FROM publications;`
- Check feed API endpoint returns data

### If you need to reset:
- The scripts are idempotent - just redeploy
- Or manually run: `npm run db:setup` via Railway CLI

## 🎯 **Next Steps**

1. **Wait for Railway to deploy** (automatic from GitHub push)
2. **Check Railway logs** to verify database setup ran
3. **Visit www.zyeute.com/feed** to see the 15 Quebec posts
4. **Celebrate!** 🦫⚜️🇨🇦

---

**Status:** ✅ Ready for Railway deployment  
**Auto-setup:** ✅ Enabled  
**Next deployment:** Will automatically set up database
