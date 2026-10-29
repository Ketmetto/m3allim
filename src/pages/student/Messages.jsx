import { useEffect, useRef, useState } from 'react';
import { StudentNav } from '../../components/layout.jsx';
import { Avatar, Button, Icon, SearchBox } from '../../components/ui.jsx';
import { conversations as seed, mentorById } from '../../data/mock.js';

export default function Messages() {
  const [convos, setConvos] = useState(seed);
  const [activeId, setActiveId] = useState('karim');
  const [q, setQ] = useState('');
  const [draft, setDraft] = useState('');
  const endRef = useRef(null);

  const active = convos.find((c) => c.id === activeId);
  const mentor = mentorById(active.mentor);
  useEffect(() => endRef.current?.scrollIntoView({ block: 'end' }), [active.messages.length, activeId]);

  const open = (id) => { setActiveId(id); setConvos((all) => all.map((c) => (c.id === id ? { ...c, unread: false } : c))); };
  const send = (e) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setConvos((all) => all.map((c) => (c.id === activeId ? { ...c, time: 'Now', messages: [...c.messages, { mine: true, text, time: 'Now' }] } : c)));
    setDraft('');
  };
  const visible = convos.filter((c) => mentorById(c.mentor).name.toLowerCase().includes(q.toLowerCase()));

  return (
    <>
      <StudentNav />
      <div className="container page col gap-24">
        <div className="col gap-6"><h1 className="h1">Messages</h1><p className="lead muted">Chat with your mentors before and after each session.</p></div>
        <div className="chat card">
          <div className="chat-list">
            <div style={{ padding: 20 }}><SearchBox value={q} onChange={setQ} placeholder="Search conversations" /></div>
            {visible.map((c) => {
              const m = mentorById(c.mentor);
              const last = c.messages[c.messages.length - 1];
              return (
                <button key={c.id} className={`conv ${c.id === activeId ? 'active' : ''}`} onClick={() => open(c.id)}>
                  <Avatar name={m.name} src={m.photo} size={48} />
                  <div className="col fill min0"><span className="semibold">{m.name}</span><span className={`sm truncate ${c.unread ? 'unread-text' : 'muted'}`}>{last.text}</span></div>
                  <div className="col end gap-6"><span className="xs muted">{c.time}</span>{c.unread ? <span className="unread-dot" /> : <span style={{ width: 10, height: 10 }} />}</div>
                </button>
              );
            })}
          </div>

          <div className="chat-panel">
            <div className="chat-head">
              <Avatar name={mentor.name} src={mentor.photo} size={44} />
              <div className="col fill"><span className="h3">{mentor.name}</span><span className="row gap-6 xs muted"><span className="online-dot" /> Online · Verified mentor</span></div>
              <Button variant="outline" size="sm" to={`/mentors/${mentor.id}`}>View profile</Button>
            </div>
            <div className="chat-body">
              <span className="date-pill">Today</span>
              {active.id === 'karim' && (
                <div className="notice row gap-14"><Icon name="Video" size={20} color="var(--teal)" /><div className="col fill"><span className="semibold text-deep">Session confirmed</span><span className="sm muted">Wednesday, October 21 · 18:00 – 18:45 · Video call</span></div><Button variant="outline" size="sm" icon="CalendarPlus">Add to calendar</Button></div>
              )}
              {active.messages.map((m, i) => (
                <div key={i} className={`msg ${m.mine ? 'mine' : ''}`}><p className="bubble">{m.text}</p><span className="xs muted">{m.time}</span></div>
              ))}
              <div ref={endRef} />
            </div>
            <form className="chat-input" onSubmit={send}>
              <button type="button" className="icon-circle" aria-label="Attach a file"><Icon name="Paperclip" size={18} /></button>
              <input value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a message…" aria-label="Message" />
              <button type="submit" className="send-btn" aria-label="Send"><Icon name="Send" size={18} /></button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
