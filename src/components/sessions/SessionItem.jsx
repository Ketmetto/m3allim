// One session or request, with the actions that make sense for this person right now:
//   mentor + pending        → Accept / Decline
//   confirmed               → Join video call (opens 10 min before), Message, Reschedule, Cancel
//   new time proposed       → Accept new time / Keep current (or Withdraw your own proposal)
//   student + completed     → Rate mentor
//   always                  → Report
import { useState } from 'react';
import { Avatar, Button, Icon, StatusChip, Stars } from '../ui';
import { RescheduleDialog } from './RescheduleDialog.jsx';
import { RateDialog } from './RateDialog.jsx';
import { ReportDialog } from '../moderation/ReportDialog.jsx';
import { sessionActions, sessionState, videoLink } from '../../services/sessions.js';
import { endOf, fmtDay, fmtTime, fmtWhen, monthDay, sessionTiming } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';
import { JOIN_EARLY_MIN } from '../../config/constants.js';

/* The person on the other side of the session. */
function otherPerson(s, role) {
  if (role === 'student') {
    return { id: s.mentor_id, name: s.mentor?.full_name || 'Mentor no longer available', sub: s.mentor?.headline || '', photo: s.mentor?.profiles?.avatar_url };
  }
  return { id: s.student_id, name: s.student?.full_name || 'Student', sub: s.student?.university ? `Student · ${s.student.university}` : 'Student', photo: s.student?.avatar_url };
}

export function SessionItem({ s, role, userId, onChanged, compact = false }) {
  const [dialog, setDialog] = useState(null); // 'reschedule' | 'report' | 'rate'
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const state = sessionState(s);
  const timing = sessionTiming(s);
  const other = otherPerson(s, role);
  const md = monthDay(s.starts_at);
  const open = state === 'Pending' || state === 'Confirmed';
  const theirProposal = s.proposed_by && s.proposed_by !== role;
  const myProposal = s.proposed_by === role;
  const chip = s.proposed_by && open ? 'New time proposed' : state;
  const close = () => { setDialog(null); onChanged?.(); };

  const run = async (action) => {
    setBusy(true); setError('');
    try {
      await action();
      setConfirmCancel(false);
      onChanged?.();
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy(false);
  };

  return (
    <div className="session-row">
      <div className={`date-block ${state === 'Confirmed' ? 'on' : ''}`}><span className="xs semibold">{md.month}</span><span className="date-day">{md.day}</span></div>
      <Avatar name={other.name} src={other.photo} size={compact ? 44 : 52} />
      <div className="col gap-4 fill min0">
        <span className="h3 truncate">{other.name}</span>
        <span className="sm muted truncate">{s.topic}{compact || !other.sub ? '' : ` · ${other.sub}`}</span>
        <span className="row gap-6 sm medium"><Icon name="Clock" size={14} color="var(--teal)" /> {fmtDay(s.starts_at)} · {fmtTime(s.starts_at)} – {fmtTime(endOf(s))}</span>
        {!compact && role === 'mentor' && s.message && <p className="sm muted">“{s.message}”</p>}
        {!compact && role === 'mentor' && s.student?.bio && state === 'Pending' && <p className="xs muted">About the student: {s.student.bio}</p>}
        {s.status === 'Cancelled' && <span className="xs muted">Cancelled by {s.cancelled_by === role ? 'you' : s.cancelled_by === 'admin' ? 'the M3allim team' : other.name}</span>}
        {state === 'Completed' && s.rating && <span className="row gap-6 xs"><Stars value={s.rating} size={13} />{s.review && <span className="muted truncate">“{s.review}”</span>}</span>}
        {open && theirProposal && (
          <div className="proposal">
            <span className="sm fill"><b>{other.name}</b> proposed <b>{fmtWhen(s.proposed_starts_at)}</b></span>
            <Button size="sm" disabled={busy} onClick={() => run(() => sessionActions.acceptProposal(s))}>Accept new time</Button>
            <Button size="sm" variant="outline" disabled={busy} onClick={() => run(() => sessionActions.dropProposal(s))}>Keep current</Button>
          </div>
        )}
        {open && myProposal && (
          <div className="proposal"><span className="sm fill">You proposed <b>{fmtWhen(s.proposed_starts_at)}</b>. Waiting for {other.name}.</span><button type="button" className="link" disabled={busy} onClick={() => run(() => sessionActions.dropProposal(s))}>Withdraw</button></div>
        )}
        {confirmCancel && (
          <div className="proposal">
            <span className="sm fill">{state === 'Pending' ? 'Cancel this request?' : `Cancel this session? ${other.name} will be notified.`}</span>
            <Button size="sm" variant="danger" disabled={busy} onClick={() => run(() => sessionActions.cancel(s, role))}>Yes, cancel</Button>
            <Button size="sm" variant="outline" onClick={() => setConfirmCancel(false)}>No</Button>
          </div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
      </div>
      <StatusChip status={chip} />
      <div className="session-actions">
        {role === 'mentor' && state === 'Pending' && (
          <>
            <Button size="sm" icon="Check" disabled={busy} onClick={() => run(() => sessionActions.accept(s))}>Accept</Button>
            <Button size="sm" variant="danger-outline" disabled={busy} onClick={() => run(() => sessionActions.decline(s))}>Decline</Button>
          </>
        )}
        {state === 'Confirmed' && (timing.joinable
          ? <Button size="sm" icon="Video" onClick={() => window.open(videoLink(s), '_blank', 'noopener')}>Join video call</Button>
          : <Button size="sm" icon="Video" disabled title={`Opens ${JOIN_EARLY_MIN} minutes before the start`}>{timing.startsInMin > 60 * 24 ? 'Join opens on the day' : `Join in ${Math.max(1, timing.startsInMin - JOIN_EARLY_MIN)} min`}</Button>)}
        {open && !compact && <Button size="sm" variant="outline" icon="MessageCircle" to={`/messages?with=${other.id}`}>Message</Button>}
        {open && !s.proposed_by && !compact && (role === 'student' || state === 'Confirmed') && <Button size="sm" variant="outline" icon="Calendar" onClick={() => setDialog('reschedule')}>Reschedule</Button>}
        {open && !compact && !confirmCancel && (role === 'student' || state === 'Confirmed') && <Button size="sm" variant="danger-outline" onClick={() => setConfirmCancel(true)}>{state === 'Pending' ? 'Cancel request' : 'Cancel'}</Button>}
        {role === 'student' && state === 'Completed' && !s.rating && <Button size="sm" variant="gold-outline" icon="Star" onClick={() => setDialog('rate')}>Rate &amp; review</Button>}
        {!compact && <button type="button" className="link danger xs" onClick={() => setDialog('report')}>Report</button>}
      </div>
      {dialog === 'reschedule' && <RescheduleDialog session={s} role={role} onClose={close} />}
      {dialog === 'rate' && <RateDialog session={s} mentorName={other.name} onClose={close} />}
      {dialog === 'report' && <ReportDialog reporterId={userId} person={other} sessionId={s.id} onClose={() => setDialog(null)} />}
    </div>
  );
}
