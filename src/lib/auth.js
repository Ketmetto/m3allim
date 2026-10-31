// Sign-in helpers shared by the auth pages, the redirect handler and the route guards.
import { supabase, supabaseKey, supabaseUrl } from './supabase.js';
import { superAdmin } from '../data/mock.js';
import { applyPendingPhoto } from './profile.js';

export { useSession } from './session.js';

const PENDING_ROLE = 'm3allim.pendingRole';

// Google and email links come back to the site root; the app then routes the person.
const returnUrl = (next) => `${window.location.origin}${window.location.pathname}${next ? `?next=${next}` : ''}`;

export const isSuperAdminEmail = (email) => email?.toLowerCase() === superAdmin.email;

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

function takePendingRole() {
  try {
    const role = localStorage.getItem(PENDING_ROLE);
    localStorage.removeItem(PENDING_ROLE);
    return role;
  } catch {
    return null;
  }
}

// Where a signed-in person should land.
export async function destinationFor(user) {
  await applyPendingPhoto(user);
  if (isSuperAdminEmail(user.email)) return '/super';
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).maybeSingle();
  let role = profile?.role;
  const pending = takePendingRole();
  if (!role && pending) {
    await supabase.from('profiles').update({ role: pending }).eq('id', user.id);
    role = pending;
  }
  if (!role) return '/welcome';
  if (role === 'student') return '/student';
  const { data: mentor } = await supabase.from('mentors').select('id').eq('id', user.id).maybeSingle();
  if (mentor) return '/mentor';
  const { data: application } = await supabase.from('mentor_applications').select('id').eq('user_id', user.id).maybeSingle();
  return application ? '/mentor/status' : '/mentor/apply';
}
