# Database

Everything is in one file, [`supabase/schema.sql`](../supabase/schema.sql), split into numbered sections. Run it in the Supabase SQL editor; it's safe to run again (it upgrades an existing project in place).

## Tables

| Table | What it holds | Who can read / write |
|---|---|---|
| `super_admins` | The owner's email | Nobody from the website (SQL only) |
| `admins` | Admin emails, status (Active / Suspended) | Admins read; the super admin manages |
| `profiles` | One per account: name, photo, account type (student / mentor), university, bio, ban | Own profile, contacts, admins; mentors' are public. Ban reason is private |
| `platform_settings` | One row: sign-ups, session length, open-request limit, booking notice, maintenance mode | Everyone reads; the super admin changes |
| `mentor_applications` | Details, ID type, paths to the ID / CV / cover letter, status, admin note | The applicant and admins |
| `mentors` | Public directory, created when an application is approved | Everyone (banned mentors hidden); the mentor edits their text |
| `mentor_availability` | Weekly hours: weekday, start, end (Beirut time) | Everyone reads; the mentor manages their own |
| `sessions` | Requests and sessions: time, status, proposed new time, video room, rating, review | The student, the mentor, admins |
| `messages` | One-to-one chat | Only the two people in the conversation |
| `favorites` | Saved mentors | The student |
| `reports` | Who reported whom, why, status, admin note | The reporter and admins (never the reported person) |
| `support_tickets`, `support_messages` | Help requests and their replies | The person and admins |
| `announcements` | Title, message, audience, how many received it | Admins |
| `notifications` | The bell icon: kind, title, text, link, read | Only the person; created only by triggers |
| `audit_log` | Every admin action: who, what, when, details | Admins read; written only by the database |

Views (read-only, no names): `mentor_stats` (average rating, reviews, sessions), `mentor_reviews` (rating + text), `mentor_busy` (confirmed session times, for the booking calendar).

Storage buckets: `mentor-docs` (private: ID, CV, cover letter; the applicant and admins only) and `avatars` (public profile photos).

## Security functions (used inside the rules)

| Function | Answers |
|---|---|
| `is_super_admin()`, `is_admin()` | Is the signed-in person the owner / an active admin (or the owner)? |
| `is_banned(user)` | Is this account banned right now? |
| `is_contact(user)` | Do we have a session or a conversation together? (then we may see each other's name and photo) |
| `can_message(user)` | May I write to this person? Admins: anyone. Everyone: mentors, and anyone who wrote to them. Mentors: their students. Never when banned |
| `slot_problem(mentor, start, minutes)` | Why a time can't be booked: too soon, outside availability, or clashes with a confirmed session |

## Automatic behaviour (triggers)

| When | The database automatically |
|---|---|
| Someone signs up | Creates their profile (`handle_new_user`) |
| A student requests a session | Sets the length, checks the open-request limit and the time (`before_session_request`) |
| A session changes | Checks who may change what (`guard_session_update`) and notifies the other person (`notify_session_change`) |
| An application is sent | Notifies admins (`on_application_submitted`) |
| An admin approves / declines | Publishes or removes the mentor, notifies them, writes the audit log (`publish_approved_mentor`) |
| A report is filed / reviewed | Notifies admins / the reporter, writes the audit log |
| A support message is sent | Marks the ticket Answered or Open, notifies the other side |
| An announcement is sent | Creates a notification for everyone in the audience (`deliver_announcement`) |
| Admins or settings change | Writes the audit log (`on_admin_change`, `on_settings_change`) |

## Functions the website calls (RPC)

`whoami()` (who am I, my role, my ban), `open_support_ticket()`, and for admins `admin_stats()`, `admin_list_users()`, `admin_set_ban()`, and for the super admin `list_admins()`, `system_health()`.

Each one checks the caller's role inside the database, so calling it without the right role returns nothing or an error.

## Live updates

Supabase Realtime is enabled for `messages`, `sessions`, `notifications`, `support_messages`, `support_tickets` and `platform_settings`. It respects the same rules: people only receive changes to rows they're allowed to read.
