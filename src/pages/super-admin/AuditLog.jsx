// Audit log & export (super admin only). The log is written by the database itself whenever an admin approves
// or declines a mentor, handles a report, bans or unbans, sends an announcement, manages admins or changes settings.
import { useState } from 'react';
import { AdminShell } from '../../components/layout';
import { Button, Card, DataTable, FormError, Icon, Loading, SearchBox, Select } from '../../components/ui';
import { useAsync } from '../../hooks/useAsync.js';
import { EXPORTS, listAuditLog } from '../../services/admin.js';
import { downloadCSV } from '../../utils/csv.js';
import { fmtDateTime } from '../../utils/time.js';
import { friendlyError } from '../../utils/format.js';

const RANGES = { 'Last 7 days': 7, 'Last 30 days': 30, 'Last 90 days': 90, 'All time': null };

export default function AuditLog() {
  const { data: log, error: loadError } = useAsync(() => listAuditLog(), []);
  const [q, setQ] = useState('');
  const [admin, setAdmin] = useState('All admins');
  const [range, setRange] = useState('Last 30 days');
  const [busy, setBusy] = useState('');
  const [error, setError] = useState('');

  const all = log || [];
  const names = ['All admins', ...new Set(all.map((l) => l.actor_name || l.actor_email || 'System'))];
  const since = RANGES[range] ? Date.now() - RANGES[range] * 86400000 : 0;
  const rows = all.filter((l) =>
    new Date(l.created_at).getTime() >= since &&
    (admin === 'All admins' || (l.actor_name || l.actor_email || 'System') === admin) &&
    `${l.action} ${l.target || ''}`.toLowerCase().includes(q.toLowerCase()));

  const exportOne = async (d) => {
    setBusy(d.key); setError('');
    try {
      const data = await d.load();
      if (!data.length) setError(`${d.name}: nothing to export yet.`);
      else downloadCSV(d.file, data);
    } catch (e) {
      setError(`${d.name}: ${friendlyError(e)}`);
    }
    setBusy('');
  };

  return (
    <AdminShell title="Audit log & export" sub="Every privileged action on the platform, and downloads of platform data"
      actions={<Button variant="dark" size="sm" icon="Download" disabled={!rows.length} onClick={() => downloadCSV('m3allim-audit-log.csv', rows.map(({ details, ...r }) => ({ ...r, details: details ? JSON.stringify(details) : '' })))}>Export this view</Button>}>
      <div className="row gap-12 wrap">
        <SearchBox value={q} onChange={setQ} placeholder="Search actions or targets" width={300} />
        <Select value={range} onChange={setRange} options={Object.keys(RANGES)} aria-label="Date range" />
        <Select value={admin} onChange={setAdmin} options={names} aria-label="Admin" />
      </div>
      {loadError && <FormError>{loadError}</FormError>}
      <div className="split-main-panel">
        <Card pad={0} className="table-card">
          {!log ? <Loading /> : rows.length ? (
            <DataTable columns={[
              { key: 'created_at', label: 'TIME', width: 120, render: (l) => <span className="xs">{fmtDateTime(l.created_at)}</span> },
              { key: 'actor', label: 'ADMIN', width: 140, render: (l) => <span className="truncate">{l.actor_name || l.actor_email || 'System'}</span> },
              { key: 'action', label: 'ACTION', render: (l) => <span className="col"><span>{l.action}</span>{l.details?.note && <span className="xs muted truncate">“{l.details.note}”</span>}</span> },
              { key: 'target', label: 'TARGET', width: 140, render: (l) => <span className="truncate">{l.target}</span> },
            ]} rows={rows} />
          ) : <div className="empty muted">No actions match your filters.</div>}
        </Card>
        <Card pad={24} className="col gap-16 panel">
          <div className="col gap-4"><h2 className="h3">Export data</h2><p className="sm muted">Download platform data as CSV (opens in Excel or Google Sheets).</p></div>
          {EXPORTS.map((d) => (
            <div key={d.key} className="col gap-16">
              <hr className="hr" />
              <div className="row gap-12"><span className="icon-box neutral"><Icon name="FileText" size={16} /></span><span className="semibold fill">{d.name}</span><Button variant="outline" size="sm" icon="Download" disabled={busy === d.key} onClick={() => exportOne(d)}>CSV</Button></div>
            </div>
          ))}
          <FormError>{error}</FormError>
        </Card>
      </div>
    </AdminShell>
  );
}
