// Super admin tools: the admin team, platform settings (incl. maintenance mode) and system health.
// Protected in the database by is_super_admin() (schema.sql).
import { supabase, supabaseKey, supabaseUrl, must } from './supabase.js';

/* ---------- Admin team ---------- */
export const listAdmins = () => supabase.rpc('list_admins').then(must);
export const addAdmin = (email, fullName, addedBy) =>
  supabase.from('admins').insert({ email: email.trim().toLowerCase(), full_name: fullName || null, added_by: addedBy }).then(must);
export const setAdminStatus = (email, status) => supabase.from('admins').update({ status }).eq('email', email).then(must);
export const removeAdmin = (email) => supabase.from('admins').delete().eq('email', email).then(must);

/* ---------- Platform settings (reading them: services/settings.js) ---------- */
export const updateSettings = (fields) => supabase.from('platform_settings').update(fields).eq('id', 1).select().single().then(must);

/* ---------- System health ---------- */
export const getSystemHealth = () => supabase.rpc('system_health').then(must);

async function timed(check) {
  const started = performance.now();
  try {
    const detail = await check();
    return { ok: true, ms: Math.round(performance.now() - started), detail };
  } catch (e) {
    return { ok: false, ms: Math.round(performance.now() - started), detail: e.message || 'Unreachable' };
  }
}

/* Live checks run from the browser: each service is called and timed. */
export function runServiceChecks() {
  return Promise.all([
    timed(async () => {
      await supabase.from('platform_settings').select('id').limit(1).then(must);
      return 'Database answering queries';
    }).then((r) => ({ name: 'Database (Postgres)', icon: 'Database', ...r })),
    timed(async () => {
      const res = await fetch(`${supabaseUrl}/auth/v1/health`, { headers: { apikey: supabaseKey } });
      if (!res.ok) throw new Error(`Status ${res.status}`);
      const body = await res.json().catch(() => ({}));
      return body.version ? `Version ${body.version}` : 'Accounts service up';
    }).then((r) => ({ name: 'Accounts & sign-in', icon: 'KeyRound', ...r })),
    timed(async () => {
      const { error } = await supabase.storage.from('avatars').list('', { limit: 1 });
      if (error) throw error;
      return 'File storage reachable';
    }).then((r) => ({ name: 'File storage', icon: 'HardDrive', ...r })),
    timed(() => new Promise((resolve, reject) => {
      const channel = supabase.channel(`health-${Date.now()}`);
      const timer = setTimeout(() => { supabase.removeChannel(channel); reject(new Error('No answer within 8 seconds')); }, 8000);
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') { clearTimeout(timer); supabase.removeChannel(channel); resolve('Live updates connected'); }
        if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') { clearTimeout(timer); supabase.removeChannel(channel); reject(new Error(status)); }
      });
    })).then((r) => ({ name: 'Live updates (chat, notifications)', icon: 'Zap', ...r })),
    timed(async () => {
      await fetch('https://meet.jit.si/', { mode: 'no-cors', cache: 'no-store' });
      return 'meet.jit.si reachable';
    }).then((r) => ({ name: 'Video calls (Jitsi)', icon: 'Video', ...r })),
  ]);
}
