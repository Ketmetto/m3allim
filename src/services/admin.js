// Admin tools: overview numbers, users and bans, announcements, the audit log and data exports.
// Every function here is protected in the database: it only works for admins (is_admin() in schema.sql).
import { supabase, must } from './supabase.js';

export const getAdminStats = () => supabase.rpc('admin_stats').then(must);

/* ---------- Users and bans ---------- */
export const listUsers = () => supabase.rpc('admin_list_users').then(must);

/* days: number of days, or null for a permanent ban */
export const banUser = (userId, reason, days) => supabase.rpc('admin_set_ban', { p_user: userId, p_ban: true, p_reason: reason, p_days: days }).then(must);
export const unbanUser = (userId) => supabase.rpc('admin_set_ban', { p_user: userId, p_ban: false }).then(must);

/* ---------- Announcements (delivered as notifications by the database) ---------- */
export const listAnnouncements = () =>
  supabase.from('announcements').select('*, sender:profiles!announcements_sent_by_fkey(full_name)').order('created_at', { ascending: false }).limit(30).then(must);

export const sendAnnouncement = (senderId, { title, body, audience }) =>
  supabase.from('announcements').insert({ title, body, audience, sent_by: senderId }).select().single().then(must);

/* ---------- Audit log ---------- */
export const listAuditLog = (limit = 500) => supabase.from('audit_log').select('*').order('created_at', { ascending: false }).limit(limit).then(must);

/* ---------- Data export (CSV) ---------- */
const flat = (rows) => rows.map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, v && typeof v === 'object' ? JSON.stringify(v) : v])));

export const EXPORTS = [
  { key: 'users', name: 'Users', file: 'm3allim-users.csv', load: () => listUsers().then(flat) },
  {
    key: 'sessions',
    name: 'Sessions',
    file: 'm3allim-sessions.csv',
    load: () => supabase.from('sessions').select('id, created_at, starts_at, duration_min, status, topic, rating, review, cancelled_by, student:profiles!sessions_student_id_fkey(full_name), mentor:mentors!sessions_mentor_id_fkey(full_name)').order('starts_at').then(must)
      .then((rows) => rows.map(({ student, mentor, ...s }) => ({ ...s, student: student?.full_name, mentor: mentor?.full_name }))),
  },
  { key: 'reports', name: 'Reports', file: 'm3allim-reports.csv', load: () => supabase.from('reports').select('*').order('created_at').then(must).then(flat) },
  { key: 'applications', name: 'Mentor applications', file: 'm3allim-applications.csv', load: () => supabase.from('mentor_applications').select('id, created_at, full_name, email, phone, city, field, headline, experience_years, education, languages, status, admin_note, reviewed_at').order('created_at').then(must) },
  { key: 'audit', name: 'Audit log', file: 'm3allim-audit-log.csv', load: () => listAuditLog(10000).then(flat) },
];
