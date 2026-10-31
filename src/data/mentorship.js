// Real mentorship data (Supabase): mentor directory, sessions, chat, favorites and reports.
// Access rules live in supabase/schema.sql; these helpers just read and write.
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase.js';
import { useSession } from '../lib/session.js';
import { sessionTiming } from '../lib/time.js';

const must = ({ data, error }) => {
  if (error) throw error;
  return data;
};
const splitList = (text) => (text ? text.split(',').map((t) => t.trim()).filter(Boolean) : []);

/* ---------- Mentors ---------- */
// Mentors link to profiles directly and through favorites/sessions, so embeds name the exact foreign key.
const MENTOR_FIELDS = '*, profiles!mentors_id_fkey(avatar_url)';
// Shape matches the sample mentors, so MentorCard works for both.
function toMentor(row, stats = {}) {
  return {
    id: row.id,
    name: row.full_name,
    headline: row.headline,
    field: row.field,
    photo: row.profiles?.avatar_url || null,
    bio: row.bio,
    languages: splitList(row.languages),
    availability: row.availability,
    experienceYears: row.experience_years,
    rating: Number(stats.rating) || 0,
    reviews: stats.reviews || 0,
    sessions: stats.sessions || 0,
    tags: [],
  };
}

export async function listMentors() {
  const [rows, stats] = await Promise.all([
    supabase.from('mentors').select(MENTOR_FIELDS).order('created_at', { ascending: false }).then(must),
    supabase.from('mentor_stats').select('*').then(must),
  ]);
  const byId = Object.fromEntries(stats.map((s) => [s.mentor_id, s]));
  return rows.map((r) => toMentor(r, byId[r.id]));
}

export async function getMentor(id) {
  const [row, stats] = await Promise.all([
    supabase.from('mentors').select(MENTOR_FIELDS).eq('id', id).maybeSingle().then(must),
    supabase.from('mentor_stats').select('*').eq('mentor_id', id).maybeSingle().then(must),
  ]);
  return row && toMentor(row, stats || {});
}

export const getMyMentorProfile = (userId) => supabase.from('mentors').select('*').eq('id', userId).maybeSingle().then(must);
export const updateMyMentorProfile = (userId, fields) => supabase.from('mentors').update(fields).eq('id', userId).then(must);

/* ---------- Favorites ---------- */
export function useFavorites() {
  const session = useSession();
  const [ids, setIds] = useState(new Set());
  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    supabase.from('favorites').select('mentor_id').then(({ data }) => setIds(new Set((data || []).map((f) => f.mentor_id))));
  }, [userId]);
  const toggle = useCallback(async (mentorId) => {
    const saved = ids.has(mentorId);
    setIds((prev) => { const next = new Set(prev); saved ? next.delete(mentorId) : next.add(mentorId); return next; });
    const res = saved
      ? await supabase.from('favorites').delete().eq('student_id', userId).eq('mentor_id', mentorId)
      : await supabase.from('favorites').insert({ student_id: userId, mentor_id: mentorId });
    if (res.error) setIds((prev) => { const next = new Set(prev); saved ? next.add(mentorId) : next.delete(mentorId); return next; });
  }, [ids, userId]);
  return { ids, toggle, signedIn: Boolean(userId) };
}

/* ---------- Sessions ---------- */
const SESSION_FIELDS = '*, mentor:mentors!sessions_mentor_id_fkey(id, full_name, headline, profiles!mentors_id_fkey(avatar_url)), student:profiles!sessions_student_id_fkey(id, full_name, avatar_url, university, bio)';

export const requestSession = (studentId, { mentorId, topic, message, startsAt }) =>
  supabase.from('sessions').insert({ student_id: studentId, mentor_id: mentorId, topic, message: message || null, starts_at: startsAt }).select().single().then(must);

const update = (id, fields) => supabase.from('sessions').update(fields).eq('id', id).select().single().then(must);

export const sessionActions = {
  accept: (s) => update(s.id, { status: 'Accepted' }),
  decline: (s) => update(s.id, { status: 'Declined' }),
  cancel: (s, by) => update(s.id, { status: 'Cancelled', cancelled_by: by }),
  // A pending request can simply move; an accepted session needs the other person to agree.
  reschedule: (s, by, startsAt) =>
    by === 'student' && s.status === 'Pending'
      ? update(s.id, { starts_at: startsAt, proposed_starts_at: null, proposed_by: null })
      : update(s.id, { proposed_starts_at: startsAt, proposed_by: by }),
  acceptProposal: (s) => update(s.id, { starts_at: s.proposed_starts_at, proposed_starts_at: null, proposed_by: null }),
  dropProposal: (s) => update(s.id, { proposed_starts_at: null, proposed_by: null }),
  rate: (s, rating, review) => update(s.id, { rating, review: review || null }),
};

