// Set my weekly availability (Beirut time). Students only see and can only request times inside these hours,
// and never a time when I already have a confirmed session. The database enforces both (slot_problem in schema.sql).
import { useEffect, useState } from 'react';
import { SiteLayout } from '../../components/layout';
import { Button, Card, FormError, FormNotice, Icon, Loading, PageHeading, Select, Toggle } from '../../components/ui';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { getAvailability, saveAvailability } from '../../services/availability.js';
import { WEEKDAYS } from '../../config/constants.js';
import { friendlyError } from '../../utils/format.js';

const TIMES = Array.from({ length: 33 }, (_, i) => `${String(7 + Math.floor(i / 2)).padStart(2, '0')}:${i % 2 ? '30' : '00'}`); // 07:00 – 23:00
const ORDER = [1, 2, 3, 4, 5, 6, 0]; // Monday first

// { 1: [{ start: '17:00', end: '20:00' }], … } ⇄ database rows
const toWeek = (rows) => {
  const week = Object.fromEntries(ORDER.map((d) => [d, []]));
  rows.forEach((r) => week[r.weekday].push({ start: r.start_time.slice(0, 5), end: r.end_time.slice(0, 5) }));
  return week;
};
const toRows = (week) => ORDER.flatMap((d) => week[d].map((w) => ({ weekday: d, start_time: w.start, end_time: w.end })));

export default function Availability() {
  const { account } = useAuth();
  const { settings } = useSettings();
  const [week, setWeek] = useState(null);
  const [saved, setSaved] = useState('');
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    getAvailability(account.id).then((rows) => { const w = toWeek(rows); setWeek(w); setSaved(JSON.stringify(w)); }).catch((e) => setError(friendlyError(e)));
  }, [account.id]);

  if (!week) return <SiteLayout>{error ? <FormError>{error}</FormError> : <Loading />}</SiteLayout>;

  const update = (day, windows) => { setWeek({ ...week, [day]: windows }); setNotice(''); setError(''); };
  const changed = JSON.stringify(week) !== saved;
  const total = ORDER.reduce((n, d) => n + week[d].length, 0);

  const save = async () => {
    for (const d of ORDER) {
      for (const w of week[d]) {
        if (w.end <= w.start) return setError(`${WEEKDAYS[d]}: the end time must be after the start time.`);
        const minutes = (Number(w.end.slice(0, 2)) * 60 + Number(w.end.slice(3))) - (Number(w.start.slice(0, 2)) * 60 + Number(w.start.slice(3)));
        if (minutes < settings.session_length_min) return setError(`${WEEKDAYS[d]}: each block needs at least ${settings.session_length_min} minutes for one session.`);
      }
    }
    setBusy(true); setError('');
    try {
      await saveAvailability(account.id, toRows(week));
      setSaved(JSON.stringify(week));
      setNotice(total ? 'Your hours are saved. Students now see only these times.' : 'Saved. With no hours set, students can request any time between 08:00 and 22:00.');
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy(false);
  };

  return (
    <SiteLayout>
      <PageHeading title="My availability" sub="Your usual weekly hours, in Beirut time. Students can only request sessions inside them.">
        <Button onClick={save} disabled={busy || !changed} icon="Check">{busy ? 'Saving…' : 'Save hours'}</Button>
      </PageHeading>
      <FormError>{error}</FormError>
      <FormNotice>{notice}</FormNotice>
      <div className="profile-layout">
        <Card pad={0} className="list">
          {ORDER.map((d) => {
            const windows = week[d];
            const on = windows.length > 0;
            return (
              <div key={d} className="avail-row">
                <div className="row gap-12 avail-day">
                  <Toggle on={on} onChange={(v) => update(d, v ? [{ start: '17:00', end: '20:00' }] : [])} label={`Available on ${WEEKDAYS[d]}`} />
                  <span className={`semibold ${on ? '' : 'muted'}`}>{WEEKDAYS[d]}</span>
                </div>
                <div className="col gap-10 fill">
                  {!on && <span className="sm muted">Unavailable</span>}
                  {windows.map((w, i) => (
                    <div key={i} className="row gap-8 avail-window">
                      <Select value={w.start} onChange={(v) => update(d, windows.map((x, j) => (j === i ? { ...x, start: v } : x)))} options={TIMES} aria-label="From" />
                      <span className="muted">to</span>
                      <Select value={w.end} onChange={(v) => update(d, windows.map((x, j) => (j === i ? { ...x, end: v } : x)))} options={TIMES} aria-label="Until" />
                      <button type="button" className="icon-btn muted" aria-label="Remove these hours" onClick={() => update(d, windows.filter((_, j) => j !== i))}><Icon name="Trash2" size={16} /></button>
                    </div>
                  ))}
                  {on && <button type="button" className="link start-self" onClick={() => update(d, [...windows, { start: '10:00', end: '12:00' }])}>+ Add more hours</button>}
                </div>
              </div>
            );
          })}
        </Card>
        <aside className="col gap-16 sticky">
          <div className="reassure"><Icon name="CalendarClock" size={22} color="var(--teal)" /><div className="col gap-4"><span className="semibold text-deep">How booking works</span>
            <span className="xs muted">Sessions are {settings.session_length_min} minutes. Students pick a start time inside your hours, at least {settings.min_notice_hours} hours ahead, and never over a session you’ve already accepted. You still accept or decline every request.</span></div></div>
          <p className="xs muted">{total ? `${total} ${total === 1 ? 'block' : 'blocks'} of hours per week.` : 'No hours set yet: students can request any time between 08:00 and 22:00.'}</p>
        </aside>
      </div>
    </SiteLayout>
  );
}
