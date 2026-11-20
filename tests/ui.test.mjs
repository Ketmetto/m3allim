// Website tests: renders the real app in a simulated browser (jsdom) with a fake Supabase client
// (tests/support/fake-supabase.js), opens every page as every role, and checks what each role sees,
// where they get redirected, and that nothing logs an error. Run with: npm run test:ui
import { JSDOM } from 'jsdom';
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const FAKE = path.join(HERE, 'support', 'fake-supabase.js');

const dom = new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>', { url: 'http://localhost/', pretendToBeVisual: true });
const g = globalThis;
for (const k of ['window', 'document', 'navigator', 'localStorage', 'sessionStorage', 'HTMLElement', 'Node', 'Element', 'Event', 'KeyboardEvent', 'MouseEvent', 'getComputedStyle', 'requestAnimationFrame', 'cancelAnimationFrame', 'location', 'history', 'CustomEvent', 'HashChangeEvent', 'PopStateEvent']) {
  try { Object.defineProperty(g, k, { value: dom.window[k], configurable: true, writable: true }); } catch {}
}
g.IS_REACT_ACT_ENVIRONMENT = true;
// Like current Chrome: scroll methods return a Promise (an effect that returns it by accident crashes React).
dom.window.scrollTo = () => Promise.resolve();
Element.prototype.scrollIntoView = function () { return Promise.resolve(); };
g.fetch = async () => ({ ok: true, json: async () => ({ version: 'v2' }) });
dom.window.fetch = g.fetch;
g.performance = g.performance || { now: () => Date.now() };

const errors = [];
const origError = console.error;
console.error = (...a) => { errors.push(a.map(String).join(' ').slice(0, 400)); };
console.warn = () => {};

const server = await createServer({
  root: ROOT,
  logLevel: 'error',
  server: { middlewareMode: true },
  appType: 'custom',
  plugins: [{
    name: 'fake-supabase',
    enforce: 'pre',
    resolveId(id, importer) {
      if (id === 'virtual:test-entry') return '\0test-entry';
      if (id.endsWith('/supabase.js') && importer?.includes('/src/')) return FAKE;
      return null;
    },
    load(id) {
      if (id !== '\0test-entry') return null;
      return `export { default as App } from '/src/App.jsx';
export { AuthProvider } from '/src/context/AuthContext.jsx';
export { SettingsProvider } from '/src/context/SettingsContext.jsx';
export { LiveProvider } from '/src/context/LiveContext.jsx';
export { HashRouter } from 'react-router-dom';
export { default as React, act } from 'react';
export { createRoot } from 'react-dom/client';
export * as fake from '${FAKE}';`;
    },
  }],
});

const { React, act, createRoot, HashRouter, App, AuthProvider, SettingsProvider, LiveProvider, fake } = await server.ssrLoadModule('virtual:test-entry');

const settle = async (ms = 60) => { for (let i = 0; i < 4; i++) await act(async () => { await new Promise((r) => setTimeout(r, ms / 4)); }); };

let root;
async function mount(user) {
  if (root) await act(async () => root.unmount());
  fake.setUser(user);
  document.body.innerHTML = '<div id="root"></div>';
  root = createRoot(document.getElementById('root'));
  await act(async () => {
    root.render(React.createElement(HashRouter, null, React.createElement(AuthProvider, null, React.createElement(SettingsProvider, null, React.createElement(LiveProvider, null, React.createElement(App))))));
  });
  await settle();
}
async function visit(route) {
  await act(async () => { window.location.hash = `#${route}`; window.dispatchEvent(new HashChangeEvent('hashchange')); });
  await settle(80);
  return { at: window.location.hash.slice(1).split('?')[0] || '/', text: document.body.textContent };
}

