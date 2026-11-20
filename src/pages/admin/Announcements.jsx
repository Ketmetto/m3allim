// Announcements (admins): write once, and the database delivers it as a notification to everyone in the audience.
import { useState } from 'react';
import { AdminShell } from '../../components/layout';
import { Button, Card, Chip, Field, FormError, FormNotice, Input, Loading, Select, Textarea } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { listAnnouncements, sendAnnouncement } from '../../services/admin.js';
import { AUDIENCES } from '../../config/constants.js';
import { fmtDateTime } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';

export default function Announcements() {
  const { account } = useAuth();
  const { data: history, reload } = useAsync(() => listAnnouncements(), []);
  const [title, setTitle] = useState('');
  const [audience, setAudience] = useState(AUDIENCES[0]);
  const [body, setBody] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  const send = async () => {
    if (title.trim().length < 3 || !body.trim()) return setError('Add a title and a message before sending.');
    if (!confirm) return setConfirm(true);
    setBusy(true); setError('');
    try {
      await sendAnnouncement(account.id, { title: title.trim(), body: body.trim(), audience });
      await reload(); // fetch again: the delivered count is filled in by the database after sending
      setNotice(`Sent to ${audience.toLowerCase()}.`);
      setTitle(''); setBody(''); setConfirm(false);
    } catch (e) {
      setError(friendlyError(e));
    }
    setBusy(false);
  };

  return (
    <AdminShell title="Announcements" sub="Send updates to students and mentors. They arrive in everyone’s notifications.">
      <div className="split-main-panel">
        <Card className="col gap-20">
          <div className="col gap-4"><h2 className="h3">New announcement</h2><p className="sm muted">Delivered instantly to the bell icon of everyone in the audience</p></div>
          <Field label="Title"><Input value={title} onChange={(e) => { setTitle(e.target.value); setNotice(''); setConfirm(false); }} placeholder="e.g. New mentors in Tripoli" maxLength={120} /></Field>
          <Field label="Audience"><Select value={audience} onChange={(v) => { setAudience(v); setConfirm(false); }} options={AUDIENCES} /></Field>
          <Field label="Message"><Textarea rows={6} value={body} onChange={(e) => { setBody(e.target.value); setNotice(''); setConfirm(false); }} placeholder="Write your announcement…" maxLength={2000} /></Field>
          <FormError>{error}</FormError>
          <FormNotice>{notice}</FormNotice>
          {confirm && <div className="proposal"><span className="sm fill">Send this to <b>{audience.toLowerCase()}</b>? It can’t be unsent.</span></div>}
          <div className="row gap-12">
            <Button icon="Send" disabled={busy} onClick={send}>{confirm ? 'Yes, send it' : 'Send announcement'}</Button>
            {confirm && <Button variant="outline" onClick={() => setConfirm(false)}>Cancel</Button>}
          </div>
          <div className="preview"><span className="xs semibold text-teal">PREVIEW</span><span className="semibold text-deep">{title || 'Untitled'}</span><span className="sm muted pre-line">{body || 'Your message'}</span></div>
        </Card>

        <Card className="col gap-18 panel">
          <h2 className="h3">Sent announcements</h2>
          {!history ? <Loading /> : history.length === 0 ? <p className="sm muted">Nothing sent yet.</p> : history.map((a, i) => (
            <div key={a.id} className="col gap-18">
              {i > 0 && <hr className="hr" />}
              <div className="col gap-6">
                <span className="semibold">{a.title}</span>
                <span className="sm muted clamp-2">{a.body}</span>
                <div className="row gap-10 wrap"><Chip dot>{a.audience}</Chip><span className="xs muted">{fmtDateTime(a.created_at)} · {a.recipients} delivered{a.sender?.full_name ? ` · by ${a.sender.full_name}` : ''}</span></div>
              </div>
            </div>
          ))}
        </Card>
      </div>
    </AdminShell>
  );
}
