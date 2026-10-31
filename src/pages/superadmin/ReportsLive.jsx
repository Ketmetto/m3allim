import { useEffect, useState } from 'react';
import { AdminShell } from '../../components/layout.jsx';
import { Avatar, Button, Card, DataTable, Field, Person, StatusChip, Tabs, Textarea } from '../../components/ui.jsx';
import { decideReport, listReports } from '../../data/mentorship.js';

const when = (iso) => new Date(iso).toLocaleString('en-GB', { timeZone: 'Asia/Beirut', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

/* Reports filed by students and mentors. */
export default function ReportsLive() {
  const [list, setList] = useState(null);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('Open');
  const [selectedId, setSelectedId] = useState();
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { listReports().then(setList).catch((e) => setError(e.message)); }, []);

  const all = list || [];
  const rows = all.filter((r) => r.status === tab);
  const selected = rows.find((r) => r.id === selectedId) || rows[0];
  const decide = async (status) => {
    setBusy(true); setError('');
    try {
      await decideReport(selected.id, status, note.trim());
      setList(all.map((r) => (r.id === selected.id ? { ...r, status, admin_note: note.trim() } : r)));
      setNote(''); setSelectedId(undefined);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  const cols = [
    { key: 'reported', label: 'REPORTED', render: (r) => <Person name={r.reported?.full_name || 'Deleted account'} sub={r.reported?.role === 'mentor' ? 'Mentor' : 'Student'} src={r.reported?.avatar_url} /> },
    { key: 'reason', label: 'REASON', width: 170 },
    { key: 'created_at', label: 'FILED', width: 130, render: (r) => when(r.created_at) },
  ];

  return (
    <AdminShell kind="super" title="Reports" sub="Reports from students and mentors. The reported person never sees who reported them.">
      <Tabs items={['Open', 'Resolved', 'Dismissed'].map((s) => ({ id: s, label: `${s} (${all.filter((r) => r.status === s).length})` }))} active={tab} onChange={(t) => { setTab(t); setSelectedId(undefined); }} />
      {error && <p className="error" role="alert">{error}</p>}
      <div className="split-main-panel">
        <Card pad={0} className="table-card">
          {!list ? <div className="empty muted">Loading reports…</div> : rows.length ? <DataTable columns={cols} rows={rows} selectedId={selected?.id} onRowClick={(r) => { setSelectedId(r.id); setNote(''); }} /> : <div className="empty muted">No {tab.toLowerCase()} reports.</div>}
        </Card>
        {selected && (
          <Card pad={28} className="col gap-20 panel">
            <div className="row between"><h2 className="h3">Report #{selected.id}</h2><StatusChip status={selected.status} /></div>
            <div className="row gap-14"><Avatar name={selected.reported?.full_name || '?'} src={selected.reported?.avatar_url} size={56} /><div className="col gap-4 min0"><span className="h3">{selected.reported?.full_name}</span><span className="sm muted">{selected.reported?.role === 'mentor' ? 'Mentor' : 'Student'} · reported for “{selected.reason}”</span></div></div>
            <div className="col gap-10 sm">
              <div className="row between gap-12"><span className="muted">Reported by</span><span className="medium">{selected.reporter?.full_name}</span></div>
              <div className="row between gap-12"><span className="muted">Filed</span><span className="medium">{when(selected.created_at)}</span></div>
              {selected.session_id && <div className="row between gap-12"><span className="muted">Session</span><span className="medium">#{selected.session_id}</span></div>}
            </div>
            <div className="col gap-6"><span className="xs muted">What happened</span><p className="sm">{selected.details || 'No details given.'}</p></div>
            {selected.status === 'Open' ? (
              <>
                <Field label="Internal note" hint="Only visible to you."><Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="What you did, e.g. warned the user by email" /></Field>
                <div className="row gap-12"><Button className="fill" icon="Check" disabled={busy} onClick={() => decide('Resolved')}>Mark resolved</Button><Button variant="outline" disabled={busy} onClick={() => decide('Dismissed')}>Dismiss</Button></div>
              </>
            ) : selected.admin_note && <div className="col gap-6"><span className="xs muted">Your note</span><p className="sm">{selected.admin_note}</p></div>}
          </Card>
        )}
      </div>
    </AdminShell>
  );
}
