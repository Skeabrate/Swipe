-- Swipe App – Database Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ─── Tables ───────────────────────────────────────────────────────────────────

create table rooms (
  id                uuid primary key default gen_random_uuid(),
  code              text unique not null,
  topic             text not null,
  phase             text not null default 'lobby',  -- lobby | submitting | voting | tiebreaker | results
  host_session_token text not null,
  max_suggestions   int not null default 10,
  anonymous         boolean not null default true,
  created_at        timestamptz default now()
);

create table participants (
  id            uuid primary key default gen_random_uuid(),
  room_id       uuid references rooms(id) on delete cascade not null,
  name          text not null,
  session_token text unique not null,
  is_ready      boolean default false,
  created_at    timestamptz default now()
);

create table suggestions (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid references rooms(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  title          text not null,
  created_at     timestamptz default now()
);

create table votes (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid references rooms(id) on delete cascade not null,
  suggestion_id  uuid references suggestions(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  liked          boolean not null,
  created_at     timestamptz default now(),
  unique(suggestion_id, participant_id)
);

create table tiebreaker_picks (
  id             uuid primary key default gen_random_uuid(),
  room_id        uuid references rooms(id) on delete cascade not null,
  suggestion_id  uuid references suggestions(id) on delete cascade not null,
  participant_id uuid references participants(id) on delete cascade not null,
  created_at     timestamptz default now(),
  unique(room_id, participant_id)
);

-- ─── Replica identity (required for Realtime UPDATE/DELETE events) ─────────────

alter table rooms replica identity full;
alter table participants replica identity full;
alter table suggestions replica identity full;
alter table votes replica identity full;
alter table tiebreaker_picks replica identity full;

-- ─── Row Level Security ────────────────────────────────────────────────────────

alter table rooms enable row level security;
alter table participants enable row level security;
alter table suggestions enable row level security;
alter table votes enable row level security;
alter table tiebreaker_picks enable row level security;

-- Public read (used by anon key for realtime subscriptions)
create policy "public_read" on rooms for select using (true);
create policy "public_read" on participants for select using (true);
create policy "public_read" on suggestions for select using (true);
create policy "public_read" on votes for select using (true);
create policy "public_read" on tiebreaker_picks for select using (true);

-- Writes go through API routes using the service role key (bypasses RLS)

-- ─── Realtime ─────────────────────────────────────────────────────────────────
-- In Supabase dashboard: Database → Replication → supabase_realtime publication
-- Make sure all 5 tables above are added to the publication.
