import { useState } from 'react';
import { Button, Field, FormError, Input, Select, Textarea } from '../ui';
import { SUPPORT_CATEGORIES } from '../../config/constants.js';
import { openTicket } from '../../services/support.js';
import { friendlyError } from '../../utils/format.js';

/* Starts a conversation with the admin team. */
export function NewTicketForm({ defaultCategory = 'Account', onCreated, onCancel }) {
  const [subject, setSubject] = useState('');
  const [category, setCategory] = useState(defaultCategory);
  const [body, setBody] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e) => {
    e.preventDefault();
    if (subject.trim().length < 3) return setError('Add a short subject.');
    if (!body.trim()) return setError('Tell us what you need help with.');
    setBusy(true); setError('');
    try {
      const id = await openTicket({ subject: subject.trim(), category, body: body.trim() });
      onCreated?.(id);
    } catch (err) {
      setError(friendlyError(err));
      setBusy(false);
    }
  };

  return (
    <form className="col gap-18" onSubmit={submit} noValidate>
      <div className="grid-2 tight">
        <Field label="Subject"><Input value={subject} onChange={(e) => setSubject(e.target.value)} maxLength={120} placeholder="e.g. I can’t join my session" /></Field>
        <Field label="Topic"><Select value={category} onChange={setCategory} options={SUPPORT_CATEGORIES} /></Field>
      </div>
      <Field label="Message" hint="An admin usually replies within a day. You’ll get a notification."><Textarea rows={5} value={body} onChange={(e) => setBody(e.target.value)} maxLength={4000} /></Field>
      <FormError>{error}</FormError>
      <div className="row gap-12">
        <Button type="submit" icon="Send" disabled={busy}>{busy ? 'Sending…' : 'Send to the M3allim team'}</Button>
        {onCancel && <Button variant="outline" onClick={onCancel}>Cancel</Button>}
      </div>
    </form>
  );
}
