-- =====================================================================
-- feedback — one 1–5 star rating per user per tool, with Row Level Security
-- Run in: Supabase Dashboard → SQL Editor → New query → paste → Run.
-- Safe to re-run (uses IF NOT EXISTS / DROP ... IF EXISTS).
-- =====================================================================

-- ---------------------------------------------------------------------
-- 1. Table
-- ---------------------------------------------------------------------

-- `page` is the tool that was rated. Rating again replaces the old rating.
create table if not exists public.feedback (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null default auth.uid()
                references auth.users (id) on delete cascade,
  page        text not null check (page in ('trip-assistant', 'trip-planner', 'events')),
  rating      smallint not null check (rating between 1 and 5),
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  unique (user_id, page)
);

-- ---------------------------------------------------------------------
-- 2. Access: only signed-in users, never anonymous visitors.
--    You read all ratings in the Supabase dashboard (Table Editor).
-- ---------------------------------------------------------------------

revoke all on public.feedback from anon;
grant select, insert, update on public.feedback to authenticated;

-- ---------------------------------------------------------------------
-- 3. Row Level Security: each user sees and changes only their own rating.
-- ---------------------------------------------------------------------

alter table public.feedback enable row level security;

drop policy if exists "Own feedback: select" on public.feedback;
create policy "Own feedback: select"
  on public.feedback for select to authenticated
  using (user_id = (select auth.uid()));

drop policy if exists "Own feedback: insert" on public.feedback;
create policy "Own feedback: insert"
  on public.feedback for insert to authenticated
  with check (user_id = (select auth.uid()));

drop policy if exists "Own feedback: update" on public.feedback;
create policy "Own feedback: update"
  on public.feedback for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- ---------------------------------------------------------------------
-- 4. Check (run after the script): rowsecurity should be true
-- ---------------------------------------------------------------------
-- select tablename, rowsecurity from pg_tables
--  where schemaname = 'public' and tablename = 'feedback';
-- Average rating per tool:
-- select page, round(avg(rating), 2) as average, count(*) from public.feedback group by page;
