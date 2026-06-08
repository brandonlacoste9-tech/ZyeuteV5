-- Cron overlap prevention + TikTok external_id uniqueness (publications.media_metadata.tiktok_id)

create table if not exists cron_locks (
  name text primary key,
  acquired_at timestamptz not null default now()
);

create index if not exists cron_locks_acquired_at_idx on cron_locks (acquired_at);

-- Partial unique index: one publication per TikTok video_id
create unique index if not exists publications_tiktok_id_unique
  on publications ((media_metadata->>'tiktok_id'))
  where media_metadata->>'tiktok_id' is not null
    and media_metadata->>'tiktok_id' <> '';

-- Batch duplicate check for seed scripts (service role / RPC)
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
  where media_metadata->>'tiktok_id' = any(ids);
$$;
