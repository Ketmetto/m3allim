import { Link } from 'react-router-dom';
import { StudentNav } from '../../components/layout.jsx';
import { Avatar, Button, Card, Icon, Stat, StatusChip } from '../../components/ui.jsx';
import { mentorById, mentors, student, studentSessions } from '../../data/mock.js';
import { useProfile } from '../../lib/profile.js';

const upcoming = studentSessions.filter((s) => s.status === 'Confirmed');
const requests = [
  { mentor: 'layla', text: 'Portfolio review · sent today', status: 'Pending' },
  { mentor: 'jad', text: 'Architecture portfolio · sent 2 days ago', status: 'Accepted' },
  { mentor: 'mira', text: 'Study planning · sent last week', status: 'Declined' },
];
const saved = ['rami', 'mira', 'jad'].map(mentorById);

const greeting = () => {
  const hour = new Date().getHours();
  return hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
};

export default function StudentDashboard() {
  const me = useProfile({ name: student.name });
  return (
    <>
      <StudentNav />
      <div className="container page col gap-28">
        <div className="row between">
          <div className="col gap-6"><h1 className="h1">{greeting()}{me ? `, ${me.name.split(' ')[0]}` : ''}</h1><p className="lead muted">Here’s what’s happening with your mentorship today.</p></div>
          <Button to="/mentors" icon="Search">Find a mentor</Button>
        </div>

        <div className="grid-4">
          <Stat icon="Calendar" label="Upcoming sessions" value="2" sub="Next: tomorrow at 18:00" />
          <Stat icon="Clock" label="Pending requests" value="1" sub="Waiting for Layla Haddad" />
          <Stat icon="Check" label="Sessions completed" value="5" sub="Since September 2026" />
          <Stat icon="Bookmark" label="Saved mentors" value="8" sub="2 available this week" />
        </div>

        <div className="dash-layout">
          <div className="col gap-24">
            <Card className="col gap-20">
              <div className="row between"><h2 className="h2-sm">Upcoming sessions</h2><Link to="/student/sessions" className="link">View all</Link></div>
              {upcoming.map((s, i) => {
                const m = mentorById(s.mentor);
                return (
                  <div key={s.id} className="col gap-20">
                    {i > 0 && <hr className="hr" />}
                    <div className="row gap-16">
                      <Avatar name={m.name} src={m.photo} size={56} />
                      <div className="col gap-4 fill"><span className="h3">{m.name}</span><span className="sm muted">{m.headline} · {s.topic.split(' · ')[0]}</span><span className="row gap-6 sm medium"><Icon name="Calendar" size={14} color="var(--teal)" /> {s.month === 'OCT' ? `October ${s.day}` : ''} · {s.time.replace(' · Video call', '')}</span></div>
                      <StatusChip status={s.status} />
                      <Button variant="outline" size="sm" to="/student/sessions">Details</Button>
                    </div>
                  </div>
                );
              })}
            </Card>

            <Card className="col gap-18">
              <div className="row between"><h2 className="h2-sm">My requests</h2><Link to="/student/sessions" className="link">See all</Link></div>
              {requests.map((r, i) => {
                const m = mentorById(r.mentor);
                return (
                  <div key={r.mentor} className="col gap-18">
                    {i > 0 && <hr className="hr" />}
                    <div className="row gap-12"><Avatar name={m.name} src={m.photo} size={44} /><div className="col fill"><span className="semibold">{m.name}</span><span className="xs muted">{r.text}</span></div><StatusChip status={r.status} /></div>
                  </div>
                );
              })}
            </Card>
          </div>

          <aside className="col gap-20">
            <Card pad={24} className="col gap-18">
              <h2 className="h2-sm">Saved mentors</h2>
              {saved.map((m, i) => (
                <div key={m.id} className="col gap-18">
                  {i > 0 && <hr className="hr" />}
                  <Link to={`/mentors/${m.id}`} className="row gap-12"><Avatar name={m.name} src={m.photo} size={44} /><div className="col fill"><span className="semibold">{m.name}</span><span className="xs muted">{m.headline}</span></div><Icon name="Bookmark" size={18} color="var(--teal)" fill="var(--teal)" /></Link>
                </div>
              ))}
              <Link to="/mentors" className="link">See all 8 saved mentors</Link>
            </Card>

            <Card pad={24} className="col gap-16 rate-card">
              <h2 className="h2-sm">How was your session?</h2>
              <div className="row gap-12"><Avatar name="Rami Mansour" src={mentorById('rami').photo} size={44} /><div className="col"><span className="semibold">Rami Mansour</span><span className="xs muted">Python for data · October 14</span></div></div>
              <span className="rate-stars" aria-hidden="true">★★★★★</span>
              <p className="sm muted">Your feedback helps other students choose the right mentor.</p>
              <Button to="/student/sessions" size="md">Leave a review</Button>
            </Card>

            <Card pad={24} className="col gap-12 explore-card">
              <h2 className="h3 text-deep">Looking for a new direction?</h2>
              <p className="sm muted">Browse {mentors.length * 31} verified mentors across design, engineering, medicine and more.</p>
              <Link to="/mentors" className="link row gap-6">Find a mentor <Icon name="ArrowRight" size={14} /></Link>
            </Card>
          </aside>
        </div>
      </div>
    </>
  );
}
