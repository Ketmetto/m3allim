// Test stand-in for src/services/supabase.js: a fake Supabase client that serves the sample data below,
// so every page can be rendered for every role without a real backend (used by tests/ui.test.mjs).
const now = Date.now();
const iso = (h) => new Date(now + h * 3600000).toISOString();

export const USERS = {
  student: { id: 'u-student', email: 's@test.com', name: 'Sara Student', role: 'student' },
  student2: { id: 'u-student2', email: 's2@test.com', name: 'Sami Second', role: 'student' },
  mentor: { id: 'u-mentor', email: 'm@test.com', name: 'Maya Mentor', role: 'mentor', is_mentor: true },
  mentor2: { id: 'u-mentor2', email: 'm2@test.com', name: 'Marc Mentor', role: 'mentor', is_mentor: true },
  applicant: { id: 'u-app', email: 'a@test.com', name: 'Adam Applicant', role: 'mentor', application_status: 'Pending' },
  rejected: { id: 'u-rej', email: 'r@test.com', name: 'Rita Rejected', role: 'mentor', application_status: 'Rejected' },
  newbie: { id: 'u-new', email: 'n@test.com', name: 'Nora New', role: null },
  admin: { id: 'u-admin', email: 'admin@test.com', name: 'Rana Admin', role: null, is_admin: true },
  super: { id: 'u-super', email: 'owner@test.com', name: 'Omar Owner', role: null, is_admin: true, is_super_admin: true },
  banned: { id: 'u-banned', email: 'b@test.com', name: 'Bob Banned', role: 'student', banned: true, ban_reason: 'Spam', banned_until: iso(48) },
};

const mentorRow = (u, extra = {}) => ({ id: u.id, full_name: u.name, headline: 'Designer at Murex', field: 'Design', experience_years: 7, bio: 'I help with portfolios.', languages: 'Arabic, English', topics: 'Portfolio review, Career advice', availability: 'Flexible', linkedin: 'linkedin.com/in/maya', created_at: iso(-500), profiles: { avatar_url: null }, ...extra });
const session = (id, student, mentor, startH, status, extra = {}) => ({
  id, student_id: student.id, mentor_id: mentor.id, topic: `Topic ${id}`, message: 'Hello', starts_at: iso(startH), duration_min: 45, status,
  proposed_starts_at: null, proposed_by: null, cancelled_by: null, video_room: 'abc', rating: null, review: null, created_at: iso(-100),
  mentor: { id: mentor.id, full_name: mentor.name, headline: 'Designer', profiles: { avatar_url: null } },
  student: { id: student.id, full_name: student.name, avatar_url: null, university: 'LAU', bio: 'Learning design' },
  ...extra,
});
const { student, student2, mentor, mentor2, applicant, rejected } = USERS;

