import { useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { MentorNav, StudentNav } from '../../components/layout.jsx';
import { ReportDialog } from '../../components/mentorship.jsx';
import { Avatar, Button, Icon, SearchBox } from '../../components/ui.jsx';
import { loadPeople, markRead, sendMessage, useMessages } from '../../data/mentorship.js';
import { fmtChatTime, fmtDay } from '../../lib/time.js';

/* Live chat between students and mentors. role: 'student' | 'mentor'. ?with=<user id> opens a conversation. */
export default function Chat({ role }) {
  const [params, setParams] = useSearchParams();
  const { messages, userId, add } = useMessages();
  const [people, setPeople] = useState({});
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState('');
  const [reporting, setReporting] = useState(false);
  const endRef = useRef(null);
  const withId = params.get('with');

  // One conversation per person, newest first.
  const convos = useMemo(() => {
    const map = new Map();
    for (const m of messages || []) {
      const other = m.sender_id === userId ? m.recipient_id : m.sender_id;
      const c = map.get(other) || { id: other, messages: [], unread: 0 };
      c.messages.push(m);
      if (m.recipient_id === userId && !m.read_at) c.unread += 1;
      map.set(other, c);
    }
    if (withId && withId !== userId && !map.has(withId)) map.set(withId, { id: withId, messages: [], unread: 0 });
    return [...map.values()].sort((a, b) => (b.messages.at(-1)?.created_at || '9').localeCompare(a.messages.at(-1)?.created_at || '9'));
  }, [messages, userId, withId]);

  const ids = convos.map((c) => c.id).join(',');
  useEffect(() => {
    if (ids) loadPeople(ids.split(',')).then((p) => setPeople((prev) => ({ ...prev, ...p }))).catch(() => {});
  }, [ids]);

  const activeId = withId || convos[0]?.id;
  const active = convos.find((c) => c.id === activeId);
  const person = people[activeId] || { id: activeId, name: '…' };

  useEffect(() => {
    endRef.current?.scrollIntoView({ block: 'end' });
    if (active?.unread) markRead(userId, active.id);
  }, [activeId, active?.messages.length]);

  const send = async (e) => {
    e.preventDefault();
    const body = draft.trim();
    if (!body) return;
    setDraft(''); setError('');
    try {
      add(await sendMessage(userId, activeId, body));
    } catch (err) {
      setDraft(body);
      setError(err.message.includes('row-level security') ? `You can message ${person.name} once you have a session request together.` : err.message);
    }
  };

  const visible = convos.filter((c) => (people[c.id]?.name || '').toLowerCase().includes(q.toLowerCase()));
  const Nav = role === 'mentor' ? MentorNav : StudentNav;

  return (
    <>
      <Nav />
      <div className="container page col gap-24">
        <div className="col gap-6"><h1 className="h1">Messages</h1><p className="lead muted">{role === 'mentor' ? 'Chat with your students before and after each session.' : 'Chat with your mentors before and after each session.'}</p></div>
        {messages && convos.length === 0 ? (
          <div className="card empty"><Icon name="MessageCircle" size={28} color="var(--gray)" /><h3 className="h3">No conversations yet</h3><p className="muted">{role === 'mentor' ? 'When a student writes to you, the conversation shows here.' : 'Open a mentor’s profile and tap Message to start a conversation.'}</p>{role === 'student' && <Button variant="outline" to="/mentors">Find a mentor</Button>}</div>
        ) : (
          <div className="chat card">
            <div className="chat-list">
              <div style={{ padding: 20 }}><SearchBox value={q} onChange={setQ} placeholder="Search conversations" /></div>
              {visible.map((c) => {
                const p = people[c.id] || { name: '…' };
                const last = c.messages.at(-1);
                return (
                  <button key={c.id} className={`conv ${c.id === activeId ? 'active' : ''}`} onClick={() => setParams({ with: c.id })}>
                    <Avatar name={p.name} src={p.photo} size={48} />
                    <div className="col fill min0"><span className="semibold truncate">{p.name}</span><span className={`sm truncate ${c.unread ? 'unread-text' : 'muted'}`}>{last ? `${last.sender_id === userId ? 'You: ' : ''}${last.body}` : 'New conversation'}</span></div>
                    <div className="col end gap-6"><span className="xs muted">{last ? fmtChatTime(last.created_at) : ''}</span>{c.unread ? <span className="unread-dot" /> : <span style={{ width: 10, height: 10 }} />}</div>
                  </button>
                );
              })}
            </div>
            {active && (
              <div className="chat-panel">
                <div className="chat-head">
                  <Avatar name={person.name} src={person.photo} size={44} />
                  <div className="col fill min0"><span className="h3 truncate">{person.name}</span><span className="xs muted">{person.isMentor ? 'Verified mentor' : 'Student'}</span></div>
                  {person.isMentor && <Button variant="outline" size="sm" to={`/mentors/${person.id}`}>View profile</Button>}
                  <button className="link danger xs" onClick={() => setReporting(true)}>Report</button>
                </div>
                <div className="chat-body">
                  {active.messages.length === 0 && <span className="date-pill">Say hello to {person.name.split(' ')[0]}</span>}
                  {active.messages.map((m, i) => {
                    const prev = active.messages[i - 1];
                    const newDay = !prev || fmtDay(prev.created_at) !== fmtDay(m.created_at);
                    return (
                      <div key={m.id} className="col gap-12">
                        {newDay && <span className="date-pill">{fmtDay(m.created_at)}</span>}
                        <div className={`msg ${m.sender_id === userId ? 'mine' : ''}`}><p className="bubble">{m.body}</p><span className="xs muted">{fmtChatTime(m.created_at)}{m.sender_id === userId && m.read_at ? ' · Seen' : ''}</span></div>
                      </div>
                    );
                  })}
                  <div ref={endRef} />
                </div>
                {error && <p className="error" role="alert" style={{ padding: '0 28px' }}>{error}</p>}
                <form className="chat-input" onSubmit={send}>
                  <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" aria-label="Message" maxLength={4000} />
                  <button type="submit" className="send-btn" aria-label="Send" disabled={!draft.trim()}><Icon name="Send" size={18} /></button>
                </form>
              </div>
            )}
          </div>
        )}
      </div>
      {reporting && <ReportDialog reporterId={userId} person={person} onClose={() => setReporting(false)} />}
    </>
  );
}
