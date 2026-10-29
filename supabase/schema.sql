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
  created_at timestamptz not null default now()
);
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
  insert into public.profiles (id, full_name, role, university, field)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', new.raw_user_meta_data ->> 'name'),
    new.raw_user_meta_data ->> 'role',
    new.raw_user_meta_data ->> 'university',
    new.raw_user_meta_data ->> 'field'
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
