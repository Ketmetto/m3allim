import { useState } from 'react';
import { Avatar, Button, Field, Icon, Modal, Select, StatusChip, Stars, Textarea } from './ui.jsx';
import { REPORT_REASONS, reportUser, sessionActions, sessionState, videoLink } from '../data/mentorship.js';
import { TIME_OPTIONS, beirutToISO, dayOptions, fmtDay, fmtTime, fmtWhen, monthDay, sessionTiming, toBeirut } from '../lib/time.js';

/* Day + time pickers (Beirut time). value/onChange use { day, time }. */
export function TimePicker({ value, onChange }) {
  const days = dayOptions();
  const dayLabel = Object.fromEntries(days.map((d) => [d.label, d.value]));
  return (
    <div className="grid-2 tight">
      <Field label="Day"><Select value={days.find((d) => d.value === value.day)?.label || days[0].label} onChange={(label) => onChange({ ...value, day: dayLabel[label] })} options={days.map((d) => d.label)} /></Field>
      <Field label="Time (Beirut)"><Select value={value.time} onChange={(time) => onChange({ ...value, time })} options={TIME_OPTIONS} /></Field>
    </div>
  );
}
export const defaultSlot = () => ({ day: dayOptions()[0].value, time: '17:00' });

function useAction(onDone) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn) => {
    setBusy(true); setError('');
    try {
      await fn();
      onDone?.();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };
  return { busy, error, run };
}

export function RescheduleDialog({ session, role, onClose }) {
  const current = toBeirut(session.starts_at);
  const [slot, setSlot] = useState(current.day > dayOptions()[0].value ? current : defaultSlot());
  const { busy, error, run } = useAction(onClose);
  const direct = role === 'student' && session.status === 'Pending';
  const other = role === 'student' ? 'your mentor' : 'the student';
  return (
    <Modal title={direct ? 'Change the requested time' : 'Propose a new time'} onClose={onClose}>
      <p className="sm muted">Currently {fmtWhen(session.starts_at)} (Beirut). {direct ? 'Your request will be updated right away.' : `The session stays at its current time until ${other} accepts the new one.`}</p>
      <TimePicker value={slot} onChange={setSlot} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="row gap-12"><Button className="fill" disabled={busy} onClick={() => run(() => sessionActions.reschedule(session, role, beirutToISO(slot.day, slot.time)))}>{direct ? 'Save new time' : 'Send proposal'}</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
    </Modal>
  );
}

export function ReportDialog({ reporterId, person, sessionId, onClose }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const { busy, error, run } = useAction(() => setSent(true));
  return (
    <Modal title={`Report ${person.name}`} onClose={onClose}>
      {sent ? (
        <>
          <p className="sm">Thank you. The M3allim team will review your report and may contact you. {person.name} won’t see who reported them.</p>
          <Button onClick={onClose}>Close</Button>
        </>
      ) : (
        <>
          <p className="sm muted">Reports are private and reviewed by the M3allim team.</p>
          <Field label="Reason"><Select value={reason} onChange={setReason} options={REPORT_REASONS} /></Field>
          <Field label="What happened?" hint="Optional, but details help us act faster."><Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} /></Field>
          {error && <p className="error" role="alert">{error}</p>}
          <div className="row gap-12"><Button variant="danger" className="fill" disabled={busy} onClick={() => run(() => reportUser(reporterId, { reportedId: person.id, sessionId, reason, details: details.trim() }))}>Send report</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
        </>
      )}
    </Modal>
  );
}

function RateDialog({ session, onClose }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const { busy, error, run } = useAction(onClose);
  return (
    <Modal title={`Rate your session with ${session.mentor.full_name}`} onClose={onClose}>
      <div className="row gap-4 rate-pick big" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => <button key={n} role="radio" aria-checked={rating === n} aria-label={`${n} stars`} className={n <= rating ? 'on' : ''} onClick={() => setRating(n)}>★</button>)}
      </div>
      <Field label="Review" hint="Optional. Shown on the mentor’s profile without your name."><Textarea rows={3} value={review} onChange={(e) => setReview(e.target.value)} /></Field>
      {error && <p className="error" role="alert">{error}</p>}
      <Button disabled={busy} onClick={() => run(() => sessionActions.rate(session, rating, review.trim()))}>Submit rating</Button>
    </Modal>
  );
}