const U = fake.USERS;
// route → text that proves the page rendered
const PAGES = {
  '/': 'Learn from people', '/mentors': 'Find a mentor', [`/mentors/${U.mentor.id}`]: 'Weekly availability',
  '/login': 'Welcome back', '/signup': 'Create your account', '/welcome': 'How will you use M3allim',
  '/student': 'here’s what’s happening', '/student/sessions': 'My sessions', '/student/saved': 'Saved mentors',
  '/mentor/apply': 'application', '/mentor/status': 'Mentor application', '/mentor': 'Answer requests', '/mentor/profile': 'My mentor profile', '/mentor/availability': 'My availability', '/mentor/reviews': 'My reviews',
  '/account': 'Account settings', '/notifications': 'Notifications', '/messages': 'Messages', '/support': 'Help & support',
  '/admin': 'Platform activity', '/admin/verification': 'Mentor verification', '/admin/reports': 'Reports from students', '/admin/support': 'Help requests', '/admin/users': 'Users & bans', '/admin/announcements': 'Send updates',
  '/super/admins': 'Manage admins', '/super/settings': 'Platform settings', '/super/health': 'System health', '/super/audit': 'Audit log',
};
const ALLOWED = {
  guest: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/login', '/signup'],
  newbie: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/welcome', '/account', '/notifications', '/support'],
  student: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/student', '/student/sessions', '/student/saved', '/account', '/notifications', '/messages', '/support'],
  applicant: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/mentor/status', '/account', '/notifications', '/support'],
  rejected: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/mentor/apply', '/mentor/status', '/account', '/notifications', '/support'],
  mentor: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/mentor', '/mentor/profile', '/mentor/availability', '/mentor/reviews', '/account', '/notifications', '/messages', '/support'],
  admin: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/account', '/notifications', '/messages', '/admin', '/admin/verification', '/admin/reports', '/admin/support', '/admin/users', '/admin/announcements'],
  super: ['/', '/mentors', `/mentors/${U.mentor.id}`, '/account', '/notifications', '/messages', '/admin', '/admin/verification', '/admin/reports', '/admin/support', '/admin/users', '/admin/announcements', '/super/admins', '/super/settings', '/super/health', '/super/audit'],
};
const HOME = { guest: '/login', newbie: '/welcome', student: '/student', applicant: '/mentor/status', rejected: '/mentor/status', mentor: '/mentor', admin: '/admin', super: '/admin' };

let fail = 0, pass = 0;
const check = (cond, label) => { if (cond) pass++; else { fail++; origError('  FAIL', label); } };

for (const [key, allowed] of Object.entries(ALLOWED)) {
  const user = key === 'guest' ? null : U[key];
  await mount(user);
  for (const route of Object.keys(PAGES)) {
    errors.length = 0;
    const { at, text } = await visit(route);
    const ok = allowed.includes(route);
    if (ok) {
      check(at === route.split('?')[0], `${key} ${route}: stayed (ended at ${at})`);
      check(text.toLowerCase().includes(PAGES[route].toLowerCase()), `${key} ${route}: shows "${PAGES[route]}"`);
    } else if (['/login', '/signup'].includes(route) && key !== 'guest') {
      check(at !== route, `${key} ${route}: signed-in user sent away from ${route}`);
    } else if (key === 'guest') {
      check(at === '/login', `${key} ${route}: guest sent to log in (ended at ${at})`);
    } else {
      check(at === HOME[key] || allowed.includes(at), `${key} ${route}: redirected home (ended at ${at})`);
    }
    const real = errors.filter((e) => !e.includes('inert') && !e.includes('not wrapped in act'));
    check(real.length === 0, `${key} ${route}: no console errors\n      ${real.join('\n      ')}`);
  }
}

// Banned account: everything shows the ban notice except support
await mount(U.banned);
let r = await visit('/student');
check(r.text.includes('Your account is suspended') && r.text.includes('Spam'), 'banned: sees suspension notice');
r = await visit('/support');
check(r.text.includes('Help & support'), 'banned: can open support to appeal');

// Maintenance mode: visitors see the maintenance page, admins don't
fake.setSetting('maintenance_mode', true);
await mount(null);
r = await visit('/mentors');
check(r.text.includes('We’ll be right back'), 'maintenance: guest sees maintenance page');
r = await visit('/login');
check(r.text.includes('Welcome back'), 'maintenance: login stays open');
await mount(U.student);
r = await visit('/student');
check(r.text.includes('We’ll be right back'), 'maintenance: student sees maintenance page');
await mount(U.admin);
r = await visit('/admin');
check(r.text.includes('Platform activity') && r.text.includes('Maintenance mode is on'), 'maintenance: admin works, sees banner');
fake.setSetting('maintenance_mode', false);

// Sign-ups closed
fake.setSetting('student_signups_open', false); fake.setSetting('mentor_applications_open', false);
await mount(null);
r = await visit('/signup');
check(r.text.includes('Sign-ups are paused'), 'sign-ups closed: message shown');
fake.setSetting('student_signups_open', true); fake.setSetting('mentor_applications_open', true);

