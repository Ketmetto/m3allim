// Platform settings (one row): readable by everyone, so the website can show maintenance mode and the sign-up rules.
// Only the super admin can change them (see services/superAdmin.js).
import { supabase, must, listen } from './supabase.js';

export const getSettings = () => supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle().then(must);

export const onSettingsChange = (callback) => listen('settings', 'platform_settings', 'id=eq.1', ({ new: row }) => callback(row), 'UPDATE');
