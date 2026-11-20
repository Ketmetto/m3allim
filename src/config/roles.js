// The five kinds of people who use M3allim, plus two in-between states.
// The database enforces what each role may do (supabase/schema.sql); this file decides what the website shows.
// docs/ROLES.md has the full list of features per role.

export const ROLES = {
  GUEST: 'guest',             // not signed in: browse mentors and read profiles
  NEW: 'new',                 // signed in with Google but hasn't picked student or mentor yet
  STUDENT: 'student',
  APPLICANT: 'applicant',     // signed up as a mentor; identity and documents not approved yet
  MENTOR: 'mentor',           // approved by an admin, listed in the directory
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin', // the platform owner
};

export const ROLE_LABELS = {
  [ROLES.GUEST]: 'Guest',
  [ROLES.NEW]: 'New account',
  [ROLES.STUDENT]: 'Student',
  [ROLES.APPLICANT]: 'Mentor applicant',
  [ROLES.MENTOR]: 'Mentor',
  [ROLES.ADMIN]: 'Admin',
  [ROLES.SUPER_ADMIN]: 'Super admin',
};

/* ---------- Groups used by the route guards in App.jsx ---------- */
export const STAFF = [ROLES.ADMIN, ROLES.SUPER_ADMIN];
export const SIGNED_IN = [ROLES.NEW, ROLES.STUDENT, ROLES.APPLICANT, ROLES.MENTOR, ...STAFF];
export const CAN_CHAT = [ROLES.STUDENT, ROLES.MENTOR, ...STAFF];
export const CAN_ASK_SUPPORT = [ROLES.NEW, ROLES.STUDENT, ROLES.APPLICANT, ROLES.MENTOR];

export const isStaff = (role) => STAFF.includes(role);

/* Works out someone's role from the database's whoami() answer. The highest role wins. */
export function roleFrom(me) {
  if (!me) return ROLES.GUEST;
  if (me.is_super_admin) return ROLES.SUPER_ADMIN;
  if (me.is_admin) return ROLES.ADMIN;
  if (me.is_mentor) return ROLES.MENTOR;
  if (me.role === 'mentor') return ROLES.APPLICANT;
  if (me.role === 'student') return ROLES.STUDENT;
  return ROLES.NEW;
}

/* The page each role lands on after signing in. */
export function homeFor(account) {
  switch (account?.role) {
    case ROLES.SUPER_ADMIN:
    case ROLES.ADMIN:
      return '/admin';
    case ROLES.MENTOR:
      return '/mentor';
    case ROLES.APPLICANT:
      return account.applicationStatus ? '/mentor/status' : '/mentor/apply';
    case ROLES.STUDENT:
      return '/student';
    case ROLES.NEW:
      return '/welcome';
    default:
      return '/';
  }
}
