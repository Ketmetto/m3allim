// Mentors' weekly hours (Beirut time) and their confirmed sessions, for the booking calendar.
import { supabase, must } from './supabase.js';

export const getAvailability = (mentorId) =>
  supabase.from('mentor_availability').select('weekday, start_time, end_time').eq('mentor_id', mentorId).order('weekday').order('start_time').then(must);

/* Replaces all of a mentor's weekly hours. rows: [{ weekday, start_time: '17:00', end_time: '20:00' }] */
export async function saveAvailability(mentorId, rows) {
  await supabase.from('mentor_availability').delete().eq('mentor_id', mentorId).then(must);
  if (rows.length) await supabase.from('mentor_availability').insert(rows.map((r) => ({ ...r, mentor_id: mentorId }))).then(must);
}

/* When the mentor is already booked (never with whom). Signed-in users only. */
export const getBusyTimes = (mentorId) => supabase.from('mentor_busy').select('starts_at, duration_min').eq('mentor_id', mentorId).then(must);
