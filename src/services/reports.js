// Reports: students report mentors and mentors report students; admins review them.
// The reported person never sees who reported them.
import { supabase, must } from './supabase.js';

export const reportUser = (reporterId, { reportedId, sessionId, reason, details }) =>
  supabase.from('reports').insert({ reporter_id: reporterId, reported_id: reportedId, session_id: sessionId || null, reason, details: details || null }).then(must);

/* ---------- Admins ---------- */
export const listReports = () =>
  supabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(id, full_name, avatar_url, role), reported:profiles!reports_reported_id_fkey(id, full_name, avatar_url, role, banned_at, banned_until)')
    .order('created_at', { ascending: false })
    .then(must);

export const decideReport = (id, status, note) => supabase.from('reports').update({ status, admin_note: note || null }).eq('id', id).then(must);

export const countOpenReports = () =>
  supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'Open').then(({ count }) => count || 0);
