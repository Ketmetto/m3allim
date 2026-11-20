// Who is signed in and what role they have, in one place for the whole website.
// Wrapped around the app in main.jsx; read it anywhere with:  const { account, role } = useAuth();
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { supabase } from '../services/supabase.js';
import { loadAccount, signOut } from '../services/auth.js';
import { ROLES, isStaff } from '../config/roles.js';

export const AuthContext = createContext(null);

const RECHECK_MS = 60000; // re-read the account when the tab regains focus, at most once a minute (bans, new roles)

export function AuthProvider({ children }) {
  const [session, setSession] = useState(supabase ? undefined : null); // undefined while loading
  const [account, setAccount] = useState(undefined); // undefined while loading, null when signed out
  const [error, setError] = useState('');

  // Follow sign-in / sign-out from Supabase.
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  const user = session?.user ?? null;
  const load = useCallback(async () => {
    if (!user) {
      setAccount(null);
      setError('');
      return null;
    }
    try {
      const next = await loadAccount(user);
      setAccount(next);
      setError('');
      return next;
    } catch (e) {
      // A failed background re-check keeps the account already loaded; only a first load shows the error screen.
      setError(e.message);
      setAccount((prev) => prev ?? null);
      return null;
    }
    // Only reload when the person changes, not on every token refresh.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  // Load the account once Supabase knows whether someone is signed in, and again whenever the person changes.
  const sessionKnown = session !== undefined;
  useEffect(() => {
    if (!sessionKnown) return;
    setAccount(undefined);
    load();
  }, [sessionKnown, load]);

  useEffect(() => {
    if (!user) return;
    let last = Date.now();
    const onFocus = () => {
      if (Date.now() - last < RECHECK_MS) return;
      last = Date.now();
      load();
    };
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [user?.id, load]);

  const value = useMemo(() => {
    const role = account?.role ?? ROLES.GUEST;
    return {
      loading: session === undefined || (Boolean(session) && account === undefined),
      account: account ?? null, // the signed-in person (see services/auth.js loadAccount), or null
      role,
      isStaff: isStaff(role),
      isSuperAdmin: role === ROLES.SUPER_ADMIN,
      error,
      refresh: load, // call after changing your profile or account type
      signOut: async () => {
        await signOut();
        setAccount(null);
        setError('');
      },
    };
  }, [session, account, error, load]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
