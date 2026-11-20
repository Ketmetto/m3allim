-- =====================================================================================
-- M3allim database (Supabase / PostgreSQL)
--
-- Paste this whole file into Supabase → SQL Editor → Run.
-- Safe to run again, and safe on the existing project: it only adds what is missing and
-- refreshes the functions and access rules.
--
-- The website never decides on its own who may do what. Every rule below is enforced by the
-- database (row level security, triggers and functions), so it holds even if someone calls
-- the API directly.
--
-- Contents
--    1. Roles: super admin, admins and the helper functions every rule uses
--    2. Profiles and bans
--    3. Platform settings (maintenance mode, limits)
--    4. Audit log
--    5. Notifications
--    6. Mentor applications and documents (ID or passport, CV, cover letter)
--    7. Mentors (public directory) and weekly availability
--    8. Sessions (requests, rescheduling, video, ratings)
--    9. Chat
--   10. Favorites
--   11. Reports
--   12. Support tickets (chat with the admin team)
--   13. Announcements
--   14. Admin tools (who am I, user list, bans, statistics, system health)
--   15. Profile photos
--   16. Live updates
--   17. Clean-up of rules from older versions
-- =====================================================================================


-- =====================================================================================
-- 1. Roles
--    guest        not signed in (the anon key)
--    student      profiles.role = 'student'
--    applicant    profiles.role = 'mentor' but not approved yet
--    mentor       has a row in public.mentors (created when an admin approves the application)
--    admin        email listed in public.admins with status 'Active'
--    super admin  email listed in public.super_admins (only editable here, never from the website)
-- =====================================================================================

create table if not exists public.super_admins (
  email text primary key
);
insert into public.super_admins (email) values ('kitmittofam@gmail.com') on conflict do nothing;
alter table public.super_admins enable row level security; -- no policies: not readable from the website

-- Admins are stored by email, so the super admin can add someone before they create their account.
create table if not exists public.admins (
  email text primary key check (email = lower(email)),
  full_name text,
  status text not null default 'Active' check (status in ('Active', 'Suspended')),
  added_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
alter table public.admins enable row level security;

create or replace function public.email_is_staff(e text)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.super_admins where lower(email) = lower(e))
      or exists (select 1 from public.admins where email = lower(e) and status = 'Active');
$$;

create or replace function public.is_super_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.super_admins where lower(email) = lower(auth.jwt() ->> 'email'));
$$;

-- True for admins and for the super admin (the super admin can do everything an admin can).
create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.email_is_staff(auth.jwt() ->> 'email');
$$;

drop policy if exists "admins see the team" on public.admins;
create policy "admins see the team" on public.admins for select to authenticated
  using (public.is_admin());
drop policy if exists "super admin manages admins" on public.admins;
create policy "super admin manages admins" on public.admins for all to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());


-- =====================================================================================
-- 2. Profiles and bans
-- =====================================================================================

create table if not exists public.profiles (
  id uuid primary key references auth.users on delete cascade,
  full_name text,
  role text check (role in ('student', 'mentor')),
  university text,
  field text,
  avatar_url text,
  created_at timestamptz not null default now()
);
alter table public.profiles add column if not exists avatar_url text;
alter table public.profiles add column if not exists bio text;             -- students: what they want to learn
alter table public.profiles add column if not exists banned_at timestamptz;
alter table public.profiles add column if not exists banned_until timestamptz; -- null = permanent
alter table public.profiles add column if not exists ban_reason text;
alter table public.profiles enable row level security;

