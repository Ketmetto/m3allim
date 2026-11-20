// Which links each role sees. Change a menu here and every navigation bar updates.
//   SITE_LINKS   top bar on computers, and the ☰ menu on phones
//   TAB_BAR      bottom taskbar on phones (5 items at most)
//   ADMIN_MENU   sidebar of the admin dashboard
// badge: 'messages' | 'notifications' | 'applications' | 'reports' | 'tickets' shows a live count.
import { ROLES, STAFF } from './roles.js';

const HOME = { to: '/', end: true, icon: 'Home', label: 'Home' };
const FIND = { to: '/mentors', icon: 'Search', label: 'Find a mentor' };
const MESSAGES = { to: '/messages', icon: 'MessageCircle', label: 'Messages', badge: 'messages' };
const ADMIN_DASHBOARD = { to: '/admin', icon: 'LayoutDashboard', label: 'Admin dashboard' };

export const SITE_LINKS = {
  [ROLES.GUEST]: [
    HOME,
    FIND,
    { to: '/', scroll: 'how', icon: 'Lightbulb', label: 'How it works' },
    { to: '/', scroll: 'become', icon: 'Briefcase', label: 'Become a mentor' },
  ],
  [ROLES.NEW]: [HOME, FIND, { to: '/welcome', icon: 'UserCheck', label: 'Finish sign-up' }],
  [ROLES.STUDENT]: [
    { to: '/student', end: true, icon: 'Home', label: 'Dashboard' },
    FIND,
    { to: '/student/sessions', icon: 'Calendar', label: 'My sessions' },
    { to: '/student/saved', icon: 'Bookmark', label: 'Saved' },
    MESSAGES,
  ],
  [ROLES.APPLICANT]: [
    { to: '/mentor/status', icon: 'Hourglass', label: 'My application' },
    FIND,
  ],
  [ROLES.MENTOR]: [
    { to: '/mentor', end: true, icon: 'Home', label: 'Dashboard' },
    { to: '/mentor/profile', icon: 'PenLine', label: 'My profile' },
    { to: '/mentor/availability', icon: 'CalendarClock', label: 'Availability' },
    { to: '/mentor/reviews', icon: 'Star', label: 'Reviews' },
    MESSAGES,
  ],
  // Admins can browse the website like everyone else, with a way back to the dashboard.
  [ROLES.ADMIN]: [HOME, FIND, ADMIN_DASHBOARD],
  [ROLES.SUPER_ADMIN]: [HOME, FIND, ADMIN_DASHBOARD],
};

/* Extra items in the ☰ menu and the profile menu for anyone signed in. */
export const ACCOUNT_LINKS = [
  { to: '/notifications', icon: 'Bell', label: 'Notifications', badge: 'notifications' },
  { to: '/support', icon: 'LifeBuoy', label: 'Help & support', hideFor: STAFF },
  { to: '/account', icon: 'User', label: 'Account settings' },
];

export const TAB_BAR = {
  [ROLES.GUEST]: [
    HOME,
    { ...FIND, label: 'Mentors' },
    { to: '/login', icon: 'LogIn', label: 'Log in' },
    { to: '/signup', icon: 'UserPlus', label: 'Join' },
  ],
  [ROLES.NEW]: [HOME, { ...FIND, label: 'Mentors' }, { to: '/welcome', icon: 'UserCheck', label: 'Finish' }],
  [ROLES.STUDENT]: [
    { to: '/student', end: true, icon: 'Home', label: 'Home' },
    { ...FIND, label: 'Mentors' },
    { to: '/student/sessions', icon: 'Calendar', label: 'Sessions' },
    { ...MESSAGES, label: 'Chat' },
    { to: '/notifications', icon: 'Bell', label: 'Alerts', badge: 'notifications' },
  ],
  [ROLES.APPLICANT]: [
    { to: '/mentor/status', icon: 'Hourglass', label: 'Application' },
    { ...FIND, label: 'Mentors' },
    { to: '/support', icon: 'LifeBuoy', label: 'Help' },
    { to: '/account', icon: 'User', label: 'Profile' },
  ],
  [ROLES.MENTOR]: [
    { to: '/mentor', end: true, icon: 'Home', label: 'Home' },
    { to: '/mentor/availability', icon: 'CalendarClock', label: 'Hours' },
    { ...MESSAGES, label: 'Chat' },
    { to: '/notifications', icon: 'Bell', label: 'Alerts', badge: 'notifications' },
    { to: '/mentor/profile', icon: 'PenLine', label: 'Profile' },
  ],
  [ROLES.ADMIN]: [HOME, { ...FIND, label: 'Mentors' }, { ...ADMIN_DASHBOARD, label: 'Admin' }],
  [ROLES.SUPER_ADMIN]: [HOME, { ...FIND, label: 'Mentors' }, { ...ADMIN_DASHBOARD, label: 'Admin' }],
};

export const ADMIN_MENU = [
  {
    label: 'MANAGE',
    roles: STAFF,
    items: [
      { to: '/admin', end: true, icon: 'LayoutDashboard', label: 'Overview' },
      { to: '/admin/verification', icon: 'BadgeCheck', label: 'Mentor verification', badge: 'applications' },
      { to: '/admin/reports', icon: 'Flag', label: 'Reports', badge: 'reports' },
      { to: '/admin/support', icon: 'LifeBuoy', label: 'Support', badge: 'tickets' },
      { to: '/admin/users', icon: 'Users', label: 'Users & bans' },
      { to: '/admin/announcements', icon: 'Megaphone', label: 'Announcements' },
      MESSAGES,
    ],
  },
  {
    label: 'SYSTEM',
    roles: [ROLES.SUPER_ADMIN],
    items: [
      { to: '/super/admins', icon: 'ShieldCheck', label: 'Manage admins' },
      { to: '/super/settings', icon: 'SlidersHorizontal', label: 'Platform settings' },
      { to: '/super/health', icon: 'Activity', label: 'System health' },
      { to: '/super/audit', icon: 'History', label: 'Audit log & export' },
    ],
  },
];
