// Day and time pickers that only offer times the mentor can actually do (their weekly hours, minus
// confirmed sessions, respecting the platform's notice period). value / onChange use { day, time } in Beirut time.
import { useEffect, useMemo } from 'react';
import { Field, Select } from '../ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { getAvailability, getBusyTimes } from '../../services/availability.js';
import { bookableDays } from '../../utils/slots.js';

/* ignoreStart: the session being moved, so its own time doesn't count as busy. */
export function SlotPicker({ mentorId, value, onChange, ignoreStart }) {
  const { settings } = useSettings();
  const { data, error } = useAsync(() => Promise.all([getAvailability(mentorId), getBusyTimes(mentorId).catch(() => [])]), [mentorId]);

  const days = useMemo(() => {
    if (!data) return [];
    const [availability, busy] = data;
    return bookableDays({
      availability,
      busy: busy.filter((b) => b.starts_at !== ignoreStart),
      lengthMin: settings.session_length_min,
      noticeHours: settings.min_notice_hours,
    });
  }, [data, ignoreStart, settings.session_length_min, settings.min_notice_hours]);

  // Keep the choice valid: pick the first free time when nothing (or something no longer free) is chosen.
  useEffect(() => {
    if (!days.length) return;
    const ok = days.some((d) => d.day === value?.day && d.times.includes(value?.time));
    if (!ok) onChange({ day: days[0].day, time: days[0].times[0] });
  }, [days]); // eslint-disable-line react-hooks/exhaustive-deps

  if (error) return <p className="error">Couldn’t load available times: {error}</p>;
  if (!data) return <p className="sm muted">Loading available times…</p>;
  if (!days.length) return <p className="sm muted">No free times in the next three weeks. Send a message to agree on a time.</p>;

  const current = days.find((d) => d.day === value?.day) || days[0];
  const pickDay = (day) => {
    const d = days.find((x) => x.day === day);
    onChange({ day, time: d.times.includes(value?.time) ? value.time : d.times[0] });
  };

  return (
    <div className="col gap-16">
      <Field label="Day">
        <Select value={current.day} onChange={pickDay} options={days.map((d) => ({ value: d.day, label: `${d.label} · ${d.times.length} free` }))} />
      </Field>
      <div className="field">
        <span className="field-label">Time (Beirut) · {settings.session_length_min}-minute session</span>
        <div className="slot-grid slot-grid-4" role="radiogroup" aria-label="Start time">
          {current.times.map((t) => (
            <button key={t} type="button" role="radio" aria-checked={value?.day === current.day && value?.time === t}
              className={`slot ${value?.day === current.day && value?.time === t ? 'active' : ''}`} onClick={() => onChange({ day: current.day, time: t })}>
              {t}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
