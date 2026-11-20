// Student home: upcoming sessions, open requests, saved mentors, sessions waiting for a rating, latest notifications.
import { Link } from 'react-router-dom';
import { SiteLayout } from '../../components/layout';
import { SessionItem } from '../../components/sessions/SessionItem.jsx';
import { NotificationItem } from '../../components/notifications/NotificationItem.jsx';
import { Avatar, Button, Card, EmptyState, Icon, Loading, Stat } from '../../components/ui';
import { useMySessions } from '../../hooks/useMySessions.js';
import { useFavorites } from '../../hooks/useFavorites.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { useLive } from '../../context/LiveContext.jsx';
import { listMentors } from '../../services/mentors.js';
import { sessionState } from '../../services/sessions.js';
import { fmtWhen } from '../../utils/time.js';
import { firstName } from '../../utils/format.js';

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

export default function StudentDashboard() {
  const { account } = useAuth();
  const { notifications, markRead } = useLive();
  const { sessions, reload, userId } = useMySessions('student');
  const favorites = useFavorites();
  const { data: mentors } = useAsync(() => listMentors(), []);

  const all = sessions || [];
  const by = (st) => all.filter((s) => sessionState(s) === st);
  const upcoming = by('Confirmed');
  const pending = by('Pending');
  const completed = by('Completed');
  const toRate = completed.filter((s) => !s.rating);
  const proposals = all.filter((s) => s.proposed_by === 'mentor' && ['Pending', 'Confirmed'].includes(sessionState(s)));
  const saved = (mentors || []).filter((m) => favorites.ids.has(m.id));
  const next = upcoming[0];
  const item = (s) => <SessionItem key={s.id} s={s} role="student" userId={userId} onChanged={reload} compact />;

  return (
    <SiteLayout className="gap-28">
      <div className="row between wrap gap-16">
        <div className="col gap-6"><h1 className="h1">{greeting()}, {firstName(account.name)}</h1><p className="lead muted">Here’s what’s happening with your mentorship.</p></div>
        <Button to="/mentors" icon="Search">Find a mentor</Button>
      </div>
      {proposals.length > 0 && (
        <div className="proposal"><Icon name="CalendarClock" size={18} color="var(--gold)" /><span className="sm fill">{proposals.length === 1 ? 'A mentor proposed a new time.' : `${proposals.length} mentors proposed new times.`}</span><Button size="sm" to="/student/sessions">Review</Button></div>
      )}
      <div className="grid-4">
        <Stat icon="Calendar" label="Upcoming sessions" value={upcoming.length} sub={next ? `Next: ${fmtWhen(next.starts_at)}` : 'None booked yet'} />
        <Stat icon="Clock" label="Pending requests" value={pending.length} sub={pending.length ? 'Waiting for mentors to reply' : 'No open requests'} />
        <Stat icon="Check" label="Sessions completed" value={completed.length} sub={toRate.length ? `${toRate.length} to rate` : 'Keep learning'} />
        <Stat icon="Bookmark" label="Saved mentors" value={favorites.ids.size} sub={<Link to="/student/saved" className="text-teal">See saved mentors</Link>} />
      </div>
      <div className="dash-layout">
        <div className="col gap-24">
          <Card pad={0} className="list">
            <div className="row between card-head"><h2 className="h2-sm">Upcoming sessions</h2><Link to="/student/sessions" className="link">Manage all</Link></div>
            {!sessions ? <Loading /> : upcoming.length === 0 ? <EmptyState icon="Calendar" text="No confirmed sessions yet. When a mentor accepts your request it shows here." /> : upcoming.slice(0, 3).map(item)}
          </Card>
          <Card pad={0} className="list">
            <div className="row between card-head"><h2 className="h2-sm">My requests</h2><Link to="/student/sessions" className="link">See all</Link></div>
            {pending.length === 0 ? <EmptyState icon="Send" text="No pending requests."><Button variant="outline" size="sm" to="/mentors">Request a session</Button></EmptyState> : pending.slice(0, 3).map(item)}
          </Card>
        </div>
        <aside className="col gap-24">
          {toRate.length > 0 && (
            <Card className="col gap-12 maintenance">
              <h2 className="h2-sm">How was your session?</h2>
              <p className="sm muted">Your rating helps other students find great mentors.</p>
              <Button variant="gold-outline" icon="Star" to="/student/sessions" state={{ tab: 'past' }}>Rate {firstName(toRate[0].mentor?.full_name || 'your mentor')}</Button>
            </Card>
          )}
          <Card className="col gap-16">
            <div className="row between"><h2 className="h2-sm">Saved mentors</h2><Link to="/student/saved" className="link">All</Link></div>
            {saved.length === 0 && <p className="sm muted">Tap the bookmark on any mentor to save them here.</p>}
            {saved.slice(0, 4).map((m) => (
              <div key={m.id} className="row gap-12">
                <Link to={`/mentors/${m.id}`} className="row gap-12 fill min0"><Avatar name={m.name} src={m.photo} size={44} /><div className="col min0"><span className="semibold truncate">{m.name}</span><span className="xs muted truncate">{m.headline}</span></div></Link>
                <button type="button" className="icon-btn" aria-label={`Remove ${m.name} from saved`} onClick={() => favorites.toggle(m.id)}><Icon name="Bookmark" size={18} color="var(--teal)" fill="var(--teal)" /></button>
              </div>
            ))}
          </Card>
          <Card pad={0} className="list">
            <div className="row between card-head"><h2 className="h2-sm">Notifications</h2><Link to="/notifications" className="link">All</Link></div>
            {notifications.length === 0 ? <EmptyState icon="BellOff" text="You’re all caught up." /> : (
              <div className="notif-list">{notifications.slice(0, 4).map((n) => <NotificationItem key={n.id} n={n} onOpen={() => markRead(n.id)} />)}</div>
            )}
          </Card>
        </aside>
      </div>
    </SiteLayout>
  );
}
