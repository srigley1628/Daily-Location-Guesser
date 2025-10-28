-- SQL for Supabase (Postgres) table
-- Run this in Supabase SQL editor

create table if not exists leaderboards (
  id uuid default gen_random_uuid() primary key,
  day_key text not null,
  name text not null,
  time integer not null default 0,
  attempts integer not null default 0,
  score integer not null default 0,
  created_at timestamptz not null default now()
);

-- Index to speed queries by day
create index if not exists idx_leaderboards_day_key on leaderboards(day_key);
