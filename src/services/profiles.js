// Profiles: name, photo and details. Google accounts get their Google picture automatically (database trigger).
import { supabase, must } from './supabase.js';

const BUCKET = 'avatars';
const PENDING_PHOTO = 'm3allim.pendingPhoto';

export const updateProfile = (userId, fields) => supabase.from('profiles').update(fields).eq('id', userId).then(must);

/* Crops a photo to a centered square and shrinks it, so uploads are small. Returns a JPEG data URL. */
export async function squarePhoto(file, size = 400) {
  let img;
  try {
    img = await createImageBitmap(file);
  } catch {
    throw new Error('Couldn’t read that image. Try a JPG or PNG.');
  }
  const side = Math.min(img.width, img.height);
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = size;
  canvas.getContext('2d').drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
  return canvas.toDataURL('image/jpeg', 0.85);
}

async function ownFiles(userId) {
  const { data } = await supabase.storage.from(BUCKET).list(userId);
  return (data || []).map((f) => `${userId}/${f.name}`);
}

export async function setPhoto(userId, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  // A new file name each time, so browsers don't keep showing the old photo.
  const path = `${userId}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  const old = (await ownFiles(userId)).filter((p) => p !== path);
  await updateProfile(userId, { avatar_url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
  if (old.length) await supabase.storage.from(BUCKET).remove(old);
}

export async function removePhoto(userId) {
  const old = await ownFiles(userId);
  await updateProfile(userId, { avatar_url: null });
  if (old.length) await supabase.storage.from(BUCKET).remove(old);
}

/* Email sign-ups can't upload until they verify, so the photo waits in this browser until their first sign-in. */
export function savePendingPhoto(email, dataUrl) {
  try {
    localStorage.setItem(PENDING_PHOTO, JSON.stringify({ email: email.toLowerCase(), dataUrl }));
  } catch {}
}

export async function applyPendingPhoto(user) {
  try {
    const pending = JSON.parse(localStorage.getItem(PENDING_PHOTO));
    if (pending?.email?.toLowerCase() !== user.email.toLowerCase()) return;
    localStorage.removeItem(PENDING_PHOTO);
    await setPhoto(user.id, pending.dataUrl);
  } catch {
    // Never block sign-in over a photo; it can be added again on /account.
  }
}

/* Names, photos and kind (mentor / admin / student) for people you have a session or chat with. */
export async function loadPeople(ids) {
  if (!ids.length) return {};
  const [rows, mentors, staff] = await Promise.all([
    supabase.from('profiles').select('id, full_name, avatar_url').in('id', ids).then(must),
    supabase.from('mentors').select('id').in('id', ids).then(must),
    supabase.rpc('staff_among', { ids }).then(must),
  ]);
  const mentorIds = new Set(mentors.map((m) => m.id));
  const staffIds = new Set((staff || []).map((s) => (typeof s === 'string' ? s : s.staff_among)));
  return Object.fromEntries(rows.map((p) => [p.id, {
    id: p.id,
    name: staffIds.has(p.id) ? `${p.full_name || 'Admin'}` : p.full_name || 'M3allim member',
    photo: p.avatar_url,
    kind: staffIds.has(p.id) ? 'admin' : mentorIds.has(p.id) ? 'mentor' : 'student',
  }]));
}
