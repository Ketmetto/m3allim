// Admin home: live numbers from the database (admin_stats), what needs attention, and recent admin actions.
import { Link } from 'react-router-dom';
import { AdminShell } from '../../components/layout';
import { Button, Card, DataTable, Icon, Loading, Stat } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { useLive } from '../../context/LiveContext.jsx';
import { getAdminStats, listAuditLog } from '../../services/admin.js';
import { fmtDateTime } from '../../utils/time.js';

export default function AdminOverview() {
  const { waiting } = useLive();
  const { data: stats, error } = useAsync(() => getAdminStats(), [waiting.applications, waiting.reports, waiting.tickets]);
  const { data: log } = useAsync(() => listAuditLog(6), []);
  const weekly = stats?.weekly || [];
  const max = Math.max(1, ...weekly.map((w) => w.sessions));
  const attention = [
    { icon: 'BadgeCheck', title: `${waiting.applications} mentor ${waiting.applications === 1 ? 'application' : 'applications'}`, sub: 'Waiting for verification', tone: 'gold', to: '/admin/verification' },
    { icon: 'Flag', title: `${waiting.reports} open ${waiting.reports === 1 ? 'report' : 'reports'}`, sub: 'From students and mentors', tone: 'red', to: '/admin/reports' },
    { icon: 'LifeBuoy', title: `${waiting.tickets} support ${waiting.tickets === 1 ? 'request' : 'requests'}`, sub: 'Waiting for a reply', tone: 'green', to: '/admin/support' },
  ];

  return (
    <AdminShell title="Overview" sub="Platform activity at a glance" actions={<Button to="/admin/announcements" icon="Megaphone" size="sm">Send announcement</Button>}>
      {error && <p className="error">{error}</p>}
      {!stats ? <Loading /> : (
        <>
          <div className="grid-4">
            <Stat icon="Users" label="Students" value={stats.students} sub={`+${stats.new_users_7d} new accounts this week`} subKind={stats.new_users_7d ? 'good' : undefined} />
            <Stat icon="BadgeCheck" label="Verified mentors" value={stats.mentors} sub={`${stats.pending_applications} awaiting review`} />
            <Stat icon="Calendar" label="Upcoming sessions" value={stats.upcoming_sessions} sub={`${stats.pending_requests} requests waiting · ${stats.completed_sessions} held`} />
            <Stat icon="Ban" label="Banned accounts" value={stats.banned} sub={`${stats.open_reports} open reports`} subKind={stats.open_reports ? 'bad' : undefined} />
          </div>
          <div className="split-2-1">
            <Card className="col gap-24">
              <div className="col gap-4"><h2 className="h3">Sessions per week</h2><p className="sm muted">Confirmed sessions, last 8 weeks (including ones scheduled this week)</p></div>
              <div className="bars" role="img" aria-label={`Bar chart of weekly sessions: ${weekly.map((w) => `${w.week} ${w.sessions}`).join(', ')}`}>
                {weekly.map((w, i) => (
                  <div key={w.week} className="bar-col">
                    <span className={`xs semibold ${i === weekly.length - 1 ? 'text-teal' : 'muted'}`}>{w.sessions}</span>
                    <span className={`bar ${i === weekly.length - 1 ? 'last' : ''}`} style={{ height: `${Math.max(4, (w.sessions / max) * 150)}px` }} />
                    <span className="xs muted">{w.week}</span>
                  </div>
                ))}
              </div>
            </Card>
            <Card pad={24} className="col gap-18">
              <h2 className="h3">Needs attention</h2>
              {attention.map((a, i) => (
                <div key={a.to} className="col gap-18">
                  {i > 0 && <hr className="hr" />}
                  <Link to={a.to} className="row gap-14"><span className={`icon-box tone-${a.tone}`}><Icon name={a.icon} size={18} /></span><div className="col fill"><span className="semibold">{a.title}</span><span className="xs muted">{a.sub}</span></div><Icon name="ArrowRight" size={16} color="var(--gray)" /></Link>
                </div>
              ))}
            </Card>
          </div>
        </>
      )}
      <Card className="col gap-16">
        <div className="col gap-4"><h2 className="h3">Recent activity</h2><p className="sm muted">Latest actions by the admin team, recorded by the database</p></div>
        {log?.length ? (
          <DataTable columns={[
            { key: 'action', label: 'ACTION', render: (r) => <span>{r.action}{r.target ? <span className="muted"> · {r.target}</span> : ''}</span> },
            { key: 'actor_name', label: 'BY', width: 180, render: (r) => r.actor_name || r.actor_email || 'System' },
            { key: 'created_at', label: 'WHEN', width: 150, render: (r) => fmtDateTime(r.created_at) },
          ]} rows={log} />
        ) : <p className="sm muted">No admin actions yet.</p>}
      </Card>
    </AdminShell>
  );
}
