-- =====================================================================
-- admin — soft delete for conversations, blocked users, site settings, activity log
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Run AFTER sql/trip-assistant.sql and sql/feedback.sql.
-- Safe to re-run (uses IF NOT EXISTS / DROP ... IF EXISTS / ON CONFLICT DO NOTHING).
-- The admin pages read and write with the service role key (server only), which
-- bypasses RLS. Normal users only get the narrow access granted below.
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Conversations a user "deletes" are hidden, not erased, so the admin can
--    still see them. `deleted_at` is set by the browser (RLS update policy).
-- ---------------------------------------------------------------------

alter table public.assistant_conversations
  add column if not exists deleted_at timestamptz;

create index if not exists assistant_conversations_user_visible_idx
  on public.assistant_conversations (user_id, updated_at desc)
  where deleted_at is null;

-- ---------------------------------------------------------------------
-- 2. Blocked users. A user can read ONLY their own row (the server checks it before
--    every AI request). Only the admin (service role) can change it.
-- ---------------------------------------------------------------------

create table if not exists public.user_flags (
  user_id     uuid primary key references auth.users (id) on delete cascade,
  blocked     boolean not null default false,
  blocked_at  timestamptz
);

revoke all on public.user_flags from anon;
revoke all on public.user_flags from authenticated;
grant select on public.user_flags to authenticated;

alter table public.user_flags enable row level security;

drop policy if exists "Own flags: select" on public.user_flags;
create policy "Own flags: select"
  on public.user_flags for select to authenticated
  using (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 3. Site settings: the banner message and the tool on/off switches.
--    Everyone may read (the banner shows to visitors too). Only the admin writes.
-- ---------------------------------------------------------------------

create table if not exists public.site_settings (
  key         text primary key,
  value       jsonb not null,
  updated_at  timestamptz not null default now()
);

revoke all on public.site_settings from anon;
revoke all on public.site_settings from authenticated;
grant select on public.site_settings to anon, authenticated;

alter table public.site_settings enable row level security;

drop policy if exists "Settings: read" on public.site_settings;
create policy "Settings: read"
  on public.site_settings for select to anon, authenticated
  using (true);

insert into public.site_settings (key, value) values
  ('banner',   '{"enabled": false, "text": ""}'),
  ('features', '{"trip-assistant": true, "trip-planner": true, "events": true}')
on conflict (key) do nothing;

-- ---------------------------------------------------------------------
-- 4. Activity log: what each user asked for (trip-assistant questions, planner and
--    events searches). Users can only ADD their own rows; only the admin reads them.
-- ---------------------------------------------------------------------

create table if not exists public.activity_log (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  kind        text not null check (kind in
                ('assistant', 'planner-suggest', 'planner-plan', 'events')),
  summary     text not null check (char_length(summary) <= 500),
  details     jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_log_user_created_idx
  on public.activity_log (user_id, created_at desc);
create index if not exists activity_log_created_idx
  on public.activity_log (created_at desc);

revoke all on public.activity_log from anon;
revoke all on public.activity_log from authenticated;
grant insert on public.activity_log to authenticated;

alter table public.activity_log enable row level security;

drop policy if exists "Own activity: insert" on public.activity_log;
create policy "Own activity: insert"
  on public.activity_log for insert to authenticated
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 5. Check (run after the script): all four should show rowsecurity = true
-- ---------------------------------------------------------------------
-- select tablename, rowsecurity from pg_tables
--  where schemaname = 'public'
--    and tablename in ('assistant_conversations', 'user_flags', 'site_settings', 'activity_log');
