// Supabase client. Without VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY (see .env.example)
// this is null and the app falls back to the browser-only demo data.
import { createClient } from '@supabase/supabase-js';

const url = import.meta.env?.VITE_SUPABASE_URL;
const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;

// PKCE puts the sign-in code in ?code=… instead of the #hash, which the HashRouter needs for routes.
export const supabase = url && key ? createClient(url, key, { auth: { flowType: 'pkce' } }) : null;
export const hasBackend = Boolean(supabase);
