-- M3allim database setup. Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run again: it only creates what is missing.

-- ---------- Super admins ----------
-- Only these emails can review mentor applications and open their documents.
create table if not exists public.super_admins (
  email text primary key
);
insert into public.super_admins (email) values ('kitmittofam@gmail.com') on conflict do nothing;
alter table public.super_admins enable row level security; -- no policies: not readable from the app

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.super_admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- ---------- Profiles (one per account) ----------
create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text check (role in ('student', 'mentor')),
  university text,
  field text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists avatar_url text; -- for projects created before photos
alter table public.profiles enable row level security;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin());
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- Create the profile when someone signs up (email or Google).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role, university, field, avatar_url)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'role',
    new.raw_user_meta_data ->> 'university',
    new.raw_user_meta_data ->> 'field',
    -- Google sends the account picture; email sign-ups add theirs after verifying
    coalesce(new.raw_user_meta_data ->> 'avatar_url', new.raw_user_meta_data ->> 'picture')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- Mentor applications ----------
create table if not exists public.mentor_applications (
  id bigint generated always as identity primary key,
  user_id uuid not null unique references auth.users on delete cascade,
  full_name text not null,
  email text not null,
  alt_email text,
  phone text not null,
  field text not null,
  headline text not null,
  experience_years int,
  linkedin text,
  cv_path text not null,
  cover_letter_path text not null,
  status text not null default 'Pending' check (status in ('Pending', 'Approved', 'Rejected')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);
alter table public.mentor_applications enable row level security;

drop policy if exists "read own or all as super admin" on public.mentor_applications;
create policy "read own or all as super admin" on public.mentor_applications for select to authenticated
  using (user_id = auth.uid() or public.is_super_admin());
drop policy if exists "submit own application" on public.mentor_applications;
create policy "submit own application" on public.mentor_applications for insert to authenticated
  with check (user_id = auth.uid() and status = 'Pending' and admin_note is null and lower(email) = lower(auth.jwt() ->> 'email'));
drop policy if exists "super admin decides" on public.mentor_applications;
create policy "super admin decides" on public.mentor_applications for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- CV and cover letter files (private bucket) ----------
-- Files are stored as <user id>/<file name>. Max 5 MB, PDF or Word only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mentor-docs', 'mentor-docs', false, 5242880, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
])
on conflict (id) do nothing;

drop policy if exists "mentors upload own docs" on storage.objects;
create policy "mentors upload own docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'mentor-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "read own docs or all as super admin" on storage.objects;
create policy "read own docs or all as super admin" on storage.objects for select to authenticated
  using (bucket_id = 'mentor-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_super_admin()));

-- Lets the super admin's review list show each applicant's profile photo.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'mentor_applications_profile_fkey') then
    alter table public.mentor_applications
      add constraint mentor_applications_profile_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
end $$;

-- ---------- Profile photos (public bucket) ----------
-- Anyone can view photos; each person can only add, replace or delete files in <user id>/.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', true, 2097152, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

drop policy if exists "list own avatars" on storage.objects;
create policy "list own avatars" on storage.objects for select to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "upload own avatar" on storage.objects;
create policy "upload own avatar" on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "delete own avatars" on storage.objects;
create policy "delete own avatars" on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

-- Fill in names and Google pictures for accounts created before this existed.
update public.profiles p
set avatar_url = coalesce(p.avatar_url, u.raw_user_meta_data ->> 'avatar_url', u.raw_user_meta_data ->> 'picture'),
    full_name = coalesce(p.full_name, u.raw_user_meta_data ->> 'full_name', u.raw_user_meta_data ->> 'name')
from auth.users u
where u.id = p.id and (p.avatar_url is null or p.full_name is null);

-- =====================================================================
-- Mentorship: mentor directory, sessions, chat, favorites, reports
-- =====================================================================

alter table public.profiles add column if not exists bio text; -- students: what they want to learn

-- ---------- Mentors (public directory, filled when the super admin approves an application) ----------
create table if not exists public.mentors (
  id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null,
  headline text not null,
  field text not null,
  experience_years int,
  bio text,
  languages text,
  availability text,
  created_at timestamptz not null default now()
);
alter table public.mentors enable row level security;
drop policy if exists "anyone can browse mentors" on public.mentors;
create policy "anyone can browse mentors" on public.mentors for select to anon, authenticated using (true);
drop policy if exists "mentors edit own profile" on public.mentors;
create policy "mentors edit own profile" on public.mentors for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
-- Mentors may only change their public text, not their name or verification details.
revoke update on public.mentors from anon, authenticated;
grant update (headline, bio, languages, availability) on public.mentors to authenticated;

