# 🔍 Database Schema Check - Missing Column Diagnostic

## How to Find the Missing Column

1. **Go to Railway Dashboard:**
   - Navigate to your backend service
   - Click **Deployments** tab
   - Click on the latest deployment
   - Click **Logs** tab

2. **Look for the error:**
   - Search for: `errorMissingColumn` or `column "X" does not exist`
   - The error will show something like: `column "bio" does not exist` or `column "cash_credits" does not exist`

3. **Match the column name to the schema below**

---

## 📋 Complete Users Table Schema (Expected Columns)

Based on `shared/schema.ts`, here are ALL columns that should exist in your `user_profiles` table:

### Core User Fields

- `id` (uuid, primary key)
- `username` (varchar 50, unique, not null)
- `email` (varchar 255, unique, nullable)
- `display_name` (varchar 100, nullable)
- `bio` (text, nullable)
- `avatar_url` (text, nullable)
- `region` (text, nullable)
- `city` (text, nullable)
- `region_id` (text, nullable)

### Role & Permissions

- `role` (enum: 'visitor', 'citoyen', 'moderator', 'founder', 'banned', default: 'citoyen')
- `custom_permissions` (jsonb, default: {})
- `is_admin` (boolean, default: false)
- `is_premium` (boolean, default: false)
- `plan` (text, default: 'free')

### Credits & Economy

- `credits` (integer, default: 0)
- `piasse_balance` (double precision, default: 0.0)
- `total_karma` (integer, default: 0)
- `karma_credits` (integer, default: 0) ⚠️ **Common missing column**
- `cash_credits` (integer, default: 0) ⚠️ **Common missing column**
- `total_gifts_sent` (integer, default: 0)
- `total_gifts_received` (integer, default: 0)

### Subscription

- `subscription_tier` (varchar 20, default: 'free')

### Location

- `location` (geography Point, nullable)

### Timestamps

- `created_at` (timestamp, default: now(), not null)
- `updated_at` (timestamp, default: now())

### Features

- `ti_guy_comments_enabled` (boolean, default: true)
- `hive_id` (enum: 'quebec', 'brazil', 'argentina', 'mexico', default: 'quebec')

### Additional Fields

- `legendary_badges` (jsonb, default: [])
- `tax_id` (varchar 50, nullable)
- `bee_alias` (varchar 50, nullable)
- `nectar_points` (integer, default: 0)
- `current_streak` (integer, nullable) ⚠️ **Common missing column**
- `max_streak` (integer, default: 0)
- `last_daily_bonus` (timestamp, nullable)
- `unlocked_hives` (jsonb, default: ["quebec"])
- `parent_id` (uuid, nullable, references user_profiles.id)

---

## 🛠️ How to Add Missing Column in Supabase

1. Go to **Supabase Dashboard** → **Table Editor**
2. Select the `user_profiles` table
3. Click **Add Column** (or use SQL Editor)

### Example: Adding `cash_credits` column

**Option 1: Using Table Editor (GUI)**

- Column name: `cash_credits`
- Type: `int4` (integer)
- Default value: `0`
- Is Nullable: ✅ No (or Yes if you prefer)

**Option 2: Using SQL Editor**

```sql
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS cash_credits INTEGER DEFAULT 0;
```

### Common Column Types:

- `text` → Use `text` type in Supabase
- `varchar(50)` → Use `varchar` type, set length to 50
- `integer` → Use `int4` type
- `boolean` → Use `bool` type
- `timestamp` → Use `timestamptz` type
- `jsonb` → Use `jsonb` type
- `double precision` → Use `float8` type
- `uuid` → Use `uuid` type

---

## ⚠️ Most Commonly Missing Columns

Based on recent code changes, these are the most likely culprits:

1. **`cash_credits`** (integer) - Used in credit system
2. **`karma_credits`** (integer) - Used in credit system
3. **`current_streak`** (integer) - Used in gamification
4. **`custom_permissions`** (jsonb) - Used in RBAC

---

## 🔍 Quick SQL to Check Missing Columns

Run this in Supabase SQL Editor to see all existing columns:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

---

**Once you identify the missing column from Railway logs, use the guide above to add it!**