create or replace function public.is_banned(uid uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select coalesce((select banned_at is not null and (banned_until is null or banned_until > now())
                   from public.profiles where id = uid), false);
$$;

-- People who have a session or a conversation together may see each other's name and photo.
create or replace function public.is_contact(other uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  return exists (select 1 from public.sessions
                 where (student_id = auth.uid() and mentor_id = other) or (mentor_id = auth.uid() and student_id = other))
      or exists (select 1 from public.messages
                 where (sender_id = auth.uid() and recipient_id = other) or (recipient_id = auth.uid() and sender_id = other));
end;
$$;

drop policy if exists "read own profile" on public.profiles;
create policy "read own profile" on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_admin() or public.is_contact(id));
-- ("anyone sees mentor photos" is in section 7, once the mentors table exists.)
drop policy if exists "update own profile" on public.profiles;
create policy "update own profile" on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- People can edit their own details, but never their ban (only admin_set_ban() changes that).
revoke update on public.profiles from anon, authenticated;
grant update (full_name, role, university, field, avatar_url, bio) on public.profiles to authenticated;
-- The ban reason stays private: the person reads it through whoami(), admins through admin_list_users().
-- (When adding a column to profiles, add it here too or the website can't read it.)
revoke select on public.profiles from anon, authenticated;
grant select (id, full_name, role, university, field, avatar_url, bio, created_at, banned_at, banned_until) on public.profiles to anon, authenticated;

-- The account type is picked once (sign-up or first Google sign-in) and can't be switched later.
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  if auth.uid() = old.id and old.role is not null and new.role is distinct from old.role then
    raise exception 'Your account type is already set';
  end if;
  return new;
end;
$$;
drop trigger if exists guard_profile_update on public.profiles;
create trigger guard_profile_update before update on public.profiles
  for each row execute function public.guard_profile_update();

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


-- =====================================================================================
-- 3. Platform settings (one row, changed by the super admin)
-- =====================================================================================

create table if not exists public.platform_settings (
  id int primary key default 1 check (id = 1),
  platform_name text not null default 'M3allim',
  support_email text not null default 'hello@m3allim.com',
  student_signups_open boolean not null default true,
  mentor_applications_open boolean not null default true,
  session_length_min int not null default 45 check (session_length_min in (30, 45, 60, 90)),
  max_pending_requests int not null default 3 check (max_pending_requests between 1 and 20),
  min_notice_hours int not null default 12 check (min_notice_hours between 0 and 168),
  maintenance_mode boolean not null default false,
  maintenance_message text not null default 'We’re making M3allim better and will be back shortly. Thank you for your patience.',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users on delete set null
);
insert into public.platform_settings (id) values (1) on conflict do nothing;
alter table public.platform_settings enable row level security;

drop policy if exists "anyone reads settings" on public.platform_settings;
create policy "anyone reads settings" on public.platform_settings for select to anon, authenticated using (true);
drop policy if exists "super admin changes settings" on public.platform_settings;
create policy "super admin changes settings" on public.platform_settings for update to authenticated
  using (public.is_super_admin()) with check (public.is_super_admin());

create or replace function public.settings()
returns public.platform_settings
language sql stable security definer set search_path = public
as $$
  select * from public.platform_settings where id = 1;
$$;


-- =====================================================================================
-- 4. Audit log: every privileged action, written by the database itself
-- =====================================================================================

create table if not exists public.audit_log (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users on delete set null,
  actor_name text,
  actor_email text,
  action text not null,
  target text,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists audit_log_created_idx on public.audit_log (created_at desc);
alter table public.audit_log enable row level security;
-- Readable by admins; nobody can add, edit or delete entries from the website.
drop policy if exists "admins read the audit log" on public.audit_log;
create policy "admins read the audit log" on public.audit_log for select to authenticated using (public.is_admin());

create or replace function public.log_action(p_action text, p_target text default null, p_details jsonb default null)
returns void
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.audit_log (actor_id, actor_name, actor_email, action, target, details)
  values (auth.uid(), (select full_name from public.profiles where id = auth.uid()), auth.jwt() ->> 'email', p_action, p_target, p_details);
end;
$$;
revoke execute on function public.log_action(text, text, jsonb) from public, anon, authenticated;

-- Settings changes: stamp who changed what, and log it.
create or replace function public.on_settings_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  changes jsonb := '{}';
  k text;
begin
  new.updated_at := now();
  new.updated_by := auth.uid();
  for k in select key from jsonb_each(to_jsonb(new)) where key not in ('updated_at', 'updated_by') loop
    if to_jsonb(new) -> k is distinct from to_jsonb(old) -> k then
      changes := changes || jsonb_build_object(k, to_jsonb(new) -> k);
    end if;
  end loop;
  if changes <> '{}' then
    perform public.log_action(
      case when changes ? 'maintenance_mode' and new.maintenance_mode then 'Turned maintenance mode on'
           when changes ? 'maintenance_mode' then 'Turned maintenance mode off'
           else 'Changed platform settings' end,
      'Platform', changes);
  end if;
  return new;
end;
$$;
drop trigger if exists on_settings_change on public.platform_settings;
create trigger on_settings_change before update on public.platform_settings
  for each row execute function public.on_settings_change();


-- =====================================================================================
-- 5. Notifications (bell icon). Created only by the database triggers below.
-- =====================================================================================

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null, -- request, session, reschedule, review, application, announcement, report, support, account
  title text not null,
  body text,
  link text,          -- page to open in the website, e.g. /student/sessions
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists notifications_user_idx on public.notifications (user_id, created_at desc);
alter table public.notifications enable row level security;

drop policy if exists "read own notifications" on public.notifications;
create policy "read own notifications" on public.notifications for select to authenticated using (user_id = auth.uid());
drop policy if exists "mark own notifications read" on public.notifications;
create policy "mark own notifications read" on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists "clear own notifications" on public.notifications;
create policy "clear own notifications" on public.notifications for delete to authenticated using (user_id = auth.uid());
revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify(p_user uuid, p_kind text, p_title text, p_body text default null, p_link text default null)
returns void
language sql security definer set search_path = public
as $$
  insert into public.notifications (user_id, kind, title, body, link) values (p_user, p_kind, p_title, p_body, p_link);
$$;

-- Sends the same notification to every active admin and the super admin.
create or replace function public.notify_admins(p_kind text, p_title text, p_body text default null, p_link text default null)
returns void
language sql security definer set search_path = public
as $$
  insert into public.notifications (user_id, kind, title, body, link)
  select p.id, p_kind, p_title, p_body, p_link
  from auth.users u join public.profiles p on p.id = u.id
  where public.email_is_staff(u.email) and p.id is distinct from auth.uid();
$$;
revoke execute on function public.notify(uuid, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.notify_admins(text, text, text, text) from public, anon, authenticated;


-- =====================================================================================
-- 6. Mentor applications: identity document, CV, cover letter and details
-- =====================================================================================

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
alter table public.mentor_applications add column if not exists city text;
alter table public.mentor_applications add column if not exists education text;
alter table public.mentor_applications add column if not exists languages text;
alter table public.mentor_applications add column if not exists id_type text check (id_type in ('National ID', 'Passport'));
alter table public.mentor_applications add column if not exists id_document_path text;
alter table public.mentor_applications add column if not exists reviewed_by uuid references auth.users on delete set null;
alter table public.mentor_applications enable row level security;

-- Lets the admin review list show each applicant's profile photo.
do $$ begin
  if not exists (select 1 from pg_constraint where conname = 'mentor_applications_profile_fkey') then
    alter table public.mentor_applications
      add constraint mentor_applications_profile_fkey foreign key (user_id) references public.profiles (id) on delete cascade;
  end if;
end $$;

drop policy if exists "applicants read own, admins read all" on public.mentor_applications;
create policy "applicants read own, admins read all" on public.mentor_applications for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "submit own application" on public.mentor_applications;
create policy "submit own application" on public.mentor_applications for insert to authenticated
  with check (
    user_id = auth.uid() and status = 'Pending' and admin_note is null
    and lower(email) = lower(auth.jwt() ->> 'email')
    and id_type is not null and id_document_path is not null
    -- documents must be in the applicant's own folder
    and split_part(cv_path, '/', 1) = auth.uid()::text
    and split_part(cover_letter_path, '/', 1) = auth.uid()::text
    and split_part(id_document_path, '/', 1) = auth.uid()::text
    and not public.is_banned(auth.uid())
    and (select mentor_applications_open from public.platform_settings where id = 1)
  );
drop policy if exists "applicants resubmit after a decline" on public.mentor_applications;
create policy "applicants resubmit after a decline" on public.mentor_applications for update to authenticated
  using (user_id = auth.uid() and status = 'Rejected')
  with check (user_id = auth.uid() and status = 'Pending' and lower(email) = lower(auth.jwt() ->> 'email')
              and split_part(cv_path, '/', 1) = auth.uid()::text
              and split_part(cover_letter_path, '/', 1) = auth.uid()::text
              and split_part(id_document_path, '/', 1) = auth.uid()::text);
drop policy if exists "admins decide" on public.mentor_applications;
create policy "admins decide" on public.mentor_applications for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

-- Before a change: stamp the reviewer, or reset the review when the applicant sends it again.
create or replace function public.before_application_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if auth.uid() = old.user_id and not public.is_admin() then
    new.admin_note := null;
    new.reviewed_at := null;
    new.reviewed_by := null;
    new.created_at := now();
  elsif new.status is distinct from old.status then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
  end if;
  return new;
end;
$$;
drop trigger if exists before_application_update on public.mentor_applications;
create trigger before_application_update before update on public.mentor_applications
  for each row execute function public.before_application_update();

create or replace function public.on_application_submitted()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_admins('application',
    case when tg_op = 'INSERT' then 'New mentor application' else 'Mentor application sent again' end,
    format('%s · %s', new.full_name, new.headline), '/admin/verification');
  return new;
end;
$$;
drop trigger if exists on_application_submitted on public.mentor_applications;
create trigger on_application_submitted after insert on public.mentor_applications
  for each row execute function public.on_application_submitted();
drop trigger if exists on_application_resubmitted on public.mentor_applications;
create trigger on_application_resubmitted after update of status on public.mentor_applications
  for each row when (old.status = 'Rejected' and new.status = 'Pending')
  execute function public.on_application_submitted();

-- ---------- Documents (private bucket): <user id>/<file>. ID photo, CV and cover letter, 5 MB max ----------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('mentor-docs', 'mentor-docs', false, 5242880, array[
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp'
])
on conflict (id) do update set allowed_mime_types = excluded.allowed_mime_types, file_size_limit = excluded.file_size_limit;

drop policy if exists "mentors upload own docs" on storage.objects;
create policy "mentors upload own docs" on storage.objects for insert to authenticated
  with check (bucket_id = 'mentor-docs' and (storage.foldername(name))[1] = auth.uid()::text);
drop policy if exists "applicants read own docs, admins read all" on storage.objects;
create policy "applicants read own docs, admins read all" on storage.objects for select to authenticated
  using (bucket_id = 'mentor-docs' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));


-- =====================================================================================
-- 7. Mentors (public directory) and weekly availability
-- =====================================================================================

create table if not exists public.mentors (
  id uuid primary key references public.profiles (id) on delete cascade,
  full_name text not null,
  headline text not null,
  field text not null,
  experience_years int,
  bio text,
  languages text,
  availability text, -- optional note shown under the weekly hours, e.g. "Flexible on weekends"
  created_at timestamptz not null default now()
);
alter table public.mentors add column if not exists topics text;   -- comma separated, e.g. "Portfolio review, Interview prep"
alter table public.mentors add column if not exists linkedin text;
alter table public.mentors enable row level security;

-- Banned mentors disappear from the directory (people who already had sessions with them still see the name).
drop policy if exists "anyone can browse mentors" on public.mentors;
create policy "anyone can browse mentors" on public.mentors for select to anon, authenticated
  using (not public.is_banned(id) or id = auth.uid() or public.is_admin() or public.is_contact(id));
drop policy if exists "mentors edit own profile" on public.mentors;
create policy "mentors edit own profile" on public.mentors for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());
-- Mentors may only change their public text, not their name, field or verified experience.
revoke update on public.mentors from anon, authenticated;
grant update (headline, bio, languages, availability, topics, linkedin) on public.mentors to authenticated;

-- Guests can see mentors' names and photos on the directory.
drop policy if exists "anyone sees mentor photos" on public.profiles;
create policy "anyone sees mentor photos" on public.profiles for select to anon, authenticated
  using (exists (select 1 from public.mentors where mentors.id = profiles.id));

-- When an admin approves an application the mentor is published; if the approval is withdrawn, removed.
create or replace function public.publish_approved_mentor()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if new.status = 'Approved' and old.status is distinct from 'Approved' then
    insert into public.mentors (id, full_name, headline, field, experience_years, languages, linkedin)
    values (new.user_id, new.full_name, new.headline, new.field, new.experience_years, new.languages, new.linkedin)
    on conflict (id) do update set full_name = excluded.full_name, headline = excluded.headline, field = excluded.field,
                                   experience_years = excluded.experience_years;
    update public.profiles set role = 'mentor' where id = new.user_id;
    perform public.notify(new.user_id, 'application', 'You’re an approved mentor',
      'Welcome to M3allim. Build your profile and set your availability so students can book you.', '/mentor/profile');
    perform public.log_action('Approved mentor application', new.full_name, jsonb_build_object('application_id', new.id, 'note', new.admin_note));
  elsif new.status = 'Rejected' and old.status is distinct from 'Rejected' then
    if old.status = 'Approved' then delete from public.mentors where id = new.user_id; end if;
    perform public.notify(new.user_id, 'application', 'Your mentor application wasn’t approved',
      coalesce(new.admin_note, 'Check your email for details from the M3allim team.'), '/mentor/status');
    perform public.log_action('Declined mentor application', new.full_name, jsonb_build_object('application_id', new.id, 'note', new.admin_note));
  elsif old.status = 'Approved' and new.status <> 'Approved' then
    delete from public.mentors where id = new.user_id;
  end if;
  return new;
end;
$$;
drop trigger if exists on_mentor_application_decided on public.mentor_applications;
create trigger on_mentor_application_decided after update of status on public.mentor_applications
  for each row execute function public.publish_approved_mentor();

-- ---------- Weekly availability (Beirut time). Students can only request times inside these hours. ----------
create table if not exists public.mentor_availability (
  id bigint generated always as identity primary key,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  weekday int not null check (weekday between 0 and 6), -- 0 = Sunday … 6 = Saturday
  start_time time not null,
  end_time time not null,
  check (end_time > start_time)
);
create index if not exists mentor_availability_idx on public.mentor_availability (mentor_id, weekday);
alter table public.mentor_availability enable row level security;

drop policy if exists "anyone sees availability" on public.mentor_availability;
create policy "anyone sees availability" on public.mentor_availability for select to anon, authenticated using (true);
drop policy if exists "mentors manage own availability" on public.mentor_availability;
create policy "mentors manage own availability" on public.mentor_availability for all to authenticated
  using (mentor_id = auth.uid()) with check (mentor_id = auth.uid());


-- =====================================================================================
-- 8. Sessions: a request becomes a session when the mentor accepts it
-- =====================================================================================

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
  cancelled_by text,
  video_room text not null default replace(gen_random_uuid()::text, '-', ''),
  rating int check (rating between 1 and 5),
  review text,
  created_at timestamptz not null default now(),
  check (student_id <> mentor_id)
);
-- 'admin' = cancelled by the M3allim team (for example when an account is banned).
alter table public.sessions drop constraint if exists sessions_cancelled_by_check;
alter table public.sessions add constraint sessions_cancelled_by_check check (cancelled_by in ('student', 'mentor', 'admin'));
create index if not exists sessions_student_idx on public.sessions (student_id, starts_at);
create index if not exists sessions_mentor_idx on public.sessions (mentor_id, starts_at);
alter table public.sessions enable row level security;

drop policy if exists "participants read sessions" on public.sessions;
create policy "participants read sessions" on public.sessions for select to authenticated
  using (student_id = auth.uid() or mentor_id = auth.uid() or public.is_admin());
drop policy if exists "students request sessions" on public.sessions;
create policy "students request sessions" on public.sessions for insert to authenticated
  with check (
    student_id = auth.uid() and status = 'Pending' and starts_at > now()
    and proposed_starts_at is null and rating is null and cancelled_by is null
    and exists (select 1 from public.profiles where id = auth.uid() and role = 'student')
    and not public.is_banned(auth.uid()) and not public.is_banned(mentor_id)
  );
drop policy if exists "participants update sessions" on public.sessions;
create policy "participants update sessions" on public.sessions for update to authenticated
  using (student_id = auth.uid() or mentor_id = auth.uid()) with check (student_id = auth.uid() or mentor_id = auth.uid());

-- Does this time clash with one of the mentor's confirmed sessions?
create or replace function public.session_clashes(p_mentor uuid, p_start timestamptz, p_minutes int, p_ignore bigint default null)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.sessions s
    where s.mentor_id = p_mentor and s.status = 'Accepted' and s.id is distinct from p_ignore
      and tstzrange(s.starts_at, s.starts_at + make_interval(mins => s.duration_min))
       && tstzrange(p_start, p_start + make_interval(mins => p_minutes)));
