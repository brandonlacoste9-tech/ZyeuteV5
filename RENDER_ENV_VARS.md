# Render Environment Variables — Complete Reference
# Set these in both `zyeute-api` AND `zyeute-worker` services

## ✅ CONFIRMED VALUES (paste as-is)

### Redis (Upstash)
REDIS_URL=rediss://default:gQAAAAAAAWIAAAIncDI5NjU0ZTlmZjk5NGM0MDYxODRiOGRmZGZkNGVmYzQ3NnAyOTA2MjQ@firm-dodo-90624.upstash.io:6379

### Supabase
VITE_SUPABASE_URL=https://wbpuiqozntavxsqaemcz.supabase.co
SUPABASE_URL=https://wbpuiqozntavxsqaemcz.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndicHVpcW96bnRhdnhzcWFlbWN6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQwOTQ5NjMsImV4cCI6MjA4OTY3MDk2M30.Gy0kye65epaId0-KUl-xMZM_r_6shSXWeFxHJ4TG6CQ

### Mux
MUX_TOKEN_ID=f6fab3e6-f183-4b26-9c2a-eae624b3f618
MUX_TOKEN_SECRET=3p4EQ23xm+xj+lWAcMOj+CftqOljrCEbKJ+4Ba866VcR
MUX_WEBHOOK_SECRET=jd5147g8hk2512bhiu4tjj70nncr4ose

### Worker
WORKER_CONCURRENCY=2
HLS_WORKER_CONCURRENCY=1

## ⏳ NEED FROM YOU

### Supabase service role key (for bucket uploads)
# Get from: https://supabase.com/dashboard/project/wbpuiqozntavxsqaemcz/settings/api
SUPABASE_SERVICE_ROLE_KEY=<paste from Supabase dashboard>

### Database
# Get from: https://supabase.com/dashboard/project/wbpuiqozntavxsqaemcz/settings/database
DATABASE_URL=postgresql://postgres.wbpuiqozntavxsqaemcz:[PASSWORD]@aws-0-us-east-1.pooler.supabase.com:6543/postgres