// Role-specific content checks
await mount(U.student);
r = await visit(`/mentors/${U.mentor.id}`);
check(r.text.includes('Request a session') && r.text.includes('free'), 'student: booking panel with free slots');
r = await visit('/student/sessions');
check(r.text.includes('proposed a new time'), 'student: sees mentor proposal');
r = await visit('/messages');
check(r.text.includes('M3allim team') || r.text.includes('Team'), 'student: admin labelled as team in chat');
await mount(null);
r = await visit(`/mentors/${U.mentor.id}`);
check(r.text.includes('Create a free account') && !r.text.includes('Send request'), 'guest: no booking, sign-up prompt');
await mount(U.mentor);
r = await visit(`/mentors/${U.mentor.id}`);
check(r.text.includes('This is your public profile'), 'mentor: own profile panel');
r = await visit('/mentor');
check(r.text.includes('Accept') && r.text.includes('New times proposed by students'), 'mentor: requests and proposals');
await mount(U.admin);
r = await visit('/admin');
check(!r.text.includes('Manage admins'), 'admin: no super admin menu');
await mount(U.super);
r = await visit('/admin');
check(r.text.includes('Manage admins') && r.text.includes('System health'), 'super admin: system menu');

// Interactions: open dialogs and check they render
async function click(text, selector = 'button, a') {
  const el = [...document.querySelectorAll(selector)].find((e) => e.textContent.trim().includes(text) && !e.disabled);
  if (!el) return false;
  await act(async () => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await settle(80);
  return true;
}
const dialog = () => document.querySelector('[role="dialog"]')?.textContent || '';
errors.length = 0;
await mount(U.student);
await visit('/student/sessions');
check(await click('Reschedule'), 'student: Reschedule button');
check(dialog().includes('Propose a new time') && /\d\d:\d\d/.test(dialog()), 'student: reschedule dialog with times');
await act(async () => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
await settle();
check(await click('Past (', '[role="tab"]'), 'student: Past tab');
check(await click('Rate & review'), 'student: Rate button');
check(dialog().includes('Rate your session'), 'student: rate dialog');
await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
await settle();
check(await click('Report'), 'student: Report link');
check(dialog().includes('Reports are private'), 'student: report dialog');
await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
await visit(`/mentors/${U.mentor.id}`);
const slots = [...document.querySelectorAll('.slot')].length;
check(slots > 0, `student: ${slots} bookable start times shown`);
await mount(U.admin);
await visit('/admin/users');
check(await click('Ban'), 'admin: Ban button');
check(dialog().includes('How long'), 'admin: ban dialog');
await act(async () => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' })));
await visit('/admin/reports');
check(document.body.textContent.includes('Report #1') && document.body.textContent.includes('Ban mentor and resolve'), 'admin: report panel with ban action');
await visit('/admin/verification');
check(document.body.textContent.includes('Passport') && document.body.textContent.includes('Identity document matches'), 'admin: verification shows ID and checklist');
await visit('/admin/support');
check(document.body.textContent.includes('On it') && document.body.textContent.includes('Please help') && document.body.textContent.includes('Close ticket'), 'admin: support thread');
await mount(U.super);
await visit('/super/health');
check(document.body.textContent.includes('Operational') && document.body.textContent.includes('Mentor documents'), 'super: health checks and storage');
await visit('/super/admins');
check(document.body.textContent.includes('No account yet') && document.body.textContent.includes('Owner'), 'super: admin team list');
await mount(U.mentor);
await visit('/mentor/availability');
check(document.querySelectorAll('[role="switch"]').length === 7 && document.body.textContent.includes('17:00'), 'mentor: weekly editor with saved hours');
await visit('/mentor/reviews');
check(document.body.textContent.includes('Great') && document.body.textContent.includes('5★'), 'mentor: reviews and breakdown');
await mount(U.rejected);
await visit('/mentor/apply');
check(document.body.textContent.includes('Add LinkedIn') && document.body.textContent.includes('Already uploaded'), 'rejected: resubmit form keeps note and files');
const late = errors.filter((e) => !e.includes('inert') && !e.includes('not wrapped in act'));
check(late.length === 0, `interactions: no console errors\n      ${late.join('\n      ')}`);

origError(`\n${pass} passed, ${fail} failed`);
await server.close();
process.exit(fail ? 1 : 0);