$$;

-- Why a student can't book this time, or null when it is fine.
create or replace function public.slot_problem(p_mentor uuid, p_start timestamptz, p_minutes int, p_ignore bigint default null)
returns text
language plpgsql stable security definer set search_path = public
as $$
declare
  cfg public.platform_settings := public.settings();
  local_time timestamp := p_start at time zone 'Asia/Beirut';
  start_min int := extract(hour from local_time) * 60 + extract(minute from local_time);
begin
  if p_start < now() + make_interval(hours => cfg.min_notice_hours) then
    return format('Pick a time at least %s hours from now', cfg.min_notice_hours);
  end if;
  if exists (select 1 from public.mentor_availability where mentor_id = p_mentor)
     and not exists (
       select 1 from public.mentor_availability a
       where a.mentor_id = p_mentor and a.weekday = extract(dow from local_time)::int
         and extract(epoch from a.start_time) / 60 <= start_min
         and start_min + p_minutes <= extract(epoch from a.end_time) / 60) then
    return 'That time is outside this mentor’s availability';
  end if;
  if public.session_clashes(p_mentor, p_start, p_minutes, p_ignore) then
    return 'This mentor already has a session at that time';
  end if;
  return null;
end;
$$;

-- New requests: session length comes from the platform settings, then the time and the open-request limit are checked.
create or replace function public.before_session_request()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  cfg public.platform_settings := public.settings();
  open_requests int;
  problem text;
