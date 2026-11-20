// Handles people coming back to the site from Google, or from an email link (verify email / reset password).
// Google and Supabase's default emails add ?code=…; the M3allim email templates add ?token_hash=…&type=… (supabase/templates).
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase.js';

export function AuthRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!supabase) return;
    const params = new URLSearchParams(window.location.search);
    const tokenHash = params.get('token_hash');
    const type = params.get('type');
    const isReset = type === 'recovery' || params.get('next') === 'reset';
    if (!params.has('code') && !params.has('error') && !tokenHash) return;
    window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    if (params.has('error')) {
      navigate('/login', { state: { error: params.get('error_description') || 'Sign-in was cancelled.' } });
      return;
    }
    (async () => {
      if (tokenHash) {
        // Email links carry a one-time token, so they work in any browser or device.
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        if (error) {
          const expired = isReset ? 'That reset link has expired or was already used. Request a new one below.' : 'That verification link has expired or was already used. Log in to get a new one.';
          return navigate('/login', { state: { error: expired } });
        }
      } else {
        // supabase-js exchanges the ?code on load; wait for that. It only works in the browser that started
        // the sign-in, which is why the email templates use token links instead.
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const error = isReset ? 'Open the reset link in the same browser where you asked for it, or request a new one below.' : 'Sign-in didn’t finish. Please try again in the same browser.';
          return navigate('/login', { state: { error } });
        }
      }
      navigate(isReset ? '/reset-password' : '/continue', { replace: true });
    })();
  }, [navigate]);
  return null;
}