/* Where a session stands, for labels and tabs. */
export function sessionState(s) {
  if (s.status === 'Accepted') return sessionTiming(s).ended ? 'Completed' : 'Confirmed';
  return s.status; // Pending, Declined, Cancelled
}

/* The signed-in person's sessions as `role` ('student' | 'mentor'), kept up to date live. */
export function useMySessions(role) {
  const session = useSession();
  const userId = session?.user.id;
  const [sessions, setSessions] = useState();
  const [error, setError] = useState('');
  const reload = useCallback(async () => {
    if (!userId) return;
    const { data, error: err } = await supabase.from('sessions').select(SESSION_FIELDS).eq(`${role}_id`, userId).order('starts_at', { ascending: true });
    if (err) setError(err.message);
    else setSessions(data);
  }, [role, userId]);
  useEffect(() => {
    if (!userId) return;
    reload();
    const channel = supabase
      .channel(`sessions-${role}-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'sessions', filter: `${role}_id=eq.${userId}` }, reload)
      .subscribe();
    return () => supabase.removeChannel(channel);
  }, [role, userId, reload]);
  return { sessions, error, reload, userId };
}

export const videoLink = (s) => `https://meet.jit.si/M3allim-${s.video_room}`;

/* ---------- Chat ---------- */
export const sendMessage = (senderId, recipientId, body) =>
  supabase.from('messages').insert({ sender_id: senderId, recipient_id: recipientId, body }).select().single().then(must);

// Supabase queries only run once awaited or then()-ed, so this returns a real promise.
export const markRead = (userId, otherId) =>
  supabase.from('messages').update({ read_at: new Date().toISOString() }).eq('recipient_id', userId).eq('sender_id', otherId).is('read_at', null).then(must);

/* All of the signed-in person's messages, live. */
export function useMessages() {
  const session = useSession();
  const userId = session?.user.id;
  const [messages, setMessages] = useState();
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    supabase.from('messages').select('*').or(`sender_id.eq.${userId},recipient_id.eq.${userId}`).order('created_at').then(({ data }) => alive && setMessages(data || []));
    const upsert = ({ new: m }) => setMessages((all) => (all ? [...all.filter((x) => x.id !== m.id), m].sort((a, b) => a.created_at.localeCompare(b.created_at)) : all));
    const channel = supabase
      .channel(`messages-${userId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `recipient_id=eq.${userId}` }, upsert)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `sender_id=eq.${userId}` }, upsert)
      .subscribe();
    return () => { alive = false; supabase.removeChannel(channel); };
  }, [userId]);
  const add = (m) => setMessages((all) => [...(all || []).filter((x) => x.id !== m.id), m]);
  return { messages, userId, add };
}

/* Names and photos for people you have a session or chat with (allowed by the profile rules). */
export async function loadPeople(ids) {
  if (!ids.length) return {};
  const rows = await supabase.from('profiles').select('id, full_name, avatar_url, role').in('id', ids).then(must);
  const mentors = await supabase.from('mentors').select('id').in('id', ids).then(must);
  const mentorIds = new Set(mentors.map((m) => m.id));
  return Object.fromEntries(rows.map((p) => [p.id, { id: p.id, name: p.full_name || 'M3allim member', photo: p.avatar_url, isMentor: mentorIds.has(p.id) }]));
}

/* ---------- Reports ---------- */
export const REPORT_REASONS = ['Inappropriate behaviour', 'Harassment', 'Spam or scam', 'Didn’t show up', 'Fake profile', 'Other'];

export const reportUser = (reporterId, { reportedId, sessionId, reason, details }) =>
  supabase.from('reports').insert({ reporter_id: reporterId, reported_id: reportedId, session_id: sessionId || null, reason, details: details || null }).then(must);

export const listReports = () =>
  supabase
    .from('reports')
    .select('*, reporter:profiles!reports_reporter_id_fkey(id, full_name, avatar_url), reported:profiles!reports_reported_id_fkey(id, full_name, avatar_url, role)')
    .order('created_at', { ascending: false })
    .then(must);

export const decideReport = (id, status, note) =>
  supabase.from('reports').update({ status, admin_note: note || null, reviewed_at: new Date().toISOString() }).eq('id', id).then(must);

export function useOpenReportsCount(enabled) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!enabled || !supabase) return;
    supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'Open').then(({ count: c }) => setCount(c || 0));
  }, [enabled]);
  return count;
}
