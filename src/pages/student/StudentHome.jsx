import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { StudentNav } from '../../components/layout.jsx';
import { SessionItem } from '../../components/mentorship.jsx';
import { Avatar, Button, Card, Icon, Stat } from '../../components/ui.jsx';
import { listMentors, sessionState, useFavorites, useMySessions } from '../../data/mentorship.js';
import { useProfile } from '../../lib/profile.js';
import { fmtWhen } from '../../lib/time.js';

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

/* Student dashboard with real sessions, requests and saved mentors. */
export default function StudentHome() {
  const me = useProfile();
  const { sessions, reload, userId } = useMySessions('student');
  const favorites = useFavorites();
  const [mentors, setMentors] = useState([]);
  useEffect(() => { listMentors().then(setMentors).catch(() => {}); }, []);

  const all = sessions || [];
  const by = (st) => all.filter((s) => sessionState(s) === st);
  const upcoming = by('Confirmed');
  const pending = by('Pending');
  const completed = by('Completed');
  const toRate = completed.filter((s) => !s.rating);
  const saved = mentors.filter((m) => favorites.ids.has(m.id));
  const next = upcoming[0];

  return (
    <>
      <StudentNav />
      <div className="container page col gap-28">
        <div className="row between wrap gap-16">
          <div className="col gap-6"><h1 className="h1">{greeting()}{me ? `, ${me.name.split(' ')[0]}` : ''}</h1><p className="lead muted">Here’s what’s happening with your mentorship.</p></div>
          <Button to="/mentors" icon="Search">Find a mentor</Button>
        </div>
        <div className="grid-4">
          <Stat icon="Calendar" label="Upcoming sessions" value={upcoming.length} sub={next ? `Next: ${fmtWhen(next.starts_at)}` : 'None booked yet'} />
          <Stat icon="Clock" label="Pending requests" value={pending.length} sub={pending.length ? 'Waiting for mentors to reply' : 'No open requests'} />
          <Stat icon="Check" label="Sessions completed" value={completed.length} sub={toRate.length ? `${toRate.length} to rate` : 'Keep learning'} />
          <Stat icon="Bookmark" label="Saved mentors" value={favorites.ids.size} sub={<Link to="/mentors" className="text-teal">Browse mentors</Link>} />
        </div>
        <div className="dash-layout">
          <div className="col gap-24">
            <Card pad={0} className="list">
              <div className="row between" style={{ padding: '24px 24px 8px' }}><h2 className="h2-sm">Upcoming sessions</h2><Link to="/student/sessions" className="link">Manage all</Link></div>
              {!sessions ? <div className="empty muted">Loading…</div> : upcoming.length === 0 ? <div className="empty"><p className="muted">No confirmed sessions yet. When a mentor accepts your request it shows here.</p></div> : upcoming.slice(0, 3).map((s) => <SessionItem key={s.id} s={s} role="student" userId={userId} onChanged={reload} compact />)}
            </Card>
            <Card pad={0} className="list">
              <div className="row between" style={{ padding: '24px 24px 8px' }}><h2 className="h2-sm">My requests</h2><Link to="/student/sessions" className="link">See all</Link></div>
              {pending.length === 0 ? <div className="empty"><p className="muted">No pending requests.</p><Button variant="outline" size="sm" to="/mentors">Request a session</Button></div> : pending.slice(0, 3).map((s) => <SessionItem key={s.id} s={s} role="student" userId={userId} onChanged={reload} compact />)}
            </Card>
          </div>
          <aside className="col gap-24">
            <Card className="col gap-16">
              <h2 className="h2-sm">Saved mentors</h2>
              {saved.length === 0 && <p className="sm muted">Tap the bookmark on any mentor to save them here.</p>}
              {saved.map((m) => (
                <div key={m.id} className="row gap-12">
                  <Link to={`/mentors/${m.id}`} className="row gap-12 fill min0"><Avatar name={m.name} src={m.photo} size={44} /><div className="col min0"><span className="semibold truncate">{m.name}</span><span className="xs muted truncate">{m.headline}</span></div></Link>
                  <button className="icon-btn" aria-label={`Remove ${m.name} from saved`} onClick={() => favorites.toggle(m.id)}><Icon name="Bookmark" size={18} color="var(--teal)" fill="var(--teal)" /></button>
                </div>
              ))}
            </Card>
            {toRate.length > 0 && (
              <Card className="col gap-12 maintenance">
                <h2 className="h2-sm">How was your session?</h2>
                <p className="sm muted">Your rating helps other students find great mentors.</p>
                <Button variant="gold-outline" to="/student/sessions">Rate {toRate[0].mentor.full_name.split(' ')[0]}</Button>
              </Card>
            )}
          </aside>
        </div>
      </div>
    </>
  );
}
