// Accounts: sign up, log in (email or Google), password reset, and "who is this person?".
import { supabase, supabaseKey, supabaseUrl, must } from './supabase.js';
import { applyPendingPhoto } from './profiles.js';
import { roleFrom } from '../config/roles.js';

const PENDING_ROLE = 'm3allim.pendingRole';

// Google and email links come back to the site root; the app then routes the person.
const returnUrl = (next) => `${window.location.origin}${window.location.pathname}${next ? `?next=${next}` : ''}`;

export const signInWithEmail = (email, password) => supabase.auth.signInWithPassword({ email, password });

export async function signInWithGoogle(role) {
  // If Google isn't switched on in Supabase, the redirect lands on a raw JSON error page, so check first.
  const settings = await fetch(`${supabaseUrl}/auth/v1/settings`, { headers: { apikey: supabaseKey } })
    .then((res) => res.json())
    .catch(() => null);
  if (settings && !settings.external?.google) {
    return { error: { message: 'Google sign-in isn’t available yet. Please use your email for now.' } };
  }
  // Remember the account type picked on the sign-up page until Google sends the person back.
  try {
    if (role) localStorage.setItem(PENDING_ROLE, role);
  } catch {}
  return supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: returnUrl(), queryParams: { prompt: 'select_account' } },
  });
}

export const signUpWithEmail = ({ email, password, ...profile }) =>
  supabase.auth.signUp({ email, password, options: { data: profile, emailRedirectTo: returnUrl() } });

export const resendVerification = (email) =>
  supabase.auth.resend({ type: 'signup', email, options: { emailRedirectTo: returnUrl() } });

export const sendPasswordReset = (email) => supabase.auth.resetPasswordForEmail(email, { redirectTo: returnUrl('reset') });
export const updatePassword = (password) => supabase.auth.updateUser({ password });
export const signOut = () => supabase.auth.signOut();

/* Saves the account type picked on the Welcome page (first Google sign-in). */
export const chooseAccountType = (userId, role) => supabase.from('profiles').update({ role }).eq('id', userId).then(must);

function takePendingRole() {
  try {
    const role = localStorage.getItem(PENDING_ROLE);
    localStorage.removeItem(PENDING_ROLE);
    return role;
  } catch {
    return null;
  }
}

/**
 * Everything the website needs to know about the signed-in person, from the database's whoami() function.
 * Also finishes first-sign-in steps: the photo chosen on the sign-up form and the account type picked before Google.
 */
export async function loadAccount(user) {
  await applyPendingPhoto(user);
  let me = must(await supabase.rpc('whoami'));
  const pending = takePendingRole();
  if (!me.role && pending && !me.is_admin) {
    await chooseAccountType(user.id, pending);
    me = { ...me, role: pending };
  }
  const meta = user.user_metadata || {};
  return {
    id: user.id,
    email: user.email,
    provider: user.app_metadata?.provider,
    name: me.full_name || meta.full_name || meta.name || user.email.split('@')[0],
    avatar: me.avatar_url,
    accountType: me.role, // 'student' | 'mentor' | null, picked at sign-up
    university: me.university,
    field: me.field,
    bio: me.bio,
    role: roleFrom(me),
    applicationStatus: me.application_status,
    ban: me.banned ? { reason: me.ban_reason, until: me.banned_until } : null,
  };
}