begin
  if auth.uid() is null then return new; end if; -- SQL editor / seed data
  new.duration_min := cfg.session_length_min;
  select count(*) into open_requests from public.sessions
    where student_id = new.student_id and status = 'Pending' and starts_at > now();
  if open_requests >= cfg.max_pending_requests then
    raise exception 'You already have % open requests. Wait for a reply or cancel one first.', open_requests;
  end if;
  problem := public.slot_problem(new.mentor_id, new.starts_at, new.duration_min);
  if problem is not null then raise exception '%', problem; end if;
  return new;
end;
$$;
drop trigger if exists before_session_request on public.sessions;
create trigger before_session_request before insert on public.sessions
  for each row execute function public.before_session_request();

-- What each side may change. Runs on every update by a signed-in person.
-- Careful: a comparison with NULL is never true, so nullable columns use coalesce / is distinct from.
create or replace function public.guard_session_update()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  me uuid := auth.uid();
  problem text;
begin
  if me is null or public.is_admin() then return new; end if;
  if public.is_banned(me) then raise exception 'Your account is suspended'; end if;
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
      if old.status = 'Pending' then
        problem := public.slot_problem(old.mentor_id, new.starts_at, old.duration_min, old.id);
        if problem is not null then raise exception '%', problem; end if;
      elsif not (coalesce(old.proposed_by, '') = 'mentor' and new.starts_at is not distinct from old.proposed_starts_at) then
        raise exception 'Propose a new time instead; your mentor needs to agree';
      end if;
      if new.starts_at <= now() then raise exception 'Pick a time in the future'; end if;
    end if;
    if new.proposed_by is distinct from old.proposed_by and new.proposed_by = 'mentor' then raise exception 'Not allowed'; end if;
    if new.proposed_starts_at is not null and new.proposed_starts_at is distinct from old.proposed_starts_at then
      problem := public.slot_problem(old.mentor_id, new.proposed_starts_at, old.duration_min, old.id);
      if problem is not null then raise exception '%', problem; end if;
    end if;
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
    if new.proposed_starts_at is not null and new.proposed_starts_at is distinct from old.proposed_starts_at
       and public.session_clashes(old.mentor_id, new.proposed_starts_at, old.duration_min, old.id) then
      raise exception 'You already have a session at that time';
    end if;
    if new.topic <> old.topic or new.message is distinct from old.message
       or new.rating is distinct from old.rating or new.review is distinct from old.review then
      raise exception 'Mentors cannot change the request or its rating';
    end if;
  end if;
  -- A confirmed session may never overlap another confirmed session of the same mentor.
  if new.status = 'Accepted' and (old.status <> 'Accepted' or new.starts_at <> old.starts_at)
     and public.session_clashes(old.mentor_id, new.starts_at, old.duration_min, old.id) then
    raise exception 'That time clashes with another confirmed session. Propose another time instead.';
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

