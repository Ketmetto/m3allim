// Session times are stored as UTC timestamps and always shown in Beirut time, whatever the viewer's device says.
import { JOIN_EARLY_MIN, JOIN_LATE_MIN, TIME_ZONE } from '../config/constants.js';

const parts = (date, opts) =>
  Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, ...opts }).formatToParts(date).map((p) => [p.type, p.value]));

// Minutes Beirut is ahead of UTC at a given moment (changes with daylight saving).
function offsetMinutes(date) {
  const p = parts(date, { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' });
  return (Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute, p.second) - date.getTime()) / 60000;
}

/* '2026-11-04', '17:30' in Beirut → ISO timestamp */
export function beirutToISO(day, time) {
  const guess = new Date(`${day}T${time}:00Z`);
  return new Date(guess.getTime() - offsetMinutes(guess) * 60000).toISOString();
}

/* ISO timestamp → { day: '2026-11-04', time: '17:30' } in Beirut */
export function toBeirut(iso) {
  const p = parts(new Date(iso), { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  return { day: `${p.year}-${p.month}-${p.day}`, time: `${p.hour}:${p.minute}` };
}

/* '2026-11-04' + n days → '2026-11-08' (calendar arithmetic, no time zones involved) */
export function addDays(day, n) {
  const [y, m, d] = day.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + n)).toISOString().slice(0, 10);
}
export const weekdayOf = (day) => new Date(`${day}T12:00:00Z`).getUTCDay(); // 0 = Sunday

export const fmtDay = (iso) => new Intl.DateTimeFormat('en-US', { timeZone: TIME_ZONE, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
export const fmtTime = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
export const fmtWhen = (iso) => `${fmtDay(iso)} · ${fmtTime(iso)}`;
export const fmtDate = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(iso));
export const fmtDateTime = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: TIME_ZONE, day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
export const monthDay = (iso) => {
  const p = parts(new Date(iso), { month: 'short', day: '2-digit' });
  return { month: p.month.toUpperCase(), day: p.day };
};
export const endOf = (s) => new Date(new Date(s.starts_at).getTime() + s.duration_min * 60000).toISOString();

/* Today: just the time. Older: the day. Used in chat lists. */
export function fmtChatTime(iso) {
  const today = toBeirut(new Date().toISOString()).day;
  return toBeirut(iso).day === today ? fmtTime(iso) : fmtDay(iso);
}

/* "5 min ago", "Yesterday", "3 days ago" */
export function timeAgo(iso) {
  const mins = Math.round((Date.now() - new Date(iso)) / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  if (mins < 1440) return `${Math.round(mins / 60)} h ago`;
  const days = Math.round(mins / 1440);
  if (days === 1) return 'Yesterday';
  return days < 30 ? `${days} days ago` : fmtDate(iso);
}

/* Where a session stands right now. */
export function sessionTiming(s, now = Date.now()) {
  const start = new Date(s.starts_at).getTime();
  const end = start + s.duration_min * 60000;
  return {
    upcoming: end > now,
    ended: end <= now,
    joinable: now >= start - JOIN_EARLY_MIN * 60000 && now <= end + JOIN_LATE_MIN * 60000,
    startsInMin: Math.round((start - now) / 60000),
  };
}
