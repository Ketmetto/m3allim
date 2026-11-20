// After a session has taken place, the student rates it (1–5 stars) and can write a review.
import { useState } from 'react';
import { Button, Field, FormError, Modal, StarPicker, Textarea } from '../ui';
import { sessionActions } from '../../services/sessions.js';
import { friendlyError } from '../../utils/format.js';

export function RateDialog({ session, mentorName, onClose }) {
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setBusy(true); setError('');
    try {
      await sessionActions.rate(session, rating, review.trim());
      onClose();
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Modal title={`Rate your session with ${mentorName}`} onClose={onClose}>
      <StarPicker value={rating} onChange={setRating} />
      <Field label="Review" hint="Optional. Shown on the mentor’s profile without your name."><Textarea rows={3} value={review} onChange={(e) => setReview(e.target.value)} maxLength={1000} /></Field>
      <FormError>{error}</FormError>
      <Button disabled={busy} onClick={submit}>Submit rating</Button>
    </Modal>
  );
}
