// Small text helpers shared by many pages.

export const firstName = (name = '') => name.trim().split(/\s+/)[0] || '';
export const initials = (name = '') => name.trim().split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
export const hasFullName = (name = '') => name.trim().split(/\s+/).length >= 2;
export const isEmail = (text = '') => /^\S+@\S+\.\S+$/.test(text.trim());
export const splitList = (text) => (text ? text.split(',').map((t) => t.trim()).filter(Boolean) : []);

export function fileSize(bytes) {
  if (bytes == null) return '–';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1048576) return `${Math.round(bytes / 1024)} KB`;
  if (bytes < 1073741824) return `${(bytes / 1048576).toFixed(1)} MB`;
  return `${(bytes / 1073741824).toFixed(2)} GB`;
}

/* Turns database errors into sentences people understand. */
export function friendlyError(error) {
  const msg = error?.message || String(error || '');
  if (msg.includes('row-level security')) return 'You’re not allowed to do that.';
  if (msg.includes('permission denied')) return 'You’re not allowed to do that.';
  if (msg.includes('Failed to fetch') || msg.includes('NetworkError')) return 'Couldn’t reach M3allim. Check your connection and try again.';
  if (msg.includes('duplicate key')) return 'That already exists.';
  return msg;
}
