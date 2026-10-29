import { useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Button, Card, DataTable, Icon, SearchBox, Select } from '../../components/ui.jsx';
import { admins, announcements, auditLog, reports, users } from '../../data/mock.js';
import { downloadCSV } from '../../utils/csv.js';

const DATASETS = [
  { name: 'Users', rows: '2,418 rows', file: 'm3allim-users.csv', data: () => users.map(({ photo, ...u }) => u) },
  { name: 'Sessions', rows: '3,904 rows', file: 'm3allim-sessions.csv', data: () => announcements },
  { name: 'Reports & moderation', rows: '214 rows', file: 'm3allim-reports.csv', data: () => reports },
  { name: 'Audit log', rows: '1,126 rows', file: 'm3allim-audit-log.csv', data: () => auditLog },
];

export default function AuditLog() {
  const [q, setQ] = useState('');
  const [admin, setAdmin] = useState('All admins');
  const [range, setRange] = useState('Last 7 days');
  const names = ['All admins', ...admins.filter((a) => a.status !== 'Invited').map((a) => a.name)];
  const rows = auditLog.filter((l) => (admin === 'All admins' || l.admin === admin) && `${l.action} ${l.target}`.toLowerCase().includes(q.toLowerCase()));

  const cols = [
    { key: 'time', label: 'TIME', width: 120 },
    { key: 'admin', label: 'ADMIN', width: 120 },
    { key: 'action', label: 'ACTION' },
    { key: 'target', label: 'TARGET', width: 110 },
  ];

  return (
    <AdminShell kind="super" title="Audit log & export" sub="Every privileged action on the platform, and your data exports" actions={<Button variant="dark" size="sm" icon="Download" onClick={() => downloadCSV('m3allim-audit-log.csv', auditLog)}>Export audit log</Button>}>
      <div className="row gap-12 wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Search actions or targets" width={300} />
        <Select value={range} onChange={setRange} options={['Last 7 days', 'Last 30 days', 'Last 90 days']} aria-label="Date range" />
        <Select value={admin} onChange={setAdmin} options={names} aria-label="Admin" />
      </div>
      <div className="split-main-panel">
        <Card pad={0} className="table-card">{rows.length ? <DataTable columns={cols} rows={rows} /> : <div className="center muted" style={{ padding: 48 }}>No actions match your filters.</div>}</Card>
        <Card pad={24} className="col gap-16 panel">
          <div className="col gap-4"><h2 className="h3">Export data</h2><p className="sm muted">Download a copy of platform data. Exports are recorded in the audit log.</p></div>
          {DATASETS.map((d) => (
            <div key={d.name} className="col gap-16">
              <hr className="hr" />
              <div className="row gap-12"><span className="icon-box neutral"><Icon name="FileText" size={16} /></span><div className="col fill"><span className="semibold">{d.name}</span><span className="xs muted">{d.rows}</span></div><Button variant="outline" size="sm" icon="Download" onClick={() => downloadCSV(d.file, d.data())}>CSV</Button></div>
            </div>
          ))}
          <Button variant="dark" size="lg" icon="Download" onClick={() => DATASETS.forEach((d) => downloadCSV(d.file, d.data()))}>Export everything</Button>
        </Card>
      </div>
    </AdminShell>
  );
}
