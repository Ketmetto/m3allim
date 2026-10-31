import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { MentorNav } from '../../components/layout.jsx';
import { SessionItem } from '../../components/mentorship.jsx';
import { Button, Card, Icon, Stat } from '../../components/ui.jsx';
import { getMyMentorProfile, sessionState, useMySessions } from '../../data/mentorship.js';
import { supabase } from '../../lib/supabase.js';
import { fmtWhen } from '../../lib/time.js';

function Section({ title, empty, children, action }) {
  const items = [children].flat().filter(Boolean);
  return (
    <Card pad={0} className="list">
      <div className="row between" style={{ padding: '24px 24px 8px' }}><h2 className="h2-sm">{title}</h2>{action}</div>
      {items.length ? items : <div className="empty"><p className="muted">{empty}</p></div>}
    </Card>
  );
}

/* Approved mentors: answer requests, manage sessions. */
export default function MentorHome() {
  const { sessions, error, reload, userId } = useMySessions('mentor');
  const [profile, setProfile] = useState();
  const [stats, setStats] = useState({});
  useEffect(() => {
    if (!userId) return;
    getMyMentorProfile(userId).then((p) => setProfile(p ?? null));
    supabase.from('mentor_stats').select('*').eq('mentor_id', userId).maybeSingle().then(({ data }) => setStats(data || {}));
  }, [userId, sessions?.length]);

  if (profile === null) return <Navigate to="/mentor/status" replace />;

  const all = sessions || [];
  const by = (st) => all.filter((s) => sessionState(s) === st);
  const pending = by('Pending');
  const upcoming = by('Confirmed');
  const past = by('Completed').reverse();
  const proposals = all.filter((s) => s.proposed_by === 'student' && sessionState(s) === 'Confirmed');
  const item = (s) => <SessionItem key={s.id} s={s} role="mentor" userId={userId} onChanged={reload} />;
  const missingProfile = profile && (!profile.bio || !profile.availability);

  return (
    <>
      <MentorNav />
      <div className="container page col gap-28">
        <div className="col gap-6"><h1 className="h1">Welcome{profile ? `, ${profile.full_name.split(' ')[0]}` : ''}</h1><p className="lead muted">Answer requests and manage your mentorship sessions.</p></div>
        {missingProfile && (
          <div className="proposal"><Icon name="SlidersHorizontal" size={18} color="var(--gold)" /><span className="sm fill">Students are more likely to book you with a bio and your usual availability.</span><Button size="sm" to="/account">Complete my profile</Button></div>
        )}
        {error && <p className="error" role="alert">{error}</p>}
        <div className="grid-4">
          <Stat icon="Clock" label="New requests" value={pending.length} sub={pending.length ? 'Waiting for your answer' : 'All answered'} />
          <Stat icon="Calendar" label="Upcoming sessions" value={upcoming.length} sub={upcoming[0] ? `Next: ${fmtWhen(upcoming[0].starts_at)}` : 'None booked'} />
          <Stat icon="Check" label="Sessions given" value={stats.sessions || 0} sub="Thank you for giving back" />
          <Stat gold icon="TrendingUp" label="Rating" value={stats.reviews ? Number(stats.rating).toFixed(1) : '–'} sub={stats.reviews ? `${stats.reviews} reviews` : 'No reviews yet'} />
        </div>
        {!sessions ? <p className="muted">Loading…</p> : (
          <>
            <Section title={`New requests (${pending.length})`} empty="No new requests. Students find you on Find a mentor.">{pending.map(item)}</Section>
            {proposals.length > 0 && <Section title="New times proposed by students">{proposals.map(item)}</Section>}
            <Section title="Upcoming sessions" empty="Accepted sessions show here, with the video call link." action={<Link to="/mentor/messages" className="link">Messages</Link>}>{upcoming.filter((s) => !proposals.includes(s)).map(item)}</Section>
            <Section title="Past sessions" empty="Completed sessions and ratings show here.">{past.slice(0, 10).map(item)}</Section>
          </>
        )}
      </div>
    </>
  );
}
