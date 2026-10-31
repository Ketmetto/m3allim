-- Removes the demo mentors and the demo student (accounts ending in @example.com that start with "demo.").
-- Their applications, mentor profiles, sessions, messages, favorites and reports are deleted with them.
-- Run in Supabase → SQL Editor before launch.
delete from auth.users where email like 'demo.%@example.com';
