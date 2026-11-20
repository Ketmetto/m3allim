// Mentor home: accept or decline requests, answer new-time proposals, join upcoming calls, see past sessions.
import { Link } from 'react-router-dom';
import { SiteLayout } from '../../components/layout';
import { SessionItem } from '../../components/sessions/SessionItem.jsx';
import { Button, Card, EmptyState, Icon, Loading, Stat } from '../../components/ui';
import { useMySessions } from '../../hooks/useMySessions.js';
import { useAsync } from '../../hooks/useAsync.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { getMentorStats, getMyMentorProfile } from '../../services/mentors.js';
import { getAvailability } from '../../services/availability.js';
import { sessionState } from '../../services/sessions.js';
import { fmtWhen } from '../../utils/time.js';
import { firstName } from '../../utils/format.js';

function Section({ title, empty, children, action }) {
  const items = [children].flat().filter(Boolean);
  return (
    <Card pad={0} className="list">
      <div className="row between card-head"><h2 className="h2-sm">{title}</h2>{action}</div>
      {items.length ? items : <EmptyState text={empty} />}
    </Card>
  );
}

export default function MentorDashboard() {
  const { account } = useAuth();
  const { sessions, error, reload, userId } = useMySessions('mentor');
  const { data: extra } = useAsync(() => Promise.all([getMyMentorProfile(account.id), getMentorStats(account.id), getAvailability(account.id)]), [account.id, sessions?.length]);
  const [profile, stats = {}, hours = []] = extra || [];

  const all = sessions || [];
  const by = (st) => all.filter((s) => sessionState(s) === st);
  const pending = by('Pending');
  const upcoming = by('Confirmed');
  const past = by('Completed').reverse();
  const proposals = upcoming.filter((s) => s.proposed_by === 'student');
  const item = (s) => <SessionItem key={s.id} s={s} role="mentor" userId={userId} onChanged={reload} />;
  const todo = profile && [
    !profile.bio && { text: 'Write a short bio so students know how you can help.', to: '/mentor/profile', label: 'Build my profile' },
    !hours.length && { text: 'Set your weekly hours. Students can only request times inside them.', to: '/mentor/availability', label: 'Set availability' },
  ].filter(Boolean);

  return (
    <SiteLayout className="gap-28">
      <div className="row between wrap gap-16">
        <div className="col gap-6"><h1 className="h1">Welcome, {firstName(account.name)}</h1><p className="lead muted">Answer requests and manage your mentorship sessions.</p></div>
        <Button variant="outline" icon="Eye" to={`/mentors/${account.id}`}>View my public page</Button>
      </div>
      {todo?.map((t) => (
        <div key={t.to} className="proposal"><Icon name="Sparkles" size={18} color="var(--gold)" /><span className="sm fill">{t.text}</span><Button size="sm" to={t.to}>{t.label}</Button></div>
      ))}
      {error && <p className="error" role="alert">{error}</p>}
      <div className="grid-4">
        <Stat icon="Clock" label="New requests" value={pending.length} sub={pending.length ? 'Waiting for your answer' : 'All answered'} />
        <Stat icon="Calendar" label="Upcoming sessions" value={upcoming.length} sub={upcoming[0] ? `Next: ${fmtWhen(upcoming[0].starts_at)}` : 'None booked'} />
        <Stat icon="Check" label="Sessions given" value={stats?.sessions || 0} sub="Thank you for giving back" />
        <Stat gold icon="Star" label="Rating" value={stats?.reviews ? Number(stats.rating).toFixed(1) : '–'} sub={stats?.reviews ? <Link to="/mentor/reviews" className="text-teal">{stats.reviews} reviews</Link> : 'No reviews yet'} />
      </div>
      {!sessions ? <Loading /> : (
        <>
          <Section title={`New requests (${pending.length})`} empty="No new requests. Students find you on Find a mentor.">{pending.map(item)}</Section>
          {proposals.length > 0 && <Section title="New times proposed by students">{proposals.map(item)}</Section>}
          <Section title="Upcoming sessions" empty="Accepted sessions show here, with the video call button." action={<Link to="/messages" className="link">Messages</Link>}>{upcoming.filter((s) => !proposals.includes(s)).map(item)}</Section>
          <Section title="Past sessions" empty="Completed sessions and their ratings show here." action={<Link to="/mentor/reviews" className="link">All reviews</Link>}>{past.slice(0, 10).map(item)}</Section>
        </>
      )}
    </SiteLayout>
  );
}
