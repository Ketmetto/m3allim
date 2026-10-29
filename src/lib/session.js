import { useEffect, useState } from 'react';
import { supabase } from './supabase.js';

// Current session; undefined while loading, null when signed out.
export function useSession() {
  const [session, setSession] = useState(supabase ? undefined : null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_event, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);
  return session;
}
