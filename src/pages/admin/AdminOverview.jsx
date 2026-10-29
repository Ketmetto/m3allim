import { Link } from 'react-router-dom';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, DataTable, Icon, Stat } from '../../components/ui.jsx';
import { recentActivity, weeklySessions } from '../../data/mock.js';

const max = Math.max(...weeklySessions.map(([, v]) => v));
const ATTENTION = [
  { icon: 'BadgeCheck', title: '7 mentor applications', sub: 'Waiting for verification', tone: 'gold', to: '/admin/verification' },
  { icon: 'Flag', title: '4 open reports', sub: '2 marked high priority', tone: 'red', to: '/admin/reports' },
  { icon: 'Users', title: '12 new mentors', sub: 'Joined this week', tone: 'green', to: '/admin/users' },
];

export default function AdminOverview() {
  return (
    <AdminShell title="Overview" sub="Tuesday, October 20, 2026 · Platform activity at a glance" actions={<Button to="/admin/announcements" icon="Megaphone" size="sm">Send announcement</Button>}>
      <div className="grid-4">
        <Stat icon="Users" label="Total users" value="2,418" sub="+126 this month" subKind="good" />
        <Stat icon="BadgeCheck" label="Verified mentors" value="186" sub="7 awaiting review" />
        <Stat icon="Calendar" label="Sessions this month" value="742" sub="+18% vs September" subKind="good" />
        <Stat icon="Flag" label="Open reports" value="4" sub="2 need action today" subKind="bad" />
      </div>

      <div className="split-2-1">
        <Card className="col gap-24">
          <div className="col gap-4"><h2 className="h3">Sessions per week</h2><p className="sm muted">Completed mentorship sessions, last 8 weeks</p></div>
          <div className="bars" role="img" aria-label="Bar chart of weekly sessions, rising from 96 to 204">
            {weeklySessions.map(([label, v], i) => (
              <div key={label} className="bar-col">
                <span className={`xs semibold ${i === weeklySessions.length - 1 ? 'text-teal' : 'muted'}`}>{v}</span>
                <span className={`bar ${i === weeklySessions.length - 1 ? 'last' : ''}`} style={{ height: `${(v / max) * 150}px` }} />
                <span className="xs muted">{label}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card pad={24} className="col gap-18">
          <h2 className="h3">Needs attention</h2>
          {ATTENTION.map((a, i) => (
            <div key={a.title} className="col gap-18">
              {i > 0 && <hr className="hr" />}
              <Link to={a.to} className="row gap-14"><span className={`icon-box tone-${a.tone}`}><Icon name={a.icon} size={18} /></span><div className="col fill"><span className="semibold">{a.title}</span><span className="xs muted">{a.sub}</span></div><Icon name="ArrowRight" size={16} color="var(--gray)" /></Link>
            </div>
          ))}
        </Card>
      </div>

      <Card className="col gap-16">
        <div className="col gap-4"><h2 className="h3">Recent activity</h2><p className="sm muted">Latest moderation actions by the admin team</p></div>
        <DataTable columns={[{ key: 'event', label: 'EVENT' }, { key: 'admin', label: 'ADMIN', width: 180 }, { key: 'when', label: 'WHEN', width: 160 }]} rows={recentActivity} />
      </Card>
    </AdminShell>
  );
}
