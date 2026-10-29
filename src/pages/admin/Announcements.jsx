import { useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, Chip, Field, Icon, Input, Select, Textarea, Toggle } from '../../components/ui.jsx';
import { announcements as seed } from '../../data/mock.js';

export default function Announcements() {
  const [history, setHistory] = useState(seed);
  const [title, setTitle] = useState('New mentors in Tripoli');
  const [audience, setAudience] = useState('All users');
  const [channel, setChannel] = useState('In-app + email');
  const [message, setMessage] = useState('Twelve new verified mentors have joined from the north. Book a free session today.');
  const [now, setNow] = useState(true);
  const [error, setError] = useState('');
  const [sent, setSent] = useState(false);

  const send = () => {
    if (!title.trim() || !message.trim()) return setError('Add a title and a message before sending.');
    setError('');
    setHistory([{ id: Date.now(), title, audience, date: 'Just now', delivered: now ? 'Sending…' : 'Scheduled' }, ...history]);
    setSent(true);
  };

  return (
    <AdminShell title="Announcements" sub="Send updates to students and mentors">
      <div className="split-main-panel">
        <Card className="col gap-20">
          <div className="col gap-4"><h2 className="h3">New announcement</h2><p className="sm muted">Delivered in-app and by email</p></div>
          <Field label="Title"><Input value={title} onChange={(e) => { setTitle(e.target.value); setSent(false); }} placeholder="e.g. New mentors in Tripoli" /></Field>
          <div className="row gap-16">
            <div className="fill"><Field label="Audience"><Select value={audience} onChange={setAudience} options={['All users', 'Students', 'Mentors']} /></Field></div>
            <div className="fill"><Field label="Channel"><Select value={channel} onChange={setChannel} options={['In-app + email', 'In-app only', 'Email only']} /></Field></div>
          </div>
          <Field label="Message"><Textarea rows={6} value={message} onChange={(e) => { setMessage(e.target.value); setSent(false); }} placeholder="Write your announcement…" /></Field>
          <div className="row gap-12"><Toggle on={now} onChange={setNow} label="Send immediately" /><span className="medium">Send immediately</span></div>
          {error && <p className="error" role="alert">{error}</p>}
          {sent && <p className="toast" role="status"><Icon name="Check" size={16} /> Announcement queued for {audience.toLowerCase()}.</p>}
          <div className="row gap-12"><Button icon="Send" onClick={send}>{now ? 'Send announcement' : 'Schedule announcement'}</Button><Button variant="ghost-border">Save draft</Button></div>
          <div className="preview"><span className="xs semibold text-teal">PREVIEW</span><span className="semibold text-deep">{title || 'Untitled'}</span><span className="sm muted">{message}</span></div>
        </Card>

        <Card className="col gap-18 panel">
          <h2 className="h3">Recent announcements</h2>
          {history.map((a, i) => (
            <div key={a.id} className="col gap-18">
              {i > 0 && <hr className="hr" />}
              <div className="col gap-6"><span className="semibold">{a.title}</span><div className="row gap-10 wrap"><Chip dot>{a.audience}</Chip><span className="xs muted">{a.date} · {a.delivered}</span></div></div>
            </div>
          ))}
        </Card>
      </div>
    </AdminShell>
  );
}