create or replace function public.publish_approved_mentor()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'Approved' and old.status is distinct from 'Approved' then
    insert into public.mentors (id, full_name, headline, field, experience_years)
    values (new.user_id, new.full_name, new.headline, new.field, new.experience_years)
    on conflict (id) do update set full_name = excluded.full_name, headline = excluded.headline, field = excluded.field, experience_years = excluded.experience_years;
    update public.profiles set role = 'mentor' where id = new.user_id;
  elsif old.status = 'Approved' and new.status <> 'Approved' then
    delete from public.mentors where id = new.user_id;
  end if;
  return new;
end;
$$;
drop trigger if exists on_mentor_application_decided on public.mentor_applications;
create trigger on_mentor_application_decided after update of status on public.mentor_applications
  for each row execute function public.publish_approved_mentor();

-- ---------- Sessions (a request becomes a session when the mentor accepts) ----------
create table if not exists public.sessions (
  id bigint generated always as identity primary key,
  student_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  topic text not null,
  message text,
  starts_at timestamptz not null,
  duration_min int not null default 45,
  status text not null default 'Pending' check (status in ('Pending', 'Accepted', 'Declined', 'Cancelled')),
  proposed_starts_at timestamptz, -- a reschedule waiting for the other person
  proposed_by text check (proposed_by in ('student', 'mentor')),
  cancelled_by text check (cancelled_by in ('student', 'mentor')),
  video_room text not null default replace(gen_random_uuid()::text, '-', ''),
  rating int check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  check (student_id <> mentor_id)
);
create index if not exists sessions_student_idx on public.sessions (student_id, starts_at);
create index if not exists sessions_mentor_idx on public.sessions (mentor_id, starts_at);
alter table public.sessions enable row level security;

drop policy if exists "participants read sessions" on public.sessions;
create policy "participants read sessions" on public.sessions for select to authenticated
  using (student_id = auth.uid() or mentor_id = auth.uid() or public.is_super_admin());
drop policy if exists "students request sessions" on public.sessions;
create policy "students request sessions" on public.sessions for insert to authenticated
  with check (student_id = auth.uid() and status = 'Pending' and starts_at > now() and proposed_starts_at is null and rating is null);
drop policy if exists "participants update sessions" on public.sessions;
create policy "participants update sessions" on public.sessions for update to authenticated
  using (student_id = auth.uid() or mentor_id = auth.uid()) with check (student_id = auth.uid() or mentor_id = auth.uid());

-- What each side may change. Runs on every update by a signed-in person.
-- Careful: a comparison with NULL is never true, so nullable columns are wrapped in coalesce / is not distinct from.
create or replace function public.guard_session_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
begin
  if me is null or public.is_super_admin() then return new; end if;
  if new.student_id <> old.student_id or new.mentor_id <> old.mentor_id or new.video_room <> old.video_room
     or new.created_at <> old.created_at or new.duration_min <> old.duration_min then
    raise exception 'This change is not allowed';
  end if;
  if old.status in ('Declined', 'Cancelled') then raise exception 'This session is closed'; end if;

  if me = old.student_id then
    if new.status <> old.status and not (new.status = 'Cancelled' and coalesce(new.cancelled_by, '') = 'student') then
      raise exception 'Students can only cancel a session';
    end if;
    if new.topic <> old.topic or new.message is distinct from old.message then
      if old.status <> 'Pending' then raise exception 'The request can only be edited while it is pending'; end if;
    end if;
    if new.starts_at <> old.starts_at then
      if not (old.status = 'Pending' or (coalesce(old.proposed_by, '') = 'mentor' and new.starts_at is not distinct from old.proposed_starts_at)) then
        raise exception 'Propose a new time instead; your mentor needs to agree';
      end if;
      if new.starts_at <= now() then raise exception 'Pick a time in the future'; end if;
    end if;
    if new.proposed_by is distinct from old.proposed_by and new.proposed_by = 'mentor' then raise exception 'Not allowed'; end if;
    if (new.rating is distinct from old.rating or new.review is distinct from old.review)
       and not (old.status = 'Accepted' and old.starts_at + make_interval(mins => old.duration_min) < now()) then
      raise exception 'You can rate a session after it has taken place';
    end if;
  elsif me = old.mentor_id then
    if new.status <> old.status and not (
         (old.status = 'Pending' and new.status in ('Accepted', 'Declined'))
      or (old.status = 'Accepted' and new.status = 'Cancelled' and coalesce(new.cancelled_by, '') = 'mentor')) then
      raise exception 'That status change is not allowed';
    end if;
    if new.starts_at <> old.starts_at and not (coalesce(old.proposed_by, '') = 'student' and new.starts_at is not distinct from old.proposed_starts_at) then
      raise exception 'Propose a new time instead; the student needs to agree';
    end if;
    if new.proposed_by is distinct from old.proposed_by and new.proposed_by = 'student' then raise exception 'Not allowed'; end if;
    if new.topic <> old.topic or new.message is distinct from old.message
       or new.rating is distinct from old.rating or new.review is distinct from old.review then
      raise exception 'Mentors cannot change the request or its rating';
    end if;
  end if;
  if new.proposed_starts_at is not null and new.proposed_starts_at is distinct from old.proposed_starts_at and new.proposed_starts_at <= now() then
    raise exception 'Pick a time in the future';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_session_update on public.sessions;
