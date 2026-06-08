-- Per-user hidden posts ("not interested") — hide from viewer's Pour toi without global delete.
-- Safe to re-run.

create table if not exists user_hidden_posts (
  user_id uuid not null references user_profiles(id) on delete cascade,
  post_id uuid not null references publications(id) on delete cascade,
  reason text not null default 'not_interested',
  created_at timestamptz not null default now(),
  primary key (user_id, post_id)
);

create index if not exists user_hidden_posts_user_id_idx
  on user_hidden_posts (user_id);
