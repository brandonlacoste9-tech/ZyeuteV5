# 🔍 How to Find the Missing Database Column

## Step-by-Step Instructions

### 1. Go to Railway Dashboard

- Visit: https://railway.app/project/ad61359f-e003-47db-9feb-2434b9c266f5
- Click your backend service
- Click **Deployments** tab
- Click on the **latest deployment** (most recent one)

### 2. Open Logs

- Click **Logs** tab
- Scroll through the logs looking for errors

### 3. Search for the Error

Use the search box or Ctrl+F to search for:

- `errorMissingColumn`
- `column "X" does not exist`
- `does not exist`

### 4. What to Look For

The error will look something like:

```
errorMissingColumn: column "cash_credits" does not exist
```

or

```
ERROR: column "bio" does not exist
```

or

```
relation "user_profiles" does not contain column "avatar_url"
```

### 5. Copy the Column Name

Once you find it, copy the **exact column name** (e.g., `cash_credits`, `bio`, `avatar_url`)

---

## Common Column Names That Might Be Missing

Based on the schema, these are the most likely culprits:

1. **`cash_credits`** (integer) - Used in credit system
2. **`karma_credits`** (integer) - Used in credit system
3. **`current_streak`** (integer) - Used in gamification
4. **`custom_permissions`** (jsonb) - Used in RBAC
5. **`legendary_badges`** (jsonb) - Used in gamification
6. **`unlocked_hives`** (jsonb) - Used in hive system
7. **`parent_id`** (uuid) - Used in parental controls

---

## Once You Find the Column Name

1. **Tell me the exact column name** (e.g., "cash_credits")
2. **I'll tell you:**
   - The exact SQL to run in Supabase
   - The column type and default value
   - How to verify it was added correctly

---

## Alternative: Check All Columns in Supabase

If you can't find the error in logs, you can check what columns exist:

1. Go to **Supabase Dashboard** → **SQL Editor**
2. Run this query:

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;
```

3. Compare the results with the schema in `shared/schema.ts` or `DATABASE_SCHEMA_CHECK.md`

---

**The column name is the key! Once you have it, I can give you the exact fix.**
