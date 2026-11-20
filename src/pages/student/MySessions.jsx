// Manage my schedule: upcoming sessions, open requests, past sessions (to rate), cancelled and declined.
import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { SiteLayout } from '../../components/layout';
import { SessionItem } from '../../components/sessions/SessionItem.jsx';
import { Button, Card, EmptyState, Icon, Loading, PageHeading, SearchBox, Tabs } from '../../components/ui';
import { useMySessions } from '../../hooks/useMySessions.js';
import { sessionState } from '../../services/sessions.js';

const TABS = [
  { id: 'upcoming', label: 'Upcoming', match: (st) => st === 'Confirmed' },
  { id: 'requests', label: 'Requests', match: (st) => st === 'Pending' },
  { id: 'past', label: 'Past', match: (st) => st === 'Completed' },
  { id: 'closed', label: 'Cancelled & declined', match: (st) => st === 'Cancelled' || st === 'Declined' },
];

export default function MySessions() {
  const { state } = useLocation();
  const { sessions, error, reload, userId } = useMySessions('student');
  const [tab, setTab] = useState(state?.tab || 'upcoming');
  const [q, setQ] = useState('');
  const all = sessions || [];
  const current = TABS.find((t) => t.id === tab);
  const newestFirst = tab === 'past' || tab === 'closed';
  const list = all
    .filter((s) => current.match(sessionState(s)) && `${s.mentor?.full_name || ''} ${s.topic}`.toLowerCase().includes(q.toLowerCase()))
    .sort((a, b) => (newestFirst ? b.starts_at.localeCompare(a.starts_at) : a.starts_at.localeCompare(b.starts_at)));
  const needsAnswer = all.filter((s) => s.proposed_by === 'mentor' && ['Pending', 'Confirmed'].includes(sessionState(s))).length;

  return (
    <SiteLayout>
      <PageHeading title="My sessions" sub="Manage your requests, reschedule, join your video calls and rate your mentors."><Button to="/mentors" icon="Search">Find a mentor</Button></PageHeading>
      {needsAnswer > 0 && <div className="proposal"><Icon name="CalendarClock" size={18} color="var(--gold)" /><span className="sm fill">{needsAnswer === 1 ? 'A mentor proposed a new time.' : `${needsAnswer} mentors proposed new times.`} Accept it or keep the current time below.</span></div>}
      <Tabs items={TABS.map((t) => ({ id: t.id, label: `${t.label} (${all.filter((s) => t.match(sessionState(s))).length})` }))} active={tab} onChange={setTab} />
      <SearchBox value={q} onChange={setQ} placeholder="Search by mentor or topic" width={360} />
      {error && <p className="error" role="alert">{error}</p>}
      <Card pad={0} className="list">
        {!sessions ? <Loading /> : list.length === 0 ? (
          <EmptyState icon="Calendar" title="Nothing here yet" text={tab === 'upcoming' || tab === 'requests' ? 'Find a mentor and send your first request.' : 'Sessions will appear here.'}>
            {(tab === 'upcoming' || tab === 'requests') && <Button variant="outline" to="/mentors">Find a mentor</Button>}
          </EmptyState>
        ) : list.map((s) => <SessionItem key={s.id} s={s} role="student" userId={userId} onChanged={reload} />)}
      </Card>
    </SiteLayout>
  );
}
