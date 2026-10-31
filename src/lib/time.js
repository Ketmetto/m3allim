// Session times are stored as UTC timestamps and always shown in Beirut time, whatever the viewer's device says.
const TZ = 'Asia/Beirut';
const JOIN_EARLY_MIN = 10; // the video call opens this many minutes before the start
const JOIN_LATE_MIN = 15; // and stays open this long after the planned end

const parts = (date, opts) => Object.fromEntries(new Intl.DateTimeFormat('en-GB', { timeZone: TZ, ...opts }).formatToParts(date).map((p) => [p.type, p.value]));

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

export const fmtDay = (iso) => new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short', month: 'short', day: 'numeric' }).format(new Date(iso));
export const fmtTime = (iso) => new Intl.DateTimeFormat('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).format(new Date(iso));
export const fmtWhen = (iso) => `${fmtDay(iso)} · ${fmtTime(iso)}`;
export const monthDay = (iso) => {
  const p = parts(new Date(iso), { month: 'short', day: '2-digit' });
  return { month: p.month.toUpperCase(), day: p.day };
};

export function fmtChatTime(iso) {
  const d = new Date(iso);
  const today = toBeirut(new Date().toISOString()).day;
  return toBeirut(iso).day === today ? fmtTime(iso) : fmtDay(iso);
}

/* Selectable days (next `count` days, starting tomorrow) and half-hour times for the pickers. */
export function dayOptions(count = 21) {
  const start = Date.now();
  return Array.from({ length: count }, (_, i) => {
    const iso = new Date(start + (i + 1) * 86400000).toISOString();
    return { value: toBeirut(iso).day, label: fmtDay(iso) };
  });
}
export const TIME_OPTIONS = Array.from({ length: 28 }, (_, i) => `${String(8 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`); // 08:00 – 21:30

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
