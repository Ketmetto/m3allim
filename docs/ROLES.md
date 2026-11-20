# Roles and permissions

M3allim has five roles. Every permission is enforced **twice**:

1. **In the website.** `src/App.jsx` wraps each page in `<RequireRole allow={[…]}>`, and menus only show what the role can use (`src/config/navigation.js`).
2. **In the database.** Row level security policies, triggers and functions in `supabase/schema.sql`. Even if someone calls the API directly, the database refuses anything their role isn't allowed to do. `tests/database.test.mjs` checks these rules one by one.

How the role is worked out: on sign-in the website calls the database function `whoami()`, and `roleFrom()` in `src/config/roles.js` turns the answer into one role. The highest role wins: super admin, then admin, mentor, applicant, student.

| Role | How someone gets it |
|---|---|
| Guest | Not signed in |
| Student | Signs up as a student |
| Applicant | Signs up as a mentor; stays an applicant until approved |
| Mentor | An admin approves the application (a database trigger publishes them) |
| Admin | The super admin adds their email on *Manage admins* |
| Super admin | Their email is in the `super_admins` table (SQL only) |

Two in-between states also exist: **new** (signed in with Google, hasn't picked student or mentor yet → `/welcome`) and **banned** (any role; sees a suspension notice, can only contact support).

---

## Guest

| Can | Page | Code |
|---|---|---|
| Browse and search mentors (field, language) | `/mentors` | `pages/guest/BrowseMentors.jsx` |
| View a mentor's profile, rating, reviews, weekly hours | `/mentors/:id` | `pages/guest/MentorProfile.jsx` |
| Sign up (email + verification link, or Google) | `/signup` | `pages/auth/SignUp.jsx` |
| Log in, reset a forgotten password | `/login`, `/reset-password` | `pages/auth/SignIn.jsx`, `ResetPassword.jsx` |

**Can't** request sessions or chat. The profile page shows "Create a free account" instead of the booking form. In the database, guests use the `anon` role, which has no insert rights on sessions or messages.

## Student

| Can | Page | Code | Enforced in the database by |
|---|---|---|---|
| Edit profile (name, photo, university, about me) | `/account` | `pages/shared/Account.jsx` | `update own profile` policy + column grants |
| See notifications (bell icon + page) | `/notifications` | `components/notifications/`, `pages/shared/Notifications.jsx` | `notifications` table; created only by triggers |
| Chat with mentors | `/messages` | `components/chat/ChatWindow.jsx` | `can_message()` |
| Save favourite mentors | `/student/saved` | `pages/student/SavedMentors.jsx`, `hooks/useFavorites.js` | `own favorites` policy |
| Request a session with a date and time (only inside the mentor's free hours) | `/mentors/:id` | `components/mentors/SlotPicker.jsx`, `utils/slots.js` | `before_session_request()` + `slot_problem()` |
| Manage requests and the schedule (upcoming, requests, past, cancelled) | `/student/sessions` | `pages/student/MySessions.jsx` | `guard_session_update()` |
| Reschedule and wait for the mentor's approval | `/student/sessions` | `components/sessions/RescheduleDialog.jsx` | `guard_session_update()`: a confirmed session only moves when the other side accepts |
| Join the video session (opens 10 minutes before) | `/student/sessions` | `components/sessions/SessionItem.jsx` | Private Jitsi room per session (`video_room`) |
| Rate and review after the session | `/student/sessions` | `components/sessions/RateDialog.jsx` | Only after the session has ended |
| Report a mentor to the admins | profile, chat, session | `components/moderation/ReportDialog.jsx` | `file reports` policy |
| Ask for help (chat with the admin team) | `/support` | `pages/shared/HelpCenter.jsx` | `support_tickets` policies |

## Mentor

| Can | Page | Code | Enforced in the database by |
|---|---|---|---|
| Apply after sign-up: ID or passport photo, CV, cover letter, phone, city, education, languages, LinkedIn | `/mentor/apply` | `pages/mentor/MentorApply.jsx`, `services/applications.js` | `submit own application`: the ID is required and files must be in the applicant's own folder |
| Follow the application; fix and resend it after a decline | `/mentor/status` | `pages/mentor/ApplicationStatus.jsx` | `applicants resubmit after a decline` |
| Build the public profile (headline, bio, topics, languages, LinkedIn) with a live preview | `/mentor/profile` | `pages/mentor/EditMentorProfile.jsx` | Column grants: name, field and experience stay as verified |
| Set weekly availability | `/mentor/availability` | `pages/mentor/Availability.jsx` | `mentor_availability` table; requests outside it are refused |
| Accept or decline a student's request | `/mentor` | `pages/mentor/MentorDashboard.jsx` | Can't accept two overlapping sessions (`session_clashes()`) |
| Propose a new time, accept a student's proposal | `/mentor` | `components/sessions/` | `guard_session_update()` |
| Join the video session | `/mentor` | `SessionItem.jsx` | |
| Chat with students and admins | `/messages` | `ChatWindow.jsx` | `can_message()` |
| Report a student | session, chat | `ReportDialog.jsx` | `file reports` |
| View their reviews (average, breakdown, every review) | `/mentor/reviews` | `pages/mentor/MentorReviews.jsx` | |

## Admin

Admin pages use the sidebar layout (`components/layout/AdminShell.jsx`).

| Can | Page | Code | Enforced in the database by |
|---|---|---|---|
| See live platform numbers | `/admin` | `pages/admin/AdminOverview.jsx` | `admin_stats()` |
| Verify mentors: open the ID, CV and cover letter, checklist, approve or decline (+ Gmail draft) | `/admin/verification` | `pages/admin/Verification.jsx` | `admins decide` policy; approval publishes the mentor (`publish_approved_mentor()`) |
| Handle reports: resolve, dismiss, ban the reported person, message either side | `/admin/reports` | `pages/admin/Reports.jsx` | `admins review reports`; the reporter is notified |
| Answer support requests and ban appeals | `/admin/support` | `pages/admin/SupportInbox.jsx` | `support_*` policies |
| Chat with any student or mentor | `/messages` | `ChatWindow.jsx` | `can_message()` lets admins message anyone |
| Ban (24 h, 7 days, 30 days, permanent) or unban | `/admin/users` | `pages/admin/Users.jsx`, `components/moderation/BanDialog.jsx` | `admin_set_ban()`: cancels the person's upcoming sessions, hides banned mentors, blocks chat and requests |
| Send announcements to everyone, students or mentors | `/admin/announcements` | `pages/admin/Announcements.jsx` | `deliver_announcement()` turns it into notifications |
| View the website like anyone else | sidebar → *View the website* | `config/navigation.js` | |

Admins can't ban other admins, manage admins, change settings or read other people's private chats.

## Super admin

Everything an admin can do, plus the **SYSTEM** section of the sidebar:

| Can | Page | Code | Enforced in the database by |
|---|---|---|---|
| Add, suspend, restore and remove admins | `/super/admins` | `pages/super-admin/ManageAdmins.jsx` | `super admin manages admins` policy |
| Change platform settings: sign-ups, mentor applications, session length, open-request limit, booking notice | `/super/settings` | `pages/super-admin/PlatformSettings.jsx` | `platform_settings`; read by the booking rules |
| Maintenance mode (only admins can use the site; live for every open browser) | `/super/settings` | `components/guards/AppGate.jsx`, `context/SettingsContext.jsx` | `super admin changes settings` |
| System health: live checks of the database, sign-in, storage, live updates and video, plus database size, rows and files | `/super/health` | `pages/super-admin/SystemHealth.jsx`, `services/superAdmin.js` | `system_health()` |
| Audit log of every admin action, and CSV exports | `/super/audit` | `pages/super-admin/AuditLog.jsx` | `audit_log`, written only by the database (`log_action()`) |
| View the website normally | sidebar → *View the website*; the top bar keeps an *Admin dashboard* link | | |
