# M3allim · front-end prototype

React + Vite implementation of the M3allim Figma file: free, verified, one-to-one mentorship for students and graduates in Lebanon.
Accounts, mentor applications and document uploads run on [Supabase](https://supabase.com) once it is connected (see **Backend setup** below). Everything else is sample data in `src/data/mock.js`. Without Supabase the whole site still runs as a browser-only demo.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
npm run build      # production build in /dist
node smoke-test.mjs  # renders every route on the server to catch runtime errors
```

Open `http://localhost:5173/#/screens` for an index of every screen.

## Screens (routes)

| Area | Route | Figma screen |
|---|---|---|
| Public | `/` | Landing page |
| Public | `/mentors` | Browse mentors (working search + filters) |
| Public | `/mentors/:id` | Mentor profile (day, time and goal pickers) |
| Booking | `/book/:id` | Confirm booking (free, no payment) |
| Booking | `/book/:id/confirmed` | Booking confirmed |
| Account | `/login`, `/signup` | Log in / sign up (email + Google) |
| Account | `/welcome` | Pick student or mentor (first Google sign-in) |
| Account | `/reset-password` | Set a new password (from the reset email) |
| Mentor | `/mentor/apply` | Mentor application: phone, emails, CV, cover letter |
| Mentor | `/mentor/status` | Application status |
| Student | `/student` | Dashboard |
| Student | `/student/sessions` | My sessions (tabs, cancel, rate) |
| Student | `/student/messages` | Messages (send a message) |
| Admin | `/admin` | Overview |
| Admin | `/admin/verification` | Mentor verification (approve / reject) |
| Admin | `/admin/reports` | Reports (warn / dismiss / ban) |
| Admin | `/admin/users` | Users (ban / unban) |
| Admin | `/admin/announcements` | Announcements (compose + send) |
| Super admin | `/super` | Platform overview (maintenance toggle) |
| Super admin | `/super/verification` | Review mentor applications, open CV / cover letter, approve or decline via Gmail |
| Super admin | `/super/admins` | Manage admins (invite / suspend / remove) |
| Super admin | `/super/settings` | Platform settings |
| Super admin | `/super/audit` | Audit log & export (real CSV downloads) |

## Project structure

```
src/
  App.jsx                 routes
  styles/global.css       design tokens (colors, type) + all component styles
  components/ui.jsx       Button, Chip, Card, Table, Tabs, Toggle, Field, Avatar ...
  components/layout.jsx   navigation bars, footer, admin / super admin sidebar shell
  components/MentorCard.jsx
  components/icons.js     the lucide icons in use (add new ones here)
  components/auth.jsx     Google button, sign-in redirect handler, route guards
  lib/supabase.js         Supabase client (null when not configured)
  lib/auth.js             sign-in / sign-up helpers, where to send someone after login
  data/mock.js            all sample data
  data/applications.js    mentor applications (Supabase, or browser storage in demo mode)
  pages/public | student | mentor | admin | superadmin
supabase/schema.sql       database tables, file bucket and access rules
  utils/csv.js            CSV download helper
```

## Backend setup (Supabase)

About 15 minutes, once.

1. **Create a project** at [supabase.com](https://supabase.com) (free plan is fine).
2. **Create the database.** Open *SQL Editor*, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click *Run*. It creates the tables, the private `mentor-docs` file bucket and the access rules. The super admin email (`kitmittofam@gmail.com`) is set near the top of that file and in `superAdmin` in `src/data/mock.js`; keep them the same.
3. **Connect the site.** Copy `.env.example` to `.env.local` and fill in *Project URL* and the *anon public* key from *Project settings → API*. Restart `npm run dev`.
4. **Allow the redirect.** *Authentication → URL Configuration*: set *Site URL* to `http://localhost:5173` and add `http://localhost:5173/**` to *Redirect URLs*. Add your real domain too when you deploy.
5. **Email verification** is on by default (*Authentication → Sign In / Providers → Email → Confirm email*). Supabase's built-in sender only allows a few emails per hour, so before launch add your own SMTP under *Authentication → Emails → SMTP settings* (for example Resend, or Gmail with an app password).
6. **Google sign-in.**
   - In [Google Cloud Console](https://console.cloud.google.com/apis/credentials): create a project, set up the *OAuth consent screen* (External, app name M3allim, your email), then *Create credentials → OAuth client ID → Web application*.
   - *Authorized JavaScript origins*: `http://localhost:5173` (and your domain later).
   - *Authorized redirect URIs*: `https://<your-project-id>.supabase.co/auth/v1/callback` (Supabase shows this exact URL on the Google provider page).
   - Paste the Client ID and Client secret into Supabase *Authentication → Sign In / Providers → Google* and enable it.

### How the mentor flow works

1. A mentor signs up with email (and clicks the verification link) or with Google (already verified).
2. On first sign-in they land on `/mentor/apply` and submit phone, an optional second email, role, experience, LinkedIn, CV and cover letter (PDF or Word, 5 MB max).
3. The super admin opens *Mentor verification*, views the documents (private links that expire after 10 minutes), ticks the checklist and clicks *Approve* or *Decline*. The decision and note are saved, and a Gmail draft to the mentor (with the second email in CC) opens ready to send.
4. The mentor sees the result on `/mentor/status`.

Only emails listed in the `super_admins` table can read applications or documents; the database enforces this, not just the website.

## Design tokens

Teal `#0d7377`, deep teal `#084f52`, tint `#eaf5f3`, gold `#d4a017`, ink `#1a1a2e`, gray `#6b7280`, border `#e4e8ed`, background `#f5f7fa`. Font: Inter (Noto Sans Arabic for the wordmark). Edit them in `:root` in `src/styles/global.css`.

## Mentor photos

Avatars fall back to initials. To show photos, add files to `public/avatars/`: `layla.jpg`, `karim.jpg`, `nour.jpg`, `rami.jpg`, `mira.jpg`, `jad.jpg`, `sarah.jpg`.

## Not built yet

- Mentor interface (profile builder, availability, accept / decline requests). It has no Figma screens yet.
- Student pages, browsing and booking still use sample data (the student dashboard always shows Sarah Mansour). Approved mentors don’t appear in *Find a mentor* yet.
- Admin roles other than the super admin (the admin pages are limited to the super admin once Supabase is connected).
- Arabic / RTL version.
- The profile, browse and landing copy was rebuilt from the Figma file and may differ slightly from the original wording.