-- Tells the other person what happened (bell icon).
create or replace function public.notify_session_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  student_name text := coalesce((select full_name from public.profiles where id = new.student_id), 'A student');
  mentor_name text := coalesce((select full_name from public.mentors where id = new.mentor_id), 'Your mentor');
  starts text := to_char(new.starts_at at time zone 'Asia/Beirut', 'Dy DD Mon, HH24:MI');
  proposer uuid;
begin
  if tg_op = 'INSERT' then
    perform public.notify(new.mentor_id, 'request', 'New session request',
      format('%s asked for a session on %s: “%s”', student_name, starts, new.topic), '/mentor');
    return new;
  end if;

  if new.status <> old.status then
    if new.status = 'Accepted' then
      perform public.notify(new.student_id, 'session', 'Session confirmed', format('%s accepted your request for %s.', mentor_name, starts), '/student/sessions');
    elsif new.status = 'Declined' then
      perform public.notify(new.student_id, 'session', 'Request declined', format('%s can’t take your request for %s. Try another time or another mentor.', mentor_name, starts), '/student/sessions');
    elsif new.status = 'Cancelled' and new.cancelled_by = 'student' then
      perform public.notify(new.mentor_id, 'session', 'Session cancelled', format('%s cancelled the session on %s.', student_name, starts), '/mentor');
    elsif new.status = 'Cancelled' and new.cancelled_by = 'mentor' then
      perform public.notify(new.student_id, 'session', 'Session cancelled', format('%s cancelled the session on %s.', mentor_name, starts), '/student/sessions');
    elsif new.status = 'Cancelled' then
      perform public.notify(new.student_id, 'session', 'Session cancelled', format('The M3allim team cancelled your session with %s on %s.', mentor_name, starts), '/student/sessions');
      perform public.notify(new.mentor_id, 'session', 'Session cancelled', format('The M3allim team cancelled your session with %s on %s.', student_name, starts), '/mentor');
    end if;
    return new;
  end if;

  if new.proposed_starts_at is not null and new.proposed_starts_at is distinct from old.proposed_starts_at then
    if new.proposed_by = 'student' then
      perform public.notify(new.mentor_id, 'reschedule', 'New time proposed',
        format('%s asked to move your session to %s.', student_name, to_char(new.proposed_starts_at at time zone 'Asia/Beirut', 'Dy DD Mon, HH24:MI')), '/mentor');
    else
      perform public.notify(new.student_id, 'reschedule', 'New time proposed',
        format('%s asked to move your session to %s.', mentor_name, to_char(new.proposed_starts_at at time zone 'Asia/Beirut', 'Dy DD Mon, HH24:MI')), '/student/sessions');
    end if;
  elsif old.proposed_starts_at is not null and new.proposed_starts_at is null then
    proposer := case old.proposed_by when 'student' then new.student_id else new.mentor_id end;
    if new.starts_at <> old.starts_at then
      perform public.notify(proposer, 'reschedule', 'New time accepted',
        format('%s agreed. Your session is now on %s.', case when proposer = new.student_id then mentor_name else student_name end, starts),
        case when proposer = new.student_id then '/student/sessions' else '/mentor' end);
    elsif auth.uid() is distinct from proposer then
      perform public.notify(proposer, 'reschedule', 'Original time kept',
        format('%s kept the original time (%s).', case when proposer = new.student_id then mentor_name else student_name end, starts),
        case when proposer = new.student_id then '/student/sessions' else '/mentor' end);
    end if;
  elsif new.starts_at <> old.starts_at and new.status = 'Pending' then
    perform public.notify(new.mentor_id, 'request', 'Request updated', format('%s changed the requested time to %s.', student_name, starts), '/mentor');
  end if;

  if new.rating is not null and old.rating is null then
    perform public.notify(new.mentor_id, 'review', 'New review', format('%s rated your session %s out of 5.', student_name, new.rating), '/mentor/reviews');
  end if;
  return new;
end;
$$;
drop trigger if exists notify_session_change on public.sessions;
create trigger notify_session_change after insert or update on public.sessions
  for each row execute function public.notify_session_change();

-- Public ratings: only totals, never who rated what.
create or replace view public.mentor_stats as
  select mentor_id,
         round(avg(rating)::numeric, 1) as rating,
         count(rating)::int as reviews,
         count(*) filter (where status = 'Accepted' and starts_at < now())::int as sessions
  from public.sessions group by mentor_id;
grant select on public.mentor_stats to anon, authenticated;

-- Public reviews on mentor profiles: rating and text only, never who wrote them.
create or replace view public.mentor_reviews as
  select mentor_id, rating, review, starts_at from public.sessions where rating is not null;
grant select on public.mentor_reviews to anon, authenticated;

-- Busy times for the booking calendar: when, never with whom.
create or replace view public.mentor_busy as
  select mentor_id, starts_at, duration_min from public.sessions
  where status = 'Accepted' and starts_at > now() - interval '1 day';
revoke all on public.mentor_busy from anon;
grant select on public.mentor_busy to authenticated;


-- =====================================================================================
-- 9. Chat
-- =====================================================================================

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

-- Who may start or continue a conversation:
--   admins can message anyone; anyone signed in can message a mentor; anyone can reply to someone
--   who wrote to them; mentors can write to students who sent them a request. Banned accounts can't.
create or replace function public.can_message(recipient uuid)
returns boolean
language plpgsql stable security definer set search_path = public
as $$
begin
  if public.is_banned(auth.uid()) then return false; end if;
  return public.is_admin()
      or exists (select 1 from public.mentors where id = recipient and not public.is_banned(recipient))
      or exists (select 1 from public.messages where sender_id = recipient and recipient_id = auth.uid())
      or exists (select 1 from public.sessions where mentor_id = auth.uid() and student_id = recipient);
end;
$$;

-- Admins only see their own conversations, never other people's chats.
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

-- Which of these people are admins (so the chat can label them "M3allim team").
create or replace function public.staff_among(ids uuid[])
returns setof uuid
language sql stable security definer set search_path = public
as $$
  select u.id from auth.users u where u.id = any (ids) and public.email_is_staff(u.email);
$$;


-- =====================================================================================
-- 10. Favorites (saved mentors)
-- =====================================================================================