create trigger guard_session_update before update on public.sessions
  for each row execute function public.guard_session_update();

-- Public ratings: only totals, never who rated what.
create or replace view public.mentor_stats as
  select mentor_id,
         round(avg(rating)::numeric, 1) as rating,
         count(rating)::int as reviews,
         count(*) filter (where status = 'Accepted' and starts_at < now())::int as sessions
  from public.sessions group by mentor_id;
grant select on public.mentor_stats to anon, authenticated;

-- ---------- Chat ----------
create table if not exists public.messages (
  id bigint generated always as identity primary key,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  recipient_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  read_at timestamptz,
  created_at timestamptz not null default now(),
  check (sender_id <> recipient_id)
);
create index if not exists messages_pair_idx on public.messages (sender_id, recipient_id, created_at);
create index if not exists messages_recipient_idx on public.messages (recipient_id, created_at);
alter table public.messages enable row level security;

-- Anyone signed in can message an approved mentor; anyone can reply to someone who wrote to them;
-- mentors can write to students who sent them a request.
create or replace function public.can_message(recipient uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.mentors where id = recipient)
      or exists (select 1 from public.messages where sender_id = recipient and recipient_id = auth.uid())
      or exists (select 1 from public.sessions where mentor_id = auth.uid() and student_id = recipient);
$$;

drop policy if exists "read own messages" on public.messages;
create policy "read own messages" on public.messages for select to authenticated
  using (sender_id = auth.uid() or recipient_id = auth.uid());
drop policy if exists "send messages" on public.messages;
create policy "send messages" on public.messages for insert to authenticated
  with check (sender_id = auth.uid() and read_at is null and public.can_message(recipient_id));
drop policy if exists "mark messages read" on public.messages;
create policy "mark messages read" on public.messages for update to authenticated
  using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());
revoke update on public.messages from anon, authenticated;
grant update (read_at) on public.messages to authenticated;

-- ---------- Favorites ----------
create table if not exists public.favorites (
  student_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, mentor_id)
);
alter table public.favorites enable row level security;
drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid());

-- ---------- Reports (reviewed by the super admin) ----------
create table if not exists public.reports (
  id bigint generated always as identity primary key,
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  reported_id uuid not null references public.profiles (id) on delete cascade,
  session_id bigint references public.sessions (id) on delete set null,
  reason text not null,
  details text,
  status text not null default 'Open' check (status in ('Open', 'Resolved', 'Dismissed')),
  admin_note text,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  check (reporter_id <> reported_id)
);
alter table public.reports enable row level security;
drop policy if exists "file reports" on public.reports;
create policy "file reports" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'Open' and admin_note is null);
drop policy if exists "read own reports or all as super admin" on public.reports;
create policy "read own reports or all as super admin" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_super_admin());
drop policy if exists "super admin reviews reports" on public.reports;
create policy "super admin reviews reports" on public.reports for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

-- ---------- Who can see whose name and photo ----------
create or replace function public.is_contact(other uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.sessions where (student_id = auth.uid() and mentor_id = other) or (mentor_id = auth.uid() and student_id = other))
      or exists (select 1 from public.messages where (sender_id = auth.uid() and recipient_id = other) or (recipient_id = auth.uid() and sender_id = other));
$$;
drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_super_admin() or public.is_contact(id));
drop policy if exists "anyone sees mentor photos" on public.profiles;
create policy "anyone sees mentor photos" on public.profiles for select to anon, authenticated
  using (exists (select 1 from public.mentors where mentors.id = profiles.id));

-- Live updates for chat and session changes.
do $$ begin
  alter publication supabase_realtime add table public.messages;
exception when duplicate_object then null; end $$;
do $$ begin
  alter publication supabase_realtime add table public.sessions;
exception when duplicate_object then null; end $$;

-- Public reviews on mentor profiles: rating and text only, never who wrote them.
create or replace view public.mentor_reviews as
  select mentor_id, rating, review, starts_at from public.sessions where rating is not null;
grant select on public.mentor_reviews to anon, authenticated;
