// Mentor applications: identity document (ID or passport), CV, cover letter and details.
// Files go to the private `mentor-docs` bucket; only the applicant and admins can open them.
import { supabase, must } from './supabase.js';
import { timeAgo } from '../utils/time.js';

const BUCKET = 'mentor-docs';
const fileName = (path) => path?.split('/').pop().replace(/^\d+-[a-z-]+-/, '') || '';

/* One shape for applications everywhere in the website. */
const toApplication = (r) => ({
  id: r.id,
  userId: r.user_id,
  name: r.full_name,
  avatar: r.profiles?.avatar_url,
  email: r.email,
  altEmail: r.alt_email,
  phone: r.phone,
  city: r.city,
  headline: r.headline,
  field: r.field,
  experienceYears: r.experience_years,
  education: r.education,
  languages: r.languages,
  linkedin: r.linkedin,
  idType: r.id_type,
  submitted: timeAgo(r.created_at),
  submittedAt: r.created_at,
  status: r.status,
  note: r.admin_note,
  paths: { id: r.id_document_path, cv: r.cv_path, cover: r.cover_letter_path },
  docs: [
    { key: 'id', title: r.id_type || 'Identity document', file: fileName(r.id_document_path), path: r.id_document_path },
    { key: 'cv', title: 'CV', file: fileName(r.cv_path), path: r.cv_path },
    { key: 'cover', title: 'Cover letter', file: fileName(r.cover_letter_path), path: r.cover_letter_path },
  ],
});

async function upload(userId, file, kind) {
  const safe = file.name.replace(/[^\w.-]+/g, '_');
  const path = `${userId}/${Date.now()}-${kind}-${safe}`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type });
  if (error) throw error;
  return path;
}

/* Uploads whichever files were chosen; keeps the existing path for the others. */
async function uploadDocs(userId, files, existing = {}) {
  const [id, cv, cover] = await Promise.all([
    files.id ? upload(userId, files.id, 'id') : existing.id,
    files.cv ? upload(userId, files.cv, 'cv') : existing.cv,
    files.cover ? upload(userId, files.cover, 'cover-letter') : existing.cover,
  ]);
  return { id_document_path: id, cv_path: cv, cover_letter_path: cover };
}

const toRow = (d) => ({
  full_name: d.name,
  alt_email: d.altEmail || null,
  phone: d.phone,
  city: d.city || null,
  field: d.field,
  headline: d.headline,
  experience_years: d.experience ? Number(d.experience) : null,
  education: d.education || null,
  languages: d.languages || null,
  linkedin: d.linkedin || null,
  id_type: d.idType,
});

/* details: form fields; files: { id, cv, cover } (File objects) */
export async function submitApplication(user, details, files) {
  const docs = await uploadDocs(user.id, files);
  await supabase.from('mentor_applications').insert({ user_id: user.id, email: user.email, ...toRow(details), ...docs }).then(must);
}

/* After a decline: update the details, replace any documents, and send it for review again. */
export async function resubmitApplication(user, application, details, files) {
  const docs = await uploadDocs(user.id, files, application.paths);
  await supabase.from('mentor_applications').update({ ...toRow(details), ...docs, status: 'Pending' }).eq('id', application.id).then(must);
}

export async function myApplication(userId) {
  const row = await supabase.from('mentor_applications').select('*').eq('user_id', userId).maybeSingle().then(must);
  return row && toApplication(row);
}

/* ---------- Admins ---------- */
export async function listApplications() {
  const rows = await supabase.from('mentor_applications').select('*, profiles(avatar_url)').order('created_at', { ascending: false }).then(must);
  return rows.map(toApplication);
}

export const decideApplication = (id, status, note) =>
  supabase.from('mentor_applications').update({ status, admin_note: note || null }).eq('id', id).then(must);

/* Short-lived link (10 minutes) to a private document. */
export async function documentUrl(path) {
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 600);
  if (error) throw error;
  return data.signedUrl;
}

export const countPendingApplications = () =>
  supabase.from('mentor_applications').select('id', { count: 'exact', head: true }).eq('status', 'Pending').then(({ count }) => count || 0);
