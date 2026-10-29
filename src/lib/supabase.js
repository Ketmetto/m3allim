// Supabase client. Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.example)
// this is null and the app falls back to the browser-only demo data.
import { createClient } from '@supabase/supabase-js';

export const supabaseUrl = import.meta.env?.VITE_SUPABASE_URL;
export const supabaseKey = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// PKCE puts the sign-in code in ?code=… instead of the #hash, which the HashRouter needs for routes.
export const supabase = supabaseUrl && supabaseKey ? createClient(supabaseUrl, supabaseKey, { auth: { flowType: 'pkce' } }) : null;
export const hasBackend = Boolean(supabase);
