-- Profile feature: avatar + country on the leaderboard, and a public Storage
-- bucket to hold uploaded avatars.
--
-- Run once in the Supabase dashboard → SQL Editor for project
-- zwoxbpqttnnolqpjldss (after 2026-06-04_leaderboard_user_id.sql).

-- 1. New leaderboard columns (both nullable — older rows simply have no avatar).
alter table public.leaderboard add column if not exists avatar_url text;
alter table public.leaderboard add column if not exists country text;

-- 2. Public bucket for avatars. Public = the getPublicUrl() links resolve
--    without auth, which is what the app renders on every device.
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

-- 3. The app is anonymous (no login), so let the anon role read / upload /
--    overwrite objects in the avatars bucket only. Avatars are stored at
--    "<user_id>.jpg" and re-uploaded with upsert, hence the UPDATE policy.
drop policy if exists "avatars anon read" on storage.objects;
create policy "avatars anon read" on storage.objects
  for select to anon using (bucket_id = 'avatars');

drop policy if exists "avatars anon insert" on storage.objects;
create policy "avatars anon insert" on storage.objects
  for insert to anon with check (bucket_id = 'avatars');

drop policy if exists "avatars anon update" on storage.objects;
create policy "avatars anon update" on storage.objects
  for update to anon using (bucket_id = 'avatars') with check (bucket_id = 'avatars');
