# Architecture

## The big picture

```
 Browser (React website, src/)                               Supabase (backend)
 ┌──────────────────────────────────────────┐                ┌──────────────────────────────────┐
 │ pages/        one folder per role        │                │ Auth       accounts, Google,     │
 │   ↓ use                                  │                │            email verification    │
 │ components/   reusable pieces            │                │ Postgres   tables + security     │
 │   ↓ use                                  │   HTTPS / WS   │            rules + triggers      │
 │ hooks/ + context/   state, live updates  │ ─────────────► │            (supabase/schema.sql) │
 │   ↓ call                                 │                │ Storage    ID, CV, cover letter, │
 │ services/     the ONLY code that talks   │ ◄───────────── │            profile photos        │
 │               to Supabase                │  live updates  │ Realtime   chat, notifications,  │
 └──────────────────────────────────────────┘                │            maintenance mode      │
                                                              └──────────────────────────────────┘
```

There is no separate server: the website talks to Supabase directly with the public *anon* key. That's safe because **the database decides what each person may do** (row level security), not the website.

## Layers (folders in `src/`)

| Folder | Responsibility | Rule of thumb |
|---|---|---|
| `config/` | Roles, which menu each role sees, lists and limits | Change a menu or a limit here, not in pages |
| `services/` | Every call to Supabase, one file per feature (`sessions.js`, `chat.js`, `admin.js`…) | Only services import `supabase.js` |
| `context/` | Data the whole app needs: `AuthContext` (who is signed in, their role), `SettingsContext` (platform settings, live), `LiveContext` (notifications and unread counts, live) | Read with `useAuth()`, `useSettings()`, `useLive()` |
| `hooks/` | Reusable React logic: `useAsync` (load data with loading/error), `useMySessions`, `useMessages`, `useFavorites` | |
| `components/ui/` | Design system: Button, Card, Field, Modal, DataTable… | No data loading here |
| `components/layout/` | Page frames: `SiteLayout` (top bar), `AdminShell` (sidebar), `AuthLayout`, `RoleLayout` | |
| `components/guards/` | `RequireRole`, `GuestOnly`, `AppGate` (maintenance mode, bans) | |
| `components/<feature>/` | Pieces used by several pages: `sessions/SessionItem`, `mentors/SlotPicker`, `chat/ChatWindow`… | |
| `pages/<role>/` | One file per screen, grouped by the role that uses it | Pages put the pieces together |
| `utils/` | Pure functions: Beirut time zone, booking slots, formatting, CSV | No React, no database |

## What happens when you sign in

```
SignIn page ──signInWithEmail()──► Supabase Auth ──session──► AuthContext
                                                                  │ loadAccount(): whoami() in the database
                                                                  ▼
                                    { role: 'student', ban: null, … }  (config/roles.js → roleFrom)
                                                                  │
GuestOnly guard sees the account ──► homeFor(role) ──► /student, /mentor, /admin…
```

Every page is wrapped by `AppGate` (`components/guards/AppGate.jsx`), which shows the maintenance page or the ban notice when needed, then by `RequireRole` for that page's roles.

## Example: a student requests a session

1. **Page.** `pages/guest/MentorProfile.jsx` shows the request form to students only.
2. **Component.** `components/mentors/SlotPicker.jsx` loads the mentor's weekly hours and busy times, and `utils/slots.js` lists only free start times (session length and booking notice come from the platform settings).
3. **Service.** `services/sessions.js → requestSession()` inserts a row in `sessions`.
4. **Database.** Before saving, the trigger `before_session_request()` sets the session length, checks the open-request limit, and calls `slot_problem()`: inside the mentor's hours? enough notice? no clash with a confirmed session? The policy `students request sessions` checks the person is a student and nobody is banned.
5. **Notification.** After saving, `notify_session_change()` adds a notification for the mentor.
6. **Live update.** Supabase Realtime pushes it to the mentor's browser; `LiveContext` adds it to the bell icon and `useMySessions('mentor')` reloads their dashboard.

The same pattern (page → service → database rule → trigger → notification → live update) is used for accepting, rescheduling, rating, reporting, support replies, bans and announcements.

## Adding a feature

1. **Database:** add the table, policies and any trigger to `supabase/schema.sql` (keep it safe to re-run: `if not exists`, `drop policy if exists`), and a check to `tests/database.test.mjs`.
2. **Service:** add the calls in `src/services/<feature>.js`.
3. **Page:** create it in `src/pages/<role>/`, add the route in `src/App.jsx` with the roles allowed, and the menu link in `src/config/navigation.js`.
4. **Test:** add the route and expected text to `tests/ui.test.mjs`, then run `npm test`.

## Tests

| | What it does |
|---|---|
| `npm run test:db` | Starts an in-memory Postgres (PGlite), runs `schema.sql` twice, creates sample accounts, then acts as each role and checks what the database allows: about 130 checks (bookings outside availability refused, banned users can't chat, admins can't change settings…) |
| `npm run test:ui` | Loads the real website into a simulated browser (jsdom) with a fake Supabase (`tests/support/fake-supabase.js`), opens every page as every role and checks the content, the redirects, the dialogs, and that nothing logs an error: about 570 checks |

The deploy workflow runs `npm test` before publishing.
