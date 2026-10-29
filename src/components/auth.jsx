import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase.js';
import { destinationFor, isSuperAdminEmail, useSession } from '../lib/auth.js';
import { Icon } from './ui.jsx';

/* Handles people coming back from Google or from an email link (?code=… on the site root). */
export function AuthRedirect() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!supabase) return;
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') && !params.has('error')) return;
    const clean = () => window.history.replaceState(null, '', `${window.location.pathname}${window.location.hash}`);
    if (params.has('error')) {
      clean();
      navigate('/login', { state: { error: params.get('error_description') || 'Sign-in was cancelled.' } });
      return;
    }
    // supabase-js exchanges the code on load; wait for that, then route the person.
    supabase.auth.getSession().then(async ({ data }) => {
      clean();
      if (!data.session) return navigate('/login', { state: { error: 'That link has expired. Log in or request a new one.' } });
      navigate(params.get('next') === 'reset' ? '/reset-password' : await destinationFor(data.session.user));
    });
  }, [navigate]);
  return null;
}

/* Route guard. Without a backend configured, every page stays open (demo mode). */
export function RequireAuth({ superAdmin = false, children }) {
  const session = useSession();
  if (!supabase) return children;
  if (session === undefined) return null;
  if (!session) return <Navigate to="/login" replace />;
  if (superAdmin && !isSuperAdminEmail(session.user.email)) return <Navigate to="/" replace />;
  return children;
}

const ROLES = [
  { id: 'student', icon: 'GraduationCap', label: 'I’m a student', sub: 'Find a mentor' },
  { id: 'mentor', icon: 'Briefcase', label: 'I want to mentor', sub: 'Give back' },
];

export function RolePicker({ value, onChange }) {
  return (
    <div className="role-pick" role="radiogroup" aria-label="Account type">
      {ROLES.map((r) => (
        <button key={r.id} type="button" role="radio" aria-checked={value === r.id} className={`role-option ${value === r.id ? 'active' : ''}`} onClick={() => onChange(r.id)}>
          <Icon name={r.icon} size={20} />
          <span className="col">
            <span className="semibold">{r.label}</span>
            <span className="xs muted">{r.sub}</span>
          </span>
        </button>
      ))}
    </div>
  );
}

export function GoogleButton({ onClick, children = 'Continue with Google' }) {
  const [busy, setBusy] = useState(false);
  return (
    <button type="button" className="btn btn-md btn-google" disabled={busy} onClick={async () => { setBusy(true); if (await onClick() === false) setBusy(false); }}>
      <svg width="18" height="18" viewBox="0 0 48 48" aria-hidden="true">
        <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
        <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
        <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
        <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
      </svg>
      {children}
    </button>
  );
}
