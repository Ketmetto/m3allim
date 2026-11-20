// System health (super admin only): live checks of each service (timed from this browser), plus database size,
// rows per table, file storage per bucket and account numbers (system_health() in schema.sql).
import { useCallback, useEffect, useState } from 'react';
import { AdminShell } from '../../components/layout';
import { Button, Card, Chip, DataTable, Icon, Loading, Stat, StatusChip } from '../../components/ui';
import { useSettings } from '../../context/SettingsContext.jsx';
import { getSystemHealth, runServiceChecks } from '../../services/superAdmin.js';
import { fmtDateTime } from '../../utils/time.js';
import { fileSize } from '../../utils/format.js';

export default function SystemHealth() {
  const { settings } = useSettings();
  const [checks, setChecks] = useState(null);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState('');
  const [running, setRunning] = useState(false);

  const run = useCallback(async () => {
    setRunning(true); setError('');
    const [c, h] = await Promise.all([runServiceChecks(), getSystemHealth().catch((e) => { setError(e.message); return null; })]);
    setChecks(c);
    setHealth(h);
    setRunning(false);
  }, []);
  useEffect(() => { run(); }, [run]);

  const down = checks?.filter((c) => !c.ok).length || 0;
  const slowest = checks ? Math.max(...checks.map((c) => c.ms)) : 0;

  return (
    <AdminShell title="System health" sub="Live status of the services M3allim depends on" actions={<Button variant="dark" size="sm" icon="RefreshCw" disabled={running} onClick={run}>{running ? 'Checking…' : 'Run checks again'}</Button>}>
      {error && <p className="error">{error}</p>}
      <div className="grid-4">
        <Stat gold icon="Activity" label="Services" value={checks ? (down ? `${down} down` : 'All up') : '…'} sub={checks ? `${checks.length} checked · slowest ${slowest} ms` : 'Checking'} subKind={down ? 'bad' : 'good'} />
        <Stat gold icon="Database" label="Database size" value={health ? fileSize(health.database_bytes) : '…'} sub={health ? `Postgres ${health.postgres_version} · ${health.connections} connections` : ''} />
        <Stat gold icon="HardDrive" label="Files stored" value={health ? fileSize(health.storage.reduce((n, b) => n + Number(b.bytes), 0)) : '…'} sub={health ? `${health.storage.reduce((n, b) => n + Number(b.files), 0)} files` : ''} />
        <Stat gold icon="Users" label="Accounts" value={health?.accounts.total ?? '…'} sub={health ? `${health.accounts.active_7d} active this week · ${health.accounts.banned} banned` : ''} />
      </div>

      <div className="split-main-panel">
        <Card className="col gap-16">
          <div className="col gap-4"><h2 className="h3">Services</h2><p className="sm muted">Each service is called from your browser and timed{checks ? ` · ${fmtDateTime(new Date().toISOString())}` : ''}</p></div>
          {!checks ? <Loading text="Running checks…" /> : checks.map((c) => (
            <div key={c.name} className="col gap-16">
              <hr className="hr" />
              <div className="row gap-14">
                <span className={`icon-box ${c.ok ? '' : 'tone-red'}`}><Icon name={c.icon} size={18} /></span>
                <div className="col fill min0"><span className="medium">{c.name}</span><span className="xs muted truncate">{c.detail}</span></div>
                <span className={`xs semibold ${c.ms > 1500 ? 'text-red' : 'muted'}`}>{c.ms} ms</span>
                <StatusChip status={c.ok ? 'Operational' : 'Down'} />
              </div>
            </div>
          ))}
        </Card>
        <div className="col gap-24 panel">
          <Card pad={24} className={`col gap-12 ${settings.maintenance_mode ? 'maintenance' : ''}`}>
            <div className="row between"><h2 className="h3">Maintenance mode</h2><Chip kind={settings.maintenance_mode ? 'gold' : 'green'}>{settings.maintenance_mode ? 'On' : 'Off'}</Chip></div>
            <p className="sm muted">{settings.maintenance_mode ? 'Only admins can use the website right now.' : 'The website is open to everyone.'}</p>
            <Button variant="gold-outline" size="sm" icon="Wrench" to="/super/settings">Change in platform settings</Button>
          </Card>
          <Card pad={24} className="col gap-12">
            <h2 className="h3">File storage</h2>
            {!health ? <Loading /> : health.storage.map((b) => (
              <div key={b.bucket} className="row between sm"><span className="row gap-8"><Icon name={b.public ? 'Globe' : 'Lock'} size={14} color="var(--gray)" />{b.bucket === 'mentor-docs' ? 'Mentor documents (private)' : b.bucket === 'avatars' ? 'Profile photos (public)' : b.bucket}</span><span className="medium">{b.files} · {fileSize(Number(b.bytes))}</span></div>
            ))}
          </Card>
        </div>
      </div>

      <Card className="col gap-16">
        <div className="col gap-4"><h2 className="h3">Database tables</h2><p className="sm muted">Rows in each table right now</p></div>
        {!health ? <Loading /> : <DataTable rowKey="name" columns={[{ key: 'name', label: 'TABLE' }, { key: 'rows', label: 'ROWS', width: 120, render: (t) => Number(t.rows).toLocaleString('en-US') }]} rows={health.tables} />}
      </Card>
    </AdminShell>
  );
}
