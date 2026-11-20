// The mentor directory, public profiles, reviews and saved (favorite) mentors.
import { supabase, must } from './supabase.js';
import { splitList } from '../utils/format.js';

// Mentors link to profiles directly and through favorites/sessions, so embeds name the exact foreign key.
const MENTOR_FIELDS = '*, profiles!mentors_id_fkey(avatar_url)';

/* One shape for mentors everywhere in the website. */
function toMentor(row, stats = {}) {
  return {
    id: row.id,
    name: row.full_name,
    headline: row.headline,
    field: row.field,
    photo: row.profiles?.avatar_url || null,
    bio: row.bio,
    languages: splitList(row.languages),
    topics: splitList(row.topics),
    availabilityNote: row.availability,
    linkedin: row.linkedin,
    experienceYears: row.experience_years,
    rating: Number(stats.rating) || 0,
    reviews: stats.reviews || 0,
    sessions: stats.sessions || 0,
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

export const getMentorStats = (id) => supabase.from('mentor_stats').select('*').eq('mentor_id', id).maybeSingle().then(must);

/* Public reviews (no names). */
export const getMentorReviews = (id, limit = 50) =>
  supabase.from('mentor_reviews').select('*').eq('mentor_id', id).order('starts_at', { ascending: false }).limit(limit).then(must);

/* The signed-in mentor's editable profile. */
export const getMyMentorProfile = (userId) => supabase.from('mentors').select('*').eq('id', userId).maybeSingle().then(must);
export const updateMyMentorProfile = (userId, fields) => supabase.from('mentors').update(fields).eq('id', userId).then(must);

/* ---------- Saved mentors (students) ---------- */
export const listFavoriteIds = () => supabase.from('favorites').select('mentor_id').then(must).then((rows) => rows.map((f) => f.mentor_id));
export const saveMentor = (studentId, mentorId) => supabase.from('favorites').insert({ student_id: studentId, mentor_id: mentorId }).then(must);
export const unsaveMentor = (studentId, mentorId) => supabase.from('favorites').delete().eq('student_id', studentId).eq('mentor_id', mentorId).then(must);
