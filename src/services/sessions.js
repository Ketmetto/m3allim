// Sessions: a student requests a time, the mentor accepts or declines, either side can propose a new time,
// they meet on a video call, and the student rates it afterwards. The database checks every step
// (guard_session_update in schema.sql) and notifies the other person.
import { supabase, must, listen } from './supabase.js';
import { sessionTiming } from '../utils/time.js';

const SESSION_FIELDS =
  '*, mentor:mentors!sessions_mentor_id_fkey(id, full_name, headline, profiles!mentors_id_fkey(avatar_url)), student:profiles!sessions_student_id_fkey(id, full_name, avatar_url, university, bio)';

export const requestSession = (studentId, { mentorId, topic, message, startsAt }) =>
  supabase.from('sessions').insert({ student_id: studentId, mentor_id: mentorId, topic, message: message || null, starts_at: startsAt }).select().single().then(must);

const update = (id, fields) => supabase.from('sessions').update(fields).eq('id', id).select().single().then(must);

export const sessionActions = {
  accept: (s) => update(s.id, { status: 'Accepted' }),
  decline: (s) => update(s.id, { status: 'Declined' }),
  cancel: (s, by) => update(s.id, { status: 'Cancelled', cancelled_by: by }),
  // A pending request can simply move; a confirmed session needs the other person to agree.
  reschedule: (s, by, startsAt) =>
    by === 'student' && s.status === 'Pending'
      ? update(s.id, { starts_at: startsAt, proposed_starts_at: null, proposed_by: null })
      : update(s.id, { proposed_starts_at: startsAt, proposed_by: by }),
  acceptProposal: (s) => update(s.id, { starts_at: s.proposed_starts_at, proposed_starts_at: null, proposed_by: null }),
  dropProposal: (s) => update(s.id, { proposed_starts_at: null, proposed_by: null }),
  rate: (s, rating, review) => update(s.id, { rating, review: review || null }),
};

/* Where a session stands: Pending, Confirmed, Completed, Declined or Cancelled. */
export function sessionState(s) {
  if (s.status === 'Accepted') return sessionTiming(s).ended ? 'Completed' : 'Confirmed';
  return s.status;
}

/* role: 'student' | 'mentor' */
export const listMySessions = (role, userId) =>
  supabase.from('sessions').select(SESSION_FIELDS).eq(`${role}_id`, userId).order('starts_at', { ascending: true }).then(must);

export const onMySessionsChange = (role, userId, callback) => listen('sessions', 'sessions', `${role}_id=eq.${userId}`, callback);

export const videoLink = (s) => `https://meet.jit.si/M3allim-${s.video_room}`;
