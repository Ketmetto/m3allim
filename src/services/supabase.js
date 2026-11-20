// The connection to the backend (Supabase: Postgres database, accounts, file storage, live updates).
// Configure it with VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.local (see .env.example).
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// PKCE puts the sign-in code in ?code=… instead of the #hash, which the HashRouter needs for routes.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { flowType: 'pkce' } }) : null;
export const hasBackend = Boolean(supabase);

/* Unwraps a Supabase response: returns the data, or throws the error. */
export function must({ data, error }) {
  if (error) throw error;
  return data;
}

/* Subscribes to inserts/updates on a table. Returns a function that stops listening. */
export function listen(name, table, filter, onChange, event = '*') {
  const channel = supabase
    .channel(`${name}-${Math.random().toString(36).slice(2)}`)
    .on('postgres_changes', { event, schema: 'public', table, ...(filter ? { filter } : {}) }, onChange)
    .subscribe();
  return () => supabase.removeChannel(channel);
}