export const fixtures = {
  platform_settings: [{ id: 1, platform_name: 'M3allim', support_email: 'hello@m3allim.com', student_signups_open: true, mentor_applications_open: true, session_length_min: 45, max_pending_requests: 3, min_notice_hours: 12, maintenance_mode: false, maintenance_message: 'Back soon', updated_at: iso(-5) }],
  profiles: Object.values(USERS).map((u) => ({ id: u.id, full_name: u.name, avatar_url: null, role: u.role })),
  mentors: [mentorRow(mentor), mentorRow(mentor2, { field: 'Engineering', headline: 'Engineer', languages: 'French' })],
  mentor_stats: [{ mentor_id: mentor.id, rating: 4.5, reviews: 2, sessions: 3 }],
  mentor_reviews: [{ mentor_id: mentor.id, rating: 5, review: 'Great', starts_at: iso(-200) }, { mentor_id: mentor.id, rating: 4, review: null, starts_at: iso(-300) }],
  mentor_availability: [{ mentor_id: mentor.id, weekday: 1, start_time: '17:00:00', end_time: '20:00:00' }, { mentor_id: mentor.id, weekday: 3, start_time: '10:00:00', end_time: '12:00:00' }, { mentor_id: mentor.id, weekday: 5, start_time: '09:00:00', end_time: '18:00:00' }, { mentor_id: mentor.id, weekday: 6, start_time: '09:00:00', end_time: '18:00:00' }],
  mentor_busy: [{ mentor_id: mentor.id, starts_at: iso(30), duration_min: 45 }],
  sessions: [
    session(1, student, mentor, 30, 'Accepted'),
    session(2, student, mentor, 60, 'Pending'),
    session(3, student, mentor, -72, 'Accepted'),
    session(4, student, mentor, -150, 'Accepted', { rating: 5, review: 'Great' }),
    session(5, student, mentor, 80, 'Accepted', { proposed_starts_at: iso(90), proposed_by: 'mentor' }),
    session(6, student2, mentor, 50, 'Accepted', { proposed_starts_at: iso(100), proposed_by: 'student' }),
    session(7, student, mentor2, 40, 'Cancelled', { cancelled_by: 'admin' }),
    session(8, student, mentor, 0.05, 'Accepted'),
    session(9, student, mentor, 20, 'Declined', { mentor: null }),
  ],
  messages: [
    { id: 1, sender_id: student.id, recipient_id: mentor.id, body: 'Hi!', read_at: null, created_at: iso(-3) },
    { id: 2, sender_id: mentor.id, recipient_id: student.id, body: 'Hello', read_at: null, created_at: iso(-2) },
    { id: 3, sender_id: USERS.admin.id, recipient_id: student.id, body: 'From the team', read_at: null, created_at: iso(-1) },
  ],
  notifications: [
    { id: 1, user_id: 'any', kind: 'session', title: 'Session confirmed', body: 'Maya accepted', link: '/student/sessions', read_at: null, created_at: iso(-1) },
    { id: 2, user_id: 'any', kind: 'announcement', title: 'Welcome', body: 'Hello all', link: '/notifications', read_at: iso(-1), created_at: iso(-20) },
  ],
  favorites: [{ student_id: student.id, mentor_id: mentor.id }],
  mentor_applications: [
    { id: 1, user_id: applicant.id, full_name: applicant.name, email: applicant.email, alt_email: null, phone: '+961', city: 'Beirut', field: 'Design', headline: 'Designer', experience_years: 5, education: 'BA', languages: 'Arabic', linkedin: 'linkedin.com/in/x', id_type: 'Passport', id_document_path: 'u-app/1-id-pass.jpg', cv_path: 'u-app/1-cv-cv.pdf', cover_letter_path: 'u-app/1-cover-letter-cl.pdf', status: 'Pending', admin_note: null, created_at: iso(-5), profiles: { avatar_url: null } },
    { id: 2, user_id: rejected.id, full_name: rejected.name, email: rejected.email, alt_email: null, phone: '+961', city: null, field: 'Data', headline: 'Analyst', experience_years: null, education: null, languages: null, linkedin: null, id_type: null, id_document_path: null, cv_path: 'u-rej/cv.pdf', cover_letter_path: 'u-rej/cl.pdf', status: 'Rejected', admin_note: 'Add LinkedIn', created_at: iso(-50), profiles: { avatar_url: null } },
  ],
  reports: [{ id: 1, reporter_id: student.id, reported_id: mentor.id, session_id: 3, reason: 'Didn’t show up', details: 'Waited', status: 'Open', admin_note: null, created_at: iso(-4), reporter: { id: student.id, full_name: student.name, avatar_url: null, role: 'student' }, reported: { id: mentor.id, full_name: mentor.name, avatar_url: null, role: 'mentor', banned_at: null, banned_until: null } }],
  support_tickets: [{ id: 1, user_id: student.id, subject: 'Help me', category: 'Account', status: 'Open', created_at: iso(-6), updated_at: iso(-2), user: { id: student.id, full_name: student.name, avatar_url: null, role: 'student' } }],
  support_messages: [{ id: 1, ticket_id: 1, sender_id: student.id, body: 'Please help', created_at: iso(-6), sender: { id: student.id, full_name: student.name, avatar_url: null } }, { id: 2, ticket_id: 1, sender_id: USERS.admin.id, body: 'On it', created_at: iso(-2), sender: { id: USERS.admin.id, full_name: 'Rana Admin', avatar_url: null } }],
  announcements: [{ id: 1, title: 'Hello', body: 'Welcome all', audience: 'Everyone', sent_by: USERS.admin.id, recipients: 9, created_at: iso(-30), sender: { full_name: 'Rana Admin' } }],
  audit_log: [{ id: 1, actor_id: USERS.admin.id, actor_name: 'Rana Admin', actor_email: 'admin@test.com', action: 'Approved mentor application', target: 'Maya Mentor', details: { note: 'ok' }, created_at: iso(-10) }],
};

let current = null;
export const setUser = (u) => { current = u; };
export const setSetting = (k, v) => { fixtures.platform_settings[0][k] = v; };
export const calls = [];

