import { useState } from 'react';
import { StudentNav } from '../../components/layout.jsx';
import { Avatar, Button, Card, Icon, PageHeading, SearchBox, Select, StatusChip, Stars, Tabs } from '../../components/ui.jsx';
import { mentorById, studentSessions } from '../../data/mock.js';

const TABS = [
  { id: 'all', label: 'All' },
  { id: 'upcoming', label: 'Upcoming' },
  { id: 'pending', label: 'Pending' },
  { id: 'completed', label: 'Completed' },
];
const match = (tab, s) =>
  tab === 'all' || (tab === 'upcoming' && ['Confirmed', 'Accepted'].includes(s.status)) || (tab === 'pending' && s.status === 'Pending') || (tab === 'completed' && s.status === 'Completed');

export default function MySessions() {
  const [tab, setTab] = useState('all');
  const [q, setQ] = useState('');
  const [sort, setSort] = useState('Newest first');
  const [sessions, setSessions] = useState(studentSessions);
  const [rating, setRating] = useState(null); // session id currently being rated

  const counted = TABS.map((t) => ({ ...t, label: `${t.label} (${sessions.filter((s) => match(t.id, s)).length})` }));
  const list = sessions.filter((s) => match(tab, s) && `${mentorById(s.mentor).name} ${s.topic}`.toLowerCase().includes(q.toLowerCase()));
  const sorted = sort === 'Newest first' ? list : [...list].reverse();

  const cancel = (id) => setSessions((all) => all.filter((s) => s.id !== id));
  const rate = (id, stars) => { setSessions((all) => all.map((s) => (s.id === id ? { ...s, rated: stars } : s))); setRating(null); };

  return (
    <>
      <StudentNav />
      <div className="container page col gap-24">
        <PageHeading title="My sessions" sub="Track your requests, upcoming calls and past mentorship."><Button to="/mentors" icon="Search">Find a mentor</Button></PageHeading>
        <Tabs items={counted} active={tab} onChange={setTab} />
        <div className="row gap-12">
          <SearchBox value={q} onChange={setQ} placeholder="Search by mentor or topic" width={360} />
          <Select value={sort} onChange={setSort} options={['Newest first', 'Oldest first']} aria-label="Sort" />
        </div>

        <Card pad={0} className="list">
          {sorted.length === 0 && <div className="center col gap-8" style={{ padding: 48 }}><Icon name="Calendar" size={28} color="var(--gray)" /><h3 className="h3">Nothing here yet</h3><p className="muted">Find a mentor and send your first request.</p></div>}
          {sorted.map((s) => {
            const m = mentorById(s.mentor);
            const active = ['Confirmed', 'Accepted'].includes(s.status);
            return (
              <div key={s.id} className="session-row">
                <div className={`date-block ${active ? 'on' : ''}`}><span className="xs semibold">{s.month}</span><span className="date-day">{s.day}</span></div>
                <Avatar name={m.name} src={m.photo} size={52} />
                <div className="col gap-4 fill">
                  <span className="h3">{m.name}</span>
                  <span className="sm muted">{s.topic}</span>
                  <span className="row gap-6 sm medium"><Icon name="Clock" size={14} color="var(--teal)" /> {s.time}</span>
                  {rating === s.id && (
                    <span className="row gap-4 rate-pick" role="group" aria-label="Rate this mentor">
                      {[1, 2, 3, 4, 5].map((n) => <button key={n} onClick={() => rate(s.id, n)} aria-label={`${n} stars`}>★</button>)}
                    </span>
                  )}
                </div>
                <StatusChip status={s.status} />
                <div className="row gap-8">
                  {active && <><Button variant="outline" size="sm" to="/student/messages">Message</Button>{s.status === 'Confirmed' ? <Button size="sm">Join call</Button> : <Button size="sm" variant="danger-outline" onClick={() => cancel(s.id)}>Cancel</Button>}</>}
                  {s.status === 'Pending' && <Button size="sm" variant="danger-outline" onClick={() => cancel(s.id)}>Cancel request</Button>}
                  {s.status === 'Completed' && (s.rated ? <span className="row gap-8"><Stars value={typeof s.rated === 'number' ? s.rated : 5} size={15} /></span> : <Button size="sm" variant="gold-outline" onClick={() => setRating(s.id)}>Rate mentor</Button>)}
                </div>
              </div>
            );
          })}
        </Card>
        <div className="row between sm"><span className="muted">Showing {sorted.length} of {sessions.length} sessions</span></div>
      </div>
    </>
  );
}
