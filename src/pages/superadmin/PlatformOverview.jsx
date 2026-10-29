import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, Chip, DataTable, Stat, Toggle } from '../../components/ui.jsx';
import { auditLog, services } from '../../data/mock.js';

export default function PlatformOverview() {
  const [maintenance, setMaintenance] = useState(false);
  const days = Array.from({ length: 30 }, (_, i) => i);
  return (
    <AdminShell kind="super" title="Platform overview" sub="System health and privileged activity across M3allim" actions={<Button to="/super/settings" icon="SlidersHorizontal" variant="dark" size="sm">Platform settings</Button>}>
      <div className="grid-4">
        <Stat gold icon="ShieldCheck" label="Admins" value="6" sub="2 active right now" />
        <Stat gold icon="Users" label="Total users" value="2,418" sub="2,232 students · 186 mentors" />
        <Stat gold icon="TrendingUp" label="Uptime · 30 days" value="99.9%" sub="All systems operational" subKind="good" />
        <Stat gold icon="Database" label="Storage used" value="62%" sub="12.4 of 20 GB" />
      </div>

      <div className="split-main-panel">
        <Card className="col gap-20">
          <div className="col gap-4"><h2 className="h3">System health</h2><p className="sm muted">Live status of platform services</p></div>
          <div className="uptime" role="img" aria-label="30 day uptime, one minor incident on October 2">{days.map((d) => <span key={d} className={d === 12 ? 'warn' : ''} />)}</div>
          <p className="xs muted">30 days ago · 1 minor incident on Oct 2 · Today</p>
          {services.map((s) => <div key={s} className="col gap-20"><hr className="hr" /><div className="row between"><span className="medium">{s}</span><Chip kind="green">Operational</Chip></div></div>)}
        </Card>

        <Card pad={24} className="col gap-16 maintenance">
          <div className="row between"><h2 className="h3">Maintenance mode</h2><Toggle gold on={maintenance} onChange={setMaintenance} label="Maintenance mode" /></div>
          <Chip kind={maintenance ? 'gold' : 'green'}>{maintenance ? 'Currently on' : 'Currently off'}</Chip>
          <p className="sm muted">When enabled, only super admins can sign in. Everyone else sees a maintenance page.</p>
          <Link to="/super/settings" className="link-gold">Manage in platform settings →</Link>
        </Card>
      </div>

      <Card className="col gap-16">
        <div className="col gap-4"><h2 className="h3">Recent privileged actions</h2><p className="sm muted">Changes made by super admins and admins</p></div>
        <DataTable columns={[{ key: 'action', label: 'ACTION' }, { key: 'admin', label: 'BY', width: 170 }, { key: 'time', label: 'WHEN', width: 160 }]} rows={auditLog.slice(0, 4)} />
      </Card>
    </AdminShell>
  );
}