create table if not exists public.favorites (
  student_id uuid not null references public.profiles (id) on delete cascade,
  mentor_id uuid not null references public.mentors (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (student_id, mentor_id)
);
alter table public.favorites enable row level security;
drop policy if exists "own favorites" on public.favorites;
create policy "own favorites" on public.favorites for all to authenticated
  using (student_id = auth.uid()) with check (student_id = auth.uid() and not public.is_banned(auth.uid()));


-- =====================================================================================
-- 11. Reports (handled by admins)
-- =====================================================================================

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
alter table public.reports add column if not exists reviewed_by uuid references auth.users on delete set null;
alter table public.reports enable row level security;

drop policy if exists "file reports" on public.reports;
create policy "file reports" on public.reports for insert to authenticated
  with check (reporter_id = auth.uid() and status = 'Open' and admin_note is null and not public.is_banned(auth.uid()));
drop policy if exists "reporters read own, admins read all" on public.reports;
create policy "reporters read own, admins read all" on public.reports for select to authenticated
  using (reporter_id = auth.uid() or public.is_admin());
drop policy if exists "admins review reports" on public.reports;
create policy "admins review reports" on public.reports for update to authenticated
  using (public.is_admin()) with check (public.is_admin());

create or replace function public.on_report_filed()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_admins('report', 'New report',
    format('%s reported %s: %s', coalesce((select full_name from public.profiles where id = new.reporter_id), 'Someone'),
           coalesce((select full_name from public.profiles where id = new.reported_id), 'a user'), new.reason), '/admin/reports');
  return new;
end;
$$;
drop trigger if exists on_report_filed on public.reports;
create trigger on_report_filed after insert on public.reports
  for each row execute function public.on_report_filed();

create or replace function public.on_report_review()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  who text := coalesce((select full_name from public.profiles where id = new.reported_id), 'this user');
begin
  if new.status <> old.status and new.status in ('Resolved', 'Dismissed') then
    new.reviewed_at := now();
    new.reviewed_by := auth.uid();
    perform public.notify(new.reporter_id, 'report', 'Your report was reviewed',
      case when new.status = 'Resolved' then format('Thank you. The M3allim team took action on your report about %s.', who)
           else format('Thank you. The M3allim team reviewed your report about %s and closed it.', who) end, null);
    perform public.log_action(format('%s report #%s', new.status, new.id), who, jsonb_build_object('reason', new.reason, 'note', new.admin_note));
  end if;
  return new;
end;
$$;
drop trigger if exists on_report_review on public.reports;
create trigger on_report_review before update on public.reports
  for each row execute function public.on_report_review();


-- =====================================================================================
-- 12. Support tickets: students and mentors chat with the admin team
-- =====================================================================================

create table if not exists public.support_tickets (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles (id) on delete cascade,
  subject text not null check (length(trim(subject)) between 3 and 120),
  category text not null check (category in ('Account', 'Sessions', 'Mentor application', 'Technical problem', 'Report follow-up', 'Ban appeal', 'Other')),
  status text not null default 'Open' check (status in ('Open', 'Answered', 'Closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists support_tickets_user_idx on public.support_tickets (user_id, updated_at desc);

create table if not exists public.support_messages (
  id bigint generated always as identity primary key,
  ticket_id bigint not null references public.support_tickets (id) on delete cascade,
  sender_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (length(trim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);
create index if not exists support_messages_ticket_idx on public.support_messages (ticket_id, created_at);
alter table public.support_tickets enable row level security;
alter table public.support_messages enable row level security;

-- Banned people can still open a ticket, so they can appeal.
drop policy if exists "own tickets, admins see all" on public.support_tickets;
create policy "own tickets, admins see all" on public.support_tickets for select to authenticated
  using (user_id = auth.uid() or public.is_admin());
drop policy if exists "open own tickets" on public.support_tickets;
create policy "open own tickets" on public.support_tickets for insert to authenticated
  with check (user_id = auth.uid() and status = 'Open');
drop policy if exists "close own tickets, admins update" on public.support_tickets;
create policy "close own tickets, admins update" on public.support_tickets for update to authenticated
  using (user_id = auth.uid() or public.is_admin())
  with check (public.is_admin() or (user_id = auth.uid() and status = 'Closed'));
revoke update on public.support_tickets from anon, authenticated;
grant update (status) on public.support_tickets to authenticated;

drop policy if exists "read ticket messages" on public.support_messages;
create policy "read ticket messages" on public.support_messages for select to authenticated
  using (exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin())));
drop policy if exists "write ticket messages" on public.support_messages;
create policy "write ticket messages" on public.support_messages for insert to authenticated
  with check (sender_id = auth.uid()
              and exists (select 1 from public.support_tickets t where t.id = ticket_id and (t.user_id = auth.uid() or public.is_admin())));

-- Opens a ticket with its first message in one step.
create or replace function public.open_support_ticket(p_subject text, p_category text, p_body text)
returns bigint
language plpgsql security invoker set search_path = public
as $$
declare
  ticket bigint;
begin
  insert into public.support_tickets (user_id, subject, category) values (auth.uid(), trim(p_subject), p_category) returning id into ticket;
  insert into public.support_messages (ticket_id, sender_id, body) values (ticket, auth.uid(), trim(p_body));
  return ticket;
end;
$$;

create or replace function public.on_ticket_opened()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  perform public.notify_admins('support', 'New support request',
    format('%s · %s', coalesce((select full_name from public.profiles where id = new.user_id), 'A user'), new.subject), '/admin/support');
  return new;
end;
$$;
drop trigger if exists on_ticket_opened on public.support_tickets;
create trigger on_ticket_opened after insert on public.support_tickets
  for each row execute function public.on_ticket_opened();

-- A reply from the team marks the ticket Answered and tells the person; a reply from the person reopens it.
create or replace function public.on_support_message()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  t public.support_tickets;
begin
  select * into t from public.support_tickets where id = new.ticket_id;
  if new.sender_id = t.user_id then
    if t.status <> 'Open' then
      update public.support_tickets set status = 'Open', updated_at = now() where id = t.id;
      perform public.notify_admins('support', 'New reply on a support request', t.subject, '/admin/support');
    else
      update public.support_tickets set updated_at = now() where id = t.id;
    end if;
  else
    update public.support_tickets set status = 'Answered', updated_at = now() where id = t.id;
    perform public.notify(t.user_id, 'support', 'The M3allim team replied', t.subject, '/support?ticket=' || t.id);
  end if;
  return new;
end;
$$;
drop trigger if exists on_support_message on public.support_messages;
create trigger on_support_message after insert on public.support_messages
  for each row execute function public.on_support_message();


-- =====================================================================================
-- 13. Announcements: delivered to everyone in the audience as a notification
-- =====================================================================================

create table if not exists public.announcements (
  id bigint generated always as identity primary key,
  title text not null check (length(trim(title)) between 3 and 120),
  body text not null check (length(trim(body)) between 1 and 2000),
  audience text not null check (audience in ('Everyone', 'Students', 'Mentors')),
  sent_by uuid references public.profiles (id) on delete set null,
  recipients int not null default 0,
  created_at timestamptz not null default now()
);
alter table public.announcements enable row level security;
drop policy if exists "admins read announcements" on public.announcements;
create policy "admins read announcements" on public.announcements for select to authenticated using (public.is_admin());
drop policy if exists "admins send announcements" on public.announcements;
create policy "admins send announcements" on public.announcements for insert to authenticated
  with check (public.is_admin() and sent_by = auth.uid() and recipients = 0);

create or replace function public.deliver_announcement()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  delivered int;
begin
  insert into public.notifications (user_id, kind, title, body, link)
  select p.id, 'announcement', new.title, new.body, '/notifications'
  from public.profiles p
  where p.id <> coalesce(new.sent_by, '00000000-0000-0000-0000-000000000000'::uuid)
    and case new.audience
          when 'Students' then p.role = 'student'
          when 'Mentors' then exists (select 1 from public.mentors m where m.id = p.id)
          else p.role is not null
        end;
  get diagnostics delivered = row_count;
  update public.announcements set recipients = delivered where id = new.id;
  perform public.log_action('Sent announcement', new.audience, jsonb_build_object('title', new.title, 'recipients', delivered));
  return new;
end;
$$;
drop trigger if exists deliver_announcement on public.announcements;
create trigger deliver_announcement after insert on public.announcements
  for each row execute function public.deliver_announcement();


-- =====================================================================================
-- 14. Admin tools
-- =====================================================================================

-- Everything the website needs to know about the signed-in person, in one call.
create or replace function public.whoami()
returns json
language sql stable security definer set search_path = public
as $$
  select json_build_object(
    'id', auth.uid(),
    'email', auth.jwt() ->> 'email',
    'full_name', p.full_name,
    'avatar_url', p.avatar_url,
    'role', p.role,
    'university', p.university,
    'field', p.field,
    'bio', p.bio,
    'is_super_admin', public.is_super_admin(),
    'is_admin', public.is_admin(),
    'is_mentor', exists (select 1 from public.mentors m where m.id = auth.uid()),
    'application_status', (select a.status from public.mentor_applications a where a.user_id = auth.uid()),
    'banned', public.is_banned(auth.uid()),
    'ban_reason', p.ban_reason,
    'banned_until', p.banned_until
  )
  from (select 1) as one left join public.profiles p on p.id = auth.uid();
$$;

-- All accounts with their email and activity (admins only).
create or replace function public.admin_list_users()
returns table (
  id uuid, full_name text, email text, avatar_url text, account text, created_at timestamptz, last_sign_in_at timestamptz,
  banned boolean, banned_until timestamptz, ban_reason text, sessions int, reports int
)
language sql stable security definer set search_path = public
as $$
  select p.id, p.full_name, u.email::text, p.avatar_url,
         case when public.email_is_staff(u.email) then 'admin'
              when exists (select 1 from public.mentors m where m.id = p.id) then 'mentor'
              when p.role = 'mentor' then 'applicant'
              else coalesce(p.role, 'new') end,
         u.created_at, u.last_sign_in_at,
         public.is_banned(p.id), p.banned_until, p.ban_reason,
         (select count(*)::int from public.sessions s where (s.student_id = p.id or s.mentor_id = p.id) and s.status = 'Accepted'),
         (select count(*)::int from public.reports r where r.reported_id = p.id)
  from public.profiles p join auth.users u on u.id = p.id
  where public.is_admin()
  order by u.created_at desc;
$$;

-- Ban (for p_days days, or permanently when null) or unban an account. Admins can't be banned here.
create or replace function public.admin_set_ban(p_user uuid, p_ban boolean, p_reason text default null, p_days int default null)
returns void
language plpgsql security definer set search_path = public
as $$
declare
  target_email text;
  target_name text;
begin
  if not public.is_admin() then raise exception 'Only admins can ban or unban accounts'; end if;
  if p_user = auth.uid() then raise exception 'You can’t ban your own account'; end if;
  select u.email, coalesce(p.full_name, u.email) into target_email, target_name
    from auth.users u join public.profiles p on p.id = u.id where u.id = p_user;
  if target_email is null then raise exception 'Account not found'; end if;
  if public.email_is_staff(target_email) then raise exception 'Admins can’t be banned. Suspend them in Manage admins instead.'; end if;

  if p_ban then
    if coalesce(trim(p_reason), '') = '' then raise exception 'Give a reason for the ban'; end if;
    update public.profiles
      set banned_at = now(), ban_reason = trim(p_reason),
          banned_until = case when p_days is null then null else now() + make_interval(days => p_days) end
      where id = p_user;
    -- Their open requests and upcoming sessions are cancelled so nobody waits for them.
    update public.sessions set status = 'Cancelled', cancelled_by = 'admin'
      where (student_id = p_user or mentor_id = p_user) and status in ('Pending', 'Accepted') and starts_at > now();
    -- Tells an open browser to reload the account, so the suspension notice shows straight away.
    perform public.notify(p_user, 'account', 'Your account was suspended', trim(p_reason), '/support');
    perform public.log_action('Banned user', target_name,
      jsonb_build_object('user_id', p_user, 'reason', trim(p_reason), 'days', coalesce(p_days::text, 'permanent')));
  else
    update public.profiles set banned_at = null, banned_until = null, ban_reason = null where id = p_user;
    perform public.notify(p_user, 'account', 'Your account is active again', 'You can use M3allim as usual. Welcome back.', null);
    perform public.log_action('Unbanned user', target_name, jsonb_build_object('user_id', p_user));
  end if;
end;
$$;

-- Numbers for the admin overview.
create or replace function public.admin_stats()
returns json
language sql stable security definer set search_path = public
as $$
  select case when not public.is_admin() then null else json_build_object(
    'students', (select count(*) from public.profiles where role = 'student'),
    'mentors', (select count(*) from public.mentors),
    'pending_applications', (select count(*) from public.mentor_applications where status = 'Pending'),
    'open_reports', (select count(*) from public.reports where status = 'Open'),
    'open_tickets', (select count(*) from public.support_tickets where status = 'Open'),
    'banned', (select count(*) from public.profiles where public.is_banned(id)),
    'new_users_7d', (select count(*) from public.profiles where created_at > now() - interval '7 days'),
    'pending_requests', (select count(*) from public.sessions where status = 'Pending' and starts_at > now()),
    'upcoming_sessions', (select count(*) from public.sessions where status = 'Accepted' and starts_at > now()),
    'completed_sessions', (select count(*) from public.sessions where status = 'Accepted' and starts_at + make_interval(mins => duration_min) < now()),
    'weekly', (
      select json_agg(json_build_object(
        'week', to_char(w, 'Mon DD'),
        'sessions', (select count(*) from public.sessions s where s.status = 'Accepted' and s.starts_at >= w and s.starts_at < w + interval '7 days'))
        order by w)
      from generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') as w)
  ) end;
$$;

-- The admin team, for the super admin's Manage admins page.
create or replace function public.list_admins()
returns table (email text, full_name text, avatar_url text, role text, status text, has_account boolean, last_sign_in_at timestamptz, added_at timestamptz)
language sql stable security definer set search_path = public
as $$
  select * from (
    select s.email, p.full_name, p.avatar_url, 'Super admin'::text as role, 'Active'::text as status,
           u.id is not null as has_account, u.last_sign_in_at, null::timestamptz as added_at
    from public.super_admins s
    left join auth.users u on lower(u.email) = lower(s.email)
    left join public.profiles p on p.id = u.id
    union all
    select a.email, coalesce(p.full_name, a.full_name), p.avatar_url, 'Admin', a.status,
           u.id is not null, u.last_sign_in_at, a.created_at
    from public.admins a
    left join auth.users u on lower(u.email) = a.email
    left join public.profiles p on p.id = u.id
  ) team
  where public.is_super_admin()
  order by role desc, added_at;
$$;

create or replace function public.on_admin_change()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  if tg_op = 'INSERT' then
    if exists (select 1 from public.super_admins where lower(email) = new.email) then
      raise exception 'That person is already the super admin';
    end if;
    perform public.log_action('Added admin', new.email);
    perform public.notify(u.id, 'account', 'You’re now an M3allim admin', 'Open the admin dashboard to start moderating.', '/admin')
      from auth.users u where lower(u.email) = new.email;
  elsif tg_op = 'UPDATE' and new.status <> old.status then
    perform public.log_action(case when new.status = 'Suspended' then 'Suspended admin' else 'Restored admin' end, new.email);
  elsif tg_op = 'DELETE' then
    perform public.log_action('Removed admin', old.email);
  end if;
  return coalesce(new, old);
end;
$$;
drop trigger if exists on_admin_change on public.admins;
create trigger on_admin_change after insert or update or delete on public.admins
  for each row execute function public.on_admin_change();

-- System health for the super admin: database size, rows per table, file storage and accounts.
create or replace function public.system_health()
returns json
language sql stable security definer set search_path = public
as $$
  select case when not public.is_super_admin() then null else json_build_object(
    'checked_at', now(),
    'postgres_version', current_setting('server_version'),
    'database_bytes', pg_database_size(current_database()),
    'connections', (select count(*) from pg_stat_activity where datname = current_database()),
    'tables', json_build_array(
      json_build_object('name', 'Profiles', 'rows', (select count(*) from public.profiles)),
      json_build_object('name', 'Mentors', 'rows', (select count(*) from public.mentors)),
      json_build_object('name', 'Mentor applications', 'rows', (select count(*) from public.mentor_applications)),
      json_build_object('name', 'Sessions', 'rows', (select count(*) from public.sessions)),
      json_build_object('name', 'Messages', 'rows', (select count(*) from public.messages)),
      json_build_object('name', 'Notifications', 'rows', (select count(*) from public.notifications)),
      json_build_object('name', 'Reports', 'rows', (select count(*) from public.reports)),
      json_build_object('name', 'Support tickets', 'rows', (select count(*) from public.support_tickets)),
      json_build_object('name', 'Announcements', 'rows', (select count(*) from public.announcements)),
      json_build_object('name', 'Audit log', 'rows', (select count(*) from public.audit_log))),
    'storage', (
      select coalesce(json_agg(json_build_object('bucket', b.id, 'public', b.public, 'files', coalesce(o.files, 0), 'bytes', coalesce(o.bytes, 0)) order by b.id), '[]'::json)
      from storage.buckets b
      left join (select bucket_id, count(*) as files, sum(coalesce((metadata ->> 'size')::bigint, 0)) as bytes
                 from storage.objects group by bucket_id) o on o.bucket_id = b.id),
    'accounts', json_build_object(
      'total', (select count(*) from auth.users),
      'verified', (select count(*) from auth.users where email_confirmed_at is not null),
      'active_7d', (select count(*) from auth.users where last_sign_in_at > now() - interval '7 days'),
      'banned', (select count(*) from public.profiles where public.is_banned(id)))
  ) end;
$$;


-- =====================================================================================
-- 15. Profile photos (public bucket): anyone can view, each person manages <user id>/
-- =====================================================================================

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


-- =====================================================================================
-- 16. Live updates (chat, sessions, notifications, support, maintenance mode)
-- =====================================================================================

do $$
declare
  t text;
begin
  foreach t in array array['messages', 'sessions', 'notifications', 'support_messages', 'support_tickets', 'platform_settings'] loop
    begin
      execute format('alter publication supabase_realtime add table public.%I', t);
    exception when duplicate_object then null;
    end;
  end loop;
end $$;


-- =====================================================================================
-- 17. Clean-up: rules from older versions of this file, replaced by the ones above
-- =====================================================================================

drop policy if exists "read own or all as super admin" on public.mentor_applications;
drop policy if exists "super admin decides" on public.mentor_applications;
drop policy if exists "read own docs or all as super admin" on storage.objects;
drop policy if exists "read own reports or all as super admin" on public.reports;
drop policy if exists "super admin reviews reports" on public.reports;
