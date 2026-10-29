// Mentor applications. With Supabase configured they live in the `mentor_applications` table and the
// private `mentor-docs` bucket (see supabase/schema.sql). Without it they are saved in this browser
// so the demo still works; clear site data to reset to the mock applicants.
import { useEffect, useState } from 'react';
import { applicants } from './mock.js';
import { supabase } from '../lib/supabase.js';

const KEY = 'm3allim.applications';
const BUCKET = 'mentor-docs';
const CHANGED = 'm3allim:applications-changed';

/* ---------- Browser-only demo storage ---------- */
function loadLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(saved)) return saved;
  } catch {}
  return applicants;
}

function saveLocal(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
  } catch {}
}

/* ---------- Shape shared by both sources ---------- */
function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} hours ago`;
  const days = Math.round(mins / 1440);
  return days === 1 ? 'Yesterday' : `${days} days ago`;
}

const fileName = (path) => path.split('/').pop().replace(/^\d+-/, '');

const fromRow = (r) => ({
  id: r.id,
  name: r.full_name,
  avatar: r.profiles?.avatar_url,
  email: r.email,
  altEmail: r.alt_email,
  phone: r.phone,
  headline: r.headline,
  field: r.field,
  experience: r.experience_years != null ? `${r.experience_years} years` : 'Not provided',
  linkedin: r.linkedin || 'Not provided',
  submitted: timeAgo(r.created_at),
  status: r.status,
  note: r.admin_note,
  // [title, detail, storage path]
  docs: [['CV', fileName(r.cv_path), r.cv_path], ['Cover letter', fileName(r.cover_letter_path), r.cover_letter_path]],
});

/* ---------- API used by the pages ---------- */
export async function listApplications() {
  if (!supabase) return loadLocal();
  const { data, error } = await supabase.from('mentor_applications').select('*, profiles(avatar_url)').order('created_at', { ascending: false });
  if (error) throw error;
  return data.map(fromRow);
}

export async function decideApplication(id, status, note) {
  if (supabase) {
    const { error } = await supabase.from('mentor_applications').update({ status, admin_note: note || null, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) throw error;
  } else {
    saveLocal(loadLocal().map((a) => (a.id === id ? { ...a, status, note } : a)));
  }
  window.dispatchEvent(new Event(CHANGED));
}

// Short-lived link to a private document, for the super admin to open.
export async function documentUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}

export async function myApplication(userId) {
  const { data, error } = await supabase.from('mentor_applications').select('*').eq('user_id', userId).maybeSingle();
  if (error) throw error;
  return data && fromRow(data);
}

// details: { name, email, altEmail, phone, field, headline, experience, linkedin }
export async function submitApplication(user, details, cv, coverLetter) {
  if (!supabase) {
    const list = loadLocal();
    const id = Math.max(0, ...list.map((a) => a.id)) + 1;
    const docs = [['CV', cv.name], ['Cover letter', coverLetter.name]];
    saveLocal([{ id, ...details, experience: details.experience ? `${details.experience} years` : 'Not provided', submitted: 'Just now', status: 'Pending', docs }, ...list]);
    return;
  }
  const upload = async (file, kind) => {
    const safe = file.name.replace(/[^\w.-]+/g, '_');
    const path = `${user.id}/${Date.now()}-${kind}-${safe}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
    if (error) throw error;
    return path;
  };
  const [cvPath, coverPath] = await Promise.all([upload(cv, 'cv'), upload(coverLetter, 'cover-letter')]);
  const { error } = await supabase.from('mentor_applications').insert({
    user_id: user.id,
    full_name: details.name,
    email: user.email,
    alt_email: details.altEmail || null,
    phone: details.phone,
    field: details.field,
    headline: details.headline,
    experience_years: details.experience ? Number(details.experience) : null,
    linkedin: details.linkedin || null,
    cv_path: cvPath,
    cover_letter_path: coverPath,
  });
  if (error) throw error;
}

// Live count for the sidebar badge.
export function usePendingCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    let alive = true;
    const refresh = () => listApplications().then((list) => alive && setCount(list.filter((a) => a.status === 'Pending').length)).catch(() => {});
    refresh();
    window.addEventListener(CHANGED, refresh);
    return () => {
      alive = false;
      window.removeEventListener(CHANGED, refresh);
    };
  }, []);
  return count;
}
