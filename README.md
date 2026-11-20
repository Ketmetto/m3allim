# M3allim · معلّم

Free, verified, one-to-one mentorship for students and graduates in Lebanon.
Students find a verified professional, request a video session at a time that suits both, chat, and leave a review.
Mentors apply with their ID, CV and cover letter, and are verified by the M3allim team before they appear.

Built with **React + Vite** (website) and **Supabase** (Postgres database, accounts, file storage, live updates).

| Read next | What's inside |
|---|---|
| [docs/ROLES.md](docs/ROLES.md) | The five roles, everything each one can do, and where it lives in the code |
| [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) | How the code is organised and how a request travels from a button to the database |
| [docs/DATABASE.md](docs/DATABASE.md) | Every table, the security rules, and the automatic triggers |

## The roles at a glance

| Role | In one line |
|---|---|
| **Guest** | Browses mentors, reads profiles and ratings; can sign up or log in, but can't book or chat |
| **Student** | Requests sessions in a mentor's free hours, reschedules, chats, joins the video call, rates, saves mentors, reports, gets notifications |
| **Mentor** | Verifies identity (ID or passport, CV, cover letter), builds a profile, sets weekly availability, accepts or declines, chats, sees reviews, reports |
| **Admin** | Verifies mentors, handles reports and support, chats with anyone, bans and unbans, sends announcements |
| **Super admin** | Everything an admin can do, plus managing admins, platform settings, maintenance mode, system health and the audit log |

## Run it

```bash
npm install
npm run dev          # http://localhost:5173
npm test             # database rules + every page for every role (about a minute)
npm run build        # production build in /dist
```

The website needs its Supabase project (see **Backend setup**). Put the keys in `.env.local` (template: `.env.example`).

## Project structure

```
src/
  main.jsx              entry point: router + the three app-wide providers
  App.jsx               every page and which roles may open it (start here)
  config/               roles, menus per role, lists and limits
  services/             every database call, one file per feature (the only code that talks to Supabase)
  context/              who is signed in, platform settings, live notification counts
  hooks/                reusable React logic: loading data, live sessions, chat, saved mentors
  components/
    ui/                 design system: Button, Card, Field, Modal, DataTable…
    layout/             top bar, phone taskbar, admin sidebar, page frames
    guards/             route protection, maintenance mode, bans
    mentors/ sessions/ chat/ support/ notifications/ moderation/ auth/   feature pieces
  pages/
    guest/ auth/ student/ mentor/ admin/ super-admin/ shared/ system/   one folder per role
  utils/                time zones, booking slots, formatting, CSV
  styles/global.css     design tokens and all styles
supabase/
  schema.sql            the whole database: tables, security rules, triggers (run in the SQL editor)
  templates/            branded emails (verify email, reset password)
tests/
  database.test.mjs     runs schema.sql in an in-memory Postgres and checks what each role may do
  ui.test.mjs           opens every page as every role in a simulated browser
docs/                   roles, architecture, database
```

## Backend setup (Supabase)

About 15 minutes, once.

1. **Create a project** at [supabase.com](https://supabase.com) (free plan is fine).
2. **Create the database.** Open *SQL Editor*, paste all of [`supabase/schema.sql`](supabase/schema.sql) and click *Run*. It creates every table, the private `mentor-docs` bucket (ID, CV, cover letter), the public `avatars` bucket and all access rules. The super admin's email is set near the top of that file (`super_admins`).
   **Upgrading an existing project:** run the same file again. It only adds what's missing and refreshes the rules; existing data is kept.
3. **Connect the site.** Copy `.env.example` to `.env.local` and fill in *Project URL* and the *anon public* key from *Project settings → API*. Restart `npm run dev`.
4. **Allow the redirect.** *Authentication → URL Configuration*: set *Site URL* to `http://localhost:5173` and add `http://localhost:5173/**` to *Redirect URLs*. Add your real domain too when you deploy.
5. **Email verification** is on by default. Supabase's built-in sender only allows a few emails per hour, so before launch add your own SMTP under *Authentication → Emails → SMTP settings* (Gmail: host `smtp.gmail.com`, port `465`, your Gmail address and a [Google app password](https://myaccount.google.com/apppasswords)). Then paste [`supabase/templates/confirm-signup.html`](supabase/templates/confirm-signup.html) into **Confirm signup** and [`reset-password.html`](supabase/templates/reset-password.html) into **Reset password**. Their links work on any device.
6. **Google sign-in.** In [Google Cloud Console](https://console.cloud.google.com/apis/credentials) create an *OAuth client ID* (Web application) with `http://localhost:5173` as an authorised origin and `https://<project-id>.supabase.co/auth/v1/callback` as the redirect URI. Paste the Client ID and secret into Supabase *Authentication → Sign In / Providers → Google*.

### Admins

- The **super admin** is whoever's email is in the `super_admins` table (set in `schema.sql`). It can only be changed in the SQL editor, never from the website.
- **Admins** are added by the super admin on *Manage admins* (`/super/admins`), by email. They get admin access the next time they sign in with that email, whether the account already exists or not.

## Deploy

**GitHub Pages:** [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) runs the tests, builds and publishes on every push to `main`, at `https://<user>.github.io/<repo>/`. One-time setup: *Settings → Pages → Source: GitHub Actions*; add the repository secrets `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`; add `https://<user>.github.io/<repo>/**` to Supabase *Redirect URLs*.

**Render (Static Site):** build command `npm install && npm run build`, publish directory `dist`, same two environment variables, and add the Render address to Supabase *Redirect URLs*.

## Design tokens

Teal `#0d7377`, deep teal `#084f52`, tint `#eaf5f3`, gold `#d4a017`, ink `#1a1a2e`, gray `#6b7280`. Font: Inter (Noto Sans Arabic for the wordmark). Edit them in `:root` in `src/styles/global.css`.

## Not built yet

- Arabic / right-to-left version.
- Email (not just in-app) notifications for session updates; Supabase sends only account emails today.
- Recurring sessions and calendar (.ics) invites.
