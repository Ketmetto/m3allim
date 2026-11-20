// Builds the times a student can book with a mentor, from:
//   - the mentor's weekly availability (mentor_availability), or default hours if they haven't set any
//   - the mentor's confirmed sessions (mentor_busy), so two sessions never overlap
//   - the platform rules: session length and minimum notice (platform_settings)
// The database checks the same three things again when the request is sent (slot_problem in schema.sql).
import { BOOKING_DAYS, DEFAULT_HOURS, SLOT_STEP_MIN } from '../config/constants.js';
import { addDays, beirutToISO, fmtDay, toBeirut, weekdayOf } from './time.js';

const toMin = (hhmm) => {
  const [h, m] = hhmm.slice(0, 5).split(':').map(Number);
  return h * 60 + m;
};
const toHHMM = (min) => `${String(Math.floor(min / 60)).padStart(2, '0')}:${String(min % 60).padStart(2, '0')}`;

/**
 * @returns [{ day: '2026-11-24', label: 'Tue, Nov 24', times: ['17:00', '17:30'] }] – only days with free times
 */
export function bookableDays({ availability = [], busy = [], lengthMin = 45, noticeHours = 12, days = BOOKING_DAYS, now = Date.now() }) {
  const earliest = now + noticeHours * 3600000;
  const taken = busy.map((b) => [new Date(b.starts_at).getTime(), new Date(b.starts_at).getTime() + b.duration_min * 60000]);
  const today = toBeirut(new Date(now).toISOString()).day;
  const result = [];
  for (let i = 0; i <= days; i++) {
    const day = addDays(today, i);
    const windows = availability.length
      ? availability.filter((a) => a.weekday === weekdayOf(day))
      : [{ start_time: DEFAULT_HOURS.start, end_time: DEFAULT_HOURS.end }];
    const times = new Set();
    for (const w of windows) {
      for (let t = toMin(w.start_time); t + lengthMin <= toMin(w.end_time); t += SLOT_STEP_MIN) {
        const start = new Date(beirutToISO(day, toHHMM(t))).getTime();
        const end = start + lengthMin * 60000;
        if (start < earliest) continue;
        if (taken.some(([s, e]) => start < e && end > s)) continue;
        times.add(toHHMM(t));
      }
    }
    if (times.size) result.push({ day, label: fmtDay(beirutToISO(day, '12:00')), times: [...times].sort() });
  }
  return result;
}

/* "Mon 17:00–20:00, Sat 10:00–13:00" for profile pages. */
export function describeAvailability(availability, weekdayNames) {
  return [...availability]
    .sort((a, b) => a.weekday - b.weekday || a.start_time.localeCompare(b.start_time))
    .map((a) => ({ day: weekdayNames[a.weekday], hours: `${a.start_time.slice(0, 5)} – ${a.end_time.slice(0, 5)}` }));
}