/* One session or request, with the actions that make sense for this person right now. */
export function SessionItem({ s, role, userId, onChanged, compact = false }) {
  const [dialog, setDialog] = useState(null); // 'reschedule' | 'report' | 'rate'
  const [confirmCancel, setConfirmCancel] = useState(false);
  const { busy, error, run } = useAction(onChanged);
  const state = sessionState(s);
  const timing = sessionTiming(s);
  const other = role === 'student'
    ? { id: s.mentor.id, name: s.mentor.full_name, sub: s.mentor.headline, photo: s.mentor.profiles?.avatar_url }
    : { id: s.student.id, name: s.student.full_name || 'Student', sub: s.student.university ? `Student · ${s.student.university}` : 'Student', photo: s.student.avatar_url };
  const md = monthDay(s.starts_at);
  const open = state === 'Pending' || state === 'Confirmed';
  const theirProposal = s.proposed_by && s.proposed_by !== role;
  const myProposal = s.proposed_by === role;
  const chip = s.proposed_by && open ? 'New time proposed' : state;
  const chatLink = role === 'student' ? `/student/messages?with=${other.id}` : `/mentor/messages?with=${other.id}`;
  const close = () => { setDialog(null); onChanged?.(); };

  return (
    <div className="session-row">
      <div className={`date-block ${state === 'Confirmed' ? 'on' : ''}`}><span className="xs semibold">{md.month}</span><span className="date-day">{md.day}</span></div>
      <Avatar name={other.name} src={other.photo} size={compact ? 44 : 52} />
      <div className="col gap-4 fill min0">
        <span className="h3 truncate">{other.name}</span>
        <span className="sm muted truncate">{s.topic}{compact ? '' : ` · ${other.sub}`}</span>
        <span className="row gap-6 sm medium"><Icon name="Clock" size={14} color="var(--teal)" /> {fmtDay(s.starts_at)} · {fmtTime(s.starts_at)} – {fmtTime(new Date(new Date(s.starts_at).getTime() + s.duration_min * 60000).toISOString())}</span>
        {!compact && role === 'mentor' && s.message && <p className="sm muted">“{s.message}”</p>}
        {s.status === 'Cancelled' && <span className="xs muted">Cancelled by {s.cancelled_by === role ? 'you' : other.name}</span>}
        {state === 'Completed' && s.rating && <span className="row gap-6 xs"><Stars value={s.rating} size={13} />{s.review && <span className="muted truncate">“{s.review}”</span>}</span>}
        {open && theirProposal && (
          <div className="proposal">
            <span className="sm fill"><b>{other.name}</b> proposed <b>{fmtWhen(s.proposed_starts_at)}</b></span>
            <Button size="sm" disabled={busy} onClick={() => run(() => sessionActions.acceptProposal(s))}>Accept new time</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => sessionActions.dropProposal(s))}>Keep current</Button>
          </div>
        )}
        {open && myProposal && (
          <div className="proposal"><span className="sm fill">You proposed <b>{fmtWhen(s.proposed_starts_at)}</b>. Waiting for {other.name}.</span><button className="link" disabled={busy} onClick={() => run(() => sessionActions.dropProposal(s))}>Withdraw</button></div>
        )}
        {confirmCancel && (
          <div className="proposal">
            <span className="sm fill">{state === 'Pending' ? 'Cancel this request?' : `Cancel this session? ${other.name} will see it was cancelled.`}</span>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => sessionActions.cancel(s, role))}>Yes, cancel</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmCancel(false)}>No</Button>
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      <StatusChip status={chip} />
      <div className="session-actions">
        {role === 'mentor' && state === 'Pending' && <>
          <Button size="sm" icon="Check" disabled={busy} onClick={() => run(() => sessionActions.accept(s))}>Accept</Button>
          <Button size="sm" variant="danger-outline" disabled={busy} onClick={() => run(() => sessionActions.decline(s))}>Decline</Button>
        </>}
        {state === 'Confirmed' && (
          timing.joinable
            ? <Button size="sm" icon="Video" onClick={() => window.open(videoLink(s), '_blank', 'noopener')}>Join video call</Button>
            : <Button size="sm" icon="Video" disabled title="Opens 10 minutes before the start">{timing.startsInMin > 60 * 24 ? 'Join opens on the day' : `Join in ${Math.max(1, timing.startsInMin - 10)} min`}</Button>
        )}
        {open && !compact && <Button size="sm" variant="outline" to={chatLink}>Message</Button>}
        {open && !s.proposed_by && !compact && (role === 'student' || state === 'Confirmed') && <Button size="sm" variant="outline" icon="Calendar" onClick={() => setDialog('reschedule')}>Reschedule</Button>}
        {open && !compact && !confirmCancel && (role === 'student' || state === 'Confirmed') && <Button size="sm" variant="danger-outline" onClick={() => setConfirmCancel(true)}>{state === 'Pending' ? 'Cancel request' : 'Cancel'}</Button>}
        {role === 'student' && state === 'Completed' && !s.rating && <Button size="sm" variant="gold-outline" onClick={() => setDialog('rate')}>Rate mentor</Button>}
        {!compact && <button className="link danger xs" onClick={() => setDialog('report')}>Report</button>}
      </div>
      {dialog === 'reschedule' && <RescheduleDialog session={s} role={role} onClose={close} />}
      {dialog === 'rate' && <RateDialog session={s} onClose={close} />}
      {dialog === 'report' && <ReportDialog reporterId={userId} person={other} sessionId={s.id} onClose={() => setDialog(null)} />}
    </div>
  );
}
