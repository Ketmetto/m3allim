// Students move a pending request straight away; a confirmed session needs the other person to accept the new time.
import { useState } from 'react';
import { Button, FormError, Modal } from '../ui';
import { SlotPicker } from '../mentors/SlotPicker.jsx';
import { sessionActions } from '../../services/sessions.js';
import { beirutToISO, fmtWhen } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';

export function RescheduleDialog({ session, role, onClose }) {
  const [slot, setSlot] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const direct = role === 'student' && session.status === 'Pending';
  const other = role === 'student' ? 'your mentor' : 'the student';

  const save = async () => {
    setBusy(true); setError('');
    try {
      await sessionActions.reschedule(session, role, beirutToISO(slot.day, slot.time));
      onClose();
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Modal title={direct ? 'Change the requested time' : 'Propose a new time'} onClose={onClose}>
      <p className="sm muted">Currently {fmtWhen(session.starts_at)} (Beirut). {direct ? 'Your request will be updated right away.' : `The session stays at its current time until ${other} accepts the new one.`}</p>
      <SlotPicker mentorId={session.mentor_id} value={slot} onChange={setSlot} ignoreStart={session.status === 'Accepted' ? session.starts_at : undefined} />
      <FormError>{error}</FormError>
      <div className="row gap-12"><Button className="fill" disabled={busy || !slot} onClick={save}>{direct ? 'Save new time' : 'Send proposal'}</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
    </Modal>
  );
}
