// Admins ban an account for a while or permanently. The database cancels the person's upcoming sessions,
// hides them from the directory (mentors) and blocks chat and requests until the ban ends.
import { useState } from 'react';
import { Button, Field, FormError, Modal, Select, Textarea } from '../ui';
import { BAN_DURATIONS } from '../../config/constants.js';
import { banUser } from '../../services/admin.js';
import { friendlyError } from '../../utils/format.js';

export function BanDialog({ person, defaultReason = '', onClose, onDone }) {
  const [duration, setDuration] = useState(BAN_DURATIONS[1].label);
  const [reason, setReason] = useState(defaultReason);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const ban = async () => {
    if (!reason.trim()) return setError('Give a reason. The person will see it.');
    setBusy(true); setError('');
    try {
      await banUser(person.id, reason.trim(), BAN_DURATIONS.find((d) => d.label === duration).days);
      onDone?.();
      onClose();
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Modal title={`Ban ${person.name}`} onClose={onClose}>
      <p className="sm muted">They won’t be able to request sessions, chat or appear in the directory. Their upcoming sessions are cancelled and the other people are told. They can still contact support to appeal.</p>
      <Field label="How long"><Select value={duration} onChange={setDuration} options={BAN_DURATIONS.map((d) => d.label)} /></Field>
      <Field label="Reason" hint="Shown to the person on their account."><Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} maxLength={500} /></Field>
      <FormError>{error}</FormError>
      <div className="row gap-12"><Button variant="danger" icon="Ban" className="fill" disabled={busy} onClick={ban}>Ban account</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
    </Modal>
  );
}
