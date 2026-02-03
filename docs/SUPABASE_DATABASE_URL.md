# Getting DATABASE_URL from Supabase

The backend needs a PostgreSQL connection string in `DATABASE_URL`. This project uses the Supabase project below.

## This project’s Supabase details (from repo)

- **Project ref:** `vuanulvyqkfefmjcikfk`
- **Project URL:** `https://vuanulvyqkfefmjcikfk.supabase.co`
- **Pooler host (transaction mode):** `aws-0-us-east-1.pooler.supabase.com:6543`

## Steps

1. Get your **database password** from: **https://app.supabase.com/project/vuanulvyqkfefmjcikfk/settings/database** (or reset it there).
2. Put this in `.env`, replacing `[YOUR-PASSWORD]` with that password:
   ```bash
   DATABASE_URL=postgresql://postgres.vuanulvyqkfefmjcikfk:[YOUR-PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
   ```

## Connection modes

- **Transaction pooler (port 6543)** – recommended for the backend. Use the URI above.
- **Session (port 5432)** – direct: `postgresql://postgres:[YOUR-PASSWORD]@db.vuanulvyqkfefmjcikfk.supabase.co:5432/postgres`
