-- Cron overlap prevention + TikTok duplicate prevention (publications.media_metadata.tiktok_id)
-- Safe to re-run: uses IF NOT EXISTS / CREATE OR REPLACE.

-- ── 1. Cron lock table (prevents overlapping Omkar seed runs) ─────────────────
create table if not exists cron_locks (
  name text primary key,
  acquired_at timestamptz not null default now()
);

create index if not exists cron_locks_acquired_at_idx on cron_locks (acquired_at);

-- ── 2. One-time dedupe (run once if unique index creation failed on duplicates) ─
-- Keeps earliest row per tiktok_id; soft-deletes the rest.
-- Skip this block if you already ran it successfully in Supabase SQL Editor.
/*
begin;

with ranked as (
  select
    id,
    row_number() over (
      partition by media_metadata->>'tiktok_id'
      order by created_at asc, id asc
    ) as rn
  from public.publications
  where media_metadata->>'tiktok_id' is not null
    and media_metadata->>'tiktok_id' <> ''
    and deleted_at is null
)
update public.publications p
set deleted_at = now()
from ranked r
where p.id = r.id
  and r.rn > 1;

commit;
*/

-- ── 3. Unique TikTok id among active (non-deleted) publications only ───────────
create unique index if not exists publications_tiktok_id_unique
  on public.publications ((media_metadata->>'tiktok_id'))
  where media_metadata->>'tiktok_id' is not null
    and media_metadata->>'tiktok_id' <> ''
    and deleted_at is null;

-- ── 4. Batch duplicate check for seed scripts (active rows only) ───────────────
create or replace function public.existing_tiktok_ids(ids text[])
returns text[]
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    array_agg(distinct media_metadata->>'tiktok_id'),
    array[]::text[]
  )
  from publications
  where media_metadata->>'tiktok_id' = any(ids)
    and deleted_at is null;
$$;
