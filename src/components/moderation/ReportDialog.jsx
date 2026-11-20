// Students report mentors, mentors report students. Reports go to the admin team.
import { useState } from 'react';
import { Button, Field, FormError, Modal, Select, Textarea } from '../ui';
import { REPORT_REASONS } from '../../config/constants.js';
import { reportUser } from '../../services/reports.js';
import { friendlyError } from '../../utils/format.js';

export function ReportDialog({ reporterId, person, sessionId, onClose }) {
  const [reason, setReason] = useState(REPORT_REASONS[0]);
  const [details, setDetails] = useState('');
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const send = async () => {
    setBusy(true); setError('');
    try {
      await reportUser(reporterId, { reportedId: person.id, sessionId, reason, details: details.trim() });
      setSent(true);
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy(false);
  };

  return (
    <Modal title={`Report ${person.name}`} onClose={onClose}>
      {sent ? (
        <>
          <p className="sm">Thank you. The M3allim team will review your report and you’ll get a notification when it’s handled. {person.name} won’t see who reported them.</p>
          <Button onClick={onClose}>Close</Button>
        </>
      ) : (
        <>
          <p className="sm muted">Reports are private and reviewed by the M3allim admin team.</p>
          <Field label="Reason"><Select value={reason} onChange={setReason} options={REPORT_REASONS} /></Field>
          <Field label="What happened?" hint="Optional, but details help us act faster."><Textarea rows={4} value={details} onChange={(e) => setDetails(e.target.value)} maxLength={2000} /></Field>
          <FormError>{error}</FormError>
          <div className="row gap-12"><Button variant="danger" className="fill" disabled={busy} onClick={send}>Send report</Button><Button variant="outline" onClick={onClose}>Cancel</Button></div>
        </>
      )}
    </Modal>
  );
}
