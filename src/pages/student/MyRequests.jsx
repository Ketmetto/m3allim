import { useState } from 'react';
import { StudentNav } from '../../components/layout.jsx';
import { SessionItem } from '../../components/mentorship.jsx';
import { Button, Card, Icon, PageHeading, SearchBox, Tabs } from '../../components/ui.jsx';
import { sessionState, useMySessions } from '../../data/mentorship.js';

const TABS = [
  { id: 'upcoming', label: 'Upcoming', match: (st) => st === 'Confirmed' },
  { id: 'requests', label: 'Requests', match: (st) => st === 'Pending' },
  { id: 'past', label: 'Past', match: (st) => st === 'Completed' },
  { id: 'closed', label: 'Cancelled & declined', match: (st) => st === 'Cancelled' || st === 'Declined' },
];

/* Manage my requests: upcoming sessions, pending requests, past sessions. */
export default function MyRequests() {
  const { sessions, error, reload, userId } = useMySessions('student');
  const [tab, setTab] = useState('upcoming');
  const [q, setQ] = useState('');
  const all = sessions || [];
  const current = TABS.find((t) => t.id === tab);
  const list = all
    .filter((s) => current.match(sessionState(s)) && `${s.mentor.full_name} ${s.topic}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (tab === 'past' || tab === 'closed' ? b.starts_at.localeCompare(a.starts_at) : a.starts_at.localeCompare(b.starts_at)));
  const needsAnswer = all.filter((s) => s.proposed_by === 'mentor' && ['Pending', 'Confirmed'].includes(sessionState(s))).length;

  return (
    <>
      <StudentNav />
      <div className="container page col gap-24">
        <PageHeading title="My sessions" sub="Manage your requests, reschedule, and join your video calls."><Button to="/mentors" icon="Search">Find a mentor</Button></PageHeading>
        {needsAnswer > 0 && <div className="proposal"><Icon name="Calendar" size={18} color="var(--gold)" /><span className="sm fill">{needsAnswer === 1 ? 'A mentor proposed a new time.' : `${needsAnswer} mentors proposed new times.`} Accept or keep the current time below.</span></div>}
        <Tabs items={TABS.map((t) => ({ id: t.id, label: `${t.label} (${all.filter((s) => t.match(sessionState(s))).length})` }))} active={tab} onChange={setTab} />
        <SearchBox value={q} onChange={setQ} placeholder="Search by mentor or topic" width={360} />
        {error && <p className="error" role="alert">{error}</p>}
        <Card pad={0} className="list">
          {!sessions ? <div className="empty muted">Loading…</div> : list.length === 0 ? (
            <div className="empty"><Icon name="Calendar" size={28} color="var(--gray)" /><h3 className="h3">Nothing here yet</h3><p className="muted">{tab === 'upcoming' || tab === 'requests' ? 'Find a mentor and send your first request.' : 'Sessions will appear here.'}</p>{(tab === 'upcoming' || tab === 'requests') && <Button variant="outline" to="/mentors">Find a mentor</Button>}</div>
          ) : list.map((s) => <SessionItem key={s.id} s={s} role="student" userId={userId} onChanged={reload} />)}
        </Card>
      </div>
    </>
  );
}