const rpcs = {
  whoami: () => current && ({ id: current.id, email: current.email, full_name: current.name, avatar_url: null, role: current.role, university: 'LAU', field: 'Design', bio: null, is_super_admin: !!current.is_super_admin, is_admin: !!current.is_admin, is_mentor: !!current.is_mentor, application_status: current.application_status ?? null, banned: !!current.banned, ban_reason: current.ban_reason ?? null, banned_until: current.banned_until ?? null }),
  staff_among: ({ ids }) => ids.filter((id) => id === USERS.admin.id || id === USERS.super.id),
  admin_stats: () => ({ students: 3, mentors: 2, pending_applications: 1, open_reports: 1, open_tickets: 1, banned: 1, new_users_7d: 2, pending_requests: 1, upcoming_sessions: 3, completed_sessions: 2, weekly: Array.from({ length: 8 }, (_, i) => ({ week: `Wk ${i}`, sessions: i })) }),
  admin_list_users: () => Object.values(USERS).map((u) => ({ id: u.id, full_name: u.name, email: u.email, avatar_url: null, account: u.is_admin ? 'admin' : u.is_mentor ? 'mentor' : u.role === 'mentor' ? 'applicant' : u.role || 'new', created_at: iso(-400), last_sign_in_at: iso(-3), banned: !!u.banned, banned_until: u.banned_until ?? null, ban_reason: u.ban_reason ?? null, sessions: 2, reports: u.id === mentor.id ? 1 : 0 })),
  list_admins: () => [{ email: 'owner@test.com', full_name: 'Omar Owner', avatar_url: null, role: 'Super admin', status: 'Active', has_account: true, last_sign_in_at: iso(-1), added_at: null }, { email: 'admin@test.com', full_name: 'Rana Admin', avatar_url: null, role: 'Admin', status: 'Active', has_account: true, last_sign_in_at: iso(-2), added_at: iso(-90) }, { email: 'later@test.com', full_name: null, avatar_url: null, role: 'Admin', status: 'Active', has_account: false, last_sign_in_at: null, added_at: iso(-1) }],
  system_health: () => ({ checked_at: iso(0), postgres_version: '15.8', database_bytes: 12345678, connections: 7, tables: [{ name: 'Profiles', rows: 10 }, { name: 'Sessions', rows: 9 }], storage: [{ bucket: 'avatars', public: true, files: 3, bytes: 3000 }, { bucket: 'mentor-docs', public: false, files: 6, bytes: 900000 }], accounts: { total: 10, verified: 9, active_7d: 5, banned: 1 } }),
  open_support_ticket: () => 2,
  admin_set_ban: () => null,
};

function builder(table) {
  const st = { table, filters: [], one: false, op: 'select', payload: null, head: false };
  const b = {
    select(_c, opts) { if (opts?.head) st.head = true; return b; },
    insert(p) { st.op = 'insert'; st.payload = p; return b; },
    update(p) { st.op = 'update'; st.payload = p; return b; },
    delete() { st.op = 'delete'; return b; },
    eq(k, v) { st.filters.push([k, v]); return b; },
    in() { return b; }, is() { return b; }, or() { return b; }, order() { return b; }, limit() { return b; }, neq() { return b; }, gt() { return b; },
    single() { st.one = true; return b; },
    maybeSingle() { st.one = true; return b; },
    then(res, rej) { return Promise.resolve().then(() => run(st)).then(res, rej); },
  };
  return b;
}
function run(st) {
  calls.push(`${st.op} ${st.table}`);
  if (st.head) return { count: 1, data: null, error: null };
  if (!(st.table in fixtures)) return { data: null, error: { message: `unknown table ${st.table}` } };
  let rows = fixtures[st.table];
  for (const [k, v] of st.filters) rows = rows.filter((r) => !(k in r) || String(r[k]) === String(v));
  if (st.op !== 'select') {
    const row = { ...(rows[0] || {}), ...(Array.isArray(st.payload) ? st.payload[0] : st.payload || {}) };
    return { data: st.one ? row : [row], error: null };
  }
  return { data: st.one ? rows[0] ?? null : rows, error: null };
}

const channel = { on() { return channel; }, subscribe(cb) { cb?.('SUBSCRIBED'); return channel; } };

export const supabaseUrl = 'https://fake.supabase.co';
export const supabaseKey = 'fake';
export const hasBackend = true;
export const supabase = {
  from: builder,
  rpc: (name, args) => Promise.resolve(rpcs[name] ? { data: rpcs[name](args || {}), error: null } : { data: null, error: { message: `unknown rpc ${name}` } }),
  channel: () => channel,
  removeChannel: () => {},
  storage: { from: () => ({ list: async () => ({ data: [], error: null }), upload: async () => ({ error: null }), remove: async () => ({}), getPublicUrl: () => ({ data: { publicUrl: '' } }), createSignedUrl: async () => ({ data: { signedUrl: 'x' } }) }) },
  auth: {
    getSession: async () => ({ data: { session: current ? { user: { id: current.id, email: current.email, user_metadata: { full_name: current.name }, app_metadata: { provider: 'email' } } } : null } }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
    signOut: async () => ({}),
    signInWithPassword: async () => ({ error: { code: 'invalid_credentials' } }),
  },
};
export function must({ data, error }) { if (error) throw error; return data; }
export function listen() { return () => {}; }
