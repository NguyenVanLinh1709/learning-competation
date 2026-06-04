-- Solo leaderboard: one ranked row per user per game mode.
--
-- Run this once in the Supabase dashboard → SQL Editor for project
-- zwoxbpqttnnolqpjldss. The anon key the app ships with cannot run DDL, so this
-- has to be applied manually (or via the Supabase CLI).
--
-- After this migration, the app upserts each solo run keyed on (user_id, mode)
-- and only overwrites a user's row when the new run beats their stored best.

-- 1. Stable per-device identity generated on the client (profileStore).
alter table public.leaderboard
  add column if not exists user_id text;

-- 2. Backfill existing rows with a distinct id so old scores are NOT merged
--    together (each pre-migration row keeps its own identity).
update public.leaderboard
  set user_id = id::text
  where user_id is null;

-- 3. Require it going forward.
alter table public.leaderboard
  alter column user_id set not null;

-- 4. Enforce one row per user per mode — this is the conflict target the
--    client upsert (onConflict: 'user_id,mode') relies on.
create unique index if not exists leaderboard_user_mode_uniq
  on public.leaderboard (user_id, mode);

-- 5. The "keep best" upsert performs INSERT ... ON CONFLICT DO UPDATE, so the
--    anon role needs UPDATE — not just INSERT — on the row. This leaderboard is
--    fully anonymous (no login), so allow anon to update existing rows. Skip
--    this block if you already have an equivalent UPDATE policy.
drop policy if exists "anon can update leaderboard" on public.leaderboard;
create policy "anon can update leaderboard"
  on public.leaderboard
  for update
  to anon
  using (true)
  with check (true);
