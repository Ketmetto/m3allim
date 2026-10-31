// The signed-in person's name and photo, shown in the navigation and on /account.
// Google accounts get their Google picture automatically (database trigger); anyone can upload their own.
import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';
import { useSession } from './session.js';

const BUCKET = 'avatars';
const CHANGED = 'm3allim:profile-changed';
const PENDING_PHOTO = 'm3allim.pendingPhoto';

/* Current profile: undefined while loading, null when signed out. Without a backend returns `demo`. */
export function useProfile(demo = null) {
  const session = useSession();
  const [profile, setProfile] = useState();
  useEffect(() => {
    if (!session) return;
    const { user } = session;
    const load = async () => {
      const { data } = await supabase.from('profiles').select('full_name, avatar_url, role, university, field, bio').eq('id', user.id).maybeSingle();
      const meta = user.user_metadata || {};
      setProfile({
        name: data?.full_name || meta.full_name || meta.name || user.email.split('@')[0],
        avatar: data?.avatar_url || null,
        role: data?.role,
        university: data?.university,
        field: data?.field,
        bio: data?.bio,
        email: user.email,
        user,
      });
    };
    load();
    window.addEventListener(CHANGED, load);
    return () => window.removeEventListener(CHANGED, load);
  }, [session]);
  if (!supabase) return demo;
  return session ? profile : session;
}

export async function updateProfile(user, fields) {
  const { error } = await supabase.from('profiles').update(fields).eq('id', user.id);
  if (error) throw error;
  window.dispatchEvent(new Event(CHANGED));
}

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

async function ownFiles(user) {
  const { data } = await supabase.storage.from(BUCKET).list(user.id);
  return (data || []).map((f) => `${user.id}/${f.name}`);
}

export async function setPhoto(user, dataUrl) {
  const blob = await (await fetch(dataUrl)).blob();
  // A new file name each time, so browsers don't keep showing the old photo.
  const path = `${user.id}/${Date.now()}.jpg`;
  const { error } = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: 'image/jpeg' });
  if (error) throw error;
  const old = (await ownFiles(user)).filter((p) => p !== path);
  await updateProfile(user, { avatar_url: supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl });
  if (old.length) await supabase.storage.from(BUCKET).remove(old);
}

export async function removePhoto(user) {
  const old = await ownFiles(user);
  await updateProfile(user, { avatar_url: null });
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
    await setPhoto(user, pending.dataUrl);
  } catch {
    // Never block sign-in over a photo; it can be added again on /account.
  }
}
