// One support ticket as a chat thread between the person and the admin team. Used on /support and /admin/support.
import { useEffect, useRef, useState } from 'react';
import { Avatar, Button, Chip, FormError, Icon, StatusChip } from '../ui';
import { useAsync } from '../../hooks/useAsync.js';
import { listTicketMessages, onTicketMessage, replyToTicket, setTicketStatus } from '../../services/support.js';
import { fmtDateTime } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';

/* viewer: 'user' (the person who opened it) | 'admin' */
export function TicketThread({ ticket, userId, viewer, onChanged, onBack }) {
  const { data: messages, reload } = useAsync(() => listTicketMessages(ticket.id), [ticket.id]);
  const [draft, setDraft] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const endRef = useRef(null);

  useEffect(() => onTicketMessage(ticket.id, () => { reload(); onChanged?.(); }), [ticket.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
  }, [messages?.length]);

  const send = async (e) => {
    e.preventDefault();
    if (!draft.trim()) return;
    setBusy(true); setError('');
    try {
      await replyToTicket(ticket.id, userId, draft.trim());
      setDraft('');
      await reload();
      onChanged?.();
    } catch (err) {
      setError(friendlyError(err));
    }
    setBusy(false);
  };

  const changeStatus = async (status) => {
    setBusy(true); setError('');
    try {
      await setTicketStatus(ticket.id, status);
      onChanged?.();
    } catch (err) {
      setError(friendlyError(err));
    }
    setBusy(false);
  };

  return (
    <div className="ticket card">
      <div className="ticket-head">
        {onBack && <button type="button" className="icon-btn chat-back" aria-label="Back" onClick={onBack}><Icon name="ChevronLeft" size={22} /></button>}
        <div className="col gap-4 fill min0">
          <span className="h3 truncate">{ticket.subject}</span>
          <span className="row gap-8 wrap xs muted"><Chip kind="gray" dot={false}>{ticket.category}</Chip>#{ticket.id} · opened {fmtDateTime(ticket.created_at)}</span>
        </div>
        <StatusChip status={ticket.status} />
        {ticket.status !== 'Closed' && <Button size="sm" variant="ghost-border" disabled={busy} onClick={() => changeStatus('Closed')}>{viewer === 'admin' ? 'Close ticket' : 'Mark as solved'}</Button>}
      </div>
      <div className="chat-body ticket-body">
        {!messages && <span className="date-pill">Loading…</span>}
        {messages?.map((m) => {
          const mine = m.sender_id === userId;
          const fromTeam = m.sender_id !== ticket.user_id;
          return (
            <div key={m.id} className={`msg ${mine ? 'mine' : ''}`}>
              <span className="row gap-6 xs muted">
                {!mine && <Avatar name={m.sender?.full_name || 'M3allim team'} src={m.sender?.avatar_url} size={20} />}
                {mine ? 'You' : fromTeam ? `${m.sender?.full_name || 'Admin'} · M3allim team` : m.sender?.full_name}
              </span>
              <p className="bubble">{m.body}</p>
              <span className="xs muted">{fmtDateTime(m.created_at)}</span>
            </div>
          );
        })}
        <div ref={endRef} />
      </div>
      <FormError>{error}</FormError>
      {ticket.status === 'Closed' && viewer === 'admin' ? (
        <div className="ticket-closed sm muted">This ticket is closed. <button type="button" className="link" onClick={() => changeStatus('Open')}>Reopen</button></div>
      ) : (
        <form className="chat-input" onSubmit={send}>
          <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={ticket.status === 'Closed' ? 'Write to reopen this ticket…' : viewer === 'admin' ? 'Reply as the M3allim team…' : 'Write a message…'} aria-label="Reply" maxLength={4000} />
          <button type="submit" className="send-btn" aria-label="Send" disabled={busy || !draft.trim()}><Icon name="Send" size={18} /></button>
        </form>
      )}
    </div>
  );
}
